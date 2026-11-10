// src/main.js
import './styles/evolution.css';
import { auth, googleProvider, db } from './firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { level1Tasks, level2Tasks, level3Tasks } from './data/tasks.js';
import { setupKeyboard } from './components/keyboard.js';
import { setupModals } from './components/modals.js';
import { openAdminPanel } from './components/admin.js';
import { calculateLevel } from './config/gameConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('#app');

  let sessionIndex = 0;          
  let totalCorrectAnswers = 0;   
  let totalIncorrectAnswers = 0;  
  let currentTask = null;        
  let isEnglishToRussian = false; 
  let currentInput = "";
  let lastFeedback = "";        
  let lastFeedbackColor = "";   
  
  let secondsElapsed = 0;       
  let timerInterval = null;
  let currentUser = null;
  let isAdminUser = false;
  let userUnsubscribe = null; 
  let loginPromptShown = false; 
  let deferredPrompt = null; 

  let isExamMode = false;
  let examCorrectCount = 0;
  let examSecondsLeft = 120;
  let examTimerInterval = null;

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

  function updateDynamicLevel() {
    const computedLevel = calculateLevel(totalCorrectAnswers);
    document.body.setAttribute('data-level', computedLevel.toString());
    return computedLevel;
  }

  async function saveProgressToFirestore() {
    if (!currentUser) return;
    try {
      const currentLevel = updateDynamicLevel();
      const userRef = doc(db, "users", currentUser.uid);

      await setDoc(userRef, {
        uid: currentUser.uid,
        email: currentUser.email || "anonymous",
        displayName: currentUser.displayName || "",
        photoURL: currentUser.photoURL || "",
        totalCorrect: totalCorrectAnswers,
        totalIncorrect: totalIncorrectAnswers,
        secondsElapsed: secondsElapsed,
        userLevel: currentLevel,
        lastActive: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("❌ Ошибка сохранения данных:", error);
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
          userLevel: 0,
          totalCorrect: totalCorrectAnswers,
          totalIncorrect: totalIncorrectAnswers,
          secondsElapsed: secondsElapsed,
          lastLogin: serverTimestamp()
        });
      } else {
        const data = docSnap.data();
        totalCorrectAnswers = Math.max(data.totalCorrect || 0, totalCorrectAnswers);
        totalIncorrectAnswers = Math.max(data.totalIncorrect || 0, totalIncorrectAnswers);
        secondsElapsed = Math.max(data.secondsElapsed || 0, secondsElapsed);
        
        updateDynamicLevel();
        await setDoc(userRef, { lastLogin: serverTimestamp(), totalCorrect: totalCorrectAnswers, totalIncorrect: totalIncorrectAnswers }, { merge: true });
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

  function getCurrentTasks() {
    const currentLevel = updateDynamicLevel();
    if (currentLevel >= 2) return level3Tasks;
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
      if (timerEl && !isExamMode && totalCorrectAnswers >= 2) {
        timerEl.textContent = `⏱ ${formatTime(secondsElapsed)}`;
      }
    }, 1000);
  }

  function showLoginPromptModal() {
    let promptModal = document.getElementById('login-prompt-modal');
    if (!promptModal) {
      promptModal = document.createElement('div');
      promptModal.id = 'login-prompt-modal';
      promptModal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 3000; padding: 20px; box-sizing: border-box;';
      promptModal.innerHTML = `
        <div style="background: #fff; color: #000; padding: 30px; border-radius: 8px; max-width: 400px; width: 100%; text-align: center; border: 2px solid #000;">
          <h2 style="margin-top: 0; font-size: 20px; margin-bottom: 15px;">Сохранение результатов</h2>
          <p style="font-size: 16px; margin-bottom: 25px; line-height: 1.5;">Для сохранения ваших результатов, вам необходимо авторизоваться через Google.</p>
          <button id="modal-google-login-btn" style="background: #000; color: #fff; border: 2px solid #000; padding: 12px 20px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; margin-bottom: 10px;">Войти через Google</button>
          <button id="modal-close-prompt-btn" style="background: #fff; color: #666; border: 1px solid #ccc; padding: 8px 15px; font-size: 14px; cursor: pointer; width: 100%;">Продолжить без сохранения</button>
        </div>
      `;
      document.body.appendChild(promptModal);

      document.getElementById('modal-google-login-btn').addEventListener('click', async () => {
        try {
          await signInWithPopup(auth, googleProvider);
          promptModal.style.display = 'none';
        } catch (error) {
          alert("Ошибка входа: " + error.message);
        }
      });

      document.getElementById('modal-close-prompt-btn').addEventListener('click', () => {
        promptModal.style.display = 'none';
      });
    } else {
      promptModal.style.display = 'flex';
    }
  }

  function renderTrainer() {
    if (!currentTask) {
      pickNewTask();
    }

    const showStats = totalCorrectAnswers >= 2;
    const currentLevel = updateDynamicLevel();

    app.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <button id="words-btn" style="width: 80px; padding: 6px; font-size: 13px; background: inherit; color: inherit; border: 2px solid currentColor; cursor: pointer;">Слова</button>
        <div id="timer-display" style="font-size: 14px; font-weight: bold; visibility: ${showStats && !isExamMode ? 'visible' : 'hidden'};">⏱ ${formatTime(secondsElapsed)}</div>
        <button id="rules-btn" style="width: 80px; padding: 6px; font-size: 13px; background: inherit; color: inherit; border: 2px solid currentColor; cursor: pointer;">Правила</button>
      </div>

      ${deferredPrompt ? `
        <div style="margin-bottom: 10px;">
          <button id="install-pwa-btn" style="width: 100%; padding: 10px; background: #22c55e; color: #fff; border: 2px solid #000; font-size: 14px; font-weight: bold; cursor: pointer; border-radius: 4px;">📲 Установить приложение</button>
        </div>
      ` : ''}

      ${isAdminUser ? `
        <div style="margin-bottom: 8px; text-align: center;">
          <button id="admin-panel-btn" style="padding: 4px 10px; background: #1e1e24; color: #c084fc; border: 1px solid #c084fc; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 4px;">📊 Мониторинг сессий (Админ)</button>
        </div>
      ` : ''}

      <div style="text-align: right; font-size: 12px; margin-bottom: 15px;">
        ${currentUser ? `
          👤 ${currentUser.displayName || currentUser.email} (Уровень ${currentLevel + 1})
          <button id="logout-btn" style="background: none; border: none; text-decoration: underline; cursor: pointer; font-size: 12px; margin-left: 5px; color: inherit;">Выйти</button>
        ` : `
          👤 Гость (Уровень ${currentLevel + 1})
          <button id="login-trigger-btn" style="background: none; border: none; text-decoration: underline; cursor: pointer; font-size: 12px; margin-left: 5px; color: inherit;">Войти</button>
        `}
      </div>
    `;

    if (!isEnglishToRussian) {
      app.innerHTML += `
        <div style="margin: 20px 0;">
          <div style="display: flex; justify-content: center; align-items: center; gap: 25px; margin-bottom: 15px;">
            <div style="font-size: 24px; font-weight: bold; color: #22c55e; visibility: ${showStats ? 'visible' : 'hidden'};">${totalCorrectAnswers}</div>
            <p style="font-size: 24px; font-weight: bold; margin: 0;">${currentTask.ru}</p>
            <div style="font-size: 24px; font-weight: bold; color: #ef4444; visibility: ${showStats ? 'visible' : 'hidden'};">${totalIncorrectAnswers}</div>
          </div>

          <div id="answer-display" style="border: 2px solid currentColor; padding: 15px; font-size: 22px; min-height: 30px; margin-bottom: 10px; letter-spacing: 2px; border-radius: var(--border-radius, 0px);">${currentInput}</div>
          <div id="feedback-msg" style="height: 24px; font-size: 16px; font-weight: bold; color: ${lastFeedbackColor};">${lastFeedback}</div>
        </div>

        <div id="keyboard" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px;"></div>

        <div style="display: flex; gap: 8px;">
          <button id="space-btn" style="flex: 3; padding: 15px; background: inherit; color: inherit; border: 2px solid currentColor; font-size: 16px; cursor: pointer; border-radius: var(--border-radius, 0px);">пробел</button>
          <button id="backspace-btn" style="flex: 1.5; padding: 15px; background: inherit; color: inherit; border: 2px solid currentColor; font-size: 18px; cursor: pointer; border-radius: var(--border-radius, 0px);">⌫</button>
          <button id="ok-btn" style="flex: 1.5; padding: 15px; background: inherit; color: inherit; border: 2px solid currentColor; font-size: 18px; font-weight: bold; cursor: pointer; border-radius: var(--border-radius, 0px);">✓</button>
        </div>
      `;

      setupKeyboard({
        level: currentLevel,
        onInput: (char) => {
          if (currentInput.length === 0) {
            currentInput += char.toUpperCase();
          } else {
            currentInput += char;
          }
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
          
          if (isCorrect) {
            if (totalCorrectAnswers >= 2) {
              lastFeedback = "Правильно";
              lastFeedbackColor = "#22c55e";
            }
            totalCorrectAnswers++;
          } else {
            if (totalCorrectAnswers >= 2) {
              lastFeedback = "Неправильно";
              lastFeedbackColor = "#ef4444";
            }
            totalIncorrectAnswers++;
          }

          if (!currentUser && totalCorrectAnswers >= 2 && !loginPromptShown) {
            loginPromptShown = true;
            showLoginPromptModal();
          }

          sessionIndex++;
          currentInput = "";
          pickNewTask();
          await saveProgressToFirestore(); 
          renderTrainer();
        }
      });
    } else {
      app.innerHTML += `
        <div style="margin: 20px 0;">
          <div style="display: flex; justify-content: center; align-items: center; gap: 25px; margin-bottom: 20px;">
            <div style="font-size: 24px; font-weight: bold; color: #22c55e; visibility: ${showStats ? 'visible' : 'hidden'};">${totalCorrectAnswers}</div>
            <p style="font-size: 24px; font-weight: bold; margin: 0;">${currentTask.en}</p>
            <div style="font-size: 24px; font-weight: bold; color: #ef4444; visibility: ${showStats ? 'visible' : 'hidden'};">${totalIncorrectAnswers}</div>
          </div>

          <div id="feedback-msg" style="height: 24px; font-size: 16px; font-weight: bold; margin-bottom: 15px; color: ${lastFeedbackColor};">${lastFeedback}</div>
          <div id="options-container" style="display: flex; flex-direction: column; gap: 10px;">
            ${currentTask.options.map(opt => `
              <button class="option-btn" style="padding: 15px; background: inherit; color: inherit; border: 2px solid currentColor; font-size: 18px; cursor: pointer; text-align: center; border-radius: var(--border-radius, 0px);">${opt}</button>
            `).join('')}
          </div>
        </div>
      `;

      setupOptions();
    }

    setupModals();
    startTimer();

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
        await saveProgressToFirestore();
        signOut(auth);
      };
    }
  }

  function setupOptions() {
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const isCorrect = btn.textContent.trim() === currentTask.correct;

        if (isCorrect) {
          if (totalCorrectAnswers >= 2) {
            lastFeedback = "Правильно";
            lastFeedbackColor = "#22c55e";
          }
          totalCorrectAnswers++;
        } else {
          if (totalCorrectAnswers >= 2) {
            lastFeedback = "Неправильно";
            lastFeedbackColor = "#ef4444";
          }
          totalIncorrectAnswers++;
        }

        if (!currentUser && totalCorrectAnswers >= 2 && !loginPromptShown) {
          loginPromptShown = true;
          showLoginPromptModal();
        }

        sessionIndex++;
        pickNewTask();
        await saveProgressToFirestore();
        renderTrainer();
      });
    });
  }
});