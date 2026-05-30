// ===============================================================================
// Electron Preload Script — UNEFA Dashboard Desktop
// ===============================================================================
// Expone APIs seguras de Node.js al renderer (React) mediante contextBridge.
// Esto permite que el frontend acceda a funcionalidades nativas sin
// comprometer la seguridad (contextIsolation = true).
// ===============================================================================

import { contextBridge } from 'electron';

// Información del entorno
contextBridge.exposeInMainWorld('electronAPI', {
  /** Indica si la app corre dentro de Electron */
  isElectron: true,

  /** Plataforma del sistema operativo */
  platform: process.platform,

  /** Versión de la aplicación */
  appVersion: process.env.npm_package_version || '2.0.2',

  /** Versión de Electron */
  electronVersion: process.versions.electron,
});
