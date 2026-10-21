/* 广州造船厂技工学校电工上岗证培训平台 · 主逻辑 */
(() => {
  "use strict";

  const BANK = window.QUESTION_BANK || [];
  const LS_KEY = "dg_state_v2";

  // 全局题目索引：qid -> { c: 分类, q: 题目 }
  const INDEX = {};
  BANK.forEach(c => c.questions.forEach(q => { INDEX[q.id] = { c, q }; }));

  // ---------- 状态持久化 ----------
  function defaultState() {
    return { progress: {}, favs: {}, settings: { examCount: "50", examTime: 60, passLine: 80 } };
  }
  function loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY));
      if (s && typeof s === "object") {
        const d = defaultState();
        return Object.assign(d, s, { settings: Object.assign({}, d.settings, s.settings || {}) });
      }
    } catch (e) {}
    return defaultState();
  }
  let state = loadState();
  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} }

  // ---------- 视图状态 ----------
  let view = { name: "home" };

  // ---------- 统计 ----------
  function allQuestions() { return BANK.flatMap(c => c.questions); }
  function catStats(cat) {
    let done = 0, right = 0;
    cat.questions.forEach(q => {
      const p = state.progress[q.id];
      if (p) { done++; if (p.status === "right") right++; }
    });
    return { total: cat.questions.length, done, right, wrong: done - right, rate: done ? Math.round(right / done * 100) : 0 };
  }
  function globalStats() {
    let done = 0, right = 0;
    BANK.forEach(c => { const s = catStats(c); done += s.done; right += s.right; });
    return { total: allQuestions().length, done, right, wrong: done - right, rate: done ? Math.round(right / done * 100) : 0 };
  }
  function wrongList() {
    return Object.keys(state.progress)
      .filter(id => state.progress[id].status === "wrong" && INDEX[id])
      .map(id => ({ c: INDEX[id].c, q: INDEX[id].q }));
  }
  function favList() {
    return Object.keys(state.favs)
      .filter(id => INDEX[id])
      .map(id => ({ c: INDEX[id].c, q: INDEX[id].q }));
  }

  // ---------- 小工具 ----------
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function letter(i) { return String.fromCharCode(65 + i); }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function aHas(q, i) { return q.a.includes(i); }
  function isRight(q, sel) { const s = (sel || []).slice().sort(); const a = q.a.slice().sort(); return s.length === a.length && s.every((v, i) => v === a[i]); }
  function answerStr(q) { return q.a.map(i => letter(i)).join("、"); }
  function toggleFav(id) { if (state.favs[id]) delete state.favs[id]; else state.favs[id] = true; save(); }
  function fmtTime(ms) { if (ms < 0) ms = 0; const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
  function typeLabel(t) { return t === "judge" ? "判断题" : t === "single" ? "单选题" : "多选题"; }
  function scopeLabel(f) { return { all: "全部", undone: "未做", wrong: "答错", fav: "收藏" }[f]; }
  function badge(qid) {
    const p = state.progress[qid];
    if (!p) return '<span class="badge undone">未做</span>';
    return p.status === "right" ? '<span class="badge right">已答对</span>' : '<span class="badge wrong">已答错</span>';
  }
  function qtypeBadge(t) { return `<span class="qtype t-${t}">${typeLabel(t).slice(0, 1)}</span>`; }

  // ---------- 导航 ----------
  function go(name, data) { view = Object.assign({ name }, data || {}); window.scrollTo({ top: 0 }); render(); }

  function render() {
    const backVisible = view.name !== "home";
    document.getElementById("topbar").innerHTML = `
      ${backVisible ? '<button class="btn-back" id="btnBack">‹ 首页</button>' : ""}
      <div class="brand-mini">⚡ 电工上岗证培训平台</div>
    `;
    const bb = document.getElementById("btnBack");
    if (bb) bb.addEventListener("click", () => go("home"));
    document.getElementById("app").innerHTML = "";
    const fns = {
      home: renderHome, category: renderCategory, study: renderStudy,
      practice: renderPractice, exam: renderExam, wrong: renderWrong, fav: renderFav, stats: renderStats
    };
    (fns[view.name] || renderHome)();
  }

  // ---------- 首页 ----------
  function renderHome() {
    const g = globalStats(), w = wrongList().length, f = favList().length;
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="hero"><h1>广州造船厂技工学校</h1><p class="hero-sub">电工上岗证培训平台</p>
        <p class="hero-desc">覆盖低压/高压电工、电气试验、继电保护、电力电缆、防爆电气等证种，支持学习、刷题、模拟考试与错题本。</p></div>
      <div class="stats-row">
        <div class="stat"><div class="num">${g.total}</div><div class="lbl">题库总量</div></div>
        <div class="stat"><div class="num">${g.done}</div><div class="lbl">已做题</div></div>
        <div class="stat"><div class="num">${g.rate}%</div><div class="lbl">正确率</div></div>
        <div class="stat"><div class="num">${w}</div><div class="lbl">错题数</div></div>
      </div>
      <h2 class="sec-title">选择证种题库</h2>
      <div class="cat-grid">${BANK.map(c => {
        const s = catStats(c);
        return `<div class="cat-card" data-id="${c.id}">
          <div class="cat-ico">${c.icon}</div><div class="cat-name">${c.name}</div>
          <div class="cat-cert">${c.cert}</div>
          <div class="cat-meta">${c.questions.length} 题 · 已做 ${s.done} · 正确率 ${s.rate}%</div>
          <div class="bar"><div class="bar-fill" style="width:${s.done ? s.done / s.total * 100 : 0}%"></div></div>
        </div>`;
      }).join("")}</div>
      <h2 class="sec-title">快捷入口</h2>
      <div class="quick-grid">
        <div class="quick-card" data-go="wrong"><div class="q-ico">📕</div><div>错题本</div><span>${w} 题</span></div>
        <div class="quick-card" data-go="fav"><div class="q-ico">⭐</div><div>我的收藏</div><span>${f} 题</span></div>
        <div class="quick-card" data-go="stats"><div class="q-ico">📊</div><div>学习统计</div><span></span></div>
        <div class="quick-card" id="resetBtn"><div class="q-ico">🔄</div><div>重置进度</div><span></span></div>
      </div>`;
    app.querySelectorAll(".cat-card").forEach(el => el.addEventListener("click", () => go("category", { id: el.dataset.id })));
    app.querySelectorAll(".quick-card[data-go]").forEach(el => el.addEventListener("click", () => go(el.dataset.go)));
    app.querySelector("#resetBtn").addEventListener("click", () => {
      if (confirm("确定要清除所有学习进度、错题和收藏吗？")) { state = defaultState(); save(); render(); }
    });
  }

  // ---------- 题库详情 ----------
  function renderCategory() {
    const cat = BANK.find(c => c.id === view.id);
    if (!cat) { go("home"); return; }
    const s = catStats(cat), app = document.getElementById("app");
    app.innerHTML = `
      <div class="cat-head"><div class="cat-ico big">${cat.icon}</div>
        <div><h1>${cat.name}</h1><p class="muted">${cat.cert}</p><p class="muted small">${cat.desc}</p></div></div>
      <div class="stats-row">
        <div class="stat"><div class="num">${s.total}</div><div class="lbl">总题数</div></div>
        <div class="stat"><div class="num">${s.done}</div><div class="lbl">已做</div></div>
        <div class="stat"><div class="num">${s.rate}%</div><div class="lbl">正确率</div></div>
        <div class="stat"><div class="num">${s.wrong}</div><div class="lbl">答错</div></div>
      </div>
      <h2 class="sec-title">答题模式</h2>
      <div class="mode-grid">
        <div class="mode-card" data-mode="study"><div class="m-ico">📖</div><h3>学习模式</h3><p>逐题看答案与解析</p></div>
        <div class="mode-card" data-mode="practice"><div class="m-ico">✏️</div><h3>刷题模式</h3><p>顺序/随机，即时判分</p></div>
        <div class="mode-card" data-mode="exam"><div class="m-ico">📝</div><h3>模拟考试</h3><p>限时抽题，自动评分</p></div>
      </div>
      <h2 class="sec-title">题目列表（${s.total}）</h2>
      <div class="qlist">${cat.questions.map((q, i) => `
        <div class="qrow" data-id="${q.id}">${qtypeBadge(q.type)}
          <span class="qtxt">${i + 1}. ${esc(q.q).slice(0, 40)}${q.q.length > 40 ? "…" : ""}</span>${badge(q.id)}</div>`).join("")}</div>`;
    app.querySelectorAll(".mode-card").forEach(el => el.addEventListener("click", () => {
      const m = el.dataset.mode;
      if (m === "study") go("study", { id: cat.id });
      else if (m === "practice") go("practice", { id: cat.id });
      else go("exam", { id: cat.id });
    }));
    app.querySelectorAll(".qrow").forEach(el => el.addEventListener("click", () => go("study", { id: cat.id, singleId: el.dataset.id })));
  }

  // ---------- 学习模式 ----------
  function renderStudy() {
    const cat = BANK.find(c => c.id === view.id);
    if (!cat) { go("home"); return; }
    const list = cat.questions;
    let idx = view.singleId ? list.findIndex(q => q.id === view.singleId) : (view.idx || 0);
    if (idx < 0) idx = 0;
    const q = list[idx], app = document.getElementById("app");
    app.innerHTML = `
      <div class="study-card">
        <div class="qmeta">${qtypeBadge(q.type)}<span class="qpos">${idx + 1} / ${list.length}</span>
          <button class="fav-btn ${state.favs[q.id] ? "on" : ""}" id="favBtn">${state.favs[q.id] ? "★ 已收藏" : "☆ 收藏"}</button></div>
        <div class="qtext">${esc(q.q)}</div>
        <div class="options">${q.options.map((o, i) => `<div class="opt ${aHas(q, i) ? "correct" : ""}">${letter(i)}. ${esc(o)}${aHas(q, i) ? " ✅" : ""}</div>`).join("")}</div>
        ${q.exp ? `<div class="exp">📖 解析：${esc(q.exp)}</div>` : ""}
        <div class="study-nav">
          <button class="btn ghost" id="prevBtn" ${idx === 0 ? "disabled" : ""}>上一题</button>
          <button class="btn primary" id="nextBtn">${idx === list.length - 1 ? "完成" : "下一题"}</button>
        </div></div>`;
    app.querySelector("#favBtn").addEventListener("click", () => { toggleFav(q.id); renderStudy(); });
    app.querySelector("#prevBtn").addEventListener("click", () => { view.idx = idx - 1; view.singleId = null; renderStudy(); });
    app.querySelector("#nextBtn").addEventListener("click", () => {
      if (idx === list.length - 1) go("category", { id: cat.id });
      else { view.idx = idx + 1; view.singleId = null; renderStudy(); }
    });
  }

  // ---------- 刷题模式 ----------
  function renderPractice() {
    const cat = BANK.find(c => c.id === view.id);
    const app = document.getElementById("app");

    // 未开始 → 选方式
    if (!view.started) {
      if (!cat) { go("home"); return; }
      app.innerHTML = `
        <div class="card">
          <h2>选择刷题方式</h2>
          <div class="mode-grid">
            <div class="mode-card ${view.mode === "order" ? "sel" : ""}" data-mode="order"><div class="m-ico">🔢</div><h3>顺序练习</h3><p>按题号顺序</p></div>
            <div class="mode-card ${view.mode === "random" ? "sel" : ""}" data-mode="random"><div class="m-ico">🎲</div><h3>随机练习</h3><p>随机打乱顺序</p></div>
          </div>
          <h2 class="sec-title">题目范围</h2>
          <div class="filter-row">${["all", "undone", "wrong", "fav"].map(f =>
            `<label class="fchip"><input type="radio" name="scope" value="${f}" ${f === (view.scope || "all") ? "checked" : ""}/>${scopeLabel(f)}</label>`).join("")}</div>
          <button class="btn primary block" id="startPrac">开始刷题</button>
        </div>`;
      app.querySelectorAll(".mode-card").forEach(el => el.addEventListener("click", () => { view.mode = el.dataset.mode; renderPractice(); }));
      app.querySelectorAll("input[name=scope]").forEach(r => r.addEventListener("change", e => { view.scope = e.target.value; }));
      app.querySelector("#startPrac").addEventListener("click", () => {
        const scope = view.scope || "all", mode = view.mode || "order";
        let pool = cat.questions.filter(q => {
          const p = state.progress[q.id];
          if (scope === "undone") return !p;
          if (scope === "wrong") return p && p.status === "wrong";
          if (scope === "fav") return state.favs[q.id];
          return true;
        });
        if (pool.length === 0) { alert("该范围暂无题目"); return; }
        if (mode === "random") pool = shuffle(pool);
        view.started = true; view.pool = pool; view.idx = 0; view.done = 0; view.right = 0;
        renderPractice();
      });
      return;
    }

    // 进行中
    const pool = view.pool || [];
    if (view.idx >= pool.length) return renderPracticeResult();
    const q = pool[view.idx];
    const multi = q.type === "multi";
    const sel = view.selected || [];
    const answered = view.answered;
    app.innerHTML = `
      <div class="prac-head"><span class="qpos">${view.idx + 1} / ${pool.length}</span>
        <span class="prc">答对 ${view.right}/${view.done}</span>
        <button class="btn ghost mini" id="quitPrac">退出</button></div>
      <div class="study-card">
        <div class="qmeta">${qtypeBadge(q.type)}${multi ? '<span class="hint">多选题：可多选</span>' : ""}
          <button class="fav-btn ${state.favs[q.id] ? "on" : ""}" id="favBtn">${state.favs[q.id] ? "★" : "☆"}</button></div>
        <div class="qtext">${esc(q.q)}</div>
        <div class="options">${q.options.map((o, i) => {
          let cls = "";
          if (answered) { if (aHas(q, i)) cls = "correct"; else if (sel.includes(i)) cls = "wrongsel"; }
          else if (sel.includes(i)) cls = "picked";
          return `<div class="opt ${cls}" data-i="${i}">${letter(i)}. ${esc(o)}${answered ? (aHas(q, i) ? " ✅" : sel.includes(i) ? " ❌" : "") : ""}</div>`;
        }).join("")}</div>
        ${answered ? `<div class="exp ${isRight(q, sel) ? "ok" : "bad"}"><b>${isRight(q, sel) ? "回答正确" : "回答错误"}，正确答案：${answerStr(q)}</b>${q.exp ? "<br>📖 " + esc(q.exp) : ""}</div>` : ""}
        <button class="btn primary block" id="submitPrac" ${multi && sel.length === 0 && !answered ? "disabled" : ""}>${answered ? "下一题" : (multi ? "提交答案" : "")}</button>
      </div>`;
    app.querySelector("#favBtn").addEventListener("click", () => { toggleFav(q.id); renderPractice(); });
    if (!answered) {
      if (!multi) {
        app.querySelectorAll(".opt").forEach(o => o.addEventListener("click", () => { view.selected = [parseInt(o.dataset.i)]; doneAnswer(q); renderPractice(); }));
      } else {
        app.querySelectorAll(".opt").forEach(o => o.addEventListener("click", () => {
          const i = parseInt(o.dataset.i); const s = new Set(view.selected || []);
          s.has(i) ? s.delete(i) : s.add(i); view.selected = Array.from(s); renderPractice();
        }));
        app.querySelector("#submitPrac").addEventListener("click", () => { doneAnswer(q); renderPractice(); });
      }
    } else {
      app.querySelector("#submitPrac").addEventListener("click", () => { view.idx++; view.selected = []; view.answered = false; renderPractice(); });
    }
    app.querySelector("#quitPrac").addEventListener("click", () => cat ? go("category", { id: cat.id }) : go("wrong"));
  }
  function doneAnswer(q) {
    const sel = view.selected || [], right = isRight(q, sel);
    const p = state.progress[q.id] || { attempts: 0 };
    p.status = right ? "right" : "wrong"; p.last = sel.slice(); p.attempts = (p.attempts || 0) + 1;
    state.progress[q.id] = p;
    view.answered = true; view.done++; if (right) view.right++; save();
  }
  function renderPracticeResult() {
    const cat = BANK.find(c => c.id === view.id);
    const total = view.pool.length, right = view.right, rate = total ? Math.round(right / total * 100) : 0;
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="result-card">
        <div class="r-ico">${rate >= 80 ? "🎉" : "💪"}</div><h2>本组练习完成</h2>
        <div class="r-stats">
          <div class="r-stat"><div class="num">${total}</div><div class="lbl">总题</div></div>
          <div class="r-stat"><div class="num">${right}</div><div class="lbl">答对</div></div>
          <div class="r-stat"><div class="num">${total - right}</div><div class="lbl">答错</div></div>
          <div class="r-stat"><div class="num">${rate}%</div><div class="lbl">正确率</div></div>
        </div>
        <button class="btn primary block" id="againBtn">再来一组</button>
        <button class="btn ghost block" id="backBtn">${cat ? "返回题库" : "返回错题本"}</button>
      </div>`;
    app.querySelector("#againBtn").addEventListener("click", () => {
      view.started = false; view.pool = null; view.idx = 0; view.done = 0; view.right = 0; view.selected = []; view.answered = false;
      renderPractice();
    });
    app.querySelector("#backBtn").addEventListener("click", () => cat ? go("category", { id: cat.id }) : go("wrong"));
  }

  // ---------- 模拟考试 ----------
  function renderExam() {
    const cat = BANK.find(c => c.id === view.id);
    const app = document.getElementById("app");
    if (!view.started) {
      if (!cat) { go("home"); return; }
      const set = state.settings;
      app.innerHTML = `
        <div class="card">
          <h2>模拟考试设置</h2><p class="muted">${cat.name} · 共 ${cat.questions.length} 题</p>
          <div class="form-row"><label>抽题数量</label><select id="examCount">
            ${[20, 30, 40, 50, 80].filter(n => n < cat.questions.length).map(n => `<option value="${n}" ${String(n) === set.examCount ? "selected" : ""}>${n} 题</option>`).join("")}
            <option value="${cat.questions.length}" ${set.examCount === String(cat.questions.length) ? "selected" : ""}>全部 ${cat.questions.length} 题</option></select></div>
          <div class="form-row"><label>考试时长（分钟）</label><select id="examTime">${[20, 30, 45, 60, 90, 120].map(m => `<option value="${m}" ${m === set.examTime ? "selected" : ""}>${m} 分钟</option>`).join("")}</select></div>
          <div class="form-row"><label>及格分数</label><select id="passLine">${[60, 70, 80, 90].map(p => `<option value="${p}" ${p === set.passLine ? "selected" : ""}>${p} 分</option>`).join("")}</select></div>
          <button class="btn primary block" id="startExam">开始考试</button>
        </div>`;
      app.querySelector("#startExam").addEventListener("click", () => {
        const total = cat.questions.length;
        const count = Math.min(parseInt(app.querySelector("#examCount").value, 10) || total, total);
        const time = parseInt(app.querySelector("#examTime").value, 10) || 60;
        const pass = parseInt(app.querySelector("#passLine").value, 10) || 80;
        state.settings = { examCount: String(count), examTime: time, passLine: pass }; save();
        view.started = true; view.finished = false;
        view.pool = shuffle(cat.questions).slice(0, count);
        view.answers = {}; view.curSel = []; view.idx = 0; view.pass = pass;
        view.deadline = Date.now() + time * 60000;
        renderExam(); startTimer();
      });
      return;
    }

    if (view.finished) return renderExamResult();
    const pool = view.pool, q = pool[view.idx];
    const answered = view.answers[q.id];
    const curSel = view.curSel || [];
    const multi = q.type === "multi";
    const remain = pool.length - Object.keys(view.answers).length;
    app.innerHTML = `
      <div class="exam-head"><span class="qpos">第 ${view.idx + 1} / ${pool.length} 题</span>
        <span class="timer" id="timer">⏱ ${fmtTime(view.deadline - Date.now())}</span></div>
      <div class="exam-bar"><div class="exam-fill" style="width:${(view.idx + 1) / pool.length * 100}%"></div></div>
      <div class="qnav">${pool.map((e, i) => {
        const done = view.answers[e.id];
        return `<span class="qchip ${i === view.idx ? "cur" : ""} ${done ? "done" : ""}" data-i="${i}">${i + 1}</span>`;
      }).join("")}</div>
      <div class="study-card">
        <div class="qmeta">${qtypeBadge(q.type)}${multi ? '<span class="hint">多选题，剩余未答 ' + remain + ' 题</span>' : '<span class="hint">剩余未答 ' + remain + ' 题</span>'}</div>
        <div class="qtext">${esc(q.q)}</div>
        <div class="options">${q.options.map((o, i) => `<div class="opt ${curSel.includes(i) ? "picked" : ""}" data-i="${i}">${letter(i)}. ${esc(o)}${curSel.includes(i) ? " ✓" : ""}</div>`).join("")}</div>
        <button class="btn primary block" id="examConfirm" ${multi && curSel.length === 0 ? "disabled" : ""}>${multi ? "确认本题" : "下一题"}</button>
        <div class="exam-nav">
          <button class="btn ghost" id="prevQ" ${view.idx === 0 ? "disabled" : ""}>上一题</button>
          <button class="btn ghost" id="nextQ" ${view.idx === pool.length - 1 ? "disabled" : ""}>下一题</button>
        </div>
        <button class="btn warn block" id="submitAll">交卷</button>
      </div>`;
    if (!multi) {
      app.querySelectorAll(".opt").forEach(o => o.addEventListener("click", () => {
        const i = parseInt(o.dataset.i, 10); view.answers[q.id] = [i]; view.curSel = [i]; nextQuestion();
      }));
    } else {
      app.querySelectorAll(".opt").forEach(o => o.addEventListener("click", () => {
        const i = parseInt(o.dataset.i, 10); const s = new Set(view.curSel || []);
        s.has(i) ? s.delete(i) : s.add(i); view.curSel = Array.from(s); renderExam();
      }));
    }
    app.querySelector("#examConfirm").addEventListener("click", () => {
      if (multi) { view.answers[q.id] = view.curSel.slice(); nextQuestion(); } else nextQuestion();
    });
    app.querySelector("#nextQ").addEventListener("click", () => { if (view.idx < pool.length - 1) { view.idx++; view.curSel = view.answers[pool[view.idx].id] || []; renderExam(); } });
    app.querySelector("#prevQ").addEventListener("click", () => { if (view.idx > 0) { view.idx--; view.curSel = view.answers[pool[view.idx].id] || []; renderExam(); } });
    app.querySelector(".qnav").addEventListener("click", e => {
      const i = e.target.dataset.i; if (i == null) return;
      view.idx = parseInt(i, 10); view.curSel = view.answers[pool[view.idx].id] || []; renderExam();
    });
    app.querySelector("#submitAll").addEventListener("click", () => {
      const un = pool.filter(e => !view.answers[e.id]).length;
      if (confirm(un ? `还有 ${un} 题未作答，确定交卷吗？` : "确定交卷吗？")) finishExam();
    });
  }
  function nextQuestion() {
    if (view.idx < view.pool.length - 1) { view.idx++; view.curSel = view.answers[view.pool[view.idx].id] || []; renderExam(); }
    else finishExam();
  }
  function finishExam() {
    if (view.timerId) clearInterval(view.timerId);
    view.finished = true;
    let right = 0;
    view.pool.forEach(q => {
      const sel = view.answers[q.id] || [];
      const ok = isRight(q, sel);
      if (ok) right++;
      const p = state.progress[q.id] || { attempts: 0 };
      p.status = (!sel.length || !ok) ? "wrong" : "right";
      p.last = sel.slice(); p.attempts = (p.attempts || 0) + 1;
      state.progress[q.id] = p;
    });
    view.right = right; view.score = Math.round(right / view.pool.length * 100);
    save(); renderExam();
  }
  function renderExamResult() {
    const cat = BANK.find(c => c.id === view.id);
    const pool = view.pool, pass = view.pass || 80, passed = view.score >= pass;
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="result-card">
        <div class="r-ico">${passed ? "🎉" : "😅"}</div><h2>${passed ? "考试成绩合格" : "考试成绩不合格"}</h2>
        <p class="muted">${cat ? cat.name : ""} · 满分 100 分 · 及格 ${pass} 分</p>
        <div class="score-big">${view.score}</div><div class="muted">得分</div>
        <div class="r-stats">
          <div class="r-stat"><div class="num">${pool.length}</div><div class="lbl">总题</div></div>
          <div class="r-stat"><div class="num">${view.right}</div><div class="lbl">答对</div></div>
          <div class="r-stat"><div class="num">${pool.length - view.right}</div><div class="lbl">答错</div></div>
        </div>
        <button class="btn primary block" id="reviewBtn">查看错题解析</button>
        <button class="btn ghost block" id="reExam">再考一次</button>
        <button class="btn ghost block" id="examHome">返回题库</button>
      </div>`;
    app.querySelector("#reviewBtn").addEventListener("click", () => { view.review = true; renderExamReview(); });
    app.querySelector("#reExam").addEventListener("click", () => {
      view = Object.assign({ name: "exam", id: cat ? cat.id : view.id }, {});
      renderExam();
    });
    app.querySelector("#examHome").addEventListener("click", () => go("category", { id: cat.id }));
  }
  function renderExamReview() {
    const pool = view.pool, app = document.getElementById("app");
    const wrongQs = pool.filter(q => { const sel = view.answers[q.id] || []; return !(sel.length && isRight(q, sel)); });
    app.innerHTML = `<h2 class="sec-title">错题解析（${wrongQs.length}）</h2>` +
      wrongQs.map(q => {
        const sel = view.answers[q.id] || [];
        return `<div class="study-card">
          <div class="qmeta">${qtypeBadge(q.type)}</div><div class="qtext">${esc(q.q)}</div>
          <div class="options">${q.options.map((o, i) => `<div class="opt ${aHas(q, i) ? "correct" : sel.includes(i) ? "wrongsel" : ""}">${letter(i)}. ${esc(o)}${aHas(q, i) ? " ✅" : ""}</div>`).join("")}</div>
          <div class="exp">${q.exp ? "📖 " + esc(q.exp) : "正确答案：" + answerStr(q)}</div>
        </div>`;
      }).join("") +
      `<button class="btn primary block" id="backResult">返回成绩</button>`;
    app.querySelector("#backResult").addEventListener("click", () => { view.review = false; renderExam(); });
  }
  function startTimer() {
    if (view.timerId) clearInterval(view.timerId);
    view.timerId = setInterval(() => {
      if (view.finished) { clearInterval(view.timerId); return; }
      const left = view.deadline - Date.now();
      const el = document.getElementById("timer");
      if (el) el.textContent = "⏱ " + fmtTime(left);
      if (left <= 0) finishExam();
    }, 1000);
  }

  // ---------- 错题本 ----------
  function renderWrong() {
    const list = wrongList(), app = document.getElementById("app");
    if (list.length === 0) {
      app.innerHTML = `<div class="empty"><div class="e-ico">📕</div><p>暂无错题，继续保持！</p><button class="btn primary" id="eBack">返回首页</button></div>`;
      app.querySelector("#eBack").addEventListener("click", () => go("home"));
      return;
    }
    app.innerHTML = `
      <div class="card"><h2>错题本（${list.length} 题）</h2>
        <p class="muted">答错的题目自动收录于此，可反复练习；练习中答对后会自动移出。</p>
        <div class="btn-row"><button class="btn primary" id="wrongPrac">错题重练</button><button class="btn ghost" id="clearWrong">清空错题本</button></div></div>
      <div class="qlist">${list.map(e => `
        <div class="qrow" data-id="${e.q.id}">${qtypeBadge(e.q.type)}<span class="qtxt">${esc(e.q.q).slice(0, 40)}${e.q.q.length > 40 ? "…" : ""}</span><span class="badge wrong">${e.c.short}</span></div>`).join("")}</div>`;
    app.querySelectorAll(".qrow").forEach(el => el.addEventListener("click", () => {
      const id = el.dataset.id; go("study", { id: INDEX[id].c.id, singleId: id });
    }));
    app.querySelector("#wrongPrac").addEventListener("click", () => {
      const qs = list.map(e => e.q);
      view = { name: "practice", started: true, pool: shuffle(qs), idx: 0, done: 0, right: 0, selected: [], answered: false };
      render();
    });
    app.querySelector("#clearWrong").addEventListener("click", () => {
      if (confirm("确定清空所有错题吗？")) {
        Object.keys(state.progress).forEach(id => { if (state.progress[id].status === "wrong") delete state.progress[id]; });
        save(); render();
      }
    });
  }

  // ---------- 收藏 ----------
  function renderFav() {
    const list = favList(), app = document.getElementById("app");
    if (list.length === 0) {
      app.innerHTML = `<div class="empty"><div class="e-ico">⭐</div><p>暂无收藏题目，在学习/刷题时可点“☆收藏”。</p><button class="btn primary" id="eBack">返回首页</button></div>`;
      app.querySelector("#eBack").addEventListener("click", () => go("home"));
      return;
    }
    app.innerHTML = `<h2 class="sec-title">我的收藏（${list.length} 题）</h2><div class="qlist">` +
      list.map(e => `<div class="qrow" data-id="${e.q.id}">${qtypeBadge(e.q.type)}<span class="qtxt">${esc(e.q.q).slice(0, 40)}${e.q.q.length > 40 ? "…" : ""}</span><span class="badge">${e.c.short}</span></div>`).join("") + `</div>`;
    app.querySelectorAll(".qrow").forEach(el => el.addEventListener("click", () => { const id = el.dataset.id; go("study", { id: INDEX[id].c.id, singleId: id }); }));
  }

  // ---------- 统计 ----------
  function renderStats() {
    const g = globalStats(), app = document.getElementById("app");
    app.innerHTML = `
      <h2 class="sec-title">学习统计</h2>
      <div class="stats-row">
        <div class="stat"><div class="num">${g.total}</div><div class="lbl">总题数</div></div>
        <div class="stat"><div class="num">${g.done}</div><div class="lbl">已做</div></div>
        <div class="stat"><div class="num">${g.rate}%</div><div class="lbl">正确率</div></div>
        <div class="stat"><div class="num">${wrongList().length}</div><div class="lbl">错题</div></div>
      </div>
      <div class="card"><h2>各证种掌握情况</h2>
        ${BANK.map(c => { const s = catStats(c); return `
          <div class="cat-stats-row"><div class="cname">${c.icon} ${c.name}</div>
            <div class="cbar"><div class="bar"><div class="bar-fill" style="width:${s.done ? s.done / s.total * 100 : 0}%"></div></div></div>
            <div class="cmeta">${s.done}/${s.total} · ${s.rate}%</div></div>`; }).join("")}</div>
      <button class="btn ghost block" id="exportBtn">导出进度（复制到剪贴板）</button>
      <button class="btn ghost block" id="importBtn">从剪贴板导入进度</button>`;
    app.querySelector("#exportBtn").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(JSON.stringify(state)); alert("进度已复制到剪贴板，请粘贴并妥善保存。"); }
      catch (e) { alert("复制失败，请手动复制：\n" + JSON.stringify(state)); }
    });
    app.querySelector("#importBtn").addEventListener("click", async () => {
      try {
        const txt = await navigator.clipboard.readText();
        const s = JSON.parse(txt);
        if (s && s.progress) { state = Object.assign(defaultState(), s, { settings: Object.assign({}, defaultState().settings, s.settings || {}) }); save(); render(); alert("导入成功！"); }
        else alert("数据格式不正确");
      } catch (e) { alert("导入失败：请先复制有效的进度文本。"); }
    });
  }

  // ---------- 启动 ----------
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => go("home"));
  else go("home");
})();