(function () {
  const key = 'studytrack-theme-v1';
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference;
  try { preference = localStorage.getItem(key); } catch {}
  if (preference !== 'light' && preference !== 'dark') preference = null;
  function apply(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      const label = 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode';
      button.setAttribute('aria-label', label);
      button.title = label;
    });
  }
  apply(preference || (system.matches ? 'dark' : 'light'));
  document.addEventListener('DOMContentLoaded', function () { apply(root.dataset.theme); });
  document.addEventListener('click', function (event) {
    if (!event.target.closest?.('[data-theme-toggle]')) return;
    preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(key, preference); } catch {}
    apply(preference);
  });
  system.addEventListener('change', function (event) { if (!preference) apply(event.matches ? 'dark' : 'light'); });
  window.addEventListener('storage', function (event) {
    if (event.key !== key) return;
    preference = event.newValue === 'dark' || event.newValue === 'light' ? event.newValue : null;
    apply(preference || (system.matches ? 'dark' : 'light'));
  });
})();
