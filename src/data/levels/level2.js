// src/data/levels/level2.js
import { level1RuEn, level1EnRu } from './level1.js';

export const level2KeyboardRows = [
  ['w', 'e', 'r', 't'],
  ['y', 'u', 'i', 'o'],
  ['s', 'd', 'h', 'k'],
  ['shift', 'l', 'n', 'backspace'],
  ["'", 'space', 'ok']
];

export const level2Words = [
  { en: "Will work", ru: "Буду работать (будущ. время)" },
  { en: "Don't / Doesn't work", ru: "Не работаю(ет) (отрицание)" },
  { en: "Didn't work", ru: "Не работал (прошед. отрицание)" }
];

export const level2NegativesRuEn = [
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

export const level2NegativesEnRu = [
  { en: "I don't work", options: ["Я не работаю", "Ты не работаешь", "Я работал", "Мы не работаем"], correct: "Я не работаю", category: "negative" },
  { en: "He doesn't work", options: ["Он не работает", "Она не работает", "Он работает", "Я не работает"], correct: "Он не работает", category: "negative" },
  { en: "I didn't work", options: ["Я не работал", "Я не работаю", "Он не работал", "Я работал"], correct: "Я не работал", category: "negative" }
];

export const level2RuEn = [...level1RuEn, ...level2NegativesRuEn];
export const level2EnRu = [...level1EnRu, ...level2NegativesEnRu];