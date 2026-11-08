import './styles/evolution.css';
import { auth, googleProvider, db } from './firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { level1Tasks, level2Tasks, level3Tasks } from './data/tasks.js';
import { setupKeyboard } from './components/keyboard.js';
import { setupModals } from './components/modals.js';
import { openAdminPanel } from './components/admin.js';

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

  let isExamMode = false;
  let examCorrectCount = 0;
  let examSecondsLeft = 120;
  let examTimerInterval = null;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  // Функция мгновенного сохранения всего прогресса в Firestore
  async function saveProgressToFirestore() {
    if (!currentUser) return;
    try {
      const currentLevel = parseInt(document.body.getAttribute('data-level') || '0', 10);
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

      console.log("✅ Уровень и статистика успешно сохранены:", { currentLevel, totalCorrectAnswers, totalIncorrectAnswers });
    } catch (error) {
      console.error("❌ Ошибка сохранения данных:", error);
    }
  }

  // Загрузка профиля при первом входе
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
          totalCorrect: 0,
          totalIncorrect: 0,
          secondsElapsed: 0,
          lastLogin: serverTimestamp()
        });
        document.body.setAttribute('data-level', '0');
        totalCorrectAnswers = 0;
        totalIncorrectAnswers = 0;
        secondsElapsed = 0;
      } else {
        const data = docSnap.data();
        totalCorrectAnswers = data.totalCorrect || 0;
        totalIncorrectAnswers = data.totalIncorrect || 0;
        secondsElapsed = data.secondsElapsed || 0;
        const savedLevel = data.userLevel !== undefined ? data.userLevel : 0;

        document.body.setAttribute('data-level', savedLevel.toString());
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
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

      // Слушаем ТОЛЬКО изменение прав администратора (isAdmin), чтобы не перетирать прогресс ответов
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
      document.body.setAttribute('data-level', '0');
    }
    renderScreen();
  });

  function getCurrentTasks() {
    const currentLevel = parseInt(document.body.getAttribute('data-level') || '0', 10);
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
          <p style="margin-bottom: 30px; font-size: 16px;">Тренажер английского языка</p>
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

    let examButtonText = "🚀 Сдать экзамен на Уровень 2";
    if (currentLevel === 1) {
      examButtonText = "🚀 Сдать экзамен на Уровень 3 (Вопросы)";
    }

    app.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <button id="words-btn" style="width: 80px; padding: 6px; font-size: 13px; background: #fff; color: #000; border: 2px solid #000; cursor: pointer;">Слова</button>
        <div id="timer-display" style="font-size: 14px; font-weight: bold; visibility: ${showStats && !isExamMode ? 'visible' : 'hidden'};">⏱ ${formatTime(secondsElapsed)}</div>
        <button id="rules-btn" style="width: 80px; padding: 6px; font-size: 13px; background: #fff; color: #000; border: 2px solid #000; cursor: pointer;">Правила</button>
      </div>

      ${isAdminUser ? `
        <div style="margin-bottom: 8px; text-align: center;">
          <button id="admin-panel-btn" style="padding: 4px 10px; background: #1e1e24; color: #c084fc; border: 1px solid #c084fc; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 4px;">📊 Мониторинг сессий (Админ)</button>
        </div>
      ` : ''}

      ${currentLevel < 2 && !isExamMode ? `
        <div style="margin-bottom: 10px;">
          <button id="start-exam-btn" style="width: 100%; padding: 10px; background: #000; color: #fff; border: 2px solid #000; font-size: 14px; font-weight: bold; cursor: pointer;">${examButtonText}</button>
        </div>
      ` : ''}

      ${isExamMode ? `
        <div style="background: #333; color: #fff; padding: 8px; margin-bottom: 10px; font-weight: bold; font-size: 14px;">
          ЭКЗАМЕН: Верно ${examCorrectCount}/2 | <span id="exam-timer">⏳ Осталось: ${examSecondsLeft}с</span>
        </div>
      ` : ''}

      <div style="text-align: right; font-size: 12px; margin-bottom: 15px;">
        👤 ${currentUser.displayName || currentUser.email} (${isAdminUser ? 'Админ' : 'Уровень ' + (currentLevel + 1)})
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
          
          if (isExamMode) {
            if (isCorrect) {
              examCorrectCount++;
              if (examCorrectCount >= 2) {
                clearInterval(examTimerInterval);
                isExamMode = false;
                if (currentLevel === 0) {
                  document.body.setAttribute('data-level', '1');
                  alert("🎉 Экзамен сдан! Добро пожаловать на Уровень 2!");
                } else if (currentLevel === 1) {
                  document.body.setAttribute('data-level', '2');
                  alert("🎉 Экзамен сдан! Добро пожаловать на Уровень 3!");
                }
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
          await saveProgressToFirestore(); // Сохранение после каждого ответа
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

    const adminBtn = document.getElementById('admin-panel-btn');
    if (adminBtn) {
      adminBtn.onclick = () => openAdminPanel();
    }

    document.getElementById('logout-btn').onclick = async () => {
      if (userUnsubscribe) userUnsubscribe();
      await saveProgressToFirestore();
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
              if (currentLevel === 0) {
                document.body.setAttribute('data-level', '1');
                alert("🎉 Экзамен сдан! Добро пожаловать на Уровень 2!");
              } else if (currentLevel === 1) {
                document.body.setAttribute('data-level', '2');
                alert("🎉 Экзамен сдан! Добро пожаловать на Уровень 3!");
              }
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
        await saveProgressToFirestore(); // Сохранение после клика на вариант
        renderTrainer();
      });
    });
  }
});