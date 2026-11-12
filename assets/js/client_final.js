(() => {
  const history = document.querySelector('.controls .history');
  const legal = document.querySelector('#legalDialog .detail-content');
  if (history && legal) legal.prepend(history);
})();
