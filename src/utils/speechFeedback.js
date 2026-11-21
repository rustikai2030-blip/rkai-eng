// src/utils/speechFeedback.js

function pickRussianVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;

  // Ищем любой русский голос (ru-RU, ru-KZ, ru и т.д.)
  const ruVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('ru'));
  if (!ruVoices.length) return null;

  // Предпочитаем локальный/системный голос, если доступен
  return ruVoices.find(v => v.localService) || ruVoices[0];
}

/**
 * Озвучивает шуточное сообщение при повторных ошибках через Web Speech API
 */
export function speakErrorMessage(text, { enabled = true, rate = 1.02, pitch = 1.05 } = {}) {
  if (!enabled || !text) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(String(text).trim());
    utterance.lang = 'ru-RU';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    const voice = pickRussianVoice();
    if (voice) {
      utterance.voice = voice;
    }

    synth.speak(utterance);
  } catch (err) {
    console.warn('Ошибка синтеза речи:', err);
  }
}

export function stopErrorSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch (_) {}
}