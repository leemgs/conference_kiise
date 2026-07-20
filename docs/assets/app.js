/* KIISE 우수 SW 국제학술대회 대시보드 — app logic (vanilla JS, no dependencies) */
(function () {
  "use strict";

  const DATA = window.KIISE_DATA;
  if (!DATA) { console.error("KIISE_DATA not loaded"); return; }

  const records = DATA.records;
  const deleted = DATA.deleted || [];
  const majorNames = DATA.majorNames || {};

  const CSS = getComputedStyle(document.documentElement);
  const color = (name) => CSS.getPropertyValue(name).trim();
  const majorColor = (m) => (m === "AI" ? color("--ai") : color("--cs"));

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const count = (arr, fn) => arr.filter(fn).length;

  /* ---------------- summary tiles ---------------- */
  function renderTiles() {
    const majors = [...new Set(records.map((r) => r.major))];
    const subs = [...new Set(records.map((r) => r.sub))];
    const tiles = [
      { val: records.length, lbl: "전체 학회", dot: null },
      { val: count(records, (r) => r.grade === "S"), lbl: "S 등급", dot: color("--grade-s") },
      { val: count(records, (r) => r.grade === "A"), lbl: "A 등급", dot: color("--grade-a") },
      { val: majors.length, lbl: "대분야", dot: null },
      { val: subs.length, lbl: "소분야", dot: null },
    ];
    const box = $("#tiles");
    tiles.forEach((t) => {
      const dot = t.dot ? `<span class="dot" style="background:${t.dot}"></span>` : "";
      box.appendChild(el("div", "tile",
        `<div class="val">${dot}${t.val}</div><div class="lbl">${t.lbl}</div>`));
    });
    $("#tag-count").textContent = records.length;
    $("#table-count").textContent = records.length;
    $("#deleted-count").textContent = deleted.length;
  }

  /* ---------------- major × grade stacked ---------------- */
  function renderMajor() {
    const host = $("#chart-major");
    const majors = ["CS", "AI"];
    const max = Math.max(...majors.map((m) => count(records, (r) => r.major === m)));
    majors.forEach((m) => {
      const s = count(records, (r) => r.major === m && r.grade === "S");
      const a = count(records, (r) => r.major === m && r.grade === "A");
      const total = s + a;
      const row = el("div", "mrow");
      row.appendChild(el("div", "mk",
        `<b>${m}</b> <small>${majorNames[m] || ""}</small>`));
      const stack = el("div", "stack");
      stack.style.width = (total / max * 100) + "%";
      const segS = el("div", "seg", s > 0 ? String(s) : "");
      segS.style.background = color("--grade-s");
      segS.style.flexBasis = (s / total * 100) + "%";
      const segA = el("div", "seg", a > 0 ? String(a) : "");
      segA.style.background = color("--grade-a");
      segA.style.color = "#0b0b0b";
      segA.style.textShadow = "none";
      segA.style.flexBasis = (a / total * 100) + "%";
      stack.append(segS, segA);
      row.appendChild(stack);
      host.appendChild(row);
    });
    $("#legend-grade").innerHTML =
      `<span><i style="background:${color("--grade-s")}"></i> S 등급</span>` +
      `<span><i style="background:${color("--grade-a")}"></i> A 등급</span>`;
  }

  /* ---------------- grade donut ---------------- */
  function renderGrade() {
    const s = count(records, (r) => r.grade === "S");
    const a = count(records, (r) => r.grade === "A");
    const total = s + a;
    const sPct = (s / total * 100);
    const cS = color("--grade-s"), cA = color("--grade-a");
    const host = $("#chart-grade");
    const donut = el("div", "donut");
    donut.style.background =
      `conic-gradient(${cS} 0 ${sPct}%, ${cA} ${sPct}% 100%)`;
    donut.appendChild(el("div", "donut-center",
      `<b>${total}</b><small>학회</small>`));
    const legend = el("div", "donut-legend",
      `<span><i style="background:${cS}"></i> S 등급 &nbsp; <b>${s}</b> (${sPct.toFixed(0)}%)</span>` +
      `<span><i style="background:${cA}"></i> A 등급 &nbsp; <b>${a}</b> (${(100 - sPct).toFixed(0)}%)</span>`);
    host.append(donut, legend);
  }

  /* ---------------- sub-field bars ---------------- */
  function renderSub() {
    const map = new Map();
    records.forEach((r) => {
      const key = r.sub;
      if (!map.has(key)) map.set(key, { sub: r.sub, subName: r.subName, major: r.major, n: 0 });
      map.get(key).n++;
    });
    const rows = [...map.values()].sort((x, y) => y.n - x.n);
    const max = Math.max(...rows.map((r) => r.n));
    const host = $("#chart-sub");
    rows.forEach((r) => {
      const row = el("div", "bar-row");
      row.appendChild(el("div", "k", `<b>${r.sub}</b> · ${r.subName}`));
      const track = el("div", "bar-track");
      const fill = el("div", "bar-fill");
      fill.style.width = (r.n / max * 100) + "%";
      fill.style.background = majorColor(r.major);
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("div", "v", String(r.n)));
      host.appendChild(row);
    });
    $("#legend-major").innerHTML =
      `<span><i style="background:${color("--cs")}"></i> CS (Computer Science)</span>` +
      `<span><i style="background:${color("--ai")}"></i> AI (Artificial Intelligence)</span>`;
  }

  /* ---------------- filters + table ---------------- */
  const state = { q: "", major: "ALL", grade: "ALL", sub: "ALL", sortKey: "no", sortDir: 1 };

  function buildFilters() {
    // major chips
    const mg = $("#filter-major");
    [["ALL", "전체"], ["CS", "CS"], ["AI", "AI"]].forEach(([v, label]) => {
      const b = el("button", "chip", label);
      b.dataset.val = v;
      b.setAttribute("aria-pressed", v === "ALL");
      b.onclick = () => { state.major = v; setPressed(mg, v); renderTable(); };
      mg.appendChild(b);
    });
    // grade chips
    const gg = $("#filter-grade");
    [["ALL", "전체"], ["S", "S"], ["A", "A"]].forEach(([v, label]) => {
      const b = el("button", "chip", label);
      b.dataset.val = v;
      b.setAttribute("aria-pressed", v === "ALL");
      b.onclick = () => { state.grade = v; setPressed(gg, v); renderTable(); };
      gg.appendChild(b);
    });
    // sub select
    const sel = $("#filter-sub");
    sel.appendChild(new Option("소분야 전체", "ALL"));
    [...new Set(records.map((r) => r.sub))]
      .sort()
      .forEach((s) => {
        const rec = records.find((r) => r.sub === s);
        sel.appendChild(new Option(`${s} · ${rec.subName}`, s));
      });
    sel.onchange = () => { state.sub = sel.value; renderTable(); };
    // search
    $("#search").addEventListener("input", (e) => {
      state.q = e.target.value.trim().toLowerCase();
      renderTable();
    });
    // sortable headers
    document.querySelectorAll("thead th[data-sort]").forEach((th) => {
      th.onclick = () => {
        const k = th.dataset.sort;
        if (state.sortKey === k) state.sortDir *= -1;
        else { state.sortKey = k; state.sortDir = 1; }
        renderTable();
      };
    });
  }
  function setPressed(group, val) {
    group.querySelectorAll(".chip").forEach((c) =>
      c.setAttribute("aria-pressed", c.dataset.val === val));
  }

  function filtered() {
    return records.filter((r) => {
      if (state.major !== "ALL" && r.major !== state.major) return false;
      if (state.grade !== "ALL" && r.grade !== state.grade) return false;
      if (state.sub !== "ALL" && r.sub !== state.sub) return false;
      if (state.q) {
        const hay = (r.abbr + " " + r.name + " " + r.subName).toLowerCase();
        if (!hay.includes(state.q)) return false;
      }
      return true;
    });
  }

  function renderTable() {
    const rows = filtered().sort((a, b) => {
      const k = state.sortKey;
      const av = (a[k] || "").toString();
      const bv = (b[k] || "").toString();
      return av.localeCompare(bv, "en", { numeric: true }) * state.sortDir;
    });
    const tbody = $("#conf-tbody");
    tbody.innerHTML = "";
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      const note = r.note ? `<span class="note-tag">${r.note}</span>` : "";
      tr.innerHTML =
        `<td class="no">${r.no}</td>` +
        `<td><span class="pill ${r.major.toLowerCase()}">${r.major}</span></td>` +
        `<td>${r.sub}</td>` +
        `<td class="abbr"><b>${r.abbr}</b></td>` +
        `<td class="name">${r.name}</td>` +
        `<td><span class="pill grade-${r.grade.toLowerCase()}">${r.grade}</span></td>` +
        `<td>${note}</td>`;
      tbody.appendChild(tr);
    });
    $("#empty-msg").hidden = rows.length > 0;
    $("#table-count").textContent = rows.length;
  }

  function renderDeleted() {
    const tbody = $("#deleted-tbody");
    deleted.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td><span class="pill ${r.major.toLowerCase()}">${r.major}</span></td>` +
        `<td>${r.sub}</td>` +
        `<td class="abbr"><b>${r.abbr}</b></td>` +
        `<td class="name">${r.name}</td>` +
        `<td><span class="pill grade-${r.grade.toLowerCase()}">${r.grade}</span></td>`;
      tbody.appendChild(tr);
    });
  }

  /* ---------------- theme toggle ---------------- */
  function initTheme() {
    const btn = $("#theme-toggle");
    const saved = localStorage.getItem("kiise-theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    btn.onclick = () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const isDark = cur ? cur === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
      const next = isDark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("kiise-theme", next);
      // re-render color-dependent charts
      ["#chart-major", "#chart-grade", "#chart-sub", "#legend-grade", "#legend-major"]
        .forEach((s) => { $(s).innerHTML = ""; });
      renderMajor(); renderGrade(); renderSub();
    };
  }

  /* ---------------- boot ---------------- */
  renderTiles();
  renderMajor();
  renderGrade();
  renderSub();
  buildFilters();
  renderTable();
  renderDeleted();
  initTheme();
})();
