import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-fallback-key-32-chars-long-!!!'; // Debe ser de 32 bytes
const IV_LENGTH = 16; // Para AES 256 CBC

/**
 * Encripta un texto usando AES-256-CBC
 */
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Desencripta un texto usando AES-256-CBC
 */
export const decrypt = (text: string): string => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

/**
 * Genera una contraseña segura aleatoria.
 * - Longitud: 14 caracteres (mínimo 12 requerido)
 * - Incluye: Mayúsculas, minúsculas, números y caracteres especiales
 */
export const generateSecurePassword = (): string => {
  const length = 14;
  const charset = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
  };
  
  const allChars = Object.values(charset).join('');
  const password = [];
  
  // Asegurar al menos dos de cada tipo para mayor complejidad inicial
  password.push(charset.upper[crypto.randomInt(charset.upper.length)]);
  password.push(charset.upper[crypto.randomInt(charset.upper.length)]);
  password.push(charset.lower[crypto.randomInt(charset.lower.length)]);
  password.push(charset.lower[crypto.randomInt(charset.lower.length)]);
  password.push(charset.numbers[crypto.randomInt(charset.numbers.length)]);
  password.push(charset.numbers[crypto.randomInt(charset.numbers.length)]);
  password.push(charset.symbols[crypto.randomInt(charset.symbols.length)]);
  password.push(charset.symbols[crypto.randomInt(charset.symbols.length)]);
  
  // Rellenar el resto hasta alcanzar la longitud deseada
  while (password.length < length) {
    password.push(allChars[crypto.randomInt(allChars.length)]);
  }
  
  // Mezclar la contraseña usando Fisher-Yates shuffle con crypto.randomInt
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }
  
  return password.join('');
};

/**
 * Lista de contraseñas comunes (ejemplo básico, en producción usar una base de datos o archivo extenso)
 */
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'admin123', 'unefa2024', 'unefa2025', 'bienvenido', 'contraseña',
  '12345', '1234567', 'password123', 'admin', 'user123', 'welcome'
];

/**
 * Verifica si la contraseña es demasiado común o predecible
 */
export const isCommonPassword = (password: string): boolean => {
  const normalized = password.toLowerCase().trim();
  return COMMON_PASSWORDS.includes(normalized);
};

/**
 * Validaciones de contraseña robustas:
 * - Mínimo 12 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 * - Al menos un carácter especial
 * - No estar en la lista de contraseñas comunes
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string; strength: number } => {
  const results = {
    length: password.length >= 12,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]/.test(password)
  };
  
  const strength = Object.values(results).filter(Boolean).length;
  
  if (!results.length) return { isValid: false, message: 'La contraseña debe tener al menos 12 caracteres', strength };
  if (!results.upper) return { isValid: false, message: 'Debe incluir al menos una mayúscula', strength };
  if (!results.lower) return { isValid: false, message: 'Debe incluir al menos una minúscula', strength };
  if (!results.number) return { isValid: false, message: 'Debe incluir al menos un número', strength };
  if (!results.special) return { isValid: false, message: 'Debe incluir al menos un carácter especial', strength };
  
  if (isCommonPassword(password)) {
    return { isValid: false, message: 'La contraseña es demasiado común y fácil de adivinar', strength };
  }
  
  return { isValid: true, strength };
};
