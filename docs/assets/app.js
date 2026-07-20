/* KIISE 우수 SW 국제학술대회 대시보드 — app logic (vanilla JS, no dependencies) */
(function () {
  "use strict";

  const DATA = window.KIISE_DATA;
  if (!DATA) { console.error("KIISE_DATA not loaded"); return; }

  const allRecords = DATA.records;
  const deleted = DATA.deleted || [];
  const majorNames = DATA.majorNames || {};
  const years = DATA.years || [];
  const GRADE_RANK = { S: 0, A: 1 };

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

  /* ---------------- tooltip ---------------- */
  const tip = $("#tooltip");
  function showTip(html, x, y) {
    tip.innerHTML = html;
    tip.hidden = false;
    moveTip(x, y);
  }
  function moveTip(x, y) {
    const pad = 10;
    tip.style.left = Math.max(pad, Math.min(x, innerWidth - pad)) + "px";
    tip.style.top = Math.max(28, y - 12) + "px";
  }
  function hideTip() { tip.hidden = true; }
  function bindTip(node, htmlFn) {
    node.addEventListener("mousemove", (e) => showTip(htmlFn(), e.clientX, e.clientY));
    node.addEventListener("mouseleave", hideTip);
  }

  /* ---------------- summary tiles ---------------- */
  function renderTiles(records) {
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
    box.innerHTML = "";
    tiles.forEach((t) => {
      const dot = t.dot ? `<span class="dot" style="background:${t.dot}"></span>` : "";
      box.appendChild(el("div", "tile",
        `<div class="val">${dot}${t.val}</div><div class="lbl">${t.lbl}</div>`));
    });
  }

  /* ---------------- major × grade stacked ---------------- */
  function renderMajor(records) {
    const host = $("#chart-major");
    host.innerHTML = "";
    const majors = ["CS", "AI"].filter((m) => records.some((r) => r.major === m));
    const max = Math.max(1, ...majors.map((m) => count(records, (r) => r.major === m)));
    majors.forEach((m) => {
      const s = count(records, (r) => r.major === m && r.grade === "S");
      const a = count(records, (r) => r.major === m && r.grade === "A");
      const total = s + a;
      const row = el("div", "mrow");
      row.appendChild(el("div", "mk",
        `<b>${m}</b> <small>${majorNames[m] || ""}</small>`));
      const stack = el("div", "stack");
      stack.style.width = (total / max * 100) + "%";
      const mkSeg = (val, bg, dark, gradeLabel) => {
        const seg = el("div", "seg", val > 0 ? String(val) : "");
        seg.style.background = bg;
        seg.style.flexBasis = (val / total * 100) + "%";
        if (dark) { seg.style.color = "#0b0b0b"; seg.style.textShadow = "none"; }
        bindTip(seg, () =>
          `<b>${m} · ${gradeLabel} 등급</b><br>${val}개 ` +
          `<span class="tt-sub">(${m} 내 ${(val / total * 100).toFixed(0)}%)</span>`);
        return seg;
      };
      stack.append(
        mkSeg(s, color("--grade-s"), false, "S"),
        mkSeg(a, color("--grade-a"), true, "A"));
      row.appendChild(stack);
      host.appendChild(row);
    });
    $("#legend-grade").innerHTML =
      `<span><i style="background:${color("--grade-s")}"></i> S 등급</span>` +
      `<span><i style="background:${color("--grade-a")}"></i> A 등급</span>`;
  }

  /* ---------------- grade donut (with tooltip) ---------------- */
  function renderGrade(records) {
    const host = $("#chart-grade");
    host.innerHTML = "";
    const s = count(records, (r) => r.grade === "S");
    const a = count(records, (r) => r.grade === "A");
    const total = s + a || 1;
    const sPct = (s / total * 100);
    const cS = color("--grade-s"), cA = color("--grade-a");

    const donut = el("div", "donut");
    donut.style.background = `conic-gradient(${cS} 0 ${sPct}%, ${cA} ${sPct}% 100%)`;
    donut.appendChild(el("div", "donut-center", `<b>${total}</b><small>학회</small>`));

    // segment detection by angle (clockwise from 12 o'clock)
    donut.addEventListener("mousemove", (e) => {
      const rect = donut.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const r = Math.hypot(dx, dy);
      if (r > rect.width / 2 || r < rect.width / 2 - 26) { hideTip(); return; }
      let ang = Math.atan2(dx, -dy) * 180 / Math.PI; // 0=top, cw+
      if (ang < 0) ang += 360;
      const pct = ang / 360 * 100;
      const isS = pct < sPct;
      showTip(
        `<b>${isS ? "S" : "A"} 등급</b><br>${isS ? s : a}개 ` +
        `<span class="tt-sub">(${((isS ? s : a) / total * 100).toFixed(0)}%)</span>`,
        e.clientX, e.clientY);
    });
    donut.addEventListener("mouseleave", hideTip);

    const legend = el("div", "donut-legend",
      `<span><i style="background:${cS}"></i> S 등급 &nbsp; <b>${s}</b> (${sPct.toFixed(0)}%)</span>` +
      `<span><i style="background:${cA}"></i> A 등급 &nbsp; <b>${a}</b> (${(100 - sPct).toFixed(0)}%)</span>`);
    host.append(donut, legend);
  }

  /* ---------------- sub-field bars (with tooltip) ---------------- */
  function renderSub(records) {
    const host = $("#chart-sub");
    host.innerHTML = "";
    const map = new Map();
    records.forEach((r) => {
      if (!map.has(r.sub)) map.set(r.sub, { sub: r.sub, subName: r.subName, major: r.major, n: 0, s: 0, a: 0 });
      const o = map.get(r.sub);
      o.n++; o[r.grade === "S" ? "s" : "a"]++;
    });
    const rows = [...map.values()].sort((x, y) => y.n - x.n);
    const max = Math.max(1, ...rows.map((r) => r.n));
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
      bindTip(track, () =>
        `<b>${r.sub} · ${r.subName}</b><br>` +
        `총 ${r.n}개 <span class="tt-sub">(${r.major})</span><br>` +
        `<span class="tt-sub">S ${r.s} · A ${r.a}</span>`);
      host.appendChild(row);
    });
    $("#legend-major").innerHTML =
      `<span><i style="background:${color("--cs")}"></i> CS (Computer Science)</span>` +
      `<span><i style="background:${color("--ai")}"></i> AI (Artificial Intelligence)</span>`;
  }

  /* ---------------- filters + table ---------------- */
  // Default: S 등급 우선 정렬
  const state = { q: "", year: "ALL", major: "ALL", grade: "ALL", sub: "ALL", sortKey: "grade", sortDir: 1 };

  function scoped() {
    return state.year === "ALL" ? allRecords : allRecords.filter((r) => r.year === state.year);
  }

  function buildFilters() {
    // year select
    const ys = $("#filter-year");
    ys.appendChild(new Option(years.length > 1 ? "전체 연도" : years[0] + "년", "ALL"));
    if (years.length > 1) years.forEach((y) => ys.appendChild(new Option(y + "년", y)));
    ys.onchange = () => { state.year = ys.value; refresh(); };
    if (years.length <= 1) ys.disabled = true;

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
    [...new Set(allRecords.map((r) => r.sub))].sort().forEach((s) => {
      const rec = allRecords.find((r) => r.sub === s);
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
    return scoped().filter((r) => {
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

  function compare(a, b) {
    const k = state.sortKey;
    if (k === "grade") {
      const d = (GRADE_RANK[a.grade] - GRADE_RANK[b.grade]) * state.sortDir;
      return d || a.no.localeCompare(b.no, "en", { numeric: true });
    }
    const av = (a[k] || "").toString(), bv = (b[k] || "").toString();
    return av.localeCompare(bv, "en", { numeric: true }) * state.sortDir;
  }

  function renderTable() {
    const rows = filtered().sort(compare);
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
    tbody.innerHTML = "";
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
    $("#deleted-count").textContent = deleted.length;
  }

  /* re-render everything that depends on the current year scope */
  function refresh() {
    const rec = scoped();
    renderTiles(rec);
    renderMajor(rec);
    renderGrade(rec);
    renderSub(rec);
    renderTable();
    $("#tag-count").textContent = rec.length;
    $("#tag-year").textContent =
      state.year === "ALL"
        ? (years.length > 1 ? `${years[0]}–${years[years.length - 1]}년` : years[0] + "년")
        : state.year + "년";
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
      const rec = scoped();
      renderMajor(rec); renderGrade(rec); renderSub(rec); // color-dependent
    };
  }

  /* ---------------- boot ---------------- */
  buildFilters();
  refresh();
  renderDeleted();
  initTheme();
})();
