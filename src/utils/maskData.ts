/**
 * @file maskData.ts
 * @description Utilidades para enmascarar datos sensibles en tablas
 * Aplica enmascaramiento parcial manteniendo visibles solo los últimos dígitos
 */

/**
 * Enmascara un número de identificación (cédula, RIF, etc.)
 * Muestra solo los últimos 4 dígitos
 * @param value - Valor a enmascarar
 * @returns String enmascarado
 */
export const maskIdentification = (value: string): string => {
  if (!value || value.length < 5) return value;
  const clean = value.replace(/\D/g, '');
  if (clean.length < 5) return value;
  return '***-' + clean.slice(-4);
};

/**
 * Enmascara un número de teléfono
 * Muestra solo los últimos 4 dígitos
 * @param value - Teléfono a enmascarar
 * @returns String enmascarado
 */
export const maskPhone = (value: string): string => {
  if (!value || value.length < 5) return value;
  const clean = value.replace(/\D/g, '');
  if (clean.length < 5) return value;
  return '***-' + clean.slice(-4);
};

/**
 * Enmascara un correo electrónico
 * Muestra las primeras 2 letras, oculta el dominio
 * @param email - Correo a enmascarar
 * @returns String enmascarado
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 2) return email;
  const maskedUser = user.slice(0, 2) + '***';
  const [domainName, tld] = domain.split('.');
  const maskedDomain = domainName.slice(0, 1) + '***.' + tld;
  return `${maskedUser}@${maskedDomain}`;
};

/**
 * Enmascara una dirección fiscal o residencial
 * Muestra solo los últimos 15 caracteres
 * @param address - Dirección a enmascarar
 * @returns String enmascarado
 */
export const maskAddress = (address: string): string => {
  if (!address || address.length <= 20) return address;
  return '*** ' + address.slice(-15);
};

/**
 * Enmascara un RIF (Registro de Identificación Fiscal)
 * Formato: J-12345678-9 → J-***4567-9
 * @param rif - RIF a enmascarar
 * @returns String enmascarado
 */
export const maskRIF = (rif: string): string => {
  if (!rif || rif.length < 10) return rif;
  // Si tiene formato con guiones: J-12345678-9
  if (rif.includes('-')) {
    const parts = rif.split('-');
    if (parts.length === 3) {
      const [prefix, number, suffix] = parts;
      if (number.length >= 4) {
        const maskedNumber = '***' + number.slice(-4);
        return `${prefix}-${maskedNumber}-${suffix}`;
      }
    }
  }
  // Si no tiene formato, enmascarar genéricamente
  return maskIdentification(rif);
};

/**
 * Enmascara datos sensibles según su tipo
 * Función genérica que detecta el tipo de dato y aplica el enmascaramiento apropiado
 * @param value - Valor a enmascarar
 * @param type - Tipo de dato ('identification' | 'phone' | 'email' | 'address' | 'rif')
 * @returns String enmascarado
 */
export const maskSensitiveData = (
  value: string,
  type: 'identification' | 'phone' | 'email' | 'address' | 'rif' = 'identification'
): string => {
  if (!value) return value;
  
  switch (type) {
    case 'rif':
      return maskRIF(value);
    case 'phone':
      return maskPhone(value);
    case 'email':
      return maskEmail(value);
    case 'address':
      return maskAddress(value);
    case 'identification':
    default:
      return maskIdentification(value);
  }
};
