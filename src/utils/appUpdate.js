// src/utils/appUpdate.js
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";

const SETTINGS_DOC_PATH = ["settings", "game"];
const LOCAL_APPLIED_VERSION_KEY = "rkai_applied_app_version";
const ATTEMPTED_VERSION_GUARD_KEY = "rkai_update_attempted_ver";

let pendingUpdateVersion = null;
let isApplyingUpdate = false;
let unsubscribeVersionListener = null;
const updateListeners = new Set();

function normalizeVersion(val, fallback = 1) {
  const num = Number(val);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : fallback;
}

export function getLocalAppliedVersion() {
  const raw = localStorage.getItem(LOCAL_APPLIED_VERSION_KEY);
  return normalizeVersion(raw, 1);
}

export function setLocalAppliedVersion(version) {
  const safeVer = normalizeVersion(version, 1);
  localStorage.setItem(LOCAL_APPLIED_VERSION_KEY, String(safeVer));
}

export function getPendingUpdateVersion() {
  return pendingUpdateVersion;
}

export function onUpdateAvailable(listener) {
  if (typeof listener !== "function") return () => {};
  updateListeners.add(listener);
  listener(pendingUpdateVersion);
  return () => updateListeners.delete(listener);
}

function notifyUpdateListeners() {
  updateListeners.forEach((fn) => {
    try {
      fn(pendingUpdateVersion);
    } catch (err) {
      console.warn("Ошибка слушателя обновления:", err);
    }
  });
}

function registerAvailableVersion(remoteVersion) {
  const safeRemote = normalizeVersion(remoteVersion, 0);
  if (!safeRemote) return false;

  const localVersion = getLocalAppliedVersion();
  const attemptedInSession = normalizeVersion(
    sessionStorage.getItem(ATTEMPTED_VERSION_GUARD_KEY),
    0
  );

  // Если уже пытались обновиться до этой версии в текущей сессии — не триггерим повторно
  if (safeRemote <= localVersion || safeRemote === attemptedInSession) {
    return false;
  }

  if (pendingUpdateVersion !== safeRemote) {
    pendingUpdateVersion = safeRemote;
    notifyUpdateListeners();
  }
  return true;
}

export async function fetchRemoteAppVersion() {
  try {
    const ref = doc(db, ...SETTINGS_DOC_PATH);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const ver = normalizeVersion(snap.data().appVersion, 0);
      if (ver > 0) return ver;
    }
  } catch (err) {
    console.warn("Не удалось получить версию приложения из Firestore:", err.message);
  }
  return getLocalAppliedVersion();
}

/**
 * Админ-действие: повышает версию приложения в Firestore для оповещения клиентов.
 */
export async function triggerForceAppUpdateForAllUsers() {
  const currentRemote = await fetchRemoteAppVersion();
  const currentLocal = getLocalAppliedVersion();
  const nextVersion = Math.max(currentRemote, currentLocal) + 1;

  const ref = doc(db, ...SETTINGS_DOC_PATH);
  await setDoc(
    ref,
    {
      appVersion: nextVersion,
      forceUpdateAt: Date.now()
    },
    { merge: true }
  );

  setLocalAppliedVersion(nextVersion);
  pendingUpdateVersion = null;
  notifyUpdateListeners();
  return nextVersion;
}

async function waitForWorkerActivation(reg, timeoutMs = 1500) {
  if (!reg) return;
  const worker = reg.installing || reg.waiting || reg.active;
  if (!worker) return;
  if (worker.state === "activated" && navigator.serviceWorker.controller) return;

  await new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      worker.removeEventListener("statechange", onStateChange);
      resolve();
    };
    const onStateChange = () => {
      if (worker.state === "activated") finish();
    };
    const timer = setTimeout(finish, timeoutMs);
    worker.addEventListener("statechange", onStateChange);
  });
}

/**
 * Мягко активирует новый Service Worker, очищает кэши файлов PWA и перезагружает страницу один раз.
 * Данные прогресса (localStorage / Firestore) не удаляются.
 */
export async function applyPendingAppUpdate(explicitVersion = null) {
  if (isApplyingUpdate) return;
  isApplyingUpdate = true;

  const targetVer = normalizeVersion(
    explicitVersion || pendingUpdateVersion || getLocalAppliedVersion(),
    1
  );

  // Фиксируем версию и одноразовую метку попытки до перезагрузки, чтобы избежать цикла
  setLocalAppliedVersion(targetVer);
  try {
    sessionStorage.setItem(ATTEMPTED_VERSION_GUARD_KEY, String(targetVer));
  } catch (_) {}

  pendingUpdateVersion = null;
  notifyUpdateListeners();

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.update();
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        await waitForWorkerActivation(reg);
      }
    }
  } catch (err) {
    console.warn("Ошибка обновления Service Worker:", err);
  }

  try {
    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
  } catch (err) {
    console.warn("Ошибка очистки Cache Storage:", err);
  }

  const url = new URL(window.location.href);
  url.searchParams.set("_v", String(targetVer));
  window.location.replace(url.toString());
}

/**
 * Совместимость со старым именем вызова: мягко фиксирует версию без принудительного срыва.
 */
export async function performHardPwaRefresh(targetVersion) {
  const safeVer = normalizeVersion(targetVersion, getLocalAppliedVersion());
  setLocalAppliedVersion(safeVer);
  pendingUpdateVersion = null;
  notifyUpdateListeners();
}

/**
 * Проверяет, появилась ли новая версия в Firestore (без принудительной перезагрузки).
 */
export async function checkAndApplyRemoteVersion(forceCheck = false) {
  if (isApplyingUpdate) return false;
  if (!forceCheck && document.visibilityState === "hidden") return false;

  const remoteVersion = await fetchRemoteAppVersion();
  return registerAvailableVersion(remoteVersion);
}

/**
 * Подписывается на изменения версии в реальном времени и показывает мягкое уведомление.
 */
export function startRemoteVersionWatcher() {
  if (unsubscribeVersionListener) return;

  try {
    const ref = doc(db, ...SETTINGS_DOC_PATH);
    unsubscribeVersionListener = onSnapshot(ref, (snap) => {
      if (!snap.exists() || isApplyingUpdate) return;
      const remoteVersion = normalizeVersion(snap.data().appVersion, 0);
      if (remoteVersion > 0) {
        registerAvailableVersion(remoteVersion);
      }
    });
  } catch (err) {
    console.warn("Ошибка подписки на версию приложения:", err);
  }
}