// src/data/levels/level3.js
import { level2RuEn, level2EnRu } from './level2.js';

export const level3KeyboardRows = [
  ['w', 'e', 'r', 't'],
  ['y', 'u', 'i', 'o'],
  ['s', 'd', 'h', 'k'],
  ['shift', 'l', 'n', '?', 'backspace'],
  ["'", 'space', 'ok']
];

export const level3Words = [
  { en: "Do / Does... work?", ru: "Работаешь/работает ли? (вопрос)" },
  { en: "Did... work?", ru: "Работал ли? (прошед. вопрос)" }
];

export const level3QuestionsRuEn = [
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

export const level3QuestionsEnRu = [
  { en: "Do I work?", options: ["Я работаю?", "Ты работаешь?", "Я работал?", "Мы работаем?"], correct: "Я работаю?", category: "question" },
  { en: "Does he work?", options: ["Он работает?", "Она работает?", "Он работает", "Он не работает?"], correct: "Он работает?", category: "question" },
  { en: "Did you work?", options: ["Ты работал?", "Ты работаешь?", "Вы работаете?", "Я работал?"], correct: "Ты работал?", category: "question" },
  { en: "Will I work?", options: ["Я буду работать?", "Я работал?", "Я работаю?", "Он будет работать?"], correct: "Я буду работать?", category: "question" }
];

export const level3RuEn = [...level2RuEn, ...level3QuestionsRuEn];
export const level3EnRu = [...level2EnRu, ...level3QuestionsEnRu];