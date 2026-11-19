// src/components/onboarding.js

const HIDE_INTRO_STORAGE_KEY = 'rkai_hide_intro';

export const projectPresentationHtml = `
  <div style="font-size: 20px; color: #e5e7eb; display: flex; flex-direction: column; gap: 18px; line-height: 1.65;">
    <p style="margin: 0;">Сейчас очень много крутых обучающих приложений по английскому языку.</p>

    <p style="margin: 0;">А вы знаете какой там процент отсеивания? <b style="color: #ffffff;">Больше 95% пользователей</b> бросают английский в ближайший месяц-два.</p>

    <p style="margin: 0;">И на это есть серьезная причина, которая кстати не позволяет вам заговорить на английском, хотя вы его учите уже не первый год.</p>

    <div style="background: rgba(255, 255, 255, 0.05); border-left: 4px solid #38bdf8; padding: 14px 16px; border-radius: 0 10px 10px 0;">
      <p style="margin: 0; font-size: 21px; color: #ffffff;"><b>Вам не стоит начинать учить английский язык, пока вы не узнаете эту причину.</b></p>
    </div>

    <p style="margin: 0;">А причина в следующем.<br>В русском языке слова связываются с помощью окончаний.<br>В английском эту роль берет на себя глагол. Вся грамматика сосредоточена на изучении разных форм глагола.</p>

    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid #2e303a; border-radius: 14px; padding: 16px 18px;">
      <h3 style="color: #ffffff; font-size: 22px; line-height: 1.35; margin: 0 0 12px 0;">Давайте посчитаем сколько форм глагола надо выучить, что бы знать английский:</h3>
      <p style="margin: 0 0 10px 0;">Существует 4 группы времен: <b style="color: #ffffff;">Simple, Continuous, Perfect, Perfect Continuous</b>.</p>
      <ul style="margin: 0 0 12px 0; padding-left: 24px; display: flex; flex-direction: column; gap: 8px;">
        <li>В каждом типе 9 форм (Настоящее, Прошедшее, Будущее и Утверждение, Отрицание, Вопрос).</li>
        <li>В каждой ячейке 7 основных местоимений.</li>
      </ul>
      <p style="margin: 0 0 10px 0;">Получается <b style="color: #ffffff;">4 x 9 x 7 = 252 варианта</b>.<br>Это все активный залог глаголов. Есть ещё пассивный залог, поэтому умножаем все на два и получаем <b style="color: #ffffff;">504 варианта</b>, которые нужно выучить обучающемуся, плюс хотя бы 1000 английских слов.</p>
      <p style="margin: 0; color: #cbd5e1;">После этого неудивительно, что практически все обучающие забрасывают занятия.</p>
    </div>

    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid #2e303a; border-radius: 14px; padding: 16px 18px;">
      <h3 style="color: #ffffff; font-size: 22px; line-height: 1.35; margin: 0 0 12px 0;">Мы же пойдем другим путем:</h3>
      <p style="margin: 0 0 10px 0;">Используем <b style="color: #38bdf8;">правило Парето 80/20</b>:</p>
      <ul style="margin: 0 0 12px 0; padding-left: 24px; display: flex; flex-direction: column; gap: 10px;">
        <li>Отбрасываем пассивный залог полностью, так как на его использование в языке приходится всего 10%. Остаётся <b style="color: #ffffff;">252 варианта</b>.</li>
        <li>Берём первый базовый тип глагола <b style="color: #ffffff;">Simple</b> — на него приходится 80% языка, остальные 3 типа глаголов отбрасываем. Остаётся <b style="color: #ffffff;">63 варианта</b>.</li>
        <li>В Simple все местоимения можно объединить в две группы вместо семи. Остаётся <code style="font-size: 18px; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.08); color: #ffffff;">(63 : 7 * 2) = <b>18 вариантов</b></code>.</li>
      </ul>
      <p style="margin: 0 0 10px 0; font-size: 21px; color: #ffffff;"><b>В итоге вместо 504 вариантов остаётся 18 вариантов, которые охватывают 80% языка.</b></p>
      <p style="margin: 0; color: #cbd5e1;">Звучит фантастически, но мы действительно упрощаем обучение в 28 раз.</p>
    </div>

    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid #2e303a; border-radius: 14px; padding: 16px 18px;">
      <h3 style="color: #ffffff; font-size: 22px; line-height: 1.35; margin: 0 0 12px 0;">Главный секрет успеха</h3>
      <p style="margin: 0 0 10px 0;">Но эти 18 вариантов нам надо не просто выучить, а довести их использование до максимального автоматизма, чего мы и добиваемся в наших тренажёрах.</p>
      <p style="margin: 0 0 10px 0;">Вообще английскому языку надо не обучать, а тренировать. Обучать английскому — бесполезное занятие. Вы не сможете на нем разговаривать, пока не доведете до автоматизма применение его правил, как в родном языке. А в этом нам могут помочь только тренажёры.</p>
      <p style="margin: 0;">Как только мы доведём до автоматизма базу, то возьмём ещё пару правил и охватим до 95-96% языка.</p>
    </div>
    
    <div style="background: rgba(56, 189, 248, 0.15); border: 2px solid #38bdf8; padding: 18px; border-radius: 14px; text-align: center; margin-top: 4px;">
      <p style="font-weight: bold; font-size: 21px; line-height: 1.45; color: #38bdf8; margin: 0;">Добро пожаловать в Pareto English — самый эффективный тренажер английского языка. Курс полностью бесплатный.</p>
    </div>
  </div>
`;

export const helpGuideHtml = `
  <div style="font-size: 20px; color: #e5e7eb; display: flex; flex-direction: column; gap: 18px; line-height: 1.6;">
    <div style="background: var(--code-bg, #1f2028); padding: 16px 18px; border-radius: 14px; border: 1px solid var(--border, #2e303a);">
      <h3 style="color: #ffffff; font-size: 22px; margin: 0 0 10px 0;">Как устроен тренажёр</h3>
      <p style="margin: 0 0 10px 0;">Задания идут циклами: <b style="color: #ffffff;">7 переводов с русского на английский</b> (набор на встроенной клавиатуре) и <b style="color: #ffffff;">3 с английского на русский</b> (выбор варианта).</p>
      <p style="margin: 0;">Клавиша <code style="font-size: 18px; padding: 2px 7px; border-radius: 6px; background: rgba(255,255,255,0.08); color: #ffffff;">⇧</code> ставит заглавную букву (по умолчанию активна в начале строки), <code style="font-size: 18px; padding: 2px 7px; border-radius: 6px; background: rgba(255,255,255,0.08); color: #ffffff;">⌫</code> удаляет символ (при удержании — непрерывно), <code style="font-size: 18px; padding: 2px 7px; border-radius: 6px; background: rgba(255,255,255,0.08); color: #ffffff;">✓</code> проверяет ответ.</p>
    </div>

    <div style="background: var(--code-bg, #1f2028); padding: 16px 18px; border-radius: 14px; border: 1px solid var(--border, #2e303a);">
      <h3 style="color: #ffffff; font-size: 22px; margin: 0 0 10px 0;">Уровни, фильтры и тест</h3>
      <p style="margin: 0 0 10px 0;">По мере прогресса открываются отрицания и вопросы, а также появляются кнопки фильтров категорий — можно тренировать нужный тип отдельно.</p>
      <p style="margin: 0;">Когда откроется кнопка перехода на следующий уровень, нажмите её для запуска теста на время. Для перехода нужно набрать не менее 90% правильных ответов.</p>
    </div>

    <div style="background: var(--code-bg, #1f2028); padding: 16px 18px; border-radius: 14px; border: 1px solid var(--border, #2e303a);">
      <h3 style="color: #ffffff; font-size: 22px; margin: 0 0 10px 0;">Сохранение прогресса и PWA</h3>
      <p style="margin: 0 0 10px 0;">Войдите через Google, чтобы сохранять прогресс и статистику в облаке. Без входа тренировка работает в гостевом режиме.</p>
      <p style="margin: 0;">Сайт можно установить на экран смартфона как приложение через кнопку установки или меню браузера.</p>
    </div>

    <button id="reopen-intro-btn" style="width: 100%; padding: 14px 18px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 2px solid #38bdf8; border-radius: 12px; font-size: 18px; font-weight: 700; cursor: pointer;">
      Показать презентацию «О проекте "Pareto English"»
    </button>
  </div>
`;

export function isIntroHidden() {
  return localStorage.getItem(HIDE_INTRO_STORAGE_KEY) === 'true';
}

export function setIntroHidden(hidden) {
  localStorage.setItem(HIDE_INTRO_STORAGE_KEY, hidden ? 'true' : 'false');
}

export function showProjectPresentation({ onClose } = {}) {
  let introModal = document.getElementById('intro-presentation-modal');

  if (!introModal) {
    introModal = document.createElement('div');
    introModal.id = 'intro-presentation-modal';
    introModal.style.cssText = [
      'display: none;',
      'position: fixed;',
      'inset: 0;',
      'width: 100%;',
      'height: 100%;',
      'background: #16171d;',
      'color: #f3f4f6;',
      'box-sizing: border-box;',
      'z-index: 1500;',
      'flex-direction: column;',
      'font-family: system-ui, -apple-system, sans-serif;'
    ].join(' ');

    introModal.innerHTML = `
      <div style="max-width: 680px; width: 100%; height: 100%; margin: 0 auto; display: flex; flex-direction: column; padding: 18px 20px; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid #2e303a; flex-shrink: 0;">
          <h2 id="intro-modal-title" style="margin: 0; font-size: 25px; font-weight: 700; color: #ffffff;">О проекте "Pareto English"</h2>
          <button id="intro-close-top-btn" style="padding: 9px 15px; background: #272935; color: #f3f4f6; border: 1px solid #3f4254; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">✕</button>
        </div>

        <div id="intro-modal-body" style="flex: 1 1 auto; overflow-y: auto; padding: 18px 2px; text-align: left;">
          ${projectPresentationHtml}
        </div>

        <div style="flex-shrink: 0; padding-top: 14px; border-top: 1px solid #2e303a; display: flex; flex-direction: column; gap: 12px; background: #16171d;">
          <label style="display: flex; align-items: center; gap: 10px; font-size: 17px; color: #e2e8f0; cursor: pointer; user-select: none;">
            <input type="checkbox" id="dont-show-intro-checkbox" style="width: 20px; height: 20px; accent-color: #38bdf8; cursor: pointer;" />
            <span>Не показывать при следующем входе</span>
          </label>

          <button id="intro-continue-btn" style="width: 100%; padding: 14px 18px; background: #38bdf8; color: #081018; border: none; border-radius: 10px; font-size: 18px; font-weight: 700; cursor: pointer;">
            Перейти к тренажёру
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(introModal);
  }

  const checkbox = document.getElementById('dont-show-intro-checkbox');
  if (checkbox) {
    checkbox.checked = isIntroHidden();
    checkbox.onchange = () => {
      setIntroHidden(checkbox.checked);
    };
  }

  const closeIntro = () => {
    if (checkbox) {
      setIntroHidden(checkbox.checked);
    }
    introModal.style.display = 'none';
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const closeTopBtn = document.getElementById('intro-close-top-btn');
  const continueBtn = document.getElementById('intro-continue-btn');

  if (closeTopBtn) closeTopBtn.onclick = closeIntro;
  if (continueBtn) continueBtn.onclick = closeIntro;

  introModal.style.display = 'flex';
  const bodyEl = document.getElementById('intro-modal-body');
  if (bodyEl) bodyEl.scrollTop = 0;
}