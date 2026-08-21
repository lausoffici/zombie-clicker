'use strict';

const Game = (function () {
  const GENERATORS = [
    { id: 'superviviente', name: 'Superviviente', baseCost: 15, bps: 0.1, growth: 1.15 },
    { id: 'zombi', name: 'Zombi', baseCost: 100, bps: 1, growth: 1.15 },
    { id: 'necromante', name: 'Necromante', baseCost: 1100, bps: 8, growth: 1.15 },
    { id: 'templo', name: 'Templo Oscuro', baseCost: 12000, bps: 47, growth: 1.15 },
    { id: 'portal', name: 'Portal Infernal', baseCost: 130000, bps: 260, growth: 1.15 },
    { id: 'cerebro', name: 'Cerebro Central', baseCost: 1400000, bps: 1400, growth: 1.15 }
  ];

  const UPGRADES = [
    { id: 'dedos-podridos', name: 'Dedos Podridos', cost: 100, type: 'click', multiplier: 2, desc: 'Duplica el valor de cada click' },
    { id: 'uñas-afiladas', name: 'Uñas Afiladas', cost: 500, type: 'click', multiplier: 2, desc: 'Duplica el valor de cada click' },
    { id: 'manada', name: 'Manada', cost: 1000, type: 'generator', generatorId: 'superviviente', multiplier: 2, desc: 'Duplica la produccion de Supervivientes' },
    { id: 'sangre', name: 'Sangre Fria', cost: 5000, type: 'generator', generatorId: 'zombi', multiplier: 2, desc: 'Duplica la produccion de Zombis' },
    { id: 'ritual', name: 'Ritual Ancestral', cost: 25000, type: 'generator', generatorId: 'necromante', multiplier: 2, desc: 'Duplica la produccion de Necromantes' },
    { id: 'maldicion', name: 'Maldicion Eterna', cost: 100000, type: 'click', multiplier: 3, desc: 'Triplica el valor de cada click' },
    { id: 'reino', name: 'Reino de los Muertos', cost: 500000, type: 'global', multiplier: 1.5, desc: 'Aumenta toda la produccion en 50%' }
  ];

  const ACHIEVEMENTS = [
    { id: 'primer-cerebro', name: 'Primer Cerebro', desc: 'Gana 1 cerebro', check: (s) => s.totalBrainsEarned >= 1, bonus: 1.05 },
    { id: 'cerebros-100', name: 'Cerebros x100', desc: 'Gana 100 cerebros', check: (s) => s.totalBrainsEarned >= 100, bonus: 1.1 },
    { id: 'cerebros-10k', name: 'Cerebros x10K', desc: 'Gana 10,000 cerebros', check: (s) => s.totalBrainsEarned >= 10000, bonus: 1.15 },
    { id: 'cerebros-1m', name: 'Cerebros x1M', desc: 'Gana 1,000,000 cerebros', check: (s) => s.totalBrainsEarned >= 1000000, bonus: 1.25 },
    { id: 'clicks-100', name: 'Clicks x100', desc: 'Haz 100 clicks', check: (s) => s.totalClicks >= 100, bonus: 1.05 },
    { id: 'clicks-1000', name: 'Clicks x1000', desc: 'Haz 1,000 clicks', check: (s) => s.totalClicks >= 1000, bonus: 1.1 },
    { id: 'generators-10', name: 'Ejercito x10', desc: 'Tienes 10 generadores', check: (s) => Object.values(s.generators).reduce((a, b) => a + b, 0) >= 10, bonus: 1.1 },
    { id: 'generators-100', name: 'Ejercito x100', desc: 'Tienes 100 generadores', check: (s) => Object.values(s.generators).reduce((a, b) => a + b, 0) >= 100, bonus: 1.15 },
    { id: 'upgrades-3', name: 'Mejoras x3', desc: 'Compra 3 mejoras', check: (s) => s.upgrades.length >= 3, bonus: 1.1 },
    { id: 'upgrades-7', name: 'Mejoras x7', desc: 'Compra 7 mejoras', check: (s) => s.upgrades.length >= 7, bonus: 1.2 }
  ];

  function createState() {
    const generators = {};
    for (const g of GENERATORS) generators[g.id] = 0;
    return {
      brains: 0,
      totalBrainsEarned: 0,
      totalClicks: 0,
      generators: generators,
      upgrades: [],
      achievements: [],
      lastSaved: Date.now()
    };
  }

  function getClickValue(s) {
    let value = 1;
    for (const up of UPGRADES) {
      if (up.type === 'click' && s.upgrades.indexOf(up.id) !== -1) {
        value *= up.multiplier;
      }
    }
    return value;
  }

  function getGeneratorCost(s, genId) {
    const gen = GENERATORS.find((g) => g.id === genId);
    if (!gen) return Infinity;
    const count = s.generators[genId] || 0;
    return Math.ceil(gen.baseCost * Math.pow(gen.growth, count));
  }

  function getGeneratorBps(s, genId) {
    const gen = GENERATORS.find((g) => g.id === genId);
    if (!gen) return 0;
    let bps = gen.bps;
    for (const up of UPGRADES) {
      if (up.type === 'generator' && up.generatorId === genId && s.upgrades.indexOf(up.id) !== -1) {
        bps *= up.multiplier;
      }
    }
    return bps;
  }

  function getGlobalMultiplier(s) {
    let mult = 1;
    for (const up of UPGRADES) {
      if (up.type === 'global' && s.upgrades.indexOf(up.id) !== -1) {
        mult *= up.multiplier;
      }
    }
    for (const achId of s.achievements) {
      const ach = ACHIEVEMENTS.find((a) => a.id === achId);
      if (ach) mult *= ach.bonus;
    }
    return mult;
  }

  function getBrainsPerSecond(s) {
    let total = 0;
    for (const g of GENERATORS) {
      total += (s.generators[g.id] || 0) * getGeneratorBps(s, g.id);
    }
    return total * getGlobalMultiplier(s);
  }

  function click(s) {
    const value = getClickValue(s);
    s.brains += value;
    s.totalBrainsEarned += value;
    s.totalClicks += 1;
    checkAchievements(s);
  }

  function buyGenerator(s, genId) {
    const cost = getGeneratorCost(s, genId);
    if (s.brains < cost) return false;
    s.brains -= cost;
    s.generators[genId] = (s.generators[genId] || 0) + 1;
    checkAchievements(s);
    return true;
  }

  function buyGenerators(s, genId, count) {
    if (count <= 0) return 0;
    let bought = 0;
    for (let i = 0; i < count; i++) {
      const cost = getGeneratorCost(s, genId);
      if (s.brains < cost) break;
      s.brains -= cost;
      s.generators[genId] = (s.generators[genId] || 0) + 1;
      bought++;
    }
    if (bought > 0) checkAchievements(s);
    return bought;
  }

  function getMaxAffordable(s, genId) {
    let count = 0;
    let brains = s.brains;
    let genCount = s.generators[genId] || 0;
    const gen = GENERATORS.find((g) => g.id === genId);
    if (!gen) return 0;
    while (true) {
      const cost = Math.ceil(gen.baseCost * Math.pow(gen.growth, genCount));
      if (brains < cost) break;
      brains -= cost;
      genCount++;
      count++;
    }
    return count;
  }

  function buyUpgrade(s, upId) {
    const up = UPGRADES.find((u) => u.id === upId);
    if (!up) return false;
    if (s.upgrades.indexOf(upId) !== -1) return false;
    if (s.brains < up.cost) return false;
    s.brains -= up.cost;
    s.upgrades.push(upId);
    checkAchievements(s);
    return true;
  }

  function tick(s, dt) {
    if (dt <= 0) return;
    const gained = getBrainsPerSecond(s) * dt;
    s.brains += gained;
    s.totalBrainsEarned += gained;
    checkAchievements(s);
  }

  function checkAchievements(s) {
    let changed = false;
    for (const ach of ACHIEVEMENTS) {
      if (s.achievements.indexOf(ach.id) === -1 && ach.check(s)) {
        s.achievements.push(ach.id);
        changed = true;
      }
    }
    return changed;
  }

  function formatNumber(n) {
    if (n === undefined || n === null || isNaN(n)) return '0';
    if (n < 0) return '-' + formatNumber(-n);
    if (n < 1000) {
      if (n === Math.floor(n)) return String(n);
      return n.toFixed(1);
    }
    if (n < 1000000) {
      return (n / 1000).toFixed(1) + 'K';
    }
    if (n < 1000000000) {
      return (n / 1000000).toFixed(1) + 'M';
    }
    if (n < 1000000000000) {
      return (n / 1000000000).toFixed(1) + 'B';
    }
    return (n / 1000000000000).toFixed(1) + 'T';
  }

  function serialize(s) {
    return JSON.stringify(s);
  }

  function deserialize(text) {
    try {
      const obj = JSON.parse(text);
      if (typeof obj !== 'object' || obj === null) return createState();
      const base = createState();
      base.brains = typeof obj.brains === 'number' ? obj.brains : 0;
      base.totalBrainsEarned = typeof obj.totalBrainsEarned === 'number' ? obj.totalBrainsEarned : 0;
      base.totalClicks = typeof obj.totalClicks === 'number' ? obj.totalClicks : 0;
      if (obj.generators && typeof obj.generators === 'object') {
        for (const g of GENERATORS) {
          base.generators[g.id] = typeof obj.generators[g.id] === 'number' ? obj.generators[g.id] : 0;
        }
      }
      if (Array.isArray(obj.upgrades)) {
        base.upgrades = obj.upgrades.filter((id) => typeof id === 'string');
      }
      if (Array.isArray(obj.achievements)) {
        base.achievements = obj.achievements.filter((id) => typeof id === 'string');
      }
      base.lastSaved = typeof obj.lastSaved === 'number' ? obj.lastSaved : Date.now();
      return base;
    } catch (e) {
      return createState();
    }
  }

  function applyOfflineProgress(s, elapsedSeconds) {
    if (elapsedSeconds === undefined || elapsedSeconds === null || isNaN(elapsedSeconds) || elapsedSeconds <= 0) return 0;
    const bps = getBrainsPerSecond(s);
    const gained = bps * elapsedSeconds;
    s.brains += gained;
    s.totalBrainsEarned += gained;
    checkAchievements(s);
    return gained;
  }

  return {
    GENERATORS: GENERATORS,
    UPGRADES: UPGRADES,
    ACHIEVEMENTS: ACHIEVEMENTS,
    createState: createState,
    getClickValue: getClickValue,
    getGeneratorCost: getGeneratorCost,
    getGeneratorBps: getGeneratorBps,
    getGlobalMultiplier: getGlobalMultiplier,
    getBrainsPerSecond: getBrainsPerSecond,
    click: click,
    buyGenerator: buyGenerator,
    buyGenerators: buyGenerators,
    getMaxAffordable: getMaxAffordable,
    buyUpgrade: buyUpgrade,
    tick: tick,
    checkAchievements: checkAchievements,
    formatNumber: formatNumber,
    serialize: serialize,
    deserialize: deserialize,
    applyOfflineProgress: applyOfflineProgress
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Game;
}
