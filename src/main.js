// src/main.js
import './styles/evolution.css';
import { auth, googleProvider, db } from './firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, increment } from "firebase/firestore";
import { level1Tasks, level2Tasks, level3Tasks, getCyclicTask } from './data/tasks.js';
import { getWrongPhrases } from './data/wrongPhrases.js';
import { setupKeyboard } from './components/keyboard.js';
import { setupModals } from './components/modals.js';
import { openAdminPanel } from './components/admin.js';
import { calculateStyleLevel, calculateElementLevel, gameConfig } from './config/gameConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('#app');

  let sessionIndex = 0;          
  let currentLevel = 1;          
  let totalCorrectAnswers = 0;   
  let totalIncorrectAnswers = 0;  
  let consecutiveErrors = 0;     
  let currentTask = null;        
  let isEnglishToRussian = false; 
  let currentInput = "";
  let lastFeedback = "";        
  let lastFeedbackColor = "";   
  
  let secondsElapsed = 0;       
  let lastSyncedSeconds = 0;    
  let timerInterval = null;
  let currentUser = null;
  let isAdminUser = false;
  let userUnsubscribe = null; 
  let deferredPrompt = null; 

  let isTestMode = false;
  let testQuestionsAnswered = 0;
  let testCorrectCount = 0;
  let testSecondsLeft = 120;
  let testTimerInterval = null;

  const MAX_INPUT_LENGTH = 35;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    renderTrainer();
  });

  window.addEventListener('beforeunload', () => {
    if (currentUser) {
      const deltaSeconds = secondsElapsed - lastSyncedSeconds;
      if (deltaSeconds > 0) {
        const userRef = doc(db, "users", currentUser.uid);
        updateDoc(userRef, {
          totalTimeSpent: increment(deltaSeconds),
          lastActive: serverTimestamp()
        }).catch(() => {});
      }
    }
  });

  function updateStyleLevel() {
    const styleLevel = calculateStyleLevel(totalCorrectAnswers);
    document.body.setAttribute('data-level', styleLevel.toString());
    return styleLevel;
  }

  function getWrongPhrase(errorsCount) {
    const phrases = getWrongPhrases();
    const lvl = Math.min(Math.max(errorsCount, 1), 5);
    const list = phrases[lvl] || phrases[1];
    return list[Math.floor(Math.random() * list.length)];
  }

  async function saveProgressToFirestore() {
    if (!currentUser) return;
    try {
      updateStyleLevel();
      const userRef = doc(db, "users", currentUser.uid);
      const deltaSeconds = secondsElapsed - lastSyncedSeconds;
      lastSyncedSeconds = secondsElapsed; 

      await setDoc(userRef, {
        uid: currentUser.uid,
        email: currentUser.email || "anonymous",
        displayName: currentUser.displayName || "",
        photoURL: currentUser.photoURL || "",
        totalCorrect: totalCorrectAnswers,
        totalIncorrect: totalIncorrectAnswers,
        currentLessonLevel: currentLevel,
        totalTimeSpent: increment(deltaSeconds > 0 ? deltaSeconds : 0),
        lastActive: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Ошибка сохранения данных:", error);
    }
  }

  async function initUserProfile(user) {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || "anonymous",
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          isAdmin: false,
          currentLessonLevel: 1,
          totalCorrect: 0,
          totalIncorrect: 0,
          visitCount: 1, 
          totalTimeSpent: 0,
          lastLogin: serverTimestamp()
        });
      } else {
        const data = docSnap.data();
        totalCorrectAnswers = Math.max(data.totalCorrect || 0, totalCorrectAnswers);
        totalIncorrectAnswers = Math.max(data.totalIncorrect || 0, totalIncorrectAnswers);
        currentLevel = data.currentLessonLevel || 1;
        
        updateStyleLevel();
        await setDoc(userRef, { 
          lastLogin: serverTimestamp(), 
          visitCount: increment(1),
          totalCorrect: totalCorrectAnswers, 
          totalIncorrect: totalIncorrectAnswers 
        }, { merge: true });
      }
    } catch (error) {
      console.error("Ошибка инициализации профиля:", error);
    }
  }

  onAuthStateChanged(auth, async (user) => {
    if (userUnsubscribe) {
      userUnsubscribe();
      userUnsubscribe = null;
    }

    currentUser = user;
    if (user) {
      await initUserProfile(user);

      const userRef = doc(db, "users", user.uid);
      userUnsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const newAdminStatus = !!data.isAdmin;
          if (isAdminUser !== newAdminStatus) {
            isAdminUser = newAdminStatus;
            renderTrainer();
          }
        }
      });
    } else {
      isAdminUser = false;
    }
    renderTrainer();
  });

  function getCurrentTasksForLevel(lvl) {
    if (lvl === 3) return level3Tasks;
    if (lvl === 2) return level2Tasks;
    return level1Tasks;
  }

  function pickNewTask() {
    const tasks = getCurrentTasksForLevel(currentLevel);
    const result = getCyclicTask(sessionIndex, tasks);
    currentTask = result.task;
    isEnglishToRussian = result.isEnglishToRussian;
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
      const elementLevel = calculateElementLevel(totalCorrectAnswers);
      if (timerEl && elementLevel >= 1 && !isTestMode) {
        timerEl.textContent = `${formatTime(secondsElapsed)}`;
      }
    }, 1000);
  }

  function startTestMode() {
    isTestMode = true;
    sessionIndex = 0; 
    currentInput = ""; 
    testQuestionsAnswered = 0;
    testCorrectCount = 0;
    testSecondsLeft = gameConfig.testTimeSeconds || 120;
    pickNewTask();
    renderTrainer();

    if (testTimerInterval) clearInterval(testTimerInterval);
    testTimerInterval = setInterval(() => {
      testSecondsLeft--;
      const testTimerEl = document.getElementById('test-timer-display');
      if (testTimerEl) {
        testTimerEl.textContent = `Осталось времени: ${formatTime(testSecondsLeft)}`;
      }

      if (testSecondsLeft <= 0) {
        finishTest(false); 
      }
    }, 1000);
  }

  function finishTest(passed) {
    if (testTimerInterval) clearInterval(testTimerInterval);
    isTestMode = false;
    sessionIndex = 0;
    currentInput = "";

    const totalQ = gameConfig.testQuestionCount || 30;
    const requiredCorrect = Math.ceil(totalQ * 0.9);

    if (passed && testCorrectCount >= requiredCorrect) {
      alert(`Поздравляем! Вы успешно прошли тест (${testCorrectCount}/${totalQ}) и переходите на уровень ${currentLevel + 1}!`);
      currentLevel++;
      saveProgressToFirestore();
    } else {
      alert(`Время вышло или недостаточно правильных ответов (${testCorrectCount}/${totalQ}, нужно >= ${requiredCorrect}). Вы остаетесь на текущем уровне, тренируйтесь дальше!`);
    }
    pickNewTask();
    renderTrainer();
  }

  function handleAnswerResult(isCorrect) {
    if (isTestMode) {
      testQuestionsAnswered++;
      if (isCorrect) testCorrectCount++;

      const totalQ = gameConfig.testQuestionCount || 30;
      const requiredCorrect = Math.ceil(totalQ * 0.9);

      if (testQuestionsAnswered >= totalQ) {
        if (testCorrectCount >= requiredCorrect) {
          finishTest(true);
        } else {
          finishTest(false);
        }
        return;
      }
      sessionIndex++;
      currentInput = "";
      pickNewTask();
    } else {
      if (isCorrect) {
        consecutiveErrors = 0; 
        const elementLevel = calculateElementLevel(totalCorrectAnswers);
        if (elementLevel >= 1) {
          lastFeedback = "Правильно";
          lastFeedbackColor = "#22c55e";
        }
        totalCorrectAnswers++;
        sessionIndex++; 
        currentInput = ""; 
        pickNewTask();
      } else {
        consecutiveErrors++; 
        const elementLevel = calculateElementLevel(totalCorrectAnswers);
        if (elementLevel >= 1) {
          lastFeedback = getWrongPhrase(consecutiveErrors);
          lastFeedbackColor = "#ef4444";
        }
        totalIncorrectAnswers++;
      }
    }
  }

  function renderTrainer() {
    if (!currentTask) {
      pickNewTask();
    }

    updateStyleLevel();
    const elementLevel = calculateElementLevel(totalCorrectAnswers);
    const showStats = elementLevel >= 1;

    app.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; margin-bottom: 10px;">
          <div>
            👤 ${currentUser ? (currentUser.displayName || currentUser.email) : 'Гость'} | Уровень ${currentLevel}
          </div>
          <div>
            ${currentUser ? `
              <button id="logout-btn" style="background: none; border: none; text-decoration: underline; cursor: pointer; font-size: 14px; color: inherit;">Выйти</button>
            ` : `
              <button id="login-trigger-btn" style="background: none; border: none; text-decoration: underline; cursor: pointer; font-size: 14px; color: inherit;">Войти</button>
            `}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <button id="words-btn" style="padding: 10px 16px; font-size: 15px; font-weight: 600; cursor: pointer;">Слова</button>
          <div id="timer-display" style="font-size: 15px; font-weight: bold; visibility: ${showStats && !isTestMode ? 'visible' : 'hidden'};">${formatTime(secondsElapsed)}</div>
          <button id="rules-btn" style="padding: 10px 16px; font-size: 15px; font-weight: 600; cursor: pointer;">Правила</button>
        </div>

        ${!isTestMode ? `
          <div style="margin-bottom: 12px;">
            <button id="start-test-btn" style="width: 100%; padding: 12px; font-weight: bold; font-size: 16px; cursor: pointer; border-radius: 8px;">Перейти на ${currentLevel + 1} уровень (тест)</button>
          </div>
        ` : `
          <div style="margin-bottom: 12px; background: rgba(170,59,255,0.1); padding: 10px; border: 1px solid var(--accent); border-radius: 8px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">РЕЖИМ ТЕСТИРОВАНИЯ (${testQuestionsAnswered}/${gameConfig.testQuestionCount})</div>
            <div id="test-timer-display" style="font-size: 15px; color: #ef4444; font-weight: bold;">Осталось времени: ${formatTime(testSecondsLeft)}</div>
          </div>
        `}

        ${deferredPrompt ? `
          <div style="margin-bottom: 10px;">
            <button id="install-pwa-btn" style="width: 100%; padding: 12px; font-size: 15px; font-weight: bold; cursor: pointer; border-radius: 8px;">📲 Установить приложение</button>
          </div>
        ` : ''}

        ${isAdminUser ? `
          <div style="margin-bottom: 8px; text-align: center;">
            <button id="admin-panel-btn" style="padding: 8px 14px; font-size: 13px; font-weight: bold; cursor: pointer; border-radius: 6px;">📊 Админ-панель</button>
          </div>
        ` : ''}
      </div>

      <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; margin: 10px 0;">
        ${!isEnglishToRussian ? `
          <div>
            <div style="display: flex; justify-content: center; align-items: center; gap: 25px; margin-bottom: 12px;">
              <div style="font-size: 28px; font-weight: bold; color: #22c55e; visibility: ${showStats && !isTestMode ? 'visible' : 'hidden'};">${totalCorrectAnswers}</div>
              <p style="font-size: 30px; font-weight: bold; margin: 0; line-height: 1.2;">${currentTask.ru}</p>
              <div style="font-size: 28px; font-weight: bold; color: #ef4444; visibility: ${showStats && !isTestMode ? 'visible' : 'hidden'};">${totalIncorrectAnswers}</div>
            </div>

            <input type="text" id="answer-display" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value="${currentInput}" readonly />
            <div id="feedback-msg" style="height: 32px; font-size: 16px; font-weight: bold; color: ${lastFeedbackColor}; line-height: 1.2; margin-top: 10px; visibility: ${showStats || lastFeedback ? 'visible' : 'hidden'};">${lastFeedback}</div>
          </div>
        ` : `
          <div>
            <div style="display: flex; justify-content: center; align-items: center; gap: 25px; margin-bottom: 15px;">
              <div style="font-size: 28px; font-weight: bold; color: #22c55e; visibility: ${showStats && !isTestMode ? 'visible' : 'hidden'};">${totalCorrectAnswers}</div>
              <p style="font-size: 30px; font-weight: bold; margin: 0;">${currentTask.en}</p>
              <div style="font-size: 28px; font-weight: bold; color: #ef4444; visibility: ${showStats && !isTestMode ? 'visible' : 'hidden'};">${totalIncorrectAnswers}</div>
            </div>

            <div id="feedback-msg" style="height: 32px; font-size: 16px; font-weight: bold; margin-bottom: 15px; color: ${lastFeedbackColor}; line-height: 1.2; visibility: ${showStats ? 'visible' : 'hidden'};">${lastFeedback}</div>
            <div id="options-container" style="display: flex; flex-direction: column; gap: 10px;">
              ${currentTask.options.map(opt => `
                <button class="option-btn" style="padding: 16px; font-size: 20px; font-weight: 600; cursor: pointer; text-align: center; border-radius: 8px;">${opt}</button>
              `).join('')}
            </div>
          </div>
        `}
      </div>

      <div>
        <div id="keyboard" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;"></div>
      </div>
    `;

    if (!isEnglishToRussian) {
      const inputEl = document.getElementById('answer-display');
      if (inputEl) {
        inputEl.focus();
        inputEl.selectionStart = inputEl.selectionEnd = currentInput.length;

        inputEl.addEventListener('click', () => {
          currentInput = inputEl.value;
        });
        inputEl.addEventListener('keyup', () => {
          currentInput = inputEl.value;
        });
      }

      setupKeyboard({
        level: currentLevel,
        onInput: (char) => {
          if (!inputEl) return;
          const start = inputEl.selectionStart;
          const end = inputEl.selectionEnd;
          const val = inputEl.value;

          if (val.length < MAX_INPUT_LENGTH) {
            let charToAdd = char;
            // Делаем букву заглавной ТОЛЬКО если курсор стоит в самом начале (позиция 0) 
            // и перед ним нет никакого текста (поле абсолютно пустое).
            if (start === 0 && val.length === 0) {
              charToAdd = char.toUpperCase();
            } else {
              charToAdd = char.toLowerCase();
            }

            inputEl.value = val.substring(0, start) + charToAdd + val.substring(end);
            inputEl.selectionStart = inputEl.selectionEnd = start + 1;
            currentInput = inputEl.value;
            inputEl.focus();
          }
        },
        onBackspace: () => {
          if (!inputEl) return;
          const start = inputEl.selectionStart;
          const end = inputEl.selectionEnd;
          const val = inputEl.value;

          if (start !== end) {
            inputEl.value = val.substring(0, start) + val.substring(end);
            inputEl.selectionStart = inputEl.selectionEnd = start;
          } else if (start > 0) {
            inputEl.value = val.substring(0, start - 1) + val.substring(start);
            inputEl.selectionStart = inputEl.selectionEnd = start - 1;
          }
          currentInput = inputEl.value;
          inputEl.focus();
        },
        onSpace: () => {
          if (!inputEl) return;
          const start = inputEl.selectionStart;
          const end = inputEl.selectionEnd;
          const val = inputEl.value;

          if (val.length < MAX_INPUT_LENGTH) {
            inputEl.value = val.substring(0, start) + " " + val.substring(end);
            inputEl.selectionStart = inputEl.selectionEnd = start + 1;
            currentInput = inputEl.value;
            inputEl.focus();
          }
        },
        onOk: async () => {
          if (inputEl) currentInput = inputEl.value;

          if (!currentInput.trim()) {
            lastFeedback = "Сначала введите перевод";
            lastFeedbackColor = "#eab308";
            renderTrainer();
            return;
          }

          const isCorrect = currentInput.trim().toLowerCase() === currentTask.en.toLowerCase();
          handleAnswerResult(isCorrect);
          if (!isTestMode) await saveProgressToFirestore(); 
          renderTrainer();
        }
      });
    } else {
      setupOptions();
    }

    setupModals();
    if (!isTestMode) startTimer();

    const startTestBtn = document.getElementById('start-test-btn');
    if (startTestBtn) {
      startTestBtn.onclick = () => {
        const testMins = Math.floor((gameConfig.testTimeSeconds || 120) / 60);
        const testSecs = (gameConfig.testTimeSeconds || 120) % 60;
        const timeStr = `${testMins > 0 ? testMins + ' мин. ' : ''}${testSecs > 0 ? testSecs + ' сек.' : ''}`;

        if (confirm(`Вы переходите в режим тестирования на уровень ${currentLevel + 1}. Вам нужно ответить на ${gameConfig.testQuestionCount} вопросов за ${timeStr} (по схеме 7 рус-анг / 3 англ-рус). Начать?`)) {
          startTestMode();
        }
      };
    }

    const installBtn = document.getElementById('install-pwa-btn');
    if (installBtn) {
      installBtn.onclick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('Пользователь установил PWA');
        }
        deferredPrompt = null;
        renderTrainer();
      };
    }

    const adminBtn = document.getElementById('admin-panel-btn');
    if (adminBtn) {
      adminBtn.onclick = () => openAdminPanel();
    }

    const loginTriggerBtn = document.getElementById('login-trigger-btn');
    if (loginTriggerBtn) {
      loginTriggerBtn.onclick = async () => {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (error) {
          alert("Ошибка входа: " + error.message);
        }
      };
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        if (userUnsubscribe) userUnsubscribe();
        signOut(auth);
      };
    }
  }

  function setupOptions() {
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const isCorrect = btn.textContent.trim() === currentTask.correct;
        handleAnswerResult(isCorrect);
        if (!isTestMode) await saveProgressToFirestore();
        renderTrainer();
      });
    });
  }
});