const { Tray, Menu, nativeImage, app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

if (process.platform === 'win32') {
    app.setAppUserModelId("com.mundogamer.app");
}

let mainWindow;
let musicWindow;
let splashWindow; 
let adTimeout; // Variable para controlar el tiempo del anuncio
let currentMusicUrl = ""; 
let adShownInThisSession = false;
let tray = null;
let isQuiting = false;

// --- 1. MOTOR DE MÚSICA ---
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

// --- 2. SPLASH SCREEN ---
function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 500, height: 400,
    frame: false, transparent: true, alwaysOnTop: true,
    backgroundColor: '#000000',
    icon: path.join(__dirname, 'icono.png'),
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });

  const gifUrl = "https://www.appcreator24.com/srv/imgs/gen/2066969_splash_ani.gif?ts=1774736004"; 

  splashWindow.loadURL(`data:text/html,
    <html>
    <style>
      body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: 'Segoe UI', sans-serif; background-color: rgba(0, 0, 0, 0.9); border-radius: 20px; color: white; overflow: hidden; }
      .gif-container { width: 100px; height: auto; -webkit-user-drag: none; }
      .loading-text { margin-top: 25px; font-size: 13px; text-transform: uppercase; letter-spacing: 4px; opacity: 0.7; animation: pulse 1.8s infinite; }
      @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
    </style>
    <body>
      <img src="${gifUrl}" class="gif-container">
      <div class="loading-text">Iniciando MundoGamer</div>
    </body>
    </html>
  `);

  splashWindow.once('ready-to-show', () => { splashWindow.show(); });
}

// --- 3. VENTANA PRINCIPAL ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800,
    title: "Mundo Gamer Xtreme",
    icon: path.join(__dirname, 'icono.png'),
    show: false,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false 
    }
  });

  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault(); 
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
      }
    }
    return false;
  });

  // Manejo de ventanas emergentes
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        autoHideMenuBar: true,
        width: 1000,
        height: 600,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
      }
    };
  });

  // Limpieza de ventanas hijas
  mainWindow.webContents.on('did-create-window', (childWindow) => {
    limpiarVentanaGoogle(childWindow);
  });

  // Gestión de descargas segura
  mainWindow.webContents.session.on('will-download', (event, item) => {
    item.on('updated', (event, state) => {
      if (mainWindow && !mainWindow.isDestroyed() && state === 'progressing') {
        const total = item.getTotalBytes();
        const received = item.getReceivedBytes();
        const percent = total > 0 ? Math.floor((received / total) * 100) : 0;
        mainWindow.webContents.send('download-progress', { percent });
      }
    });
    item.once('done', (event, state) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-finished', { state });
      }
    });
  });

  const decodedUrl = Buffer.from("aHR0cHM6Ly93d3cubXVuZG9nYW1leHRyZW1lLm5ldC5wZQ==", 'base64').toString('utf-8');
  mainWindow.loadURL(decodedUrl);
  mainWindow.setMenu(null);

  // Inyección de CSS segura al navegar
  mainWindow.webContents.on('did-start-navigation', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.insertCSS(`
        ::-webkit-scrollbar { display: none !important; width: 0 !important; }
        html, body { 
          background-image: url(https://i.ibb.co/RpLjMp5q/FONDOWEB.png) !important;
          background-size: cover !important;
          background-position: center !important;
          background-attachment: fixed !important;
          overflow: auto !important; 
          scrollbar-width: none; 
        }
        img, a { -webkit-user-drag: none !important; user-select: none !important; }
      `).catch(() => {});
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.insertCSS(`html, body { overflow: auto !important; scrollbar-width: none !important; }`).catch(() => {});
      
      if (!adShownInThisSession) {
        adTimeout = setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            showGlobalAd(mainWindow);
            adShownInThisSession = true;
          }
        }, 5000);
      }
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    if (adTimeout) clearTimeout(adTimeout); // CANCELAR EL RELOJ DEL ANUNCIO
    if (musicWindow && !musicWindow.isDestroyed()) musicWindow.close();
    mainWindow = null;
  });
}

// --- 4. FUNCIÓN REUTILIZABLE (SEGURIDAD MÁXIMA) ---
function limpiarVentanaGoogle(windowTarget) {
  if (!windowTarget || windowTarget.isDestroyed()) return;

  try {
    windowTarget.setMenu(null);
  } catch (e) {}

  windowTarget.webContents.on('did-finish-load', () => {
    if (!windowTarget.isDestroyed()) {
      windowTarget.webContents.insertCSS(`
        html, body {
          background-image: url("https://i.ibb.co/twGQnMXR/5617696.jpg") !important;
          background-size: cover !important;
          background-position: center !important;
          background-attachment: fixed !important;
        }
        .hBW7Hb, [jsname="bN97Pc"], .hUphyc, div[role="button"][aria-label="Acciones del sitio"] { display: none !important; }
        html, body { overflow: auto !important; scrollbar-width: none !important; }
        ::-webkit-scrollbar { display: none !important; }
      `).catch(() => {});
    }
  });

  windowTarget.webContents.on('did-create-window', (nextChild) => {
    limpiarVentanaGoogle(nextChild);
  });
}

// --- 5. ANUNCIO GLOBAL ---
function showGlobalAd(browserWindow) {
  if (!browserWindow || browserWindow.isDestroyed()) return;
  const affiliateLink = "https://navedelavado.es.tl/";
  const adCode = `
    (function() {
      if (document.getElementById('ads-container-global')) return;
      const adsDiv = document.createElement('div');
      adsDiv.id = 'ads-container-global';
      const style = document.createElement('style');
      style.innerText = '@keyframes slideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } .ads-up { animation: slideInRight 0.8s ease-out forwards; }';
      document.head.appendChild(style);
      Object.assign(adsDiv.style, {
        position: 'fixed', bottom: '20px', right: '20px', width: '400px', height: '65px', 
        zIndex: '2147483647', background: 'linear-gradient(135deg, #0a0a0a 0%, #2e1065 100%)',
        border: '2px solid #7c3aed', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
      });
      adsDiv.classList.add('ads-up');
      adsDiv.innerHTML = '<div style="color:white; font-weight:bold; font-size:13px; text-transform:uppercase; text-align:center;">🐺 Apoya al desarrollador. 🌹</div>';
      document.body.appendChild(adsDiv);
      adsDiv.onclick = () => { window.ipcRenderer.send('open-external-link', '${affiliateLink}'); };
    })();
  `;
  browserWindow.webContents.executeJavaScript(adCode).catch(() => {});
}

// --- 6. COMUNICACIÓN IPC ---
ipcMain.on('open-external-link', (event, url) => shell.openExternal(url));

ipcMain.on('music-command', (event, action, data) => {
    if (musicWindow && !musicWindow.isDestroyed()) {
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

ipcMain.on('go-back', () => {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents.navigationHistory.canGoBack()) {
    mainWindow.webContents.navigationHistory.goBack();
  }
});

ipcMain.on('restart-app', () => autoUpdater.quitAndInstall());

// --- 7. INICIO ---
app.whenReady().then(() => {
  createMusicPlayer();
  createSplashScreen();
  createWindow();      

  const iconPath = path.join(__dirname, 'icono.png');
  tray = new Tray(nativeImage.createFromPath(iconPath));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir Mundo Gamer Xtreme', click: () => { if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.show(); mainWindow.focus(); } else { createWindow(); } } },
	{ label: 'Donar', click: () => { shell.openExternal('https://navedelavado.es.tl/'); } },
    { type: 'separator' },
    { label: 'Cerrar', click: () => { isQuiting = true; app.quit(); } }
  ]);

  tray.setToolTip('Mundo Gamer Xtreme');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show(); });

  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on('update-downloaded', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-downloaded');
  });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });