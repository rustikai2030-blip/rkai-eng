// src/utils/styleTheme.js

const GOLDEN_ANGLE = 137.508;
const BASE_HUE = 205; // Стартовый оттенок после 19-го уровня

function normalizeHue(hue) {
  return ((hue % 360) + 360) % 360;
}

/**
 * Генерирует мягкую светлую пастельную тему с высоким контрастом текста
 * для уровней стиля начиная с 20-го (и выше).
 */
export function getPastelThemeForLevel(styleLevel) {
  const stepIndex = Math.max(0, styleLevel - 20);
  const hue = Math.round(normalizeHue(BASE_HUE + stepIndex * GOLDEN_ANGLE));

  // Приглушённая насыщенность и высокая светлота — пастель без режущих глаз цветов
  const saturation = 28;
  const bgLightness = 94;
  const btnLightness = 88;
  const borderLightness = 72;
  const accentLightness = 38;
  const accentSat = 46;

  const radiusPx = Math.min(10, 8 + Math.floor(stepIndex / 3));

  return {
    hue,
    backgroundColor: `hsl(${hue}, ${saturation}%, ${bgLightness}%)`,
    color: '#0f172a',
    btnBg: `hsl(${hue}, ${saturation}%, ${btnLightness}%)`,
    btnBorder: `hsl(${hue}, ${Math.min(42, saturation + 10)}%, ${borderLightness}%)`,
    btnColor: '#0f172a',
    accent: `hsl(${hue}, ${accentSat}%, ${accentLightness}%)`,
    accentBg: `hsla(${hue}, ${accentSat}%, ${accentLightness}%, 0.14)`,
    boxShadow: `0 3px 8px hsla(${hue}, 35%, 25%, 0.08)`,
    borderRadius: `${radiusPx}px`
  };
}

/**
 * Применяет уровень стиля к document.body:
 * 0..19 — стили из evolution.css (витрина эволюции)
 * 20+   — бесконечная светлая пастельная палитра по золотому углу
 */
export function applyStyleLevelToBody(styleLevel) {
  const body = document.body;
  if (!body) return;

  body.setAttribute('data-level', String(styleLevel));

  const pastelVars = [
    'background-color',
    'color',
    '--border-radius',
    '--box-shadow',
    '--btn-bg',
    '--btn-border',
    '--btn-color',
    '--accent',
    '--accent-bg'
  ];

  if (styleLevel < 20) {
    pastelVars.forEach((prop) => body.style.removeProperty(prop));
    return;
  }

  const theme = getPastelThemeForLevel(styleLevel);
  body.style.setProperty('background-color', theme.backgroundColor);
  body.style.setProperty('color', theme.color);
  body.style.setProperty('--border-radius', theme.borderRadius);
  body.style.setProperty('--box-shadow', theme.boxShadow);
  body.style.setProperty('--btn-bg', theme.btnBg);
  body.style.setProperty('--btn-border', theme.btnBorder);
  body.style.setProperty('--btn-color', theme.btnColor);
  body.style.setProperty('--accent', theme.accent);
  body.style.setProperty('--accent-bg', theme.accentBg);
}