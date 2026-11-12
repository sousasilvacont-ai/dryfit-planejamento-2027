const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
require('./assets/js/painel_tributario.js');
const { calculate, compare } = globalThis.Tributario2027;
const html = readFileSync('index.html', 'utf8');
const presenter = readFileSync('assets/js/painel_tributario.js', 'utf8');

assert.match(html, /id="productCredit" type="range" min="0" max="100" step="1" value="0"/);
const slideOrder = [...html.matchAll(/<section id="([^"]+)"[^>]*data-slide/g)].map((match) => match[1]);
assert.deepEqual(slideOrder, ['empresa', 'atuacao', 'tributacao', 'alternativas', 'oportunidades', 'legislacao', 'tributos']);
assert.match(html, /Crédito estimado de IBS\/CBS/);
assert.match(html, /Mercadoria comprada sem nota fiscal idônea não gera crédito apropriável/);
assert.match(html, /não recebe o crédito integral/);
assert.match(html, /crédito limitado ao IBS\/CBS devido pelo fornecedor no Simples/);
assert.match(presenter, /creditPercent: Number\(ui\.productCredit\.value\)/);
assert.match(presenter, /const slideIds = \['empresa','atuacao','tributacao','alternativas','oportunidades','legislacao','tributos'\]/);
assert.match(presenter, /ui\.productCredit\.addEventListener\('input', update\)/);
assert.match(presenter, /ui\.productCredit\.value = '0'/);
assert.match(presenter, /text\('productCreditAmount', money\.format\(r\.credits\)\)/);

// Valores de referência: DAS integral, DAS remanescente, híbrido geral,
// híbrido com redução de 60% e híbrido com produto de alíquota zero.
const cases = [
  ['I', 3000, 120, 101.40, 440.40, 237, 101.40],
  ['I', 15000, 600, 507, 2202, 1185, 507],
  ['I', 20000, 965, 815.43, 3075.43, 1719.43, 815.43],
  ['II', 3000, 135, 116.10, 455.10, 251.70, 116.10],
  ['II', 15000, 675, 580.50, 2275.50, 1258.50, 580.50],
  ['II', 20000, 1065, 915.90, 3175.90, 1819.90, 915.90],
];
for (const [annex, month, das, residual, ...totals] of cases) {
  assert.equal(calculate(month, month * 12, annex).das, das);
  ['standard', 'reduced', 'zero'].forEach((benefit, i) => {
    const r = compare(month, month * 12, {
      annex, foodReduction: benefit === 'reduced', zeroRate: benefit === 'zero',
    });
    assert.equal(r.fullDas, das, 'O produto não altera o DAS integral');
    assert.equal(r.residualDas, residual);
    assert.equal(r.hybrid, totals[i]);
    assert.equal(Math.round(r.hybrid * 100), Math.round(r.residualDas * 100) + Math.round(r.regularGross * 100));
    assert.equal(r.credits, 0);
  });
}

const creditCases = [
  [0, 0, 135.60, 251.70],
  [50, 67.80, 67.80, 183.90],
  [100, 135.60, 0, 116.10],
];
for (const [creditPercent, credits, regularNet, hybrid] of creditCases) {
  const r = compare(3000, 36000, {
    annex: 'II', foodReduction: true, creditPercent,
  });
  assert.equal(r.creditPercent, creditPercent);
  assert.equal(r.credits, credits);
  assert.equal(r.regularNet, regularNet);
  assert.equal(r.hybrid, hybrid);
  assert.equal(r.fullDas, 135, 'O crédito não altera o DAS integral');
}
assert.throws(() => compare(3000, 36000, { creditPercent: -1 }), RangeError);
assert.throws(() => compare(3000, 36000, { creditPercent: 101 }), RangeError);
let creditMatrixCount = 0;
for (const [annex, month, das, residual] of cases) {
  for (const benefit of ['standard', 'reduced', 'zero']) {
    for (let creditPercent = 0; creditPercent <= 100; creditPercent++) {
      const r = compare(month, month * 12, {
        annex,
        foodReduction: benefit === 'reduced',
        zeroRate: benefit === 'zero',
        creditPercent,
      });
      assert.equal(r.fullDas, das);
      assert.equal(r.residualDas, residual);
      assert.equal(Math.round((r.credits + r.regularNet) * 100), Math.round(r.regularGross * 100));
      assert.equal(Math.round((r.cbsNet + r.ibsNet) * 100), Math.round(r.regularNet * 100));
      assert.equal(Math.round((r.residualDas + r.regularNet) * 100), Math.round(r.hybrid * 100));
      if (creditPercent === 0) assert.equal(r.credits, 0);
      if (creditPercent === 100) assert.equal(r.regularNet, 0);
      creditMatrixCount++;
    }
  }
}
assert.equal(creditMatrixCount, 1818);
assert.throws(() => calculate(3000, 360001, 'I'), RangeError);
assert.throws(() => calculate(-1, 36000, 'II'), RangeError);
console.log('18 cenários base, 3 percentuais explícitos e 1.818 combinações de crédito conferidos; valores e totais conciliados.');
