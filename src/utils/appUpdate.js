// src/utils/appUpdate.js
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";

const SETTINGS_DOC_PATH = ["settings", "game"];
const LOCAL_APPLIED_VERSION_KEY = "rkai_applied_app_version";
const RELOAD_GUARD_KEY = "rkai_force_update_reloaded_ver";

let isForceUpdating = false;
let unsubscribeVersionListener = null;

export function getLocalAppliedVersion() {
  const raw = localStorage.getItem(LOCAL_APPLIED_VERSION_KEY);
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : 1;
}

export function setLocalAppliedVersion(version) {
  const safeVer = Math.max(1, Math.floor(Number(version) || 1));
  localStorage.setItem(LOCAL_APPLIED_VERSION_KEY, String(safeVer));
}

export async function fetchRemoteAppVersion() {
  try {
    const ref = doc(db, ...SETTINGS_DOC_PATH);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const ver = Number(snap.data().appVersion);
      if (Number.isFinite(ver) && ver > 0) {
        return Math.floor(ver);
      }
    }
  } catch (err) {
    console.warn("Не удалось получить версию приложения из Firestore:", err.message);
  }
  return getLocalAppliedVersion();
}

/**
 * Админ-действие: повышает версию приложения в Firestore,
 * чтобы все устройства пользователей принудительно обновили файлы и кэш.
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
  return nextVersion;
}

/**
 * Очищает все кэши Cache Storage, обновляет Service Worker
 * и перезагружает страницу для загрузки свежих файлов.
 */
export async function performHardPwaRefresh(targetVersion) {
  if (isForceUpdating) return;
  isForceUpdating = true;

  const safeVer = Math.max(1, Math.floor(Number(targetVersion) || getLocalAppliedVersion()));
  setLocalAppliedVersion(safeVer);

  try {
    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
  } catch (err) {
    console.warn("Ошибка очистки Cache Storage:", err);
  }

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.update();
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      }
    }
  } catch (err) {
    console.warn("Ошибка обновления Service Worker:", err);
  }

  // Защита от зацикливания перезагрузки на одной и той же версии
  if (sessionStorage.getItem(RELOAD_GUARD_KEY) !== String(safeVer)) {
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(safeVer));
    const url = new URL(window.location.href);
    url.searchParams.set("_v", String(safeVer));
    window.location.replace(url.toString());
  } else {
    isForceUpdating = false;
  }
}

/**
 * Проверяет, не вышла ли новая версия приложения в Firestore.
 */
export async function checkAndApplyRemoteVersion(forceCheck = false) {
  if (isForceUpdating) return false;
  if (!forceCheck && document.visibilityState === "hidden") return false;

  const remoteVersion = await fetchRemoteAppVersion();
  const localVersion = getLocalAppliedVersion();

  if (remoteVersion > localVersion) {
    await performHardPwaRefresh(remoteVersion);
    return true;
  }
  return false;
}

/**
 * Подписывается на изменения версии в реальном времени,
 * пока вкладка открыта.
 */
export function startRemoteVersionWatcher() {
  if (unsubscribeVersionListener) return;

  try {
    const ref = doc(db, ...SETTINGS_DOC_PATH);
    unsubscribeVersionListener = onSnapshot(ref, (snap) => {
      if (!snap.exists() || isForceUpdating) return;
      const remoteVersion = Number(snap.data().appVersion);
      if (!Number.isFinite(remoteVersion) || remoteVersion <= 0) return;

      const localVersion = getLocalAppliedVersion();
      if (remoteVersion > localVersion) {
        performHardPwaRefresh(remoteVersion);
      }
    });
  } catch (err) {
    console.warn("Ошибка подписки на версию приложения:", err);
  }
}