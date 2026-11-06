import './styles/evolution.css';
import { auth, googleProvider, db } from './firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { level1Tasks, level2Tasks } from './data/tasks.js';
import { setupKeyboard } from './components/keyboard.js';
import { setupModals } from './components/modals.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('#app');

  let sessionIndex = 0;          
  let totalCorrectAnswers = 0;   
  let totalIncorrectAnswers =  0;  
  let currentTask = null;        
  let isEnglishToRussian = false; 
  let currentInput = "";
  let lastFeedback = "";        
  let lastFeedbackColor = "";   
  
  let secondsElapsed = 0;       
  let timerInterval = null;
  let currentUser = null;
  let lastSavedCount = 0;

  let isExamMode = false;
  let examCorrectCount = 0;
  let examSecondsLeft = 120;
  let examTimerInterval = null;

  async function saveSessionToFirestore() {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, "sessions"), {
        uid: currentUser.uid,
        email: currentUser.email || "anonymous",
        correctAnswers: totalCorrectAnswers,
        incorrectAnswers: totalIncorrectAnswers,
        durationSeconds: secondsElapsed,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Ошибка при сохранении данных в Firestore:", error);
    }
  }

  async function saveSessionIdempotent() {
    if (totalCorrectAnswers - lastSavedCount >= 5) {
      lastSavedCount = totalCorrectAnswers;
      await saveSessionToFirestore();
    }
  }

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    renderScreen();
  });

  function getCurrentTasks() {
    const currentLevel = parseInt(document.body.getAttribute('data-level') || '0', 10);
    return currentLevel >= 1 ? level2Tasks : level1Tasks;
  }

  function pickNewTask() {
    let modeIndex = sessionIndex % 10;
    isEnglishToRussian = modeIndex >= 7;
    const tasks = getCurrentTasks();

    if (!isEnglishToRussian) {
      currentTask = tasks.ruEn[Math.floor(Math.random() * tasks.ruEn.length)];
    } else {
      currentTask = tasks.enRu[Math.floor(Math.random() * tasks.enRu.length)];
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
      if (timerEl && !isExamMode) {
        timerEl.textContent = `⏱ ${formatTime(secondsElapsed)}`;
      }
    }, 1000);
  }

  function startExam() {
    isExamMode = true;
    examCorrectCount = 0;
    examSecondsLeft = 120;
    sessionIndex = 0;
    pickNewTask();
    renderTrainer();

    if (examTimerInterval) clearInterval(examTimerInterval);
    examTimerInterval = setInterval(() => {
      examSecondsLeft--;
      const examTimerEl = document.getElementById('exam-timer');
      if (examTimerEl) {
        examTimerEl.textContent = `⏳ Осталось: ${examSecondsLeft}с`;
      }

      if (examSecondsLeft <= 0) {
        clearInterval(examTimerInterval);
        alert("Время вышло! Экзамен не сдан.");
        isExamMode = false;
        renderTrainer();
      }
    }, 1000);
  }

  function renderScreen() {
    if (!currentUser) {
      app.innerHTML = `
        <div style="text-align: center; max-width: 400px; margin: 50px auto; padding: 20px;">
          <h1 style="font-size: 28px; margin-bottom: 10px;">eng.rkai.app</h1>
          <p style="margin-bottom: 30px; font-size: 16px;">Уровень 0: Старт тренажера</p>
          <button id="google-login-btn" style="background: #fff; color: #000; border: 2px solid #000; padding: 15px 20px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%;">Войти через Google</button>
        </div>
      `;
      document.getElementById('google-login-btn').addEventListener('click', async () => {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (error) {
          alert("Ошибка входа: " + error.message);
        }
      });
    } else {
      renderTrainer();
    }
  }

  function renderTrainer() {
    if (!currentTask) {
      pickNewTask();
    }

    const showStats = totalCorrectAnswers >= 2;
    const currentLevel = parseInt(document.body.getAttribute('data-level') || '0', 10);

    app.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <button id="words-btn" style="width: 80px; padding: 6px; font-size: 13px; background: #fff; color: #000; border: 2px solid #000; cursor: pointer;">Слова</button>
        <div id="timer-display" style="font-size: 14px; font-weight: bold; visibility: ${showStats && !isExamMode ? 'visible' : 'hidden'};">⏱ ${formatTime(secondsElapsed)}</div>
        <button id="rules-btn" style="width: 80px; padding: 6px; font-size: 13px; background: #fff; color: #000; border: 2px solid #000; cursor: pointer;">Правила</button>
      </div>

      ${currentLevel === 0 && !isExamMode ? `
        <div style="margin-bottom: 10px;">
          <button id="start-exam-btn" style="width: 100%; padding: 10px; background: #000; color: #fff; border: 2px solid #000; font-size: 14px; font-weight: bold; cursor: pointer;">🚀 Сдать экзамен на Уровень 2</button>
        </div>
      ` : ''}

      ${isExamMode ? `
        <div style="background: #333; color: #fff; padding: 8px; margin-bottom: 10px; font-weight: bold; font-size: 14px;">
          ЭКЗАМЕН: Верно ${examCorrectCount}/2 | <span id="exam-timer">⏳ Осталось: ${examSecondsLeft}с</span>
        </div>
      ` : ''}

      <div style="text-align: right; font-size: 12px; margin-bottom: 15px;">
        👤 ${currentUser.displayName || currentUser.email} (Уровень ${currentLevel})
        <button id="logout-btn" style="background: none; border: none; text-decoration: underline; cursor: pointer; font-size: 12px; margin-left: 5px;">Выйти</button>
      </div>
    `;

    if (!isEnglishToRussian) {
      app.innerHTML += `
        <div style="margin: 20px 0;">
          <div style="display: flex; justify-content: center; align-items: center; gap: 25px; margin-bottom: 15px;">
            <div style="font-size: 24px; font-weight: bold; color: green; visibility: ${showStats && !isExamMode ? 'visible' : 'hidden'};">${totalCorrectAnswers}</div>
            <p style="font-size: 24px; font-weight: bold; margin: 0;">${currentTask.ru}</p>
            <div style="font-size: 24px; font-weight: bold; color: red; visibility: ${showStats && !isExamMode ? 'visible' : 'hidden'};">${totalIncorrectAnswers}</div>
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

      setupKeyboard({
        level: currentLevel,
        onInput: (char) => {
          currentInput += char;
          document.getElementById('answer-display').textContent = currentInput;
        },
        onBackspace: () => {
          currentInput = currentInput.slice(0, -1);
          document.getElementById('answer-display').textContent = currentInput;
        },
        onSpace: () => {
          currentInput += " ";
          document.getElementById('answer-display').textContent = currentInput;
        },
        onOk: async () => {
          const isCorrect = currentInput.trim().toLowerCase() === currentTask.en.toLowerCase();
          
          if (isExamMode) {
            if (isCorrect) {
              examCorrectCount++;
              if (examCorrectCount >= 2) {
                clearInterval(examTimerInterval);
                isExamMode = false;
                document.body.setAttribute('data-level', '1');
                alert("🎉 Экзамен сдан! Добро пожаловать на Уровень 2 (отрицательные формы и новая клавиатура активны)!");
              }
            } else {
              clearInterval(examTimerInterval);
              alert("❌ Ошибка в экзамене!");
              isExamMode = false;
            }
          } else {
            if (isCorrect) {
              if (totalCorrectAnswers >= 2) {
                lastFeedback = "Правильно";
                lastFeedbackColor = "green";
              }
              totalCorrectAnswers++;
            } else {
              if (totalCorrectAnswers >= 2) {
                lastFeedback = "Неправильно";
                lastFeedbackColor = "red";
              }
              totalIncorrectAnswers++;
            }
          }

          sessionIndex++;
          currentInput = "";
          pickNewTask();
          await saveSessionIdempotent();
          renderTrainer();
        }
      });
    } else {
      app.innerHTML += `
        <div style="margin: 20px 0;">
          <div style="display: flex; justify-content: center; align-items: center; gap: 25px; margin-bottom: 20px;">
            <div style="font-size: 24px; font-weight: bold; color: green; visibility: ${showStats && !isExamMode ? 'visible' : 'hidden'};">${totalCorrectAnswers}</div>
            <p style="font-size: 24px; font-weight: bold; margin: 0;">${currentTask.en}</p>
            <div style="font-size: 24px; font-weight: bold; color: red; visibility: ${showStats && !isExamMode ? 'visible' : 'hidden'};">${totalIncorrectAnswers}</div>
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

    const examBtn = document.getElementById('start-exam-btn');
    if (examBtn) {
      examBtn.onclick = () => startExam();
    }

    document.getElementById('logout-btn').onclick = async () => {
      await saveSessionToFirestore();
      signOut(auth);
    };
  }

  function setupOptions() {
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const isCorrect = btn.textContent.trim() === currentTask.correct;
        const currentLevel = parseInt(document.body.getAttribute('data-level') || '0', 10);

        if (isExamMode) {
          if (isCorrect) {
            examCorrectCount++;
            if (examCorrectCount >= 2) {
              clearInterval(examTimerInterval);
              isExamMode = false;
              document.body.setAttribute('data-level', '1');
              alert("🎉 Экзамен сдан! Добро пожаловать на Уровень 2!");
            }
          } else {
            clearInterval(examTimerInterval);
            alert("❌ Ошибка в экзамене!");
            isExamMode = false;
          }
        } else {
          if (isCorrect) {
            if (totalCorrectAnswers >= 2) {
              lastFeedback = "Правильно";
              lastFeedbackColor = "green";
            }
            totalCorrectAnswers++;
          } else {
            if (totalCorrectAnswers >= 2) {
              lastFeedback = "Неправильно";
              lastFeedbackColor = "red";
            }
            totalIncorrectAnswers++;
          }
        }

        sessionIndex++;
        pickNewTask();
        await saveSessionIdempotent();
        renderTrainer();
      });
    });
  }
});