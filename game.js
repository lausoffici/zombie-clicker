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
    { id: "u1", name: "Manos Ágiles", icon: "✋", cost: 100, type: "click", multiplier: 2, desc: "Duplica el cerebro por click." },
    { id: "u2", name: "Puños de Acero", icon: "🥊", cost: 1000, type: "click", multiplier: 2, desc: "Duplica el cerebro por click otra vez." },
    { id: "u3", name: "Guantes de Espino", icon: "🧤", cost: 10000, type: "click", multiplier: 3, desc: "x3 cerebro por click." },
    { id: "u4", name: "Dientes Filosos", icon: "🦷", cost: 500, type: "gen", gen: "g1", multiplier: 2, desc: "Duplica producción de Zombis Podridos." },
    { id: "u5", name: "Cojeras Rápidas", icon: "🦵", cost: 2500, type: "gen", gen: "g2", multiplier: 2, desc: "Duplica producción de Zombis Cojeantes." },
    { id: "u6", name: "Adrenalina", icon: "⚡", cost: 25000, type: "gen", gen: "g3", multiplier: 2, desc: "Duplica producción de Zombis Corredores." },
    { id: "u7", name: "Músculos Infinitos", icon: "🏋️", cost: 250000, type: "gen", gen: "g4", multiplier: 2, desc: "Duplica producción de Zombis Brutos." },
    { id: "u8", name: "Ácido Concentrado", icon: "🧪", cost: 2.5e6, type: "gen", gen: "g5", multiplier: 2, desc: "Duplica producción de Zombis Escupideros." },
    { id: "u9", name: "Horda Organizada", icon: "📋", cost: 5e4, type: "global", multiplier: 1.5, desc: "x1.5 a TODA la producción." },
    { id: "u10", name: "Culto Zombi", icon: "🕯️", cost: 5e6, type: "global", multiplier: 2, desc: "x2 a TODA la producción." }
  ];

  const ACHIEVEMENTS = [
    { id: "a1", name: "Primer Bocado", desc: "Haz 10 clicks", type: "clicks", threshold: 10, bonus: 0.02 },
    { id: "a2", name: "Manos Hambrientas", desc: "Haz 100 clicks", type: "clicks", threshold: 100, bonus: 0.02 },
    { id: "a3", name: "Cerebros en Masa", desc: "Gana 1,000 cerebros totales", type: "totalBrains", threshold: 1000, bonus: 0.02 },
    { id: "a4", name: "Acumulador", desc: "Gana 100,000 cerebros totales", type: "totalBrains", threshold: 100000, bonus: 0.02 },
    { id: "a5", name: "Horda Pequeña", desc: "Ten 10 generadores", type: "generatorCount", threshold: 10, bonus: 0.02 },
    { id: "a6", name: "Ejército Zombi", desc: "Ten 50 generadores", type: "generatorCount", threshold: 50, bonus: 0.02 },
    { id: "a7", name: "Coleccionista", desc: "Ten 5 tipos de generadores", type: "generators", threshold: 5, bonus: 0.02 },
    { id: "a8", name: "Señor de la Horda", desc: "Ten 100 generadores", type: "generatorCount", threshold: 100, bonus: 0.02 }
  ];

  const PRESTIGE_UPGRADES = [
    { id: "p1", name: "Alma de Fuego", desc: "+10% BPS", cost: 1, effect: "bpsBoost" },
    { id: "p2", name: "Alma de Gelo", desc: "+20% click", cost: 2, effect: "clickBoost" },
    { id: "p3", name: "Alma de Vida", desc: "+100 cerebros iniciales", cost: 3, effect: "soulStart" },
    { id: "p4", name: "Alma de Tiempo", desc: "+50% offline cap", cost: 5, effect: "offlineBoost" },
    { id: "p5", name: "Alma de Avaricia", desc: "-10% costo generadores", cost: 8, effect: "cheaperGenerators" },
    { id: "p6", name: "Alma de Automatización", desc: "Click automático cada 2s", cost: 15, effect: "autoClick" }
  ];

  const BASE_OFFLINE_CAP_SECONDS = 8 * 3600; // 28800s

  function createState() {
    return {
      brains: 0,
      totalClicks: 0,
      totalBrainsEarned: 0,
      bestBps: 0,
      generators: {},
      upgrades: [],
      achievements: [],
      prestige: {
        souls: 0,
        totalSoulsEarned: 0,
        upgrades: []
      },
      startedAt: Date.now(),
      lastSaved: Date.now()
    };
  }

  function formatNumber(n) {
    if (n < 1000) return Math.floor(n).toString();
    if (n < 1e6) return (n / 1e3).toFixed(1) + "K";
    if (n < 1e9) return (n / 1e6).toFixed(1) + "M";
    if (n < 1e12) return (n / 1e9).toFixed(1) + "B";
    return (n / 1e12).toFixed(1) + "T";
  }

  function getGlobalMultiplier(state) {
    let mult = 1;
    mult += (state.prestige ? state.prestige.souls : 0) * 0.05;
    const achCount = state.achievements ? state.achievements.length : 0;
    mult += achCount * 0.02;
    if (state.prestige && state.prestige.upgrades) {
      state.prestige.upgrades.forEach(function (puId) {
        const pu = PRESTIGE_UPGRADES.find(function (p) { return p.id === puId; });
        if (pu) {
          if (pu.effect === "bpsBoost") mult += 0.10;
          if (pu.effect === "clickBoost") mult += 0.20;
        }
      });
    }
    return mult;
  }

  function getClickValue(state) {
    let power = 1;
    UPGRADES.forEach(function (u) {
      if (state.upgrades.indexOf(u.id) !== -1 && u.type === "click") {
        power *= u.multiplier;
      }
    });
    return power * getGlobalMultiplier(state);
  }

  function getGeneratorCost(state, id) {
    const gen = GENERATORS.find(function (g) { return g.id === id; });
    if (!gen) return Infinity;
    const count = state.generators[id] || 0;
    let cost = gen.baseCost * Math.pow(1.15, count);
    if (state.prestige && state.prestige.upgrades) {
      const cheaperCount = state.prestige.upgrades.filter(function (puId) {
        const pu = PRESTIGE_UPGRADES.find(function (p) { return p.id === puId; });
        return pu && pu.effect === "cheaperGenerators";
      }).length;
      if (cheaperCount > 0) {
        cost *= Math.pow(0.9, cheaperCount);
      }
    }
    return Math.floor(cost);
  }

  function getBrainsPerSecond(state) {
    let total = 0;
    GENERATORS.forEach(function (gen) {
      const count = state.generators[gen.id] || 0;
      if (count === 0) return;
      let mult = 1;
      UPGRADES.forEach(function (u) {
        if (state.upgrades.indexOf(u.id) !== -1 && u.type === "gen" && u.gen === gen.id) {
          mult *= u.multiplier;
        }
      });
      total += count * gen.baseBps * mult;
    });
    UPGRADES.forEach(function (u) {
      if (state.upgrades.indexOf(u.id) !== -1 && u.type === "global") {
        total *= u.multiplier;
      }
    });
    total *= getGlobalMultiplier(state);
    return total;
  }

  function click(state) {
    const value = getClickValue(state);
    state.brains += value;
    state.totalBrainsEarned += value;
    state.totalClicks += 1;
    return value;
  }

  function buyGenerator(state, id) {
    const gen = GENERATORS.find(function (g) { return g.id === id; });
    if (!gen) return false;
    const cost = getGeneratorCost(state, id);
    if (state.brains >= cost) {
      state.brains -= cost;
      state.generators[id] = (state.generators[id] || 0) + 1;
      return true;
    }
    return false;
  }

  function buyGenerators(state, id, count) {
    if (!count || count <= 0) return 0;
    let bought = 0;
    for (let i = 0; i < count; i++) {
      if (!buyGenerator(state, id)) break;
      bought++;
    }
    return bought;
  }

  function getMaxAffordable(state, id) {
    const gen = GENERATORS.find(function (g) { return g.id === id; });
    if (!gen) return 0;
    let count = state.generators[id] || 0;
    let affordable = 0;
    let cost = getGeneratorCost(state, id);
    let brains = state.brains;
    while (brains >= cost) {
      brains -= cost;
      count++;
      affordable++;
      cost = gen.baseCost * Math.pow(1.15, count);
      if (state.prestige && state.prestige.upgrades) {
        const cheaperCount = state.prestige.upgrades.filter(function (puId) {
          const pu = PRESTIGE_UPGRADES.find(function (p) { return p.id === puId; });
          return pu && pu.effect === "cheaperGenerators";
        }).length;
        if (cheaperCount > 0) cost *= Math.pow(0.9, cheaperCount);
      }
      cost = Math.floor(cost);
    }
    return affordable;
  }

  function buyUpgrade(state, id) {
    const upg = UPGRADES.find(function (u) { return u.id === id; });
    if (!upg || state.upgrades.indexOf(id) !== -1) return false;
    if (state.brains >= upg.cost) {
      state.brains -= upg.cost;
      state.upgrades.push(id);
      return true;
    }
    return false;
  }

  function tick(state, dtSeconds) {
    if (dtSeconds <= 0) return;
    const bps = getBrainsPerSecond(state);
    if (bps > 0) {
      const gained = bps * dtSeconds;
      state.brains += gained;
      state.totalBrainsEarned += gained;
      if (bps > state.bestBps) state.bestBps = bps;
    }
  }

  function getPrestigeGain(state) {
    const total = state.totalBrainsEarned || 0;
    if (total < 1000000) return 0;
    return Math.floor(Math.sqrt(total / 1000000));
  }

  function prestige(state) {
    const gain = getPrestigeGain(state);
    const newState = createState();
    newState.achievements = state.achievements ? state.achievements.slice() : [];
    newState.prestige.souls = (state.prestige ? state.prestige.souls : 0) + gain;
    newState.prestige.totalSoulsEarned = (state.prestige ? state.prestige.totalSoulsEarned : 0) + gain;
    newState.prestige.upgrades = state.prestige ? state.prestige.upgrades.slice() : [];
    newState.startedAt = state.startedAt || Date.now();
    if (newState.prestige.upgrades) {
      const soulStartCount = newState.prestige.upgrades.filter(function (puId) {
        const pu = PRESTIGE_UPGRADES.find(function (p) { return p.id === puId; });
        return pu && pu.effect === "soulStart";
      }).length;
      if (soulStartCount > 0) {
        newState.brains = soulStartCount * 100;
        newState.totalBrainsEarned = soulStartCount * 100;
      }
    }
    return newState;
  }

  function buyPrestigeUpgrade(state, id) {
    const pu = PRESTIGE_UPGRADES.find(function (p) { return p.id === id; });
    if (!pu) return false;
    if (state.prestige.upgrades.indexOf(id) !== -1) return false;
    if (state.prestige.souls >= pu.cost) {
      state.prestige.souls -= pu.cost;
      state.prestige.upgrades.push(id);
      return true;
    }
    return false;
  }

  function checkAchievements(state) {
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach(function (ach) {
      if (state.achievements.indexOf(ach.id) !== -1) return;
      let met = false;
      if (ach.type === "clicks") {
        met = state.totalClicks >= ach.threshold;
      } else if (ach.type === "totalBrains") {
        met = state.totalBrainsEarned >= ach.threshold;
      } else if (ach.type === "generatorCount") {
        let total = 0;
        Object.keys(state.generators).forEach(function (k) { total += state.generators[k]; });
        met = total >= ach.threshold;
      } else if (ach.type === "generators") {
        let types = 0;
        Object.keys(state.generators).forEach(function (k) { if (state.generators[k] > 0) types++; });
        met = types >= ach.threshold;
      }
      if (met) {
        state.achievements.push(ach.id);
        newlyUnlocked.push(ach.id);
      }
    });
    return newlyUnlocked;
  }

  function getStats(state) {
    let generatorsOwned = 0;
    Object.keys(state.generators).forEach(function (k) { generatorsOwned += state.generators[k]; });
    const elapsedSeconds = (Date.now() - (state.startedAt || Date.now())) / 1000;
    return {
      totalBrainsEarned: state.totalBrainsEarned || 0,
      totalClicks: state.totalClicks || 0,
      bestBps: state.bestBps || 0,
      elapsedSeconds: elapsedSeconds,
      generatorsOwned: generatorsOwned
    };
  }

  function serialize(state) {
    return JSON.stringify(state);
  }

  function deserialize(text) {
    try {
      const parsed = JSON.parse(text);
      const base = createState();
      const result = Object.assign(base, parsed);
      if (!result.prestige) result.prestige = { souls: 0, totalSoulsEarned: 0, upgrades: [] };
      if (!Array.isArray(result.prestige.upgrades)) result.prestige.upgrades = [];
      if (!Array.isArray(result.upgrades)) result.upgrades = [];
      if (!Array.isArray(result.achievements)) result.achievements = [];
      if (!result.generators) result.generators = {};
      if (!result.startedAt) result.startedAt = Date.now();
      return result;
    } catch (e) {
      return createState();
    }
  }

  function getOfflineCapSeconds(state) {
    let cap = BASE_OFFLINE_CAP_SECONDS;
    if (state.prestige && state.prestige.upgrades) {
      const offlineBoostCount = state.prestige.upgrades.filter(function (puId) {
        const pu = PRESTIGE_UPGRADES.find(function (p) { return p.id === puId; });
        return pu && pu.effect === "offlineBoost";
      }).length;
      if (offlineBoostCount > 0) {
        cap += cap * 0.5 * offlineBoostCount;
      }
    }
    return cap;
  }

  function applyOfflineProgress(state, elapsedSeconds) {
    if (elapsedSeconds <= 0) return 0;
    const cap = getOfflineCapSeconds(state);
    const effective = Math.min(elapsedSeconds, cap);
    const bps = getBrainsPerSecond(state);
    const gained = bps * effective;
    state.brains += gained;
    state.totalBrainsEarned += gained;
    return gained;
  }

  function exportSave(state) {
    const json = JSON.stringify(state);
    if (typeof btoa !== "undefined") {
      return btoa(unescape(encodeURIComponent(json)));
    }
    return json;
  }

  function importSave(text) {
    try {
      let json;
      if (typeof atob !== "undefined") {
        json = decodeURIComponent(escape(atob(text)));
      } else {
        json = text;
      }
      return deserialize(json);
    } catch (e) {
      return createState();
    }
  }

  const Game = {
    GENERATORS,
    UPGRADES,
    ACHIEVEMENTS,
    PRESTIGE_UPGRADES,
    createState,
    click,
    buyGenerator,
    buyGenerators,
    getMaxAffordable,
    buyUpgrade,
    tick,
    getBrainsPerSecond,
    getClickValue,
    getGeneratorCost,
    getGlobalMultiplier,
    getPrestigeGain,
    prestige,
    buyPrestigeUpgrade,
    checkAchievements,
    getStats,
    formatNumber,
    serialize,
    deserialize,
    getOfflineCapSeconds,
    applyOfflineProgress,
    exportSave,
    importSave
  };

  if (typeof module !== "undefined") module.exports = Game;
  if (typeof window !== "undefined") window.Game = Game;
})();
