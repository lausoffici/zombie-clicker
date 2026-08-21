(function () {
  'use strict';

  var Game = {
    GENERATORS: [
      { id: 'zombie', name: 'Zombie', desc: 'Un zombie básico que muerde cerebros.', baseCost: 15, bps: 0.1 },
      { id: 'esqueleto', name: 'Esqueleto', desc: 'Un esqueleto hambriento de materia gris.', baseCost: 100, bps: 1 },
      { id: 'vampiro', name: 'Vampiro', desc: 'Suce cerebros con sus colmillos.', baseCost: 1100, bps: 8 },
      { id: 'licantropo', name: 'Licántropo', desc: 'Aúlla y devora cerebros en manada.', baseCost: 12000, bps: 47 },
      { id: 'frankenstein', name: 'Frankenstein', desc: 'Su corazón bombea cerebros.', baseCost: 130000, bps: 260 },
      { id: 'zombi_nuclear', name: 'Zombi Nuclear', desc: 'Mutado por radiación, come cerebros radiactivos.', baseCost: 1400000, bps: 1400 },
      { id: 'zombi_cibernético', name: 'Zombi Cibernético', desc: 'Cerebros procesados por circuitos.', baseCost: 20000000, bps: 7800 },
      { id: 'zombi_cosmico', name: 'Zombi Cósmico', desc: 'Cerebros de dimensiones paralelas.', baseCost: 330000000, bps: 44000 }
    ],

    UPGRADES: [
      { id: 'guante', name: 'Guante de Cuero', desc: 'Duplica el poder de tus golpes.', cost: 100, type: 'click', multiplier: 2 },
      { id: 'maza', name: 'Maza de Guerra', desc: 'Tus golpes valen 3 veces más.', cost: 500, type: 'click', multiplier: 3 },
      { id: 'espada', name: 'Espada de Acero', desc: 'Tus golpes valen 4 veces más.', cost: 5000, type: 'click', multiplier: 4 },
      { id: 'zombi_rapido', name: 'Zombies Rápidos', desc: 'Los zombies producen 2x más cerebros.', cost: 1000, type: 'generator', target: 'zombie', multiplier: 2 },
      { id: 'esqueleto_fuerte', name: 'Esqueletos Fuertes', desc: 'Los esqueletos producen 2x más cerebros.', cost: 5000, type: 'generator', target: 'esqueleto', multiplier: 2 },
      { id: 'vampiro_sediento', name: 'Vampiros Sedientos', desc: 'Los vampiros producen 2x más cerebros.', cost: 50000, type: 'generator', target: 'vampiro', multiplier: 2 },
      { id: 'manada', name: 'Manada Salvaje', desc: 'Los licántropos producen 2x más cerebros.', cost: 500000, type: 'generator', target: 'licantropo', multiplier: 2 },
      { id: 'frankenstein_plus', name: 'Frankenstein Plus', desc: 'Frankenstein produce 2x más cerebros.', cost: 5000000, type: 'generator', target: 'frankenstein', multiplier: 2 },
      { id: 'nuclear_plus', name: 'Nuclear Plus', desc: 'Zombis nucleares producen 2x más cerebros.', cost: 50000000, type: 'generator', target: 'zombi_nuclear', multiplier: 2 },
      { id: 'ciber_plus', name: 'Ciber Plus', desc: 'Zombis cibernéticos producen 2x más cerebros.', cost: 500000000, type: 'generator', target: 'zombi_cibernético', multiplier: 2 },
      { id: 'cosmico_plus', name: 'Cósmico Plus', desc: 'Zombis cósmicos producen 2x más cerebros.', cost: 5000000000, type: 'generator', target: 'zombi_cosmico', multiplier: 2 },
      { id: 'cerebro_dorado', name: 'Cerebro Dorado', desc: 'Tus golpes valen 5 veces más.', cost: 1000000, type: 'click', multiplier: 5 },
      { id: 'cerebro_platino', name: 'Cerebro de Platino', desc: 'Tus golpes valen 10 veces más.', cost: 100000000, type: 'click', multiplier: 10 }
    ],

    ACHIEVEMENTS: [
      { id: 'primer_mordisco', name: 'Primer Mordisco', desc: 'Golpea a un zombie por primera vez.', type: 'clicks', threshold: 1, bonus: 0.02 },
      { id: 'manos_sangrientas', name: 'Manos Sangrientas', desc: 'Acumula 100 golpes maniacos.', type: 'clicks', threshold: 100, bonus: 0.02 },
      { id: 'cerebro_inicial', name: 'Cerebro Inicial', desc: 'Gana 1.000 cerebros en total.', type: 'totalBrains', threshold: 1000, bonus: 0.02 },
      { id: 'banquete_gris', name: 'Banquete Gris', desc: 'Gana 1.000.000 de cerebros en total.', type: 'totalBrains', threshold: 1000000, bonus: 0.02 },
      { id: 'junta_horda', name: 'Junta la Horda', desc: 'Posee 10 generadores en total.', type: 'generatorCount', threshold: 10, bonus: 0.02 },
      { id: 'ejercito_necro', name: 'Ejército Necro', desc: 'Posee 100 generadores en total.', type: 'generatorCount', threshold: 100, bonus: 0.02 },
      { id: 'coleccionista', name: 'Coleccionista de Muertos', desc: 'Posee al menos 1 de cada tipo de generador.', type: 'generators', target: ['zombie', 'esqueleto', 'vampiro', 'licantropo', 'frankenstein', 'zombi_nuclear', 'zombi_cibernético', 'zombi_cosmico'], bonus: 0.02 },
      { id: 'senor_de_los_malditos', name: 'Señor de los Malditos', desc: 'Posee 500 generadores en total.', type: 'generatorCount', threshold: 500, bonus: 0.02 }
    ],

    SAVE_KEY: 'zombie-clicker-save',

    formatNumber: function (n) {
      if (n === undefined || n === null || isNaN(n)) return '0';
      if (n < 1000) {
        return Math.floor(n).toString();
      }
      var suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
      var tier = Math.floor(Math.log10(Math.abs(n)) / 3);
      if (tier >= suffixes.length) tier = suffixes.length - 1;
      var scaled = n / Math.pow(1000, tier);
      var str = scaled.toFixed(2);
      if (str.indexOf('.') !== -1) {
        str = str.replace(/\.?0+$/, '');
      }
      return str + suffixes[tier];
    },

    getGeneratorCost: function (state, id) {
      var gen = null;
      for (var i = 0; i < Game.GENERATORS.length; i++) {
        if (Game.GENERATORS[i].id === id) {
          gen = Game.GENERATORS[i];
          break;
        }
      }
      if (!gen) return Infinity;
      var count = state.generators[id] || 0;
      return gen.baseCost * Math.pow(1.15, count);
    },

    getClickPower: function (state) {
      var power = 1;
      for (var i = 0; i < Game.UPGRADES.length; i++) {
        var up = Game.UPGRADES[i];
        if (up.type === 'click' && state.upgrades[up.id]) {
          power *= up.multiplier;
        }
      }
      return power;
    },

    getBrainsPerSecond: function (state) {
      var bps = 0;
      for (var i = 0; i < Game.GENERATORS.length; i++) {
        var gen = Game.GENERATORS[i];
        var count = state.generators[gen.id] || 0;
        if (count === 0) continue;
        var mult = 1;
        for (var j = 0; j < Game.UPGRADES.length; j++) {
          var up = Game.UPGRADES[j];
          if (up.type === 'generator' && up.target === gen.id && state.upgrades[up.id]) {
            mult *= up.multiplier;
          }
        }
        bps += gen.bps * count * mult;
      }
      return bps;
    },

    click: function (state) {
      var power = Game.getClickPower(state);
      state.brains += power;
      state.totalBrains += power;
      state.clicks += 1;
      return power;
    },

    buyGenerator: function (state, id) {
      var cost = Game.getGeneratorCost(state, id);
      if (state.brains < cost) return false;
      state.brains -= cost;
      state.generators[id] = (state.generators[id] || 0) + 1;
      return true;
    },

    buyUpgrade: function (state, id) {
      var up = null;
      for (var i = 0; i < Game.UPGRADES.length; i++) {
        if (Game.UPGRADES[i].id === id) {
          up = Game.UPGRADES[i];
          break;
        }
      }
      if (!up) return false;
      if (state.upgrades[id]) return false;
      if (state.brains < up.cost) return false;
      state.brains -= up.cost;
      state.upgrades[id] = true;
      return true;
    },

    checkAchievements: function (state) {
      if (!state.achievements) state.achievements = [];
      var newlyUnlocked = [];
      for (var i = 0; i < Game.ACHIEVEMENTS.length; i++) {
        var ach = Game.ACHIEVEMENTS[i];
        if (state.achievements.indexOf(ach.id) !== -1) continue;
        var met = false;
        if (ach.type === 'clicks') {
          met = (state.clicks || 0) >= ach.threshold;
        } else if (ach.type === 'totalBrains') {
          met = (state.totalBrains || 0) >= ach.threshold;
        } else if (ach.type === 'generatorCount') {
          var total = 0;
          for (var g in state.generators) {
            if (Object.prototype.hasOwnProperty.call(state.generators, g)) {
              total += (state.generators[g] || 0);
            }
          }
          met = total >= ach.threshold;
        } else if (ach.type === 'generators') {
          met = true;
          if (ach.target && ach.target.length > 0) {
            for (var t = 0; t < ach.target.length; t++) {
              if ((state.generators[ach.target[t]] || 0) < 1) {
                met = false;
                break;
              }
            }
          }
        }
        if (met) {
          state.achievements.push(ach.id);
          newlyUnlocked.push(ach.id);
        }
      }
      return newlyUnlocked;
    },

    getGlobalMultiplier: function (state) {
      var mult = 1;
      if (state.achievements && state.achievements.length > 0) {
        for (var i = 0; i < state.achievements.length; i++) {
          var achId = state.achievements[i];
          for (var j = 0; j < Game.ACHIEVEMENTS.length; j++) {
            if (Game.ACHIEVEMENTS[j].id === achId) {
              mult += (Game.ACHIEVEMENTS[j].bonus || 0);
              break;
            }
          }
        }
      }
      return mult;
    },

    save: function (state) {
      try {
        var data = {
          brains: state.brains,
          totalBrains: state.totalBrains,
          clicks: state.clicks,
          generators: state.generators,
          upgrades: state.upgrades,
          achievements: state.achievements || [],
          savedAt: Date.now()
        };
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(Game.SAVE_KEY, JSON.stringify(data));
        }
        return true;
      } catch (e) {
        return false;
      }
    },

    load: function () {
      try {
        if (typeof localStorage === 'undefined') return null;
        var raw = localStorage.getItem(Game.SAVE_KEY);
        if (!raw) return null;
        var data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return null;
        return {
          brains: typeof data.brains === 'number' ? data.brains : 0,
          totalBrains: typeof data.totalBrains === 'number' ? data.totalBrains : 0,
          clicks: typeof data.clicks === 'number' ? data.clicks : 0,
          generators: data.generators && typeof data.generators === 'object' ? data.generators : {},
          upgrades: data.upgrades && typeof data.upgrades === 'object' ? data.upgrades : {},
          achievements: Array.isArray(data.achievements) ? data.achievements : [],
          savedAt: data.savedAt || null
        };
      } catch (e) {
        return null;
      }
    },

    reset: function (state) {
      state.brains = 0;
      state.totalBrains = 0;
      state.clicks = 0;
      state.generators = {};
      state.upgrades = {};
      state.achievements = [];
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(Game.SAVE_KEY);
        }
      } catch (e) {}
      return true;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
  }
  if (typeof window !== 'undefined') {
    window.Game = Game;
  }
})();
