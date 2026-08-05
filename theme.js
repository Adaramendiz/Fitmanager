(() => {
  const storageKey = 'fitmanager-theme';
  const darkClass = 'dark-theme';

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle(darkClass, isDark);
    const button = document.getElementById('themeToggle');
    if (!button) return;
    button.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    button.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    button.setAttribute('aria-pressed', String(isDark));
    button.innerHTML = isDark
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.8 6.8 0 0 0 21 12.8Z"/></svg>';
  }

  function setupTheme() {
    if (document.getElementById('themeToggle')) return;
    const button = document.createElement('button');
    button.id = 'themeToggle';
    button.className = 'theme-toggle';
    button.type = 'button';
    button.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains(darkClass) ? 'light' : 'dark';
      localStorage.setItem(storageKey, nextTheme);
      applyTheme(nextTheme);
    });
    document.body.appendChild(button);
    applyTheme(localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'light');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupTheme);
  else setupTheme();
})();
