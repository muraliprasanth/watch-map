/* Watch Map: an unofficial watch guide. Everything runs in the browser from data.js; no network requests. */
(function (root) {
  "use strict";

  /* ---------- pure helpers (also used by the tests) ---------- */
  function byId(titles) { var m = {}; titles.forEach(function (t) { m[t.id] = t; }); return m; }
  function cmpRelease(a, b) { return (a.release || "9999").localeCompare(b.release || "9999"); }
  /* A list of title ids in release order, or in story order (titles with no place in the story go last). */
  function inOrder(ids, map, order) {
    return ids.slice().sort(function (a, b) {
      var x = map[a], y = map[b];
      if (order === "story") {
        if (x.order !== null && y.order !== null && x.order !== y.order) return x.order - y.order;
        if (x.order === null && y.order !== null) return 1;
        if (y.order === null && x.order !== null) return -1;
      }
      return cmpRelease(x, y);
    });
  }

  /* Every title that must be seen first, following "need" links all the way back, in release order. */
  function chain(id, map) {
    var seen = {}, out = [];
    (function walk(x) {
      (map[x].need || []).forEach(function (n) { if (!seen[n]) { seen[n] = true; walk(n); out.push(n); } });
    })(id);
    return out.sort(function (a, b) { return cmpRelease(map[a], map[b]); });
  }
  function ordered(titles, mode) {
    var list = titles.slice();
    if (mode === "story") {
      return {
        main: list.filter(function (t) { return t.order !== null; }).sort(function (a, b) { return a.order - b.order; }),
        loose: list.filter(function (t) { return t.order === null; }).sort(cmpRelease)
      };
    }
    return { main: list.sort(cmpRelease), loose: [] };
  }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function niceDate(iso) {
    if (!iso) return "date to be announced";
    var p = iso.split("-");
    return Number(p[2]) + " " + MONTHS[Number(p[1]) - 1] + " " + p[0];
  }
  function length(t) {
    if (t.kind === "series") return t.episodes ? t.episodes + " episodes" : "episodes to be announced";
    if (!t.minutes) return "";
    if (t.minutes < 60) return t.minutes + " min";
    return Math.floor(t.minutes / 60) + " h " + (t.minutes % 60) + " min";
  }
  function totalMinutes(list) { return list.reduce(function (n, t) { return n + (t.minutes || 0); }, 0); }
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  var TENS = { 2: "twenty", 3: "thirty", 4: "forty", 5: "fifty", 6: "sixty", 7: "seventy", 8: "eighty", 9: "ninety" };
  function inWords(n) {
    if (n < 20 || n > 99) return String(n);
    var w = TENS[Math.floor(n / 10)] + (n % 10 ? "-" + WORDS[n % 10] : "");
    return w.charAt(0).toUpperCase() + w.slice(1);
  }
  /* What is still to watch from a list of ids, given the set of seen ids. */
  function left(ids, seen) { return ids.filter(function (id) { return !seen[id]; }); }
  /* A short sentence for a group of titles: "9 titles, about 20 hours of film plus 1 series season". */
  function describe(ids, map) {
    if (!ids.length) return "nothing";
    var films = ids.filter(function (x) { return map[x].kind !== "series"; }), seasons = ids.length - films.length;
    var hours = Math.round(totalMinutes(films.map(function (x) { return map[x]; })) / 60);
    var s = ids.length + (ids.length === 1 ? " title" : " titles");
    if (hours) s += ", about " + hours + (hours === 1 ? " hour" : " hours") + " of film";
    if (seasons) s += (hours ? " plus " : ", ") + seasons + " series season" + (seasons > 1 ? "s" : "");
    return s;
  }

  var api = { byId: byId, chain: chain, ordered: ordered, niceDate: niceDate, length: length, inWords: inWords, totalMinutes: totalMinutes, left: left, describe: describe, inOrder: inOrder };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  /* ---------- page ---------- */
  var doc = root.document, G = root.GUIDE, T = G.titles, MAP = byId(T);
  var state = { order: "release", kinds: { film: true, series: true, special: true }, selected: null, group: null };
  /* The tick list ("seen it") is optional. config.js switches it on or off for a whole copy of the site.
     With it off, nothing about what a visitor has watched is shown, asked for or stored. */
  var TICKS = !!(root.WATCHMAP && root.WATCHMAP.ticks);
  var seen = {};
  if (TICKS) {
    try { (JSON.parse(root.localStorage.getItem("watchmap.seen") || "[]") || []).forEach(function (id) { if (MAP[id]) seen[id] = true; }); } catch (e) { seen = {}; }
  }
  function saveSeen() { if (!TICKS) return; try { root.localStorage.setItem("watchmap.seen", JSON.stringify(Object.keys(seen))); } catch (e) { /* kept for this visit only */ } }

  var SVGNS = "http://www.w3.org/2000/svg";
  var KIND = { film: "Film", series: "Series", special: "Special" };
  var PHASES = ["One", "Two", "Three", "Four", "Five", "Six"];
  var calm = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(id) { return doc.getElementById(id); }
  function el(tag, attrs, text) {
    var n = doc.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function svg(tag, attrs, text) {
    var n = doc.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function go(target) { target.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" }); }

  /* ----- poster cards: a typographic card for one title, with a tick circle ----- */
  function poster(id, step) {
    var t = MAP[id], wrap = el("div", { "class": "poster-wrap" + (seen[id] ? " seen" : ""), "data-id": id });
    var b = el("button", { type: "button", "class": "poster" + (t.status === "upcoming" ? " soon" : "") + (state.selected === id ? " sel" : ""), "aria-label": t.title + ", " + KIND[t.kind] + ", " + niceDate(t.release) + ". Show what comes before it." });
    b.style.setProperty("--h", "var(--p" + t.phase + ")");
    b.appendChild(el("span", { "class": "yr", "aria-hidden": "true" }, t.release ? t.release.slice(2, 4) : "··"));
    if (step) b.appendChild(el("span", { "class": "step", "aria-hidden": "true" }, String(step)));
    var body = el("span", { "class": "body" });
    body.appendChild(el("span", { "class": "kind" }, t.status === "upcoming" ? "Not out yet" : KIND[t.kind]));
    body.appendChild(el("span", { "class": "ttl" }, t.title));
    body.appendChild(el("span", { "class": "len" }, (t.release ? t.release.slice(0, 4) : "Soon") + (length(t) ? " · " + length(t) : "")));
    b.appendChild(body);
    b.addEventListener("click", function () { select(id, true); });
    wrap.appendChild(b);
    if (TICKS && t.status !== "upcoming") {
      var k = el("button", { type: "button", "class": "tick", "aria-pressed": seen[id] ? "true" : "false", "aria-label": (seen[id] ? "Seen: " : "Mark as seen: ") + t.title, title: "Seen it" }, "✓");
      k.addEventListener("click", function (e) { e.stopPropagation(); toggleSeen(id); });
      wrap.appendChild(k);
    }
    return wrap;
  }
  function rail(ids, numbered) {
    var r = el("div", { "class": "rail" });
    ids.forEach(function (id, i) { r.appendChild(poster(id, numbered ? i + 1 : 0)); });
    return r;
  }

  function toggleSeen(id) {
    if (seen[id]) delete seen[id]; else seen[id] = true;
    saveSeen();
    Array.prototype.forEach.call(doc.querySelectorAll('.poster-wrap[data-id="' + id + '"]'), function (w) {
      w.classList.toggle("seen", !!seen[id]);
      var k = w.querySelector(".tick");
      if (k) { k.setAttribute("aria-pressed", seen[id] ? "true" : "false"); k.setAttribute("aria-label", (seen[id] ? "Seen: " : "Mark as seen: ") + MAP[id].title); }
    });
    if (nodes[id]) nodes[id].el.classList.toggle("seen", !!seen[id]);
    progress();
    if (state.selected) summary(state.selected);
  }

  function progress() {
    if (!TICKS) { $("progress").hidden = true; $("stats").hidden = false; return; }
    var out = T.filter(function (t) { return t.status === "released"; }), n = out.filter(function (t) { return seen[t.id]; }).length;
    $("progress").hidden = n === 0;
    $("stats").hidden = n !== 0;
    $("progress-fill").style.width = Math.round(n / out.length * 100) + "%";
    var rest = out.filter(function (t) { return !seen[t.id]; }).map(function (t) { return t.id; });
    $("progress-text").textContent = "You have seen " + n + " of " + out.length + " released titles. Left: " + describe(rest, MAP) + ".";
  }

  /* ----- the detail under "Before you watch" ----- */
  function summary(id) {
    var s = doc.getElementById("sum");
    if (!s) return;
    var all = chain(id, MAP), rest = left(all, seen);
    s.textContent = "";
    if (!all.length) { s.appendChild(doc.createTextNode("Nothing comes first. You can start here.")); return; }
    s.appendChild(doc.createTextNode("Before this: "));
    s.appendChild(el("b", null, describe(all, MAP)));
    s.appendChild(doc.createTextNode(!TICKS || rest.length === all.length ? "." : rest.length ? ". You have " + describe(rest, MAP) + " left." : ". You have seen all of it."));
  }
  function showDetail(id) {
    var t = MAP[id], box = $("detail"); box.textContent = ""; box.classList.remove("fade"); void box.offsetWidth; box.classList.add("fade");
    var top = el("div", { "class": "d-top" });
    top.appendChild(poster(id, 0));
    var info = el("div", { "class": "d-info" });
    info.appendChild(el("h3", null, t.title));
    var bits = [KIND[t.kind], niceDate(t.release), "Phase " + PHASES[t.phase - 1], t.saga + " Saga"];
    if (length(t)) bits.push(length(t));
    if (t.setIn) bits.push("set in " + t.setIn);
    info.appendChild(el("p", { "class": "meta" }, bits.join(" · ")));
    info.appendChild(el("p", { "class": "sum", id: "sum" }));
    var onMap = el("button", { type: "button", "class": "ghost" }, "Show on the map");
    onMap.addEventListener("click", function () { if (ON_MAP) { go($("map")); centre(id); } else root.location.href = "map.html#t=" + id; });
    info.appendChild(onMap);
    top.appendChild(info); box.appendChild(top);

    var all = chain(id, MAP);
    box.appendChild(el("p", { "class": "lbl" }, "Watch these first, in this order"));
    if (all.length) box.appendChild(rail(all, true)); else box.appendChild(el("p", { "class": "none" }, "Nothing. This one stands on its own."));
    if (t.nice.length) {
      box.appendChild(el("p", { "class": "lbl" }, "Adds colour, not required"));
      box.appendChild(rail(t.nice.slice().sort(function (a, b) { return cmpRelease(MAP[a], MAP[b]); }), false));
    }
    var cast = G.characters.filter(function (c) { return c["in"].indexOf(id) !== -1; });
    if (cast.length) {
      box.appendChild(el("p", { "class": "lbl" }, "With"));
      var row = el("div", { "class": "people" });
      cast.forEach(function (c) { row.appendChild(personChip(c, true)); });
      box.appendChild(row);
    }
    [t.note, t.fact].forEach(function (n) { if (n) box.appendChild(el("p", { "class": "flag" }, n)); });
    summary(id);
  }

  function select(id, scroll) {
    state.selected = id; state.group = null;
    $("before-select").value = id; $("hero-select").value = id;
    Array.prototype.forEach.call(doc.querySelectorAll(".poster.sel"), function (p) { p.classList.remove("sel"); });
    showDetail(id); paint(); caption(id);
    Array.prototype.forEach.call(doc.querySelectorAll('.poster-wrap[data-id="' + id + '"] .poster'), function (p) { p.classList.add("sel"); });
    if (scroll) go($("before"));
  }

  /* ----- the map ----- */
  var STEP = 124, PAD = 90, LANE = { film: 132, series: 322, special: 470 }, H = 540;
  var nodes = {}, edges = [], phaseX = {};
  /* The map page (map.html) is this same page with data-page="map": only the map is shown, and it is
     stretched to the height of the window, so one unit of the drawing is no longer one pixel. */
  var ON_MAP = doc.body.getAttribute("data-page") === "map";
  function scale() { var h = $("graph").getBoundingClientRect().height; return h > 0 ? h / H : 1; }

  function drawMap() {
    var g = $("graph"); g.textContent = ""; nodes = {}; edges = []; phaseX = {};
    var o = ordered(T, state.order), list = o.main.concat(o.loose), x = {}, i = 0;
    list.forEach(function (t, n) { if (o.loose.length && n === o.main.length) i += 1; x[t.id] = PAD + i * STEP; i += 1; });
    var W = PAD * 2 + (i - 1) * STEP;
    g.setAttribute("viewBox", "0 0 " + W + " " + H); g.setAttribute("width", W); g.setAttribute("height", H);

    if (state.order === "release") {
      var start = 0;
      for (var p = 1; p <= 6; p++) {
        var xs = list.filter(function (t) { return t.phase === p; }).map(function (t) { return x[t.id]; });
        if (!xs.length) continue;
        var a = Math.max(start, Math.min.apply(null, xs) - STEP / 2), b = Math.max.apply(null, xs) + STEP / 2;
        g.appendChild(svg("rect", { x: a, y: 0, width: b - a, height: H, "class": "band" + (p % 2 ? "" : " alt") }));
        g.appendChild(svg("text", { x: a + 18, y: 38, "class": "band-label" }, "Phase " + PHASES[p - 1]));
        phaseX[p] = a; start = b;
      }
    } else if (o.loose.length) {
      var lx = x[o.loose[0].id] - STEP / 2;
      g.appendChild(svg("rect", { x: lx, y: 0, width: W - lx, height: H, "class": "band alt" }));
      g.appendChild(svg("text", { x: lx + 18, y: 38, "class": "band-label" }, "Outside the main timeline"));
    }
    $("jump").hidden = state.order !== "release";

    var edgeLayer = svg("g"), nodeLayer = svg("g");
    g.appendChild(edgeLayer); g.appendChild(nodeLayer);
    list.forEach(function (t) {
      [["need", t.need], ["nice", t.nice]].forEach(function (pair) {
        pair[1].forEach(function (from) {
          var x1 = x[from], y1 = LANE[MAP[from].kind], x2 = x[t.id], y2 = LANE[t.kind], mid = (x1 + x2) / 2;
          var lift = y1 === y2 ? -Math.min(96, 24 + Math.abs(x2 - x1) * 0.1) : 0;
          var path = svg("path", { d: "M" + x1 + " " + y1 + " C" + mid + " " + (y1 + lift) + " " + mid + " " + (y2 + lift) + " " + x2 + " " + y2, "class": "edge" + (pair[0] === "nice" ? " hidden" : "") });
          edgeLayer.appendChild(path);
          edges.push({ from: from, to: t.id, type: pair[0], el: path });
        });
      });
    });
    var laneCount = { film: 0, series: 0, special: 0 };
    list.forEach(function (t) {
      var gx = x[t.id], gy = LANE[t.kind], up = laneCount[t.kind]++ % 2 === 0;
      var node = svg("g", { "class": "node " + t.kind + (t.status === "upcoming" ? " soon" : "") + (seen[t.id] ? " seen" : ""), tabindex: "0", role: "button", "aria-label": t.title + ", " + KIND[t.kind] + ", " + niceDate(t.release) });
      node.appendChild(svg("circle", { cx: gx, cy: gy, r: 9 }));
      /* names sit above the dot on two alternating levels so neighbours do not collide */
      var words = t.title.split(" "), l1 = "", l2 = "";
      words.forEach(function (w) { if ((l1 + " " + w).trim().length <= 20 && !l2) l1 = (l1 + " " + w).trim(); else l2 = (l2 + " " + w).trim(); });
      if (l2.length > 22) l2 = l2.slice(0, 20) + "…";
      var base = gy - (up ? 22 : 62) - (l2 ? 16 : 0);
      var label = svg("text", { x: gx, y: base, "text-anchor": "middle" });
      label.appendChild(svg("tspan", { x: gx, dy: 0 }, l1));
      if (l2) label.appendChild(svg("tspan", { x: gx, dy: 16 }, l2));
      node.appendChild(label);
      node.appendChild(svg("text", { x: gx, y: gy + 28, "text-anchor": "middle", "class": "date" }, t.release ? t.release.slice(0, 4) : "soon"));
      node.addEventListener("click", function () { if (!dragged) select(t.id, false); });
      node.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(t.id, false); } });
      nodeLayer.appendChild(node);
      nodes[t.id] = { el: node, x: gx };
    });
    [["film", "Films"], ["series", "Series"], ["special", "Specials"]].forEach(function (l) {
      g.appendChild(svg("text", { x: 18, y: LANE[l[0]] + 52, "class": "lane-label" }, l[1]));
    });
    $("order-note").textContent = state.order === "story" ? "Story order is approximate: sources disagree on several titles." : "";
    paint();
  }

  function paint() {
    var on = {}, nice = {}, sel = state.selected, groupSet = null;
    if (sel) { chain(sel, MAP).forEach(function (id) { on[id] = true; }); MAP[sel].nice.forEach(function (id) { nice[id] = true; }); }
    if (state.group) { groupSet = {}; state.group.forEach(function (id) { groupSet[id] = true; }); }
    $("graph").classList.toggle("dim", !!(sel || groupSet));
    T.forEach(function (t) {
      var c = nodes[t.id].el.classList;
      c.toggle("hidden", !state.kinds[t.kind]);
      c.toggle("sel", sel === t.id);
      c.toggle("on", !!on[t.id] || !!(groupSet && groupSet[t.id]));
      c.toggle("nice-on", !!nice[t.id] && !on[t.id]);
    });
    edges.forEach(function (e) {
      var visible = state.kinds[MAP[e.from].kind] && state.kinds[MAP[e.to].kind];
      var inChain = sel && e.type === "need" && (e.to === sel || on[e.to]) && on[e.from];
      var isNice = sel && e.type === "nice" && e.to === sel;
      e.el.classList.toggle("on", !!inChain);
      e.el.classList.toggle("nice-on", !!isNice);
      e.el.classList.toggle("hidden", !visible || (e.type === "nice" && !isNice));
    });
  }
  function centre(id) {
    var sc = $("map-scroll");
    sc.scrollTo({ left: Math.max(0, nodes[id].x * scale() - sc.clientWidth / 2), behavior: calm ? "auto" : "smooth" });
  }
  function caption(id) {
    var c = $("caption"), t = MAP[id]; c.textContent = "";
    c.appendChild(el("strong", null, t.title));
    c.appendChild(el("span", null, describe(chain(id, MAP), MAP) + " before it"));
    var b = el("button", { type: "button", "class": "ghost" }, "Open the full list");
    b.addEventListener("click", function () { if (ON_MAP) root.location.href = "index.html#t=" + id; else go($("before")); });
    c.appendChild(b);
    var x = el("button", { type: "button", "class": "ghost" }, "Clear");
    x.addEventListener("click", function () { state.selected = null; state.group = null; c.textContent = ""; paint(); });
    c.appendChild(x);
  }
  var dragged = false;
  function dragToPan(sc) {
    var down = false, startX = 0, startLeft = 0;
    sc.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") return; down = true; dragged = false; startX = e.clientX; startLeft = sc.scrollLeft; });
    sc.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 5) { dragged = true; sc.classList.add("drag"); }
      if (dragged) sc.scrollLeft = startLeft - dx;
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (n) {
      sc.addEventListener(n, function () { down = false; sc.classList.remove("drag"); root.setTimeout(function () { dragged = false; }, 0); });
    });
  }

  /* ----- the Sacred Timeline view of the map page: green strands behind the timeline (drawn by strands.js) ----- */
  var makeStrands = root.WatchStrands.makeStrands, ticker = root.WatchStrands.ticker;
  function still() { return (root.WATCHMAP && root.WATCHMAP.sacred && root.WATCHMAP.sacred.still) || ""; }

  /* On the map page, in the Sacred Timeline view: the strands move behind the timeline, and hold still while
     it is being scrolled or dragged. A copy of the site that names a picture shows it behind them, dimmed. */
  var mapStrands = null, mapTick = null, mapHold = 0, mapOn = false;
  /* how bright the strands are behind the map: well back, so titles and years in front of them can be read */
  function GAIN() { return still() ? 0.3 : 0.42; }
  function strands(on) {
    if (!mapStrands) {
      mapStrands = makeStrands($("strands"));
      if (!mapStrands) return;
      mapTick = ticker(function (now, dt) { if (now < mapHold) return; mapStrands.t += dt; mapStrands.draw(GAIN(), 1); });
      root.addEventListener("resize", function () { if (mapOn) { mapStrands.size(); mapStrands.draw(GAIN(), 1); } });
      $("map-scroll").addEventListener("scroll", function () { mapHold = root.performance.now() + 140; }, { passive: true });
    }
    mapOn = on;
    if (on) { mapStrands.size(); mapStrands.draw(GAIN(), 1); if (!calm) mapTick.start(); }
    else { mapTick.stop(); mapStrands.ctx.clearRect(0, 0, mapStrands.w, mapStrands.h); }
  }

  /* On the map page the wheel of a mouse moves the timeline sideways (it has nowhere to go up or down). */
  function wheelSideways(sc) {
    sc.addEventListener("wheel", function (e) {
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;       /* zooming, or already sideways */
      var page = doc.documentElement;
      if (page.scrollHeight > root.innerHeight + 2 && page.getAttribute("data-theme") !== "green") return; /* the page itself still scrolls */
      sc.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 32 : 1);
      e.preventDefault();
    }, { passive: false });
  }

  /* ----- groups: watch paths and characters ----- */
  function press(selector, target) {
    Array.prototype.forEach.call(doc.querySelectorAll(selector), function (b) { b.setAttribute("aria-pressed", b === target ? "true" : "false"); });
  }
  function showGroup(boxId, heading, why, ids, numbered, about) {
    state.group = ids; state.selected = null; $("caption").textContent = "";
    var box = $(boxId); box.textContent = ""; box.classList.remove("fade"); void box.offsetWidth; box.classList.add("fade");
    box.appendChild(el("h3", null, heading));
    if (about) box.appendChild(el("p", { "class": "about" }, about));
    box.appendChild(el("p", { "class": "meta" }, (why ? why + " " : "") + describe(ids, MAP) + (TICKS ? "; " + describe(left(ids, seen), MAP) + " left for you." : ".")));
    box.appendChild(rail(ids, numbered));
    paint();
  }
  function showPerson(ch) {
    var ids = inOrder(ch["in"], MAP, state.order);
    showGroup("people-detail", ch.name, ch.alias + ". " + (state.order === "story" ? "In story order." : "In release order."), ids, false, ch.bio);
  }
  function personChip(ch, small) {
    var b = el("button", { type: "button", "class": "person", "aria-pressed": "false" });
    b.appendChild(el("span", { "class": "ini", "aria-hidden": "true" }, ch.name.split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase()));
    b.appendChild(doc.createTextNode(ch.name));
    b.addEventListener("click", function () {
      var main = doc.querySelector('#people-chips .person[data-id="' + ch.id + '"]');
      press("#people-chips .person", main); press("#path-cards .card", null); $("path-detail").textContent = "";
      state.person = ch;
      showPerson(ch);
      if (small) go($("people"));
    });
    if (!small) b.setAttribute("data-id", ch.id);
    return b;
  }

  function fillSelect(sel) {
    sel.textContent = "";
    sel.appendChild(el("option", { value: "" }, "Choose a title…"));
    [["film", "Films"], ["series", "Series"], ["special", "Specials"]].forEach(function (k) {
      var og = el("optgroup", { label: k[1] });
      T.filter(function (t) { return t.kind === k[0]; }).sort(function (a, b) { return a.title.localeCompare(b.title); })
        .forEach(function (t) { og.appendChild(el("option", { value: t.id }, t.title + (t.status === "upcoming" ? " (not out yet)" : ""))); });
      sel.appendChild(og);
    });
  }

  /* ----- hero: slow drifting threads, drawn on a canvas ----- */
  function sky() {
    var c = $("sky"), ctx = c.getContext && c.getContext("2d");
    if (!ctx) return;
    var pts = [], w = 0, h = 0, raf = 0, running = false;
    function size() {
      var r = c.getBoundingClientRect(), d = Math.min(2, root.devicePixelRatio || 1);
      w = r.width; h = r.height; c.width = w * d; c.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      var n = Math.round(Math.min(70, Math.max(26, w * h / 16000)));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22, r: 1 + Math.random() * 2.2, gold: Math.random() < 0.3 });
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20; if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
          if (d2 < 21000) { ctx.strokeStyle = "rgba(229,56,59," + (0.34 * (1 - d2 / 21000)).toFixed(3) + ")"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        ctx.fillStyle = p.gold ? "rgba(246,196,83,0.85)" : "rgba(229,56,59,0.8)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      if (running) raf = root.requestAnimationFrame(frame);
    }
    function run(on) { if (on && !running) { running = true; raf = root.requestAnimationFrame(frame); } else if (!on && running) { running = false; root.cancelAnimationFrame(raf); } }
    size(); frame();
    root.addEventListener("resize", function () { size(); if (!running) frame(); });
    if (calm) return;                      /* reduced motion: one still frame */
    if ("IntersectionObserver" in root) new root.IntersectionObserver(function (es) { run(es[0].isIntersecting && !doc.hidden); }).observe(c); else run(true);
    doc.addEventListener("visibilitychange", function () { if (doc.hidden) run(false); });
  }

  function start() {
    var films = T.filter(function (t) { return t.kind === "film"; }), out = T.filter(function (t) { return t.status === "released"; });
    $("count").textContent = inWords(T.length);
    $("checked").textContent = niceDate(G.checked);
    var st = $("stats");
    [[films.length, "films"], [T.filter(function (t) { return t.kind === "series"; }).length, "series seasons"], [T.filter(function (t) { return t.kind === "special"; }).length, "specials"],
      [Math.round(totalMinutes(films.filter(function (t) { return t.status === "released"; })) / 60), "hours of released films"], [T.length - out.length, "still to come"]].forEach(function (p) {
      var s = el("span"); s.appendChild(el("b", null, String(p[0]))); s.appendChild(doc.createTextNode(p[1])); st.appendChild(s);
    });
    fillSelect($("hero-select")); fillSelect($("before-select"));
    $("hero-pick").addEventListener("submit", function (e) { e.preventDefault(); var v = $("hero-select").value; if (v) select(v, true); });
    $("before-select").addEventListener("change", function (e) { if (e.target.value) select(e.target.value, false); });

    for (var p = 1; p <= 6; p++) {
      var group = T.filter(function (t) { return t.phase === p; }).sort(cmpRelease);
      if (!group.length) continue;
      var row = el("div", { "class": "phase-row reveal" }), h = el("h3");
      row.style.setProperty("--h", "var(--p" + p + ")");
      h.appendChild(el("i", { "aria-hidden": "true" }));
      h.appendChild(doc.createTextNode("Phase " + PHASES[p - 1]));
      h.appendChild(el("small", null, group.length + " titles · " + group[0].saga + " Saga · " + group[0].release.slice(0, 4) + " to " + (group[group.length - 1].release || "soon").slice(0, 4)));
      row.appendChild(h); row.appendChild(rail(group.map(function (t) { return t.id; }), false));
      $("phase-rails").appendChild(row);
      (function (n) {
        var j = el("button", { type: "button", "class": "chip" }, "Phase " + PHASES[n - 1]);
        j.addEventListener("click", function () { $("map-scroll").scrollTo({ left: Math.max(0, (phaseX[n] || 0) * scale() - 10), behavior: calm ? "auto" : "smooth" }); });
        $("jump").appendChild(j);
      })(p);
    }

    Array.prototype.forEach.call(doc.querySelectorAll(".seg button"), function (b) {
      b.addEventListener("click", function () {
        state.order = b.getAttribute("data-order");
        /* the switch appears twice (by the map and by the characters): both show the same choice */
        Array.prototype.forEach.call(doc.querySelectorAll(".seg button"), function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-order") === state.order ? "true" : "false"); });
        drawMap(); if (state.person) showPerson(state.person); if (state.selected) centre(state.selected);
      });
    });
    Array.prototype.forEach.call(doc.querySelectorAll(".chip[data-kind]"), function (b) {
      b.addEventListener("click", function () { var k = b.getAttribute("data-kind"); state.kinds[k] = !state.kinds[k]; b.setAttribute("aria-pressed", state.kinds[k] ? "true" : "false"); paint(); });
    });
    dragToPan($("map-scroll"));
    if (ON_MAP) wheelSideways($("map-scroll"));

    G.paths.forEach(function (pth) {
      var c = el("button", { type: "button", "class": "card reveal", "aria-pressed": "false" });
      c.appendChild(el("b", null, pth.name)); c.appendChild(el("span", null, pth.why)); c.appendChild(el("i", null, describe(pth.titles, MAP)));
      c.addEventListener("click", function () { press("#path-cards .card", c); press("#people-chips .person", null); $("people-detail").textContent = ""; state.person = null; showGroup("path-detail", pth.name, pth.why, pth.titles, true); });
      $("path-cards").appendChild(c);
    });
    G.characters.forEach(function (ch) { $("people-chips").appendChild(personChip(ch, false)); });

    drawMap(); progress(); sky();
    if (ON_MAP) {
      if (still()) doc.documentElement.style.setProperty("--green-still", 'url("' + still() + '")');
      strands(doc.documentElement.getAttribute("data-theme") === "green");
      doc.addEventListener("themechange", function (e) { strands(e.detail === "green"); });
    }
    if ("IntersectionObserver" in root && !calm) {
      var io = new root.IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
      Array.prototype.forEach.call(doc.querySelectorAll(".reveal"), function (n) { io.observe(n); });
    } else Array.prototype.forEach.call(doc.querySelectorAll(".reveal"), function (n) { n.classList.add("in"); });

    /* A link such as map.html#t=loki-s2 opens on that title. The address can also change while the page is
       already open (the Back and Forward buttons). */
    function fromHash() {
      var hash = (root.location.hash || "").replace("#t=", "");
      if (!MAP[hash]) return;
      select(hash, !ON_MAP);
      if (ON_MAP) root.setTimeout(function () { centre(hash); }, 60); /* after the map has its size */
    }
    fromHash();
    root.addEventListener("hashchange", fromHash);
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start); else start();
})(typeof window !== "undefined" ? window : globalThis);
