export default function ThemeToggle() {
  // The shared pre-paint theme script supplies the saved preference's label.
  return <button type="button" className="theme-toggle" data-theme-toggle aria-label="Switch color theme" title="Switch color theme" suppressHydrationWarning>
    <svg className="theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 13.2A9 9 0 0 1 10.8 3.2a9 9 0 1 0 10 10Z" /></svg>
    <svg className="theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>
  </button>;
}
