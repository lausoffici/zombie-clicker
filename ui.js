(function () {
  "use strict";

  const SAVE_KEY = "zombieClickerSave";
  const OFFLINE_CAP_SECONDS = 8 * 3600; // 8 horas por defecto

  let state = null;
  let lastTickTime = null;
  let autoClickInterval = null;
  let goldenBrainTimer = null;
  let bossTimer = null;
  let bossActive = false;
  let bossMultiplier = 1;

  // ---------- Utilidades ----------
  function $(id) { return document.getElementById(id); }

  function formatNumber(n) {
    if (typeof Game !== "undefined" && Game.formatNumber) return Game.formatNumber(n);
    if (n < 1000) return Math.floor(n).toString();
    if (n < 1e6) return (n / 1e3).toFixed(1) + "K";
    if (n < 1e9) return (n / 1e6).toFixed(1) + "M";
    if (n < 1e12) return (n / 1e9).toFixed(1) + "B";
    return (n / 1e12).toFixed(1) + "T";
  }

  function showToast(message, type) {
    const container = $("toast-container");
    if (!container) return;
    const el = document.createElement("div");
    el.className = "toast " + (type || "info");
    el.textContent = message;
    container.appendChild(el);
    setTimeout(function () {
      el.classList.add("toast-out");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 3000);
  }

  // ---------- Persistencia ----------
  function saveGame() {
    if (!state) return;
    state.lastSaved = Date.now();
    try {
      const text = Game.serialize(state);
      localStorage.setItem(SAVE_KEY, text);
    } catch (e) { /* ignore */ }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        state = Game.deserialize(raw);
      }
    } catch (e) { /* ignore */ }
    if (!state) state = Game.createState();
    // Asegurar estructura de prestige
    if (!state.prestige) {
      state.prestige = { souls: 0, totalSoulsEarned: 0, upgrades: [] };
    }
    if (!Array.isArray(state.prestige.upgrades)) state.prestige.upgrades = [];
    if (!Array.isArray(state.upgrades)) state.upgrades = [];
    if (!Array.isArray(state.achievements)) state.achievements = [];
    if (!state.generators) state.generators = {};
    if (!state.startedAt) state.startedAt = Date.now();
  }

  function resetGame() {
    if (typeof confirm === "function" && !confirm("¿Seguro que quieres reiniciar TODO el progreso?")) return;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    state = Game.createState();
    renderAll();
    showToast("Progreso reiniciado", "info");
  }

  // ---------- Click ----------
  function handleClick(event) {
    if (!state) return;
    const value = Game.click(state);
    if (event && event.clientX !== undefined) {
      spawnFloatingText(event.clientX, event.clientY, "+" + formatNumber(value));
    }
    renderScore();
    renderStats();
  }

  function spawnFloatingText(x, y, text) {
    const el = document.createElement("div");
    el.className = "floating-text";
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 800);
  }

  // ---------- Compras ----------
  function buyGenerator(id) {
    if (!state) return;
    const ok = Game.buyGenerator(state, id);
    if (ok) {
      renderGenerators();
      renderScore();
      renderStats();
    }
  }

  function buyUpgrade(id) {
    if (!state) return;
    const ok = Game.buyUpgrade(state, id);
    if (ok) {
      renderUpgrades();
      renderScore();
      renderStats();
    }
  }

  function buyPrestigeUpgrade(id) {
    if (!state) return;
    const ok = Game.buyPrestigeUpgrade(state, id);
    if (ok) {
      renderPrestige();
      showToast("Mejora de prestigio comprada", "success");
    }
  }

  function doPrestige() {
    if (!state) return;
    const gain = Game.getPrestigeGain(state);
    if (gain <= 0) {
      showToast("Necesitas más cerebros totales para prestigiar", "warn");
      return;
    }
    if (typeof confirm === "function" && !confirm("¿Prestigiar? Perderás cerebros, generadores y mejoras, pero ganarás " + gain + " almas.")) return;
    state = Game.prestige(state);
    saveGame();
    renderAll();
    showToast("¡Prestigiaste! + " + gain + " almas", "success");
  }

  // ---------- Render ----------
  function renderScore() {
    if (!state) return;
    const scoreEl = $("stat-brains");
    const bpsEl = $("stat-bps");
    const clickPowerEl = $("click-value");
    if (scoreEl) scoreEl.textContent = formatNumber(state.brains);
    if (bpsEl) bpsEl.textContent = formatNumber(Game.getBrainsPerSecond(state)) + " /s";
    if (clickPowerEl) clickPowerEl.textContent = "+" + formatNumber(Game.getClickValue(state)) + " por click";
  }

  function renderStats() {
    if (!state) return;
    const stats = Game.getStats(state);
    const statClicksEl = $("stat-clicks");
    const statTotalEl = $("stat-total");
    if (statClicksEl) statClicksEl.textContent = formatNumber(stats.totalClicks);
    if (statTotalEl) statTotalEl.textContent = formatNumber(stats.totalBrainsEarned);

    const statsContent = $("stats-content");
    if (statsContent) {
      statsContent.innerHTML =
        '<div class="stat"><span>Total cerebros ganados:</span> <span>' + formatNumber(stats.totalBrainsEarned) + '</span></div>' +
        '<div class="stat"><span>Total clicks:</span> <span>' + formatNumber(stats.totalClicks) + '</span></div>' +
        '<div class="stat"><span>Mejor BPS:</span> <span>' + formatNumber(stats.bestBps) + '</span></div>' +
        '<div class="stat"><span>Tiempo jugado:</span> <span>' + formatTime(stats.elapsedSeconds) + '</span></div>' +
        '<div class="stat"><span>Generadores totales:</span> <span>' + formatNumber(stats.generatorsOwned) + '</span></div>' +
        '<div class="stat"><span>Multiplicador global:</span> <span>x' + Game.getGlobalMultiplier(state).toFixed(2) + '</span></div>' +
        '<div class="stat"><span>Almas:</span> <span>' + formatNumber(state.prestige.souls) + '</span></div>' +
        '<div class="stat"><span>Almas totales ganadas:</span> <span>' + formatNumber(state.prestige.totalSoulsEarned) + '</span></div>';
    }
  }

  function formatTime(seconds) {
    if (seconds < 60) return Math.floor(seconds) + "s";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m " + Math.floor(seconds % 60) + "s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h + "h " + m + "m";
  }

  function renderGenerators() {
    if (!state) return;
    const container = $("list-generators");
    if (!container) return;
    container.innerHTML = "";
    Game.GENERATORS.forEach(function (gen) {
      const cost = Game.getGeneratorCost(state, gen.id);
      const count = state.generators[gen.id] || 0;
      const canBuy = state.brains >= cost;
      const div = document.createElement("div");
      div.className = "gen-item" + (canBuy ? "" : " disabled");
      div.innerHTML =
        '<div class="gen-info">' +
          '<span class="gen-icon">' + gen.icon + '</span>' +
          '<div>' +
            '<div class="gen-name">' + gen.name + (count > 0 ? ' <span class="gen-count">x' + count + '</span>' : '') + '</div>' +
            '<div class="gen-desc">' + gen.desc + '</div>' +
          '</div>' +
        '</div>' +
        '<span class="gen-cost">' + formatNumber(cost) + '</span>';
      div.addEventListener("click", function () { buyGenerator(gen.id); });
      container.appendChild(div);
    });
  }

  function renderUpgrades() {
    if (!state) return;
    const container = $("list-upgrades");
    if (!container) return;
    container.innerHTML = "";
    let any = false;
    Game.UPGRADES.forEach(function (upg) {
      if (state.upgrades.indexOf(upg.id) !== -1) return;
      any = true;
      const canBuy = state.brains >= upg.cost;
      const div = document.createElement("div");
      div.className = "upg-item" + (canBuy ? "" : " disabled");
      div.innerHTML =
        '<div class="upg-info">' +
          '<span class="upg-icon">' + upg.icon + '</span>' +
          '<div>' +
            '<div class="upg-name">' + upg.name + '</div>' +
            '<div class="upg-desc">' + upg.desc + '</div>' +
          '</div>' +
        '</div>' +
        '<span class="upg-cost">' + formatNumber(upg.cost) + '</span>';
      div.addEventListener("click", function () { buyUpgrade(upg.id); });
      container.appendChild(div);
    });
    if (!any) {
      container.innerHTML = '<div class="upg-item disabled"><span class="upg-desc">¡Todas las mejoras compradas!</span></div>';
    }
  }

  function renderAchievements() {
    if (!state) return;
    const container = $("achievements-list");
    if (!container) return;
    container.innerHTML = "";
    Game.ACHIEVEMENTS.forEach(function (ach) {
      const unlocked = state.achievements.indexOf(ach.id) !== -1;
      const div = document.createElement("div");
      div.className = "ach-item" + (unlocked ? " unlocked" : " locked");
      div.innerHTML =
        '<div class="ach-info">' +
          '<div class="ach-name">' + (unlocked ? "✅ " : "🔒 ") + ach.name + '</div>' +
          '<div class="ach-desc">' + ach.desc + '</div>' +
        '</div>' +
        '<span class="ach-bonus">+' + (ach.bonus * 100).toFixed(0) + '%</span>';
      container.appendChild(div);
    });
  }

  function renderPrestige() {
    if (!state) return;
    const info = $("prestige-info");
    if (info) {
      const gain = Game.getPrestigeGain(state);
      info.innerHTML =
        '<div class="prestige-stat"><span>Almas actuales:</span> <span>' + formatNumber(state.prestige.souls) + '</span></div>' +
        '<div class="prestige-stat"><span>Almas al prestigiar:</span> <span>' + formatNumber(gain) + '</span></div>' +
        '<div class="prestige-stat"><span>Almas totales ganadas:</span> <span>' + formatNumber(state.prestige.totalSoulsEarned) + '</span></div>' +
        '<div class="prestige-stat"><span>Multiplicador global:</span> <span>x' + Game.getGlobalMultiplier(state).toFixed(2) + '</span></div>';
    }

    const shop = $("prestige-shop");
    if (shop) {
      shop.innerHTML = "";
      Game.PRESTIGE_UPGRADES.forEach(function (pu) {
        const owned = state.prestige.upgrades.indexOf(pu.id) !== -1;
        const canBuy = !owned && state.prestige.souls >= pu.cost;
        const div = document.createElement("div");
        div.className = "prestige-item" + (owned ? " owned" : (canBuy ? "" : " disabled"));
        div.innerHTML =
          '<div class="prestige-info">' +
            '<div class="prestige-name">' + pu.name + '</div>' +
            '<div class="prestige-desc">' + pu.desc + '</div>' +
          '</div>' +
          '<span class="prestige-cost">' + (owned ? "Comprado" : formatNumber(pu.cost) + " almas") + '</span>';
        if (!owned) {
          div.addEventListener("click", function () { buyPrestigeUpgrade(pu.id); });
        }
        shop.appendChild(div);
      });
    }
  }

  function renderAll() {
    renderScore();
    renderStats();
    renderGenerators();
    renderUpgrades();
    renderAchievements();
    renderPrestige();
  }

  // ---------- Eventos especiales ----------
  function spawnGoldenBrain() {
    const el = $("golden-brain");
    if (!el) return;
    el.classList.add("visible");
    el.classList.remove("popping");
    el.style.left = (10 + Math.random() * 80) + "%";
    el.style.top = (10 + Math.random() * 70) + "%";

    const timeout = setTimeout(function () {
      el.classList.remove("visible");
      goldenBrainTimer = null;
    }, 8000);

    el.onclick = function () {
      clearTimeout(timeout);
      el.classList.remove("visible");
      el.classList.add("popping");
      goldenBrainTimer = null;
      if (state) {
        const reward = Math.max(100, Math.floor(Game.getBrainsPerSecond(state) * 30));
        state.brains += reward;
        state.totalBrainsEarned += reward;
        showToast("🧠 Cerebro dorado: +" + formatNumber(reward) + " cerebros", "success");
        renderScore();
        renderStats();
      }
    };
  }

  function scheduleGoldenBrain() {
    if (goldenBrainTimer) return;
    const delay = 60000 + Math.random() * 120000; // 1-3 min
    goldenBrainTimer = setTimeout(function () {
      goldenBrainTimer = null;
      spawnGoldenBrain();
      scheduleGoldenBrain();
    }, delay);
  }

  function spawnBoss() {
    const el = $("horde-boss");
    if (!el) return;
    bossActive = true;
    bossMultiplier = 5;
    el.classList.add("visible");
    showToast("👹 ¡Jefe de la horda apareció! x5 producción por 30s", "warn");

    const timeout = setTimeout(function () {
      el.classList.remove("visible");
      bossActive = false;
      bossMultiplier = 1;
      bossTimer = null;
      showToast("El jefe se fue", "info");
    }, 30000);

    el.onclick = function () {
      clearTimeout(timeout);
      el.classList.remove("visible");
      bossActive = false;
      bossMultiplier = 1;
      bossTimer = null;
      if (state) {
        const reward = Math.max(500, Math.floor(Game.getBrainsPerSecond(state) * 60));
        state.brains += reward;
        state.totalBrainsEarned += reward;
        showToast("💀 ¡Derrotaste al jefe! +" + formatNumber(reward) + " cerebros", "success");
        renderScore();
        renderStats();
      }
    };
  }

  function scheduleBoss() {
    if (bossTimer) return;
    const delay = 180000 + Math.random() * 180000; // 3-6 min
    bossTimer = setTimeout(function () {
      bossTimer = null;
      spawnBoss();
      scheduleBoss();
    }, delay);
  }

  // ---------- Auto-click ----------
  function setupAutoClick() {
    if (autoClickInterval) {
      clearInterval(autoClickInterval);
      autoClickInterval = null;
    }
    if (state && state.prestige.upgrades.indexOf("autoClick") !== -1) {
      autoClickInterval = setInterval(function () {
        if (!state) return;
        const value = Game.click(state);
        const zombieEl = $("zombie-btn") || $("zombie");
        if (zombieEl) {
          zombieEl.classList.add("auto-click-pulse");
          setTimeout(function () { zombieEl.classList.remove("auto-click-pulse"); }, 200);
        }
        renderScore();
        renderStats();
      }, 2000);
    }
  }

  // ---------- Tabs ----------
  function setupTabs() {
    const tabs = [
      { btn: "btn-tab-game", panel: "tab-game" },
      { btn: "btn-tab-achievements", panel: "tab-achievements" },
      { btn: "btn-tab-prestige", panel: "tab-prestige" },
      { btn: "btn-tab-stats", panel: "tab-stats" }
    ];
    tabs.forEach(function (t) {
      const btn = $(t.btn);
      const panel = $(t.panel);
      if (!btn || !panel) return;
      btn.addEventListener("click", function () {
        tabs.forEach(function (other) {
          const otherBtn = $(other.btn);
          const otherPanel = $(other.panel);
          if (otherBtn) otherBtn.classList.remove("active");
          if (otherPanel) otherPanel.classList.remove("active");
        });
        btn.classList.add("active");
        panel.classList.add("active");
      });
    });
    // Activar la primera por defecto
    const firstBtn = $("btn-tab-game");
    const firstPanel = $("tab-game");
    if (firstBtn) firstBtn.classList.add("active");
    if (firstPanel) firstPanel.classList.add("active");
  }

  // ---------- Loop principal ----------
  function gameLoop() {
    if (!state) return;
    const now = Date.now();
    if (lastTickTime === null) {
      lastTickTime = now;
      return;
    }
    const dt = (now - lastTickTime) / 1000;
    lastTickTime = now;

    if (dt > 0) {
      Game.tick(state, dt);
      // Actualizar bestBps
      const bps = Game.getBrainsPerSecond(state);
      if (bps > (state.bestBps || 0)) state.bestBps = bps;
      // Check achievements
      const newAch = Game.checkAchievements(state);
      if (newAch && newAch.length > 0) {
        newAch.forEach(function (id) {
          const ach = Game.ACHIEVEMENTS.find(function (a) { return a.id === id; });
          if (ach) showToast("🏆 Logro: " + ach.name, "success");
        });
        renderAchievements();
      }
      renderScore();
      renderStats();
    }
  }

  // ---------- Init ----------
  function init() {
    loadGame();
    renderAll();
    setupTabs();
    setupAutoClick();

    // Click en zombi
    const zombieEl = $("big-button") || $("zombie-btn") || $("zombie");
    if (zombieEl) {
      zombieEl.addEventListener("click", handleClick);
    }

    // Botones de acción
    const btnSave = $("btn-save");
    if (btnSave) btnSave.addEventListener("click", function () {
      saveGame();
      showToast("Juego guardado", "info");
    });

    const btnReset = $("btn-reset");
    if (btnReset) btnReset.addEventListener("click", resetGame);

    const btnPrestige = $("btn-prestige");
    if (btnPrestige) btnPrestige.addEventListener("click", doPrestige);

    // Offline progress
    if (state.lastSaved) {
      const elapsed = (Date.now() - state.lastSaved) / 1000;
      if (elapsed > 60) {
        const cap = OFFLINE_CAP_SECONDS;
        const effective = Math.min(elapsed, cap);
        const gained = Game.applyOfflineProgress(state, effective);
        if (gained > 0) {
          showToast("🌙 Mientras estabas fuera ganaste " + formatNumber(gained) + " cerebros", "info");
        }
      }
    }

    // Eventos especiales
    scheduleGoldenBrain();
    scheduleBoss();

    // Loop
    setInterval(gameLoop, 100);
    setInterval(saveGame, 15000);

    // Guardar al cerrar
    window.addEventListener("beforeunload", saveGame);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  // Exponer para depuración
  if (typeof window !== "undefined") {
    window.ZombieClicker = {
      state: state,
      saveGame: saveGame,
      loadGame: loadGame,
      resetGame: resetGame,
      handleClick: handleClick,
      buyGenerator: buyGenerator,
      buyUpgrade: buyUpgrade,
      buyPrestigeUpgrade: buyPrestigeUpgrade,
      doPrestige: doPrestige,
      getBrainsPerSecond: function () { return state ? Game.getBrainsPerSecond(state) : 0; },
      getClickValue: function () { return state ? Game.getClickValue(state) : 0; },
      formatNumber: formatNumber
    };
  }
})();
