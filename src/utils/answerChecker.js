// src/utils/answerChecker.js

const IRREGULAR_CONTRACTIONS_TO_FULL = [
  { pattern: /\bwon't\b/g, replacement: 'will not' },
  { pattern: /\bcan't\b/g, replacement: 'cannot' },
  { pattern: /\bcan not\b/g, replacement: 'cannot' },
  { pattern: /\bshan't\b/g, replacement: 'shall not' },
  { pattern: /\blet's\b/g, replacement: 'let us' }
];

const REGULAR_CONTRACTION_RULES = [
  // Отрицательные стяжения вида don't / doesn't / didn't / isn't / aren't / wasn't / weren't / haven't / hasn't / hadn't / wouldn't / couldn't / shouldn't / mustn't
  { pattern: /\b([a-z]+)n't\b/g, replacement: '$1 not' },
  // Личные местоимения + be / will / have / would
  { pattern: /\bi'm\b/g, replacement: 'i am' },
  { pattern: /\b(he|she|it)'s\b/g, replacement: '$1 is' },
  { pattern: /\b(we|you|they)'re\b/g, replacement: '$1 are' },
  { pattern: /\b([a-z]+)'ll\b/g, replacement: '$1 will' },
  { pattern: /\b([a-z]+)'ve\b/g, replacement: '$1 have' },
  { pattern: /\b([a-z]+)'d\b/g, replacement: '$1 would' }
];

/**
 * Убирает лишние пробелы, унифицирует апострофы и убирает случайную точку в конце.
 */
export function normalizeTranslationInput(rawText) {
  return String(rawText ?? '')
    .replace(/[\u2018\u2019`´]/g, "'")
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*'\s*/g, "'")
    .replace(/\s*\?\s*/g, '?')
    .replace(/\.+$/g, '')
    .trim();
}

/**
 * Приводит английскую фразу к каноническому виду для сравнения:
 * разворачивает сокращения (don't -> do not, won't -> will not, doesn't -> does not и т.д.)
 * и нормализует пробелы и регистр.
 */
export function canonicalizeEnglishPhrase(rawText) {
  let normalized = normalizeTranslationInput(rawText).toLowerCase();

  for (const rule of IRREGULAR_CONTRACTIONS_TO_FULL) {
    normalized = normalized.replace(rule.pattern, rule.replacement);
  }

  for (const rule of REGULAR_CONTRACTION_RULES) {
    normalized = normalized.replace(rule.pattern, rule.replacement);
  }

  return normalized.replace(/\s+/g, ' ').trim();
}

/**
 * Проверяет, что если в эталонном ответе есть местоимение "I",
 * то в вводе пользователя все отдельные токены "i" написаны с заглавной буквы "I".
 */
export function hasValidPronounCapitalization(userInput, expectedAnswer) {
  const normalizedUser = normalizeTranslationInput(userInput);
  const normalizedExpected = normalizeTranslationInput(expectedAnswer);

  const expectedHasPronounI = /\bI\b/.test(normalizedExpected);
  if (!expectedHasPronounI) {
    return true;
  }

  // Ищем все отдельные слова i / I в обоих регистрах (флаг 'gi')
  const userPronounMatches = normalizedUser.match(/\bi\b/gi) || [];
  if (userPronounMatches.length === 0) {
    return false;
  }

  return userPronounMatches.every((token) => token === 'I');
}

/**
 * Полная проверка ответа пользователя с возвратом результата и опциональной подсказки.
 */
export function evaluateTranslationAnswer(userInput, expectedAnswer) {
  const normalizedUser = normalizeTranslationInput(userInput);
  const normalizedExpected = normalizeTranslationInput(expectedAnswer);

  if (!normalizedUser || !normalizedExpected) {
    return { isCorrect: false, hint: '' };
  }

  const canonicalUser = canonicalizeEnglishPhrase(normalizedUser);
  const canonicalExpected = canonicalizeEnglishPhrase(normalizedExpected);

  if (canonicalUser !== canonicalExpected) {
    return { isCorrect: false, hint: '' };
  }

  if (!hasValidPronounCapitalization(normalizedUser, normalizedExpected)) {
    return {
      isCorrect: false,
      hint: 'Местоимение «I» в английском всегда пишется с большой буквы'
    };
  }

  return { isCorrect: true, hint: '' };
}

/**
 * Булева обёртка для обратной совместимости.
 */
export function isTranslationAnswerCorrect(userInput, expectedAnswer) {
  return evaluateTranslationAnswer(userInput, expectedAnswer).isCorrect;
}