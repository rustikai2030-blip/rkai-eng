// src/components/keyboard.js
import { getKeyboardRowsForLevel } from '../levels/registry.js';

/**
 * Определяет, должен ли следующий символ по умолчанию быть заглавным
 * исходя из текста поля ввода и позиции курсора.
 */
function shouldAutoCapitalize(getInputState) {
  if (typeof getInputState !== 'function') {
    return true;
  }

  const state = getInputState();
  if (!state) return true;

  const value = String(state.value ?? '');
  const start = typeof state.selectionStart === 'number' ? state.selectionStart : value.length;
  const end = typeof state.selectionEnd === 'number' ? state.selectionEnd : start;

  // Если выделен фрагмент — не навязываем авто-капитализацию
  if (start !== end) {
    return false;
  }

  // Самое начало строки
  if (start === 0) {
    return true;
  }

  // Начало после знака завершения предложения и пробела (на случай многословных фраз)
  const textBeforeCursor = value.slice(0, start);
  return /[.!?]\s+$/.test(textBeforeCursor);
}

export function setupKeyboard({ level = 1, rows, getInputState, onInput, onBackspace, onSpace, onOk }) {
  const rowsData = Array.isArray(rows) && rows.length > 0
    ? rows
    : getKeyboardRowsForLevel(level);

  const kbContainer = document.getElementById('keyboard');
  if (!kbContainer) {
    return { refreshShiftState: () => {} };
  }
  kbContainer.innerHTML = '';

  const oldActionContainer = kbContainer.nextElementSibling;
  if (oldActionContainer && (oldActionContainer.tagName === 'DIV' || oldActionContainer.style)) {
    oldActionContainer.style.display = 'none';
  }

  // Ручное переключение Shift пользователем; null — режим авто-определения по курсору
  let manualShiftOverride = null;

  function isUpperCaseActive() {
    if (manualShiftOverride !== null) {
      return manualShiftOverride;
    }
    return shouldAutoCapitalize(getInputState);
  }

  function syncShiftVisual(shiftBtn) {
    if (!shiftBtn) return;
    const upper = isUpperCaseActive();
    if (upper) {
      shiftBtn.style.background = 'var(--accent, #38bdf8)';
      shiftBtn.style.color = '#fff';
    } else {
      shiftBtn.style.background = '';
      shiftBtn.style.color = '';
    }
  }

  let shiftButtonRef = null;

  function refreshShiftState() {
    if (manualShiftOverride !== null && shouldAutoCapitalize(getInputState) && (!getInputState || getInputState().value === '')) {
      manualShiftOverride = null;
    }
    syncShiftVisual(shiftButtonRef);
    kbContainer.querySelectorAll('.kb-letter-btn').forEach((btn) => {
      const baseChar = btn.getAttribute('data-key');
      if (baseChar) {
        btn.textContent = isUpperCaseActive() ? baseChar.toUpperCase() : baseChar;
      }
    });
  }

  function renderRows() {
    kbContainer.innerHTML = '';
    shiftButtonRef = null;

    rowsData.forEach(rowKeys => {
      if (rowKeys.length === 0) return;

      const rowDiv = document.createElement('div');
      rowDiv.className = 'kb-row';

      rowKeys.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'kb-btn';

        if (key === 'shift') {
          btn.textContent = '⇧';
          shiftButtonRef = btn;
          syncShiftVisual(btn);
          btn.onclick = () => {
            manualShiftOverride = !isUpperCaseActive();
            refreshShiftState();
          };
        } else if (key === 'backspace') {
          btn.textContent = '⌫';

          let backspaceInterval = null;
          let backspaceTimeout = null;

          const runBackspace = () => {
            onBackspace();
            manualShiftOverride = null;
            refreshShiftState();
          };

          const startDeleting = (e) => {
            e.preventDefault();
            runBackspace();

            backspaceTimeout = setTimeout(() => {
              backspaceInterval = setInterval(() => {
                runBackspace();
              }, 100);
            }, 500);
          };

          const stopDeleting = () => {
            clearTimeout(backspaceTimeout);
            clearInterval(backspaceInterval);
          };

          btn.addEventListener('mousedown', startDeleting);
          btn.addEventListener('mouseup', stopDeleting);
          btn.addEventListener('mouseleave', stopDeleting);

          btn.addEventListener('touchstart', startDeleting);
          btn.addEventListener('touchend', stopDeleting);
          btn.addEventListener('touchcancel', stopDeleting);
        } else if (key === 'space') {
          btn.textContent = 'пробел';
          btn.style.flex = '2';
          btn.onclick = () => {
            onSpace();
            manualShiftOverride = null;
            refreshShiftState();
          };
        } else if (key === 'ok') {
          btn.textContent = '✓';
          btn.style.flex = '1';
          btn.style.fontWeight = 'bold';
          btn.onclick = () => onOk();
        } else if (key === "'" || key === '?') {
          btn.textContent = key;
          btn.style.flex = '1';
          btn.addEventListener('click', () => {
            onInput(key);
            manualShiftOverride = null;
            refreshShiftState();
          });
        } else {
          const char = key;
          btn.classList.add('kb-letter-btn');
          btn.setAttribute('data-key', char);
          btn.textContent = isUpperCaseActive() ? char.toUpperCase() : char;
          btn.addEventListener('click', () => {
            const charToAdd = isUpperCaseActive() ? char.toUpperCase() : char;
            onInput(charToAdd);
            manualShiftOverride = null;
            refreshShiftState();
          });
        }
        rowDiv.appendChild(btn);
      });
      kbContainer.appendChild(rowDiv);
    });
  }

  renderRows();

  return {
    refreshShiftState
  };
}