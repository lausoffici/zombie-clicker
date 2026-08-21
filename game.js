(function () {
  "use strict";

  const GENERATORS = [
    { id: "g1", name: "Zombi Podrido", icon: "🧟", baseCost: 15, baseBps: 0.5, desc: "Un zombi básico que muerde y suelta un poco de cerebro." },
    { id: "g2", name: "Zombi Cojeante", icon: "🧟‍♂️", baseCost: 100, baseBps: 2, desc: "Camina lento pero produce más." },
    { id: "g3", name: "Zombi Corredor", icon: "🏃", baseCost: 1100, baseBps: 8, desc: "Rápido y hambriento de materia gris." },
    { id: "g4", name: "Zombi Bruto", icon: "💪", baseCost: 12000, baseBps: 47, desc: "Fuerte como una roca, produce montones." },
    { id: "g5", name: "Zombi Escupidero", icon: "🤮", baseCost: 130000, baseBps: 260, desc: "Escupe ácido que disuelve cerebros." },
    { id: "g6", name: "Zombi Portador", icon: "👹", baseCost: 1.4e6, baseBps: 1400, desc: "Arrastra hordas enteras de zombis." },
    { id: "g7", name: "Zombi Leviatán", icon: "🐲", baseCost: 2e7, baseBps: 7800, desc: "Un coloso devorador de ciudades." },
    { id: "g8", name: "Apocalipsis", icon: "☢️", baseCost: 3.3e8, baseBps: 44000, desc: "El fin del mundo, literalmente." },
    { id: "g9", name: "Zombi Espectral", icon: "👻", baseCost: 5e9, baseBps: 260000, desc: "Un fantasma hambriento que atraviesa la materia." },
    { id: "g10", name: "Dios Zombi", icon: "🌌", baseCost: 7.5e10, baseBps: 1.6e6, desc: "La entidad final que devora universos." }
  ];

  const UPGRADES = [
    { id: "u1", name: "Manos Ágiles", icon: "✋", cost: 100, type: "click", mult: 2, desc: "Duplica el cerebro por click." },
    { id: "u2", name: "Puños de Acero", icon: "🥊", cost: 1000, type: "click", mult: 2, desc: "Duplica el cerebro por click otra vez." },
    { id: "u3", name: "Guantes de Espino", icon: "🧤", cost: 10000, type: "click", mult: 3, desc: "x3 cerebro por click." },
    { id: "u4", name: "Dientes Filosos", icon: "🦷", cost: 500, type: "gen", gen: "g1", mult: 2, desc: "Duplica producción de Zombis Podridos." },
    { id: "u5", name: "Cojeras Rápidas", icon: "🦵", cost: 2500, type: "gen", gen: "g2", mult: 2, desc: "Duplica producción de Zombis Cojeantes." },
    { id: "u6", name: "Adrenalina", icon: "⚡", cost: 25000, type: "gen", gen: "g3", mult: 2, desc: "Duplica producción de Zombis Corredores." },
    { id: "u7", name: "Músculos Infinitos", icon: "🏋️", cost: 250000, type: "gen", gen: "g4", mult: 2, desc: "Duplica producción de Zombis Brutos." },
    { id: "u8", name: "Ácido Concentrado", icon: "🧪", cost: 2.5e6, type: "gen", gen: "g5", mult: 2, desc: "Duplica producción de Zombis Escupideros." },
    { id: "u9", name: "Horda Organizada", icon: "📋", cost: 5e4, type: "global", mult: 1.5, desc: "x1.5 a TODA la producción." },
    { id: "u10", name: "Culto Zombi", icon: "🕯️", cost: 5e6, type: "global", mult: 2, desc: "x2 a TODA la producción." }
  ];

  const SAVE_KEY = "zombieClickerSave";

  function createState() {
    return {
      brains: 0,
      totalBrains: 0,
      totalClicks: 0,
      clickMult: 1,
      globalMult: 1,
      generators: {},
      upgrades: {}
    };
  }

  let state = createState();

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = Object.assign(createState(), parsed);
      }
    } catch (e) {
      state = createState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function resetState() {
    if (typeof confirm === "function" && !confirm("¿Seguro que quieres reiniciar todo el progreso?")) {
      return;
    }
    state = createState();
    saveState();
    render();
  }

  function getGenCost(gen) {
    const count = state.generators[gen.id] || 0;
    return Math.floor(gen.baseCost * Math.pow(1.15, count));
  }

  function getGenBps(gen) {
    const count = state.generators[gen.id] || 0;
    if (count === 0) return 0;
    let mult = 1;
    UPGRADES.forEach(u => {
      if (state.upgrades[u.id] && u.type === "gen" && u.gen === gen.id) {
        mult *= u.mult;
      }
    });
    return count * gen.baseBps * mult * state.globalMult;
  }

  function getTotalBps() {
    let total = 0;
    GENERATORS.forEach(g => { total += getGenBps(g); });
    return total;
  }

  function getClickPower() {
    let power = 1;
    UPGRADES.forEach(u => {
      if (state.upgrades[u.id] && u.type === "click") {
        power *= u.mult;
      }
    });
    return power;
  }

  function buyGenerator(genId) {
    const gen = GENERATORS.find(g => g.id === genId);
    if (!gen) return false;
    const cost = getGenCost(gen);
    if (state.brains >= cost) {
      state.brains -= cost;
      state.generators[gen.id] = (state.generators[gen.id] || 0) + 1;
      saveState();
      render();
      return true;
    }
    return false;
  }

  function buyUpgrade(upgId) {
    const upg = UPGRADES.find(u => u.id === upgId);
    if (!upg || state.upgrades[upg.id]) return false;
    if (state.brains >= upg.cost) {
      state.brains -= upg.cost;
      state.upgrades[upg.id] = true;
      if (upg.type === "global") {
        state.globalMult *= upg.mult;
      }
      saveState();
      render();
      return true;
    }
    return false;
  }

  function doClick() {
    const power = getClickPower();
    state.brains += power;
    state.totalBrains += power;
    state.totalClicks += 1;
    render();
    return power;
  }

  function formatNum(n) {
    if (n < 1000) return Math.floor(n).toString();
    if (n < 1e6) return (n / 1e3).toFixed(1) + "K";
    if (n < 1e9) return (n / 1e6).toFixed(1) + "M";
    if (n < 1e12) return (n / 1e9).toFixed(1) + "B";
    return (n / 1e12).toFixed(1) + "T";
  }

  function render() {
    if (typeof document === "undefined") return;
    const scoreEl = document.getElementById("score-value");
    const bpsEl = document.getElementById("bps-value");
    const clickPowerEl = document.getElementById("click-power");
    const statClicksEl = document.getElementById("stat-clicks");
    const statTotalEl = document.getElementById("stat-total");

    if (scoreEl) scoreEl.textContent = formatNum(state.brains);
    if (bpsEl) bpsEl.textContent = formatNum(getTotalBps()) + " /s";
    if (clickPowerEl) clickPowerEl.textContent = "+" + formatNum(getClickPower()) + " por click";
    if (statClicksEl) statClicksEl.textContent = formatNum(state.totalClicks);
    if (statTotalEl) statTotalEl.textContent = formatNum(state.totalBrains);

    const genContainer = document.getElementById("generators");
    if (genContainer) {
      genContainer.innerHTML = "";
      GENERATORS.forEach(gen => {
        const cost = getGenCost(gen);
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
          '<span class="gen-cost">' + formatNum(cost) + '</span>';
        div.addEventListener("click", () => buyGenerator(gen.id));
        genContainer.appendChild(div);
      });
    }

    const upgContainer = document.getElementById("upgrades");
    if (upgContainer) {
      upgContainer.innerHTML = "";
      UPGRADES.forEach(upg => {
        if (state.upgrades[upg.id]) return;
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
          '<span class="upg-cost">' + formatNum(upg.cost) + '</span>';
        div.addEventListener("click", () => buyUpgrade(upg.id));
        upgContainer.appendChild(div);
      });
      if (upgContainer.children.length === 0) {
        upgContainer.innerHTML = '<div class="upg-item disabled"><span class="upg-desc">¡Todas las mejoras compradas!</span></div>';
      }
    }
  }

  function tick() {
    const bps = getTotalBps();
    if (bps > 0) {
      state.brains += bps / 10;
      state.totalBrains += bps / 10;
      render();
    }
  }

  function init() {
    loadState();
    render();

    const zombieEl = document.getElementById("zombie");
    if (zombieEl) zombieEl.addEventListener("click", doClick);

    const btnSave = document.getElementById("btn-save");
    if (btnSave) btnSave.addEventListener("click", () => { saveState(); });

    const btnReset = document.getElementById("btn-reset");
    if (btnReset) btnReset.addEventListener("click", resetState);

    setInterval(tick, 100);
    setInterval(saveState, 15000);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  const Game = {
    GENERATORS,
    UPGRADES,
    state,
    createState,
    loadState,
    saveState,
    resetState,
    getGenCost,
    getGenBps,
    getTotalBps,
    getClickPower,
    buyGenerator,
    buyUpgrade,
    doClick,
    formatNum,
    render,
    tick,
    init
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Game;
  }
  if (typeof window !== "undefined") {
    window.Game = Game;
  }
})();
