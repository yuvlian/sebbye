/**
 * sebbye Content Script
 * 
 * Injects and manages the SEB-style top and bottom bars.
 * Not really 1:1 but its good enough methinks
 * TODO: tidy this shit pls
 */

interface SebStatus {
  enabled: boolean;
  sebDictionnary?: Record<string, unknown>;
  sebStartUrl?: string;
  rqUrlsFilter?: string[];
  errorMsg?: string;
  settings?: {
    displayFakeBars: boolean;
    displayArrows: boolean;
  };
}

let topBarHost: HTMLDivElement | null = null;
let bottomBarHost: HTMLDivElement | null = null;
let layoutStyleElement: HTMLStyleElement | null = null;
let clockIntervalId: number | null = null;

const LAYOUT_STYLES = `
  html {
    overflow: hidden !important;
    height: 100% !important;
  }
  body {
    margin-top: 40px !important;
    margin-bottom: 40px !important;
    height: calc(100% - 80px) !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    box-sizing: border-box !important;
    transform: translate(0, 0) !important;
  }
`;

const STYLES = `
  * {
    box-sizing: border-box !important;
    margin: 0 !important;
    padding: 0 !important;
    font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
    user-select: none !important;
  }

  #seb-top-bar, #seb-bottom-bar {
    width: 100% !important;
    height: 40px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 0 14px !important;
  }

  #seb-top-bar {
    background-color: #f6f6f6 !important;
    border-bottom: 1px solid #d9d9d9 !important;
  }

  #seb-bottom-bar {
    background-color: #ededed !important;
    border-top: 1px solid #cccccc !important;
  }

  .seb-btn {
    background: none !important;
    border: none !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #2e2e2e !important;
    transition: opacity 0.2s !important;
    outline: none !important;
    height: 36px !important;
    width: 36px !important;
    margin: 2px 0 !important;
  }

  .seb-btn:hover {
    opacity: 0.7 !important;
  }

  .seb-btn:disabled {
    cursor: default !important;
  }

  .seb-btn:disabled svg {
    stroke: #cccccc !important;
  }

  .seb-nav-group {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  }

  .seb-logo {
    height: 24px !important;
    width: 24px !important;
    object-fit: contain !important;
  }

  .seb-right-controls {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    height: 100% !important;
  }

  .seb-indicator {
    display: flex !important;
    align-items: center;
  }

  .seb-clock-container {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    min-width: 68px !important;
    gap: 2px !important;
  }

  .seb-time {
    font-weight: 600 !important;
    font-size: 13px !important;
    color: #2e2e2e !important;
    line-height: 1 !important;
  }

  .seb-date {
    font-size: 11px !important;
    color: #2e2e2e !important;
    line-height: 1 !important;
  }

  .seb-power-btn {
    color: #2e2e2e !important;
    height: 36px !important;
    width: 36px !important;
  }

  .seb-power-btn:hover {
    opacity: 0.7 !important;
  }
`;

function updateClock(timeEl: HTMLElement, dateEl: HTMLElement) {
  const now = new Date();

  // HH:mm
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  timeEl.textContent = `${hours}:${minutes}`;

  // DD-MM-YYYY
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  dateEl.textContent = `${day}-${month}-${year}`;
}

function initBattery(batteryLevelRect: SVGRectElement) {
  const updateBatteryStatus = (battery: any) => {
    // battery level goes from 0 to 1, svg width goes from 0 to 11
    const level = battery.level;
    const width = Math.round(level * 11);
    batteryLevelRect.setAttribute('width', String(width));

    if (battery.charging) {
      // normally there would be a plug icon but idgaf
      batteryLevelRect.style.fill = '#2b8a3e';
    } else if (level <= 0.2) {
      batteryLevelRect.style.fill = '#e03131';
    } else {
      batteryLevelRect.style.fill = '#2b8a3e';
    }
  };

  const nav = navigator as any;
  if (nav.getBattery) {
    nav.getBattery().then((battery: any) => {
      updateBatteryStatus(battery);
      battery.addEventListener('levelchange', () => updateBatteryStatus(battery));
      battery.addEventListener('chargingchange', () => updateBatteryStatus(battery));
    });
  } else {
    batteryLevelRect.setAttribute('width', '11');
    batteryLevelRect.style.fill = '#2b8a3e';
  }
}

function injectUI() {
  if (topBarHost || bottomBarHost) return;

  const canGoBack = window.history.length > 1 && document.referrer !== '';
  const canGoForward = sessionStorage.getItem('seb_can_forward') === 'true';

  // inject scroll constraints
  layoutStyleElement = document.createElement('style');
  layoutStyleElement.id = 'seb-layout-styles';
  layoutStyleElement.textContent = LAYOUT_STYLES;
  (document.head || document.documentElement).appendChild(layoutStyleElement);

  // create topBarHost & shadow root
  topBarHost = document.createElement('div');
  topBarHost.id = 'seb-top-bar-host';
  topBarHost.style.setProperty('position', 'fixed', 'important');
  topBarHost.style.setProperty('left', '0', 'important');
  topBarHost.style.setProperty('top', '0', 'important');
  topBarHost.style.setProperty('width', '100%', 'important');
  topBarHost.style.setProperty('height', '40px', 'important');
  topBarHost.style.setProperty('z-index', '2147483647', 'important');
  topBarHost.style.setProperty('display', 'block', 'important');

  const topShadow = topBarHost.attachShadow({ mode: 'open' });

  // inject styles and content to top shadow
  const topStyle = document.createElement('style');
  topStyle.textContent = STYLES;
  topShadow.appendChild(topStyle);

  const topContent = document.createElement('div');
  topContent.id = 'seb-top-bar';
  topContent.innerHTML = `
    <div class="seb-nav-group">
      <button class="seb-btn" id="seb-back-btn" title="Back" ${!canGoBack ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="#2e2e2e" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button class="seb-btn" id="seb-forward-btn" title="Forward" ${!canGoForward ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="#2e2e2e" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
      <button class="seb-btn" id="seb-reload-btn" title="Reload">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2e2e2e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6"></path>
          <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l.73-1.19"></path>
        </svg>
      </button>
    </div>
    <button class="seb-btn" id="seb-menu-btn" title="Menu">
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="#2e2e2e" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>
  `;
  topShadow.appendChild(topContent);

  // create bottomBarHost & shadow root
  bottomBarHost = document.createElement('div');
  bottomBarHost.id = 'seb-bottom-bar-host';
  bottomBarHost.style.setProperty('position', 'fixed', 'important');
  bottomBarHost.style.setProperty('left', '0', 'important');
  bottomBarHost.style.setProperty('bottom', '0', 'important');
  bottomBarHost.style.setProperty('width', '100%', 'important');
  bottomBarHost.style.setProperty('height', '40px', 'important');
  bottomBarHost.style.setProperty('z-index', '2147483647', 'important');
  bottomBarHost.style.setProperty('display', 'block', 'important');

  const bottomShadow = bottomBarHost.attachShadow({ mode: 'open' });

  // inject styles and content to bottom shadow
  const bottomStyle = document.createElement('style');
  bottomStyle.textContent = STYLES;
  bottomShadow.appendChild(bottomStyle);

  // SEB github org pfp url
  const iconUrl = 'https://avatars.githubusercontent.com/u/13450095?s=200&v=4';
  const bottomContent = document.createElement('div');
  bottomContent.id = 'seb-bottom-bar';
  bottomContent.innerHTML = `
    <img src="${iconUrl}" class="seb-logo" alt="SEB Logo" />
    <div class="seb-right-controls">
      <div class="seb-indicator seb-battery-container" title="Battery Status">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <rect x="2" y="7" width="16" height="10" rx="1.5" ry="1.5" fill="none" stroke="#2e2e2e" stroke-width="1.8"></rect>
          <path d="M20 10v4" stroke="#2e2e2e" stroke-width="1.8" stroke-linecap="round"></path>
          <rect id="seb-battery-level-rect" x="4.5" y="9.5" width="11" height="5" rx="0.5" ry="0.5" fill="#2b8a3e"></rect>
        </svg>
      </div>
      <div class="seb-indicator" title="Volume">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#2e2e2e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#2e2e2e"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      </div>
      <div class="seb-clock-container">
        <span class="seb-time" id="seb-clock-time">--:--</span>
        <span class="seb-date" id="seb-clock-date">--- --- ----</span>
      </div>
      <button class="seb-btn seb-power-btn" id="seb-exit-btn" title="Exit Safe Exam Browser Mode">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#2e2e2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
          <line x1="12" y1="2" x2="12" y2="12"></line>
        </svg>
      </button>
    </div>
  `;
  bottomShadow.appendChild(bottomContent);

  // append hosts directly to documentElement to avoid body creation timing issues
  document.documentElement.appendChild(topBarHost);
  document.documentElement.appendChild(bottomBarHost);

  // set up event listeners (scoping to shadow DOM)
  topShadow.getElementById('seb-back-btn')?.addEventListener('click', () => {
    sessionStorage.setItem('seb_can_forward', 'true');
    window.history.back();
  });
  topShadow.getElementById('seb-forward-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem('seb_can_forward');
    window.history.forward();
  });
  topShadow.getElementById('seb-reload-btn')?.addEventListener('click', () => window.location.reload());

  // power button: disable the SEB mode
  // TODO: actually make this do something useful. maybe close the browser instead?
  bottomShadow.getElementById('seb-exit-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to exit Safe Exam Browser mode?')) {
      chrome.runtime.sendMessage({ action: 'disable' });
    }
  });

  const timeEl = bottomShadow.getElementById('seb-clock-time');
  const dateEl = bottomShadow.getElementById('seb-clock-date');
  if (timeEl && dateEl) {
    updateClock(timeEl, dateEl);
    clockIntervalId = window.setInterval(() => updateClock(timeEl, dateEl), 1000);
  }

  const batteryRect = bottomShadow.getElementById('seb-battery-level-rect') as unknown as SVGRectElement;
  if (batteryRect) {
    initBattery(batteryRect);
  }
}

function removeUI() {
  if (topBarHost) {
    topBarHost.remove();
    topBarHost = null;
  }
  if (bottomBarHost) {
    bottomBarHost.remove();
    bottomBarHost = null;
  }
  if (clockIntervalId !== null) {
    clearInterval(clockIntervalId);
    clockIntervalId = null;
  }

  if (layoutStyleElement) {
    layoutStyleElement.remove();
    layoutStyleElement = null;
  }
}

function updateUI(status: SebStatus) {
  const shouldShowBars = status && status.enabled && (!status.settings || status.settings.displayFakeBars);
  if (shouldShowBars) {
    injectUI();
    const displayArrows = !status.settings || status.settings.displayArrows;
    if (topBarHost) {
      const topShadow = topBarHost.shadowRoot;
      if (topShadow) {
        const backBtn = topShadow.getElementById('seb-back-btn');
        const forwardBtn = topShadow.getElementById('seb-forward-btn');
        if (backBtn && forwardBtn) {
          backBtn.style.setProperty('display', displayArrows ? 'flex' : 'none', 'important');
          forwardBtn.style.setProperty('display', displayArrows ? 'flex' : 'none', 'important');
        }
      }
    }
  } else {
    removeUI();
  }
}

chrome.runtime.sendMessage({ action: 'getStatus' }, (status: SebStatus) => {
  updateUI(status);
});

chrome.runtime.onMessage.addListener((message: any) => {
  if (message.action === 'statusChanged') {
    updateUI(message.status);
  }
});
