const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  onOnlineStatusChange: (callback) => {
    ipcRenderer.on('online-status-change', (event, isOnline) => callback(isOnline));
  },
  
  getLocale: () => ipcRenderer.invoke('get-locale'),
  
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});

console.log('[Preload] Electron API exposed to renderer');
