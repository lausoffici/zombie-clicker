(function () {
  'use strict';

  var state = null;
  var lastTick = 0;
  var tickInterval = null;
  var saveInterval = null;

  function showToast(message, type) {
    if (type === undefined) type = 'info';
    var container = document.getElementById('toast-container');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('toast-out');
      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

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
      btn.innerHTML =
        '<div class="gen-name">' + gen.name + '</div>' +
        '<div class="gen-desc">' + gen.desc + '</div>' +
        '<div class="gen-meta">' +
        '<span class="gen-cost"></span>' +
        '<span class="gen-count"></span>' +
        '</div>';
      btn.addEventListener('click', function (e) {
        var id = e.currentTarget.getAttribute('data-gen-id');
        if (Game.buyGenerator(state, id)) {
          showToast('Compraste ' + gen.name + '!', 'success');
          updateDisplay();
        } else {
          showToast('No tienes suficientes cerebros.', 'error');
        }
      });
      container.appendChild(btn);
    }
  }

  function renderUpgrades() {
    var container = document.getElementById('shop-upgrades');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < Game.UPGRADES.length; i++) {
      var up = Game.UPGRADES[i];
      var btn = document.createElement('button');
      btn.className = 'shop-item';
      btn.setAttribute('data-up-id', up.id);
      btn.innerHTML =
        '<div class="up-name">' + up.name + '</div>' +
        '<div class="up-desc">' + up.desc + '</div>' +
        '<div class="up-meta">' +
        '<span class="up-cost"></span>' +
        '</div>';
      btn.addEventListener('click', function (e) {
        var id = e.currentTarget.getAttribute('data-up-id');
        if (Game.buyUpgrade(state, id)) {
          showToast('Mejora comprada: ' + up.name + '!', 'success');
          updateDisplay();
        } else {
          showToast('No tienes suficientes cerebros.', 'error');
        }
      });
      container.appendChild(btn);
    }
  }

  function spawnClickFloat(x, y, amount) {
    var layer = document.getElementById('click-float-layer');
    if (!layer) return;
    var el = document.createElement('div');
    el.className = 'click-float';
    el.textContent = '+' + Game.formatNumber(amount);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    layer.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 900);
  }

  function handleZombieClick(e) {
    var power = Game.click(state);
    var layer = document.getElementById('click-float-layer');
    var rect = layer ? layer.getBoundingClientRect() : null;
    var x = e.clientX - (rect ? rect.left : 0);
    var y = e.clientY - (rect ? rect.top : 0);
    spawnClickFloat(x, y, power);
    updateDisplay();
  }

  function tick() {
    var now = Date.now();
    var dt = (now - lastTick) / 1000;
    lastTick = now;
    if (dt <= 0) dt = 0;
    if (dt > 5) dt = 5;
    var bps = Game.getBrainsPerSecond(state);
    if (bps > 0) {
      var gain = bps * dt;
      state.brains += gain;
      state.totalBrains += gain;
    }
    updateDisplay();
  }

  function saveGame() {
    Game.save(state);
  }

  function init() {
    var loaded = Game.load();
    if (loaded) {
      state = loaded;
      showToast('Partida cargada.', 'info');
    } else {
      state = {
        brains: 0,
        totalBrains: 0,
        clicks: 0,
        generators: {},
        upgrades: {}
      };
    }

    renderShop();
    renderUpgrades();
    updateDisplay();

    var zombieBtn = document.getElementById('zombie-btn');
    if (zombieBtn) {
      zombieBtn.addEventListener('click', handleZombieClick);
    }

    lastTick = Date.now();
    tickInterval = setInterval(tick, 100);
    saveInterval = setInterval(saveGame, 15000);

    window.addEventListener('beforeunload', function () {
      saveGame();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
