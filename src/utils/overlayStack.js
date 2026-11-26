// src/utils/overlayStack.js

const overlayStack = [];
let isPopstateListening = false;
let isHandlingPopstate = false;

function ensurePopstateListener() {
  if (isPopstateListening || typeof window === 'undefined') return;
  isPopstateListening = true;

  window.addEventListener('popstate', () => {
    const topOverlay = overlayStack[overlayStack.length - 1];
    if (!topOverlay) return;

    isHandlingPopstate = true;
    try {
      overlayStack.pop();
      if (typeof topOverlay.onClose === 'function') {
        topOverlay.onClose();
      }
    } finally {
      isHandlingPopstate = false;
    }
  });
}

/**
 * Регистрирует открытое окно поверх стека и добавляет запись в историю браузера.
 * @param {string} id - Уникальный идентификатор окна (например, 'simple-hint' или 'main-modal').
 * @param {Function} onClose - Функция визуального закрытия окна без повторного вызова history.back().
 */
export function registerOverlayOpen(id, onClose) {
  ensurePopstateListener();

  const existingIndex = overlayStack.findIndex(item => item.id === id);
  if (existingIndex !== -1) {
    overlayStack.splice(existingIndex, 1);
  }

  overlayStack.push({ id, onClose });

  if (typeof history !== 'undefined' && typeof history.pushState === 'function') {
    history.pushState({ overlayId: id, stackDepth: overlayStack.length }, '');
  }
}

/**
 * Закрывает окно по id (по умолчанию — верхнее).
 * Если закрытие вызвано не событием popstate, делает шаг назад в истории браузера.
 * @param {string} [id] - Идентификатор закрываемого окна. Если не передан, берётся верхнее.
 * @param {Function} [fallbackVisualClose] - Запасной колбэк, если окна нет в стеке.
 */
export function closeOverlayByUi(id, fallbackVisualClose) {
  if (isHandlingPopstate) return;

  let targetIndex = -1;
  if (id) {
    for (let i = overlayStack.length - 1; i >= 0; i--) {
      if (overlayStack[i].id === id) {
        targetIndex = i;
        break;
      }
    }
  } else if (overlayStack.length > 0) {
    targetIndex = overlayStack.length - 1;
  }

  let removedEntry = null;
  if (targetIndex !== -1) {
    [removedEntry] = overlayStack.splice(targetIndex, 1);
  }

  if (removedEntry && typeof removedEntry.onClose === 'function') {
    removedEntry.onClose();
  } else if (typeof fallbackVisualClose === 'function') {
    fallbackVisualClose();
  }

  if (
    removedEntry &&
    typeof history !== 'undefined' &&
    typeof history.back === 'function'
  ) {
    history.back();
  }
}

/**
 * Проверяет, открыто ли сейчас конкретное окно (или любое окно, если id не передан).
 */
export function isOverlayOpen(id) {
  if (!id) return overlayStack.length > 0;
  return overlayStack.some(item => item.id === id);
}