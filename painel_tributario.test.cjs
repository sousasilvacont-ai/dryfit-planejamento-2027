const assert = require('node:assert/strict');
require('./assets/js/painel_tributario.js');
const { calculate, compare } = globalThis.Tributario2027;

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
assert.throws(() => calculate(3000, 360001, 'I'), RangeError);
assert.throws(() => calculate(-1, 36000, 'II'), RangeError);
console.log('18 cenários conferidos: Anexos I/II, benefícios somente por fora, centavos e totais conciliados.');
