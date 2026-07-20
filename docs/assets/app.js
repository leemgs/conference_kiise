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

  // conference identity for year-over-year diff: abbr sans parenthetical qualifier
  const confKey = (r) =>
    (r.abbr || r.name).replace(/\(.*?\)/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  // year -> Map(confKey -> record), for computing 신규/삭제 vs the previous year
  const yearKeys = {};
  years.forEach((y) => {
    const m = new Map();
    allRecords.forEach((r) => { if (r.year === y && !m.has(confKey(r))) m.set(confKey(r), r); });
    yearKeys[y] = m;
  });

  /* ---------------- conference Google search side panel ---------------- */
  // build a Google search query string (HTML-attribute safe) for a record
  function confQuery(r) {
    const parts = [r.name, r.abbr, "conference"].filter(Boolean);
    return encodeURIComponent(parts.join(" "))
      .replace(/'/g, "%27").replace(/"/g, "%22");
  }
  // open web search results for a record in the slide-in side panel.
  // Bing serves without X-Frame-Options/frame-ancestors so it embeds in an
  // iframe without tripping bot detection (Google's igu=1 trick triggers
  // frequent reCAPTCHA challenges). The ↗ button still opens Google in a tab.
  function openConfSearch(query, title) {
    const panel = $("#search-panel"), backdrop = $("#search-backdrop");
    $("#search-panel-title").textContent = title;
    $("#search-panel-open").href = "https://www.google.com/search?q=" + query;
    $("#search-frame").src = "https://www.bing.com/search?q=" + query;
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

  /* ---------------- year-over-year 신규/삭제 ---------------- */
  function fillChangeList(ul, arr) {
    ul.innerHTML = "";
    if (!arr.length) { ul.appendChild(el("li", "chg-empty muted", "없음")); return; }
    arr.forEach((r) => {
      const li = el("li", "chg-item",
        `<span class="pill grade-${r.grade.toLowerCase()}">${r.grade}</span>` +
        `<span class="pill ${r.major.toLowerCase()}">${r.major}</span>` +
        `<b class="chg-abbr">${r.abbr}</b>` +
        `<span class="chg-name">${r.name}</span>`);
      li.title = `${r.abbr} — ${r.name}`;
      ul.appendChild(li);
    });
  }

  function renderChanges() {
    const card = $("#changes-card");
    const idx = years.indexOf(state.year);
    const prev = state.year !== "ALL" && idx > 0 ? years[idx - 1] : null;
    if (!prev) { card.hidden = true; return; }   // 첫 연도 또는 '전체 연도'
    card.hidden = false;
    const cur = yearKeys[state.year], old = yearKeys[prev];
    const bySA = (a, b) =>
      (GRADE_RANK[a.grade] - GRADE_RANK[b.grade]) || a.abbr.localeCompare(b.abbr);
    const news = [...cur.values()].filter((r) => !old.has(confKey(r))).sort(bySA);
    const dels = [...old.values()].filter((r) => !cur.has(confKey(r))).sort(bySA);
    $("#changes-sub").textContent = `${prev}년 → ${state.year}년`;
    $("#new-count").textContent = news.length;
    $("#del-count").textContent = dels.length;
    fillChangeList($("#new-list"), news);
    fillChangeList($("#del-list"), dels);
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
    renderChanges();
    // year filter 옆 요약: 전체 · S(최우수) · A(우수) 학회 수
    const sN = count(rec, (r) => r.grade === "S");
    $("#year-summary").innerHTML =
      `<b>${rec.length}</b>개 학회 ` +
      `<i class="ys-dot" style="background:${color("--grade-s")}"></i>S <b>${sN}</b> ` +
      `<i class="ys-dot" style="background:${color("--grade-a")}"></i>A <b>${rec.length - sN}</b>`;
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

  /* ---------------- paper submission deadline calendar ---------------- */
  function initCalendar() {
    const grid = $("#cal-grid");
    const dl = window.KIISE_DEADLINES;
    if (!grid || !dl || !dl.items) { $("#deadline-card").hidden = true; return; }

    // abbr -> record (prefer the latest survey year) for full names in tooltips
    const byAbbr = new Map();
    for (let i = years.length - 1; i >= 0; i--) {
      allRecords.forEach((r) => {
        if (r.year === years[i] && !byAbbr.has(r.abbr)) byAbbr.set(r.abbr, r);
      });
    }

    // group deadline items by date string
    const byDate = new Map();
    dl.items.forEach((it) => {
      if (!byDate.has(it.date)) byDate.set(it.date, []);
      byDate.get(it.date).push(it);
    });

    // stable per-conference chip color
    const PALETTE = ["#1a73e8", "#0b8457", "#8e24aa", "#e53935", "#f4511e", "#00897b",
                     "#3949ab", "#d81b60", "#6d4c41", "#546e7a", "#689f38", "#5e35b1"];
    const chipColor = (abbr) => {
      let h = 0;
      for (const c of abbr) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      return PALETTE[h % PALETTE.length];
    };

    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    let cur = new Date(); cur.setDate(1);

    function render() {
      $("#cal-title").textContent = `${cur.getFullYear()}년 ${cur.getMonth() + 1}월`;
      grid.innerHTML = "";
      const firstDow = cur.getDay();
      const daysInMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
      const cells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
      const todayStr = fmt(new Date());
      for (let i = 0; i < cells; i++) {
        const d = new Date(cur.getFullYear(), cur.getMonth(), 1 - firstDow + i);
        const ds = fmt(d);
        const cell = el("div", "cal-cell"
          + (d.getMonth() !== cur.getMonth() ? " out" : "")
          + (ds === todayStr ? " today" : "")
          + (i % 7 === 0 ? " sun" : ""));
        cell.appendChild(el("span", "cal-day", String(d.getDate())));
        (byDate.get(ds) || []).forEach((it) => {
          const btn = el("button", "cal-chip", `${it.abbr} ${it.edition} ${it.kind}`);
          btn.style.background = chipColor(it.abbr);
          const rec = byAbbr.get(it.abbr);
          btn.title = `${it.abbr} ${it.edition} ${it.kind} 마감 (예상): ${ds}`
            + (it.note ? ` · ${it.note}` : "")
            + (rec ? `\n${rec.name}` : "");
          btn.onclick = () => {
            const q = encodeURIComponent(`${rec ? rec.name : it.abbr} ${it.edition} call for papers deadline`)
              .replace(/'/g, "%27").replace(/"/g, "%22");
            openConfSearch(q, `${it.abbr} ${it.edition} ${it.kind} 마감`);
          };
          cell.appendChild(btn);
        });
        grid.appendChild(cell);
      }
    }

    $("#cal-prev").onclick = () => { cur.setMonth(cur.getMonth() - 1); render(); };
    $("#cal-next").onclick = () => { cur.setMonth(cur.getMonth() + 1); render(); };
    $("#cal-today").onclick = () => { cur = new Date(); cur.setDate(1); render(); };
    render();

    /* -------- upcoming deadlines list below the calendar -------- */
    const upList = $("#upcoming-list");
    if (upList) {
      const LIMIT = 12;
      const todayStr = fmt(new Date());
      const upcoming = dl.items
        .filter((it) => it.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date) || a.abbr.localeCompare(b.abbr));
      const moreBtn = $("#upcoming-more");
      let expanded = false;

      function searchFor(it) {
        const rec = byAbbr.get(it.abbr);
        const q = encodeURIComponent(`${rec ? rec.name : it.abbr} ${it.edition} call for papers deadline`)
          .replace(/'/g, "%27").replace(/"/g, "%22");
        openConfSearch(q, `${it.abbr} ${it.edition} ${it.kind} 마감`);
      }

      function drawUpcoming() {
        upList.innerHTML = "";
        const base = new Date(); base.setHours(0, 0, 0, 0);
        upcoming.slice(0, expanded ? upcoming.length : LIMIT).forEach((it) => {
          const d = new Date(it.date + "T00:00:00");
          const dday = Math.round((d - base) / 86400000);
          const rec = byAbbr.get(it.abbr);
          const li = el("li", "up-item");
          li.style.borderLeftColor = chipColor(it.abbr);
          li.innerHTML =
            `<div class="up-dday${dday <= 7 ? " near" : ""}">` +
              `${dday === 0 ? "D-Day" : "D-" + dday}` +
              `<span class="up-date">${it.date.replace(/-/g, ".")} (${"일월화수목금토"[d.getDay()]})</span>` +
            `</div>` +
            `<div class="up-body">` +
              `<div class="up-title"><b>${it.abbr} ${it.edition}</b>` +
                (rec ? `<span class="up-badge">${rec.subName}</span>` +
                       `<span class="pill grade-${rec.grade.toLowerCase()}">${rec.grade === "S" ? "S 최우수" : "A 우수"}</span>` +
                       `<span class="pill ${rec.major.toLowerCase()}">${rec.major}</span>` : "") +
                `<span class="up-badge est">📅 예상</span>` +
              `</div>` +
              `<p class="up-kind">${it.kind} 마감${it.note ? ` <span class="muted">(${it.note})</span>` : ""}</p>` +
              (rec ? `<p class="up-name">${rec.name}</p>` : "") +
            `</div>`;
          li.title = "클릭하면 검색 패널이 열립니다";
          li.onclick = () => searchFor(it);
          upList.appendChild(li);
        });
        moreBtn.hidden = upcoming.length <= LIMIT;
        moreBtn.textContent = expanded ? "접기 ▲" : `더 보기 (${upcoming.length - LIMIT}개) ▼`;
      }
      moreBtn.onclick = () => { expanded = !expanded; drawUpcoming(); };
      drawUpcoming();
    }
  }

  /* ---------------- view menu (대시보드 / 달력 / 목록) ---------------- */
  function initViews() {
    const tabs = document.querySelectorAll(".view-tabs button");
    const views = {
      dashboard: $("#view-dashboard"),
      calendar: $("#view-calendar"),
      list: $("#view-list"),
    };
    function show(name) {
      if (!views[name]) name = "dashboard";
      Object.entries(views).forEach(([k, v]) => { v.hidden = k !== name; });
      tabs.forEach((b) => b.classList.toggle("active", b.dataset.view === name));
      history.replaceState(null, "", "#" + name);
    }
    tabs.forEach((b) => { b.onclick = () => show(b.dataset.view); });
    window.addEventListener("hashchange", () => show(location.hash.slice(1)));
    show(location.hash.slice(1) || "dashboard");
  }

  /* ---------------- boot ---------------- */
  buildFilters();
  initConfSearch();
  initCalendar();
  initViews();
  refresh();
  initTheme();
})();
