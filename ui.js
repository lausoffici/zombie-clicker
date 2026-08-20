(function () {
  'use strict';

  var state = null;

  function updateDisplay() {
    var brainsEl = document.getElementById('brains');
    var bpsEl = document.getElementById('bps');
    if (brainsEl) {
      brainsEl.textContent = Game.formatNumber(Math.floor(state.brains));
    }
    if (bpsEl) {
      bpsEl.textContent = Game.formatNumber(Game.getBrainsPerSecond(state)) + ' cerebros/s';
    }
  }

  function handleClick() {
    Game.click(state);
    updateDisplay();
  }

  function init() {
    state = Game.createState();

    var zombieBtn = document.getElementById('zombie-btn');
    if (zombieBtn) {
      zombieBtn.addEventListener('click', handleClick);
    }

    updateDisplay();

    setInterval(function () {
      Game.tick(state, 0.1);
      updateDisplay();
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
