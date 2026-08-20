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
    updateShopButtons();
  }

  function updateShopButtons() {
    var container = document.getElementById('shop-generators');
    if (!container) return;
    for (var i = 0; i < container.children.length; i++) {
      var btn = container.children[i];
      var id = btn.getAttribute('data-gen-id');
      if (!id) continue;
      var cost = Game.getGeneratorCost(state, id);
      var count = state.generators[id] || 0;
      var costEl = btn.querySelector('.gen-cost');
      var countEl = btn.querySelector('.gen-count');
      if (costEl) costEl.textContent = Game.formatNumber(Math.ceil(cost)) + ' 🧠';
      if (countEl) countEl.textContent = 'x' + count;
      btn.disabled = state.brains < cost;
    }
  }

  function renderShop() {
    var container = document.getElementById('shop-generators');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < Game.GENERATORS.length; i++) {
      var gen = Game.GENERATORS[i];
      var btn = document.createElement('button');
      btn.className = 'shop-item';
      btn.setAttribute('data-gen-id', gen.id);
      btn.type = 'button';

      var nameEl = document.createElement('div');
      nameEl.className = 'gen-name';
      nameEl.textContent = gen.name;

      var descEl = document.createElement('div');
      descEl.className = 'gen-desc';
      descEl.textContent = gen.desc;

      var metaRow = document.createElement('div');
      metaRow.className = 'gen-meta';

      var costEl = document.createElement('span');
      costEl.className = 'gen-cost';
      costEl.textContent = Game.formatNumber(Math.ceil(Game.getGeneratorCost(state, gen.id))) + ' 🧠';

      var countEl = document.createElement('span');
      countEl.className = 'gen-count';
      countEl.textContent = 'x' + (state.generators[gen.id] || 0);

      metaRow.appendChild(costEl);
      metaRow.appendChild(countEl);

      btn.appendChild(nameEl);
      btn.appendChild(descEl);
      btn.appendChild(metaRow);

      (function (genId) {
        btn.addEventListener('click', function () {
          if (Game.buyGenerator(state, genId)) {
            updateDisplay();
          }
        });
      })(gen.id);

      container.appendChild(btn);
    }
    updateShopButtons();
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

    renderShop();
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
