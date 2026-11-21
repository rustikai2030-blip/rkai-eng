// src/config/gameConfig.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export const DEFAULT_GAME_CONFIG = Object.freeze({
  stepPerStyleLevel: 5,
  stepPerElementLevel: 5,
  testQuestionCount: 30,
  testTimeSeconds: 120,
  maxElementLevel: 7
});

export const gameConfig = {
  ...DEFAULT_GAME_CONFIG
};

function sanitizePositiveInt(value, fallback, min = 1) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < min) {
    return fallback;
  }
  return Math.floor(num);
}

export function applyGameSettings(rawData = {}) {
  gameConfig.stepPerStyleLevel = sanitizePositiveInt(
    rawData.stepPerStyleLevel,
    DEFAULT_GAME_CONFIG.stepPerStyleLevel,
    1
  );
  gameConfig.stepPerElementLevel = sanitizePositiveInt(
    rawData.stepPerElementLevel,
    DEFAULT_GAME_CONFIG.stepPerElementLevel,
    1
  );
  gameConfig.testQuestionCount = sanitizePositiveInt(
    rawData.testQuestionCount,
    DEFAULT_GAME_CONFIG.testQuestionCount,
    1
  );
  gameConfig.testTimeSeconds = sanitizePositiveInt(
    rawData.testTimeSeconds,
    DEFAULT_GAME_CONFIG.testTimeSeconds,
    10
  );
  return gameConfig;
}

export async function loadGameSettings() {
  try {
    const settingsRef = doc(db, "settings", "game");
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      applyGameSettings(docSnap.data());
    }
  } catch (err) {
    console.warn("Не удалось загрузить настройки из Firestore:", err.message);
  }
  return gameConfig;
}

export async function saveGameSettings(nextValues) {
  const normalized = {
    stepPerStyleLevel: sanitizePositiveInt(
      nextValues.stepPerStyleLevel,
      gameConfig.stepPerStyleLevel,
      1
    ),
    stepPerElementLevel: sanitizePositiveInt(
      nextValues.stepPerElementLevel,
      gameConfig.stepPerElementLevel,
      1
    ),
    testQuestionCount: sanitizePositiveInt(
      nextValues.testQuestionCount,
      gameConfig.testQuestionCount,
      1
    ),
    testTimeSeconds: sanitizePositiveInt(
      nextValues.testTimeSeconds,
      gameConfig.testTimeSeconds,
      10
    )
  };

  const settingsRef = doc(db, "settings", "game");
  await setDoc(settingsRef, normalized, { merge: true });
  applyGameSettings(normalized);
  return gameConfig;
}

loadGameSettings();

export function calculateStyleLevel(totalCorrect) {
  const safeCorrect = Math.max(0, Number(totalCorrect) || 0);
  return Math.floor(safeCorrect / gameConfig.stepPerStyleLevel);
}

export function calculateElementLevel(totalCorrect) {
  const safeCorrect = Math.max(0, Number(totalCorrect) || 0);
  const level = Math.floor(safeCorrect / gameConfig.stepPerElementLevel);
  return Math.min(level, gameConfig.maxElementLevel);
}