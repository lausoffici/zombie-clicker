'use strict';

const assert = require('assert');
const Game = require('../game.js');

function approxEqual(a, b, eps) {
  if (eps === undefined) eps = 1e-6;
  return Math.abs(a - b) <= eps;
}

// 0a. buyCosmetic gasta astillas y marca owned
(function testBuyCosmetic() {
  const s = Game.createState();
  s.prestige.soulChips = 10;
  const chipsBefore = s.prestige.soulChips;
  assert.strictEqual(Game.buyCosmetic(s, "skin-rot"), true, 'buyCosmetic debe comprar skin-rot');
  assert.strictEqual(s.prestige.soulChips, chipsBefore - 1, 'buyCosmetic debe descontar astillas');
  assert.ok(s.cosmetics.owned.indexOf("skin-rot") !== -1, 'skin-rot debe estar en owned');
  assert.strictEqual(Game.buyCosmetic(s, "skin-rot"), false, 'no se puede comprar dos veces');
  s.prestige.soulChips = 0;
  assert.strictEqual(Game.buyCosmetic(s, "skin-neon"), false, 'sin astillas no se puede comprar');
})();

// 0b. equipCosmetic requiere owned
(function testEquipCosmetic() {
  const s = Game.createState();
  assert.strictEqual(Game.equipCosmetic(s, "skin-neon"), false, 'no se puede equipar sin comprar');
  s.prestige.soulChips = 10;
  Game.buyCosmetic(s, "skin-neon");
  assert.strictEqual(Game.equipCosmetic(s, "skin-neon"), true, 'equipCosmetic debe funcionar tras comprar');
  assert.strictEqual(s.cosmetics.equipped.skin, "skin-neon", 'equipped.skin debe actualizarse');
})();

// 0c. prestige conserva cosmetics
(function testPrestigeKeepsCosmetics() {
  const s = Game.createState();
  s.prestige.soulChips = 10;
  Game.buyCosmetic(s, "skin-neon");
  Game.equipCosmetic(s, "skin-neon");
  s.prestige.souls = 10;
  const ns = Game.prestige(s);
  assert.ok(ns.cosmetics && ns.cosmetics.owned.indexOf("skin-neon") !== -1, 'prestige debe conservar owned');
  assert.strictEqual(ns.cosmetics.equipped.skin, "skin-neon", 'prestige debe conservar equipped');
})();

// 0d. deserialize sin cosmetics → defaults
(function testDeserializeDefaults() {
  const s = Game.createState();
  s.brains = 42;
  const saved = JSON.parse(JSON.stringify(s));
  delete saved.cosmetics;
  const loaded = Game.deserialize(saved);
  assert.ok(loaded.cosmetics, 'deserialize debe crear cosmetics');
  assert.ok(loaded.cosmetics.owned.indexOf("skin-classic") !== -1, 'owned debe incluir skin-classic');
  assert.strictEqual(loaded.cosmetics.equipped.skin, "skin-classic", 'equipped.skin default');
  assert.strictEqual(loaded.cosmetics.equipped.aura, "aura-none", 'equipped.aura default');
  assert.strictEqual(loaded.cosmetics.equipped.bg, "bg-void", 'equipped.bg default');
})();

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

// 4. buyUpgrade multi-nivel aplica perLevel y escala costo
(function testBuyUpgrade() {
  const s = Game.createState();
  const up = Game.UPGRADES[0];
  assert.strictEqual(up.type, 'click', 'el primer upgrade debe ser de tipo click');
  const before = Game.getClickValue(s);
  const cost1 = Game.getUpgradeCost(s, up.id);
  assert.strictEqual(cost1, up.baseCost, 'costo L0→L1 = baseCost');
  s.brains = cost1;
  const ok = Game.buyUpgrade(s, up.id);
  assert.strictEqual(ok, true, 'buyUpgrade debe devolver true si alcanza el costo');
  assert.strictEqual(Game.getUpgradeLevel(s, up.id), 1, 'nivel debe ser 1');
  assert.ok(approxEqual(Game.getClickValue(s), before * up.perLevel), 'perLevel L1 debe aplicarse al click');
  const cost2 = Game.getUpgradeCost(s, up.id);
  assert.strictEqual(cost2, Math.ceil(up.baseCost * Math.pow(up.costGrowth, 1)), 'costo debe escalar');
  s.brains = cost2;
  assert.strictEqual(Game.buyUpgrade(s, up.id), true, 'debe poder comprar nivel 2');
  assert.strictEqual(Game.getUpgradeLevel(s, up.id), 2, 'nivel debe ser 2');
  s.upgrades[up.id] = up.maxLevel;
  s.brains = 1e15;
  assert.strictEqual(Game.buyUpgrade(s, up.id), false, 'no se puede comprar past maxLevel');
  assert.strictEqual(Game.getUpgradeLevel(s, up.id), up.maxLevel, 'nivel queda en max');
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
  s.upgrades['dedos-podridos'] = 2;
  const text = Game.serialize(s);
  const s2 = Game.deserialize(text);
  assert.strictEqual(s2.brains, s.brains, 'brains debe sobrevivir al roundtrip');
  assert.strictEqual(s2.totalClicks, s.totalClicks, 'totalClicks debe sobrevivir al roundtrip');
  assert.strictEqual(s2.generators['superviviente'], 7, 'generators deben sobrevivir al roundtrip');
  assert.strictEqual(s2.upgrades['dedos-podridos'], 2, 'upgrades map debe sobrevivir al roundtrip');
  const bad = Game.deserialize('no es json');
  assert.strictEqual(bad.brains, 0, 'deserialize invalido debe devolver brains 0');
})();

// 6b. migrate upgrades array legacy → map nivel 1
(function testMigrateUpgradesArray() {
  const legacy = JSON.stringify({
    brains: 10,
    totalClicks: 0,
    totalBrainsEarned: 0,
    bestBps: 0,
    generators: {},
    upgrades: ['dedos-podridos', 'fuerza-sobrenatural'],
    achievements: [],
    prestige: { souls: 0, totalSoulsEarned: 0, upgrades: [] }
  });
  const s = Game.deserialize(legacy);
  assert.strictEqual(s.upgrades['dedos-podridos'], 1, 'array legacy → nivel 1');
  assert.strictEqual(s.upgrades['fuerza-sobrenatural'], 1, 'array legacy global → nivel 1');
  assert.strictEqual(Game.getUpgradeLevel(s, 'mandibula-filosa'), 0, 'no comprada = 0');
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
  s.upgrades[up.id] = 1;
  const after = Game.getGlobalMultiplier(s);
  assert.ok(after > before, 'el upgrade global debe aumentar el multiplicador');
  assert.ok(approxEqual(after, before + (up.perLevel - 1)), 'bonus global = (perLevel-1)*level');
})();

// 13. getGeneratorBps con upgrade de generador
(function testGeneratorBps() {
  const s = Game.createState();
  const up = Game.UPGRADES.find((u) => u.type === 'generator');
  assert.ok(up, 'debe existir un upgrade de generador');
  const before = Game.getGeneratorBps(s, up.generatorId);
  s.upgrades[up.id] = 1;
  const after = Game.getGeneratorBps(s, up.generatorId);
  assert.ok(approxEqual(after, before * up.perLevel), 'el upgrade de generador debe aumentar el bps');
})();

// 14. getClickValue con upgrades de click
(function testClickValue() {
  const s = Game.createState();
  const base = Game.getClickValue(s);
  const clickUps = Game.UPGRADES.filter((u) => u.type === 'click');
  for (const u of clickUps) s.upgrades[u.id] = 1;
  const after = Game.getClickValue(s);
  assert.ok(after > base, 'los upgrades de click deben aumentar el valor');
})();

// 15. estado inicial valido
(function testInitialState() {
  const s = Game.createState();
  assert.strictEqual(s.brains, 0, 'brains inicial 0');
  assert.strictEqual(s.totalBrainsEarned, 0, 'totalBrainsEarned inicial 0');
  assert.strictEqual(s.totalClicks, 0, 'totalClicks inicial 0');
  assert.strictEqual(typeof s.upgrades, 'object', 'upgrades es objeto');
  assert.strictEqual(Object.keys(s.upgrades).length, 0, 'upgrades inicial vacio');
  assert.strictEqual(s.achievements.length, 0, 'achievements inicial vacio');
  for (const g of Game.GENERATORS) {
    assert.strictEqual(s.generators[g.id], 0, 'generador inicial 0');
  }
})();

// 16. buyCosmetic gasta cerebros y marca owned
(function testBuyCosmetic() {
  const s = Game.createState();
  const cos = Game.COSMETICS.find((c) => c.id === 'skin-rot');
  assert.ok(cos, 'debe existir skin-rot en el catálogo');
  s.prestige.soulChips = cos.cost;
  const ok = Game.buyCosmetic(s, 'skin-rot');
  assert.strictEqual(ok, true, 'buyCosmetic debe devolver true si alcanza el costo');
  assert.strictEqual(s.prestige.soulChips, 0, 'debe descontar astillas');
  assert.ok(s.cosmetics.owned.indexOf('skin-rot') !== -1, 'debe marcar como owned');
  const again = Game.buyCosmetic(s, 'skin-rot');
  assert.strictEqual(again, false, 'no se puede comprar dos veces');
  const noFunds = Game.createState();
  assert.strictEqual(Game.buyCosmetic(noFunds, 'skin-rot'), false, 'sin fondos no se puede comprar');
})();

// 17. equipCosmetic requiere owned
(function testEquipCosmetic() {
  const s = Game.createState();
  assert.strictEqual(Game.equipCosmetic(s, 'skin-neon'), false, 'no se puede equipar sin owned');
  s.prestige.soulChips = 10;
  Game.buyCosmetic(s, 'skin-neon');
  const ok = Game.equipCosmetic(s, 'skin-neon');
  assert.strictEqual(ok, true, 'equipCosmetic debe devolver true si está owned');
  assert.strictEqual(s.cosmetics.equipped.skin, 'skin-neon', 'debe actualizar equipped.skin');
})();

// 18. prestige conserva cosmetics
(function testPrestigeKeepsCosmetics() {
  const s = Game.createState();
  s.prestige.soulChips = 5;
  Game.buyCosmetic(s, 'skin-rot');
  Game.equipCosmetic(s, 'skin-rot');
  s.totalBrainsEarned = 2000000;
  const ns = Game.prestige(s);
  assert.ok(ns.cosmetics.owned.indexOf('skin-rot') !== -1, 'prestige debe conservar owned');
  assert.strictEqual(ns.cosmetics.equipped.skin, 'skin-rot', 'prestige debe conservar equipped');
})();

// 19. deserialize sin cosmetics → defaults
(function testDeserializeCosmeticsDefault() {
  const s = Game.createState();
  s.brains = 10;
  const text = JSON.stringify({ brains: 10 });
  const s2 = Game.deserialize(text);
  assert.ok(s2.cosmetics, 'deserialize debe crear cosmetics');
  assert.ok(s2.cosmetics.owned.indexOf('skin-classic') !== -1, 'default owned incluye skin-classic');
  assert.strictEqual(s2.cosmetics.equipped.skin, 'skin-classic', 'default equipped skin');
  assert.strictEqual(s2.cosmetics.equipped.aura, 'aura-none', 'default equipped aura');
  assert.strictEqual(s2.cosmetics.equipped.bg, 'bg-void', 'default equipped bg');
})();

// 20. isValidDisplayName
(function testValidDisplayName() {
  assert.strictEqual(Game.isValidDisplayName('Ada'), true, 'Ada es válido');
  assert.strictEqual(Game.isValidDisplayName('Necro_King16'), true, 'underscore y números');
  assert.strictEqual(Game.isValidDisplayName('ab'), false, 'corto');
  assert.strictEqual(Game.isValidDisplayName('abcdefghijklmnopq'), false, 'largo');
  assert.strictEqual(Game.isValidDisplayName('Ada King'), false, 'espacios');
  assert.strictEqual(Game.isValidDisplayName('Adán'), false, 'unicode');
  assert.strictEqual(Game.isValidDisplayName(''), false, 'vacío');
  assert.strictEqual(Game.isValidDisplayName(null), false, 'null');
})();

// 21. isFreshState
(function testFreshState() {
  const fresh = Game.createState();
  assert.strictEqual(Game.isFreshState(fresh), true, 'createState es fresco');
  const clicked = Game.createState();
  Game.click(clicked);
  assert.strictEqual(Game.isFreshState(clicked), false, 'un click ya no es fresco');
  const souls = Game.createState();
  souls.prestige.totalSoulsEarned = 2;
  assert.strictEqual(Game.isFreshState(souls), false, 'almas totales no es fresco');
  assert.strictEqual(Game.isFreshState(null), true, 'null es fresco');
})();

// 22. pickPreferredSave
(function testPickPreferredSave() {
  const local = Game.createState();
  local.totalBrainsEarned = 100;
  local.totalClicks = 5;
  local.lastSaved = 1000;

  const noCloud = Game.pickPreferredSave(local, null);
  assert.strictEqual(noCloud.source, 'local', 'sin nube usa local');
  assert.strictEqual(noCloud.state, local);

  const cloudFresh = Game.createState();
  const vsFreshCloud = Game.pickPreferredSave(local, cloudFresh);
  assert.strictEqual(vsFreshCloud.source, 'local', 'nube fresca pierde contra local con progreso');

  const localFresh = Game.createState();
  const cloudProgress = Game.createState();
  cloudProgress.totalBrainsEarned = 50;
  cloudProgress.totalClicks = 3;
  const vsFreshLocal = Game.pickPreferredSave(localFresh, cloudProgress);
  assert.strictEqual(vsFreshLocal.source, 'cloud', 'local fresco pierde contra nube con cerebros');

  const localSouls = Game.createState();
  localSouls.totalBrainsEarned = 10;
  localSouls.prestige.totalSoulsEarned = 5;
  localSouls.lastSaved = 9000;
  const cloudBrains = Game.createState();
  cloudBrains.totalBrainsEarned = 999999;
  cloudBrains.prestige.totalSoulsEarned = 1;
  cloudBrains.lastSaved = 10000;
  const soulsWin = Game.pickPreferredSave(localSouls, cloudBrains);
  assert.strictEqual(soulsWin.source, 'local', 'más almas ganan aunque haya menos cerebros');

  const a = Game.createState();
  a.totalBrainsEarned = 100;
  a.prestige.totalSoulsEarned = 2;
  a.lastSaved = 100;
  const b = Game.createState();
  b.totalBrainsEarned = 100;
  b.prestige.totalSoulsEarned = 2;
  b.lastSaved = 200;
  const tie = Game.pickPreferredSave(a, b);
  assert.strictEqual(tie.source, 'cloud', 'empate almas+cerebros usa lastSaved');
})();

// 23. cloudStatsFromState
(function testCloudStatsFromState() {
  const s = Game.createState();
  s.totalBrainsEarned = 123.5;
  s.prestige.souls = 7;
  s.bestBps = 42;
  const stats = Game.cloudStatsFromState(s);
  assert.strictEqual(stats.total_brains_earned, 123.5);
  assert.strictEqual(stats.prestige_souls, 7);
  assert.strictEqual(stats.best_bps, 42);
  const empty = Game.cloudStatsFromState(null);
  assert.strictEqual(empty.total_brains_earned, 0);
  assert.strictEqual(empty.prestige_souls, 0);
  assert.strictEqual(empty.best_bps, 0);
})();

// 24. gastar chips no baja el nivel de almas
(function testChipsDoNotLowerLevel() {
  const s = Game.createState();
  s.prestige.totalSoulsEarned = 20;
  s.prestige.souls = 20;
  s.prestige.soulChips = 20;
  const levelBefore = Game.getSoulLevel(s);
  const multBefore = Game.getGlobalMultiplier(s);
  assert.strictEqual(Game.buyPrestigeUpgrade(s, 'bpsBoost'), true, 'debe poder comprar bpsBoost con chips');
  assert.strictEqual(Game.getSoulLevel(s), levelBefore, 'el nivel no debe bajar al gastar chips');
  assert.strictEqual(s.prestige.totalSoulsEarned, 20, 'totalSoulsEarned no baja');
  assert.ok(Game.getSoulChips(s) < 20, 'los chips deben bajar');
  assert.ok(Game.getGlobalMultiplier(s) >= multBefore, 'el multi de nivel no debe caer');
})();

// 25. clickBoost no es global / no sube BPS
(function testClickBoostNotGlobal() {
  const s = Game.createState();
  s.generators.superviviente = 10;
  const bpsBefore = Game.getBrainsPerSecond(s);
  const clickBefore = Game.getClickValue(s);
  const globalBefore = Game.getGlobalMultiplier(s);
  s.prestige.soulChips = 5;
  s.prestige.totalSoulsEarned = 0;
  assert.strictEqual(Game.buyPrestigeUpgrade(s, 'clickBoost'), true, 'compra clickBoost');
  assert.ok(approxEqual(Game.getBrainsPerSecond(s), bpsBefore), 'clickBoost no debe cambiar BPS');
  assert.ok(approxEqual(Game.getGlobalMultiplier(s), globalBefore), 'clickBoost no entra al multi global');
  assert.ok(Game.getClickValue(s) > clickBefore, 'clickBoost debe subir el click');
})();

// 26. fórmula prestige 1e9
(function testPrestigeFormula() {
  const s = Game.createState();
  s.totalBrainsEarned = 1e9 - 1;
  assert.strictEqual(Game.getPrestigeGain(s), 0, 'sin 1e9 no hay alma');
  s.totalBrainsEarned = 1e9;
  assert.strictEqual(Game.getPrestigeGain(s), 1, '1e9 cerebros = 1 alma');
  s.totalBrainsEarned = 4e9;
  assert.strictEqual(Game.getPrestigeGain(s), 2, '4e9 cerebros = 2 almas');
})();

// 27. prestige suma nivel y chips, no resetea huesos
(function testPrestigeSplitsAndKeepsBones() {
  const s = Game.createState();
  s.totalBrainsEarned = 1e9;
  s.bones = 3;
  s.prestige.totalSoulsEarned = 4;
  s.prestige.souls = 4;
  s.prestige.soulChips = 1;
  const ns = Game.prestige(s);
  assert.strictEqual(ns.prestige.totalSoulsEarned, 5, 'nivel 4+1');
  assert.strictEqual(ns.prestige.soulChips, 2, 'chips 1+1');
  assert.strictEqual(ns.bones, 3, 'huesos persisten');
  assert.strictEqual(ns.prestigeCount, 1, 'cuenta ascensiones');
  assert.strictEqual(ns.brains, 0, 'run reseteada');
})();

// 28. hitos duplican BPS del gen
(function testMilestones() {
  assert.strictEqual(Game.getMilestoneMultiplier(0), 1, '0 owned = x1');
  assert.strictEqual(Game.getMilestoneMultiplier(24), 1, '24 = x1');
  assert.strictEqual(Game.getMilestoneMultiplier(25), 2, '25 = x2');
  assert.strictEqual(Game.getMilestoneMultiplier(50), 4, '50 = x4');
  assert.strictEqual(Game.getMilestoneMultiplier(100), 8, '100 = x8');
  const s = Game.createState();
  s.generators.mordedor = 24;
  const low = Game.getGeneratorBps(s, 'mordedor');
  s.generators.mordedor = 25;
  const high = Game.getGeneratorBps(s, 'mordedor');
  assert.ok(approxEqual(high, low * 2), 'cruzar 25 duplica bps del gen');
})();

// 29. 15 generadores y upgrades de gens altos
(function testContentCounts() {
  assert.strictEqual(Game.GENERATORS.length, 15, '15 generadores');
  assert.ok(Game.ACHIEVEMENTS.length >= 40, 'al menos 40 logros');
  assert.ok(Game.UPGRADES.some((u) => u.generatorId === 'horde'), 'upgrade de horda');
  assert.ok(Game.UPGRADES.some((u) => u.generatorId === 'vacio-verdoso'), 'upgrade del vacío');
  assert.ok(Game.GENERATORS.some((g) => g.id === 'vacio-verdoso'), 'existe vacío verdoso');
})();

// 30. migración save viejo: souls gastables → chips, nivel = total
(function testLegacyPrestigeMigrate() {
  const loaded = Game.deserialize(JSON.stringify({
    brains: 10,
    prestige: { souls: 5, totalSoulsEarned: 14, upgrades: ['bpsBoost'] }
  }));
  assert.strictEqual(Game.getSoulLevel(loaded), 14, 'nivel desde totalSoulsEarned');
  assert.strictEqual(Game.getSoulChips(loaded), 5, 'chips desde souls viejas');
  assert.ok(loaded.prestige.upgrades.indexOf('bpsBoost') !== -1, 'upgrades prestige se conservan');
})();

// 31. eventos huesos
(function testEventDrops() {
  const s = Game.createState();
  const bone = Game.applyGoldenBrain(s, 0);
  assert.strictEqual(bone.type, 'bones', 'roll 0 da hueso');
  assert.strictEqual(s.bones, 1, 'bones += 1');
  const brains = Game.applyGoldenBrain(s, 0.5);
  assert.strictEqual(brains.type, 'brains', 'roll alto da cerebros');
  const kill = Game.applyBossKill(s);
  assert.ok(kill.brains >= 500, 'jefe da cerebros');
  assert.strictEqual(s.bones, 2, 'jefe da hueso');
  assert.ok(Game.getBossMaxHp(s) >= 15, 'HP mínimo 15');
})();

// 32. crit chance y hit ×10
(function testCrit() {
  const s = Game.createState();
  const crit = Game.UPGRADES.find((u) => u.type === 'crit');
  assert.ok(crit, 'debe existir upgrade crit');
  assert.strictEqual(Game.getCritChance(s), 0, 'sin crit chance = 0');
  s.upgrades[crit.id] = 2;
  assert.ok(approxEqual(Game.getCritChance(s), crit.perLevel * 2), 'crit chance = perLevel * level');
  const base = Game.getClickValue(s);
  Game._random = function () { return 0; }; // always crit
  const gained = Game.click(s);
  assert.ok(approxEqual(gained, base * 10), 'crit debe multiplicar click ×10');
  Game._random = function () { return 0.99; }; // never crit with 10% chance
  const gained2 = Game.click(s);
  assert.ok(approxEqual(gained2, Game.getClickValue(s)), 'sin crit debe dar click normal');
  Game._random = null;
})();

// 33. cheaper reduce costo de generadores
(function testCheaperUpgrade() {
  const s = Game.createState();
  const genId = 'jefe'; // baseCost alto para que el ceil no anule el descuento
  const before = Game.getGeneratorCost(s, genId);
  const cheap = Game.UPGRADES.find((u) => u.type === 'cheaper');
  assert.ok(cheap, 'debe existir upgrade cheaper');
  s.upgrades[cheap.id] = 1;
  const after = Game.getGeneratorCost(s, genId);
  assert.ok(after < before, 'cheaper debe bajar el costo');
  assert.strictEqual(after, Math.ceil(before * (1 - cheap.perLevel)), 'factor 0.95 en L1');
})();

// 34. catálogo con niveles + gen altos + crit/cheaper
(function testUpgradeCatalogSize() {
  assert.ok(Game.UPGRADES.length >= 16, 'debe haber al menos 16 upgrades');
  assert.ok(Game.UPGRADES.every((u) => u.maxLevel === 5 && u.costGrowth === 2.5), 'todas con niveles');
  assert.ok(Game.UPGRADES.some((u) => u.id === 'golpe-critico'), 'golpe-critico presente');
  assert.ok(Game.UPGRADES.some((u) => u.id === 'horde-voraz'), 'horde-voraz presente');
})();

console.log('Todos los tests pasaron correctamente.');
