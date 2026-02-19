import crypto from 'crypto';
import { getConfig } from '../services/config.service.js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-fallback-key-32-chars-long-!!!';
const IV_LENGTH = 16;

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string): string => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const generateSecurePassword = async (): Promise<string> => {
  const config = await getConfig();
  const length = config?.USER_LENGTH || 12;
  
  const charset = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
  };
  
  const allChars = Object.values(charset).join('');
  const password = [];
  
  const numUpper = config?.USER_NUM_UPPERCASE || 1;
  const numLower = config?.USER_NUM_LOWERCASE || 1;
  const numNumbers = config?.USER_NUM_NUMBERS || 1;
  const numSpecial = config?.USER_NUM_SPECIAL_CHARACTERS || 1;
  
  for (let i = 0; i < numUpper; i++) {
    password.push(charset.upper[crypto.randomInt(charset.upper.length)]);
  }
  for (let i = 0; i < numLower; i++) {
    password.push(charset.lower[crypto.randomInt(charset.lower.length)]);
  }
  for (let i = 0; i < numNumbers; i++) {
    password.push(charset.numbers[crypto.randomInt(charset.numbers.length)]);
  }
  for (let i = 0; i < numSpecial; i++) {
    password.push(charset.symbols[crypto.randomInt(charset.symbols.length)]);
  }
  
  while (password.length < length) {
    password.push(allChars[crypto.randomInt(allChars.length)]);
  }
  
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }
  
  return password.join('');
};

const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'admin123', 'unefa2024', 'unefa2025', 'bienvenido', 'contraseña',
  '12345', '1234567', 'password123', 'admin', 'user123', 'welcome'
];

export const isCommonPassword = (password: string): boolean => {
  const normalized = password.toLowerCase().trim();
  return COMMON_PASSWORDS.includes(normalized);
};

export interface PasswordValidationConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  minUppercase: number;
  minLowercase: number;
  minNumbers: number;
  minSpecial: number;
}

export const validatePassword = async (
  password: string, 
  config?: PasswordValidationConfig
): Promise<{ isValid: boolean; message?: string; strength: number }> => {
  let validationConfig: PasswordValidationConfig;
  
  if (config) {
    validationConfig = config;
  } else {
    const dbConfig = await getConfig();
    validationConfig = {
      minLength: dbConfig?.USER_LENGTH || 12,
      requireUppercase: dbConfig?.USER_UPPERCASE === 1,
      requireLowercase: dbConfig?.USER_LOWERCASE === 1,
      requireNumbers: dbConfig?.USER_NUMBERS === 1,
      requireSpecial: dbConfig?.USER_SPECIAL_CHARACTERS === 1,
      minUppercase: dbConfig?.USER_NUM_UPPERCASE || 1,
      minLowercase: dbConfig?.USER_NUM_LOWERCASE || 1,
      minNumbers: dbConfig?.USER_NUM_NUMBERS || 1,
      minSpecial: dbConfig?.USER_NUM_SPECIAL_CHARACTERS || 1
    };
  }
  
  const upperCount = (password.match(/[A-Z]/g) || []).length;
  const lowerCount = (password.match(/[a-z]/g) || []).length;
  const numberCount = (password.match(/[0-9]/g) || []).length;
  const specialCount = (password.match(/[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]/g) || []).length;
  
  const results = {
    length: password.length >= validationConfig.minLength,
    upper: !validationConfig.requireUppercase || upperCount >= validationConfig.minUppercase,
    lower: !validationConfig.requireLowercase || lowerCount >= validationConfig.minLowercase,
    number: !validationConfig.requireNumbers || numberCount >= validationConfig.minNumbers,
    special: !validationConfig.requireSpecial || specialCount >= validationConfig.minSpecial
  };
  
  const strength = Object.values(results).filter(Boolean).length;
  
  if (!results.length) {
    return { 
      isValid: false, 
      message: `La contraseña debe tener al menos ${validationConfig.minLength} caracteres`, 
      strength 
    };
  }
  if (!results.upper) {
    return { 
      isValid: false, 
      message: `Debe incluir al menos ${validationConfig.minUppercase} mayúscula(s)`, 
      strength 
    };
  }
  if (!results.lower) {
    return { 
      isValid: false, 
      message: `Debe incluir al menos ${validationConfig.minLowercase} minúscula(s)`, 
      strength 
    };
  }
  if (!results.number) {
    return { 
      isValid: false, 
      message: `Debe incluir al menos ${validationConfig.minNumbers} número(s)`, 
      strength 
    };
  }
  if (!results.special) {
    return { 
      isValid: false, 
      message: `Debe incluir al menos ${validationConfig.minSpecial} carácter(es) especial(es)`, 
      strength 
    };
  }
  
  if (isCommonPassword(password)) {
    return { isValid: false, message: 'La contraseña es demasiado común y fácil de adivinar', strength };
  }
  
  return { isValid: true, strength };
};
