// src/components/settingsModal.js
import { loadFullUserStats, formatStatsDuration, getLocalDateKey } from '../utils/statsTracker.js';

const SETTINGS_MODAL_ID = 'settings-modal';
const SETTINGS_STYLE_ID = 'settings-modal-styles';

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

let currentStatsPeriod = 'days'; // 'days' | 'months' | 'years'
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth(); // 0..11
let cachedStatsMap = {};
let isSettingsPopstateBound = false;

function ensureSettingsStyles() {
  if (document.getElementById(SETTINGS_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = SETTINGS_STYLE_ID;
  style.textContent = `
    #${SETTINGS_MODAL_ID} {
      display: none;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100dvh;
      background: #16171d;
      color: #f3f4f6;
      z-index: 2200;
      overflow-y: auto;
      padding: max(16px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom)) 16px;
      box-sizing: border-box;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: left;
    }

    #${SETTINGS_MODAL_ID}.open {
      display: block;
    }

    .st-wrapper {
      max-width: 520px;
      margin: 0 auto;
    }

    .st-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 14px;
      margin-bottom: 16px;
      border-bottom: 1px solid #2e303a;
      gap: 10px;
    }

    .st-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
    }

    .st-btn-icon {
      padding: 8px 14px;
      background: #272935;
      color: #f3f4f6;
      border: 1px solid #3f4254;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }

    .st-menu-item {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 18px;
      background: #1f2028;
      border: 1px solid #2e303a;
      border-radius: 14px;
      color: #ffffff;
      font-size: 17px;
      font-weight: 600;
      cursor: pointer;
      transition: border-color 0.2s ease, background 0.2s ease;
    }

    .st-menu-item:active {
      background: #272935;
      border-color: #38bdf8;
    }

    .st-tabs {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      background: #1f2028;
      padding: 5px;
      border-radius: 12px;
      border: 1px solid #2e303a;
      margin-bottom: 14px;
    }

    .st-tab-btn {
      padding: 9px 6px;
      border: none;
      border-radius: 9px;
      background: transparent;
      color: #9ca3af;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .st-tab-btn.active {
      background: #38bdf8;
      color: #081018;
    }

    .st-nav-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1f2028;
      border: 1px solid #2e303a;
      border-radius: 12px;
      padding: 8px 12px;
      margin-bottom: 12px;
    }

    .st-nav-arrow {
      background: #272935;
      border: 1px solid #3f4254;
      color: #ffffff;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .st-nav-label {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
    }

    .st-summary-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }

    .st-summary-box {
      background: #1f2028;
      border: 1px solid #2e303a;
      border-radius: 12px;
      padding: 12px;
      text-align: center;
    }

    .st-summary-val {
      font-size: 22px;
      font-weight: 800;
      color: #38bdf8;
      line-height: 1.2;
    }

    .st-summary-lbl {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 4px;
    }

    .st-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      margin-bottom: 6px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: #9ca3af;
    }

    .st-days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 5px;
    }

    .st-day-cell {
      background: #1f2028;
      border: 1px solid #2e303a;
      border-radius: 10px;
      padding: 5px 2px;
      min-height: 62px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
    }

    .st-day-cell.empty {
      background: transparent;
      border-color: transparent;
    }

    .st-day-cell.has-activity {
      border-color: rgba(56, 189, 248, 0.55);
      background: rgba(56, 189, 248, 0.08);
    }

    .st-day-cell.today {
      border: 2px solid #22c55e;
    }

    .st-day-num {
      font-size: 10px;
      color: #9ca3af;
      align-self: flex-end;
      padding-right: 4px;
      line-height: 1;
    }

    .st-day-tasks {
      font-size: 17px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.1;
    }

    .st-day-cell.no-activity .st-day-tasks {
      color: #4b5563;
      font-weight: 600;
    }

    .st-day-time {
      font-size: 10px;
      color: #38bdf8;
      line-height: 1.1;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .st-day-cell.no-activity .st-day-time {
      color: #4b5563;
    }

    .st-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .st-list-card {
      background: #1f2028;
      border: 1px solid #2e303a;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }

    .st-list-card.has-activity {
      border-color: rgba(56, 189, 248, 0.45);
    }

    .st-list-title {
      font-size: 16px;
      font-weight: 700;
      color: #f3f4f6;
    }

    .st-list-metrics {
      text-align: right;
    }

    .st-list-tasks {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.15;
    }

    .st-list-time {
      font-size: 12px;
      color: #38bdf8;
      margin-top: 2px;
    }
  `;
  document.head.appendChild(style);
}

function getSettingsModalElement() {
  ensureSettingsStyles();
  let modal = document.getElementById(SETTINGS_MODAL_ID);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = SETTINGS_MODAL_ID;
    document.body.appendChild(modal);
  }
  return modal;
}

export function isSettingsModalOpen() {
  const modal = document.getElementById(SETTINGS_MODAL_ID);
  return Boolean(modal && modal.classList.contains('open'));
}

export function closeSettingsModal(isBackAction = false) {
  const modal = document.getElementById(SETTINGS_MODAL_ID);
  if (modal && modal.classList.contains('open')) {
    modal.classList.remove('open');
    if (!isBackAction && history.state && history.state.settingsModalOpen) {
      history.back();
    }
  }
}

export function openSettingsModal({ user, onBeforeOpen } = {}) {
  if (typeof onBeforeOpen === 'function') {
    onBeforeOpen();
  }

  const modal = getSettingsModalElement();
  modal.classList.add('open');
  modal.scrollTop = 0;

  if (!isSettingsPopstateBound) {
    isSettingsPopstateBound = true;
    window.addEventListener('popstate', () => {
      if (isSettingsModalOpen()) {
        closeSettingsModal(true);
      }
    });
  }

  history.pushState({ settingsModalOpen: true }, '');
  renderSettingsMenu(user);
}

function renderSettingsMenu(user) {
  const modal = getSettingsModalElement();
  modal.innerHTML = `
    <div class="st-wrapper">
      <div class="st-header">
        <h2 class="st-title">⚙️ Настройки</h2>
        <button type="button" id="st-close-btn" class="st-btn-icon">✕ Закрыть</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button type="button" id="st-open-stats-btn" class="st-menu-item">
          <span style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">📊</span>
            <span>Статистика</span>
          </span>
          <span style="color: #9ca3af; font-size: 18px;">→</span>
        </button>
      </div>
    </div>
  `;

  modal.querySelector('#st-close-btn').onclick = () => closeSettingsModal(false);
  modal.querySelector('#st-open-stats-btn').onclick = async () => {
    const now = new Date();
    selectedYear = now.getFullYear();
    selectedMonth = now.getMonth();
    currentStatsPeriod = 'days';

    modal.innerHTML = `
      <div class="st-wrapper">
        <div class="st-header">
          <button type="button" id="st-back-menu-btn" class="st-btn-icon">← Назад</button>
          <h2 class="st-title">Статистика</h2>
          <button type="button" id="st-close-btn" class="st-btn-icon">✕</button>
        </div>
        <p style="text-align: center; color: #9ca3af; margin-top: 30px;">Загрузка статистики...</p>
      </div>
    `;
    modal.querySelector('#st-back-menu-btn').onclick = () => renderSettingsMenu(user);
    modal.querySelector('#st-close-btn').onclick = () => closeSettingsModal(false);

    cachedStatsMap = await loadFullUserStats(user);
    renderStatsView(user);
  };
}

function renderStatsView(user) {
  const modal = getSettingsModalElement();

  let bodyHtml = '';
  if (currentStatsPeriod === 'days') {
    bodyHtml = buildDaysViewHtml();
  } else if (currentStatsPeriod === 'months') {
    bodyHtml = buildMonthsViewHtml();
  } else {
    bodyHtml = buildYearsViewHtml();
  }

  modal.innerHTML = `
    <div class="st-wrapper">
      <div class="st-header">
        <button type="button" id="st-back-menu-btn" class="st-btn-icon">← Настройки</button>
        <h2 class="st-title">Статистика</h2>
        <button type="button" id="st-close-btn" class="st-btn-icon">✕</button>
      </div>

      <div class="st-tabs">
        <button type="button" class="st-tab-btn ${currentStatsPeriod === 'days' ? 'active' : ''}" data-period="days">Дни</button>
        <button type="button" class="st-tab-btn ${currentStatsPeriod === 'months' ? 'active' : ''}" data-period="months">Месяцы</button>
        <button type="button" class="st-tab-btn ${currentStatsPeriod === 'years' ? 'active' : ''}" data-period="years">Годы</button>
      </div>

      ${bodyHtml}
    </div>
  `;

  modal.querySelector('#st-back-menu-btn').onclick = () => renderSettingsMenu(user);
  modal.querySelector('#st-close-btn').onclick = () => closeSettingsModal(false);

  modal.querySelectorAll('.st-tab-btn').forEach((btn) => {
    btn.onclick = () => {
      currentStatsPeriod = btn.getAttribute('data-period');
      renderStatsView(user);
    };
  });

  // Навигация по месяцам/годам
  const prevBtn = modal.querySelector('#st-prev-period');
  const nextBtn = modal.querySelector('#st-next-period');

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentStatsPeriod === 'days') {
        if (selectedMonth === 0) {
          selectedMonth = 11;
          selectedYear--;
        } else {
          selectedMonth--;
        }
      } else if (currentStatsPeriod === 'months') {
        selectedYear--;
      }
      renderStatsView(user);
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (currentStatsPeriod === 'days') {
        if (selectedMonth === 11) {
          selectedMonth = 0;
          selectedYear++;
        } else {
          selectedMonth++;
        }
      } else if (currentStatsPeriod === 'months') {
        selectedYear++;
      }
      renderStatsView(user);
    };
  }

  // Переход из карточки месяца в календарь дней этого месяца
  modal.querySelectorAll('.st-month-row').forEach((row) => {
    row.onclick = () => {
      selectedMonth = Number(row.getAttribute('data-month'));
      currentStatsPeriod = 'days';
      renderStatsView(user);
    };
  });

  // Переход из карточки года в список месяцев этого года
  modal.querySelectorAll('.st-year-row').forEach((row) => {
    row.onclick = () => {
      selectedYear = Number(row.getAttribute('data-year'));
      currentStatsPeriod = 'months';
      renderStatsView(user);
    };
  });
}

function buildDaysViewHtml() {
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayJs = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 (Вс) .. 6 (Сб)
  const startOffset = (firstDayJs + 6) % 7; // Сдвиг под понедельник (0 = Пн .. 6 = Вс)
  const todayKey = getLocalDateKey();

  let monthTasks = 0;
  let monthSeconds = 0;

  const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-`;
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${monthPrefix}${String(d).padStart(2, '0')}`;
    const item = cachedStatsMap[key];
    if (item) {
      monthTasks += item.tasks || 0;
      monthSeconds += item.seconds || 0;
    }
  }

  let cellsHtml = '';
  for (let i = 0; i < startOffset; i++) {
    cellsHtml += `<div class="st-day-cell empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${monthPrefix}${String(d).padStart(2, '0')}`;
    const item = cachedStatsMap[key] || { tasks: 0, seconds: 0 };
    const hasActivity = item.tasks > 0 || item.seconds > 0;
    const isToday = key === todayKey;

    cellsHtml += `
      <div class="st-day-cell ${hasActivity ? 'has-activity' : 'no-activity'} ${isToday ? 'today' : ''}">
        <span class="st-day-num">${d}</span>
        <span class="st-day-tasks">${item.tasks}</span>
        <span class="st-day-time">${formatStatsDuration(item.seconds)}</span>
      </div>
    `;
  }

  return `
    <div class="st-nav-bar">
      <button type="button" id="st-prev-period" class="st-nav-arrow">‹</button>
      <span class="st-nav-label">${MONTH_NAMES[selectedMonth]} ${selectedYear}</span>
      <button type="button" id="st-next-period" class="st-nav-arrow">›</button>
    </div>

    <div class="st-summary-card">
      <div class="st-summary-box">
        <div class="st-summary-val">${monthTasks}</div>
        <div class="st-summary-lbl">Заданий за месяц</div>
      </div>
      <div class="st-summary-box">
        <div class="st-summary-val">${formatStatsDuration(monthSeconds)}</div>
        <div class="st-summary-lbl">Время за месяц</div>
      </div>
    </div>

    <div class="st-weekdays">
      ${WEEKDAYS_SHORT.map(w => `<div>${w}</div>`).join('')}
    </div>
    <div class="st-days-grid">
      ${cellsHtml}
    </div>
  `;
}

function buildMonthsViewHtml() {
  let yearTasks = 0;
  let yearSeconds = 0;
  const monthRows = [];

  for (let m = 0; m < 12; m++) {
    const prefix = `${selectedYear}-${String(m + 1).padStart(2, '0')}-`;
    let mTasks = 0;
    let mSeconds = 0;

    Object.entries(cachedStatsMap).forEach(([dateKey, val]) => {
      if (dateKey.startsWith(prefix)) {
        mTasks += val.tasks || 0;
        mSeconds += val.seconds || 0;
      }
    });

    yearTasks += mTasks;
    yearSeconds += mSeconds;
    monthRows.push({ monthIndex: m, tasks: mTasks, seconds: mSeconds });
  }

  return `
    <div class="st-nav-bar">
      <button type="button" id="st-prev-period" class="st-nav-arrow">‹</button>
      <span class="st-nav-label">${selectedYear} год</span>
      <button type="button" id="st-next-period" class="st-nav-arrow">›</button>
    </div>

    <div class="st-summary-card">
      <div class="st-summary-box">
        <div class="st-summary-val">${yearTasks}</div>
        <div class="st-summary-lbl">Заданий за год</div>
      </div>
      <div class="st-summary-box">
        <div class="st-summary-val">${formatStatsDuration(yearSeconds)}</div>
        <div class="st-summary-lbl">Время за год</div>
      </div>
    </div>

    <div class="st-list">
      ${monthRows.map(row => {
        const hasActivity = row.tasks > 0 || row.seconds > 0;
        return `
          <div class="st-list-card st-month-row ${hasActivity ? 'has-activity' : ''}" data-month="${row.monthIndex}">
            <span class="st-list-title">${MONTH_NAMES[row.monthIndex]}</span>
            <div class="st-list-metrics">
              <div class="st-list-tasks">${row.tasks}</div>
              <div class="st-list-time">${formatStatsDuration(row.seconds)}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function buildYearsViewHtml() {
  const yearAgg = {};
  const currentYear = new Date().getFullYear();
  yearAgg[currentYear] = { tasks: 0, seconds: 0 };

  let totalTasks = 0;
  let totalSeconds = 0;

  Object.entries(cachedStatsMap).forEach(([dateKey, val]) => {
    const year = parseInt(dateKey.slice(0, 4), 10);
    if (!isNaN(year)) {
      if (!yearAgg[year]) yearAgg[year] = { tasks: 0, seconds: 0 };
      yearAgg[year].tasks += val.tasks || 0;
      yearAgg[year].seconds += val.seconds || 0;
      totalTasks += val.tasks || 0;
      totalSeconds += val.seconds || 0;
    }
  });

  const sortedYears = Object.keys(yearAgg)
    .map(Number)
    .sort((a, b) => b - a);

  return `
    <div class="st-summary-card">
      <div class="st-summary-box">
        <div class="st-summary-val">${totalTasks}</div>
        <div class="st-summary-lbl">Всего заданий</div>
      </div>
      <div class="st-summary-box">
        <div class="st-summary-val">${formatStatsDuration(totalSeconds)}</div>
        <div class="st-summary-lbl">Общее время</div>
      </div>
    </div>

    <div class="st-list">
      ${sortedYears.map(yr => {
        const info = yearAgg[yr];
        const hasActivity = info.tasks > 0 || info.seconds > 0;
        return `
          <div class="st-list-card st-year-row ${hasActivity ? 'has-activity' : ''}" data-year="${yr}">
            <span class="st-list-title">${yr} год</span>
            <div class="st-list-metrics">
              <div class="st-list-tasks">${info.tasks}</div>
              <div class="st-list-time">${formatStatsDuration(info.seconds)}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}