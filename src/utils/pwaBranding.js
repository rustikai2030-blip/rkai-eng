// src/utils/pwaBranding.js
// Модуль брендинга PWA: формирует иконки и splash-изображения с крупным синим названием сайта

export const BRAND_NAME = 'Pareto English';
export const BRAND_SHORT_NAME = 'Pareto';
// Насыщенный, хорошо читаемый синий оттенок для названия сайта
export const BRAND_BLUE_PRIMARY = '#0284c7';
export const BRAND_BLUE_BRIGHT = '#38bdf8';
export const SPLASH_BG_COLOR = '#0f172a';
export const ICON_BG_COLOR = '#f8fafc';

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src || typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawFallbackMark(ctx, cx, cy, size, strokeColor = BRAND_BLUE_PRIMARY) {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = Math.max(4, size * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const r = size * 0.42;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = `800 ${Math.round(size * 0.44)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', cx, cy + size * 0.02);
  ctx.restore();
}

/**
 * Генерирует квадратную иконку с логотипом и заметной синей подписью названия
 */
export async function generateBrandedIconDataUrl(size = 512, existingLogoSrc = '/icon-512.png') {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = ICON_BG_COLOR;
  ctx.fillRect(0, 0, size, size);

  const logoImg = await loadImage(existingLogoSrc);
  const labelHeight = Math.round(size * 0.22);
  const logoAreaHeight = size - labelHeight - Math.round(size * 0.08);
  const markSize = Math.min(Math.round(size * 0.52), logoAreaHeight);
  const markCenterY = Math.round(size * 0.06) + markSize / 2;

  if (logoImg && logoImg.naturalWidth > 0) {
    ctx.drawImage(
      logoImg,
      (size - markSize) / 2,
      markCenterY - markSize / 2,
      markSize,
      markSize
    );
  } else {
    drawFallbackMark(ctx, size / 2, markCenterY, markSize, BRAND_BLUE_PRIMARY);
  }

  ctx.fillStyle = BRAND_BLUE_PRIMARY;
  ctx.font = `800 ${Math.round(size * 0.115)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(BRAND_SHORT_NAME, size / 2, size - labelHeight * 0.48, size * 0.9);

  return canvas.toDataURL('image/png');
}

/**
 * Генерирует полноэкранный splash-баннер для iOS с логотипом и крупным синим названием
 */
export async function generateIosSplashDataUrl(width, height, dpr = 2, existingLogoSrc = '/icon-512.png') {
  const pxW = Math.round(width * dpr);
  const pxH = Math.round(height * dpr);

  const canvas = document.createElement('canvas');
  canvas.width = pxW;
  canvas.height = pxH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = SPLASH_BG_COLOR;
  ctx.fillRect(0, 0, pxW, pxH);

  const minSide = Math.min(pxW, pxH);
  const cardSize = Math.round(minSide * 0.34);
  const cardX = (pxW - cardSize) / 2;
  const cardY = pxH * 0.42 - cardSize / 2;

  drawRoundedRect(ctx, cardX, cardY, cardSize, cardSize, cardSize * 0.22);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const logoImg = await loadImage(existingLogoSrc);
  const pad = Math.round(cardSize * 0.14);

  if (logoImg && logoImg.naturalWidth > 0) {
    ctx.drawImage(logoImg, cardX + pad, cardY + pad, cardSize - pad * 2, cardSize - pad * 2);
  } else {
    drawFallbackMark(ctx, pxW / 2, cardY + cardSize / 2, cardSize - pad * 2, BRAND_BLUE_PRIMARY);
  }

  const titleSize = Math.max(28, Math.round(minSide * 0.075));
  ctx.fillStyle = BRAND_BLUE_BRIGHT;
  ctx.font = `800 ${titleSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(BRAND_NAME, pxW / 2, cardY + cardSize + Math.round(minSide * 0.055), pxW * 0.9);

  return canvas.toDataURL('image/png');
}

/**
 * Подключает динамический apple-touch-startup-image под текущий экран устройства
 */
export async function applyDynamicSplashScreen() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const width = window.screen?.width || window.innerWidth || 390;
  const height = window.screen?.height || window.innerHeight || 844;
  const dpr = Math.min(window.devicePixelRatio || 2, 3);

  const splashUrl = await generateIosSplashDataUrl(width, height, dpr, '/icon-512.png');
  if (!splashUrl) return;

  let linkEl = document.querySelector('link[rel="apple-touch-startup-image"]');
  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.setAttribute('rel', 'apple-touch-startup-image');
    document.head.appendChild(linkEl);
  }
  linkEl.setAttribute('href', splashUrl);
}