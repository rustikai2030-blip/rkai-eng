// src/components/simpleHint.js

const HINT_MODAL_ID = 'simple-hint-modal';
const HINT_STYLE_ID = 'simple-hint-styles';

function ensureHintStyles() {
  if (document.getElementById(HINT_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = HINT_STYLE_ID;
  style.textContent = `
    #${HINT_MODAL_ID} {
      display: none;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100dvh;
      max-height: 100dvh;
      z-index: 2500;
      background: #0f172a;
      color: #f1f5f9;
      flex-direction: column;
      overflow: hidden;
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      box-sizing: border-box;
      font-family: system-ui, -apple-system, sans-serif;
    }

    #${HINT_MODAL_ID}.open {
      display: flex;
    }

    #${HINT_MODAL_ID} * {
      box-sizing: border-box;
    }

    .sh-floating-close {
      position: fixed;
      top: calc(env(safe-area-inset-top, 0px) + 8px);
      right: 10px;
      z-index: 2600;
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
      backdrop-filter: blur(6px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
      transition: transform 0.15s ease, background-color 0.15s ease;
    }

    .sh-floating-close:active {
      transform: scale(0.94);
      background: #1e293b;
    }

    .sh-tabs {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      padding: 8px 50px 8px 10px;
      background: #111827;
      border-bottom: 1px solid #1e293b;
      flex-shrink: 0;
    }

    .sh-tabs button {
      padding: clamp(6px, 0.9dvh, 9px) 4px;
      font-size: clamp(12px, 1.8dvh, 14px);
      font-weight: 700;
      border-radius: 8px;
      border: 1px solid #334155;
      background: #1e293b;
      color: #cbd5e1;
      cursor: pointer;
      white-space: nowrap;
      transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    }

    .sh-tabs button.active {
      background: #3b82f6;
      color: #ffffff;
      border-color: #3b82f6;
    }

    .sh-scroll-area {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      overflow-x: auto;
      overflow-y: hidden;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }

    .sh-scroll-area::-webkit-scrollbar {
      display: none;
    }

    .sh-col {
      flex: 0 0 100%;
      width: 100%;
      height: 100%;
      overflow: hidden;
      scroll-snap-align: start;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2px 10px 4px;
    }

    .sh-tense {
      padding: clamp(3px, 0.5dvh, 6px) 10px;
      font-size: clamp(12px, 1.85dvh, 15px);
      font-weight: 800;
      background: #1e293b;
      color: #e2e8f0;
      border-radius: 6px;
      border: 1px solid #334155;
      line-height: 1.15;
      flex-shrink: 0;
    }

    .sh-row {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: clamp(2px, 0.45dvh, 6px) 4px;
      border-bottom: 1px dashed #263349;
    }

    .sh-row:last-child {
      border-bottom: none;
    }

    .sh-pronouns {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: clamp(12px, 1.85dvh, 15px);
      font-weight: 700;
      line-height: 1.18;
      color: #f1f5f9;
    }

    .sh-brace {
      align-self: stretch;
      max-height: 92%;
      width: 10px;
      flex-shrink: 0;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 100' preserveAspectRatio='none'%3E%3Cpath d='M2 2 C8 2, 7 10, 7 22 L7 42 C7 47, 10 50, 13 50 C10 50, 7 53, 7 58 L7 78 C7 90, 8 98, 2 98' fill='none' stroke='%2360a5fa' stroke-width='2.4'/%3E%3C/svg%3E") no-repeat center / 100% 100%;
    }

    .sh-brace-l {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 100' preserveAspectRatio='none'%3E%3Cpath d='M12 2 C6 2, 7 10, 7 22 L7 42 C7 47, 4 50, 1 50 C4 50, 7 53, 7 58 L7 78 C7 90, 6 98, 12 98' fill='none' stroke='%2360a5fa' stroke-width='2.4'/%3E%3C/svg%3E");
    }

    .sh-aux {
      font-size: clamp(14px, 2.2dvh, 18px);
      font-weight: 800;
      color: #60a5fa;
      line-height: 1.1;
    }

    .sh-en {
      font-size: clamp(15px, 2.35dvh, 19px);
      font-weight: 800;
      color: #f8fafc;
      line-height: 1.15;
    }

    .sh-en b {
      color: #60a5fa;
    }

    .sh-ru {
      font-size: clamp(11px, 1.7dvh, 14px);
      color: #94a3b8;
      margin-top: 2px;
      line-height: 1.15;
    }
  `;
  document.head.appendChild(style);
}

function getSimpleHintModalElement() {
  ensureHintStyles();

  let modal = document.getElementById(HINT_MODAL_ID);
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = HINT_MODAL_ID;
  modal.innerHTML = `
    <button type="button" class="sh-floating-close" id="sh-close-btn" aria-label="Закрыть подсказку">✕</button>

    <div class="sh-tabs" id="sh-tabs">
      <button type="button" data-col="0">Вопрос</button>
      <button type="button" data-col="1" class="active">Утверждение</button>
      <button type="button" data-col="2">Отрицание</button>
    </div>

    <div class="sh-scroll-area" id="sh-scroll">
      <!-- 0: Вопрос -->
      <div class="sh-col">
        <div class="sh-tense">Будущее время</div>
        <div class="sh-row">
          <span class="sh-aux">Will</span><span class="sh-brace sh-brace-l"></span>
          <div class="sh-pronouns"><span>I</span><span>You</span><span>We</span><span>They</span><span>He</span><span>She</span><span>It</span></div>
          <span class="sh-brace"></span>
          <div><div class="sh-en">work?</div><div class="sh-ru">буду работать?</div></div>
        </div>
        <div class="sh-tense">Настоящее время</div>
        <div class="sh-row">
          <span class="sh-aux">Do</span><span class="sh-brace sh-brace-l"></span>
          <div class="sh-pronouns"><span>I</span><span>You</span><span>We</span><span>They</span></div>
          <span class="sh-brace"></span>
          <div><div class="sh-en">work?</div><div class="sh-ru">работаю? / работают?</div></div>
        </div>
        <div class="sh-row">
          <span class="sh-aux">Does</span><span class="sh-brace sh-brace-l"></span>
          <div class="sh-pronouns"><span>He</span><span>She</span><span>It</span></div>
          <span class="sh-brace"></span>
          <div><div class="sh-en">work?</div><div class="sh-ru">работает?</div></div>
        </div>
        <div class="sh-tense">Прошедшее время</div>
        <div class="sh-row">
          <span class="sh-aux">Did</span><span class="sh-brace sh-brace-l"></span>
          <div class="sh-pronouns"><span>I</span><span>You</span><span>We</span><span>They</span><span>He</span><span>She</span><span>It</span></div>
          <span class="sh-brace"></span>
          <div><div class="sh-en">work?</div><div class="sh-ru">работал(а/и)?</div></div>
        </div>
      </div>

      <!-- 1: Утверждение -->
      <div class="sh-col">
        <div class="sh-tense">Будущее время</div>
        <div class="sh-row">
          <div class="sh-pronouns"><span>I</span><span>You</span><span>We</span><span>They</span><span>He</span><span>She</span><span>It</span></div>
          <span class="sh-brace"></span>
          <div><div class="sh-en"><b>will</b> work</div><div class="sh-ru">буду работать</div></div>
        </div>
        <div class="sh-tense">Настоящее время</div>
        <div class="sh-row">
          <div class="sh-pronouns"><span>I</span><span>You</span><span>We</span><span>They</span></div>
          <span class="sh-brace"></span>
          <div><div class="sh-en">work</div><div class="sh-ru">работаю / работают</div></div>
        </div>
        <div class="sh-row">
          <div class="sh-pronouns"><span>He</span><span>She</span><span>It</span></div>
          <span class="sh-brace"></span>
          <div><div class="sh-en">work<b>s</b></div><div class="sh-ru">работает</div></div>
        </div>
        <div class="sh-tense">Прошедшее время</div>
        <div class="sh-row">
          <div class="sh-pronouns"><span>I</span><span>You</span><span>We</span><span>They</span><span>He</span><span>She</span><span>It</span></div>
          <span class="sh-brace"></span>
          <div><div class="sh-en">work<b>ed</b></div><div class="sh-ru">работал / работала / работали</div></div>
        </div>
      </div>

      <!-- 2: Отрицание (сокращённая форма) -->
      <div class="sh-col">
        <div class="sh-tense">Будущее время</div>
        <div class="sh-row">
          <div class="sh-pronouns"><span>I</span><span>You</span><span>We</span><span>They</span><span>He</span><span>She</span><span>It</span></div>
          <span class="sh-brace"></span>
          <div><div class="sh-en"><b>won't</b> work</div><div class="sh-ru">не буду работать</div></div>
        </div>
        <div class="sh-tense">Настоящее время</div>
        <div class="sh-row">
          <div class="sh-pronouns"><span>I</span><span>You</span><span>We</span><span>They</span></div>
          <span class="sh-brace"></span>
          <div><div class="sh-en"><b>don't</b> work</div><div class="sh-ru">не работаю / не работают</div></div>
        </div>
        <div class="sh-row">
          <div class="sh-pronouns"><span>He</span><span>She</span><span>It</span></div>
          <span class="sh-brace"></span>
          <div><div class="sh-en"><b>doesn't</b> work</div><div class="sh-ru">не работает</div></div>
        </div>
        <div class="sh-tense">Прошедшее время</div>
        <div class="sh-row">
          <div class="sh-pronouns"><span>I</span><span>You</span><span>We</span><span>They</span><span>He</span><span>She</span><span>It</span></div>
          <span class="sh-brace"></span>
          <div><div class="sh-en"><b>didn't</b> work</div><div class="sh-ru">не работал(а/и)</div></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('#sh-close-btn');
  const scrollArea = modal.querySelector('#sh-scroll');
  const tabButtons = modal.querySelectorAll('#sh-tabs button');

  function setActiveTab(index) {
    tabButtons.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === index);
    });
  }

  closeBtn.addEventListener('click', () => {
    closeSimpleHint();
  });

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const colIndex = Number(btn.getAttribute('data-col'));
      scrollArea.scrollTo({
        left: colIndex * scrollArea.clientWidth,
        behavior: 'smooth'
      });
      setActiveTab(colIndex);
    });
  });

  scrollArea.addEventListener('scroll', () => {
    if (!scrollArea.clientWidth) return;
    const index = Math.round(scrollArea.scrollLeft / scrollArea.clientWidth);
    setActiveTab(index);
  });

  return modal;
}

export function openSimpleHint(initialCol = 1) {
  const modal = getSimpleHintModalElement();
  const scrollArea = modal.querySelector('#sh-scroll');
  const tabButtons = modal.querySelectorAll('#sh-tabs button');

  modal.classList.add('open');

  requestAnimationFrame(() => {
    const clampedCol = Math.max(0, Math.min(2, initialCol));
    scrollArea.scrollLeft = clampedCol * scrollArea.clientWidth;
    tabButtons.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === clampedCol);
    });
  });
}

export function closeSimpleHint() {
  const modal = document.getElementById(HINT_MODAL_ID);
  if (modal) {
    modal.classList.remove('open');
  }
}

export function isSimpleHintOpen() {
  const modal = document.getElementById(HINT_MODAL_ID);
  return Boolean(modal && modal.classList.contains('open'));
}