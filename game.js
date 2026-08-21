const Game = (function () {
  'use strict';

  const GENERATORS = [
    {
      id: 'superviviente',
      name: 'Superviviente',
      desc: 'Busca cerebros por la ciudad.',
      baseCost: 15,
      costGrowth: 1.15,
      bps: 0.1
    },
    {
      id: 'barricada',
      name: 'Barricada',
      desc: 'Atrapa supervivientes desprevenidos.',
      baseCost: 100,
      costGrowth: 1.15,
      bps: 1
    },
    {
      id: 'granja-de-cerebros',
      name: 'Granja de Cerebros',
      desc: 'Cultiva cerebros frescos en masa.',
      baseCost: 1100,
      costGrowth: 1.15,
      bps: 8
    },
    {
      id: 'laboratorio',
      name: 'Laboratorio',
      desc: 'Experimenta con virus y cerebros.',
      baseCost: 12000,
      costGrowth: 1.15,
      bps: 47
    },
    {
      id: 'horda-zombie',
      name: 'Horda Zombie',
      desc: 'Un ejército incesante de hambrientos.',
      baseCost: 130000,
      costGrowth: 1.15,
      bps: 260
    },
    {
      id: 'colina-de-cranios',
      name: 'Colina de Cráneos',
      desc: 'Una montaña de cerebros acumulados.',
      baseCost: 1400000,
      costGrowth: 1.15,
      bps: 1400
    }
  ];

  const UPGRADES = [
    {
      id: 'dedos-podridos',
      name: 'Dedos Podridos',
      desc: 'Tus dedos se vuelven más eficientes. Click x2.',
      cost: 100,
      type: 'click',
      target: null,
      multiplier: 2
    },
    {
      id: 'refuerzo-barricada',
      name: 'Refuerzo de Barricada',
      desc: 'Barricadas más letales. Barricada x2.',
      cost: 1000,
      type: 'generator',
      target: 'barricada',
      multiplier: 2
    },
    {
      id: 'cerebro-premium',
      name: 'Cerebro Premium',
      desc: 'Cerebros de mayor calidad. Click x2.',
      cost: 5000,
      type: 'click',
      target: null,
      multiplier: 2
    },
    {
      id: 'cultivo-acelerado',
      name: 'Cultivo Acelerado',
      desc: 'Crecimiento más rápido. Granja de Cerebros x2.',
      cost: 20000,
      type: 'generator',
      target: 'granja-de-cerebros',
      multiplier: 2
    }
  ];

  function createState() {
    return {
      brains: 0,
      totalClicks: 0,
      totalBrainsEarned: 0,
      bestBps: 0,
      generators: {},
      upgrades: [],
      startedAt: Date.now(),
      lastSaved: Date.now()
    };
  }

  function getClickValue(state) {
    let value = 1;
    for (let i = 0; i < UPGRADES.length; i++) {
      const up = UPGRADES[i];
      if (up.type === 'click' && state.upgrades.indexOf(up.id) !== -1) {
        value *= up.multiplier;
      }
    }
    return value;
  }

  function getGeneratorCost(state, id) {
    let gen = null;
    for (let i = 0; i < GENERATORS.length; i++) {
      if (GENERATORS[i].id === id) {
        gen = GENERATORS[i];
        break;
      }
    }
    if (!gen) return Infinity;
    const count = state.generators[id] || 0;
    return gen.baseCost * Math.pow(gen.costGrowth, count);
  }

  function getBrainsPerSecond(state) {
    let total = 0;
    for (let i = 0; i < GENERATORS.length; i++) {
      const gen = GENERATORS[i];
      const count = state.generators[gen.id] || 0;
      if (count > 0) {
        let bps = gen.bps;
        for (let j = 0; j < UPGRADES.length; j++) {
          const up = UPGRADES[j];
          if (up.type === 'generator' && up.target === gen.id && state.upgrades.indexOf(up.id) !== -1) {
            bps *= up.multiplier;
          }
        }
        total += bps * count;
      }
    }
    return total;
  }

  function click(state) {
    const value = getClickValue(state);
    state.brains += value;
    state.totalClicks += 1;
    state.totalBrainsEarned += value;
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

  function buyUpgrade(state, id) {
    if (state.upgrades.indexOf(id) !== -1) return false;
    let up = null;
    for (let i = 0; i < UPGRADES.length; i++) {
      if (UPGRADES[i].id === id) {
        up = UPGRADES[i];
        break;
      }
    }
    if (!up) return false;
    if (state.brains >= up.cost) {
      state.brains -= up.cost;
      state.upgrades.push(id);
      return true;
    }
    return false;
  }

  function tick(state, dtSeconds) {
    const bps = getBrainsPerSecond(state);
    if (bps > 0 && dtSeconds > 0) {
      const gained = bps * dtSeconds;
      state.brains += gained;
      state.totalBrainsEarned += gained;
      if (bps > (state.bestBps || 0)) {
        state.bestBps = bps;
      }
    }
  }

  function formatNumber(n) {
    if (n < 1000) return String(Math.floor(n));
    if (n < 1e6) return (n / 1e3).toFixed(1) + 'K';
    if (n < 1e9) return (n / 1e6).toFixed(1) + 'M';
    if (n < 1e12) return (n / 1e9).toFixed(1) + 'B';
    return (n / 1e12).toFixed(1) + 'T';
  }

  function serialize(state) {
    state.lastSaved = Date.now();
    return JSON.stringify(state);
  }

  function deserialize(text) {
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') return createState();
      return {
        brains: typeof parsed.brains === 'number' ? parsed.brains : 0,
        totalClicks: typeof parsed.totalClicks === 'number' ? parsed.totalClicks : 0,
        totalBrainsEarned: typeof parsed.totalBrainsEarned === 'number' ? parsed.totalBrainsEarned : 0,
        bestBps: typeof parsed.bestBps === 'number' ? parsed.bestBps : 0,
        generators: (parsed.generators && typeof parsed.generators === 'object') ? parsed.generators : {},
        upgrades: (Array.isArray(parsed.upgrades)) ? parsed.upgrades : [],
        startedAt: typeof parsed.startedAt === 'number' ? parsed.startedAt : Date.now(),
        lastSaved: typeof parsed.lastSaved === 'number' ? parsed.lastSaved : Date.now()
      };
    } catch (e) {
      return createState();
    }
  }

  function applyOfflineProgress(state, elapsedSeconds) {
    if (typeof elapsedSeconds !== 'number' || !isFinite(elapsedSeconds) || elapsedSeconds <= 0) {
      return 0;
    }
    const bps = getBrainsPerSecond(state);
    if (bps <= 0) {
      return 0;
    }
    const gained = bps * elapsedSeconds;
    state.brains += gained;
    state.totalBrainsEarned += gained;
    if (bps > (state.bestBps || 0)) {
      state.bestBps = bps;
    }
    return gained;
  }

  function getMaxAffordable(state, id) {
    let gen = null;
    for (let i = 0; i < GENERATORS.length; i++) {
      if (GENERATORS[i].id === id) {
        gen = GENERATORS[i];
        break;
      }
    }
    if (!gen) return 0;
    if (typeof state.brains !== 'number' || !isFinite(state.brains) || state.brains < 0) return 0;

    const count = state.generators[id] || 0;
    const baseCost = gen.baseCost;
    const growth = gen.costGrowth;
    const budget = state.brains;

    if (growth <= 1) {
      if (baseCost <= 0) return Infinity;
      return Math.floor(budget / baseCost);
    }

    const firstCost = baseCost * Math.pow(growth, count);
    if (firstCost > budget) return 0;

    const n = Math.floor(Math.log(budget * (growth - 1) / firstCost + 1) / Math.log(growth));
    return Math.max(0, n);
  }

  function buyGenerators(state, id, count) {
    if (typeof count !== 'number' || !isFinite(count) || count <= 0) return 0;
    const maxAffordable = getMaxAffordable(state, id);
    const toBuy = Math.min(Math.floor(count), maxAffordable);
    if (toBuy <= 0) return 0;
    for (let i = 0; i < toBuy; i++) {
      if (!buyGenerator(state, id)) break;
    }
    return toBuy;
  }

  function getStats(state) {
    let generatorsOwned = 0;
    for (let i = 0; i < GENERATORS.length; i++) {
      const genId = GENERATORS[i].id;
      generatorsOwned += (state.generators[genId] || 0);
    }
    const startedAt = (typeof state.startedAt === 'number' && isFinite(state.startedAt)) ? state.startedAt : Date.now();
    return {
      totalBrainsEarned: state.totalBrainsEarned || 0,
      totalClicks: state.totalClicks || 0,
      bestBps: state.bestBps || 0,
      elapsedSeconds: (Date.now() - startedAt) / 1000,
      generatorsOwned: generatorsOwned
    };
  }

  return {
    GENERATORS: GENERATORS,
    UPGRADES: UPGRADES,
    createState: createState,
    click: click,
    buyGenerator: buyGenerator,
    buyUpgrade: buyUpgrade,
    tick: tick,
    getBrainsPerSecond: getBrainsPerSecond,
    getClickValue: getClickValue,
    getGeneratorCost: getGeneratorCost,
    formatNumber: formatNumber,
    serialize: serialize,
    deserialize: deserialize,
    applyOfflineProgress: applyOfflineProgress,
    getMaxAffordable: getMaxAffordable,
    buyGenerators: buyGenerators,
    getStats: getStats
  };
})();

if (typeof module !== 'undefined') module.exports = Game;
