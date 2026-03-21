const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {

  // --- 0. ELIMINACIÓN DE RESIDUOS Y LIMPIEZA VISUAL (CUADROS AZULES) ---
  const removeGoogleResidues = () => {
    const mainContainer = document.querySelector('[jsname="bN97Pc"]');
    if (mainContainer) mainContainer.remove();

    const actionBtn = document.querySelector('[jsname="Bg3gkf"]');
    const abuseMenu = document.querySelector('[jsname="srlkmf"]'); 
    
    if (actionBtn) actionBtn.remove();
    if (abuseMenu) abuseMenu.remove();
  };

  const residueCleaner = setInterval(removeGoogleResidues, 100);
  setTimeout(() => clearInterval(residueCleaner), 15000);

  const style = document.createElement('style');
  style.innerHTML = `
    /* BLOQUEO DE CUADROS AZULES Y SELECCIÓN */
    * {
      -webkit-tap-highlight-color: transparent !important; /* Quita el flash azul al hacer clic */
      -webkit-focus-ring-color: transparent !important;   /* Quita el borde de enfoque de Chrome */
      outline: none !important;                            /* Quita el contorno azul clásico */
    }

    *:focus, *:active {
      outline: none !important;
      box-shadow: none !important; /* Algunos sitios usan sombras en lugar de bordes */
    }

    /* Evita que el usuario seleccione texto o imágenes (hace que parezca una app nativa) */
    body {
      -webkit-user-select: none !important;
      user-select: none !important;
      cursor: default;
    }

    /* Permitir selección solo en campos donde sea necesario (si los hay) */
    input, textarea, [contenteditable="true"] {
      -webkit-user-select: text !important;
      user-select: text !important;
    }

    /* OCULTAR RESIDUOS DE GOOGLE */
    [jsname="bN97Pc"], [jsname="srlkmf"], [jsname="Bg3gkf"], .ndS7C {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);

  // --- 1. CONTROL DE MÚSICA GLOBAL ---
  const musicUrl = 'https://jetta.vgmtreasurechest.com/soundtracks/donkey-kong-country-1-2-3-ost-recreated-2022/miexyzcn/40.%20Discotrain.mp3';
  let musicStatus = localStorage.getItem('music-status') || 'playing';

  const updateMusicUI = () => {
    if (musicStatus === 'playing') {
      ipcRenderer.send('music-command', 'play', musicUrl);
      musicBtn.innerHTML = '🎵';
      musicBtn.style.backgroundColor = '#00ff00';
      musicBtn.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.4)';
    } else {
      ipcRenderer.send('music-command', 'pause');
      musicBtn.innerHTML = '🔇';
      musicBtn.style.backgroundColor = '#444';
      musicBtn.style.boxShadow = 'none';
    }
  };

  // --- 2. CONTENEDOR DE BOTONES ---
  const btnContainer = document.createElement('div');
  Object.assign(btnContainer.style, {
    position: 'fixed', top: '15px', right: '15px', zIndex: '10000',
    display: 'flex', gap: '10px'
  });

  const musicBtn = document.createElement('button');
  Object.assign(musicBtn.style, {
    padding: '10px 15px', border: '1px solid #444', borderRadius: '8px',
    cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '14px',
    transition: 'all 0.3s ease', color: 'white'
  });

  musicBtn.addEventListener('click', () => {
    musicStatus = (musicStatus === 'playing') ? 'paused' : 'playing';
    localStorage.setItem('music-status', musicStatus);
    updateMusicUI();
  });

  const backBtn = document.createElement('button');
  backBtn.innerText = '🏠 Inicio';
  Object.assign(backBtn.style, {
    padding: '10px 20px', backgroundColor: '#222', color: '#fff',
    border: '1px solid #444', borderRadius: '8px', cursor: 'pointer',
    fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '14px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
  });
  backBtn.addEventListener('click', () => ipcRenderer.send('go-back'));

  btnContainer.appendChild(musicBtn);
  btnContainer.appendChild(backBtn);
  document.body.appendChild(btnContainer);

  updateMusicUI();

  // --- 3. SISTEMA DE ACUERDOS ---
  const hasAccepted = localStorage.getItem('terminos-aceptados');

  if (!hasAccepted) {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.98)', zIndex: '20000',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backdropFilter: 'blur(8px)', fontFamily: 'sans-serif'
    });

    const modal = document.createElement('div');
    Object.assign(modal.style, {
      width: '85%', maxWidth: '500px', backgroundColor: '#1a1a1a', color: '#fff',
      padding: '30px', borderRadius: '15px', border: '1px solid #00ff00',
      textAlign: 'center', boxShadow: '0 0 20px rgba(0, 255, 0, 0.2)'
    });

    modal.innerHTML = `
      <h2 style="color: #00ff00; margin-top: 0;">Términos de Uso y Licencia</h2>
      <div style="height: 180px; overflow-y: auto; text-align: left; background: #000; padding: 15px; font-size: 13px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #333; line-height: 1.5;">
        <p><b>Bienvenid@:</b> MundoGamer es una herramienta de preservación e información.</p>
        <p><b>Responsabilidad:</b> El uso de esta herramienta es bajo su propia responsabilidad.</p>
        <p><b>Contenido:</b> No se alojan archivos ilegales ni se promueve la piratería.</p>
      </div>
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="btn-accept" style="padding: 12px 25px; background: #00ff00; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">ACEPTAR</button>
        <button id="btn-decline" style="padding: 12px 25px; background: #333; color: #fff; border: none; border-radius: 6px; cursor: pointer;">SALIR</button>
      </div>
      <label style="display: block; margin-top: 20px; font-size: 12px; color: #888; cursor: pointer;">
        <input type="checkbox" id="check-never"> No volver a mostrar este mensaje
      </label>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('btn-decline').addEventListener('click', () => window.close());
    document.getElementById('btn-accept').addEventListener('click', () => {
      if (document.getElementById('check-never').checked) {
        localStorage.setItem('terminos-aceptados', 'true');
      }
      if (musicStatus === 'playing') ipcRenderer.send('music-command', 'play', musicUrl);
      overlay.remove();
    });
  } else {
    document.addEventListener('click', () => {
      if (musicStatus === 'playing') ipcRenderer.send('music-command', 'play', musicUrl);
    }, { once: true });
  }

  // --- 4. INDICADOR DE DESCARGA ---
  const progressDiv = document.createElement('div');
  progressDiv.id = 'download-status';
  Object.assign(progressDiv.style, {
    position: 'fixed', bottom: '20px', right: '20px', zIndex: '10000',
    padding: '15px', backgroundColor: '#1a1a1a', color: '#00ff00',
    borderRadius: '10px', display: 'none', fontFamily: 'sans-serif',
    border: '1px solid #00ff00', boxShadow: '0 0 15px rgba(0,255,0,0.2)'
  });
  progressDiv.innerHTML = `Descargando: <b id="percent">0</b>%`;
  document.body.appendChild(progressDiv);

  ipcRenderer.on('download-progress', (event, percent) => {
    progressDiv.style.display = 'block';
    document.getElementById('percent').innerText = percent;
  });

  ipcRenderer.on('download-finished', (event, message) => {
    document.getElementById('percent').innerText = "100";
    setTimeout(() => { progressDiv.style.display = 'none'; alert(message); }, 2000);
  });
  
  // --- 5. AUTO-UPDATER ---
  const updateDiv = document.createElement('div');
  Object.assign(updateDiv.style, {
    position: 'fixed', bottom: '20px', left: '20px', zIndex: '10001',
    padding: '20px', backgroundColor: '#ffffff', color: '#333',
    borderRadius: '10px', display: 'none', fontFamily: 'sans-serif',
    boxShadow: '0px 5px 20px rgba(0,0,0,0.5)', borderLeft: '5px solid #007bff'
  });

  updateDiv.innerHTML = `
    <h4 style="margin: 0 0 10px 0;">¡Actualización lista!</h4>
    <p style="margin: 0 0 15px 0; font-size: 14px;">Reinicia para actualizar.</p>
    <button id="restart-btn" style="padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Actualizar ahora</button>
  `;
  document.body.appendChild(updateDiv);

  ipcRenderer.on('update-downloaded', () => { updateDiv.style.display = 'block'; });

  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'restart-btn') ipcRenderer.send('restart-app');
  });

});