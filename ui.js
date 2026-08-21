(function () {
  "use strict";

  const SAVE_KEY = "zombieClickerSave";
  const OFFLINE_CAP_SECONDS = 8 * 3600;

  let state = null;
  let lastTickTime = null;
  let autoClickInterval = null;
  let goldenBrainTimer = null;
  let bossTimer = null;
  let bossActive = false;
  let bossMultiplier = 1;
  let generatorQty = 1; // 1, 10, 0=max
  let prevAchievements = [];

  function $(id) { return document.getElementById(id); }

  function formatNumber(n) {
    if (typeof Game !== "undefined" && Game.formatNumber) return Game.formatNumber(n);
    if (n < 1000) return Math.floor(n).toString();
    if (n < 1e6) return (n / 1e3).toFixed(1) + "K";
    if (n < 1e9) return (n / 1e6).toFixed(1) + "M";
    if (n < 1e12) return (n / 1e9).toFixed(1) + "B";
    return (n / 1e12).toFixed(1) + "T";
  }

  function formatTime(seconds) {
    if (seconds < 60) return Math.floor(seconds) + "s";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m " + Math.floor(seconds % 60) + "s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h + "h " + m + "m";
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

  function saveGame() {
    if (!state) return;
    state.lastSaved = Date.now();
    try { localStorage.setItem(SAVE_KEY, Game.serialize(state)); } catch (e) {}
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) state = Game.deserialize(raw);
    } catch (e) {}
    if (!state) state = Game.createState();
    if (!state.prestige) state.prestige = { souls: 0, totalSoulsEarned: 0, upgrades: [] };
    if (!Array.isArray(state.prestige.upgrades)) state.prestige.upgrades = [];
    if (!Array.isArray(state.upgrades)) state.upgrades = [];
    if (!Array.isArray(state.achievements)) state.achievements = [];
    if (!state.generators) state.generators = {};
    if (!state.startedAt) state.startedAt = Date.now();
    if (!state.cosmetics || !Array.isArray(state.cosmetics.owned) || !state.cosmetics.equipped) {
      state.cosmetics = {
        owned: ["skin-classic", "aura-none", "bg-void"],
        equipped: { skin: "skin-classic", aura: "aura-none", bg: "bg-void" }
      };
    }
    prevAchievements = state.achievements.slice();
  }

  function resetGame() {
    if (typeof confirm === "function" && !confirm("¿Seguro que quieres reiniciar TODO el progreso?")) return;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    state = Game.createState();
    prevAchievements = [];
    renderAll();
    showToast("Progreso reiniciado", "info");
  }

  function handleClick(event) {
    if (!state) return;
    const value = Game.click(state);
    spawnFloatingText(event.clientX, event.clientY, "+" + formatNumber(value));
    pulseZombie();
    renderHeader();
    renderStats();
  }

  function pulseZombie() {
    const btn = $("zombie-btn");
    if (!btn) return;
    btn.classList.remove("popping");
    void btn.offsetWidth;
    btn.classList.add("popping");
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

  function buyGenerator(id) {
    if (!state) return;
    const qty = generatorQty === 0 ? Game.getMaxAffordable(state, id) : generatorQty;
    const bought = Game.buyGenerators(state, id, qty);
    if (bought > 0) {
      renderShop();
      renderHeader();
      renderStats();
      const card = document.querySelector('[data-gen-id="' + id + '"]');
      if (card) {
        card.classList.remove("flash");
        void card.offsetWidth;
        card.classList.add("flash");
        const countEl = card.querySelector(".item-count");
        if (countEl) {
          countEl.classList.remove("count-pop");
          void countEl.offsetWidth;
          countEl.classList.add("count-pop");
        }
      }
    }
  }

  function buyUpgrade(id) {
    if (!state) return;
    if (Game.buyUpgrade(state, id)) {
      renderShop();
      renderHeader();
      renderStats();
      showToast("Mejora adquirida", "success");
    }
  }

  function buyCosmetic(id) {
    if (!state) return;
    if (Game.buyCosmetic(state, id)) {
      patchCosmetics();
      renderHeader();
      renderStats();
      applyCosmetics();
      saveGame();
      showToast("Cosmético comprado", "success");
    }
  }

  function equipCosmetic(id) {
    if (!state) return;
    if (Game.equipCosmetic(state, id)) {
      patchCosmetics();
      applyCosmetics();
      saveGame();
      showToast("Cosmético equipado", "success");
    }
  }

  function handleCosmeticClick(id) {
    if (!state) return;
    if (state.cosmetics.owned.indexOf(id) === -1) {
      buyCosmetic(id);
    } else {
      equipCosmetic(id);
    }
  }

  function applyCosmetics() {
    if (!state || !state.cosmetics) return;
    const card = $("clicker-card");
    const btn = $("zombie-btn");
    if (card) {
      card.setAttribute("data-skin", state.cosmetics.equipped.skin);
      card.setAttribute("data-bg", state.cosmetics.equipped.bg);
    }
    if (btn) {
      btn.setAttribute("data-aura", state.cosmetics.equipped.aura);
    }
  }

  function buyPrestigeUpgrade(id) {
    if (!state) return;
    if (Game.buyPrestigeUpgrade(state, id)) {
      renderPrestige();
      renderHeader();
      setupAutoClick();
      showToast("Mejora de almas comprada", "success");
    }
  }

  function doPrestige() {
    if (!state) return;
    const gain = Game.getPrestigeGain(state);
    if (gain <= 0) {
      showToast("Necesitas más cerebros totales para ascender", "warn");
      return;
    }
    if (typeof confirm === "function" && !confirm("¿Ascender? Perderás cerebros, generadores y mejoras, pero ganarás " + gain + " almas.")) return;
    state = Game.prestige(state);
    prevAchievements = state.achievements.slice();
    saveGame();
    setupAutoClick();
    renderAll();
    showToast("¡La horda renace! +" + gain + " almas", "success");
  }

  function setStatText(el, text) {
    if (!el) return;
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove("is-bump");
    void el.offsetWidth; // restart animation
    el.classList.add("is-bump");
  }

  function renderHeader() {
    if (!state) return;
    const brainsText = formatNumber(state.brains);
    const bpsText = formatNumber(Game.getBrainsPerSecond(state)) + "/s";
    setStatText($("stat-brains"), brainsText);
    setStatText($("stat-bps"), bpsText);
    setStatText($("hero-brains"), brainsText);
    setStatText($("hero-bps"), bpsText);
    setStatText($("stat-souls"), formatNumber(state.prestige.souls));
  }

  function renderClicker() {
    if (!state) return;
    const clickValueEl = $("click-value");
    if (clickValueEl) clickValueEl.textContent = "+" + formatNumber(Game.getClickValue(state)) + " por click";
  }

  function getBulkGeneratorCost(state, id, qty) {
    let n = qty;
    if (n === 0) n = Game.getMaxAffordable(state, id);
    if (n <= 0) return Game.getGeneratorCost(state, id);
    const fakeGens = {};
    for (const key in state.generators) {
      if (Object.prototype.hasOwnProperty.call(state.generators, key)) {
        fakeGens[key] = state.generators[key];
      }
    }
    const fake = { generators: fakeGens, prestige: state.prestige };
    let total = 0;
    for (let i = 0; i < n; i++) {
      const c = Game.getGeneratorCost(fake, id);
      if (!isFinite(c)) break;
      total += c;
      fakeGens[id] = (fakeGens[id] || 0) + 1;
    }
    return total;
  }

  function setupBuyQty() {
    const bar = $("buy-qty-bar");
    if (!bar || bar.getAttribute("data-wired") === "1") return;
    bar.setAttribute("data-wired", "1");
    bar.addEventListener("click", function (e) {
      const btn = e.target.closest ? e.target.closest(".qty-btn") : null;
      if (!btn) return;
      const q = Number(btn.getAttribute("data-qty"));
      if (q !== 0 && q !== 1 && q !== 10) return;
      generatorQty = q;
      const buttons = bar.querySelectorAll(".qty-btn");
      for (let i = 0; i < buttons.length; i++) {
        const b = buttons[i];
        if (Number(b.getAttribute("data-qty")) === generatorQty) b.classList.add("active");
        else b.classList.remove("active");
      }
      patchGenerators();
    });
  }

  function renderShop() {
    patchShop();
  }

  function patchShop() {
    patchGenerators();
    patchUpgrades();
    patchCosmetics();
  }

  function buildGeneratorCard(gen) {
    const div = document.createElement("div");
    div.setAttribute("data-gen-id", gen.id);
    div.innerHTML =
      '<span class="item-icon">' + gen.icon + '</span>' +
      '<div class="item-info">' +
        '<div class="item-name">' + gen.name + '</div>' +
        '<div class="item-desc">' + gen.desc + '</div>' +
      '</div>' +
      '<div class="item-meta">' +
        '<span class="item-cost">0</span>' +
        '<span class="item-count"></span>' +
      '</div>';
    div.addEventListener("click", function () { buyGenerator(gen.id); });
    return div;
  }

  function updateGeneratorCard(div, gen) {
    const qty = generatorQty === 0 ? Game.getMaxAffordable(state, gen.id) : generatorQty;
    const cost = getBulkGeneratorCost(state, gen.id, generatorQty);
    const count = state.generators[gen.id] || 0;
    const canBuy = qty > 0 && state.brains >= cost && isFinite(cost);
    const bpsEach = Game.getGeneratorBps(state, gen.id);
    div.className = "item-card" + (canBuy ? " affordable" : " disabled");
    const costEl = div.querySelector(".item-cost");
    const countEl = div.querySelector(".item-count");
    if (costEl) costEl.textContent = formatNumber(cost);
    if (countEl) countEl.textContent = "x" + count + " · " + formatNumber(bpsEach) + "/s";
  }

  function patchGenerators() {
    const container = $("shop-list-generators");
    if (!container || !state) return;
    const hasCards = container.querySelector("[data-gen-id]");
    if (!hasCards) {
      container.innerHTML = "";
      Game.GENERATORS.forEach(function (gen) {
        const div = buildGeneratorCard(gen);
        container.appendChild(div);
        updateGeneratorCard(div, gen);
      });
      return;
    }
    Game.GENERATORS.forEach(function (gen) {
      let div = container.querySelector('[data-gen-id="' + gen.id + '"]');
      if (!div) {
        div = buildGeneratorCard(gen);
        container.appendChild(div);
      }
      updateGeneratorCard(div, gen);
    });
  }

  function buildUpgradeCard(upg) {
    const div = document.createElement("div");
    div.setAttribute("data-upg-id", upg.id);
    div.innerHTML =
      '<span class="item-icon">' + upg.icon + '</span>' +
      '<div class="item-info">' +
        '<div class="item-name">' + upg.name + '</div>' +
        '<div class="item-desc">' + upg.desc + '</div>' +
      '</div>' +
      '<span class="item-cost">' + formatNumber(upg.cost) + '</span>';
    div.addEventListener("click", function () { buyUpgrade(upg.id); });
    return div;
  }

  function patchUpgrades() {
    const container = $("shop-list-upgrades");
    if (!container || !state) return;

    Game.UPGRADES.forEach(function (upg) {
      const existing = container.querySelector('[data-upg-id="' + upg.id + '"]');
      const owned = state.upgrades.indexOf(upg.id) !== -1;
      if (owned) {
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        return;
      }
      let div = existing;
      if (!div) {
        div = buildUpgradeCard(upg);
        container.appendChild(div);
      }
      const canBuy = state.brains >= upg.cost;
      div.className = "item-card" + (canBuy ? " affordable" : " disabled");
      const costEl = div.querySelector(".item-cost");
      if (costEl) costEl.textContent = formatNumber(upg.cost);
    });

    const empty = container.querySelector("[data-empty-upgrades]");
    let any = false;
    Game.UPGRADES.forEach(function (upg) {
      if (state.upgrades.indexOf(upg.id) === -1) any = true;
    });
    if (!any) {
      if (!empty) {
        const el = document.createElement("div");
        el.className = "item-card disabled";
        el.setAttribute("data-empty-upgrades", "1");
        el.innerHTML = '<span class="item-desc">¡Todas las mejoras compradas!</span>';
        container.appendChild(el);
      }
    } else if (empty && empty.parentNode) {
      empty.parentNode.removeChild(empty);
    }
  }

  function renderGenerators() { patchGenerators(); }
  function renderUpgrades() { patchUpgrades(); }
  function renderCosmetics() { patchCosmetics(); }

  function buildCosmeticCard(cos) {
    const div = document.createElement("div");
    div.setAttribute("data-cos-id", cos.id);
    div.innerHTML =
      '<span class="item-icon">' + (cos.icon || "🎨") + '</span>' +
      '<div class="item-info">' +
        '<div class="item-name">' + cos.name + '</div>' +
        '<div class="item-desc">' + (cos.slot === "skin" ? "Piel" : cos.slot === "aura" ? "Aura" : "Fondo") + '</div>' +
      '</div>' +
      '<span class="item-cost"></span>';
    div.addEventListener("click", function () { handleCosmeticClick(cos.id); });
    return div;
  }

  function updateCosmeticCard(div, cos) {
    const owned = state.cosmetics.owned.indexOf(cos.id) !== -1;
    const equipped = state.cosmetics.equipped[cos.slot] === cos.id;
    div.className = "item-card" + (equipped ? " owned" : (owned ? " affordable" : (state.brains >= cos.cost ? "affordable" : "disabled")));
    const costEl = div.querySelector(".item-cost");
    if (costEl) {
      if (equipped) {
        costEl.textContent = "Equipado";
      } else if (owned) {
        costEl.textContent = "Comprado";
      } else {
        costEl.textContent = formatNumber(cos.cost);
      }
    }
  }

  function patchCosmetics() {
    const container = $("shop-list-cosmetics");
    if (!container || !state) return;
    if (!state.cosmetics) return;
    Game.COSMETICS.forEach(function (cos) {
      let div = container.querySelector('[data-cos-id="' + cos.id + '"]');
      if (!div) {
        div = buildCosmeticCard(cos);
        container.appendChild(div);
      }
      updateCosmeticCard(div, cos);
    });
  }

  function renderAchievements(newlyUnlocked) {
    const container = $("achievements-list");
    if (!container || !state) return;
    const shineIds = newlyUnlocked || [];
    container.innerHTML = "";
    Game.ACHIEVEMENTS.forEach(function (ach) {
      const unlocked = state.achievements.indexOf(ach.id) !== -1;
      const div = document.createElement("div");
      div.className = "item-card ach-card" + (unlocked ? " unlocked" : " locked");
      div.setAttribute("data-ach-id", ach.id);
      div.innerHTML =
        '<span class="item-icon">' + (unlocked ? "✅" : "🔒") + '</span>' +
        '<div class="item-info">' +
          '<div class="item-name">' + ach.name + '</div>' +
          '<div class="item-desc">' + ach.desc + '</div>' +
        '</div>' +
        '<span class="ach-bonus">+' + (ach.bonus * 100).toFixed(0) + '%</span>';
      container.appendChild(div);
      if (shineIds.indexOf(ach.id) !== -1) {
        setTimeout(function () { div.classList.add("shine"); }, 10);
      }
    });
  }

  function renderPrestige() {
    const soulsEl = $("prestige-souls");
    const gainEl = $("prestige-gain");
    const multEl = $("prestige-multiplier");
    const btn = $("btn-prestige");
    if (!state) return;
    const gain = Game.getPrestigeGain(state);
    if (soulsEl) soulsEl.textContent = formatNumber(state.prestige.souls);
    if (gainEl) gainEl.textContent = formatNumber(gain);
    if (multEl) multEl.textContent = "x" + Game.getGlobalMultiplier(state).toFixed(2);
    if (btn) btn.disabled = gain <= 0;

    const shop = $("prestige-shop");
    if (!shop) return;
    shop.innerHTML = "";
    Game.PRESTIGE_UPGRADES.forEach(function (pu) {
      const owned = state.prestige.upgrades.indexOf(pu.id) !== -1;
      const canBuy = !owned && state.prestige.souls >= pu.cost;
      const div = document.createElement("div");
      div.className = "item-card" + (owned ? " owned" : (canBuy ? " affordable" : " disabled"));
      div.innerHTML =
        '<div class="item-info">' +
          '<div class="item-name">' + pu.name + '</div>' +
          '<div class="item-desc">' + pu.desc + '</div>' +
        '</div>' +
        '<span class="item-cost prestige-cost">' + (owned ? "Comprado" : formatNumber(pu.cost) + " almas") + '</span>';
      if (!owned) {
        div.addEventListener("click", function () { buyPrestigeUpgrade(pu.id); });
      }
      shop.appendChild(div);
    });
  }

  function renderStats() {
    if (!state) return;
    const stats = Game.getStats(state);
    const content = $("stats-content");
    if (!content) return;
    content.innerHTML =
      statRow("Cerebros totales", formatNumber(stats.totalBrainsEarned)) +
      statRow("Clicks totales", formatNumber(stats.totalClicks)) +
      statRow("Mejor BPS", formatNumber(stats.bestBps)) +
      statRow("Tiempo jugado", formatTime(stats.elapsedSeconds)) +
      statRow("Generadores", formatNumber(stats.generatorsOwned)) +
      statRow("Logros", state.achievements.length + "/" + Game.ACHIEVEMENTS.length) +
      statRow("Multiplicador", "x" + Game.getGlobalMultiplier(state).toFixed(2)) +
      statRow("Almas totales", formatNumber(state.prestige.totalSoulsEarned));
  }

  function statRow(label, value) {
    return '<div class="stat-row"><span>' + label + '</span><span>' + value + '</span></div>';
  }

  function renderAll() {
    renderHeader();
    renderClicker();
    renderShop();
    renderAchievements();
    renderPrestige();
    renderStats();
    applyCosmetics();
  }

  function setupShopTabs() {
    const tabs = [
      { btn: "shop-tab-generators", list: "shop-list-generators" },
      { btn: "shop-tab-upgrades", list: "shop-list-upgrades" },
      { btn: "shop-tab-cosmetics", list: "shop-list-cosmetics" }
    ];
    tabs.forEach(function (t) {
      const btn = $(t.btn);
      const list = $(t.list);
      if (!btn || !list) return;
      btn.addEventListener("click", function () {
        tabs.forEach(function (other) {
          const ob = $(other.btn);
          const ol = $(other.list);
          if (ob) ob.classList.remove("active");
          if (ol) ol.classList.add("hidden");
        });
        btn.classList.add("active");
        list.classList.remove("hidden");
      });
    });
  }

  function setupSideTabs() {
    const tabs = [
      { btn: "side-tab-achievements", panel: "side-panel-achievements" },
      { btn: "side-tab-prestige", panel: "side-panel-prestige" },
      { btn: "side-tab-stats", panel: "side-panel-stats" }
    ];
    tabs.forEach(function (t) {
      const btn = $(t.btn);
      const panel = $(t.panel);
      if (!btn || !panel) return;
      btn.addEventListener("click", function () {
        tabs.forEach(function (other) {
          const ob = $(other.btn);
          const op = $(other.panel);
          if (ob) ob.classList.remove("active");
          if (op) op.classList.remove("active");
        });
        btn.classList.add("active");
        panel.classList.add("active");
      });
    });
  }

  function setupMobileNav() {
    const mobileTabs = document.querySelectorAll(".mobile-tab");
    const clicker = $("col-clicker");
    const side = $("col-side");
    const shop = $("col-shop");
    mobileTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const target = tab.getAttribute("data-mobile");
        mobileTabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");

        if (target === "game") {
          if (clicker) clicker.classList.add("active");
          if (shop) shop.classList.add("active");
          if (side) side.classList.remove("active");
        } else {
          if (clicker) clicker.classList.remove("active");
          if (shop) shop.classList.remove("active");
          if (side) side.classList.add("active");
          const sideBtn = $("side-tab-" + target);
          if (sideBtn) sideBtn.click();
        }
      });
    });
  }

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
        renderHeader();
        renderStats();
      }
    };
  }

  function scheduleGoldenBrain() {
    if (goldenBrainTimer) return;
    const delay = 60000 + Math.random() * 120000;
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
        renderHeader();
        renderStats();
      }
    };
  }

  function scheduleBoss() {
    if (bossTimer) return;
    const delay = 180000 + Math.random() * 180000;
    bossTimer = setTimeout(function () {
      bossTimer = null;
      spawnBoss();
      scheduleBoss();
    }, delay);
  }

  function setupAutoClick() {
    if (autoClickInterval) { clearInterval(autoClickInterval); autoClickInterval = null; }
    if (state && state.prestige.upgrades.indexOf("autoClick") !== -1) {
      autoClickInterval = setInterval(function () {
        if (!state) return;
        Game.click(state);
        const zombieEl = $("zombie-btn");
        if (zombieEl) {
          zombieEl.classList.add("popping");
          setTimeout(function () { zombieEl.classList.remove("popping"); }, 180);
        }
        renderHeader();
        renderStats();
      }, 2000);
    }
  }

  function gameLoop() {
    if (!state) return;
    const now = Date.now();
    if (lastTickTime === null) { lastTickTime = now; return; }
    const dt = (now - lastTickTime) / 1000;
    lastTickTime = now;
    if (dt > 0) {
      const tickMult = bossActive ? bossMultiplier : 1;
      Game.tick(state, dt * tickMult);
      const bps = Game.getBrainsPerSecond(state);
      if (bps > (state.bestBps || 0)) state.bestBps = bps;
      const newAch = Game.checkAchievements(state);
      if (newAch && newAch.length > 0) {
        newAch.forEach(function (id) {
          const ach = Game.ACHIEVEMENTS.find(function (a) { return a.id === id; });
          if (ach) showToast("🏆 Logro: " + ach.name, "success");
        });
        prevAchievements = state.achievements.slice();
        renderAchievements(newAch);
      }
      renderHeader();
      renderStats();
      renderShop();
    }
  }

  function init() {
    loadGame();
    renderAll();
    setupBuyQty();
    setupShopTabs();
    setupSideTabs();
    setupMobileNav();
    setupAutoClick();

    const zombieEl = $("zombie-btn");
    if (zombieEl) zombieEl.addEventListener("click", handleClick);

    const btnSave = $("btn-save");
    if (btnSave) btnSave.addEventListener("click", function () { saveGame(); showToast("Juego guardado", "info"); });

    const btnReset = $("btn-reset");
    if (btnReset) btnReset.addEventListener("click", resetGame);

    const btnPrestige = $("btn-prestige");
    if (btnPrestige) btnPrestige.addEventListener("click", doPrestige);

    const btnExport = $("btn-export");
    const btnImport = $("btn-import");
    const saveArea = $("save-area");
    if (btnExport && saveArea) {
      btnExport.addEventListener("click", function () {
        saveArea.classList.remove("hidden");
        saveArea.value = Game.exportSave(state);
        saveArea.select();
      });
    }
    if (btnImport && saveArea) {
      btnImport.addEventListener("click", function () {
        if (saveArea.classList.contains("hidden")) {
          saveArea.classList.remove("hidden");
          saveArea.value = "";
          saveArea.focus();
        } else {
          const imported = Game.importSave(saveArea.value.trim());
          if (imported) {
            state = imported;
            prevAchievements = state.achievements.slice();
            saveGame();
            setupAutoClick();
            renderAll();
            showToast("Save importado", "success");
            saveArea.classList.add("hidden");
          } else {
            showToast("Save inválido", "warn");
          }
        }
      });
    }

    if (state.lastSaved) {
      const elapsed = (Date.now() - state.lastSaved) / 1000;
      if (elapsed > 60) {
        const cap = typeof Game.getOfflineCapSeconds === "function"
          ? Game.getOfflineCapSeconds(state)
          : OFFLINE_CAP_SECONDS;
        const effective = Math.min(elapsed, cap);
        const gained = Game.applyOfflineProgress(state, effective);
        if (gained > 0) showToast("🌙 Mientras estabas fuera ganaste " + formatNumber(gained) + " cerebros", "info");
      }
    }

    scheduleGoldenBrain();
    scheduleBoss();
    setInterval(gameLoop, 100);
    setInterval(saveGame, 15000);
    window.addEventListener("beforeunload", saveGame);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }

  if (typeof window !== "undefined") {
    window.ZombieClicker = {
      get state() { return state; },
      saveGame: saveGame,
      loadGame: loadGame,
      resetGame: resetGame,
      handleClick: handleClick,
      buyGenerator: buyGenerator,
      buyUpgrade: buyUpgrade,
      buyPrestigeUpgrade: buyPrestigeUpgrade,
      doPrestige: doPrestige,
      spawnGoldenBrain: spawnGoldenBrain,
      spawnBoss: spawnBoss,
      buyCosmetic: buyCosmetic,
      equipCosmetic: equipCosmetic,
      applyCosmetics: applyCosmetics,
      getBrainsPerSecond: function () { return state ? Game.getBrainsPerSecond(state) : 0; },
      getClickValue: function () { return state ? Game.getClickValue(state) : 0; },
      formatNumber: formatNumber
    };
  }
})();
