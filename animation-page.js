/* The Animation page: two scenes that take over the window.
   "Check where is Loki": one green thread opens into the whole timeline (strands.js), and a button leads to
   the map's Sacred Timeline view.
   "I am Iron Man": the snap. The page turns to dust and nothing is left; then one picture comes together
   out of the dust. "Reverse the snap" turns it to dust again and brings the other picture.
   It opens with a plain hand snapping its fingers (drawHand).
   The pictures are this guide's own two moving scenes, a citadel at night in black and green and a reactor
   of coils and light whose ring reads "Proof that Tony Stark has a heart" (see card); they are scenery and
   a device, and draw no character. A copy of the site may name its own in config.js:
     window.WATCHMAP.snap   = { doom: "<picture>", ironman: "<picture>" }
     window.WATCHMAP.sacred = { still: "<picture>", video: "<video>" }   (the Loki scene then starts from the
                              picture, which comes apart into threads, and ends with the video in a 1.90:1 frame)
     window.WATCHMAP.sacred = { youtube: "<video id>" }   (the Loki scene ends with that video in YouTube's own
                              player, framed from youtube-nocookie.com, and a button that opens it on YouTube;
                              the site hosts nothing)
   Someone who asked their device for less motion gets each end state at once. */
(function (root) {
  "use strict";
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  /* The window as a grid of small squares, about `cap` of them: the squares a picture breaks into. */
  function grid(w, h, cap) {
    var g = Math.max(4, Math.ceil(Math.sqrt(w * h / cap)));
    return { g: g, cols: Math.ceil(w / g), rows: Math.ceil(h / g) };
  }
  /* When, from 0 to 1, the square in column `c` lets go: a sweep across the window, a little ragged. */
  function letGo(c, cols, noise, fromRight) {
    var u = cols > 1 ? c / (cols - 1) : 0;
    if (fromRight) u = 1 - u;
    return clamp(u * 0.7 + noise * 0.1);
  }
  /* Where a picture of iw by ih sits when it covers a window of w by h. */
  function cover(iw, ih, w, h) {
    var k = Math.max(w / iw, h / ih);
    return { x: (w - iw * k) / 2, y: (h - ih * k) / 2, w: iw * k, h: ih * k };
  }
  /* The same "random" number for the same n, every time: the scenes are drawn from the clock alone, so a
     frame can be drawn again exactly (for the dust to be cut from it). */
  function rnd(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  /* The storm's lightning: one strike every 2.6 seconds, lit for the first 0.28 of them.
     Gives which strike it is, and how far through its light it is (0 to 1), or -1 when the sky is dark. */
  function strike(t) {
    var every = 2.6, lit = 0.28, n = Math.floor(t / every), age = t - n * every;
    return { n: n, glow: age < lit ? age / lit : -1 };
  }
  /* A YouTube video id, and nothing else: eleven letters, digits, - or _. Anything else gives "". */
  function youtubeId(v) { return typeof v === "string" && /^[A-Za-z0-9_-]{11}$/.test(v) ? v : ""; }
  /* The finger snap that opens the "I am Iron Man" scene. The fingers press together until SNAP_AT seconds,
     then let go. Gives how hard they are pressed (0 to 1), and the seconds since the snap (-1 before it). */
  var SNAP_AT = 0.7;
  function snapPose(t) {
    if (t < SNAP_AT) { var p = clamp(t / SNAP_AT); return { press: p * p * (3 - 2 * p), since: -1 }; }
    return { press: 0, since: t - SNAP_AT };
  }
  var api = { grid: grid, letGo: letGo, cover: cover, clamp: clamp, rnd: rnd, strike: strike, youtubeId: youtubeId, snapPose: snapPose, SNAP_AT: SNAP_AT };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  var doc = root.document, S = root.WatchStrands, cfg = root.WATCHMAP || {};
  var calm = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(id) { return doc.getElementById(id); }
  var stage = $("stage"), canvas = $("stage-canvas"), video = $("stage-video"), frame = $("stage-frame");
  var tools = { watch: $("stage-watch"), door: $("stage-door"), reverse: $("stage-reverse"), snap: $("stage-snap"), back: $("stage-back"), home: $("stage-home") };
  var st = S.makeStrands(canvas);
  if (!st) return;
  var ctx = st.ctx, FLIGHT = 0.24;
  var scene = null; /* what is playing: { step(t), ... } */
  var t0 = 0;
  var tick = S.ticker(function (now, dt) { st.t += dt; if (scene) scene.step((now - t0) / 1000); });
  function show(names) { Object.keys(tools).forEach(function (k) { tools[k].hidden = names.indexOf(k) === -1; }); }
  function begin(next) { scene = next; t0 = root.performance.now(); if (calm) next.step(99); else tick.start(); }

  /* ---------- the pictures ---------- */
  /* The guide's own two scenes, drawn to fill the window at time t (seconds). They are abstract on purpose:
     a turning reactor of light, and a green storm. Neither draws a character.
     Each frame depends only on t, so the frame the dust is cut from can be drawn again exactly. */
  function card(o, w, h, kind, t) {
    var u = Math.min(w, h), g, i, j, a, r, x, y, k;
    o.globalAlpha = 1; o.globalCompositeOperation = "source-over"; o.shadowBlur = 0;
    o.fillStyle = "#000"; o.fillRect(0, 0, w, h);
    o.textAlign = "center"; o.textBaseline = "middle"; o.lineCap = "round";
    if (kind === "doom") {
      /* Night over a citadel on a crag, all black and green: fog rolling, windows burning green, green
         lightning behind the towers, embers rising, and the word in iron. It is a place, not a person. */
      var s = strike(t), flash = s.glow < 0 ? 0 : (1 - s.glow) * (0.55 + 0.45 * rnd(s.n * 9 + Math.floor(s.glow * 6)));
      var breath = 0.5 + 0.5 * Math.sin(t * 0.8), base = h * 0.78;
      g = o.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgb(" + Math.round(2 + 20 * flash) + "," + Math.round(6 + 60 * flash) + "," + Math.round(4 + 34 * flash) + ")");
      g.addColorStop(0.6, "rgb(" + Math.round(5 + 26 * flash) + "," + Math.round(20 + 80 * flash) + "," + Math.round(12 + 44 * flash) + ")"); g.addColorStop(1, "#010302");
      o.fillStyle = g; o.fillRect(0, 0, w, h);
      /* a sick green glow low in the sky behind the towers */
      g = o.createRadialGradient(w * 0.5, base, 0, w * 0.5, base, u * (0.8 + 0.06 * breath));
      g.addColorStop(0, "rgba(70,200,110," + (0.34 + 0.1 * breath + 0.3 * flash).toFixed(3) + ")"); g.addColorStop(0.5, "rgba(20,90,50,0.16)"); g.addColorStop(1, "rgba(0,0,0,0)");
      o.fillStyle = g; o.fillRect(0, 0, w, h);
      /* lightning behind the citadel: forks from the top, the same shape for the whole of one strike */
      if (flash > 0) {
        var fork = function (x0, y0, len, seed, width) {
          var px = x0, py = y0, steps = 13, jj;
          o.beginPath(); o.moveTo(px, py);
          for (jj = 1; jj <= steps; jj++) { px += (rnd(seed + jj * 3.1) - 0.5) * u * 0.11; py += len / steps; o.lineTo(px, py); if (jj === 6 && width > 2) fork.branch = [px, py]; }
          o.lineWidth = width; o.stroke();
        };
        o.strokeStyle = "rgba(200,255,214," + flash.toFixed(3) + ")"; o.shadowColor = "rgba(90,255,150,0.95)"; o.shadowBlur = u * 0.035;
        x = w * (0.16 + 0.68 * rnd(s.n * 5 + 1));
        fork(x, 0, h * (0.42 + 0.2 * rnd(s.n * 5 + 2)), s.n * 17, Math.max(2.5, u * 0.006));
        if (fork.branch) fork(fork.branch[0], fork.branch[1], h * 0.22, s.n * 17 + 400, Math.max(1.2, u * 0.003));
        o.shadowBlur = 0;
      }
      /* the citadel: a crag, a keep, and towers of uneven height with battlements, black against the glow */
      o.fillStyle = "#020403";
      o.beginPath(); o.moveTo(0, h); o.lineTo(0, base + u * 0.08); o.lineTo(w * 0.18, base + u * 0.03); o.lineTo(w * 0.3, base - u * 0.02);
      o.lineTo(w * 0.7, base - u * 0.02); o.lineTo(w * 0.84, base + u * 0.04); o.lineTo(w, base + u * 0.09); o.lineTo(w, h); o.closePath(); o.fill();
      var towers = [[0.3, 0.07, 0.34], [0.375, 0.05, 0.5], [0.43, 0.14, 0.4], [0.57, 0.06, 0.62], [0.63, 0.07, 0.36], [0.5, 0.045, 0.74]];
      for (i = 0; i < towers.length; i++) {
        var tx = w * towers[i][0], tw = u * towers[i][1] * 1.6, th = u * towers[i][2] * 0.62, ty = base - th, teeth = 4, cw = tw / (teeth * 2 - 1);
        o.fillRect(tx - tw / 2, ty, tw, th + u * 0.02);
        for (j = 0; j < teeth; j++) o.fillRect(tx - tw / 2 + j * 2 * cw, ty - cw * 0.9, cw, cw);            /* battlements */
        if (i === 3 || i === 5) { o.beginPath(); o.moveTo(tx - tw / 2, ty - cw * 0.9); o.lineTo(tx, ty - tw * 1.5); o.lineTo(tx + tw / 2, ty - cw * 0.9); o.closePath(); o.fill(); } /* two spires */
      }
      /* windows burning green, each flickering to its own beat */
      for (i = 0; i < towers.length; i++) {
        var wx = w * towers[i][0], wh = u * towers[i][2] * 0.62;
        for (j = 0; j < 3; j++) {
          var lit = 0.45 + 0.55 * Math.abs(Math.sin(t * (1.1 + rnd(i * 7 + j)) + i * 3 + j));
          if (rnd(i * 11 + j * 5) < 0.3) continue; /* some stay dark */
          o.fillStyle = "rgba(120,255,160," + (0.75 * lit).toFixed(3) + ")"; o.shadowColor = "rgba(90,255,150,0.9)"; o.shadowBlur = u * 0.012;
          o.fillRect(wx - u * 0.006, base - wh * (0.82 - 0.26 * j), u * 0.012, u * 0.026);
        }
      }
      o.shadowBlur = 0;
      /* fog, in slow green banks, thickest at the foot of the crag */
      for (i = 0; i < 9; i++) {
        x = w * (0.5 + 0.7 * Math.sin(t * (0.04 + 0.013 * i) + i * 2.3)); y = base + u * (0.02 * i - 0.05) + u * 0.012 * Math.sin(t * 0.3 + i);
        var fr = u * (0.4 + 0.3 * rnd(i + 3));
        g = o.createRadialGradient(x, y, 0, x, y, fr);
        g.addColorStop(0, "rgba(60,150,95," + (0.2 + 0.12 * flash).toFixed(3) + ")"); g.addColorStop(1, "rgba(60,150,95,0)");
        o.fillStyle = g; o.beginPath(); o.ellipse(x, y, fr * 1.9, fr * 0.36, 0, 0, 6.2832); o.fill();
      }
      /* embers climbing */
      for (i = 0; i < 60; i++) {
        var life = (t * (0.04 + 0.06 * rnd(i + 50)) + rnd(i + 90)) % 1;
        x = w * rnd(i + 20) + Math.sin(t * 0.8 + i) * u * 0.02; y = h * (1.05 - life * 1.15);
        o.fillStyle = "rgba(140,255,180," + (0.6 * Math.sin(life * 3.1416)).toFixed(3) + ")";
        o.fillRect(x, y, 1.2 + 2 * rnd(i + 70), 1.2 + 2 * rnd(i + 70));
      }
      /* the word, iron with a green edge of light, above the gate */
      o.font = "400 " + Math.round(u * 0.26) + "px Anton, Impact, sans-serif";
      o.shadowColor = "rgba(90,255,150," + (0.6 + 0.2 * breath + 0.2 * flash).toFixed(3) + ")"; o.shadowBlur = u * (0.045 + 0.04 * flash);
      g = o.createLinearGradient(0, h * 0.16, 0, h * 0.44);
      g.addColorStop(0, flash > 0.4 ? "#f1fff5" : "#c4cec8"); g.addColorStop(0.55, "#6c7a72"); g.addColorStop(1, "#27302b");
      o.fillStyle = g; o.fillText("DOOM", w / 2, h * 0.3);
      o.shadowBlur = 0;
      return;
    }
    /* The reactor, drawn after the well-known prop: a ring of metal engraved with a line of words, ten coils
       wound in copper turning round a ring of blue-white light, finer rings inside, and a bright core. */
    var cx = w / 2, cy = h * 0.4, R = u * 0.27, beat = 0.5 + 0.5 * Math.sin(t * 2.2), n;
    /* words along a circle: each letter turned to sit on it. Over the top they run clockwise; along the bottom
       they run the other way, so both read left to right. */
    var arcText = function (text, radius, mid, top, size) {
      o.font = "400 " + Math.round(size) + "px Anton, Impact, sans-serif"; o.textAlign = "center"; o.textBaseline = "middle";
      var widths = [], total = 0, c, ang;
      for (c = 0; c < text.length; c++) { widths.push(o.measureText(text[c]).width + size * 0.16); total += widths[c]; }
      ang = mid - (top ? 1 : -1) * total / radius / 2;
      for (c = 0; c < text.length; c++) {
        var half = widths[c] / radius / 2; ang += (top ? 1 : -1) * half;
        o.save(); o.translate(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius); o.rotate(ang + (top ? 1 : -1) * Math.PI / 2); o.fillText(text[c], 0, 0); o.restore();
        ang += (top ? 1 : -1) * half;
      }
    };
    /* the light it throws */
    g = o.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * (2.6 + 0.3 * beat));
    g.addColorStop(0, "rgba(120,220,255," + (0.55 + 0.2 * beat).toFixed(3) + ")"); g.addColorStop(0.45, "rgba(20,90,170,0.22)"); g.addColorStop(1, "rgba(0,0,0,0)");
    o.fillStyle = g; o.fillRect(0, 0, w, h);
    /* the engraved ring of metal */
    g = o.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    g.addColorStop(0, "#f2f4f6"); g.addColorStop(0.35, "#aeb6bf"); g.addColorStop(0.6, "#e6eaee"); g.addColorStop(1, "#7d8791");
    o.fillStyle = g; o.beginPath(); o.arc(cx, cy, R, 0, 6.2832); o.arc(cx, cy, R * 0.74, 0, 6.2832, true); o.fill("evenodd");
    o.strokeStyle = "rgba(30,38,48,0.55)"; o.lineWidth = Math.max(1, u * 0.003);
    o.beginPath(); o.arc(cx, cy, R, 0, 6.2832); o.stroke(); o.beginPath(); o.arc(cx, cy, R * 0.74, 0, 6.2832); o.stroke();
    o.fillStyle = "#1c2430";
    arcText("PROOF THAT TONY STARK", R * 0.87, -Math.PI / 2, true, R * 0.105);
    arcText("HAS A HEART", R * 0.87, Math.PI / 2, false, R * 0.105);
    /* the dark body under the coils */
    o.fillStyle = "#0a1016"; o.beginPath(); o.arc(cx, cy, R * 0.74, 0, 6.2832); o.fill();
    /* the ring of light the coils sit on */
    o.shadowColor = "#7fe3ff"; o.shadowBlur = u * 0.03;
    o.strokeStyle = "rgba(190,245,255," + (0.85 + 0.15 * beat).toFixed(3) + ")"; o.lineWidth = R * 0.11;
    o.beginPath(); o.arc(cx, cy, R * 0.57, 0, 6.2832); o.stroke();
    o.shadowBlur = 0;
    /* ten coils wound in copper, turning slowly; each has its windings drawn across it */
    for (i = 0; i < 10; i++) {
      a = i / 10 * 6.2832 + t * 0.35;
      o.save(); o.translate(cx, cy); o.rotate(a);
      g = o.createLinearGradient(R * 0.46, 0, R * 0.7, 0); g.addColorStop(0, "#7a3d1c"); g.addColorStop(0.5, "#e08a4e"); g.addColorStop(1, "#8a4722");
      o.fillStyle = g; o.fillRect(R * 0.47, -R * 0.085, R * 0.22, R * 0.17);
      o.strokeStyle = "rgba(50,22,8,0.75)"; o.lineWidth = Math.max(1, R * 0.008);
      for (n = 1; n < 7; n++) { o.beginPath(); o.moveTo(R * 0.47 + R * 0.22 * n / 7, -R * 0.085); o.lineTo(R * 0.47 + R * 0.22 * n / 7, R * 0.085); o.stroke(); }
      o.fillStyle = "#cfd6dd"; o.fillRect(R * 0.455, -R * 0.095, R * 0.02, R * 0.19); o.fillRect(R * 0.685, -R * 0.095, R * 0.02, R * 0.19); /* the plates at each end */
      o.restore();
    }
    /* finer rings inside, the middle one in short segments turning the other way */
    o.strokeStyle = "rgba(120,215,255,0.9)"; o.lineWidth = Math.max(1.5, R * 0.018);
    o.beginPath(); o.arc(cx, cy, R * 0.4, 0, 6.2832); o.stroke();
    o.lineWidth = Math.max(2, R * 0.04);
    for (i = 0; i < 18; i++) { a = i / 18 * 6.2832 - t * 0.6; o.beginPath(); o.arc(cx, cy, R * 0.32, a, a + 0.2); o.stroke(); }
    o.lineWidth = Math.max(1.5, R * 0.018); o.beginPath(); o.arc(cx, cy, R * 0.24, 0, 6.2832); o.stroke();
    /* arcs of current sweeping round between the rings */
    o.strokeStyle = "#ffffff"; o.lineWidth = Math.max(1.5, R * 0.014);
    for (i = 0; i < 3; i++) { a = t * (1.5 + 0.5 * i) + i * 2.1; o.beginPath(); o.arc(cx, cy, R * (0.27 + 0.065 * i), a, a + 0.6 + 0.3 * Math.sin(t * 3 + i)); o.stroke(); }
    /* the core */
    o.shadowColor = "#9eeaff"; o.shadowBlur = u * (0.05 + 0.03 * beat);
    g = o.createRadialGradient(cx, cy, 0, cx, cy, R * 0.2);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.6, "#d6f6ff"); g.addColorStop(1, "#6fd4ff");
    o.fillStyle = g; o.beginPath(); o.arc(cx, cy, R * (0.17 + 0.012 * beat), 0, 6.2832); o.fill();
    o.shadowBlur = 0;
    /* sparks: each leaves the ring, flies out and fades, again and again */
    for (i = 0; i < 70; i++) {
      var out = (t * (0.18 + 0.3 * rnd(i + 11)) + rnd(i + 31)) % 1;
      a = rnd(i + 5) * 6.2832 + out * (rnd(i + 8) - 0.5) * 1.2; r = R * (1.02 + out * 1.5);
      o.fillStyle = "rgba(" + Math.round(150 + 90 * rnd(i + 2)) + ",235,255," + ((1 - out) * 0.9).toFixed(3) + ")";
      o.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.5 + 2.2 * rnd(i + 61), 1.5 + 2.2 * rnd(i + 61));
    }
    o.textAlign = "center"; o.textBaseline = "middle";
    o.font = "400 " + Math.round(u * 0.085) + "px Anton, Impact, sans-serif";
    o.shadowColor = "#ff3b2f"; o.shadowBlur = u * 0.03;
    o.fillStyle = "#ff4a3d"; o.fillText("I AM IRON MAN", w / 2, h * 0.775);
    o.shadowBlur = 0;
  }
  /* A picture at the size of the window, as a canvas: the copy's own if it names one, else the drawn card. */
  function picture(kind, done) {
    var off = doc.createElement("canvas"), o;
    off.width = Math.max(1, Math.round(st.w)); off.height = Math.max(1, Math.round(st.h));
    o = off.getContext("2d");
    var src = cfg.snap && cfg.snap[kind];
    var mine = kind === "ironman" ? "iron" : "doom";
    if (!src) { card(o, off.width, off.height, mine, 0); done(off, true); return; }
    var im = new root.Image();
    im.onload = function () { var f = cover(im.width, im.height, off.width, off.height); o.fillStyle = "#000"; o.fillRect(0, 0, off.width, off.height); o.drawImage(im, f.x, f.y, f.w, f.h); done(off, false); };
    im.onerror = function () { card(o, off.width, off.height, mine, 0); done(off, true); };
    im.src = src;
  }

  /* ---------- dust ---------- */
  /* A picture going to dust (incoming false) or coming together out of dust (incoming true). */
  function makeDust(pic, incoming, fromRight) {
    var w = pic.width, h = pic.height, gr = grid(w, h, 26000), g = gr.g;
    var data = pic.getContext("2d").getImageData(0, 0, w, h).data;
    var mask = doc.createElement("canvas"); mask.width = w; mask.height = h;
    var m = mask.getContext("2d"), cells = [];
    for (var r = 0; r < gr.rows; r++) {
      for (var c = 0; c < gr.cols; c++) {
        var px = Math.min(w - 1, c * g + (g >> 1)), py = Math.min(h - 1, r * g + (g >> 1)), i = (py * w + px) * 4;
        var bright = data[i] + data[i + 1] + data[i + 2];
        cells.push({ x: c * g, y: r * g, at: letGo(c, gr.cols, Math.random(), fromRight), col: "rgb(" + data[i] + "," + data[i + 1] + "," + data[i + 2] + ")",
          fly: bright > 40 && Math.random() < 0.5, vx: (0.3 + Math.random()) * (fromRight ? -1 : 1), vy: -(0.05 + Math.random() * 0.8), wob: Math.random() * 6.283 });
      }
    }
    cells.sort(function (a, b) { return a.at - b.at; });
    m.fillStyle = "#000";
    if (incoming) m.fillRect(0, 0, w, h); /* all of it hidden to begin with */
    return { pic: pic, mask: mask, m: m, cells: cells, g: g, shown: 0, launched: 0, flying: [], incoming: incoming, reach: Math.max(w, h) * 0.22 };
  }
  /* Draw the dust at p, from 0 (untouched) to about 1.05 (finished). */
  function drawDust(d, p) {
    var c, i, q, x, y, s = Math.max(2, d.g * 0.62);
    if (d.incoming) { /* a grain flies in, and its square shows when it lands */
      while (d.launched < d.cells.length && d.cells[d.launched].at - FLIGHT <= p) { c = d.cells[d.launched++]; if (c.fly) d.flying.push(c); }
      while (d.shown < d.cells.length && d.cells[d.shown].at <= p) { c = d.cells[d.shown++]; d.m.clearRect(c.x, c.y, d.g, d.g); }
    } else { /* a square goes, and its grain flies off */
      while (d.shown < d.cells.length && d.cells[d.shown].at <= p) { c = d.cells[d.shown++]; d.m.fillRect(c.x, c.y, d.g, d.g); if (c.fly) d.flying.push(c); }
    }
    ctx.clearRect(0, 0, st.w, st.h);
    ctx.drawImage(d.pic, 0, 0);
    ctx.globalCompositeOperation = "destination-out"; ctx.drawImage(d.mask, 0, 0); ctx.globalCompositeOperation = "source-over";
    for (i = d.flying.length - 1; i >= 0; i--) {
      c = d.flying[i];
      q = d.incoming ? 1 - clamp((p - (c.at - FLIGHT)) / FLIGHT) : clamp((p - c.at) / FLIGHT); /* how far from home, 0 to 1 */
      if ((d.incoming && q <= 0) || (!d.incoming && q >= 1)) { d.flying.splice(i, 1); continue; }
      x = c.x + c.vx * q * d.reach + Math.sin(c.wob + q * 5) * q * 14; y = c.y + c.vy * q * d.reach;
      ctx.globalAlpha = 1 - q; ctx.fillStyle = c.col; ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- "I am Iron Man" ---------- */
  /* A hand snapping its fingers, drawn over the page before it turns to dust. It is a plain bare hand of the
     guide's own drawing: no glove, no stones. The thumb and middle finger press together, then the finger
     drops to the palm, and a spark and two rings of light leave the spot. */
  function drawHand(t) {
    var k = snapPose(t), w = st.w, h = st.h, u = Math.min(w, h), cx = w / 2, cy = h * 0.52, S = u * 0.0042, i;
    var after = k.since >= 0, fade = after ? Math.max(0, 1 - k.since / 0.55) : 1;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(4,4,6," + (0.62 * fade).toFixed(3) + ")"; ctx.fillRect(0, 0, w, h); /* the page, dimmed behind the hand */
    if (fade <= 0) return;
    ctx.save(); ctx.translate(cx, cy + (after ? 0 : (1 - k.press) * u * 0.03)); ctx.scale(S, S); ctx.globalAlpha = fade;
    ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.fillStyle = "#e9c9a6"; ctx.strokeStyle = "#1b1410"; ctx.lineWidth = 3.2;
    var part = function (x, y, len, wid, ang) { /* a rounded finger: from (x, y), len long, turned by ang */
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(-wid / 2, 0); ctx.lineTo(-wid / 2, -len + wid / 2); ctx.arc(0, -len + wid / 2, wid / 2, Math.PI, 0); ctx.lineTo(wid / 2, 0); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.restore();
    };
    part(0, 96, 70, 46, 0);                                            /* wrist */
    ctx.beginPath(); ctx.moveTo(-44, 40); ctx.lineTo(-40, -22); ctx.quadraticCurveTo(0, -40, 42, -22); ctx.lineTo(46, 40); ctx.quadraticCurveTo(0, 62, -44, 40); ctx.closePath(); ctx.fill(); ctx.stroke(); /* palm */
    part(34, -16, 34, 17, 2.5);                                        /* little finger, folded down onto the palm */
    part(16, -22, 38, 18, 2.7);                                        /* ring finger, folded down beside it */
    part(26, -24, 78, 19, 0.16);                                       /* index, raised and clear of the others */
    /* thumb: it comes across the palm; middle finger: it reaches over to press on the thumb's tip, and after the
       snap it has slapped down onto the base of the thumb */
    part(-44, 30, 66, 23, after ? -0.5 : -0.2 - 0.12 * k.press);
    part(-4, -26, after ? 54 : 50, 20, after ? -2.5 : -1.2 - 0.25 * k.press);
    ctx.restore();
    /* the snap itself */
    var px = cx - 54 * S, py = cy - 40 * S; /* where the two tips meet */
    if (!after && k.press > 0.6) { /* a glint where the fingers press */
      ctx.fillStyle = "rgba(255,240,200," + ((k.press - 0.6) * 2).toFixed(3) + ")"; ctx.beginPath(); ctx.arc(px, py, u * 0.006 * (1 + k.press), 0, 6.2832); ctx.fill();
    }
    if (after && k.since < 0.6) {
      var q = k.since / 0.6;
      ctx.strokeStyle = "rgba(255,236,190," + (1 - q).toFixed(3) + ")";
      for (i = 0; i < 2; i++) { ctx.lineWidth = Math.max(1.5, u * 0.008 * (1 - q)); ctx.beginPath(); ctx.arc(px, py, u * (0.05 + 0.5 * q) * (i ? 0.6 : 1), 0, 6.2832); ctx.stroke(); }
      for (i = 0; i < 12; i++) { var a = i / 12 * 6.2832 + 0.3; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * u * (0.02 + 0.1 * q), py + Math.sin(a) * u * (0.02 + 0.1 * q)); ctx.lineTo(px + Math.cos(a) * u * (0.04 + 0.2 * q), py + Math.sin(a) * u * (0.04 + 0.2 * q)); ctx.stroke(); }
      if (k.since < 0.12) { ctx.fillStyle = "rgba(255,255,255," + (0.8 * (1 - k.since / 0.12)).toFixed(3) + ")"; ctx.fillRect(0, 0, w, h); }
    }
  }
  var held = null; /* the picture on the stage now: { kind: "doom" or "iron", pic, live, t } */
  /* The picture exactly as it is on the stage this moment, for the dust to be cut from. One of the guide's own
     scenes is moving, so its present frame is drawn afresh; a copy's own picture is simply itself. */
  function frozen() {
    if (!held.live) return held.pic;
    var off = doc.createElement("canvas");
    off.width = Math.max(1, Math.round(st.w)); off.height = Math.max(1, Math.round(st.h));
    card(off.getContext("2d"), off.width, off.height, held.kind, held.t || 0);
    return off;
  }
  /* out: the picture to turn to dust (or null: the page itself goes). then `kind` comes together. */
  function snapTo(kind, outPic, fromRight) {
    show([]);
    picture(kind === "iron" ? "ironman" : "doom", function (inPic, mine) {
      var out = outPic ? makeDust(outPic, false, fromRight) : null, inn = null;
      var OUT = outPic ? 2.3 : 2.4, GAP = 0.5, IN = 2.8, front = [], PRE = outPic ? 0 : SNAP_AT, gone = false;
      begin({ step: function (clock) {
        var t = clock - PRE; /* the page is the one that goes: first the fingers press, and at the snap it begins */
        if (t < 0) { drawHand(clock); return; }
        if (!outPic && !gone) { gone = true; doc.body.classList.add("snapping"); } /* the stylesheet wipes the page away, left to right */
        if (t < OUT) {
          if (out) drawDust(out, t / OUT * 1.05);
          else { /* the page is wiped by the stylesheet; here, the grains that leave it */
            var p = t / OUT, n = 46, i, f;
            if (clock >= PRE + 0.6) ctx.clearRect(0, 0, st.w, st.h);
            for (i = 0; i < n; i++) front.push({ x: st.w * p + (Math.random() - 0.5) * 40, y: Math.random() * st.h, vx: 1.2 + Math.random() * 3, vy: -(0.3 + Math.random() * 2.2), life: 1, col: ["#f4f0e8", "#e5383b", "#f6c453", "#a9a2b1"][i % 4] });
            if (clock < PRE + 0.6) drawHand(clock); /* the hand lets go and fades as the dust starts */
            for (i = front.length - 1; i >= 0; i--) { f = front[i]; f.x += f.vx * 2.2; f.y += f.vy * 1.6; f.life -= 0.035; if (f.life <= 0) { front.splice(i, 1); continue; } ctx.globalAlpha = f.life; ctx.fillStyle = f.col; ctx.fillRect(f.x, f.y, 3, 3); }
            ctx.globalAlpha = 1;
          }
          return;
        }
        if (!outPic) doc.body.classList.add("stage-full"); /* the page is gone: nothing is left behind the stage */
        if (t < OUT + GAP) { ctx.clearRect(0, 0, st.w, st.h); return; }
        if (!inn) inn = makeDust(inPic, true, fromRight);
        var p2 = (t - OUT - GAP) / IN * 1.05;
        if (p2 < 1.05) { drawDust(inn, p2); return; }
        ctx.clearRect(0, 0, st.w, st.h); ctx.drawImage(inPic, 0, 0);
        held = { kind: kind, pic: inPic, live: mine && !calm, t: 0 };
        show(kind === "doom" ? ["reverse", "home", "back"] : ["snap", "home", "back"]);
        if (!held.live) { tick.stop(); scene = null; return; }
        /* the guide's own scene keeps moving, from the very frame the dust came together into */
        t0 = root.performance.now();
        scene = { step: function (now) { if (!held) return; held.t = now; card(ctx, st.w, st.h, held.kind, now); } };
      } });
    });
  }
  function playIron() {
    open();
    snapTo("doom", null, false); /* the fingers snap first; the page starts to go at that moment */
  }
  tools.reverse.addEventListener("click", function () { if (held) snapTo("iron", frozen(), true); });
  tools.snap.addEventListener("click", function () { if (held) snapTo("doom", frozen(), false); });

  /* ---------- "Check where is Loki" ---------- */
  function playLoki() {
    var sacred = cfg.sacred || {}, img = null, strips = [], done = false, n, i, mid;
    open(); doc.body.classList.add("stage-full");
    show(["back"]);
    n = Math.round(Math.min(150, Math.max(60, st.w / 12)));
    for (i = 0; i < n; i++) {
      mid = 1 - Math.abs((i + 0.5) / n - 0.5) * 2; /* 0 at the edges, 1 in the middle */
      strips.push({ delay: 0.5 * Math.pow(mid, 0.8) + Math.random() * 0.08, dir: (i < n / 2 ? -1 : 1) * (0.4 + Math.random() * 0.9) });
    }
    var play = { step: function (t) {
      var hold = img ? 1.6 : 0, split = 3.2, p = clamp((t - hold) / split), ease = p * p * (3 - 2 * p), q, e, k, dw, dh, dx, dy, bw, w, x, s2;
      st.draw(img ? ease : Math.min(1, 0.3 + ease), 0.04 + 0.96 * ease);
      if (img && p < 1) {
        /* the picture, cut into upright strips: each thins to a thread, drifts aside and fades, the edges first */
        k = Math.max(st.w / img.width, st.h / img.height); dw = img.width * k; dh = img.height * k; dx = (st.w - dw) / 2; dy = (st.h - dh) / 2; bw = dw / n;
        for (i = 0; i < n; i++) {
          s2 = strips[i]; q = clamp((p - s2.delay) / 0.42); e = q * q;
          if (e >= 1) continue;
          w = bw * (1 - 0.92 * e); x = dx + i * bw + (bw - w) / 2 + s2.dir * e * st.w * 0.16 + Math.sin(t * 2.1 + i) * e * 9;
          ctx.globalAlpha = clamp(t / 0.9) * (1 - e);
          ctx.drawImage(img, i * img.width / n, 0, img.width / n, img.height, x, dy - e * dh * 0.2, w + 0.6, dh * (1 + 0.4 * e));
          if (e > 0.02) {
            ctx.globalAlpha = 1; ctx.globalCompositeOperation = "lighter";
            ctx.strokeStyle = "hsla(140,95%,62%," + (e * (1 - e) * 1.6).toFixed(3) + ")"; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.moveTo(x + w / 2, 0); ctx.lineTo(x + w / 2, st.h); ctx.stroke();
            ctx.globalCompositeOperation = "source-over";
          }
        }
        ctx.globalAlpha = 1;
      }
      if (!done && t >= hold + split + 0.3) {
        done = true;
        if (sacred.video) {
          video.src = sacred.video; video.hidden = false; video.currentTime = 0;
          var playing = video.play();
          if (playing && playing.catch) playing.catch(function () { /* the browser wants a press first: the controls are there */ });
          show(["back", "home"]);
        } else if (youtubeId(sacred.youtube)) {
          /* YouTube's player, started by the press on the box; if a browser holds it back, its own play
             button is there, and so is the button that opens the video on YouTube */
          tools.watch.href = "https://www.youtube.com/watch?v=" + youtubeId(sacred.youtube);
          frame.src = "https://www.youtube-nocookie.com/embed/" + youtubeId(sacred.youtube) + "?autoplay=1&rel=0&playsinline=1";
          frame.hidden = false; stage.classList.add("has-frame");
          show(["watch", "door", "back", "home"]);
        } else show(["door", "back", "home"]);
      }
    } };
    if (sacred.still) {
      var im = new root.Image();
      im.onload = function () { img = im; t0 = root.performance.now(); if (calm) play.step(99); };
      im.src = sacred.still;
    }
    begin(play);
  }
  video.addEventListener("ended", function () { show(["door", "back", "home"]); });

  /* ---------- the stage ---------- */
  function open() { stage.hidden = false; st.size(); ctx.clearRect(0, 0, st.w, st.h); held = null; }
  function close() {
    tick.stop(); scene = null; held = null;
    video.pause(); video.removeAttribute("src"); video.load(); video.hidden = true;
    frame.removeAttribute("src"); frame.hidden = true; stage.classList.remove("has-frame");
    show([]); stage.hidden = true;
    doc.body.classList.remove("snapping", "stage-full");
  }
  $("play-loki").addEventListener("click", playLoki);
  $("play-iron").addEventListener("click", playIron);
  tools.back.addEventListener("click", close);
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && !stage.hidden) close(); });
  root.addEventListener("resize", function () { if (!stage.hidden && !scene) { /* a still picture: draw it again at the new size */
    if (held) { var kind = held.kind; st.size(); picture(kind === "iron" ? "ironman" : "doom", function (pic) { held = { kind: kind, pic: pic }; ctx.clearRect(0, 0, st.w, st.h); ctx.drawImage(pic, 0, 0); }); }
  } else if (!stage.hidden) st.size(); });
})(typeof window !== "undefined" ? window : globalThis);
