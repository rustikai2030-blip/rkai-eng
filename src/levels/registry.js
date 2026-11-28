// src/levels/registry.js
import { level1KeyboardRows, level1Words, level1RuEn, level1EnRu } from '../data/levels/level1.js';
import { level2KeyboardRows, level2Words, level2RuEn, level2EnRu } from '../data/levels/level2.js';
import { level3KeyboardRows, level3Words, level3RuEn, level3EnRu } from '../data/levels/level3.js';
import { level4KeyboardRows, level4Words, level4RuEn, level4EnRu } from '../data/levels/level4.js';
import { level5KeyboardRows, level5Words, level5RuEn, level5EnRu } from '../data/levels/level5.js';

export const LEVELS_REGISTRY = {
  1: {
    level: 1,
    title: 'Уровень 1',
    keyboardRows: level1KeyboardRows,
    words: level1Words,
    tasks: { ruEn: level1RuEn, enRu: level1EnRu }
  },
  2: {
    level: 2,
    title: 'Уровень 2',
    keyboardRows: level2KeyboardRows,
    words: level2Words,
    tasks: { ruEn: level2RuEn, enRu: level2EnRu }
  },
  3: {
    level: 3,
    title: 'Уровень 3',
    keyboardRows: level3KeyboardRows,
    words: level3Words,
    tasks: { ruEn: level3RuEn, enRu: level3EnRu }
  },
  4: {
    level: 4,
    title: 'Уровень 4',
    keyboardRows: level4KeyboardRows,
    words: level4Words,
    tasks: { ruEn: level4RuEn, enRu: level4EnRu }
  },
  5: {
    level: 5,
    title: 'Уровень 5',
    keyboardRows: level5KeyboardRows,
    words: level5Words,
    tasks: { ruEn: level5RuEn, enRu: level5EnRu }
  }
};

export const MAX_REGISTERED_LEVEL = Math.max(...Object.keys(LEVELS_REGISTRY).map(Number));

export function getLevelConfig(level = 1) {
  const numericLevel = Math.max(1, Number(level) || 1);
  const clampedLevel = Math.min(numericLevel, MAX_REGISTERED_LEVEL);
  return LEVELS_REGISTRY[clampedLevel];
}

export function getTasksForLevel(level = 1) {
  return getLevelConfig(level).tasks;
}

export function getKeyboardRowsForLevel(level = 1) {
  return getLevelConfig(level).keyboardRows;
}

function getWordKey(wordItem) {
  const en = String(wordItem?.en || '').trim().toLowerCase();
  const ru = String(wordItem?.ru || '').trim().toLowerCase();
  return `${en}::${ru}`;
}

/**
 * Возвращает словарь для указанного уровня:
 * - newWords: собственный словарь текущего уровня
 * - previousWords: уникальные слова из предыдущих уровней, отсутствующие в текущем словаре
 */
export function getDictionaryForLevel(level = 1) {
  const numericLevel = Math.max(1, Number(level) || 1);
  const clampedLevel = Math.min(numericLevel, MAX_REGISTERED_LEVEL);

  const rawNewWords = LEVELS_REGISTRY[clampedLevel]?.words || [];
  const seenKeys = new Set();
  const newWords = [];

  for (const item of rawNewWords) {
    const key = getWordKey(item);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      newWords.push(item);
    }
  }

  const previousWords = [];
  for (let lvl = clampedLevel - 1; lvl >= 1; lvl--) {
    const prevList = LEVELS_REGISTRY[lvl]?.words || [];
    for (const item of prevList) {
      const key = getWordKey(item);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        previousWords.push(item);
      }
    }
  }

  return {
    level: clampedLevel,
    newWords,
    previousWords
  };
}