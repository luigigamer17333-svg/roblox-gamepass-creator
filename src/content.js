(function() {
  if (window.robloxGamepassCreatorLoaded) return;
  window.robloxGamepassCreatorLoaded = true;

  const DEFAULT_VALUES = [2, 5, 10, 15, 25, 50, 75, 100, 150, 200, 250, 350, 500, 750, 1000, 2500, 3500, 5000, 7500, 10000];
  
  let state = {
    userId: null,
    username: null,
    displayName: null,
    csrfToken: null,
    isCreating: false,
    currentAction: null,
    progress: 0,
    total: 0,
    results: [],
    logs: [],
    isOpen: false,
    currentSection: 'main',
    targetUniverse: null,
    currentBatch: [],
    currentOptions: {},
    currentPassId: null,
    presets: [...DEFAULT_VALUES],
    isRegionalPricingEnabled: false,
    windowPosition: null,
    questionnaireCache: null,
    maxRetries: 2,
    gamepassesCacheTime: 0,
    CACHE_DURATION: 30000 // 30 seconds
  };

  let shadowRoot;
  let host;
  let elements = {};
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  const ICONS = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2.02 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>',
    coffee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>',
    clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    sortAsc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="12 5 19 12 12 19"></polyline><line x1="4" y1="5" x2="4" y2="19"></line></svg>'
  };

  function syncTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    const isLight = !isDark || document.body.classList.contains('light-theme');
    
    if (host) {
      if (isLight) host.classList.add('light-mode');
      else host.classList.remove('light-mode');
    }
    
    const navItem = document.getElementById('rbx-gamepass-creator-nav-item');
    if (navItem) {
      const btn = navItem.querySelector('button');
      if (btn) {
        if (isLight) {
          btn.style.background = 'rgba(0,0,0,0.06)';
          btn.style.color = '#000';
          btn.style.borderColor = 'rgba(0,0,0,0.1)';
        } else {
          btn.style.background = 'rgba(255,255,255,0.08)';
          btn.style.color = '#fff';
          btn.style.borderColor = 'rgba(255,255,255,0.1)';
        }
      }
    }
  }

  async function init() {
    const hostName = window.location.hostname;
    if (hostName !== 'www.roblox.com') return;

    extractUserData();
    await loadState();
    createUI();
    injectNavbarButton();
    syncTheme();
    
    const themeObserver = new MutationObserver(() => syncTheme());
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    if (state.isOpen) applyWidgetState();
    if (state.currentSection) showSection(state.currentSection);
    if (state.isCreating) resumeAction();
    updateUI();
    if (state.userId) refreshQuestionnaireStatus();
  }

  async function refreshQuestionnaireStatus() {
    try {
      await ensureUniverseLinked();
      const btn = elements.btnQuestionnaire;
      if (!btn) return;

      const qResp = await robloxFetch(`https://apis.roblox.com/experience-questionnaire/v1/questionnaires/${state.targetUniverse}/latest`);
      if (!qResp.ok) return;
      const qData = await qResp.json();
      const currentQuestionnaireId = qData.questionnaireId;

      if (state.questionnaireCache && 
          state.questionnaireCache.questionnaireId === currentQuestionnaireId && 
          state.questionnaireCache.status === 'completed') {
        btn.querySelector('.status-dot').style.background = '#55ff55';
        btn.querySelector('.btn-text').textContent = 'Redo Questionnaire';
        return;
      }

      const resp = await robloxFetch(`https://apis.roblox.com/experience-questionnaire/v1/responses/${state.targetUniverse}/submissions/latest`);
      
      if (resp.status === 404) {
        btn.querySelector('.status-dot').style.background = '#ff5555';
        btn.querySelector('.btn-text').textContent = 'Submit Questionnaire (Required)';
        state.questionnaireCache = { questionnaireId: currentQuestionnaireId, status: 'missing' };
      } else if (resp.ok) {
        btn.querySelector('.status-dot').style.background = '#55ff55';
        btn.querySelector('.btn-text').textContent = 'Redo Questionnaire';
        state.questionnaireCache = { questionnaireId: currentQuestionnaireId, status: 'completed' };
      }
      await saveState();
    } catch (e) {}
  }

  async function ensureUniverseLinked() {
    if (state.targetUniverse) return state.targetUniverse;
    
    addLog('Connecting to API...', 'info');
    const gamesResp = await robloxFetch(`https://games.roblox.com/v2/users/${state.userId}/games?sortOrder=Asc&limit=10`);
    if (!gamesResp.ok) throw new Error(await getRobloxErrorMessage(gamesResp));
    const games = await gamesResp.json();
    if (!games.data || games.data.length === 0) throw new Error('No games found');
    const game = games.data[0];
    const univResp = await robloxFetch(`https://apis.roblox.com/universes/v1/places/${game.rootPlace.id}/universe`);
    if (!univResp.ok) throw new Error(await getRobloxErrorMessage(univResp));
    const univData = await univResp.json();
    state.targetUniverse = univData.universeId;
    addLog(`Linked to: ${game.name}`, 'success');
    await saveState();
    return state.targetUniverse;
  }

  function extractUserData() {
    const userDataMeta = document.querySelector('meta[name="user-data"]');
    if (userDataMeta) {
      state.userId = userDataMeta.getAttribute('data-userid');
      state.username = userDataMeta.getAttribute('data-name');
      state.displayName = userDataMeta.getAttribute('data-displayname');
    }
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) state.csrfToken = csrfMeta.getAttribute('data-token');
  }

  async function loadState() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['gamepassCreatorState'], (result) => {
        if (result.gamepassCreatorState) {
          const saved = result.gamepassCreatorState;
          state = { ...state, ...saved };
          if (!state.presets || state.presets.length === 0) {
            state.presets = [...DEFAULT_VALUES];
          }
        }
        resolve();
      });
    });
  }

  async function saveState() {
    return new Promise((resolve) => {
      chrome.storage.local.set({ gamepassCreatorState: state }, resolve);
    });
  }

  function injectNavbarButton() {
    if (!state.userId) return;
    if (document.getElementById('rbx-gamepass-creator-nav-item')) return;

    const navbarRight = document.querySelector('.nav.navbar-right.rbx-navbar-icon-group');
    if (!navbarRight) return;

    const navItem = document.createElement('li');
    navItem.id = 'rbx-gamepass-creator-nav-item';
    navItem.className = 'navbar-icon-item';
    
    const isDark = document.body.classList.contains('dark-theme');
    const isLight = !isDark || document.body.classList.contains('light-theme');
    const bg = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
    const color = isLight ? '#000' : '#fff';
    const border = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

    navItem.innerHTML = `
      <button type="button" class="rbx-menu-item" style="background:${bg}; color:${color}; border-radius:6px; padding:0 12px; height:28px; margin:6px 4px 6px 4px; border:1px solid ${border}; font-weight:600; font-size:12px; cursor:pointer; font-family:inherit; transition: 0.2s; display: flex; align-items: center; justify-content: center;">
        Create Passes
      </button>
    `;

    const robuxItem = document.getElementById('navbar-robux');
    if (robuxItem) {
      navbarRight.insertBefore(navItem, robuxItem);
    } else {
      navbarRight.appendChild(navItem);
    }

    const btn = navItem.querySelector('button');
    btn.addEventListener('mouseenter', () => {
      const currentDark = document.body.classList.contains('dark-theme');
      const currentLight = !currentDark || document.body.classList.contains('light-theme');
      btn.style.background = currentLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)';
    });
    btn.addEventListener('mouseleave', () => {
      const currentDark = document.body.classList.contains('dark-theme');
      const currentLight = !currentDark || document.body.classList.contains('light-theme');
      btn.style.background = currentLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
    });
    btn.addEventListener('click', toggleWidget);
  }

  function createUI() {
    host = document.createElement('div');
    host.id = 'roblox-gamepass-creator-host';
    document.body.appendChild(host);
    shadowRoot = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        --bg: rgba(13, 13, 13, 0.9);
        --bg-elevated: rgba(255, 255, 255, 0.04);
        --bg-hover: rgba(255, 255, 255, 0.12);
        --border: rgba(255, 255, 255, 0.08);
        --border-strong: rgba(255, 255, 255, 0.2);
        --text: #ffffff;
        --text-dim: #888888;
        --accent: #ffffff;
        --radius: 12px;
        --blur: 24px;
        --input-bg: rgba(0, 0, 0, 0.2);
        --input-focus: rgba(0, 0, 0, 0.3);
        --btn-primary-bg: #ffffff;
        --btn-primary-text: #000000;
        --scrollbar-thumb: rgba(255, 255, 255, 0.1);
        --overlay-bg: rgba(0, 0, 0, 0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        z-index: 9999999;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      :host(.light-mode) {
        --bg: rgba(245, 245, 245, 0.95);
        --bg-elevated: rgba(0, 0, 0, 0.04);
        --bg-hover: rgba(0, 0, 0, 0.08);
        --border: rgba(0, 0, 0, 0.1);
        --border-strong: rgba(0, 0, 0, 0.2);
        --text: #000000;
        --text-dim: #666666;
        --accent: #000000;
        --input-bg: rgba(0, 0, 0, 0.05);
        --input-focus: rgba(0, 0, 0, 0.08);
        --btn-primary-bg: #000000;
        --btn-primary-text: #ffffff;
        --scrollbar-thumb: rgba(0, 0, 0, 0.2);
        --overlay-bg: rgba(255, 255, 255, 0.6);
      }

      .widget {
        position: fixed;
        top: 50%;
        left: 50%;
        width: 520px;
        max-height: 85vh;
        background: var(--bg);
        backdrop-filter: blur(var(--blur));
        border-radius: 16px;
        border: 1px solid var(--border);
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        opacity: 0;
        transform: translate(-50%, -48%) scale(0.98);
        pointer-events: none;
        color: var(--text);
      }

      :host(.light-mode) .widget {
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
      }

      .widget.open { opacity: 1; transform: translate(-50%, -50%) scale(1); pointer-events: all; }

      .header { 
        padding: 14px 20px; 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        cursor: grab;
        border-bottom: 1px solid var(--border);
        background: rgba(255,255,255,0.02);
      }
      :host(.light-mode) .header { background: rgba(0,0,0,0.02); }
      .header:active { cursor: grabbing; }
      .header h2 { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: var(--text-dim); text-transform: uppercase; }

      .header-actions { display: flex; gap: 6px; }
      .icon-btn {
        background: transparent;
        border: none;
        color: var(--text-dim);
        width: 28px;
        height: 28px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.15s;
      }
      .icon-btn:hover { background: var(--bg-hover); color: var(--text); }
      .icon-btn svg { width: 15px; height: 15px; }

      .content { 
        padding: 20px; 
        flex: 1; 
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }
      .section { display: flex; flex-direction: column; gap: 12px; }
      .hidden { display: none !important; }

      .tab-container {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        border-bottom: 1px solid var(--border);
        padding-bottom: 12px;
      }

      .tab-button {
        background: transparent;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        color: var(--text-dim);
        cursor: pointer;
        transition: all 0.15s;
        text-transform: uppercase;
        border-bottom: 2px solid transparent;
        font-family: inherit;
      }

      .tab-button:hover {
        background: var(--bg-hover);
        color: var(--text);
      }

      .tab-button.active {
        color: var(--text);
        border-bottom-color: var(--text);
      }

      .actions { display: flex; flex-direction: column; gap: 8px; }

      .btn {
        height: 38px;
        padding: 0 14px;
        border-radius: 8px;
        border: 1px solid var(--border);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        width: 100%;
        background: var(--bg-elevated);
        color: var(--text);
        font-family: inherit;
        justify-content: flex-start;
      }
      .btn:hover { background: var(--bg-hover); border-color: var(--border-strong); }
      .btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .btn svg { width: 14px; height: 14px; opacity: 0.7; }
      
      .btn-primary { background: var(--btn-primary-bg); color: var(--btn-primary-text); border: none; justify-content: center; }
      .btn-primary:hover { filter: brightness(0.9); }
      :host(.light-mode) .btn-primary:hover { filter: brightness(1.05); }

      .btn-small {
        height: 32px;
        padding: 0 10px;
        font-size: 11px;
        flex: 1;
      }

      .btn-icon {
        width: 32px;
        height: 32px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .btn-icon svg {
        width: 16px;
        height: 16px;
      }

      .input-group { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; border-top: 1px solid var(--border); padding-top: 12px; }
      input[type="text"], input[type="number"], textarea {
        width: 100%;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--input-bg);
        color: var(--text);
        box-sizing: border-box;
        font-family: inherit;
        font-size: 13px;
        transition: 0.15s;
      }
      textarea { min-height: 80px; resize: none; font-size: 12px; line-height: 1.5; color: var(--text-dim); }
      input[type="text"]:focus, input[type="number"]:focus, textarea:focus { outline: none; border-color: var(--border-strong); background: var(--input-focus); }

      .progress-container { text-align: center; }
      .progress-bar { height: 3px; background: var(--bg-elevated); border-radius: 2px; overflow: hidden; margin: 16px 0 8px; }
      .progress-fill { height: 100%; background: var(--text); width: 0%; transition: width 0.3s ease; }
      .stats { display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; }

      .log {
        background: var(--input-bg);
        border-radius: 8px;
        padding: 12px;
        height: 160px;
        overflow-y: auto;
        font-size: 11px;
        border: 1px solid var(--border);
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .log-entry { display: flex; gap: 8px; color: var(--text-dim); line-height: 1.4; text-align: left; }
      .log-success { color: var(--text); }
      .log-error { color: #ff5555; }
      .log-entry svg { width: 12px; height: 12px; flex-shrink: 0; margin-top: 2px; }

      .results-list { margin: 16px 0; border-radius: 8px; border: 1px solid var(--border); height: 200px; overflow-y: auto; background: var(--input-bg); }
      .result-item { display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 12px; text-align: left; }
      .result-item:last-child { border-bottom: none; }
      .result-row { display: flex; justify-content: space-between; font-weight: 500; }
      .result-error-detail { font-size: 10px; color: #ff5555; opacity: 0.8; }

      .overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--overlay-bg); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; opacity: 0; pointer-events: none; transition: 0.3s; }
      .overlay.active { opacity: 1; pointer-events: all; }
      .confirm-modal { background: var(--bg); border: 1px solid var(--border); padding: 28px; border-radius: 16px; max-width: 300px; text-align: center; }
      .confirm-modal h3 { margin: 0 0 8px; font-size: 16px; }
      .confirm-modal p { color: var(--text-dim); font-size: 13px; margin: 0 0 24px; line-height: 1.5; }
      
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 2px; }

      .footer { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); text-align: center; font-size: 11px; color: var(--text-dim); }
      .footer a { color: var(--text-dim); text-decoration: none; font-weight: 500; transition: color 0.2s; }
      .footer a:hover { color: var(--text); }

      .toggle-group {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 4px;
        padding: 4px 0;
      }
      .toggle-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--text-dim);
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .switch {
        position: relative;
        display: inline-block;
        width: 32px;
        height: 18px;
      }
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--bg-elevated);
        transition: .2s;
        border-radius: 18px;
        border: 1px solid var(--border);
      }
      .slider:before {
        position: absolute;
        content: "";
        height: 12px;
        width: 12px;
        left: 2px;
        bottom: 2px;
        background-color: var(--text-dim);
        transition: .2s;
        border-radius: 50%;
      }
      input:checked + .slider {
        background-color: var(--text);
        border-color: var(--text);
      }
      input:checked + .slider:before {
        transform: translateX(14px);
        background-color: var(--bg);
      }

      /* Dashboard Styles */
      .dashboard-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .dashboard-controls {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 14px;
        background: var(--bg-elevated);
        border-radius: 8px;
        border: 1px solid var(--border);
      }

      .search-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--input-bg);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0 12px;
        height: 36px;
      }

      .search-bar svg {
        width: 16px;
        height: 16px;
        color: var(--text-dim);
        flex-shrink: 0;
      }

      .search-bar input {
        flex: 1;
        border: none;
        background: transparent;
        color: var(--text);
        padding: 0;
        margin: 0;
        font-size: 13px;
      }

      .search-bar input::placeholder {
        color: var(--text-dim);
      }

      .search-bar input:focus {
        outline: none;
      }

      .controls-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .select-dropdown {
        flex: 1;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--input-bg);
        color: var(--text);
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: 0.15s;
      }

      .select-dropdown:hover {
        border-color: var(--border-strong);
        background: var(--input-focus);
      }

      .select-dropdown:focus {
        outline: none;
        border-color: var(--border-strong);
        background: var(--input-focus);
      }

      .bulk-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .bulk-action-btn {
        height: 32px;
        padding: 0 10px;
        font-size: 11px;
        font-weight: 600;
        border-radius: 6px;
        border: 1px solid var(--border);
        background: var(--bg-elevated);
        color: var(--text);
        cursor: pointer;
        transition: 0.15s;
        font-family: inherit;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }

      .bulk-action-btn:hover {
        background: var(--bg-hover);
        border-color: var(--border-strong);
      }

      .bulk-action-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .bulk-action-btn svg {
        width: 12px;
        height: 12px;
      }

      .selection-info {
        font-size: 11px;
        font-weight: 700;
        color: var(--text-dim);
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 4px;
      }

      .gamepasses-list-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--input-bg);
        max-height: 450px;
        overflow-y: auto;
      }

      .gamepass-item-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-bottom: 1px solid var(--border);
        background: var(--bg-elevated);
        border-radius: 6px;
        margin: 4px;
        transition: all 0.15s;
      }

      .gamepass-item-row:last-child {
        border-bottom: none;
      }

      .gamepass-item-row:hover {
        background: var(--bg-hover);
        border-color: var(--border-strong);
      }

      .gamepass-checkbox {
        width: 18px;
        height: 18px;
        min-width: 18px;
        cursor: pointer;
        accent-color: var(--text);
      }

      .gamepass-thumbnail {
        width: 40px;
        height: 40px;
        min-width: 40px;
        border-radius: 4px;
        background: var(--bg);
        border: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        color: var(--text-dim);
      }

      .gamepass-thumbnail img {
        width: 100%;
        height: 100%;
        border-radius: 4px;
        object-fit: cover;
      }

      .gamepass-info-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .gamepass-name {
        font-weight: 600;
        font-size: 12px;
        color: var(--text);
        word-break: break-word;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .gamepass-id {
        font-size: 10px;
        color: var(--text-dim);
        font-family: monospace;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .gamepass-status-badge {
        font-size: 9px;
        font-weight: 700;
        padding: 3px 6px;
        border-radius: 3px;
        text-transform: uppercase;
        width: fit-content;
      }

      .gamepass-status-badge.on-sale {
        background: rgba(85, 255, 85, 0.15);
        color: #55ff55;
      }

      .gamepass-status-badge.off-sale {
        background: rgba(255, 85, 85, 0.15);
        color: #ff5555;
      }

      .gamepass-price-display {
        font-weight: 600;
        font-size: 12px;
        color: var(--text);
        min-width: 60px;
        text-align: right;
      }

      .gamepass-actions-column {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }

      .gamepass-action-btn {
        width: 28px;
        height: 28px;
        padding: 0;
        border-radius: 4px;
        border: 1px solid var(--border);
        background: var(--bg);
        color: var(--text-dim);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.15s;
        font-family: inherit;
      }

      .gamepass-action-btn:hover {
        background: var(--bg-hover);
        color: var(--text);
        border-color: var(--border-strong);
      }

      .gamepass-action-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .gamepass-action-btn svg {
        width: 13px;
        height: 13px;
      }

      .gamepass-item-expanded {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        background: var(--bg-hover);
        border-radius: 6px;
        border: 1px solid var(--border-strong);
      }

      .price-control-row {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .price-input {
        width: 80px;
        padding: 6px 8px;
        font-size: 12px;
        border-radius: 4px;
        border: 1px solid var(--border);
        background: var(--input-bg);
        color: var(--text);
        font-family: monospace;
      }

      .price-input:focus {
        outline: none;
        border-color: var(--border-strong);
        background: var(--input-focus);
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 200px;
        color: var(--text-dim);
        font-size: 12px;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 150px;
        color: var(--text-dim);
        font-size: 12px;
        padding: 20px;
      }

      .copy-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--text);
        color: var(--bg);
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        z-index: 99999;
        animation: slideInUp 0.3s ease-out;
      }

      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .checkbox {
        accent-color: var(--text);
        cursor: pointer;
      }
    `;
    shadowRoot.appendChild(style);

    let container = document.createElement('div');
    container.innerHTML = `
      <div class="widget" id="widget">
        <div class="header" id="widget-header">
          <div style="display:flex; align-items:center; gap:8px">
            <button class="icon-btn hidden" id="btn-back">${ICONS.chevronLeft}</button>
            <h2 id="header-label">Gamepass Creator</h2>
          </div>
          <div class="header-actions">
            <a href="https://buymeacoffee.com/andrewzeng" target="_blank" class="icon-btn" title="Donate">${ICONS.coffee}</a>
            <button class="icon-btn" id="btn-settings-toggle">${ICONS.settings}</button>
            <button class="icon-btn" id="btn-close">${ICONS.x}</button>
          </div>
        </div>
        
        <div class="content">
          <div id="section-main" class="section">
            <div class="tab-container">
              <button class="tab-button active" data-tab="create">Create</button>
              <button class="tab-button" data-tab="gamepasses">Gamepasses</button>
            </div>

            <div id="tab-create" class="tab-content">
              <div class="actions">
                <button id="btn-quick" class="btn">${ICONS.bolt} Create from presets</button>
                <button id="btn-custom-toggle" class="btn">${ICONS.plus} Custom amount</button>
                
                <div id="custom-input-group" class="input-group hidden">
                  <input type="number" id="input-amount" placeholder="Amount (e.g. 100)">
                  <div class="toggle-group" style="margin-bottom: 8px;">
                    <span class="toggle-label">Enable Regional Pricing</span>
                    <label class="switch">
                      <input type="checkbox" id="custom-regional">
                      <span class="slider"></span>
                    </label>
                  </div>
                  <button id="btn-create-custom" class="btn btn-primary">Start creation</button>
                </div>

                <button id="btn-questionnaire" class="btn">
                  <div style="display:flex; align-items:center; gap:10px; flex:1">
                    ${ICONS.clipboard} 
                    <span class="btn-text">Check Questionnaire</span>
                  </div>
                  <div class="status-dot" style="width:8px; height:8px; border-radius:50%; background:var(--border-strong)"></div>
                </button>

                <button id="btn-remove-all" class="btn" style="margin-top:4px; color:#ff5555; border-color:rgba(255,85,85,0.15)">${ICONS.trash} Wipe all passes</button>
              </div>
            </div>

            <div id="tab-gamepasses" class="tab-content hidden">
              <div class="dashboard-container">
                <div class="dashboard-controls">
                  <div class="search-bar">
                    ${ICONS.search}
                    <input type="text" id="dashboard-search" placeholder="Search by name or ID...">
                  </div>

                  <div class="controls-row">
                    <select id="dashboard-sort" class="select-dropdown">
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                      <option value="price-asc">Price (Low to High)</option>
                      <option value="price-desc">Price (High to Low)</option>
                      <option value="id-asc">ID (Ascending)</option>
                      <option value="id-desc">ID (Descending)</option>
                    </select>
                    <button id="btn-refresh-list" class="btn btn-icon" title="Refresh">${ICONS.refresh}</button>
                  </div>

                  <div class="bulk-actions">
                    <div class="selection-info">
                      <input type="checkbox" id="select-all-checkbox" class="checkbox">
                      <span id="selection-count">0 selected</span>
                    </div>
                    <button id="btn-bulk-price" class="bulk-action-btn" disabled>${ICONS.edit} Set Price</button>
                    <button id="btn-bulk-sale" class="bulk-action-btn" disabled>Toggle Sale</button>
                  </div>
                </div>

                <div id="gamepasses-list-wrapper" class="gamepasses-list-container">
                  <div class="loading-state">
                    <span>Loading gamepasses...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="section-settings" class="section hidden">
            <div style="display:flex; flex-direction:column; gap:4px">
              <div style="display:flex; justify-content:space-between; align-items:center">
                <span style="font-size:10px; font-weight:700; color:var(--text-dim); text-transform:uppercase">Pass presets</span>
                <button id="btn-reset-presets" style="background:none; border:none; padding:0; font-size:10px; color:var(--text-dim); cursor:pointer; text-decoration:underline">Reset to defaults</button>
              </div>
              <textarea id="settings-presets" placeholder="2, 5, 10, 25..."></textarea>
            </div>

            <div class="toggle-group">
              <span class="toggle-label">Regional Pricing</span>
              <label class="switch">
                <input type="checkbox" id="settings-regional">
                <span class="slider"></span>
              </label>
            </div>

            <button id="btn-save-settings" class="btn btn-primary">Save changes</button>
            <div style="margin-top:12px; font-size:10px; color:var(--text-dim); text-align:center">
              Version ${chrome.runtime.getManifest().version}
            </div>
          </div>

          <div id="section-progress" class="section hidden">
            <div class="progress-container">
              <div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
              <div class="stats">
                <span id="progress-text">0 / 0 items</span>
                <span id="progress-percent">0%</span>
              </div>
              <div id="status-log" class="log"></div>
            </div>
          </div>

          <div id="section-results" class="section hidden">
            <div id="results-list" class="results-list"></div>
            <button id="btn-done" class="btn btn-primary">${ICONS.check} Finish batch</button>
          </div>

          <div class="footer">
            Powered by <a href="https://rbxdonate.com" target="_blank">RBXDonate</a>
          </div>
        </div>
      </div>

      <div class="overlay" id="confirm-overlay">
        <div class="confirm-modal">
          <h3>Are you sure?</h3>
          <p>This will take all gamepasses in this experience off-sale. This action cannot be reversed.</p>
          <div style="display:flex; gap:10px">
            <button class="btn" id="confirm-cancel" style="flex:1; justify-content:center">Cancel</button>
            <button class="btn" id="confirm-yes" style="flex:1; justify-content:center; color:#ff5555; border-color:rgba(255,85,85,0.3)">Wipe all</button>
          </div>
        </div>
      </div>

      <div class="overlay" id="bulk-price-overlay">
        <div class="confirm-modal">
          <h3>Set Price for Selected</h3>
          <div style="text-align: left; margin: 16px 0;">
            <input type="number" id="bulk-price-input" placeholder="Enter price in Robux" min="0" max="1000000" style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--input-bg); color: var(--text); box-sizing: border-box; font-family: inherit; font-size: 13px;">
          </div>
          <div style="display:flex; gap:10px">
            <button class="btn" id="bulk-price-cancel" style="flex:1; justify-content:center">Cancel</button>
            <button class="btn btn-primary" id="bulk-price-confirm" style="flex:1; justify-content:center">Confirm</button>
          </div>
        </div>
      </div>
    `;
    shadowRoot.appendChild(container);

    elements = {
      widget: shadowRoot.getElementById('widget'),
      header: shadowRoot.getElementById('widget-header'),
      btnClose: shadowRoot.getElementById('btn-close'),
      btnBack: shadowRoot.getElementById('btn-back'),
      headerLabel: shadowRoot.getElementById('header-label'),
      btnSettingsToggle: shadowRoot.getElementById('btn-settings-toggle'),
      sectionMain: shadowRoot.getElementById('section-main'),
      sectionSettings: shadowRoot.getElementById('section-settings'),
      sectionProgress: shadowRoot.getElementById('section-progress'),
      sectionResults: shadowRoot.getElementById('section-results'),
      btnQuick: shadowRoot.getElementById('btn-quick'),
      btnCustomToggle: shadowRoot.getElementById('btn-custom-toggle'),
      customInputGroup: shadowRoot.getElementById('custom-input-group'),
      inputAmount: shadowRoot.getElementById('input-amount'),
      btnCreateCustom: shadowRoot.getElementById('btn-create-custom'),
      inputCustomRegional: shadowRoot.getElementById('custom-regional'),
      btnQuestionnaire: shadowRoot.getElementById('btn-questionnaire'),
      btnRemoveAll: shadowRoot.getElementById('btn-remove-all'),
      settingsPresets: shadowRoot.getElementById('settings-presets'),
      inputSettingsRegional: shadowRoot.getElementById('settings-regional'),
      btnResetPresets: shadowRoot.getElementById('btn-reset-presets'),
      btnSaveSettings: shadowRoot.getElementById('btn-save-settings'),
      progressFill: shadowRoot.getElementById('progress-fill'),
      progressText: shadowRoot.getElementById('progress-text'),
      progressPercent: shadowRoot.getElementById('progress-percent'),
      statusLog: shadowRoot.getElementById('status-log'),
      resultsList: shadowRoot.getElementById('results-list'),
      btnDone: shadowRoot.getElementById('btn-done'),
      confirmOverlay: shadowRoot.getElementById('confirm-overlay'),
      confirmCancel: shadowRoot.getElementById('confirm-cancel'),
      confirmYes: shadowRoot.getElementById('confirm-yes'),
      dashboardSearch: shadowRoot.getElementById('dashboard-search'),
      dashboardSort: shadowRoot.getElementById('dashboard-sort'),
      btnRefreshList: shadowRoot.getElementById('btn-refresh-list'),
      selectAllCheckbox: shadowRoot.getElementById('select-all-checkbox'),
      selectionCount: shadowRoot.getElementById('selection-count'),
      btnBulkPrice: shadowRoot.getElementById('btn-bulk-price'),
      btnBulkSale: shadowRoot.getElementById('btn-bulk-sale'),
      gamepassesListWrapper: shadowRoot.getElementById('gamepasses-list-wrapper'),
      bulkPriceOverlay: shadowRoot.getElementById('bulk-price-overlay'),
      bulkPriceInput: shadowRoot.getElementById('bulk-price-input'),
      bulkPriceCancel: shadowRoot.getElementById('bulk-price-cancel'),
      bulkPriceConfirm: shadowRoot.getElementById('bulk-price-confirm')
    };

    // Tab switching
    const tabButtons = shadowRoot.querySelectorAll('.tab-button');
    const tabContents = shadowRoot.querySelectorAll('.tab-content');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        tabContents.forEach(tc => tc.classList.add('hidden'));
        shadowRoot.getElementById(`tab-${tabName}`).classList.remove('hidden');

        if (tabName === 'gamepasses') {
          loadAndDisplayGamepasses();
        }
      });
    });

    elements.btnClose.addEventListener('click', toggleWidget);
    elements.btnBack.addEventListener('click', () => showSection('main'));
    elements.btnSettingsToggle.addEventListener('click', () => {
      showSection('settings');
    });
    elements.btnResetPresets.addEventListener('click', () => {
      elements.settingsPresets.value = DEFAULT_VALUES.join(', ');
    });
    elements.btnSaveSettings.addEventListener('click', async () => {
      const parsed = elements.settingsPresets.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
      if (parsed.length > 0) {
        state.presets = parsed;
        state.isRegionalPricingEnabled = elements.inputSettingsRegional.checked;
        await saveState();
        showSection('main');
      }
    });
    elements.btnQuick.addEventListener('click', () => startAction('create', state.presets, { isRegionalPricingEnabled: state.isRegionalPricingEnabled }));
    elements.btnCustomToggle.addEventListener('click', () => {
      elements.customInputGroup.classList.toggle('hidden');
      if (!elements.customInputGroup.classList.contains('hidden')) {
        elements.inputCustomRegional.checked = state.isRegionalPricingEnabled;
      }
    });
    elements.btnCreateCustom.addEventListener('click', () => {
      const val = parseInt(elements.inputAmount.value);
      if (val > 0) startAction('create', [val], { isRegionalPricingEnabled: elements.inputCustomRegional.checked });
    });
    elements.btnQuestionnaire.addEventListener('click', () => startAction('questionnaire'));
    elements.btnRemoveAll.addEventListener('click', () => elements.confirmOverlay.classList.add('active'));
    elements.confirmCancel.addEventListener('click', () => elements.confirmOverlay.classList.remove('active'));
    elements.confirmYes.addEventListener('click', () => {
      elements.confirmOverlay.classList.remove('active');
      startAction('remove');
    });
    elements.btnDone.addEventListener('click', () => {
      state.isCreating = false;
      state.results = [];
      state.logs = [];
      state.currentOptions = {};
      saveState();
      showSection('main');
    });

    // Dashboard event listeners
    elements.dashboardSearch.addEventListener('input', (e) => {
      GamepassDashboard.setSearchQuery(e.target.value);
      renderGamepassesList();
    });

    elements.dashboardSort.addEventListener('change', (e) => {
      GamepassDashboard.setSortBy(e.target.value);
      renderGamepassesList();
    });

    elements.btnRefreshList.addEventListener('click', async () => {
      state.gamepassesCacheTime = 0;
      await loadAndDisplayGamepasses();
    });

    elements.selectAllCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        GamepassDashboard.selectAll();
      } else {
        GamepassDashboard.deselectAll();
      }
      updateSelectionUI();
      renderGamepassesList();
    });

    elements.btnBulkPrice.addEventListener('click', () => {
      elements.bulkPriceOverlay.classList.add('active');
      elements.bulkPriceInput.value = '';
      elements.bulkPriceInput.focus();
    });

    elements.btnBulkSale.addEventListener('click', async () => {
      const selectionCount = GamepassDashboard.getSelectionCount();
      if (selectionCount === 0) {
        showNotification('No gamepasses selected', true);
        return;
      }

      elements.btnBulkSale.disabled = true;
      try {
        await GamepassDashboard.bulkToggleSale(state.targetUniverse, true, robloxFetch, addLog);
        await loadAndDisplayGamepasses();
        updateSelectionUI();
      } catch (err) {
        addLog(`Bulk action failed: ${err.message}`, 'error');
      } finally {
        elements.btnBulkSale.disabled = false;
      }
    });

    elements.bulkPriceCancel.addEventListener('click', () => {
      elements.bulkPriceOverlay.classList.remove('active');
    });

    elements.bulkPriceConfirm.addEventListener('click', async () => {
      const price = parseInt(elements.bulkPriceInput.value);
      if (isNaN(price) || price < 0 || price > 1000000) {
        showNotification('Invalid price (0-1,000,000)', true);
        return;
      }

      elements.bulkPriceConfirm.disabled = true;
      try {
        await GamepassDashboard.bulkUpdatePrice(state.targetUniverse, price, robloxFetch, addLog);
        elements.bulkPriceOverlay.classList.remove('active');
        await loadAndDisplayGamepasses();
        updateSelectionUI();
      } catch (err) {
        addLog(`Bulk action failed: ${err.message}`, 'error');
      } finally {
        elements.bulkPriceConfirm.disabled = false;
      }
    });

    elements.header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.icon-btn')) return;
      isDragging = true;
      const rect = elements.widget.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      elements.widget.style.transition = 'none';
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      elements.widget.style.left = `${e.clientX - dragOffset.x}px`;
      elements.widget.style.top = `${e.clientY - dragOffset.y}px`;
      elements.widget.style.transform = 'none';
    });
    document.addEventListener('mouseup', async () => {
      if (isDragging) {
        isDragging = false;
        elements.widget.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        
        const rect = elements.widget.getBoundingClientRect();
        state.windowPosition = { x: rect.left, y: rect.top };
        await saveState();
      }
    });
  }

  function updateSelectionUI() {
    const count = GamepassDashboard.getSelectionCount();
    const filtered = GamepassDashboard.getFiltered();
    elements.selectionCount.textContent = `${count} selected`;
    elements.selectAllCheckbox.checked = count > 0 && count === filtered.length;
    elements.btnBulkPrice.disabled = count === 0;
    elements.btnBulkSale.disabled = count === 0;
  }

  async function loadAndDisplayGamepasses() {
    try {
      await ensureUniverseLinked();
      
      // Check cache validity
      const now = Date.now();
      if (GamepassDashboard.getAll().length > 0 && (now - state.gamepassesCacheTime) < state.CACHE_DURATION) {
        renderGamepassesList();
        return;
      }

      elements.gamepassesListWrapper.innerHTML = '<div class="loading-state"><span>Loading gamepasses...</span></div>';

      await GamepassDashboard.fetchGamepasses(state.targetUniverse, robloxFetch, addLog);
      state.gamepassesCacheTime = Date.now();
      await saveState();

      renderGamepassesList();
    } catch (err) {
      elements.gamepassesListWrapper.innerHTML = `<div class="empty-state" style="color:#ff5555"><span>${err.message}</span></div>`;
    }
  }

  function renderGamepassesList() {
    const gamepasses = GamepassDashboard.getFiltered();

    if (gamepasses.length === 0) {
      elements.gamepassesListWrapper.innerHTML = '<div class="empty-state"><span>No gamepasses found</span></div>';
      updateSelectionUI();
      return;
    }

    elements.gamepassesListWrapper.innerHTML = gamepasses.map(pass => `
      <div class="gamepass-item-row" data-pass-id="${pass.id}">
        <input type="checkbox" class="gamepass-checkbox gamepass-select-checkbox" data-pass-id="${pass.id}" ${GamepassDashboard.isSelected(pass.id) ? 'checked' : ''}>
        
        <div class="gamepass-thumbnail">
          ${pass.iconImageAssetId ? `<img src="https://www.roblox.com/asset/?id=${pass.iconImageAssetId}" alt="${escapeHtml(pass.displayName || pass.name || 'Gamepass')}">` : 'ICON'}
        </div>

        <div class="gamepass-info-column">
          <div class="gamepass-name" title="${escapeHtml(pass.displayName || pass.name || 'Unnamed')}">${escapeHtml(pass.displayName || pass.name || 'Unnamed')}</div>
          <div class="gamepass-id">
            <span>ID: ${pass.id}</span>
            <button class="gamepass-action-btn copy-id-btn" data-pass-id="${pass.id}" title="Copy ID" style="width: 18px; height: 18px; padding: 0; margin: 0; border: none; background: transparent; color: var(--text-dim);">${ICONS.copy}</button>
          </div>
        </div>

        <div class="gamepass-status-badge ${pass.isForSale ? 'on-sale' : 'off-sale'}">
          ${pass.isForSale ? 'For Sale' : 'Off Sale'}
        </div>

        <div class="gamepass-price-display">
          ${pass.isForSale ? GamepassDashboard.formatRobux(pass.price) + ' R$' : '—'}
        </div>

        <div class="gamepass-actions-column">
          <button class="gamepass-action-btn toggle-sale-btn" data-pass-id="${pass.id}" title="${pass.isForSale ? 'Remove from Sale' : 'Put on Sale'}">${pass.isForSale ? ICONS.x : ICONS.check}</button>
          <button class="gamepass-action-btn edit-price-btn" data-pass-id="${pass.id}" title="Edit Price">${ICONS.edit}</button>
        </div>
      </div>
    `).join('');

    // Attach event listeners
    shadowRoot.querySelectorAll('.gamepass-select-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const passId = parseInt(checkbox.dataset.passId);
        GamepassDashboard.toggleSelectPass(passId);
        updateSelectionUI();
      });
    });

    shadowRoot.querySelectorAll('.copy-id-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const passId = btn.dataset.passId;
        copyToClipboard(passId);
      });
    });

    shadowRoot.querySelectorAll('.toggle-sale-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const passId = parseInt(btn.dataset.passId);
        const pass = GamepassDashboard.getAll().find(p => p.id === passId);
        if (!pass) return;

        btn.disabled = true;
        try {
          await GamepassDashboard.toggleIndividualSale(state.targetUniverse, passId, !pass.isForSale, robloxFetch, addLog);
          showNotification(pass.isForSale ? 'Removed from sale' : 'Put on sale');
          await loadAndDisplayGamepasses();
        } catch (err) {
          showNotification(`Error: ${err.message}`, true);
        } finally {
          btn.disabled = false;
        }
      });
    });

    shadowRoot.querySelectorAll('.edit-price-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const passId = parseInt(btn.dataset.passId);
        const pass = GamepassDashboard.getAll().find(p => p.id === passId);
        if (!pass) return;

        const newPrice = prompt(`Enter new price for "${pass.displayName || pass.name}" (current: ${pass.price || 0} R$):`, pass.price || 0);
        if (newPrice === null) return;

        const price = parseInt(newPrice);
        if (isNaN(price) || price < 0 || price > 1000000) {
          showNotification('Invalid price (0-1,000,000)', true);
          return;
        }

        btn.disabled = true;
        try {
          await GamepassDashboard.updateIndividualPrice(state.targetUniverse, passId, price, pass.isForSale, robloxFetch, addLog);
          showNotification('Price updated');
          await loadAndDisplayGamepasses();
        } catch (err) {
          showNotification(`Error: ${err.message}`, true);
        } finally {
          btn.disabled = false;
        }
      });
    });

    updateSelectionUI();
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Copied to clipboard!');
    }).catch(() => {
      showNotification('Failed to copy', true);
    });
  }

  function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = message;
    notification.style.background = isError ? '#ff5555' : 'var(--text)';
    notification.style.color = isError ? '#fff' : 'var(--bg)';
    shadowRoot.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 2000);
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  function applyWidgetState() {
    if (state.isOpen) {
      if (state.windowPosition) {
        elements.widget.style.left = `${state.windowPosition.x}px`;
        elements.widget.style.top = `${state.windowPosition.y}px`;
        elements.widget.style.transform = 'scale(1)';
      } else {
        elements.widget.style.left = '50%';
        elements.widget.style.top = '50%';
        elements.widget.style.transform = 'translate(-50%, -50%) scale(1)';
      }
      elements.widget.classList.add('open');
      refreshQuestionnaireStatus();
    } else {
      elements.widget.classList.remove('open');
    }
  }

  async function toggleWidget() {
    state.isOpen = !state.isOpen;
    applyWidgetState();
    await saveState();
  }

  async function showSection(name) {
    state.currentSection = name;
    elements.sectionMain.classList.add('hidden');
    elements.sectionSettings.classList.add('hidden');
    elements.sectionProgress.classList.add('hidden');
    elements.sectionResults.classList.add('hidden');
    elements.btnBack.classList.add('hidden');
    elements.headerLabel.textContent = 'Gamepass Creator';
    if (name === 'settings') {
      elements.btnBack.classList.remove('hidden');
      elements.headerLabel.textContent = 'Settings';
      if (elements.settingsPresets) {
        elements.settingsPresets.value = state.presets.join(', ');
      }
      if (elements.inputSettingsRegional) {
        elements.inputSettingsRegional.checked = state.isRegionalPricingEnabled;
      }
    }
    const target = shadowRoot.getElementById(`section-${name}`);
    if (target) target.classList.remove('hidden');
    await saveState();
  }

  function updateUI() {
    if (state.isCreating) {
      showSection('progress');
      const progress = state.total > 0 ? (state.progress / state.total) * 100 : 0;
      elements.progressFill.style.width = `${progress}%`;
      elements.progressText.textContent = `${state.progress} / ${state.total} items`;
      elements.progressPercent.textContent = `${Math.round(progress)}%`;
      renderLogs();
    } else if (state.results.length > 0) {
      showSection('results');
      elements.resultsList.innerHTML = state.results.map(r => `
        <div class="result-item">
          <div class="result-row">
            <span>${r.name}</span>
            <span style="color:${r.success ? 'var(--text)' : '#ff5555'}; display:flex; align-items:center; gap:4px">
              ${r.success ? ICONS.check : ICONS.x} ${r.success ? 'Success' : 'Failed'}
            </span>
          </div>
          ${!r.success && r.error ? `<div class="result-error-detail">${r.error}</div>` : ''}
        </div>
      `).join('');
    } else {
      showSection(state.currentSection || 'main');
    }
  }

  function addLog(msg, type = 'info') {
    state.logs.push({ msg, type });
    if (state.logs.length > 50) state.logs.shift();
    renderLogs();
    saveState();
  }

  function renderLogs() {
    elements.statusLog.innerHTML = state.logs.map(log => {
      let icon = '';
      if (log.type === 'success') icon = ICONS.check;
      if (log.type === 'error') icon = ICONS.x;
      return `<div class="log-entry log-${log.type}">${icon} <span>${log.msg}</span></div>`;
    }).join('');
    elements.statusLog.scrollTop = elements.statusLog.scrollHeight;
  }

  async function getRobloxErrorMessage(response) {
    try {
      const data = await response.clone().json();
      if (data.errorMessage) return data.errorMessage;
      if (data.errors && data.errors.length > 0) return data.errors[0].message;
      if (data.message) return data.message;
    } catch (e) {}
    return `Status ${response.status}`;
  }

  async function robloxFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (state.csrfToken) options.headers['x-csrf-token'] = state.csrfToken;
    options.credentials = 'include';
    let response = await fetch(url, options);
    if (response.status === 403) {
      const newToken = response.headers.get('x-csrf-token');
      if (newToken) {
        state.csrfToken = newToken;
        options.headers['x-csrf-token'] = newToken;
        response = await fetch(url, options);
      }
    }
    return response;
  }

  async function startAction(action, data = [], options = {}) {
    state.isCreating = true;
    state.currentAction = action;
    state.currentBatch = data;
    state.currentOptions = options;
    state.currentPassId = null;
    state.progress = 0;
    state.total = data.length;
    state.results = [];
    state.logs = [];
    showSection('progress');
    updateUI();
    addLog('Process started', 'success');
    await saveState();
    runActionLoop();
  }

  async function resumeAction() {
    addLog('Session restored', 'success');
    runActionLoop();
  }

  async function runActionLoop() {
    try {
      if (!state.targetUniverse) {
        addLog('Connecting to API...', 'info');
        const gamesResp = await robloxFetch(`https://games.roblox.com/v2/users/${state.userId}/games?sortOrder=Asc&limit=10`);
        if (!gamesResp.ok) throw new Error(await getRobloxErrorMessage(gamesResp));
        const games = await gamesResp.json();
        if (!games.data || games.data.length === 0) throw new Error('No games found');
        const game = games.data[0];
        const univResp = await robloxFetch(`https://apis.roblox.com/universes/v1/places/${game.rootPlace.id}/universe`);
        if (!univResp.ok) throw new Error(await getRobloxErrorMessage(univResp));
        const univData = await univResp.json();
        state.targetUniverse = univData.universeId;
        addLog(`Linked to: ${game.name}`, 'success');
        await saveState();
      }
      if (state.currentAction === 'create') await createLoop();
      else if (state.currentAction === 'questionnaire') await questionnaireLoop();
      else await removeLoop();
    } catch (err) {
      addLog(err.message, 'error');
      state.isCreating = false;
      saveState();
      updateUI();
    }
  }

  async function performWithRetry(task, label) {
    let lastError;
    for (let attempt = 0; attempt <= state.maxRetries; attempt++) {
      try {
        if (attempt > 0) addLog(`Retrying ${label}...`, 'info');
        return await task();
      } catch (err) {
        lastError = err;
        if (attempt < state.maxRetries) await new Promise(r => setTimeout(r, 800));
      }
    }
    throw lastError;
  }

  async function createLoop() {
    const items = [...state.currentBatch];
    for (let i = state.progress; i < items.length; i++) {
      const amount = items[i];
      try {
        let passId = state.currentPassId;

        if (!passId) {
          passId = await performWithRetry(async () => {
            const form = new FormData();
            form.append('name', amount.toString());
            form.append('universeId', state.targetUniverse.toString());
            const resp = await robloxFetch(`https://apis.roblox.com/game-passes/v1/universes/${state.targetUniverse}/game-passes`, { method: 'POST', body: form });
            if (!resp.ok) throw new Error(await getRobloxErrorMessage(resp));
            const data = await resp.json();
            return data.gamePassId;
          }, `${amount} R$ creation`);

          state.currentPassId = passId;
          await saveState();
        }

        await performWithRetry(async () => {
          const isRegional = !!state.currentOptions?.isRegionalPricingEnabled;
          const saleForm = new FormData();
          saleForm.append('isForSale', 'true');
          saleForm.append('price', amount.toString());
          saleForm.append('isRegionalPricingEnabled', isRegional.toString());

          const resp = await robloxFetch(`https://apis.roblox.com/game-passes/v1/universes/${state.targetUniverse}/game-passes/${passId}`, { 
            method: 'PATCH',
            body: saleForm
          });
          if (!resp.ok) {
            const errorMsg = await getRobloxErrorMessage(resp);
            if (errorMsg.includes('on-sale limit')) {
              const limitErr = new Error('LIMIT_REACHED');
              limitErr.detail = 'You have reached the maximum limit of 50 active gamepasses. Please remove some existing passes before creating more.';
              throw limitErr;
            }
            throw new Error(errorMsg);
          }
        }, `${amount} R$ listing`);

        state.results.push({ name: `${amount} R$`, success: true });
        addLog(`Created ${amount} R$`, 'success');
        state.currentPassId = null;
      } catch (err) {
        if (err.message === 'LIMIT_REACHED') {
          addLog('CRITICAL: Gamepass limit reached (50/50). Stopping task.', 'error');
          addLog('Tip: Use "Wipe all passes" to clear space.', 'info');
          state.results.push({ name: `${amount} R$`, success: false, error: 'Roblox limit reached (50 passes)' });
          state.currentPassId = null;
          break;
        }
        addLog(`${amount} R$ failed: ${err.message}`, 'error');
        state.results.push({ name: `${amount} R$`, success: false, error: err.message });
        state.currentPassId = null;
      }
      state.progress = i + 1;
      await saveState();
      updateUI();
      await new Promise(r => setTimeout(r, 400));
    }
    state.isCreating = false;
    await saveState();
    updateUI();
  }

  async function questionnaireLoop() {
    state.total = 1;
    state.progress = 0;
    updateUI();
    
    try {
      addLog('Fetching questionnaire ID...', 'info');
      const qResp = await robloxFetch(`https://apis.roblox.com/experience-questionnaire/v1/questionnaires/${state.targetUniverse}/latest`);
      if (!qResp.ok) throw new Error(await getRobloxErrorMessage(qResp));
      const qData = await qResp.json();
      const questionnaireId = qData.questionnaireId;
      addLog('Questionnaire ID retrieved', 'success');

      addLog('Fetching questionnaire structure...', 'info');
      const detailsResp = await robloxFetch(`https://apis.roblox.com/experience-questionnaire/v1/questionnaires/${questionnaireId}?localeCode=en_us`);
      if (!detailsResp.ok) throw new Error(await getRobloxErrorMessage(detailsResp));
      const detailsData = await detailsResp.json();
      
      const answers = [];
      const questionnaire = detailsData.questionnaire;
      if (questionnaire && questionnaire.sections) {
        questionnaire.sections.forEach(section => {
          if (section.questions) {
            section.questions.forEach(question => {
              const noOption = question.options.find(opt => opt.text.trim().toLowerCase() === 'no');
              if (noOption) {
                answers.push({
                  questionId: question.id,
                  value: JSON.stringify(noOption.id)
                });
              }
            });
          }
        });
      }

      if (answers.length === 0) throw new Error('Could not find any "No" options in the questionnaire');
      addLog(`Found ${answers.length} questions to answer "No"`, 'info');

      addLog('Submitting responses...', 'info');
      const sResp = await robloxFetch(`https://apis.roblox.com/experience-questionnaire/v1/responses/${state.targetUniverse}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaireId, response: { answers } })
      });

      if (!sResp.ok) throw new Error(await getRobloxErrorMessage(sResp));
      
      addLog('Questionnaire submitted successfully!', 'success');
      state.results.push({ name: 'Experience Questionnaire', success: true });
      state.progress = 1;
      refreshQuestionnaireStatus();
    } catch (err) {
      addLog(`Questionnaire failed: ${err.message}`, 'error');
      state.results.push({ name: 'Experience Questionnaire', success: false, error: err.message });
    }
    
    state.isCreating = false;
    await saveState();
    updateUI();
  }

  async function removeLoop() {
    addLog('Scanning experience...', 'info');
    const resp = await robloxFetch(`https://apis.roblox.com/game-passes/v1/universes/${state.targetUniverse}/game-passes?passView=Full&pageSize=100`);
    if (!resp.ok) throw new Error(await getRobloxErrorMessage(resp));
    const data = await resp.json();
    const onsale = (data.gamePasses || []).filter(p => p.isForSale);
    state.total = onsale.length;
    state.progress = 0;
    if (onsale.length === 0) addLog('No on-sale passes found', 'success');
    for (let i = 0; i < onsale.length; i++) {
      const pass = onsale[i];
      try {
        await performWithRetry(async () => {
          const form = new FormData();
          form.append('isForSale', 'false');
          const resp = await robloxFetch(`https://apis.roblox.com/game-passes/v1/universes/${state.targetUniverse}/game-passes/${pass.id}`, { 
            method: 'PATCH',
            body: form 
          });
          if (!resp.ok) throw new Error(await getRobloxErrorMessage(resp));
        }, `removal of ${pass.displayName}`);
        state.results.push({ name: pass.displayName, success: true });
        addLog(`Removed: ${pass.displayName}`, 'success');
      } catch (err) {
        addLog(`Wipe failed: ${pass.displayName} - ${err.message}`, 'error');
        state.results.push({ name: pass.displayName, success: false, error: err.message });
      }
      state.progress = i + 1;
      await saveState();
      updateUI();
      await new Promise(r => setTimeout(r, 200));
    }
    state.isCreating = false;
    await saveState();
    updateUI();
  }

  function waitForBody() {
    if (document.body) {
      init();
    } else {
      const bodyObserver = new MutationObserver((mutations, observer) => {
        if (document.body) {
          observer.disconnect();
          init();
        }
      });
      bodyObserver.observe(document.documentElement, { childList: true });
    }
  }

  waitForBody();
  
  const observer = new MutationObserver(() => {
    if (document.body && !document.getElementById('rbx-gamepass-creator-nav-item')) injectNavbarButton();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
