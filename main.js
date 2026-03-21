const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater'); // <-- 1. Importar el actualizador

function createWindow() {
  const win = new BrowserWindow({
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

  win.loadURL('https://sites.google.com/view/mundogamerxtreme');
  win.on('page-title-updated', (e) => e.preventDefault());
  win.setMenu(null);

  // --- 2. CONFIGURACIÓN DEL AUTO-UPDATER ---
  
  // Busca actualizaciones automáticamente al iniciar
  autoUpdater.checkForUpdatesAndNotify();

  // Cuando encuentra una actualización, avisa al usuario (opcional)
  autoUpdater.on('update-available', () => {
    console.log('Actualización disponible encontrada.');
  });

  // Cuando la actualización se termina de descargar en segundo plano
  autoUpdater.on('update-downloaded', () => {
    // Avisamos al preload.js para que muestre un botón de "Reiniciar"
    win.webContents.send('update-downloaded');
  });

  // --- GESTIÓN DE DESCARGAS CON PORCENTAJE ---
  win.webContents.session.on('will-download', (event, item, webContents) => {
    const filePath = path.join(app.getPath('downloads'), item.getFilename());
    item.setSavePath(filePath);

    item.on('updated', (event, state) => {
      if (state === 'progressing') {
        if (item.getTotalBytes() > 0) {
          const progress = (item.getReceivedBytes() / item.getTotalBytes()) * 100;
          win.webContents.send('download-progress', progress.toFixed(2));
        }
      }
    });

    item.once('done', (event, state) => {
      if (state === 'completed') {
        win.webContents.send('download-finished', '¡Descarga Completa!');
      } else {
        win.webContents.send('download-finished', `Error: ${state}`);
      }
    });
  });

  // --- COMUNICACIÓN CON PRELOAD (IPC) ---
  
  // Botón Atrás
  ipcMain.on('go-back', () => {
    if (win.webContents.navigationHistory.canGoBack()) win.webContents.navigationHistory.goBack();
  });

  // Acción para instalar la actualización descargada
  ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});