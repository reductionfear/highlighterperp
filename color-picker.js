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

// Maximum number of custom colors allowed
const MAX_CUSTOM_COLORS = 20;

// Soothing preset colors
const PRESET_COLORS = [
  { name: 'Lavender', color: '#E6E6FA' },
  { name: 'Honeydew', color: '#F0FFF0' },
  { name: 'Misty Rose', color: '#FFE4E1' },
  { name: 'Light Cyan', color: '#E0FFFF' },
  { name: 'Thistle', color: '#D8BFD8' },
  { name: 'Powder Blue', color: '#B0E0E6' },
  { name: 'Pale Green', color: '#98FB98' },
  { name: 'Peach Puff', color: '#FFDAB9' },
  { name: 'Wheat', color: '#F5DEB3' },
  { name: 'Mint Cream', color: '#F5FFFA' },
  { name: 'Alice Blue', color: '#F0F8FF' },
  { name: 'Seashell', color: '#FFF5EE' },
  { name: 'Linen', color: '#FAF0E6' },
  { name: 'Cornsilk', color: '#FFF8DC' },
  { name: 'Blanched Almond', color: '#FFEBCD' }
];

// Current HSV state
let currentHue = 0;
let currentSaturation = 80;
let currentValue = 80;

// Theme change detection and handling
function initializeThemeWatcher() {
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Apply initial theme
  updateTheme(darkModeQuery.matches);
  
  // Detect theme change
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

// HSV to RGB conversion
function hsvToRgb(h, s, v) {
  h = h / 360;
  s = s / 100;
  v = v / 100;
  
  const c = v * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = v - c;
  
  let r, g, b;
  
  if (h >= 0 && h < 1/6) {
    r = c; g = x; b = 0;
  } else if (h >= 1/6 && h < 2/6) {
    r = x; g = c; b = 0;
  } else if (h >= 2/6 && h < 3/6) {
    r = 0; g = c; b = x;
  } else if (h >= 3/6 && h < 4/6) {
    r = 0; g = x; b = c;
  } else if (h >= 4/6 && h < 5/6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

// RGB to Hex conversion
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

// Get current color as hex
function getCurrentColorHex() {
  const rgb = hsvToRgb(currentHue, currentSaturation, currentValue);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

// Update color preview
function updateColorPreview() {
  const hex = getCurrentColorHex();
  const colorPreview = document.getElementById('colorPreview');
  const colorHex = document.getElementById('colorHex');
  
  if (colorPreview) colorPreview.style.backgroundColor = hex;
  if (colorHex) colorHex.textContent = hex;
}

// Update saturation-value picker background
function updateSVBackground() {
  const svPicker = document.getElementById('svPicker');
  if (svPicker) {
    svPicker.style.background = `
      linear-gradient(to bottom, transparent 0%, black 100%),
      linear-gradient(to right, white 0%, hsl(${currentHue}, 100%, 50%) 100%)`;
  }
}

// Initialize HSV sliders
function initHSVSliders() {
  const hueSlider = document.getElementById('hueSlider');
  const hueHandle = document.getElementById('hueHandle');
  const svPicker = document.getElementById('svPicker');
  const svHandle = document.getElementById('svHandle');
  
  if (!hueSlider || !hueHandle || !svPicker || !svHandle) return;
  
  let isDraggingHue = false;
  let isDraggingSV = false;
  
  // Hue slider events
  function updateHue(e) {
    const rect = hueSlider.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    currentHue = (x / rect.width) * 360;
    hueHandle.style.left = `${x}px`;
    updateSVBackground();
    updateColorPreview();
  }
  
  hueSlider.addEventListener('mousedown', (e) => {
    isDraggingHue = true;
    updateHue(e);
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDraggingHue) updateHue(e);
    if (isDraggingSV) updateSV(e);
  });
  
  document.addEventListener('mouseup', () => {
    isDraggingHue = false;
    isDraggingSV = false;
  });
  
  // Saturation-Value picker events
  function updateSV(e) {
    const rect = svPicker.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    
    currentSaturation = (x / rect.width) * 100;
    currentValue = 100 - (y / rect.height) * 100;
    
    svHandle.style.left = `${x}px`;
    svHandle.style.top = `${y}px`;
    updateColorPreview();
  }
  
  svPicker.addEventListener('mousedown', (e) => {
    isDraggingSV = true;
    updateSV(e);
  });
  
  // Initial setup
  updateSVBackground();
  updateColorPreview();
  
  // Set initial handle positions
  setTimeout(() => {
    const svRect = svPicker.getBoundingClientRect();
    const initialX = svRect.width * (currentSaturation / 100);
    const initialY = svRect.height * (1 - currentValue / 100);
    svHandle.style.left = `${initialX}px`;
    svHandle.style.top = `${initialY}px`;
  }, 10);
}

// Initialize preset colors grid
function initPresetColors() {
  const presetGrid = document.getElementById('presetGrid');
  if (!presetGrid) return;
  
  presetGrid.innerHTML = '';
  
  PRESET_COLORS.forEach(preset => {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'preset-color';
    colorDiv.style.backgroundColor = preset.color;
    colorDiv.title = preset.name;
    colorDiv.addEventListener('click', () => addColor(preset.color));
    presetGrid.appendChild(colorDiv);
  });
}

// Load custom colors from storage
async function loadCustomColors() {
  try {
    const result = await browserAPI.storage.local.get(['customColors']);
    const customColors = result.customColors || [];
    displayCustomColors(customColors);
    updateColorLimitInfo(customColors.length);
  } catch (error) {
    console.error('Error loading custom colors:', error);
    displayCustomColors([]);
  }
}

// Display custom colors in the grid
function displayCustomColors(customColors) {
  const grid = document.getElementById('customColorsGrid');
  const noColorsMessage = document.getElementById('no-colors-message');
  
  if (!grid) return;
  
  grid.innerHTML = '';
  
  if (customColors.length === 0) {
    if (noColorsMessage) noColorsMessage.style.display = 'block';
    return;
  }
  
  if (noColorsMessage) noColorsMessage.style.display = 'none';
  
  customColors.forEach(colorObj => {
    const colorItem = document.createElement('div');
    colorItem.className = 'custom-color-item';
    colorItem.style.backgroundColor = colorObj.color;
    
    // Color number badge
    const numberBadge = document.createElement('span');
    numberBadge.className = 'color-number';
    numberBadge.textContent = colorObj.colorNumber || '?';
    colorItem.appendChild(numberBadge);
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = getMessage('removeHighlight', 'Delete');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteColor(colorObj.id);
    });
    colorItem.appendChild(deleteBtn);
    
    grid.appendChild(colorItem);
  });
}

// Update color limit info text
function updateColorLimitInfo(currentCount) {
  const info = document.getElementById('colorLimitInfo');
  if (info) {
    info.textContent = `${currentCount} / ${MAX_CUSTOM_COLORS} colors`;
  }
}

// Add a new custom color
async function addColor(colorValue) {
  try {
    const result = await browserAPI.storage.local.get(['customColors']);
    let customColors = result.customColors || [];
    
    // Check maximum limit
    if (customColors.length >= MAX_CUSTOM_COLORS) {
      alert(`Maximum of ${MAX_CUSTOM_COLORS} custom colors reached.`);
      return;
    }
    
    // Check for duplicate
    const exists = customColors.some(c => c.color.toLowerCase() === colorValue.toLowerCase());
    if (exists) {
      alert('This color already exists.');
      return;
    }
    
    // Add new color
    const colorNumber = customColors.length + 1;
    const newColor = {
      id: `custom_${Date.now()}`,
      nameKey: 'customColor',
      colorNumber: colorNumber,
      color: colorValue.toUpperCase()
    };
    
    customColors.push(newColor);
    
    // Save to storage
    await browserAPI.storage.local.set({ customColors });
    
    // Notify background script
    browserAPI.runtime.sendMessage({ action: 'customColorsUpdated' });
    
    // Refresh display
    displayCustomColors(customColors);
    updateColorLimitInfo(customColors.length);
    
  } catch (error) {
    console.error('Error adding color:', error);
  }
}

// Delete a custom color with proper number shifting
async function deleteColor(colorId) {
  try {
    const result = await browserAPI.storage.local.get(['customColors']);
    let customColors = result.customColors || [];
    
    // Filter out the deleted color
    customColors = customColors.filter(c => c.id !== colorId);
    
    // Re-assign color numbers (shifting)
    customColors.forEach((color, index) => {
      color.colorNumber = index + 1;
    });
    
    // Save to storage
    await browserAPI.storage.local.set({ customColors });
    
    // Notify background script
    browserAPI.runtime.sendMessage({ action: 'customColorsUpdated' });
    
    // Refresh display
    displayCustomColors(customColors);
    updateColorLimitInfo(customColors.length);
    
  } catch (error) {
    console.error('Error deleting color:', error);
  }
}

// Reset picker to default state
function resetPicker() {
  currentHue = 0;
  currentSaturation = 80;
  currentValue = 80;
  
  const hueHandle = document.getElementById('hueHandle');
  const svHandle = document.getElementById('svHandle');
  const svPicker = document.getElementById('svPicker');
  
  if (hueHandle) hueHandle.style.left = '0px';
  
  if (svHandle && svPicker) {
    const svRect = svPicker.getBoundingClientRect();
    svHandle.style.left = `${svRect.width * 0.8}px`;
    svHandle.style.top = `${svRect.height * 0.2}px`;
  }
  
  updateSVBackground();
  updateColorPreview();
}

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
  // Initialize theme watcher
  initializeThemeWatcher();
  
  // Enable transition after page load
  setTimeout(() => {
    document.body.classList.remove('preload');
  }, 50);

  // Localize static elements
  localizeStaticElements();
  
  // Initialize HSV picker
  initHSVSliders();
  
  // Initialize preset colors
  initPresetColors();
  
  // Load saved custom colors
  loadCustomColors();
  
  // Add color button handler
  document.getElementById('add-color-btn').addEventListener('click', () => {
    addColor(getCurrentColorHex());
  });
  
  // Reset button handler
  document.getElementById('reset-btn').addEventListener('click', resetPicker);
});
