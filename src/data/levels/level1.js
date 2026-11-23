// src/data/levels/level1.js
export const level1KeyboardRows = [
  ['w', 'e', 'r', 't'],
  ['y', 'u', 'i', 'o'],
  ['s', 'd', 'h', 'k'],
  ['shift', 'l', 'backspace'],
  ['space', 'ok']
];

export const level1Words = [
  { en: "I", ru: "Я", note: "всегда с большой буквы" },
  { en: "You", ru: "Ты" },
  { en: "We", ru: "Мы" },
  { en: "He", ru: "Он" },
  { en: "She", ru: "Она" },
  { en: "It", ru: "Оно" },
  { en: "They", ru: "Они" },
  { en: "Work", ru: "Работать" },
  { en: "Worked", ru: "Работал (прошед. время)" }
];

export const level1RuEn = [
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

export const level1EnRu = [
  { en: "I work", options: ["Я работаю", "Ты работаешь", "Мы работаем", "Он работает"], correct: "Я работаю", category: "statement" },
  { en: "You work", options: ["Ты работаешь", "Они работают", "Оно работает", "Я работаю"], correct: "Ты работаешь", category: "statement" },
  { en: "We work", options: ["Мы работаем", "Вы работаете", "Они работают", "Я работаю"], correct: "Мы работаем", category: "statement" },
  { en: "They work", options: ["Они работают", "Мы работаем", "Он работает", "Она работает"], correct: "Они работают", category: "statement" },
  { en: "He works", options: ["Он работает", "Она работает", "Оно работает", "Я работает"], correct: "Он работает", category: "statement" },
  { en: "She works", options: ["Она работает", "Он работает", "Мы работаем", "Они работают"], correct: "Она работает", category: "statement" },
  { en: "I worked", options: ["Я работал", "Ты работал", "Мы работали", "Он работал"], correct: "Я работал", category: "statement" },
  { en: "I will work", options: ["Я буду работать", "Я работал", "Я работаю", "Он будет работать"], correct: "Я буду работать", category: "statement" }
];