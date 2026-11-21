// src/components/timerStatusBar.js

export function renderTimerStatusBar({
  containerId,
  formattedTime,
  showTimer,
  showSoundToggle,
  isSoundEnabled,
  showSettingsButton,
  onToggleSound,
  onOpenSettings
}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--ui-gap); gap: 8px;">
      <button id="words-btn" style="padding: clamp(6px, 1.1dvh, 9px) 14px; font-size: 14px; font-weight: 600; cursor: pointer;">Слова</button>

      <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
        <button
          type="button"
          id="sound-toggle-btn"
          style="
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            padding: 2px;
            line-height: 1;
            visibility: ${showSoundToggle ? 'visible' : 'hidden'};
          "
          title="Вкл/Выкл звук"
          aria-label="Вкл/Выкл звук"
        >
          ${isSoundEnabled ? '🔊' : '🔇'}
        </button>

        <div
          id="timer-display"
          style="
            font-size: 14px;
            font-weight: bold;
            min-width: 42px;
            text-align: center;
            visibility: ${showTimer ? 'visible' : 'hidden'};
          "
        >
          ${formattedTime}
        </div>

        <button
          type="button"
          id="settings-btn"
          style="
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            padding: 2px;
            line-height: 1;
            visibility: ${showSettingsButton ? 'visible' : 'hidden'};
          "
          title="Настройки"
          aria-label="Настройки"
        >
          ⚙️
        </button>
      </div>

      <button id="rules-btn" style="padding: clamp(6px, 1.1dvh, 9px) 14px; font-size: 14px; font-weight: 600; cursor: pointer;">Правила</button>
    </div>
  `;

  const soundBtn = container.querySelector('#sound-toggle-btn');
  if (soundBtn && typeof onToggleSound === 'function') {
    soundBtn.onclick = onToggleSound;
  }

  const settingsBtn = container.querySelector('#settings-btn');
  if (settingsBtn && typeof onOpenSettings === 'function') {
    settingsBtn.onclick = onOpenSettings;
  }
}