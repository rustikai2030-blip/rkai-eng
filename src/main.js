import './styles/evolution.css';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('#app');

  const ruEnTasks = [
    { ru: "Я работаю", en: "I work" },
    { ru: "Ты работаешь", en: "You work" },
    { ru: "Мы работаем", en: "We work" },
    { ru: "Они работают", en: "They work" },
    { ru: "Он работает", en: "He works" },
    { ru: "Она работает", en: "She works" },
    { ru: "Оно работает", en: "It works" },
    { ru: "Я работал", en: "I worked" },
    { ru: "Ты работал", en: "You worked" },
    { ru: "Мы работали", en: "We worked" },
    { ru: "Он работал", en: "He worked" },
    { ru: "Она работала", en: "She worked" },
    { ru: "Оно работало", en: "It worked" },
    { ru: "Они работали", en: "They worked" }
  ];

  const enRuTasks = [
    { en: "I work", options: ["Я работаю", "Ты работаешь", "Мы работаем", "Он работает"], correct: "Я работаю" },
    { en: "You work", options: ["Ты работаешь", "Они работают", "Оно работает", "Я работаю"], correct: "Ты работаешь" },
    { en: "We work", options: ["Мы работаем", "Вы работаете", "Они работают", "Я работаю"], correct: "Мы работаем" },
    { en: "They work", options: ["Они работают", "Мы работаем", "Он работает", "Она работает"], correct: "Они работают" },
    { en: "He works", options: ["Он работает", "Она работает", "Оно работает", "Я работаю"], correct: "Он работает" },
    { en: "She works", options: ["Она работает", "Он работает", "Мы работаем", "Они работают"], correct: "Она работает" },
    { en: "It works", options: ["Оно работает", "Он работает", "Она работает", "Я работаю"], correct: "Оно работает" },
    { en: "I worked", options: ["Я работал", "Ты работал", "Мы работали", "Он работал"], correct: "Я работал" }
  ];

  let sessionIndex = 0;         
  let totalCorrectAnswers = 0;  
  let totalIncorrectAnswers = 0; 
  let currentTask = null;       
  let isEnglishToRussian = false; 
  let currentInput = "";
  let isUpperCase = true;
  let lastFeedback = "";        
  let lastFeedbackColor = "";   
  
  let secondsElapsed = 0;        
  let timerInterval = null;

  function pickNewTask() {
    let modeIndex = sessionIndex % 10;
    isEnglishToRussian = modeIndex >= 7;

    if (!isEnglishToRussian) {
      currentTask = ruEnTasks[Math.floor(Math.random() * ruEnTasks.length)];
    } else {
      currentTask = enRuTasks[Math.floor(Math.random() * enRuTasks.length)];
    }
  }

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      secondsElapsed++;
      const timerEl = document.getElementById('timer-display');
      if (timerEl) {
        timerEl.textContent = `⏱ ${formatTime(secondsElapsed)}`;
      }
    }, 1000);
  }

  function renderTrainer() {
    if (!currentTask) {
      pickNewTask();
    }

    const showStats = totalCorrectAnswers >= 2;

    app.innerHTML = `
      <!-- Верхняя панель: компактные кнопки и часы по центру -->
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 20px;">
        <button id="words-btn" style="width: 100px; padding: 8px 10px; font-size: 14px; background: #fff; color: #000; border: 2px solid #000; cursor: pointer;">Слова</button>
        <div id="timer-display" style="font-size: 16px; font-weight: bold; min-width: 60px; text-align: center; visibility: ${showStats ? 'visible' : 'hidden'};">⏱ ${formatTime(secondsElapsed)}</div>
        <button id="rules-btn" style="width: 100px; padding: 8px 10px; font-size: 14px; background: #fff; color: #000; border: 2px solid #000; cursor: pointer;">Правила</button>
      </div>
    `;

    if (!isEnglishToRussian) {
      app.innerHTML += `
        <div style="margin: 20px 0;">
          <!-- Задание с цифрами близко к тексту -->
          <div style="display: flex; justify-content: center; align-items: center; gap: 25px; margin-bottom: 15px;">
            <div style="font-size: 24px; font-weight: bold; color: green; visibility: ${showStats ? 'visible' : 'hidden'};">${totalCorrectAnswers}</div>
            <p style="font-size: 24px; font-weight: bold; margin: 0;">${currentTask.ru}</p>
            <div style="font-size: 24px; font-weight: bold; color: red; visibility: ${showStats ? 'visible' : 'hidden'};">${totalIncorrectAnswers}</div>
          </div>

          <div id="answer-display" style="border: 2px solid #000; padding: 15px; font-size: 22px; min-height: 30px; margin-bottom: 10px; letter-spacing: 2px; background: #fff; color: #000;">${currentInput}</div>
          <div id="feedback-msg" style="height: 24px; font-size: 16px; font-weight: bold; color: ${lastFeedbackColor};">${lastFeedback}</div>
        </div>

        <div id="keyboard" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px;"></div>

        <div style="display: flex; gap: 8px;">
          <button id="space-btn" style="flex: 3; padding: 15px; background: #fff; color: #000; border: 2px solid #000; font-size: 16px; cursor: pointer;">пробел</button>
          <button id="backspace-btn" style="flex: 1.5; padding: 15px; background: #fff; color: #000; border: 2px solid #000; font-size: 18px; cursor: pointer;">⌫</button>
          <button id="ok-btn" style="flex: 1.5; padding: 15px; background: #fff; color: #000; border: 2px solid #000; font-size: 18px; font-weight: bold; cursor: pointer;">✓</button>
        </div>
      `;

      setupKeyboard();
    } else {
      app.innerHTML += `
        <div style="margin: 20px 0;">
          <!-- Задание с цифрами близко к тексту -->
          <div style="display: flex; justify-content: center; align-items: center; gap: 25px; margin-bottom: 20px;">
            <div style="font-size: 24px; font-weight: bold; color: green; visibility: ${showStats ? 'visible' : 'hidden'};">${totalCorrectAnswers}</div>
            <p style="font-size: 24px; font-weight: bold; margin: 0;">${currentTask.en}</p>
            <div style="font-size: 24px; font-weight: bold; color: red; visibility: ${showStats ? 'visible' : 'hidden'};">${totalIncorrectAnswers}</div>
          </div>

          <div id="feedback-msg" style="height: 24px; font-size: 16px; font-weight: bold; margin-bottom: 15px; color: ${lastFeedbackColor};">${lastFeedback}</div>
          <div id="options-container" style="display: flex; flex-direction: column; gap: 10px;">
            ${currentTask.options.map(opt => `
              <button class="option-btn" style="padding: 15px; background: #fff; color: #000; border: 2px solid #000; font-size: 18px; cursor: pointer; text-align: center;">${opt}</button>
            `).join('')}
          </div>
        </div>
      `;

      setupOptions();
    }

    setupModals();
    startTimer();
  }

  function setupKeyboard() {
    const row1 = ['w', 'e', 'r', 't', 'y', 'u', 'i', 'o'];
    const row2 = ['shift', 's', 'd', 'h', 'k', 'l'];

    const kbContainer = document.getElementById('keyboard');
    if (!kbContainer) return;
    kbContainer.innerHTML = '';

    const rowsData = [row1, row2];

    rowsData.forEach(rowKeys => {
      const rowDiv = document.createElement('div');
      rowDiv.style.cssText = 'display: flex; justify-content: center; gap: 6px; margin-bottom: 6px;';

      rowKeys.forEach(key => {
        const btn = document.createElement('button');
        btn.style.cssText = 'flex: 1; height: 48px; font-size: 18px; font-weight: bold; background: #fff; color: #000; border: 2px solid #000; display: flex; align-items: center; justify-content: center; box-sizing: border-box; cursor: pointer;';

        if (key === 'shift') {
          btn.textContent = '⇧';
          btn.onclick = () => {
            isUpperCase = !isUpperCase;
            setupKeyboard();
          };
          rowDiv.appendChild(btn);
        } else {
          btn.textContent = isUpperCase ? key.toUpperCase() : key;
          btn.addEventListener('click', () => {
            let charToAdd = isUpperCase ? key.toUpperCase() : key;
            currentInput += charToAdd;
            isUpperCase = false;
            document.getElementById('answer-display').textContent = currentInput;
          });
          rowDiv.appendChild(btn);
        }
      });

      kbContainer.appendChild(rowDiv);
    });

    const backspaceBtn = document.getElementById('backspace-btn');
    if (backspaceBtn) {
      backspaceBtn.onclick = () => {
        currentInput = currentInput.slice(0, -1);
        if (currentInput.length === 0) isUpperCase = true;
        document.getElementById('answer-display').textContent = currentInput;
      };
    }

    const spaceBtn = document.getElementById('space-btn');
    if (spaceBtn) {
      spaceBtn.onclick = () => {
        currentInput += " ";
        document.getElementById('answer-display').textContent = currentInput;
      };
    }

    const okBtn = document.getElementById('ok-btn');
    if (okBtn) {
      okBtn.onclick = () => {
        if (currentInput.trim().toLowerCase() === currentTask.en.toLowerCase()) {
          if (totalCorrectAnswers >= 2) {
            lastFeedback = "Правильно";
            lastFeedbackColor = "green";
          }
          totalCorrectAnswers++;
          sessionIndex++;
          currentInput = "";
          isUpperCase = true;
          pickNewTask();
          renderTrainer();
        } else {
          if (totalCorrectAnswers >= 2) {
            lastFeedback = "Неправильно";
            lastFeedbackColor = "red";
          }
          totalIncorrectAnswers++;
          currentInput = "";
          isUpperCase = true;
          renderTrainer();
        }
      };
    }
  }

  function setupOptions() {
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.textContent.trim() === currentTask.correct) {
          if (totalCorrectAnswers >= 2) {
            lastFeedback = "Правильно";
            lastFeedbackColor = "green";
          }
          totalCorrectAnswers++;
          sessionIndex++;
          pickNewTask();
          renderTrainer();
        } else {
          if (totalCorrectAnswers >= 2) {
            lastFeedback = "Неправильно";
            lastFeedbackColor = "red";
          }
          totalIncorrectAnswers++;
          renderTrainer();
        }
      });
    });
  }

  function setupModals() {
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
          <p>I - Я</p>
          <p>You - Ты</p>
          <p>We - Мы</p>
          <p>He - Он</p>
          <p>She - Она</p>
          <p>It - Оно</p>
          <p>They - Они</p>
          <p>Work - Работать</p>
          <p>Worked - Работал (прошед. время)</p>
        `;
        modal.style.display = 'block';
      };
    }

    const rulesBtn = document.getElementById('rules-btn');
    if (rulesBtn) {
      rulesBtn.onclick = () => {
        modalContent.innerHTML = `
          <h2>Правила (Simple - Утвердительная форма)</h2>
          <h3>Будущее время</h3>
          <p>I will work. — Я буду работать</p>
          <h3>Настоящее время</h3>
          <p>I / You / We / They work — Я / Ты / Мы / Они работаем</p>
          <p>He / She / It works — Он / Она / Оно работает</p>
          <h3>Прошедшее время</h3>
          <p>I worked. — Я работал</p>
        `;
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

  app.innerHTML = `
    <div style="text-align: center;">
      <h1>eng.rkai.app</h1>
      <p>Уровень 0: Старт тренажера</p>
      <button id="start-btn" style="background: #fff; color: #000; border: 2px solid #000; padding: 20px; font-size: 18px; font-weight: bold; cursor: pointer; width: 100%;">Войти через Google</button>
    </div>
  `;

  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      renderTrainer();
    });
  }
});