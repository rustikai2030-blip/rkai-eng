export function setupKeyboard({ level = 0, onInput, onBackspace, onSpace, onOk }) {
  // Эталонные ряды стандартной QWERTY-клавиатуры
  const qwertyRow1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const qwertyRow2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const qwertyRow3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

  // Определяем набор доступных букв в зависимости от уровня
  // Уровень 0 (Старт): только буквы для местоимений и слова work, will (w, e, r, t, y, u, i, o, l, s, d, h, k)
  let allowedChars = ['w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'l', 's', 'd', 'h', 'k'];

  // Уровень 1 и выше: добавляются буквы для отрицаний (n, a, m и апостроф ')
  if (level >= 1) {
    allowedChars = ['w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'l', 's', 'd', 'h', 'k', 'n', 'a', 'm', "'"];
  }

  // Если нужны будут следующие уровни, здесь можно расширять allowedChars

  // Формируем ряды клавиатуры, оставляя только те клавиши, которые разрешены на текущем уровне,
  // при этом сохраняя их взаимное QWERTY-расположение
  const row1 = qwertyRow1.filter(char => allowedChars.includes(char));
  const row2 = qwertyRow2.filter(char => allowedChars.includes(char));
  const row3 = ['shift', ...qwertyRow3.filter(char => allowedChars.includes(char))];
  
  if (level >= 1 && allowedChars.includes("'")) {
    row3.push("'");
  }

  const kbContainer = document.getElementById('keyboard');
  if (!kbContainer) return;
  kbContainer.innerHTML = '';

  let isUpperCase = true;
  const rowsData = [row1, row2, row3];

  function renderRows() {
    kbContainer.innerHTML = '';
    rowsData.forEach(rowKeys => {
      if (rowKeys.length === 0 || (rowKeys.length === 1 && rowKeys[0] === 'shift')) return; // Пропускаем пустые ряды

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
        } else if (key === "'") {
          btn.textContent = "'";
          btn.addEventListener('click', () => onInput("'"));
        } else {
          btn.textContent = isUpperCase ? key.toUpperCase() : key;
          btn.addEventListener('click', () => {
            let charToAdd = isUpperCase ? key.toUpperCase() : key;
            isUpperCase = false;
            onInput(charToAdd);
          });
        }
        rowDiv.appendChild(btn);
      });
      kbContainer.appendChild(rowDiv);
    });
  }

  renderRows();

  const backspaceBtn = document.getElementById('backspace-btn');
  if (backspaceBtn) backspaceBtn.onclick = () => onBackspace();

  const spaceBtn = document.getElementById('space-btn');
  if (spaceBtn) spaceBtn.onclick = () => onSpace();

  const okBtn = document.getElementById('ok-btn');
  if (okBtn) okBtn.onclick = () => onOk();
}