// ============================================================
// 机电一体化学习平台 - 交互与渲染逻辑
// ============================================================

const STORAGE_KEY = "mechatronics_progress_v1";

// ---------- 状态管理 ----------
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { completed: {}, quiz: {} };
}

let state = loadState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

function isChapterDone(moduleId, idx) {
  return state.completed[moduleId] && state.completed[moduleId].includes(idx);
}

function setChapterDone(moduleId, idx, done) {
  if (!state.completed[moduleId]) state.completed[moduleId] = [];
  const arr = state.completed[moduleId];
  if (done && !arr.includes(idx)) arr.push(idx);
  if (!done) state.completed[moduleId] = arr.filter(i => i !== idx);
  saveState();
  updateProgressUI();
  renderNav();
}

function moduleCompletedCount(moduleId) {
  const mod = getModule(moduleId);
  return mod.chapters.filter((c, i) => isChapterDone(moduleId, i)).length;
}

function getModule(id) {
  return MODULES.find(m => m.id === id);
}

// ---------- 进度统计 ----------
function totalChapters() {
  return MODULES.reduce((s, m) => s + m.chapters.length, 0);
}
function completedChapters() {
  let n = 0;
  MODULES.forEach(m => m.chapters.forEach((c, i) => { if (isChapterDone(m.id, i)) n++; }));
  return n;
}
function quizDoneCount() {
  return MODULES.filter(m => state.quiz[m.id] != null).length;
}
function overallProgress() {
  const total = totalChapters() + MODULES.length;
  if (total === 0) return 0;
  return Math.round(((completedChapters() + quizDoneCount()) / total) * 100);
}

// ---------- 工具 ----------
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text, query) {
  if (!query) return esc(text);
  const safe = escapeRegExp(query.trim());
  try {
    const re = new RegExp("(" + safe + ")", "gi");
    return esc(text).replace(re, '<span class="search-highlight">$1</span>');
  } catch (e) {
    return esc(text);
  }
}

// ---------- DOM 引用 ----------
const contentEl = document.getElementById("content");
const moduleNav = document.getElementById("moduleNav");
const searchInput = document.getElementById("searchInput");
const breadcrumb = document.getElementById("breadcrumb");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const resetBtn = document.getElementById("resetBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");

let currentLocation = null; // { type: 'home'|'module'|'chapter'|'quiz'|'search', moduleId?, chapterIdx? }

// ---------- 渲染导航 ----------
function renderNav() {
  let html = "";
  MODULES.forEach(m => {
    const done = moduleCompletedCount(m.id);
    const total = m.chapters.length;
    const pct = total ? Math.round(done / total * 100) : 0;
    const active = currentLocation && currentLocation.moduleId === m.id ? "active" : "";
    html += `
      <div class="nav-item ${active}" data-id="${m.id}">
        <span class="ico">${m.icon}</span>
        <span class="label">${esc(m.title)}</span>
        <span class="pct">${done}/${total}</span>
      </div>`;
  });
  moduleNav.innerHTML = html;
  moduleNav.querySelectorAll(".nav-item").forEach(el => {
    el.addEventListener("click", () => { showModule(el.dataset.id); closeMenu(); });
  });
}

function updateProgressUI() {
  const p = overallProgress();
  progressText.textContent = p + "%";
  progressFill.style.width = p + "%";
}

function setBreadcrumb(html) {
  breadcrumb.innerHTML = html;
}

// ---------- 首页 ----------
function showHome() {
  currentLocation = { type: "home" };
  renderNav();
  setBreadcrumb("首页");

  const doneC = completedChapters();
  const totalC = totalChapters();
  const totalQ = MODULES.length;
  const doneQ = quizDoneCount();

  let pathHtml = LEARNING_PATH.map((p, i) => {
    const mod = getModule(p.moduleId);
    const done = mod && doneC > 0 && moduleCompletedCount(p.moduleId) === mod.chapters.length;
    return `
      <div class="chapter-item" style="cursor:pointer" data-path="${p.moduleId}">
        <div class="idx">${i + 1}</div>
        <div class="c-info">
          <div class="c-title">${esc(p.title)}</div>
          <div class="c-desc">${esc(p.desc)}</div>
        </div>
        ${done ? '<span class="done-mark">✓</span>' : ""}
      </div>`;
  }).join("");

  let gridHtml = MODULES.map(m => {
    const done = moduleCompletedCount(m.id);
    const total = m.chapters.length;
    const quizDone = state.quiz[m.id] != null;
    let badge = "";
    if (done === total && quizDone) badge = '<span class="badge badge-done">已完成</span>';
    else if (done > 0 || quizDone) badge = '<span class="badge badge-ing">学习中</span>';
    return `
      <div class="module-card" data-id="${m.id}">
        <div class="m-ico">${m.icon}</div>
        <h3>${esc(m.title)}</h3>
        <p>${esc(m.description)}</p>
        <div class="m-meta"><span>${done}/${total} 章节</span><span>${badge}</span></div>
      </div>`;
  }).join("");

  contentEl.innerHTML = `
    <div class="hero">
      <h1>欢迎来到广州造船厂技工学校机电一体化技术学习平台</h1>
      <p>从机械、电工电子到传感器、控制、PLC 与机器人，系统化掌握机电一体化核心知识。</p>
    </div>
    <div class="stats">
      <div class="stat"><div class="num">${totalC}</div><div class="lbl">学习章节</div></div>
      <div class="stat"><div class="num">${doneC}</div><div class="lbl">已完成章节</div></div>
      <div class="stat"><div class="num">${totalQ}</div><div class="lbl">知识模块</div></div>
      <div class="stat"><div class="num">${overallProgress()}%</div><div class="lbl">总进度</div></div>
    </div>
    <div class="card">
      <h2>📚 推荐学习路径</h2>
      <p class="muted">建议按以下顺序循序渐进学习</p>
      ${pathHtml}
    </div>
    <h2 style="margin:8px 0 16px">全部知识模块</h2>
    <div class="module-grid">${gridHtml}</div>`;

  contentEl.querySelectorAll(".module-card").forEach(el => {
    el.addEventListener("click", () => showModule(el.dataset.id));
  });
  contentEl.querySelectorAll("[data-path]").forEach(el => {
    el.addEventListener("click", () => showModule(el.dataset.path));
  });
}

// ---------- 模块详情 ----------
function showModule(moduleId) {
  const mod = getModule(moduleId);
  if (!mod) return;
  currentLocation = { type: "module", moduleId };
  renderNav();
  setBreadcrumb(`<span style="color:#6b7280">首页</span> / ${esc(mod.title)}`);

  let chaptersHtml = mod.chapters.map((c, i) => {
    const done = isChapterDone(moduleId, i);
    return `
      <div class="chapter-item" data-chapter="${i}">
        <div class="idx">${i + 1}</div>
        <div class="c-info">
          <div class="c-title">${esc(c.title)}</div>
          <div class="c-desc">${esc(c.desc)}</div>
        </div>
        ${done ? '<span class="done-mark">✓</span>' : ""}
      </div>`;
  }).join("");

  const quizDone = state.quiz[moduleId] != null;
  const lastScore = quizDone ? state.quiz[moduleId].score + "/" + state.quiz[moduleId].total : "未完成";

  contentEl.innerHTML = `
    <div class="card">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="font-size:40px">${mod.icon}</div>
        <div>
          <h2 style="margin:0">${esc(mod.title)}</h2>
          <p class="muted" style="margin:0">${esc(mod.description)}</p>
        </div>
      </div>
    </div>
    <div class="card">
      <h2>章节学习（${mod.chapters.length}）</h2>
      ${chaptersHtml}
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div>
          <h2 style="margin:0">📝 课后测验</h2>
          <p class="muted" style="margin:4px 0 0">上次成绩：${lastScore}</p>
        </div>
        <button class="btn btn-primary" id="startQuizBtn">开始测验</button>
      </div>
    </div>`;

  contentEl.querySelectorAll(".chapter-item").forEach(el => {
    el.addEventListener("click", () => showChapter(moduleId, parseInt(el.dataset.chapter, 10)));
  });
  contentEl.querySelector("#startQuizBtn").addEventListener("click", () => showQuiz(moduleId));
}

// ---------- 章节阅读 ----------
function showChapter(moduleId, idx) {
  const mod = getModule(moduleId);
  const chapter = mod.chapters[idx];
  currentLocation = { type: "chapter", moduleId, chapterIdx: idx };
  renderNav();
  setBreadcrumb(`<span style="color:#6b7280">${esc(mod.title)}</span> / ${esc(chapter.title)}`);

  let sectionsHtml = chapter.sections.map(s => {
    let pointsHtml = s.points && s.points.length ? `<ul>${s.points.map(p => `<li>${esc(p)}</li>`).join("")}</ul>` : "";
    return `
      <div class="section-block">
        <h3>${esc(s.heading)}</h3>
        <p>${esc(s.text)}</p>
        ${pointsHtml}
      </div>`;
  }).join("");

  const isLast = idx >= mod.chapters.length - 1;
  const isFirst = idx === 0;
  const done = isChapterDone(moduleId, idx);

  contentEl.innerHTML = `
    <div class="card read-head">
      <h2>${idx + 1}. ${esc(chapter.title)}</h2>
      <span class="muted">${esc(mod.title)} · ${esc(chapter.desc)}</span>
    </div>
    <div class="card">${sectionsHtml}</div>
    <div class="read-actions">
      ${!isFirst ? `<button class="btn btn-outline" id="prevBtn">← 上一节</button>` : ""}
      <button class="btn ${done ? "btn-grey" : "btn-primary"}" id="markDoneBtn">${done ? "✓ 已学完（点击取消）" : "标记为已学完"}</button>
      ${!isLast ? `<button class="btn btn-primary" id="nextBtn">下一节 →</button>` : `<button class="btn btn-primary" id="finishBtn">完成学习，去测验 →</button>`}
    </div>`;

  const prevBtn = contentEl.querySelector("#prevBtn");
  const nextBtn = contentEl.querySelector("#nextBtn");
  const finishBtn = contentEl.querySelector("#finishBtn");
  const markBtn = contentEl.querySelector("#markDoneBtn");

  if (prevBtn) prevBtn.addEventListener("click", () => showChapter(moduleId, idx - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => showChapter(moduleId, idx + 1));
  if (finishBtn) finishBtn.addEventListener("click", () => showQuiz(moduleId));
  markBtn.addEventListener("click", () => {
    setChapterDone(moduleId, idx, !isChapterDone(moduleId, idx));
    showChapter(moduleId, idx);
  });
}

// ---------- 测验 ----------
function showQuiz(moduleId) {
  const mod = getModule(moduleId);
  currentLocation = { type: "quiz", moduleId };
  renderNav();
  setBreadcrumb(`<span style="color:#6b7280">${esc(mod.title)}</span> / 测验`);

  const answers = new Array(mod.quiz.length).fill(-1);
  let submitted = false;

  contentEl.innerHTML = `
    <div class="card">
      <h2>📝 ${esc(mod.title)} · 课后测验</h2>
      <p class="muted">共 ${mod.quiz.length} 题，选择答案后点击\"提交测验\"查看得分与解析。</p>
    </div>
    <div class="card" id="quizBody">
      ${mod.quiz.map((q, qi) => `
        <div class="quiz-q" data-qi="${qi}">
          <div class="q-text">${qi + 1}. ${esc(q.q)}</div>
          ${q.options.map((opt, oi) => `
            <div class="quiz-opt" data-qi="${qi}" data-oi="${oi}">
              <span class="opt-tag">${String.fromCharCode(65 + oi)}</span>
              <span>${esc(opt)}</span>
            </div>`).join("")}
          <div class="quiz-explain" data-qi="${qi}"></div>
        </div>`).join("")}
    </div>
    <div class="read-actions">
      <button class="btn btn-outline" id="backModuleBtn">← 返回模块</button>
      <button class="btn btn-primary" id="submitQuizBtn">提交测验</button>
    </div>`;

  function renderOpts() {
    contentEl.querySelectorAll(".quiz-opt").forEach(el => {
      const qi = parseInt(el.dataset.qi, 10);
      const oi = parseInt(el.dataset.oi, 10);
      if (!submitted) {
        el.classList.toggle("selected", answers[qi] === oi);
      } else {
        const correct = mod.quiz[qi].answer;
        if (oi === correct) el.classList.add("correct");
        else if (oi === answers[qi]) el.classList.add("wrong");
      }
    });
  }

  contentEl.querySelectorAll(".quiz-opt").forEach(el => {
    el.addEventListener("click", () => {
      if (submitted) return;
      const qi = parseInt(el.dataset.qi, 10);
      const oi = parseInt(el.dataset.oi, 10);
      answers[qi] = oi;
      renderOpts();
    });
  });

  contentEl.querySelector("#backModuleBtn").addEventListener("click", () => showModule(moduleId));
  contentEl.querySelector("#submitQuizBtn").addEventListener("click", () => {
    if (submitted) return;
    const unanswered = answers.filter(a => a === -1).length;
    if (unanswered > 0) {
      const c = window.confirm(`还有 ${unanswered} 题未作答，确定提交吗？`);
      if (!c) return;
    }
    submitted = true;
    let score = 0;
    mod.quiz.forEach((q, qi) => {
      if (answers[qi] === q.answer) score++;
      const explainEl = contentEl.querySelector(`.quiz-explain[data-qi="${qi}"]`);
      const correctTag = String.fromCharCode(65 + q.answer);
      explainEl.innerHTML = `<strong>解析：</strong>${esc(q.explain)} <span style="color:#6b7280">（正确答案 ${correctTag}）</span>`;
      explainEl.classList.add("show");
    });
    state.quiz[moduleId] = { score, total: mod.quiz.length };
    saveState();
    renderOpts();

    const resultHtml = `
      <div class="card score-bar">
        <div class="big">${score} / ${mod.quiz.length}</div>
        <p style="margin:8px 0 16px">${score === mod.quiz.length ? "🎉 太棒了，全部答对！" : score >= mod.quiz.length * 0.6 ? "👍 不错，继续巩固薄弱点。" : "💪 建议回到章节再复习一遍。"}</p>
        <button class="btn btn-primary" id="retryBtn">重新测验</button>
      </div>`;
    contentEl.querySelector("#quizBody").insertAdjacentHTML("afterend", resultHtml);
    contentEl.querySelector("#retryBtn").addEventListener("click", () => showQuiz(moduleId));
    const submitBtn = contentEl.querySelector("#submitQuizBtn");
    submitBtn.textContent = "已提交";
    submitBtn.classList.remove("btn-primary");
    submitBtn.classList.add("btn-grey");
    updateProgressUI();
    renderNav();
  });
}

// ---------- 搜索 ----------
function doSearch(query) {
  query = (query || "").trim();
  if (!query) { showHome(); return; }
  currentLocation = { type: "search", query };
  renderNav();
  setBreadcrumb(`搜索：${esc(query)}`);

  const results = [];
  MODULES.forEach(m => {
    // 匹配模块标题/描述
    if (m.title.includes(query) || m.description.includes(query)) {
      results.push({ type: "module", mod: m, title: m.title, snippet: m.description, moduleId: m.id });
    }
    m.chapters.forEach((c, ci) => {
      // 匹配章节标题/描述
      if (c.title.includes(query) || c.desc.includes(query)) {
        results.push({ type: "chapter", mod: m, chapterIdx: ci, title: m.title + " · " + c.title, snippet: c.desc, moduleId: m.id });
      }
      c.sections.forEach(s => {
        if (s.heading.includes(query) || s.text.includes(query)) {
          results.push({ type: "chapter", mod: m, chapterIdx: ci, title: s.heading, snippet: s.text.slice(0, 80) + "…", moduleId: m.id });
        }
        (s.points || []).forEach(p => {
          if (p.includes(query)) {
            results.push({ type: "chapter", mod: m, chapterIdx: ci, title: s.heading, snippet: p, moduleId: m.id });
          }
        });
      });
    });
    // 匹配测验题
    m.quiz.forEach((q, qi) => {
      if (q.q.includes(query)) {
        results.push({ type: "quiz", mod: m, title: q.q, snippet: q.options[q.answer], moduleId: m.id });
      }
    });
  });

  // 去重（同一模块+章节只保留一条）
  const seen = new Set();
  const unique = results.filter(r => {
    const key = r.type + "|" + r.moduleId + "|" + (r.chapterIdx != null ? r.chapterIdx : "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (unique.length === 0) {
    contentEl.innerHTML = `<div class="empty"><div class="e-ico">🔍</div><p>未找到与"${esc(query)}"相关的内容</p></div>`;
    return;
  }

  contentEl.innerHTML = `
    <div class="card">
      <h2>搜索结果</h2>
      <p class="muted">找到 ${unique.length} 条相关内容</p>
    </div>
    ${unique.map((r, i) => `
      <div class="chapter-item" data-i="${i}" style="cursor:pointer">
        <div class="idx">${r.type === "quiz" ? "?" : r.type === "module" ? "📚" : ""}</div>
        <div class="c-info">
          <div class="c-title">${highlight(r.title, query)}</div>
          <div class="c-desc">${highlight(r.snippet, query)}</div>
        </div>
      </div>`).join("")}`;

  contentEl.querySelectorAll(".chapter-item").forEach(el => {
    el.addEventListener("click", () => {
      const r = unique[parseInt(el.dataset.i, 10)];
      if (r.type === "chapter") showChapter(r.moduleId, r.chapterIdx);
      else if (r.type === "quiz") showQuiz(r.moduleId);
      else showModule(r.moduleId);
    });
  });
}

// ---------- 事件绑定 ----------
searchInput.addEventListener("input", () => {
  const q = searchInput.value;
  if (q.trim()) doSearch(q);
  else showHome();
});

function closeMenu() {
  sidebar.classList.remove("open");
  document.body.classList.remove("menu-open");
}
menuBtn.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open");
  document.body.classList.toggle("menu-open", open);
});
document.addEventListener("click", e => {
  if (window.innerWidth <= 768 && !sidebar.contains(e.target) && e.target !== menuBtn) {
    closeMenu();
  }
});

resetBtn.addEventListener("click", () => {
  if (window.confirm("确定要清除所有学习进度吗？此操作不可恢复。")) {
    state = { completed: {}, quiz: {} };
    saveState();
    updateProgressUI();
    renderNav();
    showHome();
  }
});

// ---------- 进度导入导出 ----------
function showModal(title, bodyHtml, actionsHtml) {
  const old = document.getElementById("progressModal");
  if (old) old.remove();
  const mask = document.createElement("div");
  mask.id = "progressModal";
  mask.className = "modal-mask";
  mask.innerHTML = `
    <div class="modal">
      <h3>${title}</h3>
      ${bodyHtml}
      <div class="modal-actions">${actionsHtml}</div>
    </div>`;
  mask.addEventListener("click", e => { if (e.target === mask) mask.remove(); });
  document.body.appendChild(mask);
  return mask;
}

exportBtn.addEventListener("click", () => {
  const json = JSON.stringify(state, null, 2);
  let downloaded = false;
  try {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "机电一体化学习进度.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    downloaded = true;
  } catch (e) { /* 浏览器不支持下载，改用复制 */ }

  const dlg = showModal(
    "导出学习进度",
    `<p class="muted" style="margin-top:0">${downloaded ? "已开始下载进度文件；如未成功，请复制下方文本手动保存。" : "当前浏览器不支持自动下载，请复制下方文本保存。"}</p>
     <textarea readonly id="exportText">${esc(json)}</textarea>`,
    `<button class="btn btn-outline" id="copyBtn">复制全部</button>
     <button class="btn btn-primary" id="closeModalBtn">关闭</button>`
  );
  const ta = dlg.querySelector("#exportText");
  ta.addEventListener("click", () => ta.select());
  dlg.querySelector("#copyBtn").addEventListener("click", () => {
    ta.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(() => window.alert("已复制到剪贴板"), () => window.alert("复制失败，请长按文本手动复制"));
    } else {
      try { document.execCommand("copy"); window.alert("已复制到剪贴板"); }
      catch (e) { window.alert("复制失败，请长按文本手动复制"); }
    }
  });
  dlg.querySelector("#closeModalBtn").addEventListener("click", () => dlg.remove());
});

importBtn.addEventListener("click", () => {
  const dlg = showModal(
    "导入学习进度",
    `<p class="muted" style="margin-top:0">粘贴之前导出的进度文本，或点击"读取文件"选择 .json 文件。</p>
     <textarea id="importText" placeholder='粘贴学习进度 JSON…'></textarea>
     <input type="file" id="importFile" accept=".json,application/json,text/plain" style="display:none">`,
    `<button class="btn btn-outline" id="readFileBtn">读取文件</button>
     <button class="btn btn-outline" id="cancelImportBtn">取消</button>
     <button class="btn btn-primary" id="applyImportBtn">导入</button>`
  );
  const ta = dlg.querySelector("#importText");
  const fileInput = dlg.querySelector("#importFile");
  dlg.querySelector("#readFileBtn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { ta.value = String(r.result || ""); };
    r.readAsText(f);
  });
  function applyImport() {
    const txt = ta.value.trim();
    if (!txt) { window.alert("请先粘贴进度文本或选择文件"); return; }
    try {
      const data = JSON.parse(txt);
      if (!data || typeof data !== "object" || !("completed" in data) || !("quiz" in data)) throw new Error("bad");
      state = { completed: data.completed || {}, quiz: data.quiz || {} };
      saveState();
      updateProgressUI();
      renderNav();
      showHome();
      dlg.remove();
      window.alert("学习进度已成功导入");
    } catch (e) {
      window.alert("导入失败：内容不是有效的进度数据");
    }
  }
  dlg.querySelector("#applyImportBtn").addEventListener("click", applyImport);
  dlg.querySelector("#cancelImportBtn").addEventListener("click", () => dlg.remove());
});

// ---------- 初始化 ----------
function init() {
  updateProgressUI();
  showHome();
}

init();