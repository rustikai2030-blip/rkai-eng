// src/components/admin.js
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase.js";
import { gameConfig } from "../config/gameConfig.js";
import { getWrongPhrases, saveWrongPhrases, initialWrongPhrases } from "../data/wrongPhrases.js";

let allUsers = [];
let currentActiveTab = 'users';

export async function openAdminPanel() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("Доступ запрещен. Требуется авторизация.");
    return;
  }

  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists() || !docSnap.data().isAdmin) {
      alert("У вас нет прав администратора для доступа к этой панели.");
      return;
    }
  } catch (err) {
    console.error("Ошибка проверки прав администратора:", err);
    alert("Ошибка проверки прав доступа.");
    return;
  }

  let adminModal = document.getElementById('admin-modal');
  if (!adminModal) {
    adminModal = document.createElement('div');
    adminModal.id = 'admin-modal';
    adminModal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #f8fafc; color: #1e293b; padding: 15px; box-sizing: border-box; overflow-y: auto; text-align: left; z-index: 2000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
    document.body.appendChild(adminModal);
  }

  adminModal.style.display = 'block';
  renderAdminMainView();
}

function renderAdminMainView() {
  const modal = document.getElementById('admin-modal');
  modal.innerHTML = `
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; min-height: 100%; padding: 10px;">
      
      <div style="display: flex; justify-content: flex-end; align-items: center; padding: 10px 0 15px 0;">
        <button id="admin-exit-red-btn" style="background: #ef4444; color: #ffffff; border: none; padding: 10px 22px; border-radius: 20px; font-size: 15px; font-weight: 700; cursor: pointer;">Выйти</button>
      </div>

      <div style="margin-bottom: 20px;">
        <h1 style="font-size: 26px; font-weight: 700; margin: 0; color: #0f172a;">Админ-панель</h1>
      </div>

      <div style="display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap;">
        <button class="admin-tab-btn" data-tab="users" style="flex: 1; min-width: 100px; padding: 10px; border-radius: 16px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; background: ${currentActiveTab === 'users' ? '#38bdf8' : '#cbd5e1'}; color: ${currentActiveTab === 'users' ? '#ffffff' : '#475569'};">Пользователи</button>
        <button class="admin-tab-btn" data-tab="phrases" style="flex: 1; min-width: 100px; padding: 10px; border-radius: 16px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; background: ${currentActiveTab === 'phrases' ? '#38bdf8' : '#cbd5e1'}; color: ${currentActiveTab === 'phrases' ? '#ffffff' : '#475569'};">Фразы</button>
        <button class="admin-tab-btn" data-tab="analytics" style="flex: 1; min-width: 100px; padding: 10px; border-radius: 16px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; background: ${currentActiveTab === 'analytics' ? '#38bdf8' : '#cbd5e1'}; color: ${currentActiveTab === 'analytics' ? '#ffffff' : '#475569'};">Аналитика</button>
        <button class="admin-tab-btn" data-tab="settings" style="flex: 1; min-width: 100px; padding: 10px; border-radius: 16px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; background: ${currentActiveTab === 'settings' ? '#38bdf8' : '#cbd5e1'}; color: ${currentActiveTab === 'settings' ? '#ffffff' : '#475569'};">Настройки</button>
      </div>

      <div id="admin-tab-content"></div>

    </div>
  `;

  document.getElementById('admin-exit-red-btn').onclick = closeAdminModal;

  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.onclick = (e) => {
      currentActiveTab = e.target.getAttribute('data-tab');
      renderAdminMainView();
    };
  });

  if (currentActiveTab === 'users') {
    renderUsersTab();
  } else if (currentActiveTab === 'phrases') {
    renderPhrasesTab();
  } else if (currentActiveTab === 'analytics') {
    renderAnalyticsTab();
  } else {
    renderSettingsTab();
  }
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.style.display = 'none';
}

function renderPhrasesTab() {
  const contentContainer = document.getElementById('admin-tab-content');
  if (!contentContainer) return;

  const phrases = getWrongPhrases();

  let html = `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0;">Управление фразами</h3>
        <button id="reset-phrases-default" style="background: #f59e0b; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">Сбросить по умолч.</button>
      </div>
      <p style="font-size: 13px; color: #64748b; margin-bottom: 15px;">Здесь вы можете добавлять или удалять фразы для каждого уровня ошибок.</p>
  `;

  for (let lvl = 1; lvl <= 5; lvl++) {
    const list = phrases[lvl] || [];
    html += `
      <div style="margin-bottom: 20px; background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px;">
        <h4 style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 0 0 10px 0;">Уровень ${lvl} (${list.length} выраж.)</h4>
        
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;" id="phrase-list-lvl-${lvl}">
    `;

    list.forEach((phrase, index) => {
      html += `
        <div style="display: flex; gap: 8px; align-items: center;">
          <input type="text" data-level="${lvl}" data-index="${index}" class="phrase-input-item" value="${phrase}" style="flex: 1; padding: 8px 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 14px;" />
          <button data-level="${lvl}" data-index="${index}" class="delete-phrase-btn" style="background: #ef4444; color: #fff; border: none; padding: 8px 12px; border-radius: 8px; font-size: 13px; cursor: pointer;">✕</button>
        </div>
      `;
    });

    html += `
        </div>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="new-phrase-lvl-${lvl}" placeholder="Новое выражение..." style="flex: 1; padding: 8px 10px; border-radius: 8px; border: 1px solid #38bdf8; font-size: 14px;" />
          <button data-level="${lvl}" class="add-phrase-btn" style="background: #22c55e; color: #fff; border: none; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">Добавить</button>
        </div>
      </div>
    `;
  }

  html += `</div>`;
  contentContainer.innerHTML = html;

  // Обработчики кнопок удаления
  document.querySelectorAll('.delete-phrase-btn').forEach(btn => {
    btn.onclick = () => {
      const lvl = btn.getAttribute('data-level');
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      phrases[lvl].splice(idx, 1);
      saveWrongPhrases(phrases);
      renderPhrasesTab();
    };
  });

  // Обработчики кнопок добавления
  document.querySelectorAll('.add-phrase-btn').forEach(btn => {
    btn.onclick = () => {
      const lvl = btn.getAttribute('data-level');
      const input = document.getElementById(`new-phrase-lvl-${lvl}`);
      const val = input.value.trim();
      if (val) {
        phrases[lvl].push(val);
        saveWrongPhrases(phrases);
        renderPhrasesTab();
      }
    };
  });

  // Автосохранение при изменении текста инпутов
  document.querySelectorAll('.phrase-input-item').forEach(input => {
    input.onchange = () => {
      const lvl = input.getAttribute('data-level');
      const idx = parseInt(input.getAttribute('data-index'), 10);
      const val = input.value.trim();
      if (val) {
        phrases[lvl][idx] = val;
        saveWrongPhrases(phrases);
      }
    };
  });

  // Сброс к дефолтным
  document.getElementById('reset-phrases-default').onclick = () => {
    if (confirm("Сбросить все фразы к стандартным значениям?")) {
      saveWrongPhrases(initialWrongPhrases);
      renderPhrasesTab();
    }
  };
}

async function renderSettingsTab() {
  const contentContainer = document.getElementById('admin-tab-content');
  if (!contentContainer) return;

  contentContainer.innerHTML = `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
      <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 10px;">Игровые настройки</h3>
      <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">Укажите количество правильных ответов, необходимое для перехода на следующий уровень и смены визуального стиля интерфейса.</p>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 8px;">Шаг ответов для смены уровня:</label>
        <input type="number" id="setting-step-input" value="${gameConfig.stepPerLevel}" min="1" max="100" style="width: 100%; padding: 12px 15px; border-radius: 12px; border: 2px solid #cbd5e1; font-size: 16px; box-sizing: border-box; outline: none;" />
      </div>

      <button id="save-settings-btn" style="width: 100%; background: #22c55e; color: #ffffff; border: none; padding: 14px; border-radius: 25px; font-size: 16px; font-weight: 700; cursor: pointer;">Сохранить настройки</button>
    </div>
  `;

  document.getElementById('save-settings-btn').onclick = async () => {
    const val = parseInt(document.getElementById('setting-step-input').value, 10);
    if (isNaN(val) || val < 1) {
      alert("Введите корректное число (больше 0).");
      return;
    }

    try {
      const settingsRef = doc(db, "settings", "game");
      await setDoc(settingsRef, { stepPerLevel: val }, { merge: true });
      gameConfig.stepPerLevel = val;
      alert("Настройки успешно сохранены!");
    } catch (err) {
      alert("Ошибка сохранения: " + err.message);
    }
  };
}

async function renderUsersTab() {
  const contentContainer = document.getElementById('admin-tab-content');
  if (!contentContainer) return;

  contentContainer.innerHTML = `
    <div style="margin-bottom: 20px;">
      <input type="text" id="admin-user-search" placeholder="Поиск по Email или UID..." style="width: 100%; padding: 14px 18px; border-radius: 12px; border: 2px solid #0f172a; font-size: 15px; box-sizing: border-box; outline: none;" />
    </div>
    <div id="admin-users-container">
      <p style="text-align: center; color: #64748b;">Загрузка списка пользователей...</p>
    </div>
  `;

  document.getElementById('admin-user-search').addEventListener('input', (e) => {
    filterAndRenderUsers(e.target.value);
  });

  try {
    const usersQuery = query(collection(db, "users"), orderBy("lastLogin", "desc"));
    const querySnapshot = await getDocs(usersQuery);

    allUsers = [];
    querySnapshot.forEach((docSnap) => {
      allUsers.push({ id: docSnap.id, ...docSnap.data() });
    });

    filterAndRenderUsers('');
  } catch (error) {
    console.error("Ошибка при загрузке пользователей:", error);
    const container = document.getElementById('admin-users-container');
    if (container) {
      container.innerHTML = `<p style="color: #ef4444; text-align: center;">Ошибка загрузки: ${error.message}</p>`;
    }
  }
}

function filterAndRenderUsers(searchTerm) {
  const container = document.getElementById('admin-users-container');
  if (!container) return;

  const term = searchTerm.toLowerCase().trim();
  const filtered = allUsers.filter(u => 
    (u.email && u.email.toLowerCase().includes(term)) || 
    (u.uid && u.uid.toLowerCase().includes(term))
  );

  let html = `<h3 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">Список пользователей (${filtered.length})</h3>`;

  if (filtered.length === 0) {
    html += `<p style="color: #94a3b8; text-align: center; margin-top: 20px;">Пользователи не найдены.</p>`;
    container.innerHTML = html;
    return;
  }

  html += `<div style="display: flex; flex-direction: column; gap: 10px;">`;

  filtered.forEach((user) => {
    const regDate = user.lastLogin?.toDate ? user.lastLogin.toDate().toLocaleDateString('ru-RU') : 'Недавно';
    const statusText = user.isAdmin ? 'Администратор' : 'Активен';

    html += `
      <div class="user-card-item" data-uid="${user.uid}" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #ffffff; cursor: pointer; transition: all 0.2s ease;">
        <div style="font-weight: 700; font-size: 16px; color: #0f172a; word-break: break-all;">${user.email || 'Без email'}</div>
        <div style="font-size: 12px; color: #94a3b8; margin: 4px 0;">UID: ${user.uid}</div>
        <div style="font-size: 13px; color: #64748b;">Зарегистрирован: ${regDate} | ${statusText}</div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;

  document.querySelectorAll('.user-card-item').forEach(card => {
    card.addEventListener('click', () => {
      const uid = card.getAttribute('data-uid');
      openUserProfileView(uid);
    });
  });
}

async function openUserProfileView(uid) {
  const modal = document.getElementById('admin-modal');
  modal.innerHTML = `
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; min-height: 100%; padding: 10px;">
      
      <div style="display: flex; justify-content: flex-end; align-items: center; padding: 10px 0 15px 0;">
        <button id="admin-exit-red-btn-2" style="background: #ef4444; color: #ffffff; border: none; padding: 10px 22px; border-radius: 20px; font-size: 15px; font-weight: 700; cursor: pointer;">Выйти</button>
      </div>

      <div style="margin: 10px 0 20px 0;">
        <button id="back-to-users-list" style="background: #22c55e; color: #ffffff; border: none; padding: 12px 24px; border-radius: 25px; font-size: 16px; font-weight: 700; cursor: pointer;">← Назад к списку</button>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 5px 0; color: #0f172a;">Профиль:</h2>
        <div style="font-size: 15px; color: #334155; word-break: break-all; font-weight: 600;">${uid}</div>
      </div>

      <div id="user-details-card" style="background: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; padding: 18px; margin-bottom: 20px;">
        <p style="text-align: center; color: #64748b;">Загрузка профиля...</p>
      </div>

      <div style="margin-top: 20px;">
        <h4 style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Данные Firestore (JSON):</h4>
        <pre id="json-debug-view" style="background: #f1f5f9; padding: 14px; border-radius: 12px; font-size: 12px; color: #334155; overflow-x: auto; white-space: pre-wrap; font-family: monospace;"></pre>
      </div>

    </div>
  `;

  document.getElementById('admin-exit-red-btn-2').onclick = closeAdminModal;
  document.getElementById('back-to-users-list').onclick = () => renderAdminMainView();

  try {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      document.getElementById('user-details-card').innerHTML = `<p style="color: #ef4444;">Пользователь не найден.</p>`;
      return;
    }

    const userData = docSnap.data();
    const isAdmin = !!userData.isAdmin;

    document.getElementById('user-details-card').innerHTML = `
      <div style="font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 15px;">
        Статус: <span style="color: ${isAdmin ? '#16a34a' : '#475569'};">${isAdmin ? 'Администратор' : 'Обычный пользователь'}</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="toggle-admin-role-btn" style="background: #22c55e; color: #ffffff; border: none; padding: 14px; border-radius: 25px; font-size: 16px; font-weight: 700; cursor: pointer; width: 100%;">
          ${isAdmin ? 'Снять права админа' : 'Назначить админом'}
        </button>

        <button id="reset-user-counter-btn" style="background: #f59e0b; color: #ffffff; border: none; padding: 14px; border-radius: 25px; font-size: 16px; font-weight: 700; cursor: pointer; width: 100%;">
          Обнулить счётчик заданий
        </button>

        <button id="delete-user-data-btn" style="background: #ffffff; color: #ef4444; border: 2px solid #fca5a5; padding: 12px; border-radius: 25px; font-size: 16px; font-weight: 700; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
          🗑 Удалить данные
        </button>
      </div>
    `;

    document.getElementById('json-debug-view').textContent = JSON.stringify({ id: uid, ...userData }, null, 2);

    document.getElementById('toggle-admin-role-btn').onclick = async () => {
      try {
        await updateDoc(userDocRef, { isAdmin: !isAdmin });
        alert(isAdmin ? "Права администратора сняты." : "Пользователь назначен администратором!");
        openUserProfileView(uid);
      } catch (err) {
        alert("Ошибка изменения роли: " + err.message);
      }
    };

    document.getElementById('reset-user-counter-btn').onclick = async () => {
      if (confirm("Вы действительно хотите обнулить счётчик пройденных заданий и сбросить уровень?")) {
        try {
          await updateDoc(userDocRef, { totalCorrect: 0, totalIncorrect: 0, userLevel: 0, secondsElapsed: 0 });
          alert("Прогресс сброшен!");
          openUserProfileView(uid);
        } catch (err) {
          alert("Ошибка обнуления: " + err.message);
        }
      }
    };

    document.getElementById('delete-user-data-btn').onclick = async () => {
      if (confirm("Вы уверены, что хотите полностью удалить этого пользователя из базы?")) {
        try {
          await deleteDoc(userDocRef);
          alert("Пользователь успешно удален.");
          renderAdminMainView();
        } catch (err) {
          alert("Ошибка удаления: " + err.message);
        }
      }
    };

  } catch (error) {
    console.error("Ошибка загрузки профиля:", error);
  }
}

async function renderAnalyticsTab() {
  const contentContainer = document.getElementById('admin-tab-content');
  if (!contentContainer) return;

  contentContainer.innerHTML = `
    <div style="background: #fef9c3; border: 1px solid #fde047; padding: 14px; border-radius: 12px; font-size: 13px; color: #854d0e; margin-bottom: 20px; line-height: 1.4;">
      <b>Внимание:</b> Расчет DAU происходит на клиенте и может быть медленным при большом количестве пользователей.
    </div>

    <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 15px; font-size: 12px; font-weight: 600;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 16px; height: 10px; border: 2px solid #38bdf8; background: #e0f2fe;"></span> Новые регистрации
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 16px; height: 10px; border: 2px solid #22c55e; background: #dcfce7;"></span> Активные пользователи (DAU)
      </div>
    </div>

    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center;">
      <canvas id="analytics-chart" style="width: 100%; height: 220px; max-height: 220px;"></canvas>
    </div>
  `;

  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const dauMap = {};

    usersSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.lastLogin?.toDate) {
        const dStr = data.lastLogin.toDate().toISOString().split('T')[0];
        dauMap[dStr] = (dauMap[dStr] || 0) + 1;
      }
    });

    const labels = [];
    const regData = [];
    const dauData = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      labels.push(`${mStr}-${dayStr}`);

      const isoStr = d.toISOString().split('T')[0];
      dauData.push(dauMap[isoStr] || 0);
      regData.push(i === 0 ? 1 : 0);
    }

    const canvas = document.getElementById('analytics-chart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width = canvas.parentElement.clientWidth - 30;
      const h = canvas.height = 200;

      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let y = 20; y < h - 30; y += 35) {
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(w - 10, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.fillText('1,0', 10, 24);
      ctx.fillText('0,5', 10, 59);
      ctx.fillText('0', 17, 94);

      const stepX = (w - 50) / (labels.length - 1);

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      labels.forEach((lbl, idx) => {
        const x = 45 + idx * stepX;
        const val = dauData[idx];
        const y = 94 - val * 35;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      labels.forEach((lbl, idx) => {
        const x = 45 + idx * stepX;
        const val = dauData[idx];
        const y = 94 - val * 35;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(x, h - 10);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = '#64748b';
        ctx.font = '9px sans-serif';
        ctx.fillText(lbl, -10, 0);
        ctx.restore();
      });
    }

  } catch (err) {
    console.error("Ошибка загрузки аналитики:", err);
  }
}