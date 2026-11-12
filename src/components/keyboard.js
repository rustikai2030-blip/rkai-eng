// src/components/keyboard.js

export function setupKeyboard({ level = 1, onInput, onBackspace, onSpace, onOk }) {
  let rowsData = [];

  if (level === 1) {
    // 1 уровень: 4 ряда букв/функций + 5 ряд (пробел и ввод)
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
      ['y', 'u', 'i', 'o', ',', "'"],
      ['s', 'd', 'h', 'k', 'm', 'n']
    ];
  } else {
    rowsData = [
      ['w', 'e', 'r', 't'],
      ['y', 'u', 'i', 'o', ',', "'", '?'],
      ['shift', 's', 'd', 'h', 'k', 'n', '?']
    ];
  }

  const kbContainer = document.getElementById('keyboard');
  if (!kbContainer) return;
  kbContainer.innerHTML = '';

  // Скрываем или удаляем старый блок кнопок под клавиатурой из main.js для 1-го уровня
  const oldActionContainer = kbContainer.nextElementSibling;
  if (oldActionContainer && (oldActionContainer.tagName === 'DIV' || oldActionContainer.style)) {
    if (level === 1) {
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
          btn.onclick = () => onBackspace();
        } else if (key === 'space') {
          btn.textContent = 'пробел';
          btn.style.flex = '2';
          btn.onclick = () => onSpace();
        } else if (key === 'ok') {
          btn.textContent = '✓';
          btn.style.flex = '1';
          btn.style.fontWeight = 'bold';
          btn.onclick = () => onOk();
        } else if (key === "'" || key === ',' || key === '?') {
          btn.textContent = key;
          btn.addEventListener('click', () => onInput(key));
        } else if (key === 'l') {
          btn.textContent = isUpperCase ? 'L' : 'l';
          btn.addEventListener('click', () => {
            let charToAdd = isUpperCase ? 'L' : 'l';
            isUpperCase = false;
            renderRows();
            onInput(charToAdd);
          });
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

  // Для уровней выше 1 сохраняем работу стандартных внешних кнопок (если они есть в разметке)
  const backspaceBtn = document.getElementById('backspace-btn');
  if (backspaceBtn) backspaceBtn.onclick = () => onBackspace();

  const spaceBtn = document.getElementById('space-btn');
  if (spaceBtn) spaceBtn.onclick = () => onSpace();

  const okBtn = document.getElementById('ok-btn');
  if (okBtn) okBtn.onclick = () => onOk();
}