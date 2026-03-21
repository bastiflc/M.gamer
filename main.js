const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let musicWindow;
let currentMusicUrl = ""; // Para evitar reinicios de buffer

// --- 1. MOTOR DE MÚSICA (VENTANA INVISIBLE) ---
function createMusicPlayer() {
  musicWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  musicWindow.loadURL(`data:text/html,
    <audio id="radio" loop></audio>
    <script>
      const { ipcRenderer } = require('electron');
      const audio = document.getElementById('radio');
	  audio.volume = 0.5;
      ipcRenderer.on('control-music', (e, action, data) => {
        if (action === 'play') {
          if (data) audio.src = data;
          audio.play().catch(() => {});
        } else if (action === 'pause') {
          audio.pause();
        }
      });
    </script>
  `);
}

// --- 2. VENTANA PRINCIPAL ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Mundo Gamer Xtreme",
    icon: path.join(__dirname, 'icono.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL('https://sites.google.com/view/mundogamerxtreme');
  mainWindow.on('page-title-updated', (e) => e.preventDefault());
  mainWindow.setMenu(null);

  // --- VINCULACIÓN DE CIERRE (SOLUCIONA TU PROBLEMA) ---
  mainWindow.on('closed', () => {
    if (musicWindow) musicWindow.close();
    mainWindow = null;
  });

  // --- AUTO-UPDATER ---
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) mainWindow.webContents.send('update-downloaded');
  });

  // --- GESTIÓN DE DESCARGAS ---
  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    const filePath = path.join(app.getPath('downloads'), item.getFilename());
    item.setSavePath(filePath);
    item.on('updated', (event, state) => {
      if (state === 'progressing' && item.getTotalBytes() > 0) {
        const progress = (item.getReceivedBytes() / item.getTotalBytes()) * 100;
        mainWindow.webContents.send('download-progress', progress.toFixed(2));
      }
    });
    item.once('done', (event, state) => {
      mainWindow.webContents.send('download-finished', state === 'completed' ? '¡Descarga Completa!' : `Error: ${state}`);
    });
  });
}

// --- 3. COMUNICACIÓN IPC ---

// Control de Música Inteligente
ipcMain.on('music-command', (event, action, data) => {
  if (musicWindow) {
    if (action === 'play') {
      if (data && data !== currentMusicUrl) {
        currentMusicUrl = data;
        musicWindow.webContents.send('control-music', 'play', data);
      } else {
        musicWindow.webContents.send('control-music', 'play');
      }
    } else if (action === 'pause') {
      musicWindow.webContents.send('control-music', 'pause');
    }
  }
});

// Botón Atrás / Navegación
ipcMain.on('go-back', () => {
  if (mainWindow && mainWindow.webContents.navigationHistory.canGoBack()) {
    mainWindow.webContents.navigationHistory.goBack();
  }
});

// Reiniciar para Actualizar
ipcMain.on('restart-app', () => {
  autoUpdater.quitAndInstall();
});

// --- 4. INICIO Y CIERRE TOTAL ---
app.whenReady().then(() => {
  createMusicPlayer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});