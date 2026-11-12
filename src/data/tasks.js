// src/data/tasks.js
export const dictionaryWords = [
  { en: "I", ru: "Я" },
  { en: "You", ru: "Ты" },
  { en: "We", ru: "Мы" },
  { en: "He", ru: "Он" },
  { en: "She", ru: "Она" },
  { en: "It", ru: "Оно" },
  { en: "They", ru: "Они" },
  { en: "Work", ru: "Работать" },
  { en: "Worked", ru: "Работал (прошед. время)" },
  { en: "Will work", ru: "Буду работать (будущ. время)" },
  { en: "Don't / Doesn't work", ru: "Не работаю(ет) (отрицание)" },
  { en: "Didn't work", ru: "Не работал (прошед. отрицание)" },
  { en: "Do / Does... work?", ru: "Работаешь/работает ли? (вопрос)" },
  { en: "Did... work?", ru: "Работал ли? (прошед. вопрос)" }
];

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

const statementsRuEn = [
  { ru: "Я работаю", en: "I work", category: "statement" },
  { ru: "Ты работаешь", en: "You work", category: "statement" },
  { ru: "Мы работаем", en: "We work", category: "statement" },
  { ru: "Они работают", en: "They work", category: "statement" },
  { ru: "Он работает", en: "He works", category: "statement" },
  { ru: "Она работает", en: "She works", category: "statement" },
  { ru: "Оно работает", en: "It works", category: "statement" },
  { ru: "Я работал", en: "I worked", category: "statement" },
  { ru: "Ты работал", en: "You worked", category: "statement" },
  { ru: "Мы работали", en: "We worked", category: "statement" },
  { ru: "Он работал", en: "He worked", category: "statement" },
  { ru: "Она работала", en: "She worked", category: "statement" },
  { ru: "Я буду работать", en: "I will work", category: "statement" }
];

const negativesRuEn = [
  { ru: "Я не работаю", en: "I don't work", category: "negative" },
  { ru: "Ты не работаешь", en: "You don't work", category: "negative" },
  { ru: "Мы не работаем", en: "We don't work", category: "negative" },
  { ru: "Они не работают", en: "They don't work", category: "negative" },
  { ru: "Он не работает", en: "He doesn't work", category: "negative" },
  { ru: "Она не работает", en: "She doesn't work", category: "negative" },
  { ru: "Оно не работает", en: "It doesn't work", category: "negative" },
  { ru: "Я не работал", en: "I didn't work", category: "negative" },
  { ru: "Он не работал", en: "He didn't work", category: "negative" }
];

const questionsRuEn = [
  { ru: "Я работаю?", en: "Do I work?", category: "question" },
  { ru: "Ты работаешь?", en: "Do you work?", category: "question" },
  { ru: "Мы работаем?", en: "Do we work?", category: "question" },
  { ru: "Они работают?", en: "Do they work?", category: "question" },
  { ru: "Он работает?", en: "Does he work?", category: "question" },
  { ru: "Она работает?", en: "Does she work?", category: "question" },
  { ru: "Оно работает?", en: "Does it work?", category: "question" },
  { ru: "Я работал?", en: "Did I work?", category: "question" },
  { ru: "Ты работал?", en: "Did you work?", category: "question" },
  { ru: "Он работал?", en: "Did he work?", category: "question" },
  { ru: "Я буду работать?", en: "Will I work?", category: "question" }
];

const statementsEnRu = [
  { en: "I work", options: ["Я работаю", "Ты работаешь", "Мы работаем", "Он работает"], correct: "Я работаю", category: "statement" },
  { en: "You work", options: ["Ты работаешь", "Они работают", "Оно работает", "Я работаю"], correct: "Ты работаешь", category: "statement" },
  { en: "We work", options: ["Мы работаем", "Вы работаете", "Они работают", "Я работаю"], correct: "Мы работаем", category: "statement" },
  { en: "They work", options: ["Они работают", "Мы работаем", "Он работает", "Она работает"], correct: "Они работают", category: "statement" },
  { en: "He works", options: ["Он работает", "Она работает", "Оно работает", "Я работает"], correct: "Он работает", category: "statement" },
  { en: "She works", options: ["Она работает", "Он работает", "Мы работаем", "Они работают"], correct: "Она работает", category: "statement" },
  { en: "I worked", options: ["Я работал", "Ты работал", "Мы работали", "Он работал"], correct: "Я работал", category: "statement" },
  { en: "I will work", options: ["Я буду работать", "Я работал", "Я работаю", "Он будет работать"], correct: "Я буду работать", category: "statement" }
];

const negativesEnRu = [
  { en: "I don't work", options: ["Я не работаю", "Ты не работаешь", "Я работал", "Мы не работаем"], correct: "Я не работаю", category: "negative" },
  { en: "He doesn't work", options: ["Он не работает", "Она не работает", "Он работает", "Я не работает"], correct: "Он не работает", category: "negative" },
  { en: "I didn't work", options: ["Я не работал", "Я не работаю", "Он не работал", "Я работал"], correct: "Я не работал", category: "negative" }
];

const questionsEnRu = [
  { en: "Do I work?", options: ["Я работаю?", "Ты работаешь?", "Я работал?", "Мы работаем?"], correct: "Я работаю?", category: "question" },
  { en: "Does he work?", options: ["Он работает?", "Она работает?", "Он работает", "Он не работает?"], correct: "Он работает?", category: "question" },
  { en: "Did you work?", options: ["Ты работал?", "Ты работаешь?", "Вы работаете?", "Я работал?"], correct: "Ты работал?", category: "question" },
  { en: "Will I work?", options: ["Я буду работать?", "Я работал?", "Я работаю?", "Он будет работать?"], correct: "Я буду работать?", category: "question" }
];

export const level1Tasks = {
  ruEn: statementsRuEn,
  enRu: statementsEnRu
};

export const level2Tasks = {
  ruEn: [...statementsRuEn, ...negativesRuEn, ...negativesRuEn], 
  enRu: [...statementsEnRu, ...negativesEnRu, ...negativesEnRu]
};

export const level3Tasks = {
  ruEn: [...statementsRuEn, ...negativesRuEn, ...questionsRuEn, ...questionsRuEn, ...questionsRuEn, ...questionsRuEn],
  enRu: [...statementsEnRu, ...negativesEnRu, ...questionsEnRu, ...questionsEnRu, ...questionsEnRu, ...questionsEnRu]
};

// Функция перемешивания массива (алгоритм Фишера — Йетса)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Очереди для равномерного распределения без повторений подряд
let shuffledRuEnPool = [];
let shuffledEnRuPool = [];

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

// Функция циклического выбора с равномерным распределением элементов
export function getCyclicTask(sessionIndex, levelTasks) {
  const positionInCycle = sessionIndex % 10;
  const isEnRu = positionInCycle >= 7; 

  const sourcePool = isEnRu ? levelTasks.enRu : levelTasks.ruEn;
  const poolType = isEnRu ? 'enRu' : 'ruEn';

  const rawTask = getNextTaskFromPool(poolType, sourcePool);
  let task = { ...rawTask };

  // Если это задание с вариантами ответа (англ -> рус), рандомизируем порядок кнопок
  if (isEnRu && task.options) {
    task.options = shuffleArray(task.options);
  }

  return { task, isEnglishToRussian: isEnRu };
}