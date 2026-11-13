/* 广州造船厂技工学校电工线路连接模拟器 · 模拟引擎与交互 */
(() => {
  "use strict";

  const V0 = 220; // 电源电压（相对值）
  const CIRCUITS = window.CIRCUITS || [];
  const CATS = [
    { id: "light", name: "照明电路", icon: "💡", desc: "开关 · 串联 · 并联 · 双控三控" },
    { id: "practical", name: "实用电路", icon: "🔌", desc: "日光灯 · 电度表 · 熔断器 · 门铃" },
    { id: "motor", name: "电动机控制", icon: "⚙️", desc: "点动 · 自锁 · 正反转 · 星三角 · 双速" }
  ];

  // ================= 元件规格 =================
  // terminals: 端子（相对锚点偏移）；loads: 内部负载（电阻Ω）；shorts: 内部直连
  const SPECS = {
    live:   { label: "火线", terminals: [{ name: "a", dx: 0, dy: 0 }],
              draw: () => `<text x="-26" y="4" text-anchor="end" font-size="15" font-weight="800" fill="#dc2626">L</text><text x="-26" y="19" text-anchor="end" font-size="10" fill="#6b7688">火线</text><line x1="-18" y1="0" x2="2" y2="0" stroke="#334155" stroke-width="2.5"/>` },
    neutral:{ label: "零线", terminals: [{ name: "a", dx: 0, dy: 0 }],
              draw: () => `<text x="-26" y="4" text-anchor="end" font-size="15" font-weight="800" fill="#2563eb">N</text><text x="-26" y="19" text-anchor="end" font-size="10" fill="#6b7688">零线</text><line x1="-18" y1="0" x2="2" y2="0" stroke="#334155" stroke-width="2.5"/>` },
    switch: { label: "开关", terminals: [{ name: "a", dx: -44, dy: 0 }, { name: "b", dx: 44, dy: 0 }],
              draw: (c, s) => {
                const closed = s === "closed";
                return `<line x1="-44" y1="0" x2="-22" y2="0" stroke="#334155" stroke-width="2.5"/><line x1="22" y1="0" x2="44" y2="0" stroke="#334155" stroke-width="2.5"/>
                  <circle cx="-22" cy="0" r="3" fill="#334155"/><circle cx="22" cy="0" r="3" fill="#334155"/>
                  ${closed ? `<line x1="-22" y1="0" x2="22" y2="0" stroke="#2563eb" stroke-width="2.5"/>` : `<line x1="-22" y1="0" x2="6" y2="-20" stroke="#2563eb" stroke-width="2.5"/>`}
                  <text x="0" y="24" text-anchor="middle" font-size="11" font-weight="600" fill="#1a2433">${c.label || c.id}</text>`;
              } },
    switch3:{ label: "双联开关", terminals: [{ name: "com", dx: -44, dy: 0 }, { name: "l1", dx: 44, dy: -24 }, { name: "l2", dx: 44, dy: 24 }],
              draw: (c, s) => {
                const up = s === "up";
                return `<line x1="-44" y1="0" x2="-22" y2="0" stroke="#334155" stroke-width="2.5"/>
                  <circle cx="-22" cy="0" r="3" fill="#334155"/><circle cx="44" cy="-24" r="3" fill="#334155"/><circle cx="44" cy="24" r="3" fill="#334155"/>
                  ${up ? `<line x1="-22" y1="0" x2="44" y2="-24" stroke="#2563eb" stroke-width="2.5"/>` : `<line x1="-22" y1="0" x2="44" y2="24" stroke="#2563eb" stroke-width="2.5"/>`}
                  <text x="0" y="40" text-anchor="middle" font-size="11" font-weight="600" fill="#1a2433">${c.label || c.id}</text>`;
              } },
    switch4:{ label: "中途开关", terminals: [{ name: "in1", dx: -44, dy: -20 }, { name: "in2", dx: -44, dy: 20 }, { name: "out1", dx: 44, dy: -20 }, { name: "out2", dx: 44, dy: 20 }],
              draw: (c, s) => {
                const cross = s === "cross";
                return `<circle cx="-44" cy="-20" r="3" fill="#334155"/><circle cx="-44" cy="20" r="3" fill="#334155"/><circle cx="44" cy="-20" r="3" fill="#334155"/><circle cx="44" cy="20" r="3" fill="#334155"/>
                  ${cross
                    ? `<line x1="-44" y1="-20" x2="44" y2="20" stroke="#2563eb" stroke-width="2.5"/><line x1="-44" y1="20" x2="44" y2="-20" stroke="#2563eb" stroke-width="2.5"/>`
                    : `<line x1="-44" y1="-20" x2="44" y2="-20" stroke="#2563eb" stroke-width="2.5"/><line x1="-44" y1="20" x2="44" y2="20" stroke="#2563eb" stroke-width="2.5"/>`}
                  <text x="0" y="42" text-anchor="middle" font-size="11" font-weight="600" fill="#1a2433">${c.label || c.id}</text>`;
              } },
    lamp:   { label: "灯泡", terminals: [{ name: "a", dx: -44, dy: 0 }, { name: "b", dx: 44, dy: 0 }], loads: () => [{ from: "a", to: "b", r: 220 }],
              draw: (c, s, ls) => {
                const on = !!ls && ls.on, b = on ? (ls.bright || 0) : 0;
                const glow = on ? `<circle class="lamp-glow" cx="0" cy="-4" r="26" fill="url(#glow)" opacity="${0.4 + b * 0.6}"/>` : "";
                const fill = on ? `rgba(253,230,138,${0.55 + b * 0.45})` : "#ffffff";
                const rays = on ? `<g class="lamp-rays" opacity="${0.55 + b * 0.45}">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
                  const r = a * Math.PI / 180, cx = Math.cos(r), cy = Math.sin(r);
                  return `<line x1="${cx * 21}" y1="${cy * 21 - 4}" x2="${cx * 28}" y2="${cy * 28 - 4}" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>`;
                }).join("")}</g>` : "";
                return `${glow}${rays}
                  <circle cx="0" cy="-4" r="16" fill="${fill}" stroke="#334155" stroke-width="2.5"/>
                  <path d="M-7 -11 L7 3 M7 -11 L-7 3" stroke="#334155" stroke-width="2"/>
                  <rect x="-5" y="9" width="10" height="6" rx="1.5" fill="#94a3b8" stroke="#334155" stroke-width="1.5"/>
                  <line x1="-5" y1="12" x2="5" y2="12" stroke="#334155" stroke-width="1"/>
                  <line x1="-5" y1="14" x2="5" y2="14" stroke="#334155" stroke-width="1"/>
                  <text x="0" y="30" text-anchor="middle" font-size="11" font-weight="600" fill="#1a2433">${c.label || c.id}</text>`;
              } },
    motor:  { label: "电动机", terminals: [{ name: "a", dx: -44, dy: 0 }, { name: "b", dx: 44, dy: 0 }], loads: () => [{ from: "a", to: "b", r: 110 }],
              draw: (c, s, ls) => {
                const on = !!ls && ls.on;
                const rc = on ? "#dc2626" : "#cbd5e1";
                return `<circle cx="0" cy="0" r="17" fill="${on ? "#dbeafe" : "#ffffff"}" stroke="#334155" stroke-width="2.5"/>
                  <g class="${on ? "spin" : ""}">
                    <rect x="-2" y="-13" width="4" height="26" rx="2" fill="${rc}"/>
                    <rect x="-13" y="-2" width="26" height="4" rx="2" fill="${rc}"/>
                  </g>
                  <circle cx="0" cy="0" r="3.5" fill="#334155"/>
                  <text x="0" y="33" text-anchor="middle" font-size="11" font-weight="600" fill="#1a2433">${c.label || c.id}</text>`;
              } },
    buzzer: { label: "蜂鸣器", terminals: [{ name: "a", dx: -40, dy: 0 }, { name: "b", dx: 40, dy: 0 }], loads: () => [{ from: "a", to: "b", r: 2200 }],
              draw: (c, s, ls) => {
                const on = !!ls && ls.on;
                return `<path d="M-14 -6 L8 -6 A10 10 0 0 1 8 6 L-14 6 Z" fill="${on ? "#fde68a" : "#ffffff"}" stroke="#334155" stroke-width="2.5"/>
                  <line x1="8" y1="-14" x2="8" y2="14" stroke="#334155" stroke-width="2.5"/>
                  ${on ? `<g class="buzz"><path d="M16 -10 Q22 -14 16 -18 M22 -4 Q28 -8 22 -12 M16 10 Q22 14 16 18" fill="none" stroke="#f59e0b" stroke-width="2"/></g>` : ``}
                  <text x="0" y="30" text-anchor="middle" font-size="11" font-weight="600" fill="#1a2433">${c.label || c.id}</text>`;
              } },
    resistor:{ label: "电阻", terminals: [{ name: "a", dx: -44, dy: 0 }, { name: "b", dx: 44, dy: 0 }], loads: c => [{ from: "a", to: "b", r: c.r || 220 }],
              draw: (c) => `<path d="M-44 0 L-36 0 L-32 -9 L-24 9 L-16 -9 L-8 9 L0 -9 L8 9 L16 -9 L24 9 L32 0 L44 0" fill="none" stroke="#334155" stroke-width="2.5"/>
                <text x="0" y="24" text-anchor="middle" font-size="11" font-weight="600" fill="#1a2433">${c.label || c.id}</text>` },
    inductor:{ label: "镇流器", terminals: [{ name: "a", dx: -44, dy: 0 }, { name: "b", dx: 44, dy: 0 }], loads: () => [{ from: "a", to: "b", r: 5 }],
              draw: (c) => `<path d="M-44 0 A8 8 0 0 1 -28 0 A8 8 0 0 1 -12 0 A8 8 0 0 1 4 0 A8 8 0 0 1 20 0 A8 8 0 0 1 44 0" fill="none" stroke="#334155" stroke-width="2.5"/>
                <text x="0" y="24" text-anchor="middle" font-size="11" font-weight="600" fill="#1a2433">${c.label || c.id}</text>` },
    coil:   { label: "接触器线圈", terminals: [{ name: "a", dx: -40, dy: 0 }, { name: "b", dx: 40, dy: 0 }], loads: () => [{ from: "a", to: "b", r: 2200 }],
              draw: (c, s, ls) => {
                const on = !!ls && ls.on;
                return `<rect x="-17" y="-15" width="34" height="30" rx="4" fill="${on ? "#fde68a" : "#ffffff"}" stroke="#334155" stroke-width="2.5"/>
                <text x="0" y="5" text-anchor="middle" font-size="11" font-weight="800" fill="#1a2433">${c.label || c.id}</text>
                <text x="0" y="32" text-anchor="middle" font-size="10" fill="#6b7688">线圈</text>`;
              } },
    contact:{ label: "触点", terminals: [{ name: "a", dx: -38, dy: 0 }, { name: "b", dx: 38, dy: 0 }],
              draw: (c, s) => {
                const closed = s === true; // s 为 contactStates 的布尔
                const no = c.kind === "NO";
                return `<line x1="-38" y1="0" x2="-18" y2="0" stroke="#334155" stroke-width="2.5"/><line x1="18" y1="0" x2="38" y2="0" stroke="#334155" stroke-width="2.5"/>
                  <circle cx="-18" cy="0" r="3" fill="#334155"/><circle cx="18" cy="0" r="3" fill="#334155"/>
                  ${closed ? `<line x1="-18" y1="0" x2="18" y2="0" stroke="#7c3aed" stroke-width="2.5"/>` : `<line x1="-18" y1="0" x2="2" y2="-16" stroke="#7c3aed" stroke-width="2.5"/>`}
                  <text x="0" y="24" text-anchor="middle" font-size="10" font-weight="600" fill="#6b7688">${c.label || c.id}</text>`;
              } },
    meter:  { label: "电度表", terminals: [{ name: "t1", dx: -40, dy: -30 }, { name: "t2", dx: 40, dy: -30 }, { name: "t3", dx: -40, dy: 30 }, { name: "t4", dx: 40, dy: 30 }],
              loads: () => [{ from: "t1", to: "t2", r: 1 }, { from: "t3", to: "t4", r: 1 }],
              draw: (c) => `<rect x="-40" y="-30" width="80" height="60" rx="6" fill="#ffffff" stroke="#334155" stroke-width="2.5"/>
                <text x="0" y="-8" text-anchor="middle" font-size="10" font-weight="700" fill="#1a2433">${c.label || "kWh"}</text>
                <text x="0" y="6" text-anchor="middle" font-size="9" fill="#6b7688">电度表</text>
                <text x="-50" y="-26" text-anchor="end" font-size="9" fill="#6b7688">1</text><text x="50" y="-26" font-size="9" fill="#6b7688">2</text>
                <text x="-50" y="34" text-anchor="end" font-size="9" fill="#6b7688">3</text><text x="50" y="34" font-size="9" fill="#6b7688">4</text>` },
    node:   { label: "节点", terminals: [{ name: "a", dx: 0, dy: 0 }],
              draw: () => `` }
  };

  // ================= 工具函数 =================
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function key(id, t) { return id + "." + t; }
  function rotXY(dx, dy, rot) {
    rot = ((rot || 0) % 360 + 360) % 360;
    if (rot === 90) return [-dy, dx];
    if (rot === 180) return [-dx, -dy];
    if (rot === 270) return [dy, -dx];
    return [dx, dy];
  }
  function termWorld(comp, name) {
    const spec = SPECS[comp.type];
    const t = spec.terminals.find(x => x.name === name);
    const [dx, dy] = rotXY(t.dx, t.dy, comp.rot || 0);
    return { x: comp.x + dx, y: comp.y + dy };
  }
  function routePath(p1, p2) {
    if (Math.abs(p1.x - p2.x) < 1 || Math.abs(p1.y - p2.y) < 1) return [p1, p2];
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    if (Math.abs(p2.x - p1.x) >= Math.abs(p2.y - p1.y))
      return [p1, { x: mx, y: p1.y }, { x: mx, y: p2.y }, p2];
    return [p1, { x: p1.x, y: my }, { x: p2.x, y: my }, p2];
  }
  function polyPath(pts) { return pts.map(p => `${p.x},${p.y}`).join(" "); }

  // ================= 并查集 =================
  class UF {
    constructor() { this.p = {}; }
    add(x) { if (this.p[x] === undefined) this.p[x] = x; }
    find(x) { if (this.p[x] !== x) this.p[x] = this.find(this.p[x]); return this.p[x]; }
    union(a, b) { const ra = this.find(a), rb = this.find(b); if (ra !== rb) this.p[ra] = rb; }
  }

  // ================= 求解器（节点分析） =================
  function gaussSolve(A, b) {
    const n = A.length;
    const a = A.map(r => Array.from(r));
    const x = Array.from(b);
    for (let col = 0; col < n; col++) {
      let piv = col;
      for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[piv][col])) piv = r;
      if (Math.abs(a[piv][col]) < 1e-12) continue;
      [a[col], a[piv]] = [a[piv], a[col]]; [x[col], x[piv]] = [x[piv], x[col]];
      for (let r = 0; r < n; r++) if (r !== col) {
        const f = a[r][col] / a[col][col];
        if (f === 0) continue;
        for (let cc = col; cc < n; cc++) a[r][cc] -= f * a[col][cc];
        x[r] -= f * x[col];
      }
    }
    return x.map((v, i) => a[i][i] !== 0 ? v / a[i][i] : 0);
  }

  function buildAndSolve(circuit, wires, switchStates, contactStates) {
    const uf = new UF();
    circuit.components.forEach(c => SPECS[c.type].terminals.forEach(t => uf.add(key(c.id, t.name))));
    wires.forEach(w => uf.union(w[0], w[1]));
    circuit.components.forEach(c => {
      const st = switchStates[c.id];
      if (c.type === "switch") { if (st === "closed") uf.union(key(c.id, "a"), key(c.id, "b")); }
      else if (c.type === "switch3") { if (st === "up") uf.union(key(c.id, "com"), key(c.id, "l1")); else uf.union(key(c.id, "com"), key(c.id, "l2")); }
      else if (c.type === "switch4") { if (st === "cross") { uf.union(key(c.id, "in1"), key(c.id, "out2")); uf.union(key(c.id, "in2"), key(c.id, "out1")); } else { uf.union(key(c.id, "in1"), key(c.id, "out1")); uf.union(key(c.id, "in2"), key(c.id, "out2")); } }
      else if (c.type === "contact") { if (contactStates[c.id]) uf.union(key(c.id, "a"), key(c.id, "b")); }
    });
    const live = circuit.components.find(c => c.type === "live");
    const neu = circuit.components.find(c => c.type === "neutral");
    if (!live || !neu) return { short: false, voltages: {}, loadStates: {}, coilEnergized: {} };
    const hotRoot = uf.find(key(live.id, "a"));
    const gndRoot = uf.find(key(neu.id, "a"));
    if (hotRoot === gndRoot) return { short: true, voltages: {}, loadStates: {}, coilEnergized: {} };

    const nodeSet = new Map(); const nodeList = [];
    const addNode = r => { if (!nodeSet.has(r)) { nodeSet.set(r, nodeList.length); nodeList.push(r); } };
    circuit.components.forEach(c => SPECS[c.type].terminals.forEach(t => addNode(uf.find(key(c.id, t.name)))));
    const hotIdx = nodeSet.get(hotRoot), gndIdx = nodeSet.get(gndRoot);
    const free = []; const freeMap = {};
    nodeList.forEach((r, i) => { if (i !== hotIdx && i !== gndIdx) { freeMap[i] = free.length; free.push(i); } });
    const F = free.length;
    const G = Array.from({ length: F }, () => new Float64Array(F));
    const rhs = new Float64Array(F);
    function stamp(a, b, g) {
      const aFree = freeMap[a] !== undefined, bFree = freeMap[b] !== undefined;
      const Vb = (b === hotIdx) ? V0 : 0, Va = (a === hotIdx) ? V0 : 0;
      if (aFree && bFree) { G[freeMap[a]][freeMap[a]] += g; G[freeMap[b]][freeMap[b]] += g; G[freeMap[a]][freeMap[b]] -= g; G[freeMap[b]][freeMap[a]] -= g; }
      else if (aFree) { G[freeMap[a]][freeMap[a]] += g; rhs[freeMap[a]] += g * Vb; }
      else if (bFree) { G[freeMap[b]][freeMap[b]] += g; rhs[freeMap[b]] += g * Va; }
    }
    circuit.components.forEach(c => {
      const loads = SPECS[c.type].loads ? SPECS[c.type].loads(c) : [];
      loads.forEach(L => stamp(nodeSet.get(uf.find(key(c.id, L.from))), nodeSet.get(uf.find(key(c.id, L.to))), 1 / L.r));
    });
    for (let i = 0; i < F; i++) G[i][i] += 1e-9;
    const Vfree = gaussSolve(G, rhs);
    const V = new Array(nodeList.length); V[hotIdx] = V0; V[gndIdx] = 0;
    free.forEach((n, k) => V[n] = Vfree[k]);

    const voltages = {};
    circuit.components.forEach(c => SPECS[c.type].terminals.forEach(t => voltages[key(c.id, t.name)] = V[nodeSet.get(uf.find(key(c.id, t.name)))]));
    const loadStates = {}, coilEnergized = {};
    circuit.components.forEach(c => {
      const loads = SPECS[c.type].loads ? SPECS[c.type].loads(c) : [];
      if (loads.length) {
        const L = loads[0];
        const a = nodeSet.get(uf.find(key(c.id, L.from))), b = nodeSet.get(uf.find(key(c.id, L.to)));
        const dv = Math.abs(V[a] - V[b]);
        loadStates[c.id] = { on: dv > 0.05 * V0, v: dv, bright: Math.min(1, dv / V0) };
        if (c.type === "coil") coilEnergized[c.id] = dv > 0.5 * V0;
      }
    });
    return { short: false, voltages, loadStates, coilEnergized };
  }

  function computeSolution(circuit) {
    const sw = session.switchStates;
    const contactStates = {};
    circuit.components.forEach(c => { if (c.type === "contact") contactStates[c.id] = (c.kind === "NC"); });
    let result = null;
    for (let it = 0; it < 12; it++) {
      result = buildAndSolve(circuit, session.wires, sw, contactStates);
      if (result.short) break;
      let changed = false;
      circuit.components.forEach(c => {
        if (c.type === "contact") {
          const coil = circuit.components.find(x => x.id === c.ref);
          const en = coil && result.coilEnergized[coil.id];
          const desired = (c.kind === "NO") ? en : !en;
          if (desired !== contactStates[c.id]) { contactStates[c.id] = desired; changed = true; }
        }
      });
      if (!changed) break;
    }
    result.contactStates = contactStates;
    return result;
  }

  // ================= 视图状态 =================
  let view = { name: "home" };
  let session = null; // 工作区状态

  function newSession(circuit) {
    const sw = {};
    circuit.components.forEach(c => {
      if (c.type === "switch") sw[c.id] = c.state || "open";
      else if (c.type === "switch3") sw[c.id] = c.state || "up";
      else if (c.type === "switch4") sw[c.id] = c.state || "straight";
    });
    return { circuit, wires: [], switchStates: sw, showAnswer: false, powered: false, mode: "wire", selTerm: null };
  }

  function go(name, data) { view = Object.assign({ name }, data || {}); window.scrollTo(0, 0); render(); }

  function render() {
    const backVisible = view.name !== "home";
    document.getElementById("topbar").innerHTML = `
      ${backVisible ? '<button class="btn-back" id="btnBack">‹ 首页</button>' : ""}
      <div class="brand-mini">⚡ 电工线路连接模拟器</div>`;
    const bb = document.getElementById("btnBack");
    if (bb) bb.addEventListener("click", () => go("home"));
    document.getElementById("app").innerHTML = "";
    const fns = { home: renderHome, category: renderCategory, workspace: renderWorkspace, sandbox: renderSandbox };
    (fns[view.name] || renderHome)();
  }

  // ================= 首页 =================
  function renderHome() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="hero"><div class="hero-top"><img class="hero-logo" src="${window.APP_LOGO || 'icons/apple-touch-icon.png'}" alt="校徽"/><div><h1>广州造船厂技工学校</h1><p class="hero-sub">电工线路连接模拟器</p></div></div>
        <p class="hero-desc">亲手连接每一根导线，合上开关，点亮灯泡、运转电动机。覆盖照明电路、实用电路与电动机控制等详细线路，支持手机（含 iPhone）触屏操作。</p></div>
      <div class="hint-bar">💡 操作：点「接线」后依次点两个接线端子即可连导线；点开关可通断；点「通电」检验效果。</div>
      <h2 class="sec-title">线路分类</h2>
      <div class="cat-grid">${CATS.map(c => {
        const n = CIRCUITS.filter(x => x.cat === c.id).length;
        return `<div class="cat-row" data-id="${c.id}"><div class="cat-ico">${c.icon}</div>
          <div><div class="cat-name">${c.name}</div><div class="cat-meta">${c.desc} · ${n} 个线路</div></div>
          <div class="cat-arrow">›</div></div>`;
      }).join("")}
      <div class="cat-row" data-go="sandbox"><div class="cat-ico">🧪</div>
        <div><div class="cat-name">自由搭建</div><div class="cat-meta">从元件库自由组合电路</div></div><div class="cat-arrow">›</div></div></div>`;
    app.querySelectorAll(".cat-row[data-id]").forEach(el => el.addEventListener("click", () => go("category", { cat: el.dataset.id })));
    app.querySelector('.cat-row[data-go="sandbox"]').addEventListener("click", () => go("sandbox"));
  }

  // ================= 分类列表 =================
  function renderCategory() {
    const cat = CATS.find(c => c.id === view.cat);
    if (!cat) { go("home"); return; }
    const list = CIRCUITS.filter(c => c.cat === view.cat);
    const app = document.getElementById("app");
    app.innerHTML = `<div class="cat-row" style="cursor:default"><div class="cat-ico">${cat.icon}</div><div><div class="cat-name">${cat.name}</div><div class="cat-meta">${cat.desc}</div></div></div>
      <h2 class="sec-title">选择线路（${list.length}）</h2>
      <div class="circ-list">${list.map(c => `
        <div class="circ-card" data-id="${c.id}">
          <div class="level l${c.level}">${["入门", "进阶", "高级"][c.level - 1]}</div>
          <div class="circ-info"><div class="circ-name">${esc(c.name)}</div><div class="circ-desc">${esc(c.desc)}</div></div>
          <div class="circ-arrow">›</div></div>`).join("")}</div>`;
    app.querySelectorAll(".circ-card").forEach(el => el.addEventListener("click", () => { session = newSession(CIRCUITS.find(c => c.id === el.dataset.id)); go("workspace"); }));
  }

  // ================= 工作区 =================
  function renderWorkspace() {
    const circuit = session.circuit;
    const sol = session.powered ? computeSolution(circuit) : null;
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="workspace-head">
        <h1>${esc(circuit.name)}</h1>
        <div class="meta">${esc(circuit.desc)} · ${CATS.find(c => c.id === circuit.cat).name}</div>
        <div class="goal">🎯 目标：${esc(circuit.goal)}</div>
      </div>
      <div class="canvas-wrap" id="canvasWrap">${renderSvg(circuit, sol)}</div>
      <div class="toolbar">
        <div class="seg"><button id="mWire" class="${session.mode === "wire" ? "on" : ""}">🔗 接线</button><button id="mErase" class="${session.mode === "erase" ? "on" : ""}">🧹 擦线</button></div>
        <button class="btn ${session.powered ? "warn" : "primary"}" id="powerBtn">${session.powered ? "⏻ 断电" : "⏻ 通电"}</button>
      </div>
      <div class="btn-row">
        <button class="btn ghost" id="answerBtn">${session.showAnswer ? "🙈 隐藏答案" : "📐 参考答案"}</button>
        <button class="btn danger" id="clearBtn">🗑 清空接线</button>
      </div>
      ${sol && sol.short ? `<div class="hint-bar" style="background:var(--red-soft);color:#7f1d1d;border:1px solid #fca5a5">⚠️ 短路！火线与零线被直接连通，请检查接线。</div>` : ""}
      <div class="status-panel"><h3>元件状态</h3>${statusRows(circuit, sol)}</div>
      <div class="explain"><h3>接线说明</h3><p>${esc(circuit.explain)}</p>
        <ul class="pts">${circuit.points.map(p => `<li>${esc(p)}</li>`).join("")}</ul></div>`;

    attachCanvasEvents(circuit, sol, renderWorkspace);
    document.getElementById("mWire").addEventListener("click", () => { session.mode = "wire"; session.selTerm = null; renderWorkspace(); });
    document.getElementById("mErase").addEventListener("click", () => { session.mode = "erase"; session.selTerm = null; renderWorkspace(); });
    document.getElementById("powerBtn").addEventListener("click", () => { session.powered = !session.powered; if (!session.powered) session.selTerm = null; renderWorkspace(); });
    document.getElementById("answerBtn").addEventListener("click", () => { session.showAnswer = !session.showAnswer; renderWorkspace(); });
    document.getElementById("clearBtn").addEventListener("click", () => { session.wires = []; session.showAnswer = false; session.powered = false; session.selTerm = null; renderWorkspace(); });
  }

  function wireColor(v, powered) {
    if (!powered) return "#94a3b8";
    if (v > V0 * 0.6) return "#ef4444";
    if (v < V0 * 0.4) return "#3b82f6";
    return "#f59e0b";
  }

  // 计算每条导线是否载流及电流方向（用于电子流动动画）
  function flowDirections(circuit, session, sol) {
    const adj = {};
    const addEdge = (a, b) => { (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); };
    session.wires.forEach(w => addEdge(w[0], w[1]));
    circuit.components.forEach(c => {
      if (c.type === "switch") {
        if (session.switchStates[c.id] === "closed") addEdge(key(c.id, "a"), key(c.id, "b"));
      } else if (c.type === "switch3") {
        const st = session.switchStates[c.id] || "up";
        addEdge(key(c.id, "com"), st === "up" ? key(c.id, "l1") : key(c.id, "l2"));
      } else if (c.type === "switch4") {
        const st = session.switchStates[c.id] || "straight";
        if (st === "cross") { addEdge(key(c.id, "in1"), key(c.id, "out2")); addEdge(key(c.id, "in2"), key(c.id, "out1")); }
        else { addEdge(key(c.id, "in1"), key(c.id, "out1")); addEdge(key(c.id, "in2"), key(c.id, "out2")); }
      } else if (c.type === "contact") {
        const closed = sol && sol.contactStates ? sol.contactStates[c.id] : (c.kind === "NC");
        if (closed) addEdge(key(c.id, "a"), key(c.id, "b"));
      }
      const spec = SPECS[c.type];
      if (spec.loads) spec.loads(c).forEach(l => addEdge(key(c.id, l.from), key(c.id, l.to)));
    });
    const bfs = (starts) => {
      const dist = {}, q = starts.slice();
      starts.forEach(s => dist[s] = 0);
      while (q.length) {
        const n = q.shift();
        (adj[n] || []).forEach(m => { if (dist[m] === undefined) { dist[m] = dist[n] + 1; q.push(m); } });
      }
      return dist;
    };
    const dL = bfs(["L.a"]), dN = bfs(["N.a"]);
    const dirs = {};
    session.wires.forEach(w => {
      const a = w[0], b = w[1];
      const flow = dL[a] !== undefined && dL[b] !== undefined && dN[a] !== undefined && dN[b] !== undefined;
      dirs[a + "|" + b] = { flow, dir: dL[a] > dL[b] ? -1 : 1 };
    });
    return dirs;
  }

  function renderSvg(circuit, sol) {
    const powered = !!sol && !sol.short;
    const defs = `<defs><radialGradient id="glow"><stop offset="0%" stop-color="#fff7cc"/><stop offset="35%" stop-color="#fde047" stop-opacity="0.85"/><stop offset="70%" stop-color="#f59e0b" stop-opacity="0.35"/><stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/></radialGradient></defs>`;
    // 参考答案（虚线）
    let ansWires = "";
    if (session.showAnswer) {
      ansWires = circuit.wires.map(w => {
        const p1 = termWorld(circuit.components.find(c => c.id === w[0].split(".")[0]), w[0].split(".")[1]);
        const p2 = termWorld(circuit.components.find(c => c.id === w[1].split(".")[0]), w[1].split(".")[1]);
        return `<polyline points="${polyPath(routePath(p1, p2))}" fill="none" stroke="#16a34a" stroke-width="3" stroke-dasharray="7,6" opacity="0.7"/>`;
      }).join("");
    }
    // 用户导线
    const anyOn = powered && Object.values(sol.loadStates || {}).some(l => l.on);
    const flowDirs = flowDirections(circuit, session, sol);
    const userWires = session.wires.map((w, i) => {
      const p1 = termWorld(circuit.components.find(c => c.id === w[0].split(".")[0]), w[0].split(".")[1]);
      const p2 = termWorld(circuit.components.find(c => c.id === w[1].split(".")[0]), w[1].split(".")[1]);
      const v = sol ? (sol.voltages[w[0]] || 0) : 0;
      const col = wireColor(v, powered);
      const pts = polyPath(routePath(p1, p2));
      const d = flowDirs[w[0] + "|" + w[1]];
      let dots = "";
      if (anyOn && d && d.flow && v > V0 * 0.05) {
        const ordered = d.dir === 1 ? routePath(p1, p2) : routePath(p1, p2).slice().reverse();
        const mp = "M" + ordered.map(p => `${p.x},${p.y}`).join(" L");
        dots = [0, 1, 2].map(k => `<g><circle r="5" fill="${col}" opacity="0.3"/><circle r="2.4" fill="#ffffff"/><animateMotion dur="1.15s" begin="${(k * 0.38).toFixed(2)}s" repeatCount="indefinite" path="${mp}"/></g>`).join("");
      }
      return `<polyline class="wire" data-i="${i}" points="${pts}" fill="none" stroke="${col}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}`;
    }).join("");
    // 元件
    const comps = circuit.components.map(c => {
      const spec = SPECS[c.type];
      const st = c.type === "contact" ? (sol && sol.contactStates ? sol.contactStates[c.id] : (c.kind === "NC")) : session.switchStates[c.id];
      const ls = sol ? sol.loadStates[c.id] : null;
      const body = spec.draw(c, st, ls);
      return `<g class="comp" data-comp="${c.id}" transform="translate(${c.x},${c.y}) rotate(${c.rot || 0})">${body}</g>`;
    }).join("");
    // 端子
    const terms = circuit.components.map(c => SPECS[c.type].terminals.map(t => {
      const p = termWorld(c, t.name);
      const sel = session.selTerm === key(c.id, t.name);
      return `<circle class="term" data-comp="${c.id}" data-term="${t.name}" cx="${p.x}" cy="${p.y}" r="${sel ? 9 : 7}" fill="${sel ? "#fbbf24" : "#ffffff"}" stroke="${sel ? "#b45309" : "#64748b"}" stroke-width="2.5"/>
        <circle class="termhit" data-comp="${c.id}" data-term="${t.name}" cx="${p.x}" cy="${p.y}" r="20" fill="transparent"/>`;
    }).join("")).join("");
    return `<svg class="canvas" viewBox="0 0 400 560" xmlns="http://www.w3.org/2000/svg">${defs}${ansWires}${userWires}${comps}${terms}</svg>`;
  }

  function statusRows(circuit, sol) {
    const loads = circuit.components.filter(c => ["lamp", "motor", "buzzer", "coil"].includes(c.type));
    if (loads.length === 0) return `<div class="status-item"><span class="dot"></span>本线路无指示灯元件</div>`;
    return loads.map(c => {
      const on = sol ? !!sol.loadStates[c.id] && sol.loadStates[c.id].on : false;
      const label = { lamp: "灯泡", motor: "电动机", buzzer: "蜂鸣器", coil: "接触器线圈" }[c.type];
      const onTxt = { lamp: "点亮", motor: "运转", buzzer: "鸣响", coil: "吸合" }[c.type];
      const offTxt = { lamp: "熄灭", motor: "停止", buzzer: "静音", coil: "释放" }[c.type];
      return `<div class="status-item"><span class="dot ${on ? "on" : ""}"></span>${label} ${c.id}：${on ? onTxt : offTxt}</div>`;
    }).join("");
  }

  function attachCanvasEvents(circuit, sol, rerender) {
    // 开关本体：点击切换
    document.querySelectorAll(".comp[data-comp]").forEach(el => {
      const id = el.dataset.comp;
      const c = circuit.components.find(x => x.id === id);
      if (["switch", "switch3", "switch4"].includes(c.type)) {
        el.addEventListener("click", e => {
          e.stopPropagation();
          const s = session.switchStates;
          if (c.type === "switch") s[id] = (s[id] === "closed" ? "open" : "closed");
          else if (c.type === "switch3") s[id] = (s[id] === "up" ? "down" : "up");
          else s[id] = (s[id] === "straight" ? "cross" : "straight");
          rerender();
        });
      }
    });
    // 端子：接线 / 擦线
    document.querySelectorAll(".termhit").forEach(el => {
      el.addEventListener("click", e => {
        e.stopPropagation();
        const tk = key(el.dataset.comp, el.dataset.term);
        if (session.mode === "wire") {
          if (!session.selTerm) session.selTerm = tk;
          else if (session.selTerm === tk) session.selTerm = null;
          else {
            const dup = session.wires.some(w => (w[0] === session.selTerm && w[1] === tk) || (w[0] === tk && w[1] === session.selTerm));
            if (!dup) session.wires.push([session.selTerm, tk]);
            session.selTerm = null;
          }
          rerender();
        }
      });
    });
    // 导线：擦线模式下点击删除
    document.querySelectorAll(".wire").forEach(el => {
      el.addEventListener("click", e => {
        e.stopPropagation();
        if (session.mode === "erase") { session.wires.splice(parseInt(el.dataset.i, 10), 1); rerender(); }
      });
    });
  }

  // ================= 自由搭建 =================
  const PALETTE = [
    { type: "switch", label: "开关", icon: "🔘" },
    { type: "lamp", label: "灯泡", icon: "💡" },
    { type: "motor", label: "电动机", icon: "⚙️" },
    { type: "buzzer", label: "蜂鸣器", icon: "🔔" },
    { type: "resistor", label: "电阻", icon: "▭" },
    { type: "node", label: "节点", icon: "•" }
  ];

  function newSandboxSession() {
    const comps = [
      { id: "L", type: "live", x: 55, y: 150 },
      { id: "N", type: "neutral", x: 55, y: 420 }
    ];
    const sw = {};
    return { circuit: { id: "sandbox", components: comps, wires: [], points: [], explain: "" }, wires: [], switchStates: sw, showAnswer: false, powered: false, mode: "wire", selTerm: null, seq: 1 };
  }

  function renderSandbox() {
    const circuit = session.circuit;
    const sol = session.powered ? computeSolution(circuit) : null;
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="workspace-head"><h1>自由搭建电路</h1><div class="meta">从下方元件库添加元件，自由连线、通电测试</div></div>
      <div class="hint-bar">🖐 点元件库添加元件，长按拖动调整位置；点「接线」连导线，点开关通断，点「通电」测试。</div>
      <div class="palette">${PALETTE.map((p, i) => `<div class="palette-item" data-type="${p.type}">${p.icon} ${p.label}</div>`).join("")}</div>
      <div class="canvas-wrap">${renderSvg(circuit, sol)}</div>
      <div class="toolbar">
        <div class="seg"><button id="mWire" class="${session.mode === "wire" ? "on" : ""}">🔗 接线</button><button id="mErase" class="${session.mode === "erase" ? "on" : ""}">🧹 擦线</button></div>
        <button class="btn ${session.powered ? "warn" : "primary"}" id="powerBtn">${session.powered ? "⏻ 断电" : "⏻ 通电"}</button>
      </div>
      <div class="btn-row"><button class="btn danger" id="clearBtn">🗑 清空导线</button><button class="btn ghost" id="resetSandbox">↺ 重置元件</button></div>
      ${sol && sol.short ? `<div class="hint-bar" style="background:var(--red-soft);color:#7f1d1d;border:1px solid #fca5a5">⚠️ 短路！请检查接线。</div>` : ""}
      <div class="status-panel"><h3>元件状态</h3>${statusRows(circuit, sol)}</div>`;

    attachCanvasEvents(circuit, sol, renderSandbox);
    document.querySelectorAll(".palette-item").forEach(el => el.addEventListener("click", () => {
      const t = el.dataset.type;
      const id = t.toUpperCase() + (session.seq++);
      const x = 120 + ((session.seq * 40) % 220), y = 90 + ((session.seq * 55) % 380);
      circuit.components.push(Object.assign({ id, type: t, x, y }, (t === "resistor" ? { r: 220 } : {})));
      if (t === "switch") session.switchStates[id] = "open";
      renderSandbox();
    }));
    document.getElementById("mWire").addEventListener("click", () => { session.mode = "wire"; session.selTerm = null; renderSandbox(); });
    document.getElementById("mErase").addEventListener("click", () => { session.mode = "erase"; session.selTerm = null; renderSandbox(); });
    document.getElementById("powerBtn").addEventListener("click", () => { session.powered = !session.powered; renderSandbox(); });
    document.getElementById("clearBtn").addEventListener("click", () => { session.wires = []; session.powered = false; renderSandbox(); });
    document.getElementById("resetSandbox").addEventListener("click", () => { session = newSandboxSession(); renderSandbox(); });

    // 拖动元件
    enableDrag(circuit);
  }

  function enableDrag(circuit) {
    document.querySelectorAll(".comp[data-comp]").forEach(el => {
      const id = el.dataset.comp;
      const c = circuit.components.find(x => x.id === id);
      if (["live", "neutral", "switch", "switch3", "switch4", "contact"].includes(c.type)) return;
      el.addEventListener("pointerdown", e => {
        if (session.mode !== "wire") return;
        e.preventDefault();
        const svg = el.ownerSVGElement;
        const pt = svg.createSVGPoint();
        const move = ev => {
          ev.preventDefault();
          pt.x = ev.clientX; pt.y = ev.clientY;
          const p = pt.matrixTransform(svg.getScreenCTM().inverse());
          c.x = Math.max(20, Math.min(380, p.x));
          c.y = Math.max(40, Math.min(520, p.y));
          el.setAttribute("transform", `translate(${c.x},${c.y}) rotate(${c.rot || 0})`);
        };
        const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); renderSandbox(); };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      });
    });
  }

  // ================= 启动 =================
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => go("home"));
  else go("home");
})();
