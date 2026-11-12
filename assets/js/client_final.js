(() => {
  const history = document.querySelector('.controls .history');
  const legal = document.querySelector('#legalDialog .detail-content');
  if (history && legal) legal.prepend(history);

  const control = document.getElementById('fullscreenControl');
  const button = document.getElementById('fullscreenToggle');
  const label = document.getElementById('fullscreenLabel');
  const message = document.getElementById('fullscreenMessage');
  if (!control || !button || !document.fullscreenEnabled || !document.documentElement.requestFullscreen) return;
  control.hidden = false;

  function syncFullscreen() {
    const active = !!document.fullscreenElement;
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Sair da tela cheia' : 'Entrar em tela cheia');
    button.title = active ? 'Sair da tela cheia (Esc)' : 'Entrar em tela cheia';
    label.textContent = active ? 'Sair' : 'Tela cheia';
  }

  button.addEventListener('click', async () => {
    button.disabled = true;
    message.hidden = true;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      message.textContent = 'O navegador não permitiu alterar o modo de tela cheia.';
      message.hidden = false;
    } finally {
      button.disabled = false;
      syncFullscreen();
    }
  });
  document.addEventListener('fullscreenchange', syncFullscreen);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.fullscreenElement && !document.querySelector('dialog[open]')) {
      document.exitFullscreen().catch(syncFullscreen);
    }
  });
  syncFullscreen();
})();
