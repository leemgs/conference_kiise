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

  /* ---------------- conference Google search side panel ---------------- */
  // build a Google search query string (HTML-attribute safe) for a record
  function confQuery(r) {
    const parts = [r.name, r.abbr, "conference"].filter(Boolean);
    return encodeURIComponent(parts.join(" "))
      .replace(/'/g, "%27").replace(/"/g, "%22");
  }
  // open Google search results for a record in the slide-in side panel.
  // igu=1 drops Google's X-Frame-Options header so results embed in an iframe.
  function openConfSearch(query, title) {
    const panel = $("#search-panel"), backdrop = $("#search-backdrop");
    $("#search-panel-title").textContent = title;
    $("#search-panel-open").href = "https://www.google.com/search?q=" + query;
    $("#search-frame").src = "https://www.google.com/search?igu=1&q=" + query;
    backdrop.hidden = false; panel.hidden = false;
    requestAnimationFrame(() => { backdrop.classList.add("open"); panel.classList.add("open"); });
    document.body.classList.add("panel-open");
    $("#search-panel-close").focus();
  }
  function closeConfSearch() {
    const panel = $("#search-panel"), backdrop = $("#search-backdrop");
    panel.classList.remove("open"); backdrop.classList.remove("open");
    document.body.classList.remove("panel-open");
    const done = () => {
      panel.hidden = true; backdrop.hidden = true;
      $("#search-frame").src = "about:blank"; // stop the framed page
      panel.removeEventListener("transitionend", done);
    };
    panel.addEventListener("transitionend", done);
  }

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
      { val: count(records, (r) => r.grade === "S"), lbl: "S 등급 (최우수)", dot: color("--grade-s") },
      { val: count(records, (r) => r.grade === "A"), lbl: "A 등급 (우수)", dot: color("--grade-a") },
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
          `<b>${m} · ${gradeLabel} 등급 (${gradeLabel === "S" ? "최우수" : "우수"})</b><br>${val}개 ` +
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
      `<span><i style="background:${color("--grade-s")}"></i> S 등급 (최우수)</span>` +
      `<span><i style="background:${color("--grade-a")}"></i> A 등급 (우수)</span>`;
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
        `<b>${isS ? "S 등급 (최우수)" : "A 등급 (우수)"}</b><br>${isS ? s : a}개 ` +
        `<span class="tt-sub">(${((isS ? s : a) / total * 100).toFixed(0)}%)</span>`,
        e.clientX, e.clientY);
    });
    donut.addEventListener("mouseleave", hideTip);

    const legend = el("div", "donut-legend",
      `<span><i style="background:${cS}"></i> S 등급 (최우수) &nbsp; <b>${s}</b> (${sPct.toFixed(0)}%)</span>` +
      `<span><i style="background:${cA}"></i> A 등급 (우수) &nbsp; <b>${a}</b> (${(100 - sPct).toFixed(0)}%)</span>`);
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
  // Default: 가장 최근 연도, S 등급 우선 정렬, 페이지당 15개
  const state = { q: "", year: years.length ? years[years.length - 1] : "ALL",
                  major: "ALL", grade: "ALL", sub: "ALL",
                  sortKey: "grade", sortDir: 1, page: 1, pageSize: 15 };

  // reset to first page whenever the result set changes, then re-render
  function resetAndRender() { state.page = 1; renderTable(); }

  function scoped() {
    return state.year === "ALL" ? allRecords : allRecords.filter((r) => r.year === state.year);
  }

  function buildFilters() {
    // year select
    const ys = $("#filter-year");
    ys.appendChild(new Option(years.length > 1 ? "전체 연도" : years[0] + "년", "ALL"));
    if (years.length > 1) years.forEach((y) => ys.appendChild(new Option(y + "년", y)));
    ys.onchange = () => { state.year = ys.value; refresh(); };
    ys.value = state.year;               // reflect the default (latest year)
    if (years.length <= 1) ys.disabled = true;

    // major chips
    const mg = $("#filter-major");
    [["ALL", "전체"], ["CS", "CS"], ["AI", "AI"]].forEach(([v, label]) => {
      const b = el("button", "chip", label);
      b.dataset.val = v;
      b.setAttribute("aria-pressed", v === "ALL");
      b.onclick = () => { state.major = v; setPressed(mg, v); resetAndRender(); };
      mg.appendChild(b);
    });
    // grade chips
    const gg = $("#filter-grade");
    [["ALL", "전체"], ["S", "S (최우수)"], ["A", "A (우수)"]].forEach(([v, label]) => {
      const b = el("button", "chip", label);
      b.dataset.val = v;
      b.setAttribute("aria-pressed", v === "ALL");
      b.onclick = () => { state.grade = v; setPressed(gg, v); resetAndRender(); };
      gg.appendChild(b);
    });
    // sub select
    const sel = $("#filter-sub");
    sel.appendChild(new Option("소분야 전체", "ALL"));
    [...new Set(allRecords.map((r) => r.sub))].sort().forEach((s) => {
      const rec = allRecords.find((r) => r.sub === s);
      sel.appendChild(new Option(`${s} · ${rec.subName}`, s));
    });
    sel.onchange = () => { state.sub = sel.value; resetAndRender(); };
    // page size
    const ps = $("#page-size");
    ps.onchange = () => { state.pageSize = parseInt(ps.value, 10) || 15; resetAndRender(); };
    // search
    $("#search").addEventListener("input", (e) => {
      state.q = e.target.value.trim().toLowerCase();
      resetAndRender();
    });
    // sortable headers
    document.querySelectorAll("thead th[data-sort]").forEach((th) => {
      th.onclick = () => {
        const k = th.dataset.sort;
        if (state.sortKey === k) state.sortDir *= -1;
        else { state.sortKey = k; state.sortDir = 1; }
        resetAndRender();
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
    const total = rows.length;
    const pageSize = state.pageSize;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (state.page > pages) state.page = pages;
    if (state.page < 1) state.page = 1;
    const start = (state.page - 1) * pageSize;
    const pageRows = rows.slice(start, start + pageSize);

    const tbody = $("#conf-tbody");
    tbody.innerHTML = "";
    pageRows.forEach((r) => {
      const tr = document.createElement("tr");
      const note = r.note ? `<span class="note-tag">${r.note}</span>` : "";
      tr.innerHTML =
        `<td class="no">${r.no}</td>` +
        `<td><span class="pill ${r.major.toLowerCase()}">${r.major}</span></td>` +
        `<td>${r.sub}</td>` +
        `<td class="abbr"><b>${r.abbr}</b></td>` +
        `<td class="name"><a href="#" class="conf-link" data-q="${confQuery(r)}" title="구글에서 이 학회 정보 검색">${r.name}</a></td>` +
        `<td><span class="pill grade-${r.grade.toLowerCase()}">${r.grade}</span></td>` +
        `<td>${note}</td>`;
      tbody.appendChild(tr);
    });
    $("#empty-msg").hidden = total > 0;
    $("#table-count").textContent = total;
    renderPagination(total, pages, start, pageRows.length);
  }

  function renderPagination(total, pages, start, shown) {
    const nav = $("#pagination");
    nav.innerHTML = "";
    if (total === 0) return;

    const info = el("span", "page-info",
      `${start + 1}–${start + shown} / 총 ${total}개 · ${state.page}/${pages} 페이지`);
    nav.appendChild(info);

    const go = (p) => { state.page = p; renderTable(); };
    const btn = (label, page, opts = {}) => {
      const b = el("button", "pg-btn", label);
      if (opts.current) b.setAttribute("aria-current", "true");
      if (opts.disabled) b.disabled = true;
      else b.onclick = () => go(page);
      return b;
    };

    nav.appendChild(btn("‹", state.page - 1, { disabled: state.page === 1 }));

    // windowed page numbers with first/last + ellipsis
    const win = 2;
    const nums = new Set([1, pages]);
    for (let p = state.page - win; p <= state.page + win; p++) {
      if (p >= 1 && p <= pages) nums.add(p);
    }
    const sorted = [...nums].sort((a, b) => a - b);
    let prev = 0;
    sorted.forEach((p) => {
      if (p - prev > 1) nav.appendChild(el("span", "pg-ellipsis", "…"));
      nav.appendChild(btn(String(p), p, { current: p === state.page }));
      prev = p;
    });

    nav.appendChild(btn("›", state.page + 1, { disabled: state.page === pages }));
  }

  function renderDeleted() {
    const tbody = $("#deleted-tbody");
    tbody.innerHTML = "";
    const rows = state.year === "ALL"
      ? deleted : deleted.filter((r) => r.year === state.year);
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td><span class="pill ${r.major.toLowerCase()}">${r.major}</span></td>` +
        `<td>${r.sub}</td>` +
        `<td class="abbr"><b>${r.abbr}</b></td>` +
        `<td class="name">${r.name}</td>` +
        `<td><span class="pill grade-${r.grade.toLowerCase()}">${r.grade}</span></td>`;
      tbody.appendChild(tr);
    });
    $("#deleted-count").textContent = rows.length;
    $("#deleted-year").textContent =
      state.year === "ALL" ? "전체" : state.year;
  }

  /* re-render everything that depends on the current year scope */
  function refresh() {
    state.page = 1;
    const rec = scoped();
    renderTiles(rec);
    renderMajor(rec);
    renderGrade(rec);
    renderSub(rec);
    renderTable();
    renderDeleted();
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

  /* clicking a conference name opens the Google search side panel */
  function initConfSearch() {
    $("#conf-tbody").addEventListener("click", (e) => {
      const link = e.target.closest("a.conf-link");
      if (!link) return;
      e.preventDefault();
      openConfSearch(link.dataset.q, link.textContent);
    });
    $("#search-panel-close").onclick = closeConfSearch;
    $("#search-backdrop").onclick = closeConfSearch;
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#search-panel").hidden) closeConfSearch();
    });
  }

  /* ---------------- boot ---------------- */
  buildFilters();
  initConfSearch();
  refresh();
  initTheme();
})();
