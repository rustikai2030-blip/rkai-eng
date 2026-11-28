// src/data/tasks.js
import { level1RuEn, level1EnRu } from './levels/level1.js';
import { level2RuEn, level2EnRu } from './levels/level2.js';
import { level3RuEn, level3EnRu } from './levels/level3.js';
import { level4RuEn, level4EnRu } from './levels/level4.js';
import { level5RuEn, level5EnRu } from './levels/level5.js';
import {
  getDictionaryForLevel,
  MAX_REGISTERED_LEVEL
} from '../levels/registry.js';

const fullDict = getDictionaryForLevel(MAX_REGISTERED_LEVEL);
export const dictionaryWords = [...fullDict.newWords, ...fullDict.previousWords];

export const grammarRules = `
  <h2>Правила (Simple)</h2>
  <h3>1. Утвердительная форма (Уровень 1)</h3>
  <p><b>Будущее:</b> I / You / We / They / He / She / It <b>will work</b>.</p>
  <p><b>Настоящее:</b> I / You / We / They <b>work</b> | He / She / It <b>works</b></p>
  <p><b>Прошедшее:</b> I / You / We / They / He / She / It <b>worked</b></p>

  <h3>2. Отрицательная форма (Уровень 2)</h3>
  <p><b>Настоящее:</b> I / You / We / They <b>don't work</b></p>
  <p><b>Настоящее (He/She/It):</b> He / She / It <b>doesn't work</b></p>
  <p><b>Прошедшее:</b> <b>didn't work</b></p>

  <h3>3. Вопросительная форма (Уровень 3)</h3>
  <p><b>Настоящее:</b> <b>Do / Does</b> ... <b>work?</b></p>
  <p><b>Прошедшее:</b> <b>Did</b> ... <b>work?</b></p>
`;

export const level1Tasks = {
  ruEn: level1RuEn,
  enRu: level1EnRu
};

export const level2Tasks = {
  ruEn: level2RuEn,
  enRu: level2EnRu
};

export const level3Tasks = {
  ruEn: level3RuEn,
  enRu: level3EnRu
};

export const level4Tasks = {
  ruEn: level4RuEn,
  enRu: level4EnRu
};

export const level5Tasks = {
  ruEn: level5RuEn,
  enRu: level5EnRu
};

// Алгоритм Фишера — Йетса
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let shuffledRuEnPool = [];
let shuffledEnRuPool = [];

// Сброс очередей при смене уровня или переключении фильтров
export function resetTaskPools() {
  shuffledRuEnPool = [];
  shuffledEnRuPool = [];
}

function getNextTaskFromPool(poolType, sourcePool) {
  if (poolType === 'ruEn') {
    if (shuffledRuEnPool.length === 0) {
      shuffledRuEnPool = shuffleArray(sourcePool);
    }
    return shuffledRuEnPool.pop();
  } else {
    if (shuffledEnRuPool.length === 0) {
      shuffledEnRuPool = shuffleArray(sourcePool);
    }
    return shuffledEnRuPool.pop();
  }
}

export function getCyclicTask(sessionIndex, levelTasks, activeCategories = null) {
  const positionInCycle = sessionIndex % 10;
  const isEnRu = positionInCycle >= 7;

  let sourcePool = isEnRu ? levelTasks.enRu : levelTasks.ruEn;

  // Фильтруем задания по активным кнопкам
  if (activeCategories && activeCategories.length > 0) {
    const filtered = sourcePool.filter(t => activeCategories.includes(t.category));
    if (filtered.length > 0) {
      sourcePool = filtered;
    }
  }

  const poolType = isEnRu ? 'enRu' : 'ruEn';
  const rawTask = getNextTaskFromPool(poolType, sourcePool);
  let task = { ...rawTask };

  if (isEnRu && task.options) {
    task.options = shuffleArray(task.options);
  }

  return { task, isEnglishToRussian: isEnRu };
}