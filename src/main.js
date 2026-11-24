// src/main.js
import './styles/evolution.css';
import { auth, googleProvider, db } from './firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, increment } from "firebase/firestore";
import { getCyclicTask, resetTaskPools } from './data/tasks.js';
import { getTasksForLevel } from './levels/registry.js';
import { getWrongPhrases } from './data/wrongPhrases.js';
import { setupKeyboard } from './components/keyboard.js';
import { setupModals } from './components/modals.js';
import { openAdminPanel } from './components/admin.js';
import { renderCategoryFilters } from './components/categoryFilters.js';
import { renderTimerStatusBar } from './components/timerStatusBar.js';
import { isIntroHidden, showProjectPresentation } from './components/onboarding.js';
import { openSettingsModal } from './components/settingsModal.js';
import {
  recordDailyProgress,
  recordAnswerAttempt,
  getLocalCounters,
  saveLocalCounters
} from './utils/statsTracker.js';
import { speakEnglishWord, speakErrorMessage, stopErrorSpeech } from './utils/speechFeedback.js';
import { calculateStyleLevel, calculateElementLevel, gameConfig } from './config/gameConfig.js';
import { applyStyleLevelToBody } from './utils/styleTheme.js';
import {
  checkAndApplyRemoteVersion,
  startRemoteVersionWatcher,
  onUpdateAvailable,
  applyPendingAppUpdate
} from './utils/appUpdate.js';
import {
  shareProjectContent,
  buildProjectShareText,
  buildLevelUpShareText,
  SHARE_APP_URL
} from './utils/share.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('#app');

  // Счётчики ТОЛЬКО для текущей сессии (начинаются с 0 при открытии приложения)
  let sessionCorrectAnswers = 0;
  let sessionIncorrectAnswers = 0;

  // Накопленные счётчики для уровней эволюции и синхронизации со статистикой/Firestore
  const initialCounters = getLocalCounters(null);
  let totalCorrectAnswers = initialCounters.correct;
  let totalIncorrectAnswers = initialCounters.incorrect;

  let sessionIndex = 0;
  let currentLevel = 1;
  let activeCategories = ['statement'];
  let consecutiveErrors = 0;
  let currentTask = null;
  let isEnglishToRussian = false;
  let currentInput = "";
  let lastFeedback = "";
  let lastFeedbackColor = "";
  let isAdvancingAfterSpeech = false;
  let advanceTimeoutId = null;

  let secondsElapsed = 0;
  let lastSyncedSeconds = 0;
  let timerInterval = null;
  let currentUser = null;
  let isAdminUser = false;
  let userUnsubscribe = null;
  let deferredPrompt = null;
  let hasShownStartupPresentation = false;
  let availableUpdateVersion = null;

  let isTestMode = false;
  let testQuestionsAnswered = 0;
  let testCorrectCount = 0;
  let testSecondsLeft = gameConfig.testTimeSeconds;
  let testTimerInterval = null;

  let isSoundEnabled = localStorage.getItem('rkai_sound_enabled') !== 'false';

  const MAX_INPUT_LENGTH = 35;

  // Прогреваем список голосов браузера, если он подгружается асинхронно
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  function resetViewportPosition() {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (_) {
      window.scrollTo(0, 0);
    }
    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = 0;
      document.scrollingElement.scrollLeft = 0;
    }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (app) {
      app.scrollTop = 0;
      app.scrollLeft = 0;
    }
  }

  function preserveInputFocusAndCaret(inputEl, fallbackCaret = null) {
    if (!inputEl || isEnglishToRussian || isAdvancingAfterSpeech) return;
    const caretPos = typeof fallbackCaret === 'number'
      ? Math.max(0, Math.min(fallbackCaret, inputEl.value.length))
      : inputEl.value.length;

    inputEl.focus({ preventScroll: true });
    try {
      inputEl.selectionStart = inputEl.selectionEnd = caretPos;
    } catch (_) {}
    resetViewportPosition();
  }

  function clearPendingAdvance() {
    if (advanceTimeoutId) {
      clearTimeout(advanceTimeoutId);
      advanceTimeoutId = null;
    }
    isAdvancingAfterSpeech = false;
  }

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
    clearPendingAdvance();
    stopErrorSpeech();
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

  function speakCorrectAnswerAndWait(spokenText, onDone) {
    let finished = false;
    const finishOnce = () => {
      if (finished) return;
      finished = true;
      if (advanceTimeoutId) {
        clearTimeout(advanceTimeoutId);
        advanceTimeoutId = null;
      }
      if (typeof onDone === 'function') {
        onDone();
      }
    };

    if (!isSoundEnabled || !spokenText || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      advanceTimeoutId = setTimeout(finishOnce, 300);
      return;
    }

    const estimatedMs = Math.min(3500, Math.max(1400, spokenText.length * 95 + 600));
    advanceTimeoutId = setTimeout(finishOnce, estimatedMs);

    speakEnglishWord(spokenText, {
      rate: 0.92,
      pitch: 1.0,
      onEnd: () => {
        setTimeout(finishOnce, 180);
      }
    });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  // Подписка на мягкое уведомление о новой версии без сдвига экрана и потери фокуса
  onUpdateAvailable((ver) => {
    const nextVer = ver || null;
    if (availableUpdateVersion === nextVer) return;
    const wasBannerShown = Boolean(availableUpdateVersion);
    availableUpdateVersion = nextVer;

    const prevInput = document.getElementById('answer-display');
    const savedCaret = prevInput ? prevInput.selectionStart : null;

    renderTrainer();

    if (wasBannerShown && !nextVer) {
      resetViewportPosition();
      requestAnimationFrame(() => {
        resetViewportPosition();
        const nextInput = document.getElementById('answer-display');
        preserveInputFocusAndCaret(nextInput, savedCaret);
      });
      return;
    }

    const nextInput = document.getElementById('answer-display');
    preserveInputFocusAndCaret(nextInput, savedCaret);
  });

  // Проверка доступной версии при старте и при возврате в приложение
  checkAndApplyRemoteVersion(true);
  startRemoteVersionWatcher();

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
    clearPendingAdvance();
    stopErrorSpeech();
    flushSessionTime();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      clearPendingAdvance();
      stopErrorSpeech();
      flushSessionTime();
    } else if (document.visibilityState === 'visible') {
      resetViewportPosition();
      checkAndApplyRemoteVersion(true);
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

  async function syncUserProgressToCloud() {
    updateStyleLevel();
    saveLocalCounters(currentUser, {
      correct: totalCorrectAnswers,
      incorrect: totalIncorrectAnswers
    });

    const deltaSeconds = secondsElapsed - lastSyncedSeconds;
    if (deltaSeconds > 0) {
      lastSyncedSeconds = secondsElapsed;
      await recordDailyProgress({
        user: currentUser,
        tasksDelta: 0,
        secondsDelta: deltaSeconds
      });
    }

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
        const localCounters = getLocalCounters(user);
        totalCorrectAnswers = localCounters.correct;
        totalIncorrectAnswers = localCounters.incorrect;
        syncCategoriesWithLevel(1);
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || "anonymous",
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          isAdmin: false,
          currentLessonLevel: 1,
          totalCorrect: totalCorrectAnswers,
          totalIncorrect: totalIncorrectAnswers,
          visitCount: 1,
          totalTimeSpent: 0,
          lastLogin: serverTimestamp()
        });
      } else {
        const data = docSnap.data();
        totalCorrectAnswers = Number(data.totalCorrect) || 0;
        totalIncorrectAnswers = Number(data.totalIncorrect) || 0;
        saveLocalCounters(user, {
          correct: totalCorrectAnswers,
          incorrect: totalIncorrectAnswers
        });

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
      const guestCounters = getLocalCounters(null);
      totalCorrectAnswers = guestCounters.correct;
      totalIncorrectAnswers = guestCounters.incorrect;
      syncCategoriesWithLevel(currentLevel);
    }
    renderTrainer();
  });

  function getCurrentTasksForLevel(lvl) {
    return getTasksForLevel(lvl);
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
    clearPendingAdvance();
    stopErrorSpeech();
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
    clearPendingAdvance();
    stopErrorSpeech();
    if (testTimerInterval) clearInterval(testTimerInterval);
    isTestMode = false;
    sessionIndex = 0;
    currentInput = "";

    const totalQ = gameConfig.testQuestionCount;
    const requiredCorrect = Math.ceil(totalQ * 0.9);

    if (passed && testCorrectCount >= requiredCorrect) {
      const unlockedLevel = currentLevel + 1;
      currentLevel = unlockedLevel;
      syncCategoriesWithLevel(currentLevel);
      syncUserProgressToCloud();

      if (confirm(`Поздравляем! Вы успешно прошли тест (${testCorrectCount}/${totalQ}) и переходите на Уровень ${unlockedLevel}!\n\nПоделиться результатом с друзьями?`)) {
        shareProjectContent({
          title: `Уровень ${unlockedLevel} в Pareto English`,
          text: buildLevelUpShareText(unlockedLevel),
          url: SHARE_APP_URL
        });
      }
    } else {
      alert(`Время вышло или недостаточно правильных ответов (${testCorrectCount}/${totalQ}, нужно >= ${requiredCorrect}). Вы остаетесь на текущем уровне, тренируйтесь дальше!`);
      resetTaskPools();
    }
    pickNewTask();
    renderTrainer();
  }

  async function handleAnswerResult(isCorrect, spokenEnglishText = "") {
    if (isAdvancingAfterSpeech) return;

    const elementLevel = calculateElementLevel(totalCorrectAnswers);

    if (isTestMode) {
      testQuestionsAnswered++;
      if (isCorrect) {
        stopErrorSpeech();
        testCorrectCount++;
        sessionCorrectAnswers++;
        const updatedCounters = await recordAnswerAttempt({
          user: currentUser,
          isCorrect: true,
          countTowardCompletedTasks: true
        });
        totalCorrectAnswers = updatedCounters.correct;
        totalIncorrectAnswers = updatedCounters.incorrect;
        await syncUserProgressToCloud();
        if (elementLevel >= 5) playSound('success');
      } else {
        sessionIncorrectAnswers++;
        const updatedCounters = await recordAnswerAttempt({
          user: currentUser,
          isCorrect: false,
          countTowardCompletedTasks: false
        });
        totalCorrectAnswers = updatedCounters.correct;
        totalIncorrectAnswers = updatedCounters.incorrect;
        await syncUserProgressToCloud();
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
      return;
    }

    if (isCorrect) {
      stopErrorSpeech();
      sessionCorrectAnswers++;
    } else {
      sessionIncorrectAnswers++;
    }

    const updatedCounters = await recordAnswerAttempt({
      user: currentUser,
      isCorrect,
      countTowardCompletedTasks: true
    });
    totalCorrectAnswers = updatedCounters.correct;
    totalIncorrectAnswers = updatedCounters.incorrect;

    if (isCorrect) {
      consecutiveErrors = 0;

      if (elementLevel >= 1) {
        lastFeedback = "Правильно";
        lastFeedbackColor = "#22c55e";
      }

      const shouldSpeakEnglish = elementLevel >= 5 && !isEnglishToRussian && Boolean(spokenEnglishText);

      if (shouldSpeakEnglish) {
        isAdvancingAfterSpeech = true;
        renderTrainer();

        if (elementLevel >= 6) {
          const inputEl = document.getElementById('answer-display');
          if (inputEl) {
            inputEl.classList.add('success-flash');
          }
        }

        await syncUserProgressToCloud();

        speakCorrectAnswerAndWait(spokenEnglishText, () => {
          isAdvancingAfterSpeech = false;
          sessionIndex++;
          currentInput = "";
          pickNewTask();
          renderTrainer();
        });
        return;
      }

      if (elementLevel >= 5) {
        playSound('success');
      }

      if (elementLevel >= 6 && !isEnglishToRussian) {
        const inputEl = document.getElementById('answer-display');
        if (inputEl) {
          inputEl.classList.add('success-flash');
        }

        sessionIndex++;
        currentInput = "";

        setTimeout(() => {
          pickNewTask();
          renderTrainer();
        }, 300);

        await syncUserProgressToCloud();
        return;
      }

      sessionIndex++;
      currentInput = "";
      pickNewTask();
      await syncUserProgressToCloud();
      renderTrainer();
    } else {
      consecutiveErrors++;

      if (elementLevel >= 5) {
        playSound('error');
      }

      if (elementLevel >= 1) {
        const phrase = getWrongPhrase(consecutiveErrors);
        lastFeedback = phrase;
        lastFeedbackColor = "#ef4444";

        if (consecutiveErrors > 1) {
          speakErrorMessage(phrase, { enabled: isSoundEnabled });
        }
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

      await syncUserProgressToCloud();
      renderTrainer();
    }
  }

  function maybeShowStartupPresentation() {
    if (hasShownStartupPresentation) return;
    hasShownStartupPresentation = true;

    if (!isIntroHidden()) {
      showProjectPresentation({
        onClose: () => {
          const inputEl = document.getElementById('answer-display');
          preserveInputFocusAndCaret(inputEl);
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
    const showShareButton = !isTestMode && showCounters;
    const showTimer = elementLevel >= 3 && !isTestMode;
    const showTestButton = elementLevel >= 4;
    const showSoundToggle = elementLevel >= 5;
    const showSettingsButton = Boolean(currentUser) && elementLevel >= 7;
    const showSoftUpdateBanner = Boolean(availableUpdateVersion) && !isTestMode;

    app.innerHTML = `
      <div class="app-header">
        ${showSoftUpdateBanner ? `
          <div id="soft-update-banner" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 6px 10px; margin-bottom: var(--ui-gap); border-radius: 8px; background: var(--accent-bg); border: 1px solid var(--accent); font-size: 12px;">
            <span style="font-weight: 600; text-align: left; line-height: 1.25;">Доступна версия v${availableUpdateVersion}</span>
            <button type="button" id="apply-soft-update-btn" style="padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; background: var(--accent); color: #fff; border: none; flex-shrink: 0;">Обновить</button>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: var(--ui-gap); gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
            <span style="font-weight: 800; color: var(--accent); background: var(--accent-bg); padding: 2px 7px; border-radius: 6px; border: 1px solid var(--accent); white-space: nowrap; font-size: 12px;">Pareto English</span>
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${currentUser ? (currentUser.displayName || currentUser.email) : 'Гость'} · Ур. ${currentLevel}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            ${showShareButton ? `
              <button id="share-top-btn" title="Поделиться" aria-label="Поделиться" style="background: none; border: none; cursor: pointer; font-size: 14px; color: inherit; padding: 2px; line-height: 1;">📤</button>
            ` : ''}
            ${currentUser ? `
              <button id="logout-btn" style="background: none; border: none; text-decoration: underline; cursor: pointer; font-size: 13px; color: inherit; padding: 2px;">Выйти</button>
            ` : `
              <button id="login-trigger-btn" style="background: none; border: none; text-decoration: underline; cursor: pointer; font-size: 13px; color: inherit; padding: 2px;">Войти</button>
            `}
          </div>
        </div>

        <div id="timer-status-bar-container"></div>

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
              <div style="font-size: var(--counter-font-size); font-weight: bold; color: #22c55e; visibility: ${showCounters && !isTestMode ? 'visible' : 'hidden'};">${sessionCorrectAnswers}</div>
              <p style="font-size: var(--task-font-size); font-weight: bold; margin: 0; line-height: 1.15;">${currentTask.ru}</p>
              <div style="font-size: var(--counter-font-size); font-weight: bold; color: #ef4444; visibility: ${showCounters && !isTestMode ? 'visible' : 'hidden'};">${sessionIncorrectAnswers}</div>
            </div>

            <input type="text" id="answer-display" inputmode="none" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value="${currentInput}" />
            <div id="feedback-msg" style="min-height: 22px; font-size: clamp(13px, 2dvh, 15px); font-weight: bold; color: ${lastFeedbackColor}; line-height: 1.15; margin-top: clamp(4px, 0.8dvh, 8px); visibility: ${showFeedback || lastFeedback ? 'visible' : 'hidden'};">${lastFeedback}</div>
          </div>
        ` : `
          <div>
            <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: var(--ui-gap);">
              <div style="font-size: var(--counter-font-size); font-weight: bold; color: #22c55e; visibility: ${showCounters && !isTestMode ? 'visible' : 'hidden'};">${sessionCorrectAnswers}</div>
              <p style="font-size: var(--task-font-size); font-weight: bold; margin: 0; line-height: 1.15;">${currentTask.en}</p>
              <div style="font-size: var(--counter-font-size); font-weight: bold; color: #ef4444; visibility: ${showCounters && !isTestMode ? 'visible' : 'hidden'};">${sessionIncorrectAnswers}</div>
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

    renderTimerStatusBar({
      containerId: 'timer-status-bar-container',
      formattedTime: formatTime(secondsElapsed),
      showTimer,
      showSoundToggle,
      isSoundEnabled,
      showSettingsButton,
      onToggleSound: () => {
        isSoundEnabled = !isSoundEnabled;
        localStorage.setItem('rkai_sound_enabled', isSoundEnabled);
        if (!isSoundEnabled) {
          clearPendingAdvance();
          stopErrorSpeech();
        }
        renderTrainer();
      },
      onOpenSettings: () => {
        clearPendingAdvance();
        stopErrorSpeech();
        openSettingsModal({
          user: currentUser,
          currentLevel,
          onBeforeOpen: () => flushSessionTime()
        });
      }
    });

    renderCategoryFilters({
      containerId: 'category-filters-container',
      currentLevel,
      activeCategories,
      isTestMode,
      onToggleCategory: handleToggleCategory
    });

    if (!isEnglishToRussian) {
      const inputEl = document.getElementById('answer-display');
      let refreshShift = () => {};

      if (inputEl) {
        inputEl.setAttribute('inputmode', 'none');

        if (!isAdvancingAfterSpeech) {
          preserveInputFocusAndCaret(inputEl, currentInput.length);
        }

        const handleCursorMove = () => {
          if (!isAdvancingAfterSpeech) {
            currentInput = inputEl.value;
            refreshShift();
          }
        };

        inputEl.addEventListener('click', (e) => {
          e.preventDefault();
          if (!isAdvancingAfterSpeech) {
            preserveInputFocusAndCaret(inputEl, inputEl.selectionStart);
            handleCursorMove();
          }
        });

        inputEl.addEventListener('touchend', () => {
          requestAnimationFrame(handleCursorMove);
        });

        inputEl.addEventListener('keydown', (e) => {
          if (e.key !== 'Tab' && e.key !== 'Enter') {
            e.preventDefault();
          }
        });
      }

      const kbApi = setupKeyboard({
        level: currentLevel,
        getInputState: () => {
          if (!inputEl) {
            return { value: currentInput, selectionStart: currentInput.length, selectionEnd: currentInput.length };
          }
          return {
            value: inputEl.value,
            selectionStart: inputEl.selectionStart,
            selectionEnd: inputEl.selectionEnd
          };
        },
        onInput: (char) => {
          if (isAdvancingAfterSpeech || !inputEl) return;
          const start = inputEl.selectionStart;
          const end = inputEl.selectionEnd;
          const val = inputEl.value;

          if (val.length < MAX_INPUT_LENGTH) {
            let charToAdd = char;

            inputEl.value = val.substring(0, start) + charToAdd + val.substring(end);
            inputEl.selectionStart = inputEl.selectionEnd = start + 1;
            currentInput = inputEl.value;
            preserveInputFocusAndCaret(inputEl, start + 1);
          }
        },
        onBackspace: () => {
          if (isAdvancingAfterSpeech || !inputEl) return;
          const start = inputEl.selectionStart;
          const end = inputEl.selectionEnd;
          const val = inputEl.value;

          if (start !== end) {
            inputEl.value = val.substring(0, start) + val.substring(end);
            inputEl.selectionStart = inputEl.selectionEnd = start;
            currentInput = inputEl.value;
            preserveInputFocusAndCaret(inputEl, start);
          } else if (start > 0) {
            inputEl.value = val.substring(0, start - 1) + val.substring(start);
            inputEl.selectionStart = inputEl.selectionEnd = start - 1;
            currentInput = inputEl.value;
            preserveInputFocusAndCaret(inputEl, start - 1);
          } else {
            currentInput = inputEl.value;
            preserveInputFocusAndCaret(inputEl, 0);
          }
        },
        onSpace: () => {
          if (isAdvancingAfterSpeech || !inputEl) return;
          const start = inputEl.selectionStart;
          const end = inputEl.selectionEnd;
          const val = inputEl.value;

          if (val.length < MAX_INPUT_LENGTH) {
            inputEl.value = val.substring(0, start) + " " + val.substring(end);
            inputEl.selectionStart = inputEl.selectionEnd = start + 1;
            currentInput = inputEl.value;
            preserveInputFocusAndCaret(inputEl, start + 1);
          }
        },
        onOk: async () => {
          if (isAdvancingAfterSpeech) return;
          if (inputEl) currentInput = inputEl.value;
          const trimmedInput = currentInput.trim();

          if (!trimmedInput) {
            lastFeedback = "Сначала введите перевод";
            lastFeedbackColor = "#eab308";
            renderTrainer();
            return;
          }

          const isCorrect = trimmedInput.toLowerCase() === currentTask.en.toLowerCase();
          await handleAnswerResult(isCorrect, isCorrect ? trimmedInput : "");
        }
      });

      if (kbApi && typeof kbApi.refreshShiftState === 'function') {
        refreshShift = kbApi.refreshShiftState;
        refreshShift();
      }
    } else {
      setupOptions();
    }

    setupModals({ currentLevel });
    if (!isTestMode) startTimer();

    const applySoftUpdateBtn = document.getElementById('apply-soft-update-btn');
    if (applySoftUpdateBtn) {
      applySoftUpdateBtn.onclick = async () => {
        const versionToApply = availableUpdateVersion;
        availableUpdateVersion = null;
        clearPendingAdvance();
        stopErrorSpeech();
        renderTrainer();
        resetViewportPosition();
        flushSessionTime();
        await syncUserProgressToCloud();
        await applyPendingAppUpdate(versionToApply);
      };
    }

    const shareTopBtn = document.getElementById('share-top-btn');
    if (shareTopBtn) {
      shareTopBtn.onclick = () => {
        shareProjectContent({
          title: "Pareto English — самый эффективный тренажёр английского",
          text: buildProjectShareText(),
          url: SHARE_APP_URL
        });
      };
    }

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
        clearPendingAdvance();
        stopErrorSpeech();
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
        if (isAdvancingAfterSpeech) return;
        const isCorrect = btn.textContent.trim() === currentTask.correct;
        await handleAnswerResult(isCorrect);
      });
    });
  }
});