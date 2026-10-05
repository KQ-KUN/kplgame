(() => {
  for (const trigger of document.querySelectorAll('[data-panel]')) {
    const panel = document.getElementById(trigger.dataset.panel);
    const close = panel?.querySelector('.close-panel');
    if (!panel || !close) continue;
    const hidePanel = () => {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    };
    // Contact information must never make the rest of the homepage inert.
    trigger.addEventListener('click', () => {
      if (!panel.hidden) return hidePanel();
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      close.focus();
    });
    close.addEventListener('click', hidePanel);
    panel.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      hidePanel();
    });
  }
})();
