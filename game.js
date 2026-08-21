(function () {
  "use strict";

  const GENERATORS = [
    { id: "superviviente", name: "Superviviente asustado", icon: "🏃", desc: "Un humano que apenas puede moverse", baseCost: 15, bps: 0.1, growth: 1.15, costGrowth: 1.15 },
    { id: "mordedor", name: "Mordedor", icon: "🧟", desc: "Zombie básico con hambre de cerebros", baseCost: 100, bps: 1, growth: 1.15, costGrowth: 1.15 },
    { id: "corredor", name: "Corredor", icon: "🏃‍♂️", desc: "Zombie rápido y hambriento", baseCost: 1100, bps: 8, growth: 1.15, costGrowth: 1.15 },
    { id: "rabioso", name: "Rabioso", icon: "🐺", desc: "Zombie furioso e impredecible", baseCost: 12000, bps: 47, growth: 1.15, costGrowth: 1.15 },
    { id: "jefe", name: "Jefe zombie", icon: "👹", desc: "Un jefe que lidera la horda", baseCost: 130000, bps: 260, growth: 1.15, costGrowth: 1.15 },
    { id: "horde", name: "Horda", icon: "👥", desc: "Una multitud de zombies", baseCost: 1400000, bps: 1400, growth: 1.15, costGrowth: 1.15 },
    { id: "necropolis", name: "Necrópolis", icon: "🏚️", desc: "Ciudad de los muertos", baseCost: 15000000, bps: 7800, growth: 1.15, costGrowth: 1.15 },
    { id: "virus-alfa", name: "Virus Alfa", icon: "🧬", desc: "Plaga altamente contagiosa", baseCost: 200000000, bps: 44000, growth: 1.15, costGrowth: 1.15 },
    { id: "apocalipsis", name: "Apocalipsis", icon: "☄️", desc: "El fin de la humanidad", baseCost: 3300000000, bps: 260000, growth: 1.15, costGrowth: 1.15 },
    { id: "zombie-dios", name: "Zombie Dios", icon: "👑", desc: "Deidad de la no-muerte", baseCost: 51000000000, bps: 1500000, growth: 1.15, costGrowth: 1.15 }
  ];

  const UPGRADES = [
    { id: "dedos-podridos", name: "Dedos podridos", icon: "✋", desc: "Mejora el click", baseCost: 100, costGrowth: 2.5, maxLevel: 5, type: "click", perLevel: 1.5 },
    { id: "mandibula-filosa", name: "Mandíbula filosa", icon: "🦷", desc: "Mejora el click", baseCost: 1000, costGrowth: 2.5, maxLevel: 5, type: "click", perLevel: 1.5 },
    { id: "garras-infectadas", name: "Garras infectadas", icon: "🐾", desc: "Mejora el click", baseCost: 10000, costGrowth: 2.5, maxLevel: 5, type: "click", perLevel: 1.6 },
    { id: "puño-demolicion", name: "Puño demolición", icon: "👊", desc: "Mejora el click", baseCost: 100000, costGrowth: 2.5, maxLevel: 5, type: "click", perLevel: 1.7 },
    { id: "superviviente-veloz", name: "Superviviente veloz", icon: "⚡", desc: "Potencia supervivientes", baseCost: 500, costGrowth: 2.5, maxLevel: 5, type: "generator", generatorId: "superviviente", perLevel: 1.5 },
    { id: "mordedura-profunda", name: "Mordedura profunda", icon: "🦴", desc: "Potencia mordedores", baseCost: 5000, costGrowth: 2.5, maxLevel: 5, type: "generator", generatorId: "mordedor", perLevel: 1.5 },
    { id: "corredor-mutado", name: "Corredor mutado", icon: "🧪", desc: "Potencia corredores", baseCost: 50000, costGrowth: 2.5, maxLevel: 5, type: "generator", generatorId: "corredor", perLevel: 1.5 },
    { id: "rabia-eterna", name: "Rabia eterna", icon: "🔥", desc: "Potencia rabiosos", baseCost: 500000, costGrowth: 2.5, maxLevel: 5, type: "generator", generatorId: "rabioso", perLevel: 1.5 },
    { id: "jefe-alpha", name: "Jefe alpha", icon: "👑", desc: "Potencia jefes", baseCost: 5000000, costGrowth: 2.5, maxLevel: 5, type: "generator", generatorId: "jefe", perLevel: 1.5 },
    { id: "fuerza-sobrenatural", name: "Fuerza sobrenatural", icon: "💪", desc: "Multiplicador global", baseCost: 1000000, costGrowth: 2.5, maxLevel: 5, type: "global", perLevel: 1.25 },
    { id: "horde-voraz", name: "Horda voraz", icon: "👥", desc: "Potencia hordas", baseCost: 20000000, costGrowth: 2.5, maxLevel: 5, type: "generator", generatorId: "horde", perLevel: 1.5 },
    { id: "necropolis-oscura", name: "Necrópolis oscura", icon: "🏚️", desc: "Potencia necrópolis", baseCost: 200000000, costGrowth: 2.5, maxLevel: 5, type: "generator", generatorId: "necropolis", perLevel: 1.5 },
    { id: "virus-letal", name: "Virus letal", icon: "🧬", desc: "Potencia Virus Alfa", baseCost: 2000000000, costGrowth: 2.5, maxLevel: 5, type: "generator", generatorId: "virus-alfa", perLevel: 1.5 },
    { id: "reflejos-muertos", name: "Reflejos muertos", icon: "💀", desc: "Mejora el click", baseCost: 500000, costGrowth: 2.5, maxLevel: 5, type: "click", perLevel: 1.5 },
    { id: "golpe-critico", name: "Golpe crítico", icon: "💥", desc: "Chance de crítico ×10", baseCost: 25000, costGrowth: 2.5, maxLevel: 5, type: "crit", perLevel: 0.05 },
    { id: "cerebros-baratos", name: "Cerebros baratos", icon: "📉", desc: "Generadores más baratos", baseCost: 75000, costGrowth: 2.5, maxLevel: 5, type: "cheaper", perLevel: 0.05 }
  ];

  const ACHIEVEMENTS = [
    { id: "primer-cerebro", name: "Primer cerebro", desc: "Gana tu primer cerebro", type: "totalBrains", threshold: 1, bonus: 0.02 },
    { id: "cerebros-100", name: "Cerebros x100", desc: "Gana 100 cerebros", type: "totalBrains", threshold: 100, bonus: 0.02 },
    { id: "clicks-100", name: "Clicks x100", desc: "Haz 100 clicks", type: "clicks", threshold: 100, bonus: 0.02 },
    { id: "clicks-1000", name: "Clicks x1000", desc: "Haz 1000 clicks", type: "clicks", threshold: 1000, bonus: 0.02 },
    { id: "gen-1", name: "Primer generador", desc: "Compra 1 generador", type: "generatorCount", threshold: 1, bonus: 0.02 },
    { id: "gen-10", name: "Horda pequeña", desc: "Compra 10 generadores", type: "generatorCount", threshold: 10, bonus: 0.02 },
    { id: "gen-50", name: "Horda grande", desc: "Compra 50 generadores", type: "generatorCount", threshold: 50, bonus: 0.02 },
    { id: "todos-generadores", name: "Ejército completo", desc: "Posee al menos 1 de cada generador", type: "generators", target: ["superviviente","mordedor","corredor","rabioso","jefe","horde","necropolis","virus-alfa","apocalipsis","zombie-dios"], bonus: 0.02 }
  ];

  const PRESTIGE_UPGRADES = [
    { id: "bpsBoost", name: "BPS Boost", desc: "+10% BPS", cost: 1, effect: "bpsBoost", value: 0.10 },
    { id: "clickBoost", name: "Click Boost", desc: "+20% click", cost: 1, effect: "clickBoost", value: 0.20 },
    { id: "soulStart", name: "Soul Start", desc: "+100 cerebros iniciales", cost: 2, effect: "soulStart", value: 100 },
    { id: "offlineBoost", name: "Offline Boost", desc: "+50% offline cap", cost: 2, effect: "offlineBoost", value: 0.50 },
    { id: "cheaperGenerators", name: "Cheaper Generators", desc: "-10% costo", cost: 3, effect: "cheaperGenerators", value: 0.10 },
    { id: "autoClick", name: "Auto Click", desc: "Click automático cada 2s", cost: 5, effect: "autoClick", value: 1 }
  ];

  const COSMETICS = [
    { id: "skin-classic", name: "Zombie clásico", slot: "skin", cost: 0, icon: "🧟" },
    { id: "skin-rot", name: "Putrefacto", slot: "skin", cost: 5000, icon: "🤢" },
    { id: "skin-neon", name: "Neon infectado", slot: "skin", cost: 50000, icon: "💚" },
    { id: "skin-king", name: "Rey de la horda", slot: "skin", cost: 500000, icon: "👑" },
    { id: "aura-none", name: "Sin aura", slot: "aura", cost: 0, icon: "⚫" },
    { id: "aura-green", name: "Aura podrida", slot: "aura", cost: 2500, icon: "🟢" },
    { id: "aura-blood", name: "Aura sangre", slot: "aura", cost: 25000, icon: "🔴" },
    { id: "aura-gold", name: "Aura dorada", slot: "aura", cost: 250000, icon: "🟡" },
    { id: "bg-void", name: "Vacío", slot: "bg", cost: 0, icon: "🌑" },
    { id: "bg-fog", name: "Niebla", slot: "bg", cost: 10000, icon: "🌫️" },
    { id: "bg-necro", name: "Necrópolis", slot: "bg", cost: 100000, icon: "🏚️" }
  ];

  const OFFLINE_CAP_SECONDS = 8 * 3600;

  function createState() {
    const s = {
      brains: 0,
      totalClicks: 0,
      totalBrainsEarned: 0,
      bestBps: 0,
      generators: {},
      upgrades: {},
      achievements: [],
      prestige: {
        souls: 0,
        totalSoulsEarned: 0,
        upgrades: []
      },
      cosmetics: {
        owned: ["skin-classic", "aura-none", "bg-void"],
        equipped: { skin: "skin-classic", aura: "aura-none", bg: "bg-void" }
      },
      startedAt: Date.now(),
      lastSaved: Date.now()
    };
    GENERATORS.forEach(g => { s.generators[g.id] = 0; });
    return s;
  }

  function getUpgradeLevel(state, id) {
    if (!state || !state.upgrades || typeof state.upgrades !== "object") return 0;
    const lvl = state.upgrades[id];
    return typeof lvl === "number" && lvl > 0 ? Math.floor(lvl) : 0;
  }

  function getUpgradeCost(state, id) {
    const u = UPGRADES.find(x => x.id === id);
    if (!u) return Infinity;
    const level = getUpgradeLevel(state, id);
    if (level >= u.maxLevel) return Infinity;
    return Math.ceil(u.baseCost * Math.pow(u.costGrowth, level));
  }

  function getCritChance(state) {
    let chance = 0;
    UPGRADES.forEach(u => {
      if (u.type === "crit") {
        chance += u.perLevel * getUpgradeLevel(state, u.id);
      }
    });
    return chance;
  }

  function getRunCheaperFactor(state) {
    let factor = 1;
    UPGRADES.forEach(u => {
      if (u.type === "cheaper") {
        const level = getUpgradeLevel(state, u.id);
        if (level > 0) {
          factor *= Math.pow(1 - u.perLevel, level);
        }
      }
    });
    return factor;
  }

  function migrateUpgrades(raw) {
    const result = {};
    if (Array.isArray(raw)) {
      raw.forEach(id => {
        if (typeof id !== "string") return;
        const u = UPGRADES.find(x => x.id === id);
        if (!u) return;
        result[id] = 1;
      });
      return result;
    }
    if (raw && typeof raw === "object") {
      for (const id in raw) {
        if (!Object.prototype.hasOwnProperty.call(raw, id)) continue;
        const u = UPGRADES.find(x => x.id === id);
        if (!u) continue;
        let lvl = Math.floor(Number(raw[id]) || 0);
        if (lvl < 0) lvl = 0;
        if (lvl > u.maxLevel) lvl = u.maxLevel;
        if (lvl > 0) result[id] = lvl;
      }
    }
    return result;
  }

  function getGlobalMultiplier(state) {
    let mult = 1;
    mult += (state.prestige && state.prestige.souls || 0) * 0.05;
    ACHIEVEMENTS.forEach(a => {
      if (state.achievements.indexOf(a.id) !== -1) {
        mult += a.bonus;
      }
    });
    UPGRADES.forEach(u => {
      if (u.type === "global") {
        const level = getUpgradeLevel(state, u.id);
        if (level > 0) {
          mult += (u.perLevel - 1) * level;
        }
      }
    });
    if (state.prestige && Array.isArray(state.prestige.upgrades)) {
      PRESTIGE_UPGRADES.forEach(pu => {
        if (state.prestige.upgrades.indexOf(pu.id) !== -1) {
          if (pu.effect === "bpsBoost") mult += pu.value;
          if (pu.effect === "clickBoost") mult += pu.value;
        }
      });
    }
    return mult;
  }

  function getClickValue(state) {
    let power = 1;
    UPGRADES.forEach(u => {
      if (u.type === "click") {
        const level = getUpgradeLevel(state, u.id);
        if (level > 0) {
          power *= Math.pow(u.perLevel, level);
        }
      }
    });
    return power * getGlobalMultiplier(state);
  }

  function getGeneratorBps(state, genId) {
    const gen = GENERATORS.find(g => g.id === genId);
    if (!gen) return 0;
    let bps = gen.bps;
    UPGRADES.forEach(u => {
      if (u.type === "generator" && u.generatorId === genId) {
        const level = getUpgradeLevel(state, u.id);
        if (level > 0) {
          bps *= Math.pow(u.perLevel, level);
        }
      }
    });
    return bps;
  }

  function getBrainsPerSecond(state) {
    let total = 0;
    GENERATORS.forEach(g => {
      total += (state.generators[g.id] || 0) * getGeneratorBps(state, g.id);
    });
    return total * getGlobalMultiplier(state);
  }

  function getGeneratorCost(state, id) {
    const gen = GENERATORS.find(g => g.id === id);
    if (!gen) return Infinity;
    const count = state.generators[id] || 0;
    let cost = Math.ceil(gen.baseCost * Math.pow(gen.growth, count));
    // Descuento acumulativo por cheaperGenerators (10% cada uno)
    if (state.prestige && Array.isArray(state.prestige.upgrades)) {
      const cheaperCount = state.prestige.upgrades.filter(uid => {
        const pu = PRESTIGE_UPGRADES.find(p => p.id === uid);
        return pu && pu.effect === "cheaperGenerators";
      }).length;
      if (cheaperCount > 0) {
        cost = Math.ceil(cost * Math.pow(0.9, cheaperCount));
      }
    }
    cost = Math.ceil(cost * getRunCheaperFactor(state));
    return cost;
  }

  function formatNumber(n) {
    if (n < 1000) return Math.floor(n).toString();
    if (n < 1000000) return (n / 1000).toFixed(1) + "K";
    if (n < 1000000000) return (n / 1000000).toFixed(1) + "M";
    if (n < 1000000000000) return (n / 1000000000).toFixed(1) + "B";
    return (n / 1000000000000).toFixed(1) + "T";
  }

  function click(state) {
    let value = getClickValue(state);
    const critChance = getCritChance(state);
    const roll = typeof Game._random === "function" ? Game._random() : Math.random();
    if (critChance > 0 && roll < critChance) {
      value *= 10;
    }
    state.brains += value;
    state.totalBrainsEarned += value;
    state.totalClicks += 1;
    return value;
  }

  function buyGenerator(state, id) {
    const cost = getGeneratorCost(state, id);
    if (state.brains >= cost && isFinite(cost)) {
      state.brains -= cost;
      state.generators[id] = (state.generators[id] || 0) + 1;
      return true;
    }
    return false;
  }

  function buyGenerators(state, id, count) {
    if (count <= 0) return 0;
    let bought = 0;
    for (let i = 0; i < count; i++) {
      if (buyGenerator(state, id)) {
        bought++;
      } else {
        break;
      }
    }
    return bought;
  }

  function getMaxAffordable(state, id) {
    const gen = GENERATORS.find(g => g.id === id);
    if (!gen) return 0;
    let count = 0;
    let brains = state.brains;
    let owned = state.generators[id] || 0;
    const cheaperCount = state.prestige && Array.isArray(state.prestige.upgrades)
      ? state.prestige.upgrades.filter(uid => {
          const pu = PRESTIGE_UPGRADES.find(p => p.id === uid);
          return pu && pu.effect === "cheaperGenerators";
        }).length
      : 0;
    const runCheaper = getRunCheaperFactor(state);
    while (count < 100000) {
      let cost = Math.ceil(gen.baseCost * Math.pow(gen.growth, owned + count));
      if (cheaperCount > 0) {
        cost = Math.ceil(cost * Math.pow(0.9, cheaperCount));
      }
      cost = Math.ceil(cost * runCheaper);
      if (brains >= cost) {
        brains -= cost;
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  function buyUpgrade(state, id) {
    const u = UPGRADES.find(x => x.id === id);
    if (!u) return false;
    if (!state.upgrades || typeof state.upgrades !== "object" || Array.isArray(state.upgrades)) {
      state.upgrades = migrateUpgrades(state.upgrades);
    }
    const level = getUpgradeLevel(state, id);
    if (level >= u.maxLevel) return false;
    const cost = getUpgradeCost(state, id);
    if (!isFinite(cost) || state.brains < cost) return false;
    state.brains -= cost;
    state.upgrades[id] = level + 1;
    return true;
  }

  function getPrestigeGain(state) {
    return Math.max(0, Math.floor(Math.sqrt(state.totalBrainsEarned / 1000000)));
  }

  function prestige(state) {
    const gain = getPrestigeGain(state);
    const newState = createState();
    newState.startedAt = state.startedAt;
    newState.achievements = state.achievements.slice();
    newState.prestige = {
      souls: (state.prestige ? state.prestige.souls : 0) + gain,
      totalSoulsEarned: (state.prestige ? state.prestige.totalSoulsEarned : 0) + gain,
      upgrades: state.prestige && Array.isArray(state.prestige.upgrades) ? state.prestige.upgrades.slice() : []
    };
    if (newState.prestige.upgrades.indexOf("soulStart") !== -1) {
      newState.brains = 100;
      newState.totalBrainsEarned = 100;
    }
    if (state.cosmetics && Array.isArray(state.cosmetics.owned) && state.cosmetics.equipped) {
      newState.cosmetics = {
        owned: state.cosmetics.owned.slice(),
        equipped: {
          skin: state.cosmetics.equipped.skin || "skin-classic",
          aura: state.cosmetics.equipped.aura || "aura-none",
          bg: state.cosmetics.equipped.bg || "bg-void"
        }
      };
    }
    return newState;
  }

  function buyCosmetic(state, id) {
    const cos = COSMETICS.find(c => c.id === id);
    if (!cos) return false;
    if (!state.cosmetics || !Array.isArray(state.cosmetics.owned)) {
      state.cosmetics = {
        owned: ["skin-classic", "aura-none", "bg-void"],
        equipped: { skin: "skin-classic", aura: "aura-none", bg: "bg-void" }
      };
    }
    if (state.cosmetics.owned.indexOf(id) !== -1) return false;
    if (state.brains < cos.cost) return false;
    state.brains -= cos.cost;
    state.cosmetics.owned.push(id);
    return true;
  }

  function equipCosmetic(state, id) {
    const cos = COSMETICS.find(c => c.id === id);
    if (!cos) return false;
    if (!state.cosmetics || !Array.isArray(state.cosmetics.owned)) return false;
    if (state.cosmetics.owned.indexOf(id) === -1) return false;
    if (!state.cosmetics.equipped) {
      state.cosmetics.equipped = { skin: "skin-classic", aura: "aura-none", bg: "bg-void" };
    }
    state.cosmetics.equipped[cos.slot] = id;
    return true;
  }

  function buyPrestigeUpgrade(state, id) {
    const pu = PRESTIGE_UPGRADES.find(x => x.id === id);
    if (!pu || !state.prestige) return false;
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
    ACHIEVEMENTS.forEach(a => {
      if (state.achievements.indexOf(a.id) !== -1) return;
      let unlocked = false;
      if (a.type === "totalBrains") {
        unlocked = state.totalBrainsEarned >= a.threshold;
      } else if (a.type === "clicks") {
        unlocked = state.totalClicks >= a.threshold;
      } else if (a.type === "generatorCount") {
        let total = 0;
        GENERATORS.forEach(g => { total += (state.generators[g.id] || 0); });
        unlocked = total >= a.threshold;
      } else if (a.type === "generators" && Array.isArray(a.target)) {
        unlocked = a.target.every(tid => (state.generators[tid] || 0) >= 1);
      }
      if (unlocked) {
        state.achievements.push(a.id);
        newlyUnlocked.push(a.id);
      }
    });
    return newlyUnlocked;
  }

  function getStats(state) {
    let generatorsOwned = 0;
    GENERATORS.forEach(g => { generatorsOwned += (state.generators[g.id] || 0); });
    return {
      totalBrainsEarned: state.totalBrainsEarned,
      totalClicks: state.totalClicks,
      bestBps: state.bestBps,
      elapsedSeconds: (Date.now() - (state.startedAt || Date.now())) / 1000,
      generatorsOwned: generatorsOwned
    };
  }

  function serialize(state) {
    return JSON.stringify(state);
  }

  function deserialize(text) {
    try {
      const data = JSON.parse(text);
      const state = createState();
      if (data && typeof data === "object") {
        if (typeof data.brains === "number") state.brains = data.brains;
        if (typeof data.totalClicks === "number") state.totalClicks = data.totalClicks;
        if (typeof data.totalBrainsEarned === "number") state.totalBrainsEarned = data.totalBrainsEarned;
        if (typeof data.bestBps === "number") state.bestBps = data.bestBps;
        if (typeof data.startedAt === "number") state.startedAt = data.startedAt;
        if (typeof data.lastSaved === "number") state.lastSaved = data.lastSaved;
        if (data.generators && typeof data.generators === "object") {
          for (const id in data.generators) {
            if (state.generators.hasOwnProperty(id)) {
              state.generators[id] = data.generators[id] || 0;
            }
          }
        }
        if (data.upgrades !== undefined) {
          state.upgrades = migrateUpgrades(data.upgrades);
        }
        if (Array.isArray(data.achievements)) state.achievements = data.achievements.slice();
        if (data.prestige && typeof data.prestige === "object") {
          if (typeof data.prestige.souls === "number") state.prestige.souls = data.prestige.souls;
          if (typeof data.prestige.totalSoulsEarned === "number") state.prestige.totalSoulsEarned = data.prestige.totalSoulsEarned;
          if (Array.isArray(data.prestige.upgrades)) state.prestige.upgrades = data.prestige.upgrades.slice();
        }
        if (data.cosmetics && typeof data.cosmetics === "object") {
          if (Array.isArray(data.cosmetics.owned)) {
            state.cosmetics.owned = data.cosmetics.owned.filter(id => COSMETICS.some(c => c.id === id));
            if (state.cosmetics.owned.length === 0) {
              state.cosmetics.owned = ["skin-classic", "aura-none", "bg-void"];
            }
          }
          if (data.cosmetics.equipped && typeof data.cosmetics.equipped === "object") {
            ["skin", "aura", "bg"].forEach(slot => {
              const val = data.cosmetics.equipped[slot];
              if (typeof val === "string" && state.cosmetics.owned.indexOf(val) !== -1) {
                state.cosmetics.equipped[slot] = val;
              }
            });
          }
        }
      }
      return state;
    } catch (e) {
      return createState();
    }
  }

  function getOfflineCapSeconds(state) {
    let cap = OFFLINE_CAP_SECONDS;
    if (state.prestige && Array.isArray(state.prestige.upgrades)) {
      const boostCount = state.prestige.upgrades.filter(uid => {
        const pu = PRESTIGE_UPGRADES.find(p => p.id === uid);
        return pu && pu.effect === "offlineBoost";
      }).length;
      cap *= (1 + 0.5 * boostCount);
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
    try {
      return btoa(serialize(state));
    } catch (e) {
      return "";
    }
  }

  function importSave(text) {
    try {
      return deserialize(atob(text));
    } catch (e) {
      return createState();
    }
  }

  function isValidDisplayName(name) {
    return typeof name === "string" && /^[A-Za-z0-9_]{3,16}$/.test(name);
  }

  function totalSoulsEarned(state) {
    if (!state || !state.prestige) return 0;
    return typeof state.prestige.totalSoulsEarned === "number" ? state.prestige.totalSoulsEarned : 0;
  }

  function isFreshState(state) {
    if (!state) return true;
    return (state.totalBrainsEarned || 0) === 0
      && (state.totalClicks || 0) === 0
      && totalSoulsEarned(state) === 0;
  }

  function cloudStatsFromState(state) {
    if (!state) {
      return { total_brains_earned: 0, prestige_souls: 0, best_bps: 0 };
    }
    const souls = state.prestige && typeof state.prestige.souls === "number" ? state.prestige.souls : 0;
    return {
      total_brains_earned: typeof state.totalBrainsEarned === "number" ? state.totalBrainsEarned : 0,
      prestige_souls: souls,
      best_bps: typeof state.bestBps === "number" ? state.bestBps : 0
    };
  }

  function pickPreferredSave(local, cloud) {
    if (!cloud && !local) {
      return { source: "local", state: createState(), reason: "empty" };
    }
    if (!cloud) {
      return { source: "local", state: local, reason: "no-cloud" };
    }
    if (!local) {
      return { source: "cloud", state: cloud, reason: "no-local" };
    }

    const localFresh = isFreshState(local);
    const cloudFresh = isFreshState(cloud);
    if (localFresh && !cloudFresh) {
      return { source: "cloud", state: cloud, reason: "local-fresh" };
    }
    if (cloudFresh && !localFresh) {
      return { source: "local", state: local, reason: "cloud-fresh" };
    }

    const localSouls = totalSoulsEarned(local);
    const cloudSouls = totalSoulsEarned(cloud);
    if (cloudSouls !== localSouls) {
      if (cloudSouls > localSouls) return { source: "cloud", state: cloud, reason: "souls" };
      return { source: "local", state: local, reason: "souls" };
    }

    const localBrains = local.totalBrainsEarned || 0;
    const cloudBrains = cloud.totalBrainsEarned || 0;
    if (cloudBrains !== localBrains) {
      if (cloudBrains > localBrains) return { source: "cloud", state: cloud, reason: "brains" };
      return { source: "local", state: local, reason: "brains" };
    }

    const localSaved = local.lastSaved || 0;
    const cloudSaved = cloud.lastSaved || 0;
    if (cloudSaved > localSaved) {
      return { source: "cloud", state: cloud, reason: "lastSaved" };
    }
    return { source: "local", state: local, reason: "lastSaved" };
  }

  const Game = {
    GENERATORS: GENERATORS,
    UPGRADES: UPGRADES,
    ACHIEVEMENTS: ACHIEVEMENTS,
    PRESTIGE_UPGRADES: PRESTIGE_UPGRADES,
    COSMETICS: COSMETICS,
    _random: null,
    createState: createState,
    click: click,
    buyGenerator: buyGenerator,
    buyUpgrade: buyUpgrade,
    tick: function (state, dtSeconds) {
      if (dtSeconds <= 0) return;
      const bps = getBrainsPerSecond(state);
      const gain = bps * dtSeconds;
      state.brains += gain;
      state.totalBrainsEarned += gain;
      if (bps > state.bestBps) state.bestBps = bps;
    },
    getBrainsPerSecond: getBrainsPerSecond,
    getClickValue: getClickValue,
    getGeneratorCost: getGeneratorCost,
    getUpgradeLevel: getUpgradeLevel,
    getUpgradeCost: getUpgradeCost,
    getCritChance: getCritChance,
    formatNumber: formatNumber,
    serialize: serialize,
    deserialize: deserialize,
    applyOfflineProgress: applyOfflineProgress,
    buyGenerators: buyGenerators,
    getMaxAffordable: getMaxAffordable,
    getGlobalMultiplier: getGlobalMultiplier,
    getPrestigeGain: getPrestigeGain,
    prestige: prestige,
    buyPrestigeUpgrade: buyPrestigeUpgrade,
    buyCosmetic: buyCosmetic,
    equipCosmetic: equipCosmetic,
    checkAchievements: checkAchievements,
    getStats: getStats,
    exportSave: exportSave,
    importSave: importSave,
    getGeneratorBps: getGeneratorBps,
    getOfflineCapSeconds: getOfflineCapSeconds,
    isValidDisplayName: isValidDisplayName,
    isFreshState: isFreshState,
    pickPreferredSave: pickPreferredSave,
    cloudStatsFromState: cloudStatsFromState
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Game;
  }
  if (typeof window !== "undefined") {
    window.Game = Game;
  }
})();
