(function () {
  let installPrompt = null;
  let prompting = false;
  let installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let dialog;

  function updateButtons() {
    document.querySelectorAll('[data-install-app]').forEach(button => {
      const label = installed ? 'App installed' : 'Install StudyTrack';
      if (button.textContent !== label) button.textContent = label;
      if (button.disabled !== (installed || prompting)) button.disabled = installed || prompting;
    });
  }

  function instructions() {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'pwa-dialog';
      dialog.setAttribute('aria-labelledby', 'pwa-install-title');
      dialog.innerHTML = '<div class="pwa-dialog-head"><h2 id="pwa-install-title">Install StudyTrack</h2><button type="button" data-close-install aria-label="Close installation help">×</button></div><div class="pwa-dialog-body"><p class="pwa-install-intro"></p><div class="pwa-install-steps"></div><p class="pwa-install-note">Installation is free. Your account and Premium access stay the same. An internet connection is needed for sign-in and cloud features.</p><button type="button" class="pwa-done" data-close-install>Got it</button></div>';
      document.body.append(dialog);
      dialog.addEventListener('click', event => {
        if (event.target.closest('[data-close-install]') || event.target === dialog) dialog.close();
      });
    }
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const android = /Android/.test(navigator.userAgent);
    dialog.querySelector('.pwa-install-intro').textContent = ios ? 'Add StudyTrack to your iPhone or iPad home screen.' : android ? 'Keep StudyTrack one tap away on your phone.' : 'Open StudyTrack from your desktop, dock, or Start menu.';
    dialog.querySelector('.pwa-install-steps').innerHTML = ios
      ? '<ol><li>Open this site in Safari.</li><li>Tap the <strong>Share</strong> button (or open the browser menu, then Share).</li><li>Choose <strong>Add to Home Screen</strong>. Keep <strong>Open as Web App</strong> enabled if shown, then tap <strong>Add</strong>.</li></ol>'
      : android
        ? '<ol><li>Open this site in <strong>Chrome</strong> or <strong>Samsung Internet</strong>.</li><li>Open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Confirm the installation, then open the StudyTrack icon.</li></ol>'
        : '<ol><li>Open this site in <strong>Chrome</strong> or <strong>Edge</strong>.</li><li>Click the install icon in the address bar, or open the browser menu and look for <strong>Install StudyTrack</strong> / <strong>Install this site as an app</strong>.</li><li>On a Mac with Safari, choose <strong>File → Add to Dock</strong>.</li></ol>';
    if (!dialog.open) dialog.showModal();
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    updateButtons();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    installPrompt = null;
    if (dialog?.open) dialog.close();
    updateButtons();
  });
  document.addEventListener('click', async event => {
    const button = event.target.closest?.('[data-install-app]');
    if (!button || button.disabled || prompting || installed) return;
    if (!installPrompt) return instructions();
    const prompt = installPrompt;
    installPrompt = null;
    prompting = true;
    updateButtons();
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      instructions();
    } finally {
      prompting = false;
      updateButtons();
    }
  });
  updateButtons();
  new MutationObserver(updateButtons).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', updateButtons);
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
      // Browser install guidance remains available if registration is unsupported.
    });
  }
})();
