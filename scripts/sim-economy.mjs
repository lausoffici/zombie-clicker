import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const Game = require(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "game.js"));

function greedyBuy(s) {
  let bought = true;
  while (bought) {
    bought = false;
    for (let i = 0; i < Game.UPGRADES.length; i++) {
      const u = Game.UPGRADES[i];
      if (Game.buyUpgrade(s, u.id)) bought = true;
    }
    let best = null;
    let bestEff = 0;
    for (let i = 0; i < Game.GENERATORS.length; i++) {
      const g = Game.GENERATORS[i];
      const cost = Game.getGeneratorCost(s, g.id);
      if (!isFinite(cost) || s.brains < cost) continue;
      const nextBps = Game.getGeneratorBps(s, g.id) * Game.getGlobalMultiplier(s);
      const eff = nextBps / cost;
      if (eff > bestEff) {
        bestEff = eff;
        best = g.id;
      }
    }
    if (best && Game.buyGenerator(s, best)) bought = true;
  }
}

function sim(opts) {
  const s = Game.createState();
  const dt = opts.dt || 0.5;
  const maxHours = opts.maxHours || 96;
  const maxT = maxHours * 3600;
  const marks = {};
  let t = 0;
  let lastBps = 0;
  while (s.brains < 15 && t < 120) {
    Game.click(s);
    t += 0.25;
  }
  while (t < maxT) {
    Game.tick(s, dt);
    greedyBuy(s);
    Game.checkAchievements(s);
    t += dt;
    const prestige = Game.getPrestigeGain(s);
    lastBps = Game.getBrainsPerSecond(s);
    Game.GENERATORS.forEach(function (g) {
      const key = "first_" + g.id;
      if (!marks[key] && (s.generators[g.id] || 0) >= 1) {
        marks[key] = { hours: t / 3600, brains: s.totalBrainsEarned, bps: lastBps, souls: prestige };
      }
    });
    if (!marks.firstSoul && prestige >= 1) {
      marks.firstSoul = { hours: t / 3600, brains: s.totalBrainsEarned, bps: lastBps, souls: prestige };
    }
    if (!marks.milestone25) {
      const hit = Game.GENERATORS.some(function (g) { return (s.generators[g.id] || 0) >= 25; });
      if (hit) marks.milestone25 = { hours: t / 3600, bps: lastBps };
    }
  }
  marks.end = {
    hours: t / 3600,
    brains: s.totalBrainsEarned,
    bps: lastBps,
    souls: Game.getPrestigeGain(s),
    gens: Object.assign({}, s.generators),
    upgrades: s.upgrades.length,
    achievements: s.achievements.length,
    global: Game.getGlobalMultiplier(s)
  };
  return marks;
}

function fmt(m) {
  if (!m) return "never";
  const h = m.hours != null ? m.hours : 0;
  return h.toFixed(2) + "h brains=" + Game.formatNumber(m.brains || 0) + " bps=" + Game.formatNumber(m.bps || 0);
}

const report = sim({ dt: 1, maxHours: 72 });
const lines = [];
lines.push("sim-economy " + new Date().toISOString());
lines.push("generators " + Game.GENERATORS.length + " upgrades " + Game.UPGRADES.length + " achievements " + Game.ACHIEVEMENTS.length);
["firstSoul", "milestone25", "first_zombie-dios", "first_vacio-verdoso"].forEach(function (k) {
  lines.push(k + " " + fmt(report[k]));
});
lines.push("end " + fmt(report.end) + " upgrades=" + report.end.upgrades + " ach=" + report.end.achievements);
console.log(lines.join("\n"));
if (typeof process !== "undefined" && process.argv.indexOf("--json") !== -1) {
  console.log(JSON.stringify(report, null, 2));
}
