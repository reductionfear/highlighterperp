// Cross-browser compatibility - use chrome API in Chrome, browser API in Firefox
const browserAPI = (() => {
  if (typeof browser !== 'undefined') {
    return browser;
  }
  if (typeof chrome !== 'undefined') {
    return chrome;
  }
  throw new Error('Neither browser nor chrome API is available');
})();

// Detect browser type
const isFirefox = typeof browser !== 'undefined';
const isChrome = !isFirefox && typeof chrome !== 'undefined';

// 테마 변경 감지 및 처리
function initializeThemeWatcher() {
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // 초기 테마 적용
  updateTheme(darkModeQuery.matches);
  
  // 테마 변경 감지
  darkModeQuery.addEventListener('change', (e) => {
    updateTheme(e.matches);
  });
}

function updateTheme(isDark) {
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

// Function to get messages for multi-language support
function getMessage(key, defaultValue = '') {
  if (browserAPI.i18n) {
    return browserAPI.i18n.getMessage(key) || defaultValue;
  }
  return defaultValue;
}

// Change text of HTML elements to multi-language
function localizeStaticElements() {
  const elementsToLocalize = document.querySelectorAll('[data-i18n]');
  elementsToLocalize.forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = getMessage(key, element.textContent);
  });
  
  // Handle data-i18n-title attributes
  const elementsWithTitle = document.querySelectorAll('[data-i18n-title]');
  elementsWithTitle.forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = getMessage(key, element.title);
  });
}

// Load and display current shortcuts
async function loadShortcuts() {
  const shortcutsList = document.getElementById('shortcuts-list');
  shortcutsList.innerHTML = '';

  try {
    const commands = await browserAPI.commands.getAll();
    
    // Filter and display highlight commands
    const highlightCommands = commands.filter(cmd => cmd.name.startsWith('highlight_custom_'));
    
    if (highlightCommands.length === 0) {
      shortcutsList.innerHTML = '<div class="shortcut-item"><span>No keyboard shortcuts configured.</span></div>';
      return;
    }

    highlightCommands.forEach(command => {
      const item = document.createElement('div');
      item.className = 'shortcut-item';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'shortcut-name';
      nameSpan.textContent = command.description || command.name;

      const keySpan = document.createElement('span');
      keySpan.className = 'shortcut-key';
      
      if (command.shortcut) {
        keySpan.textContent = command.shortcut;
      } else {
        keySpan.textContent = getMessage('notSet', 'Not set');
        keySpan.classList.add('not-set');
      }

      item.appendChild(nameSpan);
      item.appendChild(keySpan);
      shortcutsList.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading shortcuts:', error);
    shortcutsList.innerHTML = '<div class="shortcut-item"><span>Error loading shortcuts.</span></div>';
  }
}

// Update info box based on browser type
function updateInfoBox() {
  const infoBox = document.getElementById('info-box');
  
  if (isFirefox) {
    infoBox.innerHTML = getMessage('firefoxShortcutsInfo', 
      'To customize keyboard shortcuts in Firefox:<br/>1. Navigate to <strong>about:addons</strong><br/>2. Click the gear icon and select "Manage Extension Shortcuts"<br/>3. Find "Marks: Text Highlighter" and customize your shortcuts');
  } else {
    infoBox.innerHTML = getMessage('chromeShortcutsInfo',
      'To customize keyboard shortcuts in Chrome:<br/>1. Click the "Open Chrome Shortcuts" button below, or<br/>2. Navigate to <strong>chrome://extensions/shortcuts</strong><br/>3. Find "Marks: Text Highlighter" and customize your shortcuts');
  }
}

// Open browser shortcuts page
function openShortcutsPage() {
  if (isFirefox) {
    browserAPI.tabs.create({ url: 'about:addons' });
  } else {
    browserAPI.tabs.create({ url: 'chrome://extensions/shortcuts' });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Initialize theme watcher
  initializeThemeWatcher();
  
  // 페이지 로드 완료 후 transition 활성화
  setTimeout(() => {
    document.body.classList.remove('preload');
  }, 50);

  // Localize static elements
  localizeStaticElements();
  
  // Update info box
  updateInfoBox();
  
  // Load shortcuts
  loadShortcuts();
  
  // Handle open shortcuts button
  document.getElementById('open-shortcuts-btn').addEventListener('click', openShortcutsPage);
});
