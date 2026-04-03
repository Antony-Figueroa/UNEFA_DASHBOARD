const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'UNEFA Dashboard - Gestión Académica',
    webPreferences: {
      preload: fs.existsSync(preloadPath) ? preloadPath : undefined,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    show: false,
    backgroundColor: '#ffffff',
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[Electron] Window ready');
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    console.log('[Electron] Loading production file:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

console.log('[Electron] Starting UNEFA Dashboard');
