// src/utils/statsTracker.js
import { collection, doc, getDocs, setDoc, deleteDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.js";

const LOCAL_STATS_PREFIX = 'rkai_daily_stats_';
const LOCAL_COUNTERS_PREFIX = 'rkai_counters_';

export function getScopeKey(user) {
  return user && user.uid ? `user_${user.uid}` : 'guest';
}

function getLocalCountersKey(user) {
  return `${LOCAL_COUNTERS_PREFIX}${getScopeKey(user)}`;
}

function getLocalStatsKey(user) {
  return `${LOCAL_STATS_PREFIX}${getScopeKey(user)}`;
}

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
 * Загружает дневную статистику из localStorage для конкретного scope (user / guest)
 */
export function getLocalDailyStats(user = null) {
  try {
    const raw = localStorage.getItem(getLocalStatsKey(user));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.warn("Ошибка чтения локальной статистики:", e);
    return {};
  }
}

function saveLocalDailyStats(user, statsMap) {
  try {
    localStorage.setItem(getLocalStatsKey(user), JSON.stringify(statsMap));
  } catch (e) {
    console.warn("Ошибка сохранения локальной статистики:", e);
  }
}

/**
 * Единое хранилище счётчиков правильных и неправильных ответов (гость / пользователь)
 */
export function getLocalCounters(user) {
  try {
    const raw = localStorage.getItem(getLocalCountersKey(user));
    if (!raw) return { correct: 0, incorrect: 0 };
    const parsed = JSON.parse(raw);
    return {
      correct: Math.max(0, Number(parsed?.correct) || 0),
      incorrect: Math.max(0, Number(parsed?.incorrect) || 0)
    };
  } catch (e) {
    console.warn("Ошибка чтения счётчиков:", e);
    return { correct: 0, incorrect: 0 };
  }
}

export function saveLocalCounters(user, { correct = 0, incorrect = 0 }) {
  try {
    const normalized = {
      correct: Math.max(0, Number(correct) || 0),
      incorrect: Math.max(0, Number(incorrect) || 0)
    };
    localStorage.setItem(getLocalCountersKey(user), JSON.stringify(normalized));
    return normalized;
  } catch (e) {
    console.warn("Ошибка сохранения счётчиков:", e);
    return { correct: 0, incorrect: 0 };
  }
}

/**
 * Единая запись результата ответа:
 * обновляет счётчики правильных/неправильных ответов и дневную статистику выполненных заданий
 */
export async function recordAnswerAttempt({ user, isCorrect, countTowardCompletedTasks = true }) {
  const prev = getLocalCounters(user);
  const nextCounters = isCorrect
    ? { correct: prev.correct + 1, incorrect: prev.incorrect }
    : { correct: prev.correct, incorrect: prev.incorrect + 1 };

  saveLocalCounters(user, nextCounters);

  if (isCorrect && countTowardCompletedTasks) {
    await recordDailyProgress({ user, tasksDelta: 1, secondsDelta: 0 });
  }

  return nextCounters;
}

/**
 * Записывает прогресс за текущий день (выполненные задания и/или секунды) локально и в Firestore
 */
export async function recordDailyProgress({ user, tasksDelta = 0, secondsDelta = 0 }) {
  if (tasksDelta <= 0 && secondsDelta <= 0) return;

  const dateKey = getLocalDateKey();
  const localStats = getLocalDailyStats(user);
  const currentDay = localStats[dateKey] || { tasks: 0, seconds: 0 };

  localStats[dateKey] = {
    tasks: (currentDay.tasks || 0) + Math.max(0, tasksDelta),
    seconds: (currentDay.seconds || 0) + Math.max(0, secondsDelta)
  };
  saveLocalDailyStats(user, localStats);

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
 * Загружает статистику пользователя из Firestore (если авторизован) или из localStorage
 */
export async function loadFullUserStats(user) {
  if (!user) {
    return { ...getLocalDailyStats(null) };
  }

  try {
    const statsColRef = collection(db, "users", user.uid, "dailyStats");
    const snapshot = await getDocs(statsColRef);

    const cloudMap = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      cloudMap[docSnap.id] = {
        tasks: Math.max(0, Number(data.tasks) || 0),
        seconds: Math.max(0, Number(data.seconds) || 0)
      };
    });

    saveLocalDailyStats(user, cloudMap);
    return cloudMap;
  } catch (err) {
    console.warn("Ошибка загрузки статистики из Firestore, используются локальные данные:", err.message);
    return { ...getLocalDailyStats(user) };
  }
}

/**
 * Полный сброс счётчиков и дневной статистики для указанного пользователя (например, из админки)
 */
export async function resetUserStatsAndCounters(uid) {
  try {
    localStorage.removeItem(`${LOCAL_COUNTERS_PREFIX}user_${uid}`);
    localStorage.removeItem(`${LOCAL_STATS_PREFIX}user_${uid}`);
    localStorage.removeItem('rkai_daily_stats');
  } catch (e) {
    console.warn("Ошибка очистки локальных данных при сбросе:", e);
  }

  if (!uid) return;

  try {
    const statsColRef = collection(db, "users", uid, "dailyStats");
    const snapshot = await getDocs(statsColRef);
    const deletions = [];
    snapshot.forEach((docSnap) => {
      deletions.push(deleteDoc(docSnap.ref));
    });
    await Promise.all(deletions);
  } catch (err) {
    console.warn("Не удалось очистить dailyStats в Firestore:", err.message);
  }
}