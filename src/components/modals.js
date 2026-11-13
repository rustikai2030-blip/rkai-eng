// src/components/modals.js
import { dictionaryWords } from '../data/tasks.js';

export function setupModals() {
  if (!document.getElementById('modal')) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'modal';
    modalDiv.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #16171d; color: #f3f4f6; padding: 24px; box-sizing: border-box; overflow-y: auto; text-align: left; z-index: 1000;';
    modalDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 28px;">Словарь</h2>
        <button id="close-modal" style="padding: 10px 18px; background: var(--accent, #38bdf8); color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">✕ Закрыть</button>
      </div>
      <div id="modal-content" style="display: flex; flex-direction: column; gap: 14px;"></div>
    `;
    document.body.appendChild(modalDiv);
  }

  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');

  // Функция открытия модального окна с добавлением состояния в историю браузера
  function openModal(contentHtml) {
    modalContent.innerHTML = contentHtml;
    modal.style.display = 'block';
    
    // Добавляем запись в историю браузера, чтобы кнопка "Назад" на телефоне работала
    history.pushState({ modalOpen: true }, '');
  }

  // Функция закрытия модального окна
  function closeModalWindow(isBackAction = false) {
    if (modal.style.display === 'block') {
      modal.style.display = 'none';
      // Если закрываем программно по крестику (а не по кнопке Назад), возвращаем историю назад, если нужно
      if (!isBackAction && history.state && history.state.modalOpen) {
        history.back();
      }
    }
  }

  const wordsBtn = document.getElementById('words-btn');
  if (wordsBtn) {
    wordsBtn.onclick = () => {
      const allowedEnWords = ["I", "You", "We", "He", "She", "It", "They", "Work", "Worked"];
      const filteredWords = dictionaryWords.filter(w => allowedEnWords.includes(w.en));

      const html = filteredWords.map(w => `
        <div style="background: var(--code-bg, #1f2028); padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border, #2e303a); font-size: 24px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
          <span style="color: var(--text-h, #f3f4f6);">${w.en}</span>
          <span style="color: var(--text, #9ca3af); font-size: 20px;">${w.ru}</span>
        </div>
      `).join('');

      openModal(html);
    };
  }

  const rulesBtn = document.getElementById('rules-btn');
  if (rulesBtn) {
    rulesBtn.onclick = () => {
      import('../data/tasks.js').then(module => {
        openModal(module.grammarRules);
      });
    };
  }

  const closeModal = document.getElementById('close-modal');
  if (closeModal) {
    closeModal.onclick = () => {
      closeModalWindow(false);
    };
  }

  // Перехватываем нажатие системной кнопки "Назад" на телефоне/в браузере
  window.onpopstate = (event) => {
    if (modal.style.display === 'block') {
      closeModalWindow(true);
    }
  };
}