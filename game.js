const Game = (function () {
  'use strict';

  const GENERATORS = [];
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

  function getBrainsPerSecond(state) {
    return 0;
  }

  function click(state) {
    state.brains += getClickValue(state);
    state.totalClicks += 1;
  }

  function buyGenerator(state, id) {
    // Sin generadores por ahora
  }

  function buyUpgrade(state, id) {
    // Sin mejoras por ahora
  }

  function tick(state, dtSeconds) {
    // Sin generadores por ahora
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
    // Sin generadores por ahora
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
    formatNumber: formatNumber,
    serialize: serialize,
    deserialize: deserialize,
    applyOfflineProgress: applyOfflineProgress
  };
})();

if (typeof module !== 'undefined') module.exports = Game;
