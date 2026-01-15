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
