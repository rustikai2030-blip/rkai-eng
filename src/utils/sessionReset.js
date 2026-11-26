// src/utils/sessionReset.js
import { saveLocalCounters } from './statsTracker.js';
import { resetTaskPools } from '../data/tasks.js';

/**
 * Формирует чистое начальное состояние уровней, счётчиков и сессии
 * при выходе из аккаунта (переходе в гостевой режим).
 */
export function buildGuestResetState({ defaultTestSeconds = 120, resetGuestStorage = true } = {}) {
  if (resetGuestStorage) {
    saveLocalCounters(null, { correct: 0, incorrect: 0 });
  }

  resetTaskPools();

  return {
    currentUser: null,
    isAdminUser: false,
    currentLevel: 1,
    sessionCorrectAnswers: 0,
    sessionIncorrectAnswers: 0,
    totalCorrectAnswers: 0,
    totalIncorrectAnswers: 0,
    sessionIndex: 0,
    consecutiveErrors: 0,
    currentInput: '',
    lastFeedback: '',
    lastFeedbackColor: '',
    secondsElapsed: 0,
    lastSyncedSeconds: 0,
    isTestMode: false,
    testQuestionsAnswered: 0,
    testCorrectCount: 0,
    testSecondsLeft: Math.max(10, Number(defaultTestSeconds) || 120),
    activeCategories: ['statement']
  };
}