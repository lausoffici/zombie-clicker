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
  // No alcanza para comprar de nuevo
  const fail = Game.buyGenerator(s, genId);
  assert.strictEqual(fail, false, 'no debe poder comprar sin fondos');
  assert.strictEqual(s.generators[genId], 1, 'la cantidad no debe cambiar si no alcanza');
})();

// 3. tick produce según bps
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
  // tick con dt=0 no cambia nada
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
  // No se puede comprar dos veces
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
  // deserialize inválido devuelve estado nuevo
  const bad = Game.deserialize('no es json');
  assert.strictEqual(bad.brains, 0, 'deserialize inválido debe devolver brains 0');
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
  // Sin generadores no gana nada
  const s2 = Game.createState();
  const g2 = Game.applyOfflineProgress(s2, 3600);
  assert.strictEqual(g2, 0, 'sin generadores no debe ganar nada');
  // elapsed inválido no gana nada
  const g3 = Game.applyOfflineProgress(s, -5);
  assert.strictEqual(g3, 0, 'elapsed negativo no debe ganar nada');
})();

console.log('Todos los tests pasaron');
process.exit(0);
