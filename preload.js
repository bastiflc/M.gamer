const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  
  // --- 1. BOTÓN VOLVER (INICIO) ---
  const backBtn = document.createElement('button');
  backBtn.innerText = '← Inicio';
  Object.assign(backBtn.style, {
    position: 'fixed', top: '15px', left: '15px', zIndex: '10000',
    padding: '10px 20px', backgroundColor: '#222', color: '#fff',
    border: '1px solid #444', borderRadius: '8px', cursor: 'pointer',
    fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '14px',
    boxShadow: '0px 4px 10px rgba(0,0,0,0.5)'
  });
  
  backBtn.addEventListener('click', () => ipcRenderer.send('go-back'));
  document.body.appendChild(backBtn);

  // --- 2. INDICADOR DE DESCARGA DE ARCHIVOS ---
  const progressDiv = document.createElement('div');
  progressDiv.id = 'download-status';
  Object.assign(progressDiv.style, {
    position: 'fixed', bottom: '20px', right: '20px', zIndex: '10000',
    padding: '15px', backgroundColor: '#1a1a1a', color: '#00ff00',
    borderRadius: '10px', display: 'none', fontFamily: 'sans-serif',
    boxShadow: '0px 4px 15px rgba(0,0,0,0.8)', border: '1px solid #00ff00'
  });
  progressDiv.innerHTML = `Descargando: <b id="percent">0</b>%`;
  document.body.appendChild(progressDiv);

  ipcRenderer.on('download-progress', (event, percent) => {
    progressDiv.style.display = 'block';
    document.getElementById('percent').innerText = percent;
  });

  ipcRenderer.on('download-finished', (event, message) => {
    document.getElementById('percent').innerText = "100";
    setTimeout(() => {
      progressDiv.style.display = 'none';
      alert(message); 
    }, 2000);
  });

  // --- 3. AVISO DE ACTUALIZACIÓN DE LA APP (AUTO-UPDATER) ---
  const updateDiv = document.createElement('div');
  Object.assign(updateDiv.style, {
    position: 'fixed', bottom: '20px', left: '20px', zIndex: '10001',
    padding: '20px', backgroundColor: '#ffffff', color: '#333',
    borderRadius: '10px', display: 'none', fontFamily: 'sans-serif',
    boxShadow: '0px 5px 20px rgba(0,0,0,0.5)', borderLeft: '5px solid #007bff'
  });

  updateDiv.innerHTML = `
    <h4 style="margin: 0 0 10px 0;">¡Nueva versión lista!</h4>
    <p style="margin: 0 0 15px 0; font-size: 14px;">Se ha descargado una actualización. Reinicia para aplicar los cambios.</p>
    <button id="restart-btn" style="padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Reiniciar ahora</button>
  `;
  document.body.appendChild(updateDiv);

  // Escuchar cuando el main.js avisa que la actualización está descargada
  ipcRenderer.on('update-downloaded', () => {
    updateDiv.style.display = 'block';
  });

  // Enviar señal al main.js para reiniciar e instalar
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'restart-btn') {
      ipcRenderer.send('restart-app');
    }
  });

});