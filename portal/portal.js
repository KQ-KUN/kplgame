(() => {
  for (const trigger of document.querySelectorAll('[data-panel]')) {
    const panel = document.getElementById(trigger.dataset.panel);
    if (!(panel instanceof HTMLDialogElement)) continue;
    trigger.addEventListener('click', () => panel.showModal());
    // These informational panels have one control; keep Tab on the close button.
    panel.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      event.preventDefault();
      panel.querySelector('.close-panel').focus();
    });
    // Native dialog handles Escape; explicitly restore the trigger after closing.
    panel.addEventListener('close', () => trigger.focus());
  }
})();
