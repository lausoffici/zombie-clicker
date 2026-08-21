'use strict';

const Game = (function () {
  // ---------- Datos ----------
  const GENERATORS = [
    { id: 'superviviente', name: 'Superviviente', icon: '🧟', desc: 'Un zombi básico que muerde cerebros.', baseCost: 15, baseBps: 0.1, growth: 1.15 },
    { id: 'zombi-ranquero', name: 'Zombi Ranquero', icon: '🧟‍♂️', desc: 'Corre más rápido y muerde más fuerte.', baseCost: 100, baseBps: 1, growth: 1.15 },
    { id: 'zombi-brutal', name: 'Zombi Brutal', icon: '🧟‍♀️', desc: 'Un coloso hambriento de materia gris.', baseCost: 1100, baseBps: 8, growth: 1.15 },
    { id: 'zombi-volador', name: 'Zombi Volador', icon: '🦇', desc: 'Aletea sobre la ciudad devorando cerebros.', baseCost: 12000, baseBps: 47, growth: 1.15 },
    { id: 'zombi-criatura', name: 'Zombi Criatura', icon: '👹', desc: 'Una abominación de la noche.', baseCost: 130000, baseBps: 260, growth: 1.15 },
    { id: 'zombi-titán', name: 'Zombi Titán', icon: '🗿', desc: 'Un coloso que tiembla la tierra.', baseCost: 1400000, baseBps: 1400, growth: 1.15 },
    { id: 'zombi-espectral', name: 'Zombi Espectral', icon: '👻', desc: 'Un fantasma hambriento que atraviesa muros.', baseCost: 20000000, baseBps: 7800, growth: 1.15 },
    { id: 'zombi-demoníaco', name: 'Zombi Demoníaco', icon: '😈', desc: 'Un infierno ambulante de hambre.', baseCost: 330000000, baseBps: 44000, growth: 1.15 },
    { id: 'zombi-cósmico', name: 'Zombi Cósmico', icon: '🌌', desc: 'Una entidad de otro plano devorando realidades.', baseCost: 5100000000, baseBps: 260000, growth: 1.15 },
    { id: 'zombi-dios', name: 'Zombi Dios', icon: '🔱', desc: 'El apocalipsis hecho carne.', baseCost: 75000000000, baseBps: 1600000, growth: 1.15 }
  ];

  const UPGRADES = [
    { id: 'dedos-podridos', name: 'Dedos Podridos', icon: '🖐️', desc: 'Duplica el valor de cada click.', type: 'click', multiplier: 2, cost: 100 },
    { id: 'mordida-fuerte', name: 'Mordida Fuerte', icon: '🦷', desc: 'Triplica el valor de cada click.', type: 'click', multiplier: 3, cost: 1000 },
    { id: 'manada-hambrienta', name: 'Manada Hambrienta', icon: '🐺', desc: 'Duplica la producción de Supervivientes.', type: 'generator', generatorId: 'superviviente', multiplier: 2, cost: 500 },
    { id: 'corazón-zombi', name: 'Corazón Zombi', icon: '❤️', desc: 'Duplica la producción de Zombis Ranqueros.', type: 'generator', generatorId: 'zombi-ranquero', multiplier: 2, cost: 5000 },
    { id: 'sangre-viva', name: 'Sangre Viva', icon: '🩸', desc: 'Duplica la producción de Zombis Brutales.', type: 'generator', generatorId: 'zombi-brutal', multiplier: 2, cost: 50000 },
    { id: 'aliento-maldito', name: 'Aliento Maldito', icon: '💀', desc: 'Duplica la producción de Zombis Voladores.', type: 'generator', generatorId: 'zombi-volador', multiplier: 2, cost: 500000 },
    { id: 'garras-eternas', name: 'Garras Eternas', icon: '🗡️', desc: 'Duplica la producción de Zombis Criaturas.', type: 'generator', generatorId: 'zombi-criatura', multiplier: 2, cost: 5000000 },
    { id: 'fuerza-sobrenatural', name: 'Fuerza Sobrenatural', icon: '💪', desc: 'Duplica la producción de Zombis Titanes.', type: 'generator', generatorId: 'zombi-titán', multiplier: 2, cost: 50000000 },
    { id: 'mente-colectiva', name: 'Mente Colectiva', icon: '🧠', desc: 'Multiplica TODA la producción por 1.5.', type: 'global', multiplier: 1.5, cost: 100000 },
    { id: 'apocalipsis', name: 'Apocalipsis', icon: '☢️', desc: 'Multiplica TODA la producción por 2.', type: 'global', multiplier: 2, cost: 10000000 }
  ];

  const ACHIEVEMENTS = [
    { id: 'primer-cerebro', name: 'Primer Cerebro', desc: 'Gana tu primer cerebro.', type: 'totalBrains', threshold: 1, bonus: 0.02 },
    { id: 'cerebros-100', name: 'Cerebros x100', desc: 'Gana 100 cerebros totales.', type: 'totalBrains', threshold: 100, bonus: 0.02 },
    { id: 'cerebros-10k', name: 'Cerebros x10K', desc: 'Gana 10,000 cerebros totales.', type: 'totalBrains', threshold: 10000, bonus: 0.02 },
    { id: 'cerebros-1m', name: 'Cerebros x1M', desc: 'Gana 1,000,000 cerebros totales.', type: 'totalBrains', threshold: 1000000, bonus: 0.02 },
    { id: 'clicks-10', name: 'Clicks x10', desc: 'Haz 10 clicks.', type: 'clicks', threshold: 10, bonus: 0.02 },
    { id: 'clicks-100', name: 'Clicks x100', desc: 'Haz 100 clicks.', type: 'clicks', threshold: 100, bonus: 0.02 },
    { id: 'clicks-1000', name: 'Clicks x1K', desc: 'Haz 1,000 clicks.', type: 'clicks', threshold: 1000, bonus: 0.02 },
    { id: 'generators-1', name: 'Primer Zombi', desc: 'Compra tu primer generador.', type: 'generatorCount', threshold: 1, bonus: 0.02 },
    { id: 'generators-10', name: 'Manada x10', desc: 'Ten 10 generadores en total.', type: 'generatorCount', threshold: 10, bonus: 0.02 },
    { id: 'generators-50', name: 'Ejército x50', desc: 'Ten 50 generadores en total.', type: 'generatorCount', threshold: 50, bonus: 0.02 },
    { id: 'generators-100', name: 'Legión x100', desc: 'Ten 100 generadores en total.', type: 'generatorCount', threshold: 100, bonus: 0.02 },
    { id: 'all-generators', name: 'Todos los Zombis', desc: 'Ten al menos 1 de cada tipo de generador.', type: 'generators', threshold: 0, bonus: 0.02 }
  ];

  const PRESTIGE_UPGRADES = [
    { id: 'pu-bps', name: 'Fuerza Zombi', desc: '+10% producción de cerebros por segundo.', cost: 1, effect: 'bpsBoost' },
    { id: 'pu-click', name: 'Mordida Letal', desc: '+20% valor por click.', cost: 1, effect: 'clickBoost' },
    { id: 'pu-start', name: 'Reinicio Rápido', desc: 'Empieza con +100 cerebros tras reset.', cost: 2, effect: 'soulStart' },
    { id: 'pu-offline', name: 'Hambre Eterna', desc: '+50% al límite de progreso offline.', cost: 3, effect: 'offlineBoost' },
    { id: 'pu-cheaper', name: 'Negociación', desc: '-10% costo de generadores.', cost: 4, effect: 'cheaperGenerators' },
    { id: 'pu-auto', name: 'Reflejos Zombi', desc: 'Click automático cada 2 segundos.', cost: 5, effect: 'autoClick' }
  ];

  // ---------- Estado ----------
  function createState() {
    const generators = {};
    for (const g of GENERATORS) {
      generators[g.id] = 0;
    }
    return {
      brains: 0,
      totalClicks: 0,
      totalBrainsEarned: 0,
      bestBps: 0,
      generators: generators,
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

  // ---------- Helpers ----------
  function getGeneratorDef(id) {
    for (const g of GENERATORS) {
      if (g.id === id) return g;
    }
    return null;
  }

  function getUpgradeDef(id) {
    for (const u of UPGRADES) {
      if (u.id === id) return u;
    }
    return null;
  }

  function getPrestigeUpgradeDef(id) {
    for (const p of PRESTIGE_UPGRADES) {
      if (p.id === id) return p;
    }
    return null;
  }

  function getAchievementDef(id) {
    for (const a of ACHIEVEMENTS) {
      if (a.id === id) return a;
    }
    return null;
  }

  // ---------- Multiplicadores ----------
  function getGlobalMultiplier(state) {
    let mult = 1;
    // Almas: +0.05 por alma
    if (state.prestige && state.prestige.souls) {
      mult += state.prestige.souls * 0.05;
    }
    // Logros: +0.02 por logro desbloqueado
    if (state.achievements && state.achievements.length) {
      for (const achId of state.achievements) {
        const def = getAchievementDef(achId);
        if (def && def.bonus) {
          mult += def.bonus;
        }
      }
    }
    // Upgrades globales
    if (state.upgrades && state.upgrades.length) {
      for (const upId of state.upgrades) {
        const def = getUpgradeDef(upId);
        if (def && def.type === 'global' && def.multiplier) {
          mult *= def.multiplier;
        }
      }
    }
    // Prestige upgrades
    if (state.prestige && state.prestige.upgrades && state.prestige.upgrades.length) {
      for (const puId of state.prestige.upgrades) {
        const def = getPrestigeUpgradeDef(puId);
        if (def) {
          if (def.effect === 'bpsBoost') {
            mult *= 1.10;
          } else if (def.effect === 'clickBoost') {
            mult *= 1.20;
          }
        }
      }
    }
    return mult;
  }

  function getGeneratorBps(state, genId) {
    const def = getGeneratorDef(genId);
    if (!def) return 0;
    let mult = 1;
    if (state.upgrades && state.upgrades.length) {
      for (const upId of state.upgrades) {
        const upDef = getUpgradeDef(upId);
        if (upDef && upDef.type === 'generator' && upDef.generatorId === genId && upDef.multiplier) {
          mult *= upDef.multiplier;
        }
      }
    }
    return def.baseBps * mult;
  }

  function getBrainsPerSecond(state) {
    let total = 0;
    for (const g of GENERATORS) {
      const count = state.generators[g.id] || 0;
      if (count > 0) {
        total += count * getGeneratorBps(state, g.id);
      }
    }
    return total * getGlobalMultiplier(state);
  }

  function getClickValue(state) {
    let base = 1;
    if (state.upgrades && state.upgrades.length) {
      for (const upId of state.upgrades) {
        const def = getUpgradeDef(upId);
        if (def && def.type === 'click' && def.multiplier) {
          base *= def.multiplier;
        }
      }
    }
    return base * getGlobalMultiplier(state);
  }

  function getGeneratorCost(state, id) {
    const def = getGeneratorDef(id);
    if (!def) return Infinity;
    const count = state.generators[id] || 0;
    let cost = Math.ceil(def.baseCost * Math.pow(def.growth, count));
    // Prestige upgrade: -10% costo
    if (state.prestige && state.prestige.upgrades && state.prestige.upgrades.indexOf('pu-cheaper') !== -1) {
      cost = Math.ceil(cost * 0.9);
    }
    return cost;
  }

  // ---------- Acciones ----------
  function click(state) {
    const value = getClickValue(state);
    state.brains += value;
    state.totalBrainsEarned += value;
    state.totalClicks += 1;
    return value;
  }

  function buyGenerator(state, id) {
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
      const cost = getGeneratorCost(state, id);
      if (state.brains >= cost) {
        state.brains -= cost;
        state.generators[id] = (state.generators[id] || 0) + 1;
        bought++;
      } else {
        break;
      }
    }
    return bought;
  }

  function getMaxAffordable(state, id) {
    let count = 0;
    let cost = getGeneratorCost(state, id);
    while (state.brains >= cost) {
      state.brains -= cost;
      count++;
      cost = getGeneratorCost(state, id);
    }
    // Restaurar brains
    state.brains += cost;
    // Recalcular para restaurar exactamente
    let restore = 0;
    for (let i = 0; i < count; i++) {
      const c = getGeneratorCost(state, id);
      restore += c;
    }
    state.brains += restore;
    return count;
  }

  function buyUpgrade(state, id) {
    if (state.upgrades.indexOf(id) !== -1) return false;
    const def = getUpgradeDef(id);
    if (!def) return false;
    if (state.brains >= def.cost) {
      state.brains -= def.cost;
      state.upgrades.push(id);
      return true;
    }
    return false;
  }

  function tick(state, dtSeconds) {
    if (dtSeconds <= 0) return;
    const bps = getBrainsPerSecond(state);
    const gained = bps * dtSeconds;
    state.brains += gained;
    state.totalBrainsEarned += gained;
    if (bps > state.bestBps) {
      state.bestBps = bps;
    }
  }

  // ---------- Prestige ----------
  function getPrestigeGain(state) {
    const gain = Math.floor(Math.sqrt(state.totalBrainsEarned / 1000000));
    return Math.max(0, gain);
  }

  function prestige(state) {
    const gain = getPrestigeGain(state);
    const newState = createState();
    newState.achievements = state.achievements.slice();
    newState.prestige.souls = state.prestige.souls + gain;
    newState.prestige.totalSoulsEarned = state.prestige.totalSoulsEarned + gain;
    newState.prestige.upgrades = state.prestige.upgrades.slice();
    newState.startedAt = state.startedAt;
    // soulStart: +100 cerebros iniciales
    if (state.prestige.upgrades.indexOf('pu-start') !== -1) {
      newState.brains = 100;
      newState.totalBrainsEarned = 100;
    }
    return newState;
  }

  function buyPrestigeUpgrade(state, id) {
    if (state.prestige.upgrades.indexOf(id) !== -1) return false;
    const def = getPrestigeUpgradeDef(id);
    if (!def) return false;
    if (state.prestige.souls >= def.cost) {
      state.prestige.souls -= def.cost;
      state.prestige.upgrades.push(id);
      return true;
    }
    return false;
  }

  // ---------- Logros ----------
  function checkAchievements(state) {
    const newlyUnlocked = [];
    for (const ach of ACHIEVEMENTS) {
      if (state.achievements.indexOf(ach.id) !== -1) continue;
      let met = false;
      if (ach.type === 'totalBrains') {
        met = state.totalBrainsEarned >= ach.threshold;
      } else if (ach.type === 'clicks') {
        met = state.totalClicks >= ach.threshold;
      } else if (ach.type === 'generatorCount') {
        let total = 0;
        for (const g of GENERATORS) {
          total += (state.generators[g.id] || 0);
        }
        met = total >= ach.threshold;
      } else if (ach.type === 'generators') {
        met = GENERATORS.every(function (g) { return (state.generators[g.id] || 0) >= 1; });
      }
      if (met) {
        state.achievements.push(ach.id);
        newlyUnlocked.push(ach.id);
      }
    }
    return newlyUnlocked;
  }

  // ---------- Stats ----------
  function getStats(state) {
    let generatorsOwned = 0;
    for (const g of GENERATORS) {
      generatorsOwned += (state.generators[g.id] || 0);
    }
    const now = Date.now();
    const elapsedSeconds = Math.max(0, (now - state.startedAt) / 1000);
    return {
      totalBrainsEarned: state.totalBrainsEarned,
      totalClicks: state.totalClicks,
      bestBps: state.bestBps,
      elapsedSeconds: elapsedSeconds,
      generatorsOwned: generatorsOwned
    };
  }

  // ---------- Serialización ----------
  function serialize(state) {
    return JSON.stringify(state);
  }

  function deserialize(text) {
    try {
      const obj = JSON.parse(text);
      if (!obj || typeof obj !== 'object') {
        return createState();
      }
      const base = createState();
      base.brains = typeof obj.brains === 'number' ? obj.brains : 0;
      base.totalClicks = typeof obj.totalClicks === 'number' ? obj.totalClicks : 0;
      base.totalBrainsEarned = typeof obj.totalBrainsEarned === 'number' ? obj.totalBrainsEarned : 0;
      base.bestBps = typeof obj.bestBps === 'number' ? obj.bestBps : 0;
      if (obj.generators && typeof obj.generators === 'object') {
        for (const g of GENERATORS) {
          base.generators[g.id] = typeof obj.generators[g.id] === 'number' ? obj.generators[g.id] : 0;
        }
      }
      if (Array.isArray(obj.upgrades)) {
        base.upgrades = obj.upgrades.slice();
      }
      if (Array.isArray(obj.achievements)) {
        base.achievements = obj.achievements.slice();
      }
      if (obj.prestige && typeof obj.prestige === 'object') {
        base.prestige.souls = typeof obj.prestige.souls === 'number' ? obj.prestige.souls : 0;
        base.prestige.totalSoulsEarned = typeof obj.prestige.totalSoulsEarned === 'number' ? obj.prestige.totalSoulsEarned : 0;
        if (Array.isArray(obj.prestige.upgrades)) {
          base.prestige.upgrades = obj.prestige.upgrades.slice();
        }
      }
      base.startedAt = typeof obj.startedAt === 'number' ? obj.startedAt : Date.now();
      base.lastSaved = typeof obj.lastSaved === 'number' ? obj.lastSaved : Date.now();
      return base;
    } catch (e) {
      return createState();
    }
  }

  function applyOfflineProgress(state, elapsedSeconds) {
    if (elapsedSeconds <= 0) return 0;
    const bps = getBrainsPerSecond(state);
    const gained = bps * elapsedSeconds;
    state.brains += gained;
    state.totalBrainsEarned += gained;
    return gained;
  }

  function formatNumber(n) {
    if (n < 1000) return Math.floor(n).toString();
    if (n < 1e6) return (n / 1e3).toFixed(1) + 'K';
    if (n < 1e9) return (n / 1e6).toFixed(1) + 'M';
    if (n < 1e12) return (n / 1e9).toFixed(1) + 'B';
    return (n / 1e12).toFixed(1) + 'T';
  }

  function exportSave(state) {
    const json = JSON.stringify(state);
    if (typeof btoa === 'function') {
      return btoa(unescape(encodeURIComponent(json)));
    }
    return json;
  }

  function importSave(text) {
    let json = text;
    if (typeof atob === 'function') {
      try {
        json = decodeURIComponent(escape(atob(text)));
      } catch (e) {
        // Si falla, asumir que ya es JSON
      }
    }
    return deserialize(json);
  }

  return {
    GENERATORS: GENERATORS,
    UPGRADES: UPGRADES,
    ACHIEVEMENTS: ACHIEVEMENTS,
    PRESTIGE_UPGRADES: PRESTIGE_UPGRADES,
    createState: createState,
    click: click,
    buyGenerator: buyGenerator,
    buyGenerators: buyGenerators,
    getMaxAffordable: getMaxAffordable,
    buyUpgrade: buyUpgrade,
    tick: tick,
    getBrainsPerSecond: getBrainsPerSecond,
    getClickValue: getClickValue,
    getGeneratorCost: getGeneratorCost,
    getGeneratorBps: getGeneratorBps,
    getGlobalMultiplier: getGlobalMultiplier,
    getPrestigeGain: getPrestigeGain,
    prestige: prestige,
    buyPrestigeUpgrade: buyPrestigeUpgrade,
    checkAchievements: checkAchievements,
    getStats: getStats,
    formatNumber: formatNumber,
    serialize: serialize,
    deserialize: deserialize,
    applyOfflineProgress: applyOfflineProgress,
    exportSave: exportSave,
    importSave: importSave
  };
})();

if (typeof module !== 'undefined') module.exports = Game;
