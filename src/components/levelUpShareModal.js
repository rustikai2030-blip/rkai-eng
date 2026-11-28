// src/components/levelUpShareModal.js
import {
  registerOverlayOpen,
  closeOverlayByUi,
  isOverlayOpen
} from '../utils/overlayStack.js';

const MODAL_ID = 'level-up-share-modal';
const STYLE_ID = 'level-up-share-styles';
const OVERLAY_KEY = 'level-up-share';

let activeOnFinish = null;
let hasSettledChoice = false;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${MODAL_ID} {
      display: none;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100dvh;
      max-height: 100dvh;
      z-index: 2600;
      background: rgba(2, 6, 23, 0.72);
      backdrop-filter: blur(4px);
      align-items: center;
      justify-content: center;
      padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom)) 16px;
      box-sizing: border-box;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    #${MODAL_ID}.open {
      display: flex;
    }

    .lus-card {
      width: 100%;
      max-width: 400px;
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 18px;
      padding: 22px 20px;
      box-sizing: border-box;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5);
      text-align: center;
    }

    .lus-badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.14);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 999px;
      padding: 4px 12px;
      margin-bottom: 12px;
    }

    .lus-title {
      margin: 0 0 8px 0;
      font-size: 22px;
      font-weight: 800;
      line-height: 1.25;
      color: #ffffff;
    }

    .lus-score {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.4;
    }

    .lus-question-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 14px 12px;
      margin-bottom: 18px;
      font-size: 17px;
      font-weight: 700;
      color: #e2e8f0;
      line-height: 1.35;
    }

    .lus-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .lus-btn {
      padding: 13px 14px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: transform 0.12s ease, opacity 0.15s ease, background-color 0.15s ease;
    }

    .lus-btn:active {
      transform: scale(0.97);
    }

    .lus-btn-no {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #475569;
    }

    .lus-btn-yes {
      background: #0284c7;
      color: #ffffff;
    }
  `;
  document.head.appendChild(style);
}

function getModalElement() {
  ensureStyles();
  let modal = document.getElementById(MODAL_ID);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    document.body.appendChild(modal);
  }
  return modal;
}

function hideModalDom() {
  const modal = document.getElementById(MODAL_ID);
  if (modal) {
    modal.classList.remove('open');
  }

  const callback = activeOnFinish;
  activeOnFinish = null;

  if (!hasSettledChoice && typeof callback === 'function') {
    hasSettledChoice = true;
    callback(false);
  }
}

function resolveChoice(agreed) {
  if (hasSettledChoice) return;
  hasSettledChoice = true;

  const callback = activeOnFinish;
  activeOnFinish = null;

  closeOverlayByUi(OVERLAY_KEY, () => {
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.remove('open');
  });

  if (typeof callback === 'function') {
    callback(Boolean(agreed));
  }
}

export function isLevelUpShareModalOpen() {
  const modal = document.getElementById(MODAL_ID);
  return Boolean(modal && modal.classList.contains('open')) || isOverlayOpen(OVERLAY_KEY);
}

/**
 * Показывает окно поздравления с переходом на новый уровень и запрашивает
 * подтверждение перед отправкой успеха («Да» / «Нет»).
 * Возвращает Promise<boolean>.
 */
export function promptLevelUpShare({ unlockedLevel, correctCount, totalCount }) {
  return new Promise((resolve) => {
    const modal = getModalElement();
    const wasAlreadyOpen = isLevelUpShareModalOpen();

    hasSettledChoice = false;
    activeOnFinish = resolve;

    const safeLevel = Math.max(2, Number(unlockedLevel) || 2);
    const safeCorrect = Math.max(0, Number(correctCount) || 0);
    const safeTotal = Math.max(1, Number(totalCount) || 1);

    modal.innerHTML = `
      <div class="lus-card">
        <div class="lus-badge">Новый уровень</div>
        <h2 class="lus-title">Поздравляем! Уровень ${safeLevel}</h2>
        <p class="lus-score">Тест пройден: ${safeCorrect} из ${safeTotal} правильных ответов.</p>
        <div class="lus-question-box">Хочешь поделиться успехом?</div>
        <div class="lus-actions">
          <button type="button" id="lus-no-btn" class="lus-btn lus-btn-no">Нет</button>
          <button type="button" id="lus-yes-btn" class="lus-btn lus-btn-yes">Да</button>
        </div>
      </div>
    `;

    modal.classList.add('open');

    if (!wasAlreadyOpen) {
      registerOverlayOpen(OVERLAY_KEY, hideModalDom);
    }

    const noBtn = modal.querySelector('#lus-no-btn');
    const yesBtn = modal.querySelector('#lus-yes-btn');

    if (noBtn) {
      noBtn.onclick = () => resolveChoice(false);
    }
    if (yesBtn) {
      yesBtn.onclick = () => resolveChoice(true);
    }
  });
}