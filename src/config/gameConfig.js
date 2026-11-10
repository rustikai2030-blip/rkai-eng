// src/config/gameConfig.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export const gameConfig = {
  stepPerLevel: 5, // Шаг правильных ответов для перехода на следующий уровень (регулируется в админке)
};

// Безопасная загрузка настроек из Firestore
async function loadGameSettings() {
  try {
    const settingsRef = doc(db, "settings", "game");
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists() && docSnap.data().stepPerLevel !== undefined) {
      gameConfig.stepPerLevel = Number(docSnap.data().stepPerLevel);
    }
  } catch (err) {
    console.warn("Не удалось загрузить настройки из Firestore, используются стандартные:", err.message);
  }
}

loadGameSettings();

// Функция расчета уровня (всего 10 уровней: от 0 до 9)
export function calculateLevel(totalCorrect) {
  const step = gameConfig.stepPerLevel || 5;
  const level = Math.floor(totalCorrect / step);
  return Math.min(level, 19); // Ограничиваем максимальным 9-м уровнем
}