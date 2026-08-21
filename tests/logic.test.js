'use strict';

const assert = require('assert');
const Game = require('../game.js');

function approxEqual(a, b, eps) {
  if (eps === undefined) eps = 1e-6;
  return Math.abs(a - b) <= eps;
}

// 1. click suma cerebros
(function testClick() {
  const s = Game.createState();
  const before = s.brains;
  const clicks = 5;
  for (let i = 0; i < clicks; i++) Game.click(s);
  assert.strictEqual(s.brains, before + clicks * Game.getClickValue(s), 'click debe sumar el valor de click');
  assert.strictEqual(s.totalClicks, clicks, 'totalClicks debe incrementarse');
})();

// 2. buyGenerator descuenta y sube el costo
(function testBuyGenerator() {
  const s = Game.createState();
  const genId = Game.GENERATORS[0].id;
  const baseCost = Game.getGeneratorCost(s, genId);
  s.brains = baseCost;
  const ok = Game.buyGenerator(s, genId);
  assert.strictEqual(ok, true, 'buyGenerator debe devolver true si alcanza el costo');
  assert.strictEqual(s.generators[genId], 1, 'debe haber comprado 1 generador');
  assert.strictEqual(s.brains, 0, 'debe descontar exactamente el costo');
  const newCost = Game.getGeneratorCost(s, genId);
  assert.ok(newCost > baseCost, 'el costo debe subir tras comprar');
  const fail = Game.buyGenerator(s, genId);
  assert.strictEqual(fail, false, 'no debe poder comprar sin fondos');
  assert.strictEqual(s.generators[genId], 1, 'la cantidad no debe cambiar si no alcanza');
})();

// 3. tick produce segun bps
(function testTick() {
  const s = Game.createState();
  const genId = Game.GENERATORS[0].id;
  s.generators[genId] = 10;
  const bps = Game.getBrainsPerSecond(s);
  assert.ok(bps > 0, 'bps debe ser positivo con generadores');
  const before = s.brains;
  const dt = 2.5;
  Game.tick(s, dt);
  assert.ok(approxEqual(s.brains, before + bps * dt, 1e-6), 'tick debe sumar bps*dt');
  const before2 = s.brains;
  Game.tick(s, 0);
  assert.strictEqual(s.brains, before2, 'tick con dt=0 no debe cambiar nada');
})();

// 4. buyUpgrade aplica multiplicador y no se puede comprar dos veces
(function testBuyUpgrade() {
  const s = Game.createState();
  const up = Game.UPGRADES[0];
  assert.strictEqual(up.type, 'click', 'el primer upgrade debe ser de tipo click');
  const before = Game.getClickValue(s);
  s.brains = up.cost;
  const ok = Game.buyUpgrade(s, up.id);
  assert.strictEqual(ok, true, 'buyUpgrade debe devolver true si alcanza el costo');
  assert.strictEqual(Game.getClickValue(s), before * up.multiplier, 'el multiplicador debe aplicarse al click');
  assert.strictEqual(s.upgrades.indexOf(up.id), 0, 'el upgrade debe estar en la lista');
  const again = Game.buyUpgrade(s, up.id);
  assert.strictEqual(again, false, 'no se puede comprar el mismo upgrade dos veces');
  assert.strictEqual(s.upgrades.length, 1, 'la lista de upgrades no debe duplicarse');
})();

// 5. formatNumber con K y M
(function testFormatNumber() {
  assert.strictEqual(Game.formatNumber(999), '999', 'formatNumber < 1000');
  assert.strictEqual(Game.formatNumber(1500), '1.5K', 'formatNumber K');
  assert.strictEqual(Game.formatNumber(2500000), '2.5M', 'formatNumber M');
})();

// 6. roundtrip serialize/deserialize
(function testSerializeRoundtrip() {
  const s = Game.createState();
  s.brains = 12345.678;
  s.totalClicks = 42;
  s.generators['superviviente'] = 7;
  s.upgrades.push('dedos-podridos');
  const text = Game.serialize(s);
  const s2 = Game.deserialize(text);
  assert.strictEqual(s2.brains, s.brains, 'brains debe sobrevivir al roundtrip');
  assert.strictEqual(s2.totalClicks, s.totalClicks, 'totalClicks debe sobrevivir al roundtrip');
  assert.strictEqual(s2.generators['superviviente'], 7, 'generators deben sobrevivir al roundtrip');
  assert.strictEqual(s2.upgrades.indexOf('dedos-podridos'), 0, 'upgrades deben sobrevivir al roundtrip');
  const bad = Game.deserialize('no es json');
  assert.strictEqual(bad.brains, 0, 'deserialize invalido debe devolver brains 0');
})();

// 7. applyOfflineProgress
(function testOfflineProgress() {
  const s = Game.createState();
  s.generators['superviviente'] = 10;
  const bps = Game.getBrainsPerSecond(s);
  const before = s.brains;
  const elapsed = 3600;
  const gained = Game.applyOfflineProgress(s, elapsed);
  assert.ok(approxEqual(gained, bps * elapsed, 1e-6), 'applyOfflineProgress debe devolver bps*elapsed');
  assert.ok(approxEqual(s.brains, before + bps * elapsed, 1e-6), 'applyOfflineProgress debe sumar a brains');
  const s2 = Game.createState();
  const g2 = Game.applyOfflineProgress(s2, 3600);
  assert.strictEqual(g2, 0, 'sin generadores no debe ganar nada');
  const g3 = Game.applyOfflineProgress(s, -5);
  assert.strictEqual(g3, 0, 'elapsed negativo no debe ganar nada');
})();

// 8. buyGenerators compra varios y devuelve la cantidad
(function testBuyGenerators() {
  const s = Game.createState();
  const genId = Game.GENERATORS[0].id;
  const gen = Game.GENERATORS.find((g) => g.id === genId);
  const c0 = Math.ceil(gen.baseCost * Math.pow(gen.growth, 0));
  const c1 = Math.ceil(gen.baseCost * Math.pow(gen.growth, 1));
  const c2 = Math.ceil(gen.baseCost * Math.pow(gen.growth, 2));
  const totalFor3 = c0 + c1 + c2;
  s.brains = totalFor3;
  const bought = Game.buyGenerators(s, genId, 3);
  assert.strictEqual(bought, 3, 'buyGenerators debe comprar 3');
  assert.strictEqual(s.generators[genId], 3, 'la cantidad debe ser 3');
  const costNext = Game.getGeneratorCost(s, genId);
  s.brains = costNext - 1;
  const bought2 = Game.buyGenerators(s, genId, 5);
  assert.strictEqual(bought2, 0, 'no debe comprar si no alcanza para 1');
  assert.strictEqual(s.generators[genId], 3, 'la cantidad no debe cambiar');
  const bought3 = Game.buyGenerators(s, genId, 0);
  assert.strictEqual(bought3, 0, 'count 0 no debe comprar nada');
  const bought4 = Game.buyGenerators(s, genId, -2);
  assert.strictEqual(bought4, 0, 'count negativo no debe comprar nada');
})();

// 9. getMaxAffordable devuelve la cantidad maxima asequible
(function testGetMaxAffordable() {
  const s = Game.createState();
  const genId = Game.GENERATORS[0].id;
  const gen = Game.GENERATORS.find((g) => g.id === genId);
  const c0 = Math.ceil(gen.baseCost * Math.pow(gen.growth, 0));
  const c1 = Math.ceil(gen.baseCost * Math.pow(gen.growth, 1));
  s.brains = c0;
  assert.strictEqual(Game.getMaxAffordable(s, genId), 1, 'debe poder comprar 1');
  s.brains = c0 + c1;
  assert.strictEqual(Game.getMaxAffordable(s, genId), 2, 'debe poder comprar 2');
  s.brains = c0 - 1;
  assert.strictEqual(Game.getMaxAffordable(s, genId), 0, 'no debe poder comprar ninguno');
  assert.strictEqual(Game.getMaxAffordable(s, 'no-existe'), 0, 'id invalido devuelve 0');
})();

// 10. totalBrainsEarned aumenta con click y tick
(function testTotalBrainsEarned() {
  const s = Game.createState();
  const before = s.totalBrainsEarned;
  Game.click(s);
  assert.ok(s.totalBrainsEarned > before, 'totalBrainsEarned debe aumentar con click');
  const genId = Game.GENERATORS[0].id;
  s.generators[genId] = 5;
  const before2 = s.totalBrainsEarned;
  Game.tick(s, 10);
  assert.ok(s.totalBrainsEarned > before2, 'totalBrainsEarned debe aumentar con tick');
})();

// 11. checkAchievements desbloquea logros y aplica bonus
(function testCheckAchievements() {
  const s = Game.createState();
  s.totalBrainsEarned = 1;
  Game.checkAchievements(s);
  assert.ok(s.achievements.indexOf('primer-cerebro') !== -1, 'debe desbloquear primer-cerebro');
  const multBefore = Game.getGlobalMultiplier(s);
  assert.ok(multBefore > 1, 'el bonus debe aumentar el multiplicador global');
  s.totalBrainsEarned = 100;
  Game.checkAchievements(s);
  assert.ok(s.achievements.indexOf('cerebros-100') !== -1, 'debe desbloquear cerebros-100');
  const multAfter = Game.getGlobalMultiplier(s);
  assert.ok(multAfter > multBefore, 'el multiplicador debe seguir subiendo');
})();

// 12. getGlobalMultiplier con upgrades globales
(function testGlobalMultiplier() {
  const s = Game.createState();
  const up = Game.UPGRADES.find((u) => u.type === 'global');
  assert.ok(up, 'debe existir un upgrade global');
  const before = Game.getGlobalMultiplier(s);
  s.upgrades.push(up.id);
  const after = Game.getGlobalMultiplier(s);
  assert.ok(after > before, 'el upgrade global debe aumentar el multiplicador');
})();

// 13. getGeneratorBps con upgrade de generador
(function testGeneratorBps() {
  const s = Game.createState();
  const up = Game.UPGRADES.find((u) => u.type === 'generator');
  assert.ok(up, 'debe existir un upgrade de generador');
  const before = Game.getGeneratorBps(s, up.generatorId);
  s.upgrades.push(up.id);
  const after = Game.getGeneratorBps(s, up.generatorId);
  assert.ok(after > before, 'el upgrade de generador debe aumentar el bps');
})();

// 14. getClickValue con upgrades de click
(function testClickValue() {
  const s = Game.createState();
  const base = Game.getClickValue(s);
  const clickUps = Game.UPGRADES.filter((u) => u.type === 'click');
  for (const u of clickUps) s.upgrades.push(u.id);
  const after = Game.getClickValue(s);
  assert.ok(after > base, 'los upgrades de click deben aumentar el valor');
})();

// 15. estado inicial valido
(function testInitialState() {
  const s = Game.createState();
  assert.strictEqual(s.brains, 0, 'brains inicial 0');
  assert.strictEqual(s.totalBrainsEarned, 0, 'totalBrainsEarned inicial 0');
  assert.strictEqual(s.totalClicks, 0, 'totalClicks inicial 0');
  assert.strictEqual(s.upgrades.length, 0, 'upgrades inicial vacio');
  assert.strictEqual(s.achievements.length, 0, 'achievements inicial vacio');
  for (const g of Game.GENERATORS) {
    assert.strictEqual(s.generators[g.id], 0, 'generador inicial 0');
  }
})();

console.log('Todos los tests pasaron correctamente.');
