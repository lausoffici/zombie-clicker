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
    }
  ];

  const UPGRADES = [];

  function createState() {
    return {
      brains: 0,
      totalClicks: 0,
      generators: {},
      upgrades: [],
      lastSaved: Date.now()
    };
  }

  function getClickValue(state) {
    return 1;
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
        total += gen.bps * count;
      }
    }
    return total;
  }

  function click(state) {
    state.brains += getClickValue(state);
    state.totalClicks += 1;
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
    // Sin mejoras por ahora
    return false;
  }

  function tick(state, dtSeconds) {
    const bps = getBrainsPerSecond(state);
    if (bps > 0 && dtSeconds > 0) {
      state.brains += bps * dtSeconds;
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
    return JSON.stringify(state);
  }

  function deserialize(text) {
    const parsed = JSON.parse(text);
    return {
      brains: parsed.brains || 0,
      totalClicks: parsed.totalClicks || 0,
      generators: parsed.generators || {},
      upgrades: parsed.upgrades || [],
      lastSaved: parsed.lastSaved || Date.now()
    };
  }

  function applyOfflineProgress(state, elapsedSeconds) {
    const bps = getBrainsPerSecond(state);
    if (bps > 0 && elapsedSeconds > 0) {
      state.brains += bps * elapsedSeconds;
    }
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
    applyOfflineProgress: applyOfflineProgress
  };
})();

if (typeof module !== 'undefined') module.exports = Game;
