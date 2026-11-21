// src/main.js
import './styles/evolution.css';
import { auth, googleProvider, db } from './firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, increment } from "firebase/firestore";
import { level1Tasks, level2Tasks, level3Tasks, getCyclicTask, resetTaskPools } from './data/tasks.js';
import { getWrongPhrases } from './data/wrongPhrases.js';
import { setupKeyboard } from './components/keyboard.js';
import { setupModals } from './components/modals.js';
import { openAdminPanel } from './components/admin.js';
import { renderCategoryFilters } from './components/categoryFilters.js';
import { isIntroHidden, showProjectPresentation } from './components/onboarding.js';
import { openSettingsModal } from './components/settingsModal.js';
import { recordDailyProgress } from './utils/statsTracker.js';
import { calculateStyleLevel, calculateElementLevel, gameConfig } from './config/gameConfig.js';
import { applyStyleLevelToBody } from './utils/styleTheme.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('#app');

  let sessionIndex = 0;          
  let currentLevel = 1;          
  let activeCategories = ['statement'];
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
  let hasShownStartupPresentation = false;

  let isTestMode = false;
  let testQuestionsAnswered = 0;
  let testCorrectCount = 0;
  let testSecondsLeft = gameConfig.testTimeSeconds;
  let testTimerInterval = null;

  let isSoundEnabled = localStorage.getItem('rkai_sound_enabled') !== 'false';

  const MAX_INPUT_LENGTH = 35;

  function getAvailableCategoriesForLevel(lvl) {
    if (lvl >= 3) return ['question', 'statement', 'negative'];
    if (lvl === 2) return ['statement', 'negative'];
    return ['statement'];
  }

  function syncCategoriesWithLevel(lvl) {
    activeCategories = getAvailableCategoriesForLevel(lvl);
    resetTaskPools();
  }

  function handleToggleCategory(cat) {
    if (isTestMode) return;
    const available = getAvailableCategoriesForLevel(currentLevel);

    if (activeCategories.includes(cat)) {
      const next = activeCategories.filter(c => c !== cat);
      activeCategories = next.length > 0 ? next : [...available];
    } else {
      activeCategories = [...activeCategories, cat];
    }

    resetTaskPools();
    currentInput = "";
    lastFeedback = "";
    pickNewTask();
    renderTrainer();
  }

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(type) {
    if (!isSoundEnabled) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.setValueAtTime(100, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    }
  }

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

  function flushSessionTime() {
    const deltaSeconds = secondsElapsed - lastSyncedSeconds;
    if (deltaSeconds <= 0) return 0;
    lastSyncedSeconds = secondsElapsed;

    recordDailyProgress({ user: currentUser, secondsDelta: deltaSeconds });

    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid);
      updateDoc(userRef, {
        totalTimeSpent: increment(deltaSeconds),
        lastActive: serverTimestamp()
      }).catch(() => {});
    }
    return deltaSeconds;
  }

  window.addEventListener('beforeunload', () => {
    flushSessionTime();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushSessionTime();
    }
  });

  function updateStyleLevel() {
    const styleLevel = calculateStyleLevel(totalCorrectAnswers);
    applyStyleLevelToBody(styleLevel);
    return styleLevel;
  }

  function getWrongPhrase(errorsCount) {
    const phrases = getWrongPhrases();
    const lvl = Math.min(Math.max(errorsCount, 1), 5);
    const list = phrases[lvl] || phrases[1];
    return list[Math.floor(Math.random() * list.length)];
  }

  async function saveProgressToFirestore(tasksDelta = 0) {
    updateStyleLevel();
    const deltaSeconds = secondsElapsed - lastSyncedSeconds;
    if (deltaSeconds > 0) {
      lastSyncedSeconds = secondsElapsed;
    }

    await recordDailyProgress({
      user: currentUser,
      tasksDelta,
      secondsDelta: deltaSeconds > 0 ? deltaSeconds : 0
    });

    if (!currentUser) return;
    try {
      const userRef = doc(db, "users", currentUser.uid);

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
        syncCategoriesWithLevel(1);
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
        syncCategoriesWithLevel(currentLevel);
        pickNewTask();
        
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
      syncCategoriesWithLevel(currentLevel);
    }
    renderTrainer();
  });

  function getCurrentTasksForLevel(lvl) {
    if (lvl >= 3) return level3Tasks;
    if (lvl === 2) return level2Tasks;
    return level1Tasks;
  }

  function pickNewTask() {
    const tasks = getCurrentTasksForLevel(currentLevel);
    const categoriesToUse = isTestMode ? getAvailableCategoriesForLevel(currentLevel) : activeCategories;
    const result = getCyclicTask(sessionIndex, tasks, categoriesToUse);
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
      if (timerEl && elementLevel >= 3 && !isTestMode) {
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
    testSecondsLeft = gameConfig.testTimeSeconds;
    resetTaskPools();
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

    const totalQ = gameConfig.testQuestionCount;
    const requiredCorrect = Math.ceil(totalQ * 0.9);

    if (passed && testCorrectCount >= requiredCorrect) {
      alert(`Поздравляем! Вы успешно прошли тест (${testCorrectCount}/${totalQ}) и переходите на уровень ${currentLevel + 1}!`);
      currentLevel++;
      syncCategoriesWithLevel(currentLevel);
      saveProgressToFirestore(0);
    } else {
      alert(`Время вышло или недостаточно правильных ответов (${testCorrectCount}/${totalQ}, нужно >= ${requiredCorrect}). Вы остаетесь на текущем уровне, тренируйтесь дальше!`);
      resetTaskPools();
    }
    pickNewTask();
    renderTrainer();
  }

  async function handleAnswerResult(isCorrect) {
    const elementLevel = calculateElementLevel(totalCorrectAnswers);

    if (isTestMode) {
      testQuestionsAnswered++;
      if (isCorrect) {
        testCorrectCount++;
        await recordDailyProgress({ user: currentUser, tasksDelta: 1 });
        if (elementLevel >= 5) playSound('success');
      } else {
        if (elementLevel >= 5) playSound('error');
      }

      const totalQ = gameConfig.testQuestionCount;
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
      renderTrainer();
    } else {
      if (isCorrect) {
        consecutiveErrors = 0; 
        
        if (elementLevel >= 5) {
          playSound('success');
        }

        if (elementLevel >= 1) {
          lastFeedback = "Правильно";
          lastFeedbackColor = "#22c55e";
        }

        if (elementLevel >= 6 && !isEnglishToRussian) {
          const inputEl = document.getElementById('answer-display');
          if (inputEl) {
            inputEl.classList.add('success-flash');
          }
          
          totalCorrectAnswers++;
          sessionIndex++;
          currentInput = "";

          setTimeout(() => {
            pickNewTask();
            renderTrainer();
          }, 300);
          
          await saveProgressToFirestore(1);
          return;
        }

        totalCorrectAnswers++;
        sessionIndex++; 
        currentInput = ""; 
        pickNewTask();
        await saveProgressToFirestore(1);
        renderTrainer();

      } else {
        consecutiveErrors++; 
        
        if (elementLevel >= 5) {
          playSound('error');
        }

        if (elementLevel >= 1) {
          lastFeedback = getWrongPhrase(consecutiveErrors);
          lastFeedbackColor = "#ef4444";
        }

        if (elementLevel >= 6 && !isEnglishToRussian) {
          const inputEl = document.getElementById('answer-display');
          if (inputEl) {
            inputEl.classList.add('shake-effect');
            setTimeout(() => {
              inputEl.classList.remove('shake-effect');
            }, 400);
          }
        }

        totalIncorrectAnswers++;
        renderTrainer();
      }
    }
  }

  function maybeShowStartupPresentation() {
    if (hasShownStartupPresentation) return;
    hasShownStartupPresentation = true;

    if (!isIntroHidden()) {
      showProjectPresentation({
        onClose: () => {
          const inputEl = document.getElementById('answer-display');
          if (inputEl && !isEnglishToRussian) {
            inputEl.focus({ preventScroll: true });
          }
        }
      });
    }
  }

  function renderTrainer() {
    if (!currentTask) {
      pickNewTask();
    }

    updateStyleLevel();
    const elementLevel = calculateElementLevel(totalCorrectAnswers);

    const showFeedback = elementLevel >= 1;
    const showCounters = elementLevel >= 2;
    const showTimer = elementLevel >= 3;
    const showTestButton = elementLevel >= 4;
    const showSoundToggle = elementLevel >= 5;
    const showSettingsButton = Boolean(currentUser) && elementLevel >= 7;

    app.innerHTML = `
      <div class="app-header">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: var(--ui-gap); gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
            <span style="font-weight: 800; color: var(--accent); background: var(--accent-bg); padding: 2px 7px; border-radius: 6px; border: 1px solid var(--accent); white-space: nowrap; font-size: 12px;">Pareto English</span>
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${currentUser ? (currentUser.displayName || currentUser.email) : 'Гость'} · Ур. ${currentLevel}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            ${showSettingsButton ? `
              <button id="settings-btn" style="background: none; border: none; cursor: pointer; font-size: 16px; padding: 2px; line-height: 1;" title="Настройки">⚙️</button>
            ` : ''}
            ${showSoundToggle ? `
              <button id="sound-toggle-btn" style="background: none; border: none; cursor: pointer; font-size: 15px; padding: 2px; line-height: 1;" title="Вкл/Выкл звук">
                ${isSoundEnabled ? '🔊' : '🔇'}
              </button>
            ` : ''}
            ${currentUser ? `
              <button id="logout-btn" style="background: none; border: none; text-decoration: underline; cursor: pointer; font-size: 13px; color: inherit; padding: 2px;">Выйти</button>
            ` : `
              <button id="login-trigger-btn" style="background: none; border: none; text-decoration: underline; cursor: pointer; font-size: 13px; color: inherit; padding: 2px;">Войти</button>
            `}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--ui-gap);">
          <button id="words-btn" style="padding: clamp(6px, 1.1dvh, 9px) 14px; font-size: 14px; font-weight: 600; cursor: pointer;">Слова</button>
          <div id="timer-display" style="font-size: 14px; font-weight: bold; visibility: ${showTimer && !isTestMode ? 'visible' : 'hidden'};">${formatTime(secondsElapsed)}</div>
          <button id="rules-btn" style="padding: clamp(6px, 1.1dvh, 9px) 14px; font-size: 14px; font-weight: 600; cursor: pointer;">Правила</button>
        </div>

        ${showTestButton && !isTestMode ? `
          <div style="margin-bottom: var(--ui-gap);">
            <button id="start-test-btn" style="width: 100%; padding: clamp(7px, 1.2dvh, 10px); font-weight: bold; font-size: clamp(13px, 2dvh, 15px); cursor: pointer; border-radius: 8px;">Перейти на ${currentLevel + 1} уровень (тест)</button>
          </div>
        ` : ''}

        <div id="category-filters-container"></div>

        ${isTestMode ? `
          <div style="margin-bottom: var(--ui-gap); background: rgba(170,59,255,0.1); padding: 6px 10px; border: 1px solid var(--accent); border-radius: 8px;">
            <div style="font-weight: bold; font-size: 13px;">РЕЖИМ ТЕСТИРОВАНИЯ (${testQuestionsAnswered}/${gameConfig.testQuestionCount})</div>
            <div id="test-timer-display" style="font-size: 14px; color: #ef4444; font-weight: bold;">Осталось времени: ${formatTime(testSecondsLeft)}</div>
          </div>
        ` : ''}

        ${deferredPrompt ? `
          <div style="margin-bottom: var(--ui-gap);">
            <button id="install-pwa-btn" style="width: 100%; padding: 8px; font-size: 14px; font-weight: bold; cursor: pointer; border-radius: 8px;">📲 Установить приложение</button>
          </div>
        ` : ''}

        ${isAdminUser ? `
          <div style="margin-bottom: var(--ui-gap); text-align: center;">
            <button id="admin-panel-btn" style="padding: 5px 12px; font-size: 12px; font-weight: bold; cursor: pointer; border-radius: 6px;">📊 Админ-панель</button>
          </div>
        ` : ''}
      </div>

      <div class="app-main">
        ${!isEnglishToRussian ? `
          <div>
            <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: var(--ui-gap);">
              <div style="font-size: var(--counter-font-size); font-weight: bold; color: #22c55e; visibility: ${showCounters && !isTestMode ? 'visible' : 'hidden'};">${totalCorrectAnswers}</div>
              <p style="font-size: var(--task-font-size); font-weight: bold; margin: 0; line-height: 1.15;">${currentTask.ru}</p>
              <div style="font-size: var(--counter-font-size); font-weight: bold; color: #ef4444; visibility: ${showCounters && !isTestMode ? 'visible' : 'hidden'};">${totalIncorrectAnswers}</div>
            </div>

            <input type="text" id="answer-display" inputmode="none" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value="${currentInput}" />
            <div id="feedback-msg" style="min-height: 22px; font-size: clamp(13px, 2dvh, 15px); font-weight: bold; color: ${lastFeedbackColor}; line-height: 1.15; margin-top: clamp(4px, 0.8dvh, 8px); visibility: ${showFeedback || lastFeedback ? 'visible' : 'hidden'};">${lastFeedback}</div>
          </div>
        ` : `
          <div>
            <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: var(--ui-gap);">
              <div style="font-size: var(--counter-font-size); font-weight: bold; color: #22c55e; visibility: ${showCounters && !isTestMode ? 'visible' : 'hidden'};">${totalCorrectAnswers}</div>
              <p style="font-size: var(--task-font-size); font-weight: bold; margin: 0; line-height: 1.15;">${currentTask.en}</p>
              <div style="font-size: var(--counter-font-size); font-weight: bold; color: #ef4444; visibility: ${showCounters && !isTestMode ? 'visible' : 'hidden'};">${totalIncorrectAnswers}</div>
            </div>

            <div id="feedback-msg" style="min-height: 22px; font-size: clamp(13px, 2dvh, 15px); font-weight: bold; margin-bottom: var(--ui-gap); color: ${lastFeedbackColor}; line-height: 1.15; visibility: ${showFeedback ? 'visible' : 'hidden'};">${lastFeedback}</div>
            <div id="options-container" style="display: flex; flex-direction: column; gap: clamp(6px, 1dvh, 10px);">
              ${currentTask.options.map(opt => `
                <button class="option-btn" style="font-weight: 600; cursor: pointer; text-align: center; border-radius: 8px;">${opt}</button>
              `).join('')}
            </div>
          </div>
        `}
      </div>

      <div class="app-footer">
        <div id="keyboard"></div>
      </div>
    `;

    renderCategoryFilters({
      containerId: 'category-filters-container',
      currentLevel,
      activeCategories,
      isTestMode,
      onToggleCategory: handleToggleCategory
    });

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.onclick = () => {
        openSettingsModal({
          user: currentUser,
          onBeforeOpen: () => flushSessionTime()
        });
      };
    }

    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    if (soundToggleBtn) {
      soundToggleBtn.onclick = () => {
        isSoundEnabled = !isSoundEnabled;
        localStorage.setItem('rkai_sound_enabled', isSoundEnabled);
        renderTrainer();
      };
    }

    if (!isEnglishToRussian) {
      const inputEl = document.getElementById('answer-display');
      if (inputEl) {
        inputEl.setAttribute('inputmode', 'none');
        
        inputEl.focus({ preventScroll: true });
        inputEl.selectionStart = inputEl.selectionEnd = currentInput.length;

        inputEl.addEventListener('click', (e) => {
          e.preventDefault();
          inputEl.focus({ preventScroll: true });
          currentInput = inputEl.value;
        });

        inputEl.addEventListener('keydown', (e) => {
          if (e.key !== 'Tab' && e.key !== 'Enter') {
            e.preventDefault();
          }
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

            inputEl.value = val.substring(0, start) + charToAdd + val.substring(end);
            inputEl.selectionStart = inputEl.selectionEnd = start + 1;
            currentInput = inputEl.value;
            inputEl.focus({ preventScroll: true });
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
          inputEl.focus({ preventScroll: true });
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
            inputEl.focus({ preventScroll: true });
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
          await handleAnswerResult(isCorrect);
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
        const testMins = Math.floor(gameConfig.testTimeSeconds / 60);
        const testSecs = gameConfig.testTimeSeconds % 60;
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
        flushSessionTime();
        if (userUnsubscribe) userUnsubscribe();
        signOut(auth);
      };
    }

    maybeShowStartupPresentation();
  }

  function setupOptions() {
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const isCorrect = btn.textContent.trim() === currentTask.correct;
        await handleAnswerResult(isCorrect);
      });
    });
  }
});