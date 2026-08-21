(function () {
  "use strict";

  const MILESTONE_THRESHOLDS = [25, 50, 100, 200, 400];
  const PRESTIGE_DIVISOR = 1e9;
  const SOUL_BONUS = 0.05;
  const GOLDEN_BONE_CHANCE = 0.10;
  const OFFLINE_CAP_SECONDS = 8 * 3600;

  const GENERATORS = [
    { id: "superviviente", name: "Superviviente asustado", icon: "🏃", desc: "Un humano que apenas puede moverse", baseCost: 15, bps: 0.1, growth: 1.15 },
    { id: "mordedor", name: "Mordedor", icon: "🧟", desc: "Zombie básico con hambre de cerebros", baseCost: 100, bps: 1, growth: 1.15 },
    { id: "corredor", name: "Corredor", icon: "🏃‍♂️", desc: "Zombie rápido y hambriento", baseCost: 1100, bps: 8, growth: 1.15 },
    { id: "rabioso", name: "Rabioso", icon: "🐺", desc: "Zombie furioso e impredecible", baseCost: 12000, bps: 47, growth: 1.15 },
    { id: "jefe", name: "Jefe zombie", icon: "👹", desc: "Un jefe que lidera la horda", baseCost: 130000, bps: 260, growth: 1.15 },
    { id: "horde", name: "Horda", icon: "👥", desc: "Una multitud de zombies", baseCost: 1400000, bps: 1400, growth: 1.15 },
    { id: "necropolis", name: "Necrópolis", icon: "🏚️", desc: "Ciudad de los muertos", baseCost: 15000000, bps: 7800, growth: 1.15 },
    { id: "virus-alfa", name: "Virus Alfa", icon: "🧬", desc: "Plaga altamente contagiosa", baseCost: 200000000, bps: 44000, growth: 1.15 },
    { id: "apocalipsis", name: "Apocalipsis", icon: "☄️", desc: "El fin de la humanidad", baseCost: 3300000000, bps: 260000, growth: 1.15 },
    { id: "zombie-dios", name: "Zombie Dios", icon: "👑", desc: "Deidad de la no-muerte", baseCost: 51000000000, bps: 1500000, growth: 1.15 },
    { id: "cementerio", name: "Cementerio infinito", icon: "⚰️", desc: "Tumbas que no dejan de abrirse", baseCost: 7.5e11, bps: 8.5e6, growth: 1.15 },
    { id: "plaga-mundial", name: "Plaga mundial", icon: "🌏", desc: "Ningún continente queda en pie", baseCost: 1.1e13, bps: 5.0e7, growth: 1.15 },
    { id: "dimension-rota", name: "Dimensión rota", icon: "🌀", desc: "El velo entre mundos se pudre", baseCost: 1.6e14, bps: 2.8e8, growth: 1.15 },
    { id: "trono-huesos", name: "Trono de huesos", icon: "🦴", desc: "Un asiento hecho de civilizaciones", baseCost: 2.5e15, bps: 1.6e9, growth: 1.15 },
    { id: "vacio-verdoso", name: "Vacío verdoso", icon: "🕳️", desc: "El final que todavía produce", baseCost: 4.0e16, bps: 9.0e9, growth: 1.15 }
  ];

  const LEGACY_TIER1 = {
    superviviente: { id: "superviviente-veloz", name: "Superviviente veloz", icon: "⚡", cost: 500 },
    mordedor: { id: "mordedura-profunda", name: "Mordedura profunda", icon: "🦴", cost: 5000 },
    corredor: { id: "corredor-mutado", name: "Corredor mutado", icon: "🧪", cost: 50000 },
    rabioso: { id: "rabia-eterna", name: "Rabia eterna", icon: "🔥", cost: 500000 },
    jefe: { id: "jefe-alpha", name: "Jefe alpha", icon: "👑", cost: 5000000 }
  };

  const UPGRADES = [
    { id: "dedos-podridos", name: "Dedos podridos", icon: "✋", desc: "x2 click", cost: 100, type: "click", multiplier: 2 },
    { id: "mandibula-filosa", name: "Mandíbula filosa", icon: "🦷", desc: "x2 click", cost: 1000, type: "click", multiplier: 2 },
    { id: "garras-infectadas", name: "Garras infectadas", icon: "🐾", desc: "x3 click", cost: 10000, type: "click", multiplier: 3 },
    { id: "puño-demolicion", name: "Puño demolición", icon: "👊", desc: "x5 click", cost: 100000, type: "click", multiplier: 5 },
    { id: "click-apocalipsis", name: "Click del fin", icon: "💥", desc: "x10 click", cost: 1e12, type: "click", multiplier: 10 },
    { id: "fuerza-sobrenatural", name: "Fuerza sobrenatural", icon: "💪", desc: "x1.5 global", cost: 1000000, type: "global", multiplier: 1.5 },
    { id: "hambre-colectiva", name: "Hambre colectiva", icon: "🍽️", desc: "x2 global", cost: 1e12, type: "global", multiplier: 2 },
    { id: "silencio-de-dioses", name: "Silencio de dioses", icon: "✨", desc: "x2 global", cost: 1e15, type: "global", multiplier: 2 }
  ];

  GENERATORS.forEach(function (g) {
    const t1 = LEGACY_TIER1[g.id];
    UPGRADES.push({
      id: t1 ? t1.id : "up-" + g.id + "-1",
      name: t1 ? t1.name : g.name + " despierto",
      icon: t1 ? t1.icon : g.icon,
      desc: "x2 " + g.name,
      cost: t1 ? t1.cost : Math.ceil(g.baseCost * 10),
      type: "generator",
      generatorId: g.id,
      multiplier: 2,
      unlockGen: g.id,
      unlockCount: 1
    });
    UPGRADES.push({
      id: "up-" + g.id + "-50",
      name: g.name + " x50",
      icon: g.icon,
      desc: "x2 " + g.name + " (50)",
      cost: Math.ceil(g.baseCost * 500),
      type: "generator",
      generatorId: g.id,
      multiplier: 2,
      unlockGen: g.id,
      unlockCount: 50
    });
    UPGRADES.push({
      id: "up-" + g.id + "-100",
      name: g.name + " x100",
      icon: g.icon,
      desc: "x2 " + g.name + " (100)",
      cost: Math.ceil(g.baseCost * 10000),
      type: "generator",
      generatorId: g.id,
      multiplier: 2,
      unlockGen: g.id,
      unlockCount: 100
    });
  });

  const ALL_GEN_IDS = GENERATORS.map(function (g) { return g.id; });

  const ACHIEVEMENTS = [
    { id: "primer-cerebro", name: "Primer cerebro", desc: "Gana tu primer cerebro", type: "totalBrains", threshold: 1, bonus: 0.02 },
    { id: "cerebros-100", name: "Cerebros x100", desc: "Gana 100 cerebros", type: "totalBrains", threshold: 100, bonus: 0.02 },
    { id: "cerebros-1k", name: "Mil cerebros", desc: "Gana 1.000 cerebros", type: "totalBrains", threshold: 1000, bonus: 0.02 },
    { id: "cerebros-1m", name: "Un millón", desc: "Gana 1 millón de cerebros", type: "totalBrains", threshold: 1e6, bonus: 0.02 },
    { id: "cerebros-1b", name: "Mil millones", desc: "Gana 1.000 millones de cerebros", type: "totalBrains", threshold: 1e9, bonus: 0.02 },
    { id: "cerebros-1t", name: "Billón de masa", desc: "Gana 1 billón de cerebros", type: "totalBrains", threshold: 1e12, bonus: 0.02 },
    { id: "cerebros-1qa", name: "Cuatrillón podrido", desc: "Gana 1e15 cerebros", type: "totalBrains", threshold: 1e15, bonus: 0.02 },
    { id: "clicks-100", name: "Clicks x100", desc: "Haz 100 clicks", type: "clicks", threshold: 100, bonus: 0.02 },
    { id: "clicks-1000", name: "Clicks x1000", desc: "Haz 1000 clicks", type: "clicks", threshold: 1000, bonus: 0.02 },
    { id: "clicks-10k", name: "Dedos de horda", desc: "Haz 10.000 clicks", type: "clicks", threshold: 10000, bonus: 0.02 },
    { id: "clicks-100k", name: "Martillo humano", desc: "Haz 100.000 clicks", type: "clicks", threshold: 100000, bonus: 0.02 },
    { id: "gen-1", name: "Primer generador", desc: "Compra 1 generador", type: "generatorCount", threshold: 1, bonus: 0.02 },
    { id: "gen-10", name: "Horda pequeña", desc: "Compra 10 generadores", type: "generatorCount", threshold: 10, bonus: 0.02 },
    { id: "gen-50", name: "Horda grande", desc: "Compra 50 generadores", type: "generatorCount", threshold: 50, bonus: 0.02 },
    { id: "gen-100", name: "Cien bocas", desc: "Compra 100 generadores", type: "generatorCount", threshold: 100, bonus: 0.02 },
    { id: "gen-250", name: "Marea", desc: "Compra 250 generadores", type: "generatorCount", threshold: 250, bonus: 0.02 },
    { id: "gen-500", name: "Marea negra", desc: "Compra 500 generadores", type: "generatorCount", threshold: 500, bonus: 0.02 },
    { id: "gen-1000", name: "Mil muertos", desc: "Compra 1000 generadores", type: "generatorCount", threshold: 1000, bonus: 0.02 },
    { id: "tipos-5", name: "Cinco especies", desc: "Posee 5 tipos de generador", type: "uniqueGenerators", threshold: 5, bonus: 0.02 },
    { id: "tipos-10", name: "Diez especies", desc: "Posee 10 tipos de generador", type: "uniqueGenerators", threshold: 10, bonus: 0.02 },
    { id: "todos-generadores", name: "Ejército completo", desc: "Posee al menos 1 de cada generador", type: "generators", target: ALL_GEN_IDS, bonus: 0.02 },
    { id: "hito-25", name: "Hito 25", desc: "Llega a 25 de cualquier generador", type: "anyGeneratorCount", threshold: 25, bonus: 0.02 },
    { id: "hito-50", name: "Hito 50", desc: "Llega a 50 de cualquier generador", type: "anyGeneratorCount", threshold: 50, bonus: 0.02 },
    { id: "hito-100", name: "Hito 100", desc: "Llega a 100 de cualquier generador", type: "anyGeneratorCount", threshold: 100, bonus: 0.02 },
    { id: "hito-200", name: "Hito 200", desc: "Llega a 200 de cualquier generador", type: "anyGeneratorCount", threshold: 200, bonus: 0.02 },
    { id: "horde-10", name: "Diez hordas", desc: "Posee 10 Hordas", type: "generatorOwned", generatorId: "horde", threshold: 10, bonus: 0.02 },
    { id: "dios-1", name: "Primer dios", desc: "Compra 1 Zombie Dios", type: "generatorOwned", generatorId: "zombie-dios", threshold: 1, bonus: 0.02 },
    { id: "vacio-1", name: "Mirar el vacío", desc: "Compra 1 Vacío verdoso", type: "generatorOwned", generatorId: "vacio-verdoso", threshold: 1, bonus: 0.02 },
    { id: "prestige-1", name: "Primera ascensión", desc: "Ascendé 1 vez", type: "prestigeCount", threshold: 1, bonus: 0.02 },
    { id: "prestige-5", name: "Cinco vidas", desc: "Ascendé 5 veces", type: "prestigeCount", threshold: 5, bonus: 0.02 },
    { id: "prestige-10", name: "Diez ciclos", desc: "Ascendé 10 veces", type: "prestigeCount", threshold: 10, bonus: 0.02 },
    { id: "prestige-25", name: "Veinticinco ciclos", desc: "Ascendé 25 veces", type: "prestigeCount", threshold: 25, bonus: 0.02 },
    { id: "bps-10", name: "Goteo", desc: "Alcanzá 10 BPS", type: "bps", threshold: 10, bonus: 0.02 },
    { id: "bps-1k", name: "Río de sesos", desc: "Alcanzá 1.000 BPS", type: "bps", threshold: 1000, bonus: 0.02 },
    { id: "bps-1m", name: "Catarata", desc: "Alcanzá 1 millón de BPS", type: "bps", threshold: 1e6, bonus: 0.02 },
    { id: "bps-1b", name: "Océano", desc: "Alcanzá 1.000 millones de BPS", type: "bps", threshold: 1e9, bonus: 0.02 },
    { id: "click-100", name: "Puño pesado", desc: "Alcanzá 100 de click", type: "clickValue", threshold: 100, bonus: 0.02 },
    { id: "upgrades-10", name: "Diez mutaciones", desc: "Compra 10 mejoras de run", type: "upgradeCount", threshold: 10, bonus: 0.02 },
    { id: "bones-1", name: "Primer hueso", desc: "Obtené 1 hueso", type: "bones", threshold: 1, bonus: 0.02 },
    { id: "bones-10", name: "Osario", desc: "Obtené 10 huesos", type: "bones", threshold: 10, bonus: 0.02 }
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
    { id: "skin-classic", name: "Zombie clásico", slot: "skin", cost: 0, currency: "soulChips", icon: "🧟" },
    { id: "skin-rot", name: "Putrefacto", slot: "skin", cost: 1, currency: "soulChips", icon: "🤢" },
    { id: "skin-neon", name: "Neon infectado", slot: "skin", cost: 2, currency: "soulChips", icon: "💚" },
    { id: "skin-king", name: "Rey de la horda", slot: "skin", cost: 5, currency: "soulChips", icon: "👑" },
    { id: "aura-none", name: "Sin aura", slot: "aura", cost: 0, currency: "soulChips", icon: "⚫" },
    { id: "aura-green", name: "Aura podrida", slot: "aura", cost: 1, currency: "soulChips", icon: "🟢" },
    { id: "aura-blood", name: "Aura sangre", slot: "aura", cost: 2, currency: "soulChips", icon: "🔴" },
    { id: "aura-gold", name: "Aura dorada", slot: "aura", cost: 4, currency: "soulChips", icon: "🟡" },
    { id: "bg-void", name: "Vacío", slot: "bg", cost: 0, currency: "soulChips", icon: "🌑" },
    { id: "bg-fog", name: "Niebla", slot: "bg", cost: 1, currency: "soulChips", icon: "🌫️" },
    { id: "bg-necro", name: "Necrópolis", slot: "bg", cost: 3, currency: "soulChips", icon: "🏚️" }
  ];

  function normalizePrestige(raw) {
    const src = raw && typeof raw === "object" ? raw : {};
    const hasTotal = typeof src.totalSoulsEarned === "number" && isFinite(src.totalSoulsEarned);
    const hasChips = typeof src.soulChips === "number" && isFinite(src.soulChips);
    const oldSouls = typeof src.souls === "number" && isFinite(src.souls) ? Math.max(0, src.souls) : 0;
    const total = hasTotal ? Math.max(0, src.totalSoulsEarned) : 0;
    let level;
    let chips;
    if (hasChips) {
      chips = Math.max(0, src.soulChips);
      level = hasTotal ? total : oldSouls;
    } else {
      chips = oldSouls;
      level = hasTotal ? Math.max(total, oldSouls) : oldSouls;
    }
    return {
      souls: level,
      totalSoulsEarned: level,
      soulChips: chips,
      upgrades: Array.isArray(src.upgrades) ? src.upgrades.slice() : []
    };
  }

  function createState() {
    const s = {
      brains: 0,
      totalClicks: 0,
      totalBrainsEarned: 0,
      bestBps: 0,
      bones: 0,
      prestigeCount: 0,
      generators: {},
      upgrades: [],
      achievements: [],
      prestige: normalizePrestige(null),
      cosmetics: {
        owned: ["skin-classic", "aura-none", "bg-void"],
        equipped: { skin: "skin-classic", aura: "aura-none", bg: "bg-void" }
      },
      startedAt: Date.now(),
      lastSaved: Date.now()
    };
    GENERATORS.forEach(function (g) { s.generators[g.id] = 0; });
    return s;
  }

  function getSoulLevel(state) {
    if (!state || !state.prestige) return 0;
    return state.prestige.totalSoulsEarned || 0;
  }

  function getSoulChips(state) {
    if (!state || !state.prestige) return 0;
    return state.prestige.soulChips || 0;
  }

  function countPrestigeEffect(state, effect) {
    if (!state.prestige || !Array.isArray(state.prestige.upgrades)) return 0;
    let n = 0;
    PRESTIGE_UPGRADES.forEach(function (pu) {
      if (pu.effect === effect && state.prestige.upgrades.indexOf(pu.id) !== -1) n += 1;
    });
    return n;
  }

  function getMilestoneMultiplier(ownedCount) {
    let m = 1;
    const n = ownedCount || 0;
    MILESTONE_THRESHOLDS.forEach(function (t) {
      if (n >= t) m *= 2;
    });
    return m;
  }

  function isUpgradeVisible(state, upgrade) {
    if (!upgrade) return false;
    if (!upgrade.unlockGen) return true;
    const owned = state && state.generators ? (state.generators[upgrade.unlockGen] || 0) : 0;
    return owned >= (upgrade.unlockCount || 1);
  }

  function getGlobalMultiplier(state) {
    let mult = 1;
    mult += getSoulLevel(state) * SOUL_BONUS;
    ACHIEVEMENTS.forEach(function (a) {
      if (state.achievements && state.achievements.indexOf(a.id) !== -1) {
        mult += a.bonus;
      }
    });
    UPGRADES.forEach(function (u) {
      if (u.type === "global" && state.upgrades && state.upgrades.indexOf(u.id) !== -1) {
        mult += (u.multiplier - 1);
      }
    });
    if (countPrestigeEffect(state, "bpsBoost") > 0) {
      const pu = PRESTIGE_UPGRADES.find(function (p) { return p.effect === "bpsBoost"; });
      if (pu) mult += pu.value;
    }
    return mult;
  }

  function getClickValue(state) {
    let power = 1;
    UPGRADES.forEach(function (u) {
      if (u.type === "click" && state.upgrades && state.upgrades.indexOf(u.id) !== -1) {
        power *= u.multiplier;
      }
    });
    if (countPrestigeEffect(state, "clickBoost") > 0) {
      const pu = PRESTIGE_UPGRADES.find(function (p) { return p.effect === "clickBoost"; });
      if (pu) power *= (1 + pu.value);
    }
    return power * getGlobalMultiplier(state);
  }

  function getGeneratorBps(state, genId) {
    const gen = GENERATORS.find(function (g) { return g.id === genId; });
    if (!gen) return 0;
    let bps = gen.bps;
    UPGRADES.forEach(function (u) {
      if (u.type === "generator" && u.generatorId === genId && state.upgrades && state.upgrades.indexOf(u.id) !== -1) {
        bps *= u.multiplier;
      }
    });
    bps *= getMilestoneMultiplier(state.generators ? state.generators[genId] : 0);
    return bps;
  }

  function getBrainsPerSecond(state) {
    let total = 0;
    GENERATORS.forEach(function (g) {
      total += (state.generators[g.id] || 0) * getGeneratorBps(state, g.id);
    });
    return total * getGlobalMultiplier(state);
  }

  function getGeneratorCost(state, id) {
    const gen = GENERATORS.find(function (g) { return g.id === id; });
    if (!gen) return Infinity;
    const count = state.generators[id] || 0;
    let cost = Math.ceil(gen.baseCost * Math.pow(gen.growth, count));
    const cheaperCount = countPrestigeEffect(state, "cheaperGenerators");
    if (cheaperCount > 0) {
      cost = Math.ceil(cost * Math.pow(0.9, cheaperCount));
    }
    return cost;
  }

  const NUMBER_SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

  function formatNumber(n) {
    if (!isFinite(n)) return "∞";
    const abs = Math.abs(n);
    if (abs < 1000) return Math.floor(n).toString();
    let tier = Math.floor(Math.log(abs) / Math.log(1000));
    if (tier >= NUMBER_SUFFIXES.length) {
      return n.toExponential(2);
    }
    const val = n / Math.pow(1000, tier);
    return val.toFixed(1) + NUMBER_SUFFIXES[tier];
  }

  function click(state) {
    const value = getClickValue(state);
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
    const gen = GENERATORS.find(function (g) { return g.id === id; });
    if (!gen) return 0;
    let count = 0;
    let brains = state.brains;
    let owned = state.generators[id] || 0;
    const cheaperCount = countPrestigeEffect(state, "cheaperGenerators");
    while (count < 100000) {
      let cost = Math.ceil(gen.baseCost * Math.pow(gen.growth, owned + count));
      if (cheaperCount > 0) {
        cost = Math.ceil(cost * Math.pow(0.9, cheaperCount));
      }
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
    const u = UPGRADES.find(function (x) { return x.id === id; });
    if (!u) return false;
    if (!isUpgradeVisible(state, u)) return false;
    if (state.upgrades.indexOf(id) !== -1) return false;
    if (state.brains >= u.cost) {
      state.brains -= u.cost;
      state.upgrades.push(id);
      return true;
    }
    return false;
  }

  function getPrestigeGain(state) {
    return Math.max(0, Math.floor(Math.sqrt((state.totalBrainsEarned || 0) / PRESTIGE_DIVISOR)));
  }

  function copyCosmetics(fromState, toState) {
    if (fromState.cosmetics && Array.isArray(fromState.cosmetics.owned) && fromState.cosmetics.equipped) {
      toState.cosmetics = {
        owned: fromState.cosmetics.owned.slice(),
        equipped: {
          skin: fromState.cosmetics.equipped.skin || "skin-classic",
          aura: fromState.cosmetics.equipped.aura || "aura-none",
          bg: fromState.cosmetics.equipped.bg || "bg-void"
        }
      };
    }
  }

  function prestige(state) {
    const gain = getPrestigeGain(state);
    const newState = createState();
    newState.startedAt = state.startedAt;
    newState.achievements = state.achievements.slice();
    newState.bones = state.bones || 0;
    newState.prestigeCount = (state.prestigeCount || 0) + (gain > 0 ? 1 : 0);
    const prev = normalizePrestige(state.prestige);
    newState.prestige = {
      souls: prev.totalSoulsEarned + gain,
      totalSoulsEarned: prev.totalSoulsEarned + gain,
      soulChips: prev.soulChips + gain,
      upgrades: prev.upgrades.slice()
    };
    if (newState.prestige.upgrades.indexOf("soulStart") !== -1) {
      newState.brains = 100;
      newState.totalBrainsEarned = 100;
    }
    copyCosmetics(state, newState);
    return newState;
  }

  function spendSoulChips(state, amount) {
    if (!state.prestige) state.prestige = normalizePrestige(null);
    if ((state.prestige.soulChips || 0) < amount) return false;
    state.prestige.soulChips -= amount;
    return true;
  }

  function buyCosmetic(state, id) {
    const cos = COSMETICS.find(function (c) { return c.id === id; });
    if (!cos) return false;
    if (!state.cosmetics || !Array.isArray(state.cosmetics.owned)) {
      state.cosmetics = {
        owned: ["skin-classic", "aura-none", "bg-void"],
        equipped: { skin: "skin-classic", aura: "aura-none", bg: "bg-void" }
      };
    }
    if (state.cosmetics.owned.indexOf(id) !== -1) return false;
    if (cos.cost > 0) {
      const currency = cos.currency || "soulChips";
      if (currency === "soulChips") {
        if (!spendSoulChips(state, cos.cost)) return false;
      } else if (currency === "brains") {
        if (state.brains < cos.cost) return false;
        state.brains -= cos.cost;
      } else {
        return false;
      }
    }
    state.cosmetics.owned.push(id);
    return true;
  }

  function equipCosmetic(state, id) {
    const cos = COSMETICS.find(function (c) { return c.id === id; });
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
    const pu = PRESTIGE_UPGRADES.find(function (x) { return x.id === id; });
    if (!pu || !state.prestige) return false;
    if (state.prestige.upgrades.indexOf(id) !== -1) return false;
    if (spendSoulChips(state, pu.cost)) {
      state.prestige.upgrades.push(id);
      return true;
    }
    return false;
  }

  function totalGeneratorsOwned(state) {
    let total = 0;
    GENERATORS.forEach(function (g) { total += (state.generators[g.id] || 0); });
    return total;
  }

  function uniqueGeneratorsOwned(state) {
    let n = 0;
    GENERATORS.forEach(function (g) {
      if ((state.generators[g.id] || 0) >= 1) n += 1;
    });
    return n;
  }

  function maxGeneratorOwned(state) {
    let max = 0;
    GENERATORS.forEach(function (g) {
      const c = state.generators[g.id] || 0;
      if (c > max) max = c;
    });
    return max;
  }

  function achievementMet(state, a) {
    if (a.type === "totalBrains") return state.totalBrainsEarned >= a.threshold;
    if (a.type === "clicks") return state.totalClicks >= a.threshold;
    if (a.type === "generatorCount") return totalGeneratorsOwned(state) >= a.threshold;
    if (a.type === "generators" && Array.isArray(a.target)) {
      return a.target.every(function (tid) { return (state.generators[tid] || 0) >= 1; });
    }
    if (a.type === "prestigeCount") return (state.prestigeCount || 0) >= a.threshold;
    if (a.type === "bps") return getBrainsPerSecond(state) >= a.threshold;
    if (a.type === "bones") return (state.bones || 0) >= a.threshold;
    if (a.type === "uniqueGenerators") return uniqueGeneratorsOwned(state) >= a.threshold;
    if (a.type === "anyGeneratorCount") return maxGeneratorOwned(state) >= a.threshold;
    if (a.type === "generatorOwned") return (state.generators[a.generatorId] || 0) >= a.threshold;
    if (a.type === "clickValue") return getClickValue(state) >= a.threshold;
    if (a.type === "upgradeCount") return (state.upgrades ? state.upgrades.length : 0) >= a.threshold;
    return false;
  }

  function checkAchievements(state) {
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach(function (a) {
      if (state.achievements.indexOf(a.id) !== -1) return;
      if (achievementMet(state, a)) {
        state.achievements.push(a.id);
        newlyUnlocked.push(a.id);
      }
    });
    return newlyUnlocked;
  }

  function getStats(state) {
    return {
      totalBrainsEarned: state.totalBrainsEarned,
      totalClicks: state.totalClicks,
      bestBps: state.bestBps,
      elapsedSeconds: (Date.now() - (state.startedAt || Date.now())) / 1000,
      generatorsOwned: totalGeneratorsOwned(state),
      bones: state.bones || 0,
      prestigeCount: state.prestigeCount || 0,
      soulLevel: getSoulLevel(state),
      soulChips: getSoulChips(state)
    };
  }

  function serialize(state) {
    return JSON.stringify(state);
  }

  function deserialize(text) {
    try {
      const data = typeof text === "string" ? JSON.parse(text) : text;
      const state = createState();
      if (data && typeof data === "object") {
        if (typeof data.brains === "number") state.brains = data.brains;
        if (typeof data.totalClicks === "number") state.totalClicks = data.totalClicks;
        if (typeof data.totalBrainsEarned === "number") state.totalBrainsEarned = data.totalBrainsEarned;
        if (typeof data.bestBps === "number") state.bestBps = data.bestBps;
        if (typeof data.bones === "number") state.bones = Math.max(0, data.bones);
        if (typeof data.prestigeCount === "number") state.prestigeCount = Math.max(0, data.prestigeCount);
        if (typeof data.startedAt === "number") state.startedAt = data.startedAt;
        if (typeof data.lastSaved === "number") state.lastSaved = data.lastSaved;
        if (data.generators && typeof data.generators === "object") {
          for (const id in data.generators) {
            if (state.generators.hasOwnProperty(id)) {
              state.generators[id] = data.generators[id] || 0;
            }
          }
        }
        if (Array.isArray(data.upgrades)) state.upgrades = data.upgrades.slice();
        if (Array.isArray(data.achievements)) state.achievements = data.achievements.slice();
        if (data.prestige && typeof data.prestige === "object") {
          state.prestige = normalizePrestige(data.prestige);
        }
        if (data.cosmetics && typeof data.cosmetics === "object") {
          if (Array.isArray(data.cosmetics.owned)) {
            state.cosmetics.owned = data.cosmetics.owned.filter(function (id) {
              return COSMETICS.some(function (c) { return c.id === id; });
            });
            if (state.cosmetics.owned.length === 0) {
              state.cosmetics.owned = ["skin-classic", "aura-none", "bg-void"];
            }
          }
          if (data.cosmetics.equipped && typeof data.cosmetics.equipped === "object") {
            ["skin", "aura", "bg"].forEach(function (slot) {
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
    const boostCount = countPrestigeEffect(state, "offlineBoost");
    cap *= (1 + 0.5 * boostCount);
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

  function addBones(state, amount) {
    if (!amount || amount <= 0) return 0;
    state.bones = (state.bones || 0) + amount;
    return amount;
  }

  function applyGoldenBrain(state, roll) {
    const r = typeof roll === "number" ? roll : 1;
    if (r < GOLDEN_BONE_CHANCE) {
      addBones(state, 1);
      return { type: "bones", amount: 1 };
    }
    const reward = Math.max(100, Math.floor(getBrainsPerSecond(state) * 30));
    state.brains += reward;
    state.totalBrainsEarned += reward;
    return { type: "brains", amount: reward };
  }

  function getBossMaxHp(state) {
    const hp = 15 + 5 * getSoulLevel(state);
    return Math.max(15, Math.min(80, hp));
  }

  function applyBossKill(state) {
    const reward = Math.max(500, Math.floor(getBrainsPerSecond(state) * 60));
    state.brains += reward;
    state.totalBrainsEarned += reward;
    addBones(state, 1);
    return { brains: reward, bones: 1 };
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

  const Game = {
    GENERATORS: GENERATORS,
    UPGRADES: UPGRADES,
    ACHIEVEMENTS: ACHIEVEMENTS,
    PRESTIGE_UPGRADES: PRESTIGE_UPGRADES,
    COSMETICS: COSMETICS,
    MILESTONE_THRESHOLDS: MILESTONE_THRESHOLDS,
    PRESTIGE_DIVISOR: PRESTIGE_DIVISOR,
    GOLDEN_BONE_CHANCE: GOLDEN_BONE_CHANCE,
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
    getSoulLevel: getSoulLevel,
    getSoulChips: getSoulChips,
    getMilestoneMultiplier: getMilestoneMultiplier,
    isUpgradeVisible: isUpgradeVisible,
    normalizePrestige: normalizePrestige,
    applyGoldenBrain: applyGoldenBrain,
    applyBossKill: applyBossKill,
    getBossMaxHp: getBossMaxHp,
    addBones: addBones
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Game;
  }
  if (typeof window !== "undefined") {
    window.Game = Game;
  }
})();
