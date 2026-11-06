import { dictionaryWords, grammarRules } from '../data/tasks.js';

export function setupModals() {
  if (!document.getElementById('modal')) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'modal';
    modalDiv.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); color: #fff; padding: 30px; box-sizing: border-box; overflow-y: auto; text-align: left; z-index: 1000;';
    modalDiv.innerHTML = `
      <button id="close-modal" style="float: right; padding: 5px 10px; background: #fff; color: #000; border: none; cursor: pointer;">✕ Закрыть</button>
      <div id="modal-content"></div>
    `;
    document.body.appendChild(modalDiv);
  }

  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');

  const wordsBtn = document.getElementById('words-btn');
  if (wordsBtn) {
    wordsBtn.onclick = () => {
      modalContent.innerHTML = `
        <h2>Слова</h2>
        ${dictionaryWords.map(w => `<p>${w.en} - ${w.ru}</p>`).join('')}
      `;
      modal.style.display = 'block';
    };
  }

  const rulesBtn = document.getElementById('rules-btn');
  if (rulesBtn) {
    rulesBtn.onclick = () => {
      modalContent.innerHTML = grammarRules;
      modal.style.display = 'block';
    };
  }

  const closeModal = document.getElementById('close-modal');
  if (closeModal) {
    closeModal.onclick = () => {
      modal.style.display = 'none';
    };
  }
}