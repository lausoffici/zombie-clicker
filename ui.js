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
      if (state.brains < cost) {
        btn.classList.add('disabled');
      } else {
        btn.classList.remove('disabled');
      }
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
      if (state.brains < up.cost) {
        btn.classList.add('disabled');
      } else {
        btn.classList.remove('disabled');
      }
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

      var buyRow = document.createElement('div');
      buyRow.className = 'buy-row';

      var btn1 = document.createElement('button');
      btn1.className = 'buy-btn buy-x1';
      btn1.type = 'button';
      btn1.textContent = 'x1';
      (function (genId) {
        btn1.addEventListener('click', function (e) {
          e.stopPropagation();
          if (Game.buyGenerator(state, genId)) {
            updateDisplay();
          }
        });
      })(gen.id);

      var btn10 = document.createElement('button');
      btn10.className = 'buy-btn buy-x10';
      btn10.type = 'button';
      btn10.textContent = 'x10';
      (function (genId) {
        btn10.addEventListener('click', function (e) {
          e.stopPropagation();
          if (Game.buyGenerators(state, genId, 10) > 0) {
            updateDisplay();
          }
        });
      })(gen.id);

      var btnMax = document.createElement('button');
      btnMax.className = 'buy-btn buy-max';
      btnMax.type = 'button';
      btnMax.textContent = 'Max';
      (function (genId) {
        btnMax.addEventListener('click', function (e) {
          e.stopPropagation();
          var max = Game.getMaxAffordable(state, genId);
          if (max > 0) {
            Game.buyGenerators(state, genId, max);
            updateDisplay();
          }
        });
      })(gen.id);

      buyRow.appendChild(btn1);
      buyRow.appendChild(btn10);
      buyRow.appendChild(btnMax);

      btn.appendChild(nameEl);
      btn.appendChild(descEl);
      btn.appendChild(metaRow);
      btn.appendChild(buyRow);

      (function (genId) {
        btn.addEventListener('click', function (e) {
          if (e.target === btn) {
            if (Game.buyGenerator(state, genId)) {
              updateDisplay();
            }
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

  function spawnFloatText(x, y, text) {
    var layer = document.getElementById('click-float-layer');
    if (!layer) return;
    var el = document.createElement('div');
    el.className = 'click-float';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    layer.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 900);
  }

  function flashZombieEmoji() {
    var btn = document.getElementById('zombie-btn');
    if (!btn) return;
    var original = btn.textContent;
    btn.textContent = '💀 ¡Crack!';
    setTimeout(function () {
      btn.textContent = original;
    }, 150);
  }

  function handleClick(e) {
    var value = Game.getClickValue(state);
    Game.click(state);

    var layer = document.getElementById('click-float-layer');
    var x, y;
    if (layer) {
      var rect = layer.getBoundingClientRect();
      if (e && typeof e.clientX === 'number' && typeof e.clientY === 'number') {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      } else {
        x = rect.width / 2;
        y = rect.height / 2;
      }
      spawnFloatText(x, y, '+' + Game.formatNumber(value));
    }

    flashZombieEmoji();
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

  function showOfflineMessage(gained) {
    if (!gained || gained <= 0) return;
    var msg = 'Mientras dormías, tus zombies juntaron ' + Game.formatNumber(gained) + ' cerebros';
    try {
      alert(msg);
    } catch (e) {
      // alert puede no estar disponible; ignoramos el error
    }
  }

  function init() {
    state = loadGame();

    // Progreso offline: si hay un save existente, calcular segundos desde lastSaved
    var now = Date.now();
    var elapsedSeconds = 0;
    if (state && typeof state.lastSaved === 'number' && isFinite(state.lastSaved)) {
      elapsedSeconds = (now - state.lastSaved) / 1000;
      if (elapsedSeconds > 0) {
        var gained = Game.applyOfflineProgress(state, elapsedSeconds);
        if (gained > 0) {
          showOfflineMessage(gained);
        }
      }
    }

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
