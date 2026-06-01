// ===============================================================================
// Electron Main Process — UNEFA Dashboard Desktop App
// ===============================================================================
// Carga la app React en una ventana nativa.
// En DEV: se conecta al servidor Vite (hot reload).
// En PROD: carga el build estático desde dist/.
// ===============================================================================

import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isDev = !app.isPackaged;

// Puerto para el backend offline
const BACKEND_PORT = process.env.BACKEND_PORT || 3001;
const VITE_DEV_PORT = process.env.VITE_PORT || 5173;

// ─── Esperar a que un servidor esté listo ───
async function waitForServer(url, label = 'servidor', maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`[Electron] ✅ ${label} listo en ${url}`);
        return true;
      }
    } catch {
      // Servidor aún no responde
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.warn(`[Electron] ⚠️ ${label} no respondió después de ${maxRetries}s`);
  return false;
}

// ─── Crear ventana principal ───
async function createMainWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'UNEFA Dashboard — Offline',
    icon: isDev ? undefined : join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Necesario para el preload con ESM
    },
    show: false, // Mostrar cuando esté lista
  });

  // Mostrar cuando el contenido esté listo (evita flash blanco)
  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    // En dev: esperar al servidor Vite, luego cargar
    console.log('[Electron] 🌐 Modo desarrollo — esperando Vite...');
    const viteReady = await waitForServer(
      `http://localhost:${VITE_DEV_PORT}`,
      'Vite Dev Server',
    );

    if (viteReady) {
      win.loadURL(`http://localhost:${VITE_DEV_PORT}`);
      win.webContents.openDevTools({ mode: 'bottom' });
    } else {
      win.loadURL(`http://localhost:${VITE_DEV_PORT}`);
    }
  } else {
    // En prod: cargar el build de Vite
    const distPath = join(__dirname, '../dist/index.html');
    console.log(`[Electron] 📦 Modo producción — cargando ${distPath}`);
    win.loadFile(distPath);
  }

  return win;
}

// ─── Iniciar Backend offline (solo en producción) ───
// En dev, el backend se corre aparte con `cd backend && npm run dev`
function startOfflineBackend() {
  // En producción el backend está en extraResources
  const backendDir = isDev
    ? join(__dirname, '../backend')
    : join(process.resourcesPath, 'backend');
  const serverPath = join(backendDir, 'dist/server-offline.js');
  // En producción, CWD apunta a dist/ donde están pglite.wasm + pglite.data.
  // El bundle es ESM (type:module) y resuelve wasm/data vía import.meta.url.
  const cwd = isDev ? backendDir : join(backendDir, 'dist');

  console.log(`[Electron] 🚀 Iniciando backend offline desde ${serverPath}...`);

  const proc = spawn(process.execPath, [serverPath], {
    cwd,
    env: {
      ...process.env,
      PORT: String(BACKEND_PORT),
      DB_MODE: 'offline',
      NODE_ENV: isDev ? 'development' : 'production',
    },
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  proc.on('error', (err) => {
    console.error('[Electron] ❌ Error al iniciar backend offline:', err.message);
  });

  proc.on('exit', (code) => {
    if (code !== 0) {
      console.warn(`[Electron] ⚠️ Backend offline terminó con código ${code}`);
    }
  });

  return proc;
}

// ─── App lifecycle ───
app.whenReady().then(async () => {
  console.log('[Electron] 🖥️  Iniciando UNEFA Dashboard Desktop...');
  console.log(`[Electron] 🔧 Modo: ${isDev ? 'desarrollo' : 'producción'}`);

  // En producción: iniciar backend offline
  let backendProc = null;
  if (!isDev) {
    backendProc = startOfflineBackend();
    // Esperar a que el backend esté listo
    await waitForServer(
      `http://localhost:${BACKEND_PORT}/api/health`,
      'Backend Offline',
      20,
    );
  } else {
    console.log('[Electron] 💡 En dev, asegurate de correr el backend con: cd backend && npm run dev');
  }

  // Crear ventana
  await createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Cleanup si es necesario
  console.log('[Electron] 👋 Cerrando aplicación...');
});
