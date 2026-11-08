// Базовый словарь для модального окна "Слова"
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
  { en: "Don't / Doesn't work", ru: "Не работаю(ет) (отрицание — Ур. 2)" },
  { en: "Didn't work", ru: "Не работал (прошед. отрицание — Ур. 2)" },
  { en: "Do / Does... work?", ru: "Работаешь/работает ли? (вопрос — Ур. 3)" },
  { en: "Did... work?", ru: "Работал ли? (прошед. вопрос — Ур. 3)" }
];

// Полный свод правил для модального окна "Правила" (Уровни 1, 2 и 3)
export const grammarRules = `
  <h2>Правила (Simple)</h2>
  
  <h3>1. Утвердительная форма (Уровень 1)</h3>
  <p><b>Будущее:</b> I / You / We / They / He / She / It <b>will work</b>.</p>
  <p><b>Настоящее:</b> I / You / We / They <b>work</b> | He / She / It <b>works</b></p>
  <p><b>Прошедшее:</b> I / You / We / They / He / She / It <b>worked</b></p>

  <h3>2. Отрицательная форма (Уровень 2)</h3>
  <p><b>Настоящее:</b> I / You / We / They <b>don't work</b> — Я / Ты / Мы / Они не работаем</p>
  <p><b>Настоящее (He/She/It):</b> He / She / It <b>doesn't work</b> — Он / Она / Оно не работает</p>
  <p><b>Прошедшее:</b> I / You / We / They / He / She / It <b>didn't work</b> — Я / Ты / Мы / Он / Оно не работал(а/или)</p>

  <h3>3. Вопросительная форма (Уровень 3)</h3>
  <p><b>Настоящее:</b> <b>Do</b> I / you / we / they <b>work?</b> — Я / ты / мы / они работаем?</p>
  <p><b>Настоящее (He/She/It):</b> <b>Does</b> he / she / it <b>work?</b> — Он / она / оно работает?</p>
  <p><b>Прошедшее:</b> <b>Did</b> I / you / we / they / he / she / it <b>work?</b> — Я / ты / он работал(а)?</p>
  <p><b>Будущее:</b> <b>Will</b> I / you / we / they / he / she / it <b>work?</b> — Я / ты / он будет работать?</p>
`;

// Задачи для Уровня 1 (только утверждения)
export const level1Tasks = {
  ruEn: [
    { ru: "Я работаю", en: "I work" },
    { ru: "Ты работаешь", en: "You work" },
    { ru: "Мы работаем", en: "We work" },
    { ru: "Они работают", en: "They work" },
    { ru: "Он работает", en: "He works" },
    { ru: "Она работает", en: "She works" },
    { ru: "Оно работает", en: "It works" },
    { ru: "Я работал", en: "I worked" },
    { ru: "Ты работал", en: "You worked" },
    { ru: "Мы работали", en: "We worked" },
    { ru: "Он работал", en: "He worked" },
    { ru: "Она работала", en: "She worked" },
    { ru: "Оно работало", en: "It worked" },
    { ru: "Они работали", en: "They worked" },
    { ru: "Я буду работать", en: "I will work" }
  ],
  enRu: [
    { en: "I work", options: ["Я работаю", "Ты работаешь", "Мы работаем", "Он работает"], correct: "Я работаю" },
    { en: "You work", options: ["Ты работаешь", "Они работают", "Оно работает", "Я работаю"], correct: "Ты работаешь" },
    { en: "We work", options: ["Мы работаем", "Вы работаете", "Они работают", "Я работаю"], correct: "Мы работаем" },
    { en: "They work", options: ["Они работают", "Мы работаем", "Он работает", "Она работает"], correct: "Они работают" },
    { en: "He works", options: ["Он работает", "Она работает", "Оно работает", "Я работаю"], correct: "Он работает" },
    { en: "She works", options: ["Она работает", "Он работает", "Мы работаем", "Они работают"], correct: "Она работает" },
    { en: "It works", options: ["Оно работает", "Он работает", "Она работает", "Я работаю"], correct: "Оно работает" },
    { en: "I worked", options: ["Я работал", "Ты работал", "Мы работали", "Он работал"], correct: "Я работал" },
    { en: "I will work", options: ["Я буду работать", "Я работал", "Я работаю", "Он будет работать"], correct: "Я буду работать" }
  ]
};

// Задачи для Уровня 2 (утверждения + отрицания)
export const level2Tasks = {
  ruEn: [
    ...level1Tasks.ruEn,
    { ru: "Я не работаю", en: "I don't work" },
    { ru: "Ты не работаешь", en: "You don't work" },
    { ru: "Мы не работаем", en: "We don't work" },
    { ru: "Они не работают", en: "They don't work" },
    { ru: "Он не работает", en: "He doesn't work" },
    { ru: "Она не работает", en: "She doesn't work" },
    { ru: "Оно не работает", en: "It doesn't work" },
    { ru: "Я не работал", en: "I didn't work" },
    { ru: "Он не работал", en: "He didn't work" }
  ],
  enRu: [
    ...level1Tasks.enRu,
    { en: "I don't work", options: ["Я не работаю", "Ты не работаешь", "Я работал", "Мы не работаем"], correct: "Я не работаю" },
    { en: "He doesn't work", options: ["Он не работает", "Она не работает", "Он работает", "Я не работаю"], correct: "Он не работает" },
    { en: "I didn't work", options: ["Я не работал", "Я не работаю", "Он не работал", "Я работал"], correct: "Я не работал" }
  ]
};

// Задачи для Уровня 3 (утверждения + отрицания + вопросы)
export const level3Tasks = {
  ruEn: [
    ...level2Tasks.ruEn,
    { ru: "Я работаю?", en: "Do I work?" },
    { ru: "Ты работаешь?", en: "Do you work?" },
    { ru: "Мы работаем?", en: "Do we work?" },
    { ru: "Они работают?", en: "Do they work?" },
    { ru: "Он работает?", en: "Does he work?" },
    { ru: "Она работает?", en: "Does she work?" },
    { ru: "Оно работает?", en: "Does it work?" },
    { ru: "Я работал?", en: "Did I work?" },
    { ru: "Ты работал?", en: "Did you work?" },
    { ru: "Он работал?", en: "Did he work?" },
    { ru: "Я буду работать?", en: "Will I work?" }
  ],
  enRu: [
    ...level2Tasks.enRu,
    { en: "Do I work?", options: ["Я работаю?", "Ты работаешь?", "Я работал?", "Мы работаем?"], correct: "Я работаю?" },
    { en: "Does he work?", options: ["Он работает?", "Она работает?", "Он работает", "Он не работает?"], correct: "Он работает?" },
    { en: "Did you work?", options: ["Ты работал?", "Ты работаешь?", "Вы работаете?", "Я работал?"], correct: "Ты работал?" },
    { en: "Will I work?", options: ["Я буду работать?", "Я работал?", "Я работаю?", "Он будет работать?"], correct: "Я буду работать?" }
  ]
};