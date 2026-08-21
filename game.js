// ===== ESTADO DEL JUEGO =====
const state = {
  brains: 0,
  totalBrains: 0,
  totalClicks: 0,
  clickPower: 1,
  generators: {},
  upgrades: {},
  achievements: {},
  goldenBrainClicks: 0,
  lastSave: Date.now()
};

// ===== DEFINICIONES DE GENERADORES =====
const GENERATORS = [
  { id: 'cursor', name: 'Cursor Mágico', desc: 'Clic automático', baseCost: 15, baseBps: 0.1, icon: '👆' },
  { id: 'grandma', name: 'Abuela Zombi', desc: 'Hace clic por ti', baseCost: 100, baseBps: 1, icon: '👵' },
  { id: 'farm', name: 'Granja de Cerebros', desc: 'Cultiva cerebros', baseCost: 1100, baseBps: 8, icon: '🌾' },
  { id: 'mine', name: 'Mina de Cerebros', desc: 'Extrae cerebros', baseCost: 12000, baseBps: 47, icon: '⛏️' },
  { id: 'factory', name: 'Fábrica Zombi', desc: 'Producción masiva', baseCost: 130000, baseBps: 260, icon: '🏭' },
  { id: 'bank', name: 'Banco de Cerebros', desc: 'Invierte cerebros', baseCost: 1400000, baseBps: 1400, icon: '🏦' },
  { id: 'temple', name: 'Templo Zombi', desc: 'Adora cerebros', baseCost: 20000000, baseBps: 7800, icon: '🛕' },
  { id: 'wizard', name: 'Hechicero', desc: 'Magia cerebral', baseCost: 330000000, baseBps: 44000, icon: '🧙' },
  { id: 'shrine', name: 'Santuario', desc: 'Poder ancestral', baseCost: 5100000000, baseBps: 260000, icon: '⛩️' },
  { id: 'portal', name: 'Portal Dimensional', desc: 'Cerebros de otros mundos', baseCost: 75000000000, baseBps: 1600000, icon: '🌀' }
];

// ===== DEFINICIONES DE MEJORAS =====
const UPGRADES = [
  { id: 'click1', name: 'Guante Reforzado', desc: 'Duplica poder de clic', cost: 100, type: 'click', multiplier: 2, icon: '🧤' },
  { id: 'click2', name: 'Guante de Acero', desc: 'Duplica poder de clic', cost: 1000, type: 'click', multiplier: 2, icon: '🛡️' },
  { id: 'click3', name: 'Guante Mágico', desc: 'Duplica poder de clic', cost: 10000, type: 'click', multiplier: 2, icon: '✨' },
  { id: 'cursor1', name: 'Cursors Rápidos', desc: 'Cursors 2x más rápidos', cost: 500, type: 'generator', target: 'cursor', multiplier: 2, icon: '⚡' },
  { id: 'grandma1', name: 'Recetas Secretas', desc: 'Abuelas 2x más rápidas', cost: 5000, type: 'generator', target: 'grandma', multiplier: 2, icon: '📖' },
  { id: 'farm1', name: 'Fertilizante', desc: 'Granjas 2x más rápidas', cost: 55000, type: 'generator', target: 'farm', multiplier: 2, icon: '🌱' },
  { id: 'mine1', name: 'Diamantes', desc: 'Minas 2x más rápidas', cost: 600000, type: 'generator', target: 'mine', multiplier: 2, icon: '💎' },
  { id: 'factory1', name: 'Automatización', desc: 'Fábricas 2x más rápidas', cost: 6500000, type: 'generator', target: 'factory', multiplier: 2, icon: '🤖' },
  { id: 'bank1', name: 'Intereses Compuestos', desc: 'Bancos 2x más rápidos', cost: 70000000, type: 'generator', target: 'bank', multiplier: 2, icon: '💰' },
  { id: 'temple1', name: 'Bendición', desc: 'Templos 2x más rápidos', cost: 1000000000, type: 'generator', target: 'temple', multiplier: 2, icon: '🙏' },
  { id: 'wizard1', name: 'Poción de Poder', desc: 'Hechiceros 2x más rápidos', cost: 16500000000, type: 'generator', target: 'wizard', multiplier: 2, icon: '🧪' },
  { id: 'shrine1', name: 'Reliquia', desc: 'Santuarios 2x más rápidos', cost: 255000000000, type: 'generator', target: 'shrine', multiplier: 2, icon: '🏺' },
  { id: 'portal1', name: 'Multiverso', desc: 'Portales 2x más rápidos', cost: 3750000000000, type: 'generator', target: 'portal', multiplier: 2, icon: '🌌' }
];

// ===== DEFINICIONES DE LOGROS =====
const ACHIEVEMENTS = [
  { id: 'click10', name: 'Primeros Golpes', desc: 'Haz 10 clics', check: () => state.totalClicks >= 10, icon: '👊' },
  { id: 'click100', name: 'Golpeador', desc: 'Haz 100 clics', check: () => state.totalClicks >= 100, icon: '💪' },
  { id: 'click1000', name: 'Máquina de Golpes', desc: 'Haz 1000 clics', check: () => state.totalClicks >= 1000, icon: '🤖' },
  { id: 'brains100', name: 'Cerebro Inicial', desc: 'Gana 100 cerebros', check: () => state.totalBrains >= 100, icon: '🧠' },
  { id: 'brains1000', name: 'Coleccionista', desc: 'Gana 1000 cerebros', check: () => state.totalBrains >= 1000, icon: '📦' },
  { id: 'brains10000', name: 'Magnate', desc: 'Gana 10000 cerebros', check: () => state.totalBrains >= 10000, icon: '💼' },
  { id: 'brains100000', name: 'Millonario', desc: 'Gana 100000 cerebros', check: () => state.totalBrains >= 100000, icon: '💰' },
  { id: 'brains1000000', name: 'Millonario Zombi', desc: 'Gana 1M cerebros', check: () => state.totalBrains >= 1000000, icon: '👑' },
  { id: 'gen1', name: 'Primer Generador', desc: 'Compra 1 generador', check: () => Object.values(state.generators).some(c => c >= 1), icon: '🏗️' },
  { id: 'gen10', name: 'Constructor', desc: 'Compra 10 generadores', check: () => Object.values(state.generators).reduce((a, b) => a + b, 0) >= 10, icon: '🔨' },
  { id: 'gen50', name: 'Arquitecto', desc: 'Compra 50 generadores', check: () => Object.values(state.generators).reduce((a, b) => a + b, 0) >= 50, icon: '📐' },
  { id: 'gen100', name: 'Magnate Industrial', desc: 'Compra 100 generadores', check: () => Object.values(state.generators).reduce((a, b) => a + b, 0) >= 100, icon: '🏭' },
  { id: 'upg1', name: 'Mejora Inicial', desc: 'Compra 1 mejora', check: () => Object.keys(state.upgrades).length >= 1, icon: '⬆️' },
  { id: 'upg5', name: 'Innovador', desc: 'Compra 5 mejoras', check: () => Object.keys(state.upgrades).length >= 5, icon: '💡' },
  { id: 'upg10', name: 'Genio', desc: 'Compra 10 mejoras', check: () => Object.keys(state.upgrades).length >= 10, icon: '🎓' },
  { id: 'golden1', name: 'Suerte Dorada', desc: 'Haz clic en 1 cerebro dorado', check: () => state.goldenBrainClicks >= 1, icon: '🍀' },
  { id: 'golden5', name: 'Cazador Dorado', desc: 'Haz clic en 5 cerebros dorados', check: () => state.goldenBrainClicks >= 5, icon: '🎯' },
  { id: 'golden10', name: 'Leyenda Dorada', desc: 'Haz clic en 10 cerebros dorados', check: () => state.goldenBrainClicks >= 10, icon: '🏆' }
];

// ===== INICIALIZACIÓN =====
function initGame() {
  GENERATORS.forEach(g => {
    state.generators[g.id] = 0;
  });
  UPGRADES.forEach(u => {
    state.upgrades[u.id] = false;
  });
  ACHIEVEMENTS.forEach(a => {
    state.achievements[a.id] = false;
  });
}

// ===== CÁLCULOS =====
function getGeneratorCost(genId) {
  const gen = GENERATORS.find(g => g.id === genId);
  const count = state.generators[genId];
  return Math.floor(gen.baseCost * Math.pow(1.15, count));
}

function getGeneratorBps(genId) {
  const gen = GENERATORS.find(g => g.id === genId);
  let multiplier = 1;
  UPGRADES.forEach(u => {
    if (state.upgrades[u.id] && u.type === 'generator' && u.target === genId) {
      multiplier *= u.multiplier;
    }
  });
  return gen.baseBps * multiplier;
}

function getTotalBps() {
  let total = 0;
  GENERATORS.forEach(g => {
    total += state.generators[g.id] * getGeneratorBps(g.id);
  });
  return total;
}

function getClickPower() {
  let power = 1;
  UPGRADES.forEach(u => {
    if (state.upgrades[u.id] && u.type === 'click') {
      power *= u.multiplier;
    }
  });
  return power;
}

// ===== ACCIONES =====
function clickZombie() {
  const power = getClickPower();
  state.brains += power;
  state.totalBrains += power;
  state.totalClicks++;
  checkAchievements();
  return power;
}

function buyGenerator(genId) {
  const cost = getGeneratorCost(genId);
  if (state.brains >= cost) {
    state.brains -= cost;
    state.generators[genId]++;
    checkAchievements();
    return true;
  }
  return false;
}

function buyUpgrade(upgId) {
  const upg = UPGRADES.find(u => u.id === upgId);
  if (!state.upgrades[upgId] && state.brains >= upg.cost) {
    state.brains -= upg.cost;
    state.upgrades[upgId] = true;
    checkAchievements();
    return true;
  }
  return false;
}

function clickGoldenBrain() {
  state.goldenBrainClicks++;
  const bonus = Math.max(100, Math.floor(getTotalBps() * 60));
  state.brains += bonus;
  state.totalBrains += bonus;
  checkAchievements();
  return bonus;
}

// ===== LOGROS =====
function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (!state.achievements[a.id] && a.check()) {
      state.achievements[a.id] = true;
      if (typeof showToast === 'function') {
        showToast(`🏆 Logro desbloqueado: ${a.name}`);
      }
    }
  });
}

// ===== GUARDADO / CARGA =====
function saveGame() {
  state.lastSave = Date.now();
  try {
    localStorage.setItem('zombieClickerSave', JSON.stringify(state));
    if (typeof showToast === 'function') {
      showToast('💾 Juego guardado');
    }
  } catch (e) {
    if (typeof showToast === 'function') {
      showToast('⚠️ Error al guardar');
    }
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem('zombieClickerSave');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
      // Asegurar que todos los generadores existan
      GENERATORS.forEach(g => {
        if (state.generators[g.id] === undefined) {
          state.generators[g.id] = 0;
        }
      });
      UPGRADES.forEach(u => {
        if (state.upgrades[u.id] === undefined) {
          state.upgrades[u.id] = false;
        }
      });
      ACHIEVEMENTS.forEach(a => {
        if (state.achievements[a.id] === undefined) {
          state.achievements[a.id] = false;
        }
      });
      return true;
    }
  } catch (e) {
    // Error al cargar
  }
  return false;
}

function resetGame() {
  if (confirm('¿Estás seguro de que quieres reiniciar el juego? Se perderá todo el progreso.')) {
    localStorage.removeItem('zombieClickerSave');
    state.brains = 0;
    state.totalBrains = 0;
    state.totalClicks = 0;
    state.clickPower = 1;
    state.goldenBrainClicks = 0;
    state.lastSave = Date.now();
    initGame();
    if (typeof showToast === 'function') {
      showToast('🔄 Juego reiniciado');
    }
  }
}

// ===== BUCLE DE JUEGO =====
let gameLoopId = null;
let lastTick = Date.now();

function gameTick() {
  const now = Date.now();
  const delta = (now - lastTick) / 1000;
  lastTick = now;

  const bps = getTotalBps();
  const earned = bps * delta;
  state.brains += earned;
  state.totalBrains += earned;

  checkAchievements();
}

function startGameLoop() {
  if (gameLoopId) {
    clearInterval(gameLoopId);
  }
  lastTick = Date.now();
  gameLoopId = setInterval(gameTick, 100);
}

function stopGameLoop() {
  if (gameLoopId) {
    clearInterval(gameLoopId);
    gameLoopId = null;
  }
}

// ===== CEREbro DORADO =====
let goldenBrainTimeout = null;
let goldenBrainInterval = null;

function scheduleGoldenBrain() {
  if (goldenBrainTimeout) {
    clearTimeout(goldenBrainTimeout);
  }
  const delay = 60000 + Math.random() * 120000; // 60-180 segundos
  goldenBrainTimeout = setTimeout(spawnGoldenBrain, delay);
}

function spawnGoldenBrain() {
  const el = document.getElementById('golden-brain');
  if (el) {
    el.classList.remove('hidden');
    // Desaparece después de 10 segundos si no se hace clic
    goldenBrainInterval = setTimeout(() => {
      el.classList.add('hidden');
      scheduleGoldenBrain();
    }, 10000);
  }
}

function hideGoldenBrain() {
  const el = document.getElementById('golden-brain');
  if (el) {
    el.classList.add('hidden');
  }
  if (goldenBrainInterval) {
    clearTimeout(goldenBrainInterval);
    goldenBrainInterval = null;
  }
  scheduleGoldenBrain();
}

// ===== FORMATO DE NÚMEROS =====
function formatNumber(num) {
  if (num < 1000) {
    return num % 1 === 0 ? num.toString() : num.toFixed(1);
  } else if (num < 1000000) {
    return (num / 1000).toFixed(1) + 'K';
  } else if (num < 1000000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num < 1000000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else {
    return (num / 1000000000000).toFixed(1) + 'T';
  }
}

// ===== INICIALIZACIÓN DEL JUEGO =====
function init() {
  initGame();
  loadGame();
  startGameLoop();
  scheduleGoldenBrain();

  // Auto-guardado cada 30 segundos
  setInterval(saveGame, 30000);

  // Guardar al cerrar
  window.addEventListener('beforeunload', saveGame);
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
