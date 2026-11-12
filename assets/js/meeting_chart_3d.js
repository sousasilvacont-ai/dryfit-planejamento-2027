/* WebGL enhancement for the meeting comparison. The HTML chart remains the no-WebGL fallback. */
(() => {
  "use strict";

  if (window.MeetingChart3D) return;

  const money = new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
  const percent = new Intl.NumberFormat("pt-BR", {
    style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2,
  });

  function parseMoney(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
    const text = String(value ?? "").replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
    if (!text) return NaN;
    const result = Number(text);
    return Number.isFinite(result) ? result : NaN;
  }

  function parseRate(value) {
    if (typeof value === "number") return value > 1 ? value / 100 : value;
    const parsed = parseFloat(String(value ?? "").replace(/[^\d,.-]/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed / 100 : 0;
  }

  function readDomState() {
    const byId = (id) => document.getElementById(id);
    const full = parseMoney(byId("fullTotal")?.textContent);
    const hybrid = parseMoney(byId("hybridTotal")?.textContent);
    const fullRate = parseRate(byId("fullRate")?.textContent);
    const hybridRate = parseRate(byId("hybridRate")?.textContent);
    const cbsRate = parseRate(byId("cbsApplied")?.textContent);
    const ibsRate = parseRate(byId("ibsApplied")?.textContent);
    return {
      full,
      hybrid,
      fullRate,
      hybridRate,
      residualDas: parseMoney(byId("hybridBase")?.textContent),
      residualRate: hybridRate - cbsRate - ibsRate,
      cbsAmount: parseMoney(byId("cbsAmount")?.textContent),
      cbsRate,
      ibsAmount: parseMoney(byId("ibsAmount")?.textContent),
      ibsRate,
      hybridRegular: parseMoney(byId("hybridRegular")?.textContent),
    };
  }

  function normalizeState(detail = {}) {
    const dom = readDomState();
    const number = (key, fallback) => {
      const raw = detail[key];
      const parsed = typeof raw === "number" ? raw : parseMoney(raw);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const rate = (key, fallback) => detail[key] === undefined ? fallback : parseRate(detail[key]);
    const full = number("full", dom.full);
    const hybrid = number("hybrid", dom.hybrid);
    const rawCbsAmount = number("cbsAmount", dom.cbsAmount);
    const rawIbsAmount = number("ibsAmount", dom.ibsAmount);
    const legacyRegular = number("hybridRegular", dom.hybridRegular);
    let cbsAmount = Number.isFinite(rawCbsAmount) ? Math.max(0, rawCbsAmount) : 0;
    let ibsAmount = Number.isFinite(rawIbsAmount) ? Math.max(0, rawIbsAmount) : 0;
    if (!Number.isFinite(rawCbsAmount) && Number.isFinite(legacyRegular)) {
      cbsAmount = Math.max(0, legacyRegular - ibsAmount);
    }
    if (!Number.isFinite(rawIbsAmount) && Number.isFinite(legacyRegular)) {
      ibsAmount = Math.max(0, legacyRegular - cbsAmount);
    }
    const cbsRate = rate("cbsRate", dom.cbsRate);
    const ibsRate = rate("ibsRate", dom.ibsRate);
    const hybridRegular = cbsAmount + ibsAmount;
    const hybridRate = rate("hybridRate", dom.hybridRate);
    const rawResidualDas = number("residualDas", dom.residualDas);
    const residualDas = Number.isFinite(rawResidualDas)
      ? Math.max(0, rawResidualDas)
      : Math.max(0, hybrid - hybridRegular);
    return {
      full,
      hybrid,
      fullRate: rate("fullRate", dom.fullRate),
      hybridRate,
      residualDas,
      residualRate: rate("residualRate", hybridRate - cbsRate - ibsRate),
      cbsAmount,
      cbsRate,
      ibsAmount,
      ibsRate,
      hybridRegular,
    };
  }

  function ensureStyles() {
    if (document.getElementById("meeting-chart-3d-styles")) return;
    const style = document.createElement("style");
    style.id = "meeting-chart-3d-styles";
    style.textContent = `
      .chart3d.has-webgl .meeting-3d-breakdown { display:block; }
      .meeting-3d-breakdown { display:none; box-sizing:border-box; width:100%; flex:0 0 auto; padding:0 8px 4px; color:#e5edf5; font:500 11px/1.3 'Segoe UI Variable',Aptos,system-ui,sans-serif; }
      .meeting-3d-breakdown-title { display:block; margin:0 0 5px; color:#d6c18e; font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
      .meeting-3d-breakdown-grid { display:grid; grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr); gap:8px; }
      .meeting-3d-breakdown-card { min-width:0; padding:7px 9px; border:1px solid #39516b; border-radius:5px; background:linear-gradient(120deg,#0b2039f2,#102743ed); }
      .meeting-3d-breakdown-card h4 { margin:0 0 5px; color:#f1e2bd; font-size:10px; font-weight:700; }
      .meeting-3d-breakdown-row { display:grid; grid-template-columns:minmax(0,1fr) auto auto; align-items:baseline; gap:5px; min-width:0; padding:2px 0; border-top:1px solid #ffffff16; }
      .meeting-3d-breakdown-label { display:flex; align-items:center; min-width:0; gap:5px; color:#d3dfeb; white-space:nowrap; }
      .meeting-3d-swatch { width:7px; height:7px; flex:0 0 7px; border-radius:1px; }
      .meeting-3d-breakdown-amount { color:#fff; font-size:10px; font-weight:700; white-space:nowrap; }
      .meeting-3d-breakdown-rate { color:#c6d2de; font-size:9px; white-space:nowrap; }
      .meeting-3d-readout { z-index:2; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; width:min(205px,44%); min-height:78px; padding:7px 9px; border:1px solid #4b8aa2; border-radius:5px; background:#081a34f2; color:#f6f8fb; font-family:'Segoe UI Variable',Aptos,system-ui,sans-serif; text-align:center; line-height:1.15; text-shadow:none; cursor:pointer; pointer-events:auto; }
      .meeting-3d-readout.hybrid { border-color:#b99752; }
      .meeting-3d-readout.compact { min-height:0; padding:3px 7px; }
      .meeting-3d-readout.compact .meeting-3d-readout-title { margin-bottom:2px; font-size:9px; }
      .meeting-3d-readout.compact .meeting-3d-rate { margin-top:2px; font-size:11px; }
      .meeting-3d-readout:focus-visible { outline:2px solid #f1d997; outline-offset:2px; }
      .meeting-3d-readout-title { display:block; margin-bottom:4px; color:#a9c9d8; font-size:10px; font-weight:650; }
      .meeting-3d-readout.hybrid .meeting-3d-readout-title { color:#ead6a9; }
      .meeting-3d-total { display:block; color:#fff; font-size:clamp(15px,1.55vw,22px); font-weight:750; letter-spacing:-.025em; white-space:nowrap; }
      .meeting-3d-per-month { display:block; margin-top:1px; color:#c6d2de; font-size:10px; font-weight:550; }
      .meeting-3d-rate { display:block; margin-top:3px; color:#d8c18a; font-size:12px; font-weight:700; }
      .meeting-3d-band-label { position:absolute; z-index:1; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; width:min(250px,34%); padding:4px 7px; transform:translate(-50%,-50%); border:0; border-radius:0; background:transparent; color:#fff; text-align:center; font:500 clamp(9px,.9vw,12px)/1.2 'Segoe UI Variable',Aptos,system-ui,sans-serif; text-shadow:0 1px 2px #06172b,0 0 5px #06172b; pointer-events:none; }
      .meeting-3d-band-label.residual { border-color:transparent; }
      .meeting-3d-band-label-title { color:#f1d791; font-size:clamp(8px,.75vw,10px); font-weight:700; }
      .meeting-3d-band-label-value { margin-top:2px; color:#fff; font-size:clamp(9px,.88vw,12px); font-weight:750; white-space:nowrap; }
      .meeting-3d-band-label-row { display:flex; justify-content:center; gap:5px; white-space:nowrap; }
      .meeting-3d-band-label-row + .meeting-3d-band-label-row { margin-top:3px; padding-top:3px; border-top:1px solid #ffffff35; }
      .meeting-3d-band-label-row span { color:#fff; font-size:clamp(8px,.75vw,10px); font-weight:700; }
      .meeting-3d-band-label-row strong { color:#fff; font-size:clamp(9px,.85vw,11px); font-weight:750; }
      .meeting-3d-band-label-row .cbs { color:#dfbb69; }
      .meeting-3d-band-label-row .ibs { color:#39cfb7; }
      .meeting-3d-band-label-row .cbs-value { color:#ffe9ae; }
      .meeting-3d-band-label-row .ibs-value { color:#b5fff0; }
      .meeting-3d-band-label.compact { padding:2px 4px; }
      .meeting-3d-band-label.compact .meeting-3d-band-label-row + .meeting-3d-band-label-row { margin-top:1px; padding-top:1px; }
      @media (max-width:580px) {
        .meeting-3d-breakdown-grid { grid-template-columns:minmax(0,1fr); gap:5px; }
        .meeting-3d-breakdown-card { padding:6px 8px; }
        .meeting-3d-breakdown-row { gap:7px; }
        .meeting-3d-breakdown-amount { font-size:10px; }
        .meeting-3d-band-label { width:34%; padding:4px 3px; }
        .meeting-3d-band-label-row { gap:3px; }
      }
    `;
    (document.head || document.documentElement).append(style);
  }

  function init() {
    const figure = document.querySelector("figure.chart3d");
    const fallback = figure?.querySelector(".columns");
    const three = window.THREE;
    if (!figure || !fallback || !three || !three.WebGLRenderer) return null;
    ensureStyles();

    const T = three;
    let renderer;
    let state = normalizeState(window.TaxScenario || {});
    let disposed = false;
    let frame = 0;
    let animating = false;
    let hovered = null;
    let selected = null;
    let pointerX = 0;
    let pointerY = 0;
    let resizeObserver;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const stage = document.createElement("div");
    stage.className = "meeting-3d-stage";
    stage.setAttribute("role", "group");
    stage.setAttribute("aria-label", "Gráfico tridimensional: comparação neutra entre Simples tradicional e IBS/CBS por fora");
    stage.style.cssText = "position:relative;width:100%;height:auto;min-height:0;flex:1 1 0;isolation:isolate;";

    const canvas = document.createElement("canvas");
    canvas.className = "meeting-3d-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "display:block;width:100%;height:100%;";
    stage.append(canvas);

    const overlays = document.createElement("div");
    overlays.className = "meeting-3d-labels";
    overlays.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";
    stage.append(overlays);

    figure.insertBefore(stage, fallback);

    const breakdown = document.createElement("section");
    breakdown.className = "meeting-3d-breakdown";
    breakdown.setAttribute("role", "group");
    breakdown.setAttribute("aria-label", "Composição mensal estimada por tributo");
    const breakdownTitle = document.createElement("span");
    breakdownTitle.className = "meeting-3d-breakdown-title";
    breakdownTitle.textContent = "Composição estimada";
    const breakdownGrid = document.createElement("div");
    breakdownGrid.className = "meeting-3d-breakdown-grid";
    breakdown.append(breakdownTitle, breakdownGrid);

    const breakdownRows = {};
    function addBreakdownCard(title, rows) {
      const card = document.createElement("div");
      card.className = "meeting-3d-breakdown-card";
      const heading = document.createElement("h4");
      heading.textContent = title;
      card.append(heading);
      for (const item of rows) {
        const row = document.createElement("div");
        row.className = "meeting-3d-breakdown-row";
        const label = document.createElement("span");
        label.className = "meeting-3d-breakdown-label";
        const swatch = document.createElement("i");
        swatch.className = "meeting-3d-swatch";
        swatch.style.background = item.color;
        const text = document.createElement("span");
        text.textContent = item.label;
        label.append(swatch, text);
        const amount = document.createElement("strong");
        amount.className = "meeting-3d-breakdown-amount";
        const rate = document.createElement("span");
        rate.className = "meeting-3d-breakdown-rate";
        row.append(label, amount, rate);
        card.append(row);
        breakdownRows[item.key] = { amount, rate };
      }
      breakdownGrid.append(card);
    }

    addBreakdownCard("Simples tradicional", [
      { key: "full", label: "DAS integral", color: "#24a6cf" },
    ]);
    addBreakdownCard("IBS/CBS por fora", [
      { key: "residual", label: "DAS residual", color: "#2878a8" },
      { key: "cbs", label: "CBS", color: "#dfbb69" },
      { key: "ibs", label: "IBS", color: "#39cfb7" },
    ]);
    figure.insertBefore(breakdown, fallback);

    const labels = {};
    const scenarios = [
      { key: "full", group: "integral", title: "Simples tradicional", color: "#24a6cf", x: -2.6 },
      { key: "hybrid", group: "hybrid", title: "IBS/CBS por fora", color: "#dfbb69", x: 2.6 },
    ];

    for (const item of scenarios) {
      const readout = document.createElement("button");
      readout.type = "button";
      readout.className = `meeting-3d-readout ${item.group}`;
      readout.setAttribute("aria-pressed", "false");
      readout.style.cssText = "position:absolute;left:0;top:0;transform:translate(-50%,-50%);";
      const title = document.createElement("span");
      title.className = "meeting-3d-readout-title";
      title.textContent = item.title;
      const total = document.createElement("strong");
      total.className = "meeting-3d-total";
      const perMonth = document.createElement("span");
      perMonth.textContent = "/ mês";
      perMonth.className = "meeting-3d-per-month";
      const rate = document.createElement("span");
      rate.className = "meeting-3d-rate";
      readout.append(title, total, perMonth, rate);
      readout.addEventListener("click", () => setSelection(item.key));
      overlays.append(readout);
      labels[item.key] = { readout, total, perMonth, rate };
    }

    function createBandLabel(className, titleText) {
      const label = document.createElement("div");
      label.className = `meeting-3d-band-label ${className}`;
      label.setAttribute("aria-hidden", "true");
      const title = document.createElement("span");
      title.className = "meeting-3d-band-label-title";
      title.textContent = titleText;
      label.append(title);
      overlays.append(label);
      return { label, title };
    }

    const residualBandLabel = createBandLabel("residual", "DAS residual");
    residualBandLabel.value = document.createElement("strong");
    residualBandLabel.value.className = "meeting-3d-band-label-value";
    residualBandLabel.label.append(residualBandLabel.value);

    const externalBandLabel = createBandLabel("external", "Apuração regular por fora");
    const cbsRow = document.createElement("div");
    cbsRow.className = "meeting-3d-band-label-row";
    const cbsName = document.createElement("span");
    cbsName.className = "cbs";
    cbsName.textContent = "CBS";
    const cbsValue = document.createElement("strong");
    cbsValue.className = "cbs-value";
    cbsRow.append(cbsName, cbsValue);
    const ibsRow = document.createElement("div");
    ibsRow.className = "meeting-3d-band-label-row";
    const ibsName = document.createElement("span");
    ibsName.className = "ibs";
    ibsName.textContent = "IBS";
    const ibsValue = document.createElement("strong");
    ibsValue.className = "ibs-value";
    ibsRow.append(ibsName, ibsValue);
    externalBandLabel.label.append(cbsRow, ibsRow);

    const scene = new T.Scene();
    const camera = new T.OrthographicCamera(-4.8, 4.8, 2.0, -2.0, 0.1, 80);
    const target = new T.Vector3(0, 1.55, 0);
    camera.position.set(0, 5.3, 13.5);
    camera.lookAt(target);

    try {
      renderer = new T.WebGLRenderer({
        canvas, alpha: true, antialias: true, powerPreference: "low-power", preserveDrawingBuffer: false,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFShadowMap;
    } catch {
      stage.remove();
      return null;
    }

    const makeEnvironment = () => {
      const colors = ["#254463", "#091a31", "#16334e", "#0c2037", "#d7e7f1", "#102640"];
      const faces = colors.map((color, index) => {
        const face = document.createElement("canvas");
        face.width = 256;
        face.height = 256;
        const context = face.getContext("2d");
        context.fillStyle = color;
        context.fillRect(0, 0, 256, 256);
        context.globalAlpha = index === 4 ? .9 : .55;
        context.fillStyle = index === 4 ? "#fff5db" : "#91cde0";
        context.fillRect(index % 2 ? 166 : 26, 34, 48, 188);
        context.globalAlpha = .3;
        context.fillStyle = "#ffffff";
        context.fillRect(35, 74, 186, 10);
        return face;
      });
      const cube = new T.CubeTexture(faces);
      cube.mapping = T.CubeReflectionMapping;
      cube.colorSpace = T.SRGBColorSpace;
      cube.needsUpdate = true;
      return cube;
    };

    const environment = makeEnvironment();
    const blueMaterial = new T.MeshPhysicalMaterial({
      color: 0x24a6cf, metalness: .42, roughness: .31, clearcoat: .62, clearcoatRoughness: .24,
      envMap: environment, envMapIntensity: .92, emissive: 0x03202c, emissiveIntensity: .05,
    });
    const goldMaterial = new T.MeshPhysicalMaterial({
      color: 0xdfbb69, metalness: .42, roughness: .3, clearcoat: .58, clearcoatRoughness: .22,
      envMap: environment, envMapIntensity: .9, emissive: 0x261704, emissiveIntensity: .045,
    });
    const residualMaterial = new T.MeshPhysicalMaterial({
      color: 0x2878a8, metalness: .25, roughness: .42, clearcoat: .42, clearcoatRoughness: .28,
      envMap: environment, envMapIntensity: .7, emissive: 0x061923, emissiveIntensity: .04,
    });
    const ibsMaterial = new T.MeshPhysicalMaterial({
      color: 0x39cfb7, metalness: .22, roughness: .34, clearcoat: .52, clearcoatRoughness: .24,
      envMap: environment, envMapIntensity: .78, emissive: 0x06251f, emissiveIntensity: .045,
    });
    const dividerMaterial = new T.MeshStandardMaterial({ color: 0xe5edf1, metalness: .12, roughness: .42 });
    const podiumMaterial = new T.MeshPhysicalMaterial({
      color: 0x102746, metalness: .72, roughness: .28, clearcoat: .72, clearcoatRoughness: .24,
      envMap: environment, envMapIntensity: 1.05,
    });
    const trimMaterial = new T.MeshStandardMaterial({ color: 0x8b6d36, metalness: .68, roughness: .3, envMap: environment, envMapIntensity: .8 });

    scene.add(new T.HemisphereLight(0xdde9f0, 0x071327, 1.55));
    const keyLight = new T.DirectionalLight(0xfff3d6, 2.65);
    keyLight.position.set(-3.5, 8, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.normalBias = .025;
    keyLight.shadow.bias = -.00018;
    keyLight.shadow.radius = 5;
    scene.add(keyLight);
    const blueFill = new T.PointLight(0x42b9dc, 100, 13, 2);
    blueFill.position.set(-4.2, 3.2, 4);
    scene.add(blueFill);
    const goldFill = new T.PointLight(0xffd98c, 115, 13, 2);
    goldFill.position.set(4, 4.2, 2.5);
    scene.add(goldFill);
    const rim = new T.PointLight(0x4287b4, 70, 14, 2);
    rim.position.set(0, 5, -4);
    scene.add(rim);

    const softFloor = new T.Mesh(
      new T.PlaneGeometry(18, 14),
      new T.ShadowMaterial({ color: 0x000000, opacity: .12, depthWrite: false }),
    );
    softFloor.rotation.x = -Math.PI / 2;
    softFloor.position.y = -.22;
    softFloor.receiveShadow = true;
    scene.add(softFloor);

    function roundedBlockGeometry(width, height, depth, bevel = .065) {
      const radius = Math.min(bevel, width * .12, height * .18);
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      const shape = new T.Shape();
      shape.moveTo(-halfWidth + radius, -halfHeight);
      shape.lineTo(halfWidth - radius, -halfHeight);
      shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
      shape.lineTo(halfWidth, halfHeight - radius);
      shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
      shape.lineTo(-halfWidth + radius, halfHeight);
      shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
      shape.lineTo(-halfWidth, -halfHeight + radius);
      shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);
      const geometry = new T.ExtrudeGeometry(shape, {
        depth, steps: 1, curveSegments: 5, bevelEnabled: true, bevelSegments: 3,
        bevelThickness: Math.min(bevel * .45, .035), bevelSize: Math.min(bevel, .055), bevelOffset: 0,
      });
      geometry.translate(0, 0, -depth / 2);
      geometry.computeVertexNormals();
      return geometry;
    }

    const podium = new T.Group();
    scene.add(podium);
    const base = new T.Mesh(roundedBlockGeometry(9.2, .34, 2.1, .075), podiumMaterial);
    base.position.y = -.015;
    base.castShadow = true;
    base.receiveShadow = true;
    podium.add(base);
    const topTrim = new T.Mesh(new T.BoxGeometry(8.95, .027, .028), trimMaterial);
    topTrim.position.set(0, .172, 1.06);
    podium.add(topTrim);
    const feet = new T.Mesh(roundedBlockGeometry(8.6, .12, 1.8, .035), podiumMaterial);
    feet.position.y = -.22;
    feet.castShadow = true;
    podium.add(feet);

    const podiumTop = .18;
    const models = {};
    const barWidth = 3.25;
    const barDepth = 1.15;
    const unitGeometry = roundedBlockGeometry(barWidth, 1, barDepth, .045);
    const dividerGeometry = new T.BoxGeometry(barWidth + .05, .018, .018);

    for (const item of scenarios) {
      const group = new T.Group();
      group.position.x = item.x;
      scene.add(group);
      const segmentMaterials = [
        (item.key === "hybrid" ? residualMaterial : blueMaterial).clone(),
        goldMaterial.clone(),
        ibsMaterial.clone(),
      ];
      const segments = segmentMaterials.map((material) => new T.Mesh(unitGeometry, material));
      for (const mesh of segments) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.scenario = item.key;
        group.add(mesh);
      }
      const dividers = item.key === "hybrid"
        ? [new T.Mesh(dividerGeometry, dividerMaterial), new T.Mesh(dividerGeometry, dividerMaterial)]
        : [];
      for (const divider of dividers) {
        divider.visible = false;
        divider.castShadow = false;
        divider.receiveShadow = false;
        divider.userData.scenario = item.key;
        group.add(divider);
      }
      models[item.key] = {
        ...item, group, segments, dividers, materials: segmentMaterials, height: 0,
      };
    }

    const raycaster = new T.Raycaster();
    const pointer = new T.Vector2();
    const selectableMeshes = Object.values(models).flatMap((model) => [...model.segments, ...model.dividers]);
    let startTime = 0;
    let startHeights = { full: 0, hybrid: 0 };
    let targetHeights = { full: 0, hybrid: 0 };
    let labelLayoutWidth = -1;
    let labelLayoutHeight = -1;

    function updateLabels() {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      camera.updateMatrixWorld(true);
      for (const model of Object.values(models)) {
        const modelState = state[model.key];
        const totalPoint = new T.Vector3(model.group.position.x, podiumTop + model.height + .48, barDepth / 2 + .045);
        totalPoint.project(camera);
        const readout = labels[model.key].readout;
        readout.style.left = `${(totalPoint.x * .5 + .5) * rect.width}px`;
        const projectedY = (-totalPoint.y * .5 + .5) * rect.height;
        readout.style.top = `${Math.max(42, Math.min(rect.height - 42, projectedY))}px`;
        labels[model.key].total.textContent = money.format(modelState);
        labels[model.key].rate.textContent = percent.format(state[`${model.key}Rate`] || 0);
        readout.setAttribute("aria-label", `${model.title}: ${money.format(modelState)} por mês, alíquota ${percent.format(state[`${model.key}Rate`] || 0)}`);
        readout.setAttribute("aria-pressed", String(selected === model.key));
      }
      for (const [key, row] of Object.entries(breakdownRows)) {
        const amountKey = key === "full" ? "full" : key === "residual" ? "residualDas" : `${key}Amount`;
        const rateKey = key === "full" ? "fullRate" : key === "residual" ? "residualRate" : `${key}Rate`;
        row.amount.textContent = money.format(state[amountKey] || 0);
        row.rate.textContent = percent.format(state[rateKey] || 0);
      }

      const hybridModel = models.hybrid;
      const componentTotal = state.residualDas + state.cbsAmount + state.ibsAmount;
      const residualHeight = componentTotal > 0 ? hybridModel.height * state.residualDas / componentTotal : 0;
      const cbsHeight = componentTotal > 0 ? hybridModel.height * state.cbsAmount / componentTotal : 0;
      const ibsHeight = componentTotal > 0 ? hybridModel.height * state.ibsAmount / componentTotal : 0;
      const projectBandPoint = (element, y) => {
        const point = new T.Vector3(hybridModel.group.position.x, y, barDepth / 2 + .08);
        point.project(camera);
        element.style.left = `${(point.x * .5 + .5) * rect.width}px`;
        const top = (-point.y * .5 + .5) * rect.height;
        element.style.top = `${top}px`;
        return top;
      };

      residualBandLabel.label.style.display = residualHeight > 0 ? "flex" : "none";
      residualBandLabel.value.textContent = `${percent.format(state.residualRate)} · ${money.format(state.residualDas)}`;
      if (residualHeight > 0) projectBandPoint(residualBandLabel.label, podiumTop + residualHeight / 2);

      const externalAmount = state.cbsAmount + state.ibsAmount;
      externalBandLabel.label.style.display = externalAmount > 0 ? "flex" : "none";
      cbsValue.textContent = `${percent.format(state.cbsRate)} · ${money.format(state.cbsAmount)}`;
      ibsValue.textContent = `${percent.format(state.ibsRate)} · ${money.format(state.ibsAmount)}`;
      if (externalAmount > 0) {
        const regularMidpoint = state.cbsAmount > 0
          ? podiumTop + residualHeight + cbsHeight / 2
          : podiumTop + residualHeight + cbsHeight + ibsHeight / 2;
        const projectedCenter = projectBandPoint(externalBandLabel.label, regularMidpoint);
        const layoutChanged = rect.width !== labelLayoutWidth || rect.height !== labelLayoutHeight;
        if (layoutChanged) {
          labelLayoutWidth = rect.width;
          labelLayoutHeight = rect.height;
          labels.hybrid.readout.classList.remove("compact");
          labels.hybrid.perMonth.hidden = false;
          externalBandLabel.label.classList.remove("compact");
        }
        const positionWithoutOverlap = () => {
          const stageBounds = stage.getBoundingClientRect();
          const totalBounds = labels.hybrid.readout.getBoundingClientRect();
          const regularBounds = externalBandLabel.label.getBoundingClientRect();
          const residualBounds = residualBandLabel.label.getBoundingClientRect();
          const halfHeight = regularBounds.height / 2;
          const minCenter = totalBounds.bottom - stageBounds.top + 6 + halfHeight;
          const maxCenter = residualBounds.top - stageBounds.top - 6 - halfHeight;
          const minInsideStage = halfHeight + 4;
          const maxInsideStage = stageBounds.height - halfHeight - 4;
          const lower = Math.max(minCenter, minInsideStage);
          const upper = Math.min(maxCenter, maxInsideStage);
          if (lower > upper) return false;
          const center = Math.max(lower, Math.min(upper, projectedCenter));
          externalBandLabel.label.style.top = `${center}px`;
          return true;
        };

        if (!positionWithoutOverlap()) {
          labels.hybrid.readout.classList.add("compact");
          labels.hybrid.perMonth.hidden = true;
          externalBandLabel.label.classList.add("compact");
          positionWithoutOverlap();
        }
      }
    }

    function sizeCamera() {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const aspect = rect.width / rect.height;
      const viewHeight = aspect < 1.18 ? 5.5 : 3.9;
      const viewWidth = Math.max(9.3, viewHeight * aspect);
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.position.set(1.6 + pointerX * .1, aspect < 1.18 ? 6.4 : 5.3, aspect < 1.18 ? 15.6 : 13.5);
      camera.lookAt(pointerX * .035, target.y + pointerY * .025, 0);
      camera.updateProjectionMatrix();
      updateLabels();
      render();
    }

    function render() {
      if (disposed || !renderer) return;
      renderer.render(scene, camera);
    }

    function requestRender() {
      if (disposed || frame) return;
      frame = window.requestAnimationFrame((time) => {
        frame = 0;
        if (animating) animate(time);
        else render();
      });
    }

    function setBarHeight(model, totalHeight, ratios) {
      model.height = totalHeight;
      let cursor = podiumTop;
      for (let index = 0; index < model.segments.length; index++) {
        const segment = model.segments[index];
        const ratio = Math.max(0, Math.min(1, ratios[index] || 0));
        const height = totalHeight * ratio;
        segment.visible = height > .0001;
        segment.scale.y = height;
        segment.position.y = cursor + height / 2;
        cursor += height;
        const divider = model.dividers[index];
        if (divider) {
          divider.visible = height > .0001 && (ratios[index + 1] || 0) > 0;
          divider.position.set(0, cursor, barDepth / 2 + .01);
        }
      }
      model.group.scale.set(selected === model.key || hovered === model.key ? 1.012 : 1, 1, selected === model.key || hovered === model.key ? 1.012 : 1);
    }

    function applyHeights(progress) {
      const componentTotal = state.residualDas + state.cbsAmount + state.ibsAmount;
      for (const model of Object.values(models)) {
        const from = startHeights[model.key];
        const to = targetHeights[model.key];
        const height = from + (to - from) * progress;
        const ratios = model.key === "full" || componentTotal <= 0
          ? [1, 0, 0]
          : [state.residualDas, state.cbsAmount, state.ibsAmount].map((amount) => amount / componentTotal);
        setBarHeight(model, height, ratios);
      }
      updateLabels();
    }

    function animate(time) {
      if (!startTime) startTime = time;
      const raw = Math.min(1, (time - startTime) / (reducedMotion ? 0 : 380));
      const eased = 1 - Math.pow(1 - raw, 3);
      applyHeights(eased);
      render();
      if (raw < 1) frame = window.requestAnimationFrame(animate);
      else {
        frame = 0;
        animating = false;
      }
    }

    function update(detail = {}) {
      const next = normalizeState(detail);
      if (!Number.isFinite(next.full) || !Number.isFinite(next.hybrid)) return;
      startHeights = { full: models.full.height, hybrid: models.hybrid.height };
      state = next;
      const maximum = Math.max(state.full, state.hybrid, .01);
      targetHeights = {
        full: 3.05 * Math.max(0, state.full) / maximum,
        hybrid: 3.05 * Math.max(0, state.hybrid) / maximum,
      };
      startTime = 0;
      animating = !reducedMotion;
      if (reducedMotion) {
        applyHeights(1);
        render();
      } else requestRender();
    }

    function setSelection(key) {
      selected = selected === key ? null : key;
      for (const model of Object.values(models)) {
        const active = selected === model.key || hovered === model.key;
        model.group.scale.set(active ? 1.012 : 1, 1, active ? 1.012 : 1);
        for (const segment of model.segments) segment.material.emissiveIntensity = active ? .2 : .07;
      }
      for (const scenario of scenarios) labels[scenario.key].readout.setAttribute("aria-pressed", String(selected === scenario.key));
      requestRender();
    }

    function handlePointerMove(event) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
      const aspect = rect.width / rect.height;
      camera.position.x = 1.6 + pointerX * .1;
      camera.position.y = (aspect < 1.18 ? 6.4 : 5.3) + pointerY * .05;
      camera.lookAt(pointerX * .035, target.y + pointerY * .025, 0);
      camera.updateProjectionMatrix();

      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height * 2 - 1));
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(selectableMeshes, false)[0];
      const nextHovered = hit?.object?.userData?.scenario || null;
      if (nextHovered !== hovered) {
        hovered = nextHovered;
        for (const model of Object.values(models)) {
          const active = selected === model.key || hovered === model.key;
          model.group.scale.set(active ? 1.012 : 1, 1, active ? 1.012 : 1);
          for (const segment of model.segments) segment.material.emissiveIntensity = active ? .2 : .07;
        }
      }
      updateLabels();
      requestRender();
    }

    function handleCanvasClick(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height * 2 - 1));
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(selectableMeshes, false)[0];
      if (hit?.object?.userData?.scenario) setSelection(hit.object.userData.scenario);
    }

    function resetPointer() {
      pointerX = 0;
      pointerY = 0;
      hovered = null;
      sizeCamera();
    }

    canvas.addEventListener("pointermove", handlePointerMove, { passive: true });
    canvas.addEventListener("pointerleave", resetPointer, { passive: true });
    canvas.addEventListener("click", handleCanvasClick);

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(rect.width, rect.height, false);
      sizeCamera();
    };
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(stage);
    }
    window.addEventListener("resize", resize, { passive: true });

    function cleanup() {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      renderer?.dispose();
      environment?.dispose();
      scene.traverse((node) => {
        if (node.geometry && node.geometry !== unitGeometry && node.geometry !== dividerGeometry) node.geometry.dispose();
      });
      unitGeometry.dispose();
      dividerGeometry.dispose();
      for (const model of Object.values(models)) {
        for (const material of model.materials) material.dispose();
      }
      blueMaterial.dispose();
      goldMaterial.dispose();
      residualMaterial.dispose();
      ibsMaterial.dispose();
      dividerMaterial.dispose();
      podiumMaterial.dispose();
      trimMaterial.dispose();
      figure.classList.remove("has-webgl");
      fallback.hidden = false;
      const floor = figure.querySelector(".chart-floor");
      if (floor) floor.hidden = false;
      stage.remove();
    }

    window.addEventListener("pagehide", cleanup, { once: true });
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      cleanup();
    }, { once: true });

    try {
      resize();
      update(window.TaxScenario || {});
      if (!Number.isFinite(state.full) || !Number.isFinite(state.hybrid)) throw new Error("No comparison values");
      render();
      figure.classList.add("has-webgl");
      fallback.hidden = true;
      const floor = figure.querySelector(".chart-floor");
      if (floor) floor.hidden = true;
      stage.style.opacity = "1";
      return Object.freeze({ update, dispose: cleanup });
    } catch {
      cleanup();
      return null;
    }
  }

  let api = null;
  const pending = [];
  function update(detail) {
    if (api) api.update(detail || {});
    else pending.push(detail || {});
  }

  window.addEventListener("tax:updated", (event) => update(event.detail), { passive: true });
  window.MeetingChart3D = Object.freeze({ update });

  function start() {
    api = init();
    if (!api) return;
    for (const detail of pending.splice(0)) api.update(detail);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
