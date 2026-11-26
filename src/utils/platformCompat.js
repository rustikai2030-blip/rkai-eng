// src/utils/platformCompat.js

/**
 * Определяет окружение браузера и платформы без поломки стандартного поведения Chrome.
 */
export function getPlatformInfo() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return {
      isYandex: false,
      isIos: false,
      isAndroid: false,
      isMobile: false,
      isStandalone: false
    };
  }

  const ua = navigator.userAgent || '';
  const isYandex = /YaBrowser|Yandex/i.test(ua);
  const isIos = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIos || isAndroid || /Mobile|Mobi/i.test(ua);
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.matchMedia?.('(display-mode: fullscreen)')?.matches ||
    Boolean(navigator.standalone);

  return {
    isYandex,
    isIos,
    isAndroid,
    isMobile,
    isStandalone
  };
}

/**
 * Обновляет CSS-переменную --app-vh с учётом visualViewport,
 * чтобы нижняя панель Яндекс Браузера и других браузеров не перекрывала интерфейс.
 */
export function syncViewportMetrics() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const vv = window.visualViewport;
  const activeHeight = vv && vv.height > 0 ? vv.height : window.innerHeight;
  const vhUnitPx = Math.max(3.2, activeHeight * 0.01);

  document.documentElement.style.setProperty('--app-vh', `${vhUnitPx}px`);
}

/**
 * Запускает отслеживание размеров окна и visualViewport для кроссплатформенной адаптации.
 * Возвращает функцию очистки слушателей.
 */
export function initViewportAdaptation() {
  if (typeof window === 'undefined') return () => {};

  syncViewportMetrics();

  const onResize = () => syncViewportMetrics();
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', onResize, { passive: true });
    vv.addEventListener('scroll', onResize, { passive: true });
  }

  return () => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    if (vv) {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    }
  };
}

/**
 * Блокирует появление системной клавиатуры при работе со встроенной клавиатурой тренажёра,
 * сохраняя работу кастомного курсора (selectionStart / selectionEnd).
 */
export function applyCustomKeyboardInputGuards(inputEl) {
  if (!inputEl) return;

  const { isYandex, isMobile } = getPlatformInfo();

  inputEl.setAttribute('inputmode', 'none');
  inputEl.setAttribute('autocomplete', 'off');
  inputEl.setAttribute('autocorrect', 'off');
  inputEl.setAttribute('autocapitalize', 'off');
  inputEl.setAttribute('spellcheck', 'false');

  // Для мобильных устройств и особенно Яндекс Браузера readOnly надёжно подавляет системную клавиатуру,
  // не мешая программному управлению selectionStart / selectionEnd и значением value.
  if (isYandex || isMobile) {
    inputEl.readOnly = true;
  } else {
    inputEl.readOnly = false;
  }
}

/**
 * Безопасно задаёт значение и позицию курсора в поле ввода для кастомной клавиатуры.
 */
export function setCustomInputValueWithCaret(inputEl, nextValue, caretIndex) {
  if (!inputEl) return;

  const safeValue = String(nextValue ?? '');
  const safeCaret = Math.max(0, Math.min(Number(caretIndex) || 0, safeValue.length));

  inputEl.value = safeValue;
  try {
    inputEl.setSelectionRange(safeCaret, safeCaret);
  } catch (_) {
    try {
      inputEl.selectionStart = safeCaret;
      inputEl.selectionEnd = safeCaret;
    } catch (__) {}
  }
}