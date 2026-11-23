// src/utils/share.js

export const SHARE_APP_URL = "https://eng.rkai.app";

export function buildProjectShareText() {
  return "Надоело забрасывать английский на старте? Pareto English — самый эффективный тренажёр английского: упрощает начальное изучение английского языка в 28 раз и доводит базу до автоматизма. Бесплатно:";
}

export function buildLevelUpShareText(nextLevel) {
  const safeLevel = Math.max(2, Number(nextLevel) || 2);
  return `Я прошёл тест и перешёл на Уровень ${safeLevel} в Pareto English — самом эффективном тренажёре английского! Упрощает начальное изучение английского языка в 28 раз и доводит базу до автоматизма. Бесплатно:`;
}

function formatShareMessage(text, url) {
  const cleanText = String(text || "").trim();
  const cleanUrl = String(url || "").trim();
  if (!cleanUrl) return cleanText;
  if (cleanText.includes(cleanUrl)) return cleanText;
  return cleanText ? `${cleanText}\n${cleanUrl}` : cleanUrl;
}

async function copyTextFallback(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (_) {
    copied = false;
  }

  document.body.removeChild(textarea);
  return copied;
}

/**
 * Открывает нативное меню «Поделиться» на устройстве,
 * а при его недоступности копирует текст со ссылкой в буфер обмена.
 */
export async function shareProjectContent({
  title = "Pareto English — самый эффективный тренажёр английского",
  text = buildProjectShareText(),
  url = SHARE_APP_URL
} = {}) {
  const fullShareMessage = formatShareMessage(text, url);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title,
        text,
        url
      });
      return { status: "shared" };
    } catch (err) {
      if (err && err.name === "AbortError") {
        return { status: "cancelled" };
      }
    }
  }

  const copied = await copyTextFallback(fullShareMessage);
  if (copied) {
    alert(`Текст и ссылка скопированы в буфер обмена:\n\n${fullShareMessage}`);
    return { status: "copied" };
  }

  alert(`Скопируйте ссылку вручную:\n${url}`);
  return { status: "manual" };
}