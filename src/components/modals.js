// src/components/modals.js
import { getDictionaryForLevel } from '../levels/registry.js';
import { helpGuideHtml, showProjectPresentation } from './onboarding.js';
import { openSimpleHint } from './simpleHint.js';
import { speakEnglishWord, stopErrorSpeech } from '../utils/speechFeedback.js';
import {
  registerOverlayOpen,
  closeOverlayByUi,
  isOverlayOpen
} from '../utils/overlayStack.js';

const MAIN_MODAL_OVERLAY_KEY = 'main-modal';
let activeLessonLevel = 1;

function renderDictionaryWordRow(wordItem) {
  const noteHtml = wordItem.note
    ? `<span style="font-size: 12px; font-weight: 500; color: #93c5fd; background: rgba(59, 130, 246, 0.14); border: 1px solid rgba(96, 165, 250, 0.35); padding: 2px 8px; border-radius: 999px; white-space: nowrap;">${wordItem.note}</span>`
    : '';

  return `
    <div
      class="dict-word-row"
      data-en="${wordItem.en}"
      role="button"
      tabindex="0"
      style="
        background: #1e293b;
        padding: 13px 16px;
        border-radius: 8px;
        border: 1px solid #334155;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px 12px;
        cursor: pointer;
        transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.1s ease;
      "
    >
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0;">
        <span style="font-size: 16px; opacity: 0.85;">🔊</span>
        <span style="color: #60a5fa; font-size: 20px; font-weight: 800;">${wordItem.en}</span>
        ${noteHtml}
      </div>
      <span style="color: #94a3b8; font-size: 17px; font-weight: 600; text-align: right; margin-left: auto;">${wordItem.ru}</span>
    </div>
  `;
}

function renderDictionarySectionDivider(labelText = 'Ранее изученные слова') {
  return `
    <div style="margin: 8px 0 4px;">
      <div style="border-top: 3px solid #64748b; margin-bottom: 8px;"></div>
      <div style="font-size: 12px; font-weight: 700; color: #94a3b8; letter-spacing: 0.04em; text-transform: uppercase;">
        ${labelText}
      </div>
    </div>
  `;
}

function hideMainModalDom() {
  stopErrorSpeech();
  const modal = document.getElementById('modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

export function setupModals({ currentLevel = 1 } = {}) {
  activeLessonLevel = Math.max(1, Number(currentLevel) || 1);

  if (!document.getElementById('modal')) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'modal';
    modalDiv.style.cssText = [
      'display: none;',
      'position: fixed;',
      'inset: 0;',
      'width: 100%;',
      'height: 100dvh;',
      'background: #0f172a;',
      'color: #f1f5f9;',
      'padding: calc(env(safe-area-inset-top, 0px) + 12px) 14px calc(env(safe-area-inset-bottom, 0px) + 16px);',
      'box-sizing: border-box;',
      'overflow-y: auto;',
      'text-align: left;',
      'z-index: 1000;',
      'font-family: system-ui, -apple-system, sans-serif;'
    ].join(' ');

    modalDiv.innerHTML = `
      <div style="max-width: 680px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; margin-bottom: 14px; border-bottom: 1px solid #1e293b; gap: 12px;">
          <h2 id="modal-title" style="margin: 0; font-size: 22px; font-weight: 800; color: #f8fafc;">Словарь</h2>
          <button
            id="close-modal"
            aria-label="Закрыть"
            style="
              width: 34px;
              height: 34px;
              border-radius: 999px;
              border: 1px solid #475569;
              background: rgba(15, 23, 42, 0.88);
              color: #f8fafc;
              font-size: 16px;
              font-weight: 700;
              line-height: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              flex-shrink: 0;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
            "
          >✕</button>
        </div>
        <div id="modal-content" style="display: flex; flex-direction: column; gap: 10px; line-height: 1.4;"></div>
      </div>
    `;
    document.body.appendChild(modalDiv);
  }

  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');

  function openModal(titleText, contentHtml) {
    const wasAlreadyOpen = modal.style.display === 'block' || isOverlayOpen(MAIN_MODAL_OVERLAY_KEY);
    modalTitle.textContent = titleText;
    modalContent.innerHTML = contentHtml;
    modal.style.display = 'block';
    modal.scrollTop = 0;

    if (!wasAlreadyOpen) {
      registerOverlayOpen(MAIN_MODAL_OVERLAY_KEY, hideMainModalDom);
    }
  }

  const wordsBtn = document.getElementById('words-btn');
  if (wordsBtn) {
    wordsBtn.onclick = () => {
      const { newWords, previousWords } = getDictionaryForLevel(activeLessonLevel);

      const previousSectionHtml = previousWords.length > 0
        ? `${renderDictionarySectionDivider()}${previousWords.map(w => renderDictionaryWordRow(w)).join('')}`
        : '';

      const html = `
        <div style="font-size: 13px; color: #94a3b8; margin-bottom: 2px;">
          Нажмите на слово, чтобы прослушать произношение
        </div>
        ${newWords.map(w => renderDictionaryWordRow(w)).join('')}
        ${previousSectionHtml}
      `;

      openModal(`Словарь · Ур. ${activeLessonLevel}`, html);

      const wordRows = modalContent.querySelectorAll('.dict-word-row');
      wordRows.forEach((row) => {
        const triggerSpeak = () => {
          const wordToSpeak = row.getAttribute('data-en');

          wordRows.forEach((r) => {
            r.style.borderColor = '#334155';
            r.style.backgroundColor = '#1e293b';
          });

          row.style.borderColor = '#60a5fa';
          row.style.backgroundColor = '#263349';

          speakEnglishWord(wordToSpeak, {
            onEnd: () => {
              row.style.borderColor = '#334155';
              row.style.backgroundColor = '#1e293b';
            }
          });
        };

        row.addEventListener('click', triggerSpeak);
        row.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerSpeak();
          }
        });
      });
    };
  }

  const rulesBtn = document.getElementById('rules-btn');
  if (rulesBtn) {
    rulesBtn.textContent = "Помощь";
    rulesBtn.onclick = () => {
      openSimpleHint(activeLessonLevel);
    };
  }

  const closeModal = document.getElementById('close-modal');
  if (closeModal) {
    closeModal.onclick = () => {
      closeOverlayByUi(MAIN_MODAL_OVERLAY_KEY, hideMainModalDom);
    };
  }
}

export function openHelpGuideModal() {
  setupModals({ currentLevel: activeLessonLevel });
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');
  const wasAlreadyOpen = modal.style.display === 'block' || isOverlayOpen(MAIN_MODAL_OVERLAY_KEY);

  modalTitle.textContent = "Помощь";
  modalContent.innerHTML = helpGuideHtml;
  modal.style.display = 'block';
  modal.scrollTop = 0;

  if (!wasAlreadyOpen) {
    registerOverlayOpen(MAIN_MODAL_OVERLAY_KEY, hideMainModalDom);
  }

  const reopenIntroBtn = document.getElementById('reopen-intro-btn');
  if (reopenIntroBtn) {
    reopenIntroBtn.onclick = () => {
      closeOverlayByUi(MAIN_MODAL_OVERLAY_KEY, hideMainModalDom);
      showProjectPresentation();
    };
  }
}