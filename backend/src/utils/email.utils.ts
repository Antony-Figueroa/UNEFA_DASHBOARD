/**
 * Servicio para envío de correos electrónicos.
 * En una implementación real, esto usaría nodemailer, SendGrid, etc.
 * Por ahora, simularemos el envío y loguearemos la información.
 */
export const sendUserCreationEmail = async (email: string, name: string, tempPass: string) => {
  console.log(`
    -----------------------------------------
    SIMULACIÓN DE ENVÍO DE EMAIL
    Para: ${email}
    Asunto: Bienvenido al Sistema de Gestión UNEFA
    
    Hola ${name},
    Se ha creado tu cuenta en el panel de control.
    
    Tus credenciales temporales son:
    Usuario: (Tu número de cédula)
    Contraseña: ${tempPass}
    
    Por favor, inicia sesión y cambia tu contraseña inmediatamente.
    -----------------------------------------
  `);
  
  // Aquí iría la lógica real de nodemailer
  return Promise.resolve(true);
};
