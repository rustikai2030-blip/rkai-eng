// src/data/levels/level4.js
import { level3RuEn, level3EnRu } from './level3.js';

export const level4KeyboardRows = [
  ['w', 'e', 'r', 't', 'p'],
  ['a', 'y', 'u', 'i', 'o'],
  ['s', 'c', 'd', 'h', 'k'],
  ['shift', 'l', 'n', '?', 'backspace'],
  ["'", 'space', 'ok']
];

export const level4Words = [
  { en: "Call", ru: "Звонить" },
  { en: "Called", ru: "Звонил (прошед. время)" },
  { en: "Help", ru: "Помогать" },
  { en: "Helped", ru: "Помогал (прошед. время)" }
];

const level4ExtraRuEn = [
  // Утверждения — call
  { ru: "Я звоню", en: "I call", category: "statement" },
  { ru: "Ты звонишь", en: "You call", category: "statement" },
  { ru: "Мы звоним", en: "We call", category: "statement" },
  { ru: "Они звонят", en: "They call", category: "statement" },
  { ru: "Он звонит", en: "He calls", category: "statement" },
  { ru: "Она звонит", en: "She calls", category: "statement" },
  { ru: "Я звонил", en: "I called", category: "statement" },
  { ru: "Он звонил", en: "He called", category: "statement" },
  { ru: "Я буду звонить", en: "I will call", category: "statement" },
  { ru: "Он будет звонить", en: "He will call", category: "statement" },

  // Утверждения — help
  { ru: "Я помогаю", en: "I help", category: "statement" },
  { ru: "Ты помогаешь", en: "You help", category: "statement" },
  { ru: "Мы помогаем", en: "We help", category: "statement" },
  { ru: "Они помогают", en: "They help", category: "statement" },
  { ru: "Он помогает", en: "He helps", category: "statement" },
  { ru: "Она помогает", en: "She helps", category: "statement" },
  { ru: "Я помогал", en: "I helped", category: "statement" },
  { ru: "Она помогала", en: "She helped", category: "statement" },
  { ru: "Я буду помогать", en: "I will help", category: "statement" },
  { ru: "Она будет помогать", en: "She will help", category: "statement" },

  // Отрицания — call
  { ru: "Я не звоню", en: "I don't call", category: "negative" },
  { ru: "Он не звонит", en: "He doesn't call", category: "negative" },
  { ru: "Я не звонил", en: "I didn't call", category: "negative" },
  { ru: "Он не звонил", en: "He didn't call", category: "negative" },

  // Отрицания — help
  { ru: "Я не помогаю", en: "I don't help", category: "negative" },
  { ru: "Она не помогает", en: "She doesn't help", category: "negative" },
  { ru: "Я не помогал", en: "I didn't help", category: "negative" },
  { ru: "Она не помогала", en: "She didn't help", category: "negative" },

  // Вопросы — call
  { ru: "Ты звонишь?", en: "Do you call?", category: "question" },
  { ru: "Он звонит?", en: "Does he call?", category: "question" },
  { ru: "Ты звонил?", en: "Did you call?", category: "question" },
  { ru: "Он звонил?", en: "Did he call?", category: "question" },
  { ru: "Ты будешь звонить?", en: "Will you call?", category: "question" },

  // Вопросы — help
  { ru: "Ты помогаешь?", en: "Do you help?", category: "question" },
  { ru: "Она помогает?", en: "Does she help?", category: "question" },
  { ru: "Ты помогал?", en: "Did you help?", category: "question" },
  { ru: "Она помогала?", en: "Did she help?", category: "question" },
  { ru: "Ты будешь помогать?", en: "Will you help?", category: "question" }
];

const level4ExtraEnRu = [
  { en: "I call", options: ["Я звоню", "Я помогаю", "Я работаю", "Я звонил"], correct: "Я звоню", category: "statement" },
  { en: "He calls", options: ["Он звонит", "Он помогает", "Он работает", "Она звонит"], correct: "Он звонит", category: "statement" },
  { en: "I called", options: ["Я звонил", "Я помогал", "Я звоню", "Я работал"], correct: "Я звонил", category: "statement" },
  { en: "I help", options: ["Я помогаю", "Я звоню", "Я работаю", "Я помогал"], correct: "Я помогаю", category: "statement" },
  { en: "She helps", options: ["Она помогает", "Она звонит", "Она работает", "Он помогает"], correct: "Она помогает", category: "statement" },
  { en: "She helped", options: ["Она помогала", "Она звонила", "Она работала", "Я помогал"], correct: "Она помогала", category: "statement" },
  { en: "He doesn't call", options: ["Он не звонит", "Он не помогает", "Он не работает", "Он не звонил"], correct: "Он не звонит", category: "negative" },
  { en: "She doesn't help", options: ["Она не помогает", "Она не звонит", "Она не работает", "Она не помогала"], correct: "Она не помогает", category: "negative" },
  { en: "Did you call?", options: ["Ты звонил?", "Ты помогал?", "Ты работал?", "Ты звонишь?"], correct: "Ты звонил?", category: "question" },
  { en: "Does she help?", options: ["Она помогает?", "Она звонит?", "Она работает?", "Она помогала?"], correct: "Она помогает?", category: "question" }
];

export const level4RuEn = [...level3RuEn, ...level4ExtraRuEn];
export const level4EnRu = [...level3EnRu, ...level4ExtraEnRu];