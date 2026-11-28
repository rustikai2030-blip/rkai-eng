// src/data/levels/level5.js
import { level4RuEn, level4EnRu } from './level4.js';

export const level5KeyboardRows = [
  ['w', 'e', 'r', 't', 'p'],
  ['a', 'y', 'u', 'i', 'o'],
  ['s', 'c', 'd', 'h', 'k'],
  ['g', 'm', 'l', 'n', 'backspace'],
  ['shift', "'", 'space', '?', 'ok']
];

// Собственный словарь 5-го уровня:
// неправильный глагол Go (went), дополнения always и usually, частица to
export const level5Words = [
  {
    en: "Go",
    ru: "Идти / ехать",
    note: "неправильный глагол · прош. время: went"
  },
  {
    en: "Always",
    ru: "Всегда"
  },
  {
    en: "Usually",
    ru: "Обычно"
  },
  {
    en: "to",
    ru: "в / к / на (частица направления)",
    note: "частица"
  }
];

const level5ExtraRuEn = [
  // Утверждения с always, usually, to и go / went
  { ru: "Я всегда иду на работу", en: "I always go to work", category: "statement" },
  { ru: "Я обычно звоню", en: "I usually call", category: "statement" },
  { ru: "Он обычно помогает", en: "He usually helps", category: "statement" },
  { ru: "Она всегда помогает", en: "She always helps", category: "statement" },
  { ru: "Мы всегда работаем", en: "We always work", category: "statement" },
  { ru: "Они обычно звонят", en: "They usually call", category: "statement" },
  { ru: "Я ходил на работу", en: "I went to work", category: "statement" },
  { ru: "Он обычно ходил на работу", en: "He usually went to work", category: "statement" },
  { ru: "Она всегда ходила на работу", en: "She always went to work", category: "statement" },
  { ru: "Я буду ходить на работу", en: "I will go to work", category: "statement" },

  // Отрицания с always / usually / go / went
  { ru: "Я не всегда работаю", en: "I don't always work", category: "negative" },
  { ru: "Он обычно не звонит", en: "He usually doesn't call", category: "negative" },
  { ru: "Она не всегда помогает", en: "She doesn't always help", category: "negative" },
  { ru: "Я не ходил на работу", en: "I didn't go to work", category: "negative" },
  { ru: "Он не ходил на работу", en: "He didn't go to work", category: "negative" },

  // Вопросы с always / usually / go / went / to
  { ru: "Ты всегда работаешь?", en: "Do you always work?", category: "question" },
  { ru: "Он обычно звонит?", en: "Does he usually call?", category: "question" },
  { ru: "Ты ходил на работу?", en: "Did you go to work?", category: "question" },
  { ru: "Она ходила на работу?", en: "Did she go to work?", category: "question" },
  { ru: "Ты пойдёшь на работу?", en: "Will you go to work?", category: "question" }
];

const level5ExtraEnRu = [
  {
    en: "I always go to work",
    options: ["Я всегда иду на работу", "Я обычно звоню", "Я ходил на работу", "Я всегда помогаю"],
    correct: "Я всегда иду на работу",
    category: "statement"
  },
  {
    en: "He usually calls",
    options: ["Он обычно звонит", "Он всегда работает", "Он звонил", "Она обычно звонит"],
    correct: "Он обычно звонит",
    category: "statement"
  },
  {
    en: "I went to work",
    options: ["Я ходил на работу", "Я иду на работу", "Я буду работать", "Он ходил на работу"],
    correct: "Я ходил на работу",
    category: "statement"
  },
  {
    en: "She always helps",
    options: ["Она всегда помогает", "Она обычно помогает", "Она помогала", "Он всегда помогает"],
    correct: "Она всегда помогает",
    category: "statement"
  },
  {
    en: "I don't always work",
    options: ["Я не всегда работаю", "Я всегда работаю", "Я не работаю", "Я не ходил на работу"],
    correct: "Я не всегда работаю",
    category: "negative"
  },
  {
    en: "Did you go to work?",
    options: ["Ты ходил на работу?", "Ты всегда работаешь?", "Ты звонил?", "Он ходил на работу?"],
    correct: "Ты ходил на работу?",
    category: "question"
  }
];

export const level5RuEn = [...level4RuEn, ...level5ExtraRuEn];
export const level5EnRu = [...level4EnRu, ...level5ExtraEnRu];