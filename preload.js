const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {

  // --- 1. CONFIGURACIÓN DE MÚSICA DE FONDO ---
  // Reemplaza la URL por el link directo a tu MP3
  const bgMusic = new Audio('https://www.tu-servidor.com/musica-psp.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.2; // Volumen suave al 20%

  // --- 2. SISTEMA DE ACUERDOS Y LICENCIAS (MODAL) ---
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
      <h2 style="color: #00ff00; margin-top: 0;">Términos de Uso y Licencia de Software</h2>
      <div style="height: 180px; overflow-y: auto; text-align: left; background: #000; padding: 15px; font-size: 13px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #333; line-height: 1.5;">
        <p><b>Bienvenid@:</b> Muchas gracias por descargar esta aplicación y apoyar mi proyecto. Espero que disfruten y aprendan mucho utilizando esta herramienta de preservación.</p>
		<p><b>Derechos de Autor:</b> MundoGamer es una aplicación informativa que no aloja archivos ilegales ni promueve la piratería. Queda estrictamente prohibido su uso comercial o redistribución sin permiso expreso del autor.</p>
        <p><b>Finalidad:</b> Esta app fue creada con el único fin de informar, educar y preservar la historia de los videojuegos y la cultura gamer.</p>
        <p><b>Marcas Registradas:</b> Todas las marcas, nombres de juegos y logotipos mencionados son propiedad de sus respectivos dueños. Esta app no tiene afiliación oficial con ninguna empresa.</p>
		<p><b>Enlaces Externos:</b> El desarrollador no se hace responsable por el contenido, la seguridad o la disponibilidad de los sitios web de terceros a los que esta aplicación pueda enlazar.</p>
		<p><b>Responsabilidad:</b> Al aceptar estas condiciones, el usuario reconoce que el uso de esta herramienta es bajo su propia responsabilidad, eximiendo al desarrollador de cualquier daño derivado del mal uso de la misma.</p>
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

    // Lógica de botones del Modal
    document.getElementById('btn-decline').addEventListener('click', () => window.close());

    document.getElementById('btn-accept').addEventListener('click', () => {
      if (document.getElementById('check-never').checked) {
        localStorage.setItem('terminos-aceptados', 'true');
      }
      bgMusic.play().catch(e => console.log("Audio bloqueado hasta interacción"));
      overlay.remove();
    });
  } else {
    // Si ya aceptó antes, la música suena al primer clic en la pantalla
    document.addEventListener('click', () => {
      bgMusic.play().catch(e => {});
    }, { once: true });
  }

  // --- 3. BOTÓN VOLVER (INICIO) ---
  const backBtn = document.createElement('button');
  backBtn.innerText = '🏠 Inicio';
  Object.assign(backBtn.style, {
    position: 'fixed', top: '15px', right: '15px', zIndex: '10000',
    padding: '10px 20px', backgroundColor: '#222', color: '#fff',
    border: '1px solid #444', borderRadius: '8px', cursor: 'pointer',
    fontFamily: 'sans-serif', fontWeight: 'bold', fontSize: '14px'
  });
  backBtn.addEventListener('click', () => ipcRenderer.send('go-back'));
  document.body.appendChild(backBtn);

  // --- 4. INDICADOR DE DESCARGA ---
  const progressDiv = document.createElement('div');
  progressDiv.id = 'download-status';
  Object.assign(progressDiv.style, {
    position: 'fixed', bottom: '20px', right: '20px', zIndex: '10000',
    padding: '15px', backgroundColor: '#1a1a1a', color: '#00ff00',
    borderRadius: '10px', display: 'none', fontFamily: 'sans-serif',
    border: '1px solid #00ff00'
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
    <p style="margin: 0 0 15px 0; font-size: 14px;">Nueva versión descargada. Reinicia para actualizar.</p>
    <button id="restart-btn" style="padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Actualizar ahora</button>
  `;
  document.body.appendChild(updateDiv);

  ipcRenderer.on('update-downloaded', () => {
    updateDiv.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'restart-btn') {
      ipcRenderer.send('restart-app');
    }
  });

});