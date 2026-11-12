// src/components/keyboard.js

export function setupKeyboard({ level = 1, onInput, onBackspace, onSpace, onOk }) {
  let rowsData = [];

  if (level === 1) {
    rowsData = [
      ['w', 'e', 'r', 't'],
      ['y', 'u', 'i', 'o'],
      ['s', 'd', 'h', 'k'],
      ['shift', 'l', 'backspace'],
      ['space', 'ok']
    ];
  } else if (level === 2) {
    rowsData = [
      ['w', 'e', 'r', 't'],
      ['y', 'u', 'i', 'o'],
      ['s', 'd', 'h', 'k'],
      ['shift', 'l', 'n', 'backspace'],
      ["'", 'space', 'ok']
    ];
  } else {
    rowsData = [
      ['w', 'e', 'r', 't'],
      ['y', 'u', 'i', 'o'],
      ['s', 'd', 'h', 'k'],
      ['shift', 'l', 'n', '?', 'backspace'],
      ["'", 'space', 'ok']
    ];
  }

  const kbContainer = document.getElementById('keyboard');
  if (!kbContainer) return;
  kbContainer.innerHTML = '';

  const oldActionContainer = kbContainer.nextElementSibling;
  if (oldActionContainer && (oldActionContainer.tagName === 'DIV' || oldActionContainer.style)) {
    if (level === 1 || level === 2 || level === 3) {
      oldActionContainer.style.display = 'none';
    } else {
      oldActionContainer.style.display = 'flex';
    }
  }

  let isUpperCase = true;

  function renderRows() {
    kbContainer.innerHTML = '';

    rowsData.forEach(rowKeys => {
      if (rowKeys.length === 0) return;

      const rowDiv = document.createElement('div');
      rowDiv.className = 'kb-row';

      rowKeys.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'kb-btn';

        if (key === 'shift') {
          btn.textContent = '⇧';
          btn.onclick = () => {
            isUpperCase = !isUpperCase;
            renderRows();
          };
        } else if (key === 'backspace') {
          btn.textContent = '⌫';

          let backspaceInterval = null;
          let backspaceTimeout = null;

          const startDeleting = (e) => {
            e.preventDefault();
            onBackspace(); // Стираем сразу при нажатии

            // Задержка перед началом непрерывного стирания (500 мс)
            backspaceTimeout = setTimeout(() => {
              // Интервал повторного удаления (каждые 100 мс)
              backspaceInterval = setInterval(() => {
                onBackspace();
              }, 100);
            }, 500);
          };

          const stopDeleting = () => {
            clearTimeout(backspaceTimeout);
            clearInterval(backspaceInterval);
          };

          // Подключаем события как для мыши, так и для сенсорных экранов
          btn.addEventListener('mousedown', startDeleting);
          btn.addEventListener('mouseup', stopDeleting);
          btn.addEventListener('mouseleave', stopDeleting);
          
          btn.addEventListener('touchstart', startDeleting);
          btn.addEventListener('touchend', stopDeleting);
          btn.addEventListener('touchcancel', stopDeleting);

        } else if (key === 'space') {
          btn.textContent = 'пробел';
          btn.style.flex = '2';
          btn.onclick = () => onSpace();
        } else if (key === 'ok') {
          btn.textContent = '✓';
          btn.style.flex = '1';
          btn.style.fontWeight = 'bold';
          btn.onclick = () => onOk();
        } else if (key === "'" || key === '?') {
          btn.textContent = key;
          btn.style.flex = '1';
          btn.addEventListener('click', () => onInput(key));
        } else if (key === 'l' || key === 'n') {
          const char = key;
          btn.textContent = isUpperCase ? char.toUpperCase() : char;
          btn.addEventListener('click', () => {
            let charToAdd = isUpperCase ? char.toUpperCase() : char;
            isUpperCase = false;
            renderRows();
            onInput(charToAdd);
          });
        } else if (key === ',') {
          btn.textContent = key;
          btn.addEventListener('click', () => onInput(key));
        } else {
          btn.textContent = isUpperCase ? key.toUpperCase() : key;
          btn.addEventListener('click', () => {
            let charToAdd = isUpperCase ? key.toUpperCase() : key;
            isUpperCase = false;
            renderRows();
            onInput(charToAdd);
          });
        }
        rowDiv.appendChild(btn);
      });
      kbContainer.appendChild(rowDiv);
    });
  }

  renderRows();
}