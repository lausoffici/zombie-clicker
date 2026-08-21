// ===== REFERENCIAS AL DOM =====
let brainsCountEl, bpsCountEl, clickPowerValueEl;
let zombieEl, floatingTextsEl;
let generatorsListEl, upgradesListEl, achievementsListEl;
let goldenBrainEl, toastContainerEl;

// ===== INICIALIZACIÓN DE UI =====
function initUI() {
  brainsCountEl = document.getElementById('brains-count');
  bpsCountEl = document.getElementById('bps-count');
  clickPowerValueEl = document.getElementById('click-power-value');
  zombieEl = document.getElementById('zombie');
  floatingTextsEl = document.getElementById('floating-texts');
  generatorsListEl = document.getElementById('generators-list');
  upgradesListEl = document.getElementById('upgrades-list');
  achievementsListEl = document.getElementById('achievements-list');
  goldenBrainEl = document.getElementById('golden-brain');
  toastContainerEl = document.getElementById('toast-container');

  setupEventListeners();
  renderGenerators();
  renderUpgrades();
  renderAchievements();
  updateDisplay();
  startUIUpdateLoop();
}

// ===== EVENTOS =====
function setupEventListeners() {
  // Clic en zombie
  zombieEl.addEventListener('click', handleZombieClick);
  zombieEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleZombieClick();
    }
  });

  // Tabs
  document.getElementById('tab-generators').addEventListener('click', () => switchTab('generators'));
  document.getElementById('tab-upgrades').addEventListener('click', () => switchTab('upgrades'));
  document.getElementById('tab-achievements').addEventListener('click', () => switchTab('achievements'));

  // Botones
  document.getElementById('save-btn').addEventListener('click', saveGame);
  document.getElementById('reset-btn').addEventListener('click', resetGame);

  // Cerebro dorado
  goldenBrainEl.addEventListener('click', handleGoldenBrainClick);
  goldenBrainEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleGoldenBrainClick();
    }
  });
}

function handleZombieClick() {
  const power = clickZombie();
  createFloatingText('+' + formatNumber(power));
  updateDisplay();
  renderGenerators();
  renderUpgrades();
}

function handleGoldenBrainClick() {
  const bonus = clickGoldenBrain();
  hideGoldenBrain();
  createFloatingText('+' + formatNumber(bonus) + ' 🧠');
  showToast('🧠 Cerebro Dorado: +' + formatNumber(bonus) + ' cerebros');
  updateDisplay();
  renderGenerators();
  renderUpgrades();
}

// ===== TABS =====
function switchTab(tabName) {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach(t => t.classList.remove('active'));
  panels.forEach(p => p.classList.remove('active'));

  document.getElementById('tab-' + tabName).classList.add('active');
  document.getElementById(tabName + '-panel').classList.add('active');
}

// ===== RENDERIZADO =====
function renderGenerators() {
  generatorsListEl.innerHTML = '';
  GENERATORS.forEach(gen => {
    const cost = getGeneratorCost(gen.id);
    const count = state.generators[gen.id];
    const canAfford = state.brains >= cost;

    const item = document.createElement('div');
    item.className = 'generator-item' + (canAfford ? '' : ' disabled');
    item.dataset.generatorId = gen.id;

    item.innerHTML = `
      <div class="item-icon">${gen.icon}</div>
      <div class="item-info">
        <div class="item-name">${gen.name}</div>
        <div class="item-desc">${gen.desc} · ${formatNumber(getGeneratorBps(gen.id))}/seg</div>
        <div class="item-cost">🧠 ${formatNumber(cost)}</div>
      </div>
      <div class="item-count">${count}</div>
    `;

    item.addEventListener('click', () => {
      if (buyGenerator(gen.id)) {
        updateDisplay();
        renderGenerators();
        renderUpgrades();
      }
    });

    generatorsListEl.appendChild(item);
  });
}

function renderUpgrades() {
  upgradesListEl.innerHTML = '';
  UPGRADES.forEach(upg => {
    const purchased = state.upgrades[upg.id];
    const canAfford = state.brains >= upg.cost;

    if (purchased) {
      const item = document.createElement('div');
      item.className = 'upgrade-item disabled';
      item.innerHTML = `
        <div class="item-icon">${upg.icon}</div>
        <div class="item-info">
          <div class="item-name">${upg.name}</div>
          <div class="item-desc">${upg.desc}</div>
          <div class="item-cost">✓ Comprado</div>
        </div>
      `;
      upgradesListEl.appendChild(item);
    } else {
      const item = document.createElement('div');
      item.className = 'upgrade-item' + (canAfford ? '' : ' disabled');
      item.dataset.upgradeId = upg.id;
      item.innerHTML = `
        <div class="item-icon">${upg.icon}</div>
        <div class="item-info">
          <div class="item-name">${upg.name}</div>
          <div class="item-desc">${upg.desc}</div>
          <div class="item-cost">🧠 ${formatNumber(upg.cost)}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        if (buyUpgrade(upg.id)) {
          updateDisplay();
          renderGenerators();
          renderUpgrades();
        }
      });
      upgradesListEl.appendChild(item);
    }
  });
}

function renderAchievements() {
  achievementsListEl.innerHTML = '';
  ACHIEVEMENTS.forEach(ach => {
    const unlocked = state.achievements[ach.id];
    const item = document.createElement('div');
    item.className = 'achievement-item ' + (unlocked ? 'unlocked' : 'locked');
    item.innerHTML = `
      <div class="achievement-icon">${unlocked ? ach.icon : '🔒'}</div>
      <div class="item-info">
        <div class="item-name">${ach.name}</div>
        <div class="item-desc">${ach.desc}</div>
      </div>
    `;
    achievementsListEl.appendChild(item);
  });
}

// ===== ACTUALIZACIÓN DE DISPLAY =====
function updateDisplay() {
  brainsCountEl.textContent = formatNumber(Math.floor(state.brains));
  bpsCountEl.textContent = formatNumber(getTotalBps());
  clickPowerValueEl.textContent = formatNumber(getClickPower());
}

function startUIUpdateLoop() {
  setInterval(() => {
    updateDisplay();
    // Actualizar estados de botones
    document.querySelectorAll('.generator-item').forEach(item => {
      const genId = item.dataset.generatorId;
      if (genId) {
        const cost = getGeneratorCost(genId);
        const canAfford = state.brains >= cost;
        item.classList.toggle('disabled', !canAfford);
      }
    });
    document.querySelectorAll('.upgrade-item').forEach(item => {
      const upgId = item.dataset.upgradeId;
      if (upgId && !state.upgrades[upgId]) {
        const upg = UPGRADES.find(u => u.id === upgId);
        if (upg) {
          const canAfford = state.brains >= upg.cost;
          item.classList.toggle('disabled', !canAfford);
        }
      }
    });
  }, 250);
}

// ===== TEXTOS FLOTANTES =====
function createFloatingText(text) {
  const el = document.createElement('div');
  el.className = 'floating-text';
  el.textContent = text;

  const rect = zombieEl.getBoundingClientRect();
  const sectionRect = document.getElementById('clicker-section').getBoundingClientRect();

  const x = rect.left - sectionRect.left + rect.width / 2 + (Math.random() - 0.5) * 60;
  const y = rect.top - sectionRect.top + rect.height / 2;

  el.style.left = x + 'px';
  el.style.top = y + 'px';

  floatingTextsEl.appendChild(el);

  setTimeout(() => {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }, 1000);
}

// ===== TOASTS =====
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainerEl.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 4000);
}

// ===== INICIALIZAR UI CUANDO ESTÉ LISTO =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUI);
} else {
  initUI();
}
