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
  let lastCloudSyncAt = 0;
  let warnedCloudOffline = false;
  let accountMode = "signup";
  let cachedDisplayName = "";
  let cloudMergeInFlight = false;
  let offlineApplied = false;

  const SVG_ICONS = {
    survivor: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="10" r="5" fill="#8fa085"/><path d="M8 28 L12 14 L20 14 L24 28" fill="#5d705a"/><circle cx="14" cy="10" r="1" fill="#000"/><circle cx="18" cy="10" r="1" fill="#000"/></svg>',
    biter: '<svg viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="16" rx="10" ry="12" fill="#6e7f62"/><circle cx="12" cy="13" r="2" fill="#9aff4d"/><circle cx="20" cy="13" r="2" fill="#9aff4d"/><path d="M11 22 Q16 26 21 22" fill="#2a2018"/></svg>',
    runner: '<svg viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="14" rx="8" ry="9" fill="#6e7f62"/><circle cx="13" cy="12" r="1.5" fill="#9aff4d"/><circle cx="19" cy="12" r="1.5" fill="#9aff4d"/><path d="M8 26 L12 18 L20 18 L24 26" fill="#4a5a40"/></svg>',
    rabid: '<svg viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="15" rx="10" ry="11" fill="#7a4f4f"/><circle cx="12" cy="13" r="2" fill="#e62e2e"/><circle cx="20" cy="13" r="2" fill="#e62e2e"/><path d="M10 24 L16 19 L22 24" fill="#fff"/></svg>',
    boss: '<svg viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="15" rx="11" ry="12" fill="#4a5a40"/><path d="M8 6 L12 12 L16 5 L20 12 L24 6" fill="#9e1b1b"/><circle cx="12" cy="14" r="2" fill="#ffbf00"/><circle cx="20" cy="14" r="2" fill="#ffbf00"/><path d="M11 25 Q16 21 21 25" fill="#2a2018"/></svg>',
    horde: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="10" cy="18" r="5" fill="#6e7f62"/><circle cx="22" cy="18" r="5" fill="#6e7f62"/><circle cx="16" cy="12" r="5" fill="#5a6b4f"/><circle cx="12" cy="12" r="1" fill="#9aff4d"/><circle cx="20" cy="12" r="1" fill="#9aff4d"/></svg>',
    necro: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 28 L8 10 L16 6 L24 10 L28 28 Z" fill="#3a4a32"/><rect x="10" y="14" width="4" height="5" fill="#1a1f16"/><rect x="18" y="14" width="4" height="5" fill="#1a1f16"/><path d="M12 24 L20 24" stroke="#5d705a" stroke-width="2"/></svg>',
    virus: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="8" fill="#6ecf2f"/><circle cx="16" cy="16" r="4" fill="#161c15"/><circle cx="8" cy="10" r="2" fill="#6ecf2f"/><circle cx="24" cy="10" r="2" fill="#6ecf2f"/><circle cx="8" cy="22" r="2" fill="#6ecf2f"/><circle cx="24" cy="22" r="2" fill="#6ecf2f"/></svg>',
    apocalypse: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="10" fill="#9e1b1b"/><path d="M10 10 L22 22 M22 10 L10 22" stroke="#ffbf00" stroke-width="3"/><circle cx="16" cy="16" r="3" fill="#ffbf00"/></svg>',
    god: '<svg viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="15" rx="10" ry="11" fill="#ffbf00"/><path d="M6 8 L10 4 L14 8 L18 4 L22 8 L26 4" fill="none" stroke="#ffbf00" stroke-width="2"/><circle cx="12" cy="14" r="2" fill="#9e1b1b"/><circle cx="20" cy="14" r="2" fill="#9e1b1b"/><path d="M11 24 Q16 28 21 24" fill="#9e1b1b"/></svg>',
    hand: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 26 L10 16 Q10 10 16 10 Q22 10 22 16 L22 26" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 18 L6 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M14 6 L14 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M18 6 L18 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
    tooth: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 12 Q16 6 22 12 Q24 18 20 26 Q16 22 12 26 Q8 18 10 12" fill="#eef2ea"/><path d="M14 14 L18 14 L16 20 Z" fill="#9e1b1b"/></svg>',
    claw: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 22 Q10 10 16 8 Q22 10 26 22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M10 20 L12 26" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M16 18 L16 26" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M22 20 L20 26" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
    fist: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="17" r="9" fill="currentColor"/><path d="M10 12 L10 8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M14 10 L14 6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M18 10 L18 6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M22 12 L22 8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    bolt: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M18 4 L10 16 L16 16 L14 28 L22 16 L16 16 Z" fill="#ffbf00"/></svg>',
    bone: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="13" width="20" height="6" rx="3" fill="#eef2ea"/><circle cx="8" cy="13" r="3" fill="#eef2ea"/><circle cx="8" cy="19" r="3" fill="#eef2ea"/><circle cx="24" cy="13" r="3" fill="#eef2ea"/><circle cx="24" cy="19" r="3" fill="#eef2ea"/></svg>',
    flask: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12 4 L12 12 L8 22 Q8 26 12 26 L20 26 Q24 26 24 22 L20 12 L20 4" fill="none" stroke="#9aff4d" stroke-width="2"/><path d="M11 4 L21 4" stroke="#9aff4d" stroke-width="2"/></svg>',
    fire: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 28 Q8 24 8 16 Q8 10 12 6 Q12 12 16 14 Q16 8 20 4 Q24 10 24 16 Q24 24 16 28" fill="#e62e2e"/><path d="M16 24 Q12 22 12 17 Q12 15 14 13 Q14 16 16 17 Q16 14 18 12 Q20 15 20 17 Q20 22 16 24" fill="#ffbf00"/></svg>',
    crown: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 22 L8 10 L12 16 L16 8 L20 16 L24 10 L28 22 Z" fill="#ffbf00"/><rect x="4" y="22" width="24" height="4" fill="#ffbf00"/></svg>',
    muscle: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 26 Q6 18 12 14 Q16 10 24 12 Q28 14 26 20 Q24 26 16 26 Z" fill="#6e7f62"/><path d="M14 16 Q18 14 22 16" fill="none" stroke="#3a4a32" stroke-width="2" stroke-linecap="round"/></svg>',
    palette: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="13" r="2" fill="#9aff4d"/><circle cx="20" cy="13" r="2" fill="#e62e2e"/><circle cx="16" cy="21" r="2" fill="#ffbf00"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>'
  };

  const GEN_ICON_MAP = {
    superviviente: SVG_ICONS.survivor,
    mordedor: SVG_ICONS.biter,
    corredor: SVG_ICONS.runner,
    rabioso: SVG_ICONS.rabid,
    jefe: SVG_ICONS.boss,
    horde: SVG_ICONS.horde,
    necropolis: SVG_ICONS.necro,
    "virus-alfa": SVG_ICONS.virus,
    apocalipsis: SVG_ICONS.apocalypse,
    "zombie-dios": SVG_ICONS.god
  };

  const UPGRADE_ICON_MAP = {
    "dedos-podridos": SVG_ICONS.hand,
    "mandibula-filosa": SVG_ICONS.tooth,
    "garras-infectadas": SVG_ICONS.claw,
    "puño-demolicion": SVG_ICONS.fist,
    "superviviente-veloz": SVG_ICONS.bolt,
    "mordedura-profunda": SVG_ICONS.bone,
    "corredor-mutado": SVG_ICONS.flask,
    "rabia-eterna": SVG_ICONS.fire,
    "jefe-alpha": SVG_ICONS.crown,
    "fuerza-sobrenatural": SVG_ICONS.muscle
  };

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
    if (typeof Cloud !== "undefined" && Cloud.hasSession()) {
      Cloud.pushSave(state).then(function (res) {
        if (res && res.ok) {
          lastCloudSyncAt = Cloud.getLastSyncAt() || Date.now();
          warnedCloudOffline = false;
          updateAccountSyncLabel();
        } else if (res && !res.skipped && (res.offline || res.error)) {
          if (!warnedCloudOffline) {
            warnedCloudOffline = true;
            showToast("Sin conexión: se guarda en este dispositivo", "warn");
          }
        }
      });
    }
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
    state = Game.createState();
    prevAchievements = [];
    saveGame();
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
      '<span class="item-icon">' + (GEN_ICON_MAP[gen.id] || gen.icon) + '</span>' +
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
      '<span class="item-icon">' + (UPGRADE_ICON_MAP[upg.id] || upg.icon) + '</span>' +
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
      '<span class="item-icon">' + SVG_ICONS.palette + '</span>' +
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
    div.className = "item-card" + (equipped ? " owned" : (owned ? " affordable" : (state.brains >= cos.cost ? " affordable" : " disabled")));
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
        '<span class="item-icon">' + (unlocked ? SVG_ICONS.check : SVG_ICONS.lock) + '</span>' +
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

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatSyncTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    return pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

  function setAccountError(msg) {
    const el = $("account-error");
    if (!el) return;
    if (!msg) {
      el.textContent = "";
      el.classList.add("hidden");
    } else {
      el.textContent = msg;
      el.classList.remove("hidden");
    }
  }

  function updateAccountSyncLabel() {
    const el = $("account-last-sync");
    if (!el) return;
    const ts = lastCloudSyncAt || (typeof Cloud !== "undefined" ? Cloud.getLastSyncAt() : 0);
    el.textContent = ts ? ("Último sync: " + formatSyncTime(ts)) : "Último sync: —";
  }

  function updateAccountModal() {
    const configured = typeof Cloud !== "undefined" && Cloud.isConfigured();
    const unconf = $("account-unconfigured");
    const guest = $("account-guest");
    const authedBox = $("account-authed");
    const session = typeof Cloud !== "undefined" && Cloud.hasSession();
    if (unconf) unconf.classList.toggle("hidden", configured);
    if (!configured) {
      if (guest) guest.classList.add("hidden");
      if (authedBox) authedBox.classList.add("hidden");
      return;
    }
    if (session) {
      if (guest) guest.classList.add("hidden");
      if (authedBox) authedBox.classList.remove("hidden");
      const nm = $("account-authed-name");
      if (nm) nm.textContent = cachedDisplayName || "jugador";
      updateAccountSyncLabel();
    } else {
      if (guest) guest.classList.remove("hidden");
      if (authedBox) authedBox.classList.add("hidden");
    }
  }

  function updateAccountChrome() {
    const btn = $("btn-account");
    const nameEl = $("account-name");
    const authed = typeof Cloud !== "undefined" && Cloud.hasSession();
    if (btn) {
      btn.classList.toggle("is-authed", authed);
      const label = authed && cachedDisplayName ? cachedDisplayName : "Cuenta";
      btn.setAttribute("aria-label", label);
      btn.title = label;
    }
    if (nameEl) {
      if (authed && cachedDisplayName) {
        nameEl.textContent = cachedDisplayName;
        nameEl.classList.remove("hidden");
      } else {
        nameEl.textContent = "";
        nameEl.classList.add("hidden");
      }
    }
    updateAccountModal();
  }

  function setAccountMode(mode) {
    accountMode = mode === "login" ? "login" : "signup";
    const tabS = $("account-tab-signup");
    const tabL = $("account-tab-login");
    const fieldName = $("account-field-name");
    const submit = $("account-submit");
    const pass = $("account-password");
    if (tabS) {
      tabS.classList.toggle("active", accountMode === "signup");
      tabS.setAttribute("aria-selected", accountMode === "signup" ? "true" : "false");
    }
    if (tabL) {
      tabL.classList.toggle("active", accountMode === "login");
      tabL.setAttribute("aria-selected", accountMode === "login" ? "true" : "false");
    }
    if (fieldName) fieldName.classList.toggle("hidden", accountMode === "login");
    const nameInput = $("account-display-name");
    if (nameInput) {
      if (accountMode === "signup") nameInput.setAttribute("required", "required");
      else nameInput.removeAttribute("required");
    }
    if (submit) submit.textContent = accountMode === "login" ? "Entrar" : "Crear cuenta";
    if (pass) pass.setAttribute("autocomplete", accountMode === "login" ? "current-password" : "new-password");
    setAccountError("");
  }

  function openAccountModal() {
    const modal = $("account-modal");
    if (!modal) return;
    updateAccountModal();
    modal.classList.remove("hidden");
    if (typeof Cloud !== "undefined" && Cloud.isConfigured() && !Cloud.hasSession()) {
      const first = accountMode === "signup" ? $("account-display-name") : $("account-email");
      if (first && typeof first.focus === "function") first.focus();
    }
  }

  function closeAccountModal() {
    const modal = $("account-modal");
    if (modal) modal.classList.add("hidden");
    setAccountError("");
  }

  function applyOfflineProgressOnce() {
    if (offlineApplied || !state) return;
    offlineApplied = true;
    if (!state.lastSaved) return;
    const elapsed = (Date.now() - state.lastSaved) / 1000;
    if (elapsed <= 60) return;
    const cap = typeof Game.getOfflineCapSeconds === "function"
      ? Game.getOfflineCapSeconds(state)
      : OFFLINE_CAP_SECONDS;
    const effective = Math.min(elapsed, cap);
    const gained = Game.applyOfflineProgress(state, effective);
    if (gained > 0) {
      showToast("🌙 Mientras estabas fuera ganaste " + formatNumber(gained) + " cerebros", "info");
      renderHeader();
    }
  }

  function mergeWithCloud(opts) {
    opts = opts || {};
    if (typeof Cloud === "undefined" || !Cloud.hasSession()) {
      applyOfflineProgressOnce();
      return Promise.resolve();
    }
    if (cloudMergeInFlight) return Promise.resolve();
    cloudMergeInFlight = true;
    const localSnapshot = state;
    return Cloud.pullSave().then(function (cloudState) {
      const picked = Game.pickPreferredSave(localSnapshot, cloudState);
      state = picked.state;
      if (!state.prestige) state.prestige = { souls: 0, totalSoulsEarned: 0, upgrades: [] };
      if (!Array.isArray(state.achievements)) state.achievements = [];
      prevAchievements = state.achievements.slice();
      saveGame();
      setupAutoClick();
      renderAll();
      updateAccountChrome();
      if (opts.toast !== false) {
        if (picked.source === "cloud" && !Game.isFreshState(picked.state)) {
          showToast("Se cargó el progreso de la nube", "info");
        } else if (picked.source === "local" && !cloudState) {
          showToast("Se subió el progreso de este dispositivo", "info");
        } else if (picked.source === "local" && Game.isFreshState(cloudState)) {
          showToast("Se subió el progreso de este dispositivo", "info");
        }
      }
      applyOfflineProgressOnce();
    }).catch(function () {
      if (!warnedCloudOffline) {
        warnedCloudOffline = true;
        showToast("Sin conexión: se guarda en este dispositivo", "warn");
      }
      applyOfflineProgressOnce();
    }).then(function () {
      cloudMergeInFlight = false;
    });
  }

  function refreshProfileName() {
    if (typeof Cloud === "undefined" || !Cloud.hasSession()) {
      cachedDisplayName = "";
      updateAccountChrome();
      return Promise.resolve();
    }
    return Cloud.getProfile().then(function (profile) {
      cachedDisplayName = profile && profile.display_name ? profile.display_name : cachedDisplayName;
      updateAccountChrome();
    });
  }

  function submitAccountForm(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (typeof Cloud === "undefined" || !Cloud.isConfigured()) return;
    const submit = $("account-submit");
    const emailEl = $("account-email");
    const passwordEl = $("account-password");
    const nameEl = $("account-display-name");
    const email = emailEl ? emailEl.value : "";
    const password = passwordEl ? passwordEl.value : "";
    const name = nameEl ? nameEl.value.trim() : "";
    setAccountError("");
    if (submit) submit.disabled = true;
    const done = function () { if (submit) submit.disabled = false; };
    const action = accountMode === "login"
      ? Cloud.signIn(email, password)
      : Cloud.signUp(email, password, name);
    action.then(function (res) {
      done();
      if (!res || !res.ok) {
        setAccountError((res && res.error) || "No se pudo completar.");
        return;
      }
      if (res.needsEmailConfirm) {
        setAccountError("Revisá tu email para confirmar la cuenta.");
        showToast("Revisá tu email", "info");
        return;
      }
      if (accountMode === "signup") {
        cachedDisplayName = name;
        showToast("Cuenta creada", "success");
      } else {
        showToast("Sesión iniciada", "success");
      }
      closeAccountModal();
      refreshProfileName();
    }).catch(function () {
      done();
      setAccountError("No se pudo completar.");
    });
  }

  function setupAccount() {
    if (typeof Cloud !== "undefined") Cloud.init();

    const btn = $("btn-account");
    if (btn) btn.addEventListener("click", openAccountModal);
    const closeBtn = $("account-modal-close");
    if (closeBtn) closeBtn.addEventListener("click", closeAccountModal);
    const backdrop = $("account-modal-backdrop");
    if (backdrop) backdrop.addEventListener("click", closeAccountModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAccountModal();
    });

    const tabS = $("account-tab-signup");
    const tabL = $("account-tab-login");
    if (tabS) tabS.addEventListener("click", function () { setAccountMode("signup"); });
    if (tabL) tabL.addEventListener("click", function () { setAccountMode("login"); });
    setAccountMode("signup");

    const form = $("account-form");
    if (form) form.addEventListener("submit", submitAccountForm);

    const signout = $("account-signout");
    if (signout) {
      signout.addEventListener("click", function () {
        if (typeof Cloud === "undefined") return;
        Cloud.signOut().then(function () {
          cachedDisplayName = "";
          updateAccountChrome();
          showToast("Sesión cerrada", "info");
          closeAccountModal();
        });
      });
    }

    if (typeof Cloud !== "undefined") {
      Cloud.onAuthChange(function (session, event) {
        if (event === "SIGNED_OUT") {
          cachedDisplayName = "";
          updateAccountChrome();
          return;
        }
        if (event === "SIGNED_IN") {
          refreshProfileName().then(function () {
            return mergeWithCloud({ toast: true });
          });
          return;
        }
        updateAccountChrome();
      });
    }
    updateAccountChrome();
  }

  function init() {
    loadGame();
    renderAll();
    setupBuyQty();
    setupShopTabs();
    setupSideTabs();
    setupMobileNav();
    setupAutoClick();
    setupAccount();

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

    if (typeof Cloud !== "undefined" && Cloud.isConfigured()) {
      Promise.resolve(Cloud.getSession()).then(function (session) {
        if (session) {
          return refreshProfileName().then(function () {
            return mergeWithCloud({ toast: true });
          });
        }
        applyOfflineProgressOnce();
      }).catch(function () {
        applyOfflineProgressOnce();
      });
    } else {
      applyOfflineProgressOnce();
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
