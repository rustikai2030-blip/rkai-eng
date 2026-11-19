// src/components/categoryFilters.js

export function renderCategoryFilters({
  containerId,
  currentLevel,
  activeCategories,
  isTestMode,
  onToggleCategory
}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (isTestMode) {
    container.innerHTML = '';
    return;
  }

  const buttons = [];

  if (currentLevel >= 3) {
    buttons.push({ id: 'question', label: 'Вопрос' });
  }

  buttons.push({ id: 'statement', label: 'Утверждение' });

  if (currentLevel >= 2) {
    buttons.push({ id: 'negative', label: 'Отрицание' });
  }

  container.innerHTML = `
    <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: var(--ui-gap, 8px);">
      ${buttons.map(btn => {
        const isActive = activeCategories.includes(btn.id);
        return `
          <button 
            class="cat-filter-btn" 
            data-cat="${btn.id}" 
            style="
              flex: 1;
              padding: clamp(6px, 1.1dvh, 9px) 4px;
              font-size: clamp(12px, 1.9dvh, 14px);
              font-weight: 700;
              cursor: pointer;
              border-radius: var(--border-radius, 8px);
              background: ${isActive ? 'var(--accent, #38bdf8)' : 'var(--btn-bg, transparent)'};
              color: ${isActive ? '#ffffff' : 'inherit'};
              border: 2px solid ${isActive ? 'var(--accent, #38bdf8)' : 'var(--btn-border, currentColor)'};
              opacity: ${isActive ? '1' : '0.55'};
              transition: all 0.2s ease;
            "
          >
            ${btn.label}
          </button>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.onclick = () => {
      const cat = btn.getAttribute('data-cat');
      onToggleCategory(cat);
    };
  });
}