// src/components/modals.js
import { dictionaryWords } from '../data/tasks.js';

export function setupModals() {
  if (!document.getElementById('modal')) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'modal';
    modalDiv.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #16171d; color: #f3f4f6; padding: 20px; box-sizing: border-box; overflow-y: auto; text-align: left; z-index: 1000;';
    modalDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 id="modal-title" style="margin: 0; font-size: 26px;">Словарь</h2>
        <button id="close-modal" style="padding: 10px 18px; background: var(--accent, #38bdf8); color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">✕ Закрыть</button>
      </div>
      <div id="modal-content" style="display: flex; flex-direction: column; gap: 16px; line-height: 1.5;"></div>
    `;
    document.body.appendChild(modalDiv);
  }

  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');

  // Функция открытия модального окна с добавлением состояния в историю браузера
  function openModal(titleText, contentHtml) {
    modalTitle.textContent = titleText;
    modalContent.innerHTML = contentHtml;
    modal.style.display = 'block';
    
    // Добавляем запись в историю браузера, чтобы кнопка "Назад" на телефоне работала
    history.pushState({ modalOpen: true }, '');
  }

  // Функция закрытия модального окна
  function closeModalWindow(isBackAction = false) {
    if (modal.style.display === 'block') {
      modal.style.display = 'none';
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

      openModal("Словарь", html);
    };
  }

  // Кнопка "Правила" переименована в "Помощь"
  const rulesBtn = document.getElementById('rules-btn');
  if (rulesBtn) {
    rulesBtn.textContent = "Помощь";
    rulesBtn.onclick = () => {
      const helpHtml = `
        <div style="font-size: 20px; color: #e5e7eb; display: flex; flex-direction: column; gap: 18px;">
          <p>Сейчас очень много крутых обучающих приложений по английскому языку.</p>
          <p>А вы знаете какой там процент отсеивания? Больше 95% пользователей бросают английский в ближайший месяц-два.</p>
          <p>И на это есть серьезная причина, которая кстати не позволяет вам заговорить на английском, хотя вы его учите уже не первый год.</p>
          <p><b>Вам не стоит начинать учить английский язык, пока вы не узнаете эту причину.</b></p>
          <p>А причина в следующем.<br>В русском языке слова связываются с помощью окончаний.<br>В английском эту роль берет на себя глагол. Вся грамматика сосредоточена на изучении разных форм глагола.</p>
          
          <h3 style="color: #f3f4f6; font-size: 22px; margin: 10px 0 0 0;">Давайте посчитаем сколько форм глагола надо выучить, что бы знать английский:</h3>
          <p>Существует 4 группы времен: <b>Simple, Continuous, Perfect, Perfect Continuous</b>.</p>
          <ul style="margin: 0; padding-left: 24px; display: flex; flex-direction: column; gap: 8px;">
            <li>В каждом типе 9 форм (Настоящее, Прошедшее, Будущее и Утверждение, Отрицание, Вопрос).</li>
            <li>В каждой ячейке 7 основных местоимений.</li>
          </ul>
          <p>Получается <b>4 x 9 x 7 = 252 варианта</b>.<br>Это все активный залог глаголов. Есть ещё пассивный залог, поэтому умножаем все на два и получаем <b>504 варианта</b>, которые нужно выучить обучающемуся, плюс хотя бы 1000 английских слов.</p>
          <p>После этого неудивительно, что практически все обучающие забрасывают занятия.</p>

          <h3 style="color: #f3f4f6; font-size: 22px; margin: 10px 0 0 0;">Мы же пойдем другим путем:</h3>
          <p>Используем правило Парето 80/20:</p>
          <ul style="margin: 0; padding-left: 24px; display: flex; flex-direction: column; gap: 8px;">
            <li>Отбрасываем пассивный залог полностью, так как на его использование в языке приходится всего 10%. Остаётся <b>252 варианта</b>.</li>
            <li>Берём первый базовый тип глагола <b>Simple</b> — на него приходится 80% языка, остальные 3 типа глаголов отбрасываем. Остаётся <b>63 варианта</b>.</li>
            <li>В Simple все местоимения можно объединить в две группы вместо семи. Остаётся <code>(63 : 7 * 2) = <b>18 вариантов</b></code>.</li>
          </ul>
          <p><b>В итоге вместо 504 вариантов остаётся 18 вариантов, которые охватывают 80% языка.</b></p>
          <p>Звучит фантастически, но мы действительно упрощаем обучение в 28 раз.</p>

          <h3 style="color: #f3f4f6; font-size: 22px; margin: 10px 0 0 0;">Главный секрет успеха</h3>
          <p>Но эти 18 вариантов нам надо не просто выучить, а довести их использование до максимального автоматизма, чего мы и добиваемся в наших тренажёрах.</p>
          <p>Вообще английскому языку надо не обучать, а тренировать. Обучать английскому — бесполезное занятие. Вы не сможете на нем разговаривать, пока не доведете до автоматизма применение его правил, как в родном языке. А в этом нам могут помочь только тренажёры.</p>
          <p>Как только мы доведём до автоматизма базу, то возьмём ещё пару правил и охватим до 95-96% языка.</p>
          
          <p style="font-weight: bold; color: var(--accent, #38bdf8); margin-top: 10px;">Добро пожаловать на самый эффективный курс английского языка. Курс полностью бесплатный.</p>
        </div>
      `;
      openModal("Помощь", helpHtml);
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