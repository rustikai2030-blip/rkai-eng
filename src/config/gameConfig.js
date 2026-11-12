// src/config/gameConfig.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export const gameConfig = {
  stepPerStyleLevel: 5,   
  stepPerElementLevel: 5, 
  testQuestionCount: 30,  // Количество вопросов на тесте по умолчанию
  testTimeSeconds: 120,   // Время на тест в секундах (120 сек = 2 минуты) по умолчанию
};

async function loadGameSettings() {
  try {
    const settingsRef = doc(db, "settings", "game");
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.stepPerStyleLevel !== undefined) {
        gameConfig.stepPerStyleLevel = Number(data.stepPerStyleLevel);
      }
      if (data.stepPerElementLevel !== undefined) {
        gameConfig.stepPerElementLevel = Number(data.stepPerElementLevel);
      }
      if (data.testQuestionCount !== undefined) {
        gameConfig.testQuestionCount = Number(data.testQuestionCount);
      }
      if (data.testTimeSeconds !== undefined) {
        gameConfig.testTimeSeconds = Number(data.testTimeSeconds);
      }
    }
  } catch (err) {
    console.warn("Не удалось загрузить настройки из Firestore:", err.message);
  }
}

loadGameSettings();

export function calculateStyleLevel(totalCorrect) {
  const step = gameConfig.stepPerStyleLevel || 5;
  const level = Math.floor(totalCorrect / step);
  return Math.min(level, 19); 
}

export function calculateElementLevel(totalCorrect) {
  const step = gameConfig.stepPerElementLevel || 5;
  const level = Math.floor(totalCorrect / step);
  return Math.min(level, 10);
}