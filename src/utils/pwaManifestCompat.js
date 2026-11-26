// src/utils/pwaManifestCompat.js
import { generateBrandedIconDataUrl } from './pwaBranding.js';

function checkImageExists(src) {
  return new Promise((resolve) => {
    if (!src || typeof Image === 'undefined') {
      resolve(false);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

/**
 * Обеспечивает корректную иконку для iOS (apple-touch-icon):
 * если /icon-180.png или /icon-192.png отсутствует, подставляет сгенерированную PNG-иконку.
 */
export async function syncPlatformIcons() {
  if (typeof document === 'undefined') return;

  const has180 = await checkImageExists('/icon-180.png');
  const has192 = await checkImageExists('/icon-192.png');

  let fallbackIconUrl = null;
  if (!has180 && !has192) {
    fallbackIconUrl = await generateBrandedIconDataUrl(192, '/icon-512.png');
  }

  const targetHref = has180
    ? '/icon-180.png'
    : has192
      ? '/icon-192.png'
      : fallbackIconUrl;

  if (!targetHref) return;

  let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
  if (!appleIcon) {
    appleIcon = document.createElement('link');
    appleIcon.setAttribute('rel', 'apple-touch-icon');
    document.head.appendChild(appleIcon);
  }
  appleIcon.setAttribute('href', targetHref);
}