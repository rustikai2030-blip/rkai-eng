// src/utils/speechFeedback.js

const EN_PHRASE_SPEECH_STORAGE_KEY = 'rkai_en_phrase_speech_enabled';

/**
 * Возвращает состояние озвучки английских фраз (по умолчанию выключена).
 */
export function isEnglishPhraseSpeechEnabled() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  return localStorage.getItem(EN_PHRASE_SPEECH_STORAGE_KEY) === 'true';
}

/**
 * Сохраняет состояние озвучки английских фраз.
 */
export function setEnglishPhraseSpeechEnabled(enabled) {
  const nextValue = Boolean(enabled);
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(EN_PHRASE_SPEECH_STORAGE_KEY, nextValue ? 'true' : 'false');
  }
  if (!nextValue) {
    stopErrorSpeech();
  }
  return nextValue;
}

function pickVoiceByLang(langPrefix, preferredKeywords = []) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;

  const matchingVoices = voices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith(langPrefix.toLowerCase())
  );
  if (!matchingVoices.length) return null;

  // Ищем наиболее естественные голоса по ключевым словам (Google, Natural, Samantha и т.д.)
  for (const keyword of preferredKeywords) {
    const found = matchingVoices.find((v) =>
      v.name.toLowerCase().includes(keyword.toLowerCase())
    );
    if (found) return found;
  }

  return matchingVoices.find((v) => v.localService) || matchingVoices[0];
}

/**
 * Озвучивает шуточное сообщение при повторных ошибках (RU)
 */
export function speakErrorMessage(text, { enabled = true, rate = 1.02, pitch = 1.05 } = {}) {
  if (!enabled || !text) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(String(text).trim());
    utterance.lang = 'ru-RU';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    const voice = pickVoiceByLang('ru', ['google', 'milena', 'yuri', 'irina']);
    if (voice) {
      utterance.voice = voice;
    }

    synth.speak(utterance);
  } catch (err) {
    console.warn('Ошибка синтеза русской речи:', err);
  }
}

/**
 * Озвучивает английское слово или фразу (EN)
 */
export function speakEnglishWord(text, { rate = 0.92, pitch = 1.0, onStart, onEnd } = {}) {
  if (!text) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(String(text).trim());
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    // Приоритет естественным американским/британским голосам
    const voice =
      pickVoiceByLang('en-us', ['google us english', 'natural', 'samantha', 'aria', 'jenny']) ||
      pickVoiceByLang('en-gb', ['google uk english', 'daniel', 'serena']) ||
      pickVoiceByLang('en', ['google', 'natural']);

    if (voice) {
      utterance.voice = voice;
    }

    if (typeof onStart === 'function') {
      utterance.onstart = onStart;
    }
    if (typeof onEnd === 'function') {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    synth.speak(utterance);
  } catch (err) {
    console.warn('Ошибка синтеза английской речи:', err);
    if (typeof onEnd === 'function') onEnd();
  }
}

export function stopErrorSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch (_) {}
}