// src/utils/statsTracker.js
import { collection, doc, getDocs, setDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.js";

const LOCAL_STATS_KEY = 'rkai_daily_stats';

/**
 * Возвращает ключ даты в локальном часовом поясе: YYYY-MM-DD
 */
export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Форматирует секунды в минуты или часы (без секунд)
 */
export function formatStatsDuration(totalSeconds) {
  const secs = Math.max(0, Math.round(totalSeconds || 0));
  if (secs === 0) return '0 мин';

  const totalMinutes = Math.round(secs / 60);
  if (totalMinutes < 1) return '< 1 мин';

  if (totalMinutes < 60) {
    return `${totalMinutes} мин`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
}

/**
 * Загружает статистику из localStorage
 */
export function getLocalDailyStats() {
  try {
    const raw = localStorage.getItem(LOCAL_STATS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.warn("Ошибка чтения локальной статистики:", e);
    return {};
  }
}

function saveLocalDailyStats(statsMap) {
  try {
    localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(statsMap));
  } catch (e) {
    console.warn("Ошибка сохранения локальной статистики:", e);
  }
}

/**
 * Записывает прогресс за текущий день (задания и/или секунды) локально и в Firestore
 */
export async function recordDailyProgress({ user, tasksDelta = 0, secondsDelta = 0 }) {
  if (tasksDelta <= 0 && secondsDelta <= 0) return;

  const dateKey = getLocalDateKey();
  const localStats = getLocalDailyStats();
  const currentDay = localStats[dateKey] || { tasks: 0, seconds: 0 };

  localStats[dateKey] = {
    tasks: (currentDay.tasks || 0) + Math.max(0, tasksDelta),
    seconds: (currentDay.seconds || 0) + Math.max(0, secondsDelta)
  };
  saveLocalDailyStats(localStats);

  if (!user) return;

  try {
    const dayDocRef = doc(db, "users", user.uid, "dailyStats", dateKey);
    const payload = {
      date: dateKey,
      updatedAt: serverTimestamp()
    };
    if (tasksDelta > 0) payload.tasks = increment(tasksDelta);
    if (secondsDelta > 0) payload.seconds = increment(secondsDelta);

    await setDoc(dayDocRef, payload, { merge: true });
  } catch (err) {
    console.warn("Не удалось синхронизировать дневную статистику с Firestore:", err.message);
  }
}

/**
 * Загружает полную статистику пользователя (объединяет облачные данные и локальный кэш)
 */
export async function loadFullUserStats(user) {
  const mergedStats = { ...getLocalDailyStats() };

  if (!user) {
    return mergedStats;
  }

  try {
    const statsColRef = collection(db, "users", user.uid, "dailyStats");
    const snapshot = await getDocs(statsColRef);

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const key = docSnap.id;
      const localEntry = mergedStats[key] || { tasks: 0, seconds: 0 };

      mergedStats[key] = {
        tasks: Math.max(Number(data.tasks) || 0, Number(localEntry.tasks) || 0),
        seconds: Math.max(Number(data.seconds) || 0, Number(localEntry.seconds) || 0)
      };
    });

    saveLocalDailyStats(mergedStats);
  } catch (err) {
    console.warn("Ошибка загрузки статистики из Firestore, используются локальные данные:", err.message);
  }

  return mergedStats;
}