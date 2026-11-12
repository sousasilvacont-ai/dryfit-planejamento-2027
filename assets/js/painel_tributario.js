/* Cálculos puros da simulação tributária 2027. Sem dependências externas. */
(() => {
  "use strict";

  const roundMoney = value => Math.round((value + Number.EPSILON * Math.max(1, Math.abs(value))) * 100) / 100;

  const bands = Object.freeze({
    I: Object.freeze([
      Object.freeze({ number: 1, ceiling: 180000, nominal: 0.04, deduction: 0 }),
      Object.freeze({ number: 2, ceiling: 360000, nominal: 0.073, deduction: 5940 }),
    ]),
    II: Object.freeze([
      Object.freeze({ number: 1, ceiling: 180000, nominal: 0.045, deduction: 0 }),
      Object.freeze({ number: 2, ceiling: 360000, nominal: 0.078, deduction: 5940 }),
    ]),
  });

  const hybridAssumptions = Object.freeze({
    cbsReferenceRate: 0.113,
    cbsRate: 0.112,
    ibsRate: 0.001,
    foodRateFactor: 0.4,
    annexIIConsumedShare: 0.14,
    annexIIResidualShare: 0.86,
    annexIConsumedShare: 0.155,
    annexIResidualShare: 0.845,
  });

  function calculate(monthlyRevenue, rbt12, annex = "II") {
    const monthly = Number(monthlyRevenue);
    const annual = Number(rbt12);
    const activity = String(annex).toUpperCase();
    const table = bands[activity];

    if (!table) throw new RangeError("Anexo deve ser I ou II.");

    if (!Number.isFinite(monthly) || monthly < 0) {
      throw new RangeError("A receita mensal deve ser um número não negativo.");
    }
    if (!Number.isFinite(annual) || annual <= 0 || annual > 360000) {
      throw new RangeError("A RBT12 deve ser maior que zero e não pode superar R$ 360.000 nesta simulação.");
    }

    const band = table.find((row) => annual <= row.ceiling) || table[table.length - 1];
    const effectiveRate = (annual * band.nominal - band.deduction) / annual;

    return Object.freeze({
      annex: activity,
      monthlyRevenue: monthly,
      rbt12: annual,
      band: band.number,
      nominalRate: band.nominal,
      deduction: band.deduction,
      effectiveRate,
      das: roundMoney(monthly * effectiveRate),
    });
  }

  function compare(monthlyRevenue, rbt12, options = {}) {
    if (options === null || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("As opções de comparação devem ser um objeto.");
    }
    const monthly = Number(monthlyRevenue);
    const foodReduction = options.foodReduction === undefined ? false : options.foodReduction;
    const creditShare = options.creditShare === undefined ? 0 : Number(options.creditShare);
    const selectedAnnex = options.annex === "I" ? "I" : "II";

    if (typeof foodReduction !== "boolean") {
      throw new TypeError("foodReduction deve ser true ou false.");
    }
    if (!Number.isFinite(creditShare) || creditShare < 0 || creditShare > 1) {
      throw new RangeError("creditShare deve estar entre zero e um.");
    }

    const fullDas = calculate(monthly, rbt12, selectedAnnex);
    const factor = options.zeroRate ? 0 : (foodReduction ? hybridAssumptions.foodRateFactor : 1);
    const cbsRate = hybridAssumptions.cbsRate * factor;
    const ibsRate = hybridAssumptions.ibsRate * factor;
    const regularGross = roundMoney(roundMoney(monthly * cbsRate) + roundMoney(monthly * ibsRate));
    const credits = roundMoney(regularGross * creditShare);
    const regularNet = roundMoney(Math.max(regularGross - credits, 0));
    const residualShare = selectedAnnex === "I" ? hybridAssumptions.annexIResidualShare : hybridAssumptions.annexIIResidualShare;
    const residualDas = roundMoney(fullDas.das * residualShare);
    const hybridWithoutCredits = roundMoney(residualDas + regularGross);
    const hybrid = roundMoney(residualDas + regularNet);
    const breakevenCredits = Math.max(hybridWithoutCredits - fullDas.das, 0);
    const breakevenShare = regularGross > 0 ? breakevenCredits / regularGross : 0;

    return Object.freeze({
      monthlyRevenue: monthly,
      rbt12: fullDas.rbt12,
      annex: selectedAnnex,
      band: fullDas.band,
      fullDas: fullDas.das,
      effectiveRate: fullDas.effectiveRate,
      foodReduction,
      foodRateFactor: factor,
      creditShare,
      cbsReferenceRate: hybridAssumptions.cbsReferenceRate,
      cbsRate,
      ibsRate,
      modeledRegularRate: cbsRate + ibsRate,
      regularGross,
      credits,
      regularNet,
      residualDas,
      hybridWithoutCredits,
      hybrid,
      differenceFromFullDas: roundMoney(hybrid - fullDas.das),
      breakevenCredits,
      breakevenShare,
      assumptions: hybridAssumptions,
      taxBaseAssumption: "Modelo ilustrativo com IBS/CBS calculados sobre a receita mensal integral; não ajusta a base por ICMS, IPI ou preço.",
    });
  }

  globalThis.Tributario2027 = Object.freeze({ calculate, compare, bands });

  if (typeof document === "undefined") return;
  const $ = id => document.getElementById(id);
  const ids = [
    'monthly','rbt','stable','custom','rbtWrap','reset',
    'activityAnnex1','activityAnnex2','annexContext',
    'standardProduct','foodProduct','zeroProduct',
    'monthValue','rbtValue','fullTotal','fullRate','hybridTotal','hybridRate',
    'fullDASshare','hybridBase','hybridRegular',
    'decisionTitle','decisionText','monthlyGap','scenarioLabel',
    'mobileFull','mobileHybrid','comparisonRows','fullBar','hybridBar',
    'cbsApplied','ibsApplied','cbsAmount','ibsAmount','reductionValue',
    'productsToggle','productsDialog','closeProducts','applyFoodBenefit'
  ];
  const ui = Object.fromEntries(ids.map(id => [id,$(id)]));
  if (Object.values(ui).some(el => !el)) return;

  const money = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  const percent = new Intl.NumberFormat('pt-BR',{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2});
  let custom = false, customInitialized = false, benefit = 'reduced', selectedProduct = 'Frutas secas sem adição de açúcar', currentAnnex = 'II';

  const options = () => ({
    annex: currentAnnex,
    foodReduction: benefit === 'reduced',
    zeroRate: benefit === 'zero',
    creditShare: 0
  });

  const text = (id,value) => { const el=$(id); if(el) el.textContent=value; };

  function setBase(useCustom){
    custom = useCustom;
    ui.rbtWrap.hidden = !custom;
    ui.stable.setAttribute('aria-pressed',String(!custom));
    ui.custom.setAttribute('aria-pressed',String(custom));
  }

  function setActivity(annex){
    currentAnnex = annex;
    ui.activityAnnex1.setAttribute('aria-pressed', String(annex === 'I'));
    ui.activityAnnex2.setAttribute('aria-pressed', String(annex === 'II'));
    text('annexContext', annex === 'I' ? 'Revenda · Anexo I' : 'Produção própria · Anexo II');
    const hint = $('activityHint');
    if (hint) {
      if (annex === 'I') {
        hint.innerHTML = '<strong>Revenda Varejista (Anexo I):</strong> Alíquota inicial de <strong>4,00%</strong> (R$ 120 / R$ 3 mil). Atividades de comércio já cadastradas no CNPJ.';
      } else {
        hint.innerHTML = '<strong>Produção Própria (Anexo II):</strong> Alíquota inicial de <strong>4,50%</strong> (R$ 135 / R$ 3 mil). Coberta pelo <strong>CNAE 1031-7/00</strong> cadastrado na Receita.';
      }
    }
    update();
  }

  function setBenefit(value,product){
    benefit = value;
    selectedProduct = product || (value === 'zero' ? 'Coco dessecado' : value === 'reduced' ? 'Frutas secas sem adição de açúcar' : 'Referência sem benefício');
    ui.standardProduct.setAttribute('aria-pressed', String(value === 'standard'));
    ui.foodProduct.setAttribute('aria-pressed', String(value === 'reduced'));
    ui.zeroProduct.setAttribute('aria-pressed', String(value === 'zero'));
    update();
  }

  function bar(el,total,max){
    const pct = Math.max(Math.min((total/max)*100, 100), 0);
    el.style.setProperty('--bar-pct', String(pct));
    el.style.setProperty('--bar-height', String(pct * 2.4));
    el.setAttribute('aria-label', money.format(total) + ' por mês');
  }

  function row(month){
    const r = compare(month, month*12, options());
    const tr = document.createElement('tr');
    [
      money.format(month),
      money.format(r.fullDas),
      money.format(r.hybrid),
      (r.differenceFromFullDas > 0 ? '+' : '') + money.format(r.differenceFromFullDas),
      percent.format(r.effectiveRate),
      percent.format(r.hybrid/month)
    ].forEach((v,i) => {
      const td = document.createElement(i===0?'th':'td');
      if(i===0) td.setAttribute('scope','row');
      td.textContent = v;
      tr.append(td);
    });
    return tr;
  }

  function update(){
    const month = Number(ui.monthly.value);
    const annual = custom ? Number(ui.rbt.value) : month * 12;
    let r;
    try {
      r = compare(month, annual, options());
    } catch(e) {
      text('inputError', e.message);
      $('inputError').hidden = false;
      return;
    }
    $('inputError').hidden = true;

    text('monthValue', money.format(month));
    text('rbtValue', money.format(annual));
    text('fullTotal', money.format(r.fullDas));
    text('fullRate', percent.format(r.effectiveRate));
    text('hybridTotal', money.format(r.hybrid));
    text('hybridRate', percent.format(r.hybrid/month));
    text('fullDASshare', money.format(r.fullDas));
    text('hybridBase', money.format(r.residualDas));
    text('hybridRegular', money.format(r.regularGross));
    text('mobileFull', money.format(r.fullDas));
    text('mobileHybrid', money.format(r.hybrid));

    text('cbsApplied', percent.format(r.cbsRate));
    text('ibsApplied', percent.format(r.ibsRate));
    text('cbsAmount', money.format(month * r.cbsRate) + ' / mês');
    text('ibsAmount', money.format(month * r.ibsRate) + ' / mês');
    text('reductionValue', benefit === 'zero' ? 'Alíquota Zero (0%)' : benefit === 'reduced' ? 'Redução de 60%' : 'Regra Geral');
    text('benefitProductHint', selectedProduct);
    text('taxTableMonthRef', money.format(month));
    text('taxTableActivityRef', currentAnnex === 'I' ? 'Revenda · Anexo I' : 'Produção · Anexo II');
    text('comparisonScenario', (currentAnnex === 'I' ? 'Revenda · Anexo I' : 'Produção · Anexo II') + ' · ' + (benefit === 'zero' ? 'Alíquota zero por fora' : benefit === 'reduced' ? 'Redução de 60% por fora' : 'Regra geral por fora'));
    text('planRevenue', money.format(month));
    text('planRetail', money.format(calculate(month, month * 12, 'I').das));
    text('planProduction', money.format(calculate(month, month * 12, 'II').das));

    const gap = r.differenceFromFullDas;
    text('monthlyGap', 'Diferença: ' + (gap > 0 ? '+' : '') + money.format(gap) + ' / mês');

    text('decisionTitle', 'Comparativo de Desembolso para a Dryfit');
    text('decisionText',
      currentAnnex === 'I'
        ? 'Revenda (Anexo I): DAS de ' + money.format(r.fullDas) + ' (' + percent.format(r.effectiveRate) + ') vs. ' + money.format(r.hybrid) + ' por fora.'
        : 'Produção Própria (Anexo II · CNAE 1031-7/00): DAS de ' + money.format(r.fullDas) + ' (' + percent.format(r.effectiveRate) + ') vs. ' + money.format(r.hybrid) + ' por fora.'
    );

    text('scenarioLabel', (currentAnnex === 'I' ? 'Revenda · Anexo I' : 'Produção · Anexo II') + ' · Bruto sem créditos · benefício só por fora');
    text('statusText', 'Simples integral: ' + money.format(r.fullDas) + '. Regime regular: ' + money.format(r.hybrid) + '. ' + selectedProduct + '.');

    const max = Math.max(r.fullDas, r.hybrid, 0.01);
    bar(ui.fullBar, r.fullDas, max);
    bar(ui.hybridBar, r.hybrid, max);

    ui.comparisonRows.replaceChildren(...[3000, 15000, 20000].map(row));
    renderTaxBreakdown(r);

    globalThis.TaxScenario = {
      full: r.fullDas,
      hybrid: r.hybrid,
      fullRate: r.effectiveRate,
      hybridRate: r.hybrid / month,
      annex: currentAnnex,
      residualDas: r.residualDas,
      residualRate: r.residualDas / month,
      cbsAmount: roundMoney(month * r.cbsRate),
      cbsRate: r.cbsRate,
      ibsAmount: roundMoney(month * r.ibsRate),
      ibsRate: r.ibsRate
    };
    window.dispatchEvent(new CustomEvent('tax:updated', { detail: globalThis.TaxScenario }));

    for (const input of [ui.monthly, ui.rbt]) {
      const fill = (Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100;
      input.style.setProperty('--fill', fill + '%');
    }
  }

  ui.monthly.addEventListener('input', update);
  ui.rbt.addEventListener('input', () => { customInitialized = true; update(); });
  ui.stable.addEventListener('click', () => { setBase(false); update(); });
  ui.custom.addEventListener('click', () => {
    if (!customInitialized) {
      ui.rbt.value = String(Number(ui.monthly.value) * 12);
      customInitialized = true;
    }
    setBase(true);
    update();
  });

  ui.activityAnnex1.addEventListener('click', () => setActivity('I'));
  ui.activityAnnex2.addEventListener('click', () => setActivity('II'));

  ui.standardProduct.addEventListener('click', () => setBenefit('standard'));
  ui.foodProduct.addEventListener('click', () => setBenefit('reduced'));
  ui.zeroProduct.addEventListener('click', () => setBenefit('zero'));

  ui.reset.addEventListener('click', () => {
    ui.monthly.value = '3000';
    ui.rbt.value = '36000';
    customInitialized = false;
    setBase(false);
    setActivity('II');
    setBenefit('reduced');
    ui.monthly.focus();
  });

  ui.productsToggle.addEventListener('click', () => ui.productsDialog.showModal());
  document.querySelectorAll('[data-open-products]').forEach(button => {
    button.addEventListener('click', () => ui.productsDialog.showModal());
  });
  ui.closeProducts.addEventListener('click', () => ui.productsDialog.close());
  ui.applyFoodBenefit.addEventListener('click', () => {
    setBenefit('reduced');
    ui.productsDialog.close();
    showSlide('tributacao');
    ui.monthly.scrollIntoView({ block: 'center', behavior: 'auto' });
  });

  document.querySelectorAll('[data-benefit]').forEach(button => {
    button.addEventListener('click', () => {
      setBenefit(button.dataset.benefit, button.dataset.product);
      ui.productsDialog.close();
      showSlide('tributacao');
      ui.monthly.scrollIntoView({ block: 'center', behavior: 'auto' });
    });
  });

  const slideIds = ['empresa','tributacao','tributos','alternativas','oportunidades','atuacao','legislacao'];
  const slideNames = [
    '1. Empresa & CNAEs',
    '2. Comparativo 3D',
    '3. Composição dos Tributos',
    '4. Impacto no Caixa',
    '5. Produtos e benefícios',
    '6. Planejamento 2027',
    '7. Legislação & Normas'
  ];
  let slideIndex = 0;

  function showSlide(id){
    const index = slideIds.indexOf(id);
    if (index < 0) return;
    slideIndex = index;
    slideIds.forEach((v, i) => {
      const el = $(v);
      if (el) el.hidden = (i !== index);
    });
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.hidden = (id !== 'tributacao');
    document.querySelectorAll('.section-nav a').forEach(a => {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    text('slideCount', (index + 1) + ' / ' + slideIds.length);
    text('slideTitle', slideNames[index]);
    $('prevSlide').disabled = (index === 0);
    $('nextSlide').disabled = (index === slideIds.length - 1);
    document.body.dataset.slide = id;
    if (window.location.hash !== '#' + id) {
      try { history.replaceState(null, '', '#' + id); } catch(e){}
    }
    window.dispatchEvent(new Event('resize'));
  }

  document.querySelectorAll('.section-nav a, .brand').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showSlide(link.getAttribute('href').slice(1));
    });
  });

  $('prevSlide').addEventListener('click', () => showSlide(slideIds[Math.max(0, slideIndex - 1)]));
  $('nextSlide').addEventListener('click', () => showSlide(slideIds[Math.min(slideIds.length - 1, slideIndex + 1)]));

  document.addEventListener('keydown', e => {
    if (document.querySelector('dialog[open]') || ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      $('nextSlide').click();
    }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      $('prevSlide').click();
    }
  });

  $('legalToggle').addEventListener('click', () => $('legalDialog').showModal());
  $('closeLegal').addEventListener('click', () => $('legalDialog').close());

  function apportioned(total, weights){
    const cents = Math.round(total * 100);
    const exact = weights.map(w => cents * w);
    const units = exact.map(Math.floor);
    let remainder = cents - units.reduce((a, b) => a + b, 0);
    const order = exact.map((v, i) => ({ i, f: v - units[i] })).sort((a, b) => b.f - a.f);
    for (let j = 0; j < remainder; j++) units[order[j % order.length].i]++;
    return units.map(v => v / 100);
  }

  function renderTaxBreakdown(r){
    const isAnnexI = (r.annex === 'I');
    const shares = isAnnexI
      ? [0.055, 0.035, 0.1533, 0.4150, 0.0000, 0.3400, 0.0017]
      : [0.055, 0.035, 0.1385, 0.3750, 0.0750, 0.3200, 0.0015];
    const names = ['IRPJ', 'CSLL', 'CBS', 'Previdência Patronal (CPP)', 'IPI', 'ICMS', 'IBS'];
    const values = apportioned(r.fullDas, shares);

    const otherWeights = isAnnexI
      ? [0.055, 0.035, 0.4150, 0.0000, 0.3400].map(v => v / 0.8450)
      : [0.055, 0.035, 0.3750, 0.0750, 0.3200].map(v => v / 0.8600);
    const otherNames = [0, 1, 3, 4, 5];
    const others = apportioned(r.residualDas, otherWeights);

    const regular = [...values];
    let oi = 0;
    for (let i = 0; i < 7; i++) {
      if (i === 2) regular[i] = roundMoney(r.monthlyRevenue * r.cbsRate);
      else if (i === 6) regular[i] = roundMoney(r.monthlyRevenue * r.ibsRate);
      else regular[i] = others[oi++];
    }

    const rate = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 4 });
    $('taxRows').replaceChildren(...names.map((name, i) => {
      const tr = document.createElement('tr');
      const isExternalTax = (i === 2 || i === 6);
      [
        name,
        rate.format(r.effectiveRate * shares[i]),
        money.format(values[i]),
        rate.format(isExternalTax ? (i === 2 ? r.cbsRate : r.ibsRate) : r.effectiveRate * shares[i]),
        money.format(regular[i]),
        isExternalTax ? 'Apuração regular fora do DAS' : 'Guia única DAS'
      ].forEach((value, j) => {
        const el = document.createElement(j === 0 ? 'th' : 'td');
        el.textContent = value;
        if (j === 0) el.setAttribute('scope', 'row');
        tr.append(el);
      });
      return tr;
    }));

    text('taxFullRate', percent.format(r.effectiveRate));
    text('taxFullAmount', money.format(r.fullDas));
    text('taxHybridRate', percent.format(r.hybrid / r.monthlyRevenue));
    text('taxHybridAmount', money.format(r.hybrid));
  }

  const initialSlide = (window.location.hash || '').replace('#', '');
  showSlide(slideIds.includes(initialSlide) ? initialSlide : 'empresa');
  window.addEventListener('hashchange', () => {
    const next = (window.location.hash || '').replace('#', '');
    if (slideIds.includes(next)) showSlide(next);
  });

  setBase(false);
  setActivity('II');
  setBenefit('reduced');
})();
