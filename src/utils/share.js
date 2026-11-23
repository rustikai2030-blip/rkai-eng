// src/utils/share.js

export const SHARE_APP_URL = "https://eng.rkai.app";

export function buildProjectShareText() {
  return [
    "Pareto English — тренажёр английского по правилу 80/20.",
    "Вместо 504 форм — 18 базовых связок в Simple, доведённых до автоматизма.",
    "Бесплатно, работает в браузере и устанавливается как приложение на телефон:",
    SHARE_APP_URL
  ].join("\n");
}

export function buildLevelUpShareText(nextLevel) {
  const safeLevel = Math.max(2, Number(nextLevel) || 2);
  return [
    `Я прошёл тест и перешёл на Уровень ${safeLevel} в тренажёре Pareto English!`,
    "Тренируем базу английского до автоматизма по принципу Парето 80/20:",
    SHARE_APP_URL
  ].join("\n");
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
  title = "Pareto English — Тренажёр английского языка",
  text = buildProjectShareText(),
  url = SHARE_APP_URL
} = {}) {
  const fullShareMessage = text.includes(url) ? text : `${text}\n${url}`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title,
        text,
        url
      });
      return { status: "shared" };
    } catch (err) {
      // Пользователь сам закрыл окно выбора приложения — не считаем это ошибкой
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