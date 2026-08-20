(function () {
  'use strict';

  var state = null;
  var SAVE_KEY = 'zombie-clicker-save';

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
    updateUpgradeButtons();
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

  function updateUpgradeButtons() {
    var container = document.getElementById('shop-upgrades');
    if (!container) return;
    for (var i = 0; i < container.children.length; i++) {
      var btn = container.children[i];
      var id = btn.getAttribute('data-up-id');
      if (!id) continue;
      var up = null;
      for (var j = 0; j < Game.UPGRADES.length; j++) {
        if (Game.UPGRADES[j].id === id) {
          up = Game.UPGRADES[j];
          break;
        }
      }
      if (!up) continue;
      var costEl = btn.querySelector('.up-cost');
      if (costEl) costEl.textContent = Game.formatNumber(Math.ceil(up.cost)) + ' 🧠';
      btn.disabled = state.brains < up.cost;
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

  function renderUpgrades() {
    var container = document.getElementById('shop-upgrades');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < Game.UPGRADES.length; i++) {
      var up = Game.UPGRADES[i];
      if (state.upgrades.indexOf(up.id) !== -1) continue;

      var btn = document.createElement('button');
      btn.className = 'shop-item';
      btn.setAttribute('data-up-id', up.id);
      btn.type = 'button';

      var nameEl = document.createElement('div');
      nameEl.className = 'up-name';
      nameEl.textContent = up.name;

      var descEl = document.createElement('div');
      descEl.className = 'up-desc';
      descEl.textContent = up.desc;

      var metaRow = document.createElement('div');
      metaRow.className = 'up-meta';

      var costEl = document.createElement('span');
      costEl.className = 'up-cost';
      costEl.textContent = Game.formatNumber(Math.ceil(up.cost)) + ' 🧠';

      metaRow.appendChild(costEl);

      btn.appendChild(nameEl);
      btn.appendChild(descEl);
      btn.appendChild(metaRow);

      (function (upId) {
        btn.addEventListener('click', function () {
          if (Game.buyUpgrade(state, upId)) {
            renderUpgrades();
            updateDisplay();
          }
        });
      })(up.id);

      container.appendChild(btn);
    }
    updateUpgradeButtons();
  }

  function handleClick() {
    Game.click(state);
    updateDisplay();
  }

  function saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, Game.serialize(state));
    } catch (e) {
      // localStorage puede no estar disponible; ignoramos el error
    }
  }

  function loadGame() {
    try {
      var saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        return Game.deserialize(saved);
      }
    } catch (e) {
      // ignoramos errores de localStorage
    }
    return Game.createState();
  }

  function init() {
    state = loadGame();

    var zombieBtn = document.getElementById('zombie-btn');
    if (zombieBtn) {
      zombieBtn.addEventListener('click', handleClick);
    }

    renderShop();
    renderUpgrades();
    updateDisplay();

    setInterval(function () {
      Game.tick(state, 0.1);
      updateDisplay();
    }, 100);

    setInterval(saveGame, 10000);

    window.addEventListener('beforeunload', saveGame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
