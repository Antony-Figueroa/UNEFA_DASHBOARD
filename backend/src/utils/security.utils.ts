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
 * Genera un sufijo aleatorio de 4 dígitos para la contraseña temporal.
 */
export const generateRandom4Digits = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Validaciones de contraseña:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos un número
 */
export const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasNumber;
};
