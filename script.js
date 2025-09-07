// app.js - full SPA logic (login, choose, AR)
document.addEventListener('DOMContentLoaded', () => {
  // Views
  const viewLogin = document.getElementById('view-login');
  const viewChoose = document.getElementById('view-choose');
  const viewAR = document.getElementById('view-ar');

  // Login elements
  const loginForm = document.getElementById('loginForm');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const loginError = document.getElementById('loginError');

  // Choose elements
  const fieldCards = document.querySelectorAll('.field-card');
  const logoutFromChoose = document.getElementById('logoutFromChoose');

  // AR elements
  const viewerHolder = document.getElementById('viewerHolder');
  const markerHolder = document.getElementById('markerHolder');
  const fallback = document.getElementById('fallback');
  const fieldTitle = document.getElementById('fieldTitle');
  const fieldDesc = document.getElementById('fieldDesc');
  const modeSelect = document.getElementById('modeSelect');
  const logoutBtn = document.getElementById('logoutBtn');
  const backBtn = document.getElementById('backBtn');

  const userArea = document.getElementById('userArea');
  const toastEl = document.getElementById('toast');

  // Utility
  const showToast = (msg, t = 3000) => {
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(()=> toastEl.classList.remove('show'), t);
  };
  const show = el => el.classList.remove('hide');
  const hide = el => el.classList.add('hide');

  // Environment checks
  const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const hasWebGL = (() => {
    try { const c=document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl')||c.getContext('experimental-webgl'))); }
    catch(e){ return false; }
  })();
  const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  // Assets per field
  const assets = {
    science: {
      title: 'Science',
      desc: 'Explore molecules, planets and more.',
      markerless: { src: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', alt: 'Astronaut' },
      marker: { model: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb', scale: '0.5 0.5 0.5' }
    },
    history: {
      title: 'History',
      desc: 'View artifacts and historical models.',
      markerless: { src: 'https://modelviewer.dev/shared-assets/models/House.glb', alt: 'Ancient House' },
      marker: { model: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Avocado/glTF-Binary/Avocado.glb', scale: '2 2 2' }
    },
    geography: {
      title: 'Geography',
      desc: 'Spinning globes and maps.',
      markerless: { src: 'https://modelviewer.dev/shared-assets/models/earth.glb', alt: 'Globe' },
      marker: { model: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/BoxTextured/glTF-Binary/BoxTextured.glb', scale: '1 1 1' }
    },
    technology: {
      title: 'Technology',
      desc: 'Gadgets, engines and chips.',
      markerless: { src: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb', alt: 'Robot' },
      marker: { model: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/2CylinderEngine/glTF-Binary/2CylinderEngine.glb', scale: '0.8 0.8 0.8' }
    },
    arts: {
      title: 'Arts',
      desc: 'Sculptures and artistic models.',
      markerless: { src: 'https://modelviewer.dev/shared-assets/models/Statue.glb', alt: 'Statue' },
      marker: { model: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/BoxTextured/glTF-Binary/BoxTextured.glb', scale: '1 1 1' }
    }
  };

  // SPA helpers
  function showView(view) {
    [viewLogin, viewChoose, viewAR].forEach(v => v.classList.add('hide'));
    view.classList.remove('hide');
  }

  function setUserArea(email) {
    if(!userArea) return;
    if(email) userArea.textContent = email;
    else userArea.textContent = '';
  }

  // LOGIN flow
  function initLogin() {
    // if already logged in -> go to choose
    if(localStorage.getItem('pp_logged_in')) {
      setUserArea(localStorage.getItem('pp_user') || '');
      showView(viewChoose);
      return;
    }
    showView(viewLogin);
  }

  if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loginError.textContent = '';

      const email = emailEl.value.trim();
      const pass = passwordEl.value;

      if(!email || !pass) {
        loginError.textContent = 'All fields required.';
        return;
      }
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if(!emailRegex.test(email)) {
        loginError.textContent = 'Invalid email format.';
        return;
      }
      if(pass.length < 6) {
        loginError.textContent = 'Password must be 6+ chars.';
        return;
      }

      // store session locally
      localStorage.setItem('pp_logged_in','1');
      localStorage.setItem('pp_user', email);
      setUserArea(email);

      // go to choose
      showView(viewChoose);
      showToast('Logged in — choose a field');
    });
  }

  // CHOOSE flow
  fieldCards.forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.field;
      if(!assets[field]) {
        showToast('Field not available');
        return;
      }
      localStorage.setItem('pp_selected_field', field);
      startAR(field);
    });
  });

  logoutFromChoose && logoutFromChoose.addEventListener('click', () => {
    localStorage.removeItem('pp_logged_in');
    localStorage.removeItem('pp_user');
    localStorage.removeItem('pp_selected_field');
    setUserArea('');
    showView(viewLogin);
  });

  // AR flow
  function startAR(field) {
    showView(viewAR);
    setUserArea(localStorage.getItem('pp_user') || '');
    renderExperience(field);
  }

  // handle logout/back in AR view
  logoutBtn && logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('pp_logged_in');
    localStorage.removeItem('pp_user');
    localStorage.removeItem('pp_selected_field');
    setUserArea('');
    showView(viewLogin);
  });
  backBtn && backBtn.addEventListener('click', () => {
    showView(viewChoose);
  });

  // mode change
  modeSelect && modeSelect.addEventListener('change', () => {
    const field = localStorage.getItem('pp_selected_field') || 'science';
    renderExperience(field);
  });

  // Helper builders
  function buildModelViewer(src, alt) {
    return `<model-viewer src="${src}" alt="${alt}" ar ar-modes="webxr scene-viewer quick-look" camera-controls auto-rotate style="width:100%;height:420px;border-radius:8px;"></model-viewer>`;
  }
  function buildMarkerScene(modelUrl, scale='1 1 1') {
    return `
      <a-scene embedded arjs="trackingMethod: best; debugUIEnabled: false;">
        <a-marker preset="hiro">
          <a-entity gltf-model="${modelUrl}" scale="${scale}" animation="property: rotation; to: 0 360 0; loop: true; dur: 8000"></a-entity>
        </a-marker>
        <a-entity camera></a-entity>
      </a-scene>
    `;
  }

  // Main render function
  function renderExperience(field) {
    field = field || localStorage.getItem('pp_selected_field') || 'science';
    localStorage.setItem('pp_selected_field', field);

    const data = assets[field] || assets['science'];
    fieldTitle.textContent = data.title;
    fieldDesc.textContent = data.desc;

    viewerHolder.innerHTML = '';
    markerHolder.innerHTML = '';
    fallback.classList.add('hide');

    // environment hints
    if(!isHTTPS) showToast('Host over HTTPS for full AR features');
    if(!hasWebGL) showToast('WebGL not available — 3D rendering may fail');
    if(!hasCamera) showToast('Camera access unavailable — marker AR may not work');

    const mode = modeSelect ? modeSelect.value : 'markerless';

    if(mode === 'markerless') {
      // model-viewer check
      if (window.customElements && window.customElements.get('model-viewer')) {
        viewerHolder.innerHTML = buildModelViewer(data.markerless.src, data.markerless.alt);
        showToast('Tap the AR button on the model to place it in your space (if supported).', 3500);
      } else {
        fallback.classList.remove('hide');
      }
    } else {
      // marker-based
      if(!hasCamera || !hasWebGL) {
        fallback.classList.remove('hide');
      } else {
        markerHolder.innerHTML = buildMarkerScene(data.marker.model, data.marker.scale);
        showToast('Point the camera at a printed HIRO marker to see the model.', 3500);
      }
    }

    // update header
    const brand = document.querySelector('.brand');
    brand && (brand.textContent = 'PowerPack AR — ' + data.title);
  }

  // Initial view
  initLogin();

  // If user already selected field (e.g. resumed), allow quick start
  const preField = localStorage.getItem('pp_selected_field');
  if(localStorage.getItem('pp_logged_in') && preField) {
    // show choose view by default; user taps field or use a quick auto-start if you prefer:
    // startAR(preField); // uncomment to auto-enter AR for last field
  }
});
