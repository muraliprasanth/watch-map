/* The Animation page: three scenes that take over the window.
   "Where is Loki in the timeline?": one green thread opens into the whole timeline (strands.js), and a button leads to
   the map's Sacred Timeline view.
   "I am inevitable" (the box; the scene answers it with "I AM IRON MAN"): the page turns to dust and nothing is left; then a reactor comes together out of the dust
   and keeps turning, with one button under it that leads back to the guide.
   The reactor is this guide's own moving scene: coils and light, in a ring that reads "Proof that Tony Stark
   has a heart" (see reactor); it is a device, and draws no character. A copy of the site may name its own in
   config.js:
     window.WATCHMAP.ironman = "<picture>"   (a still picture that comes together in place of the reactor)
     window.WATCHMAP.sacred  = { still: "<picture>", video: "<video>" }   (the Loki scene then starts from the
                               picture, which comes apart into threads, and ends with the video in a 1.90:1 frame)
     window.WATCHMAP.sacred  = { youtube: "<video id>" }   (the Loki scene ends with that video in YouTube's own
                               player, framed from youtube-nocookie.com, and a button that opens it on YouTube;
                               the site hosts nothing)
     window.WATCHMAP.stan    = "<picture>"   (the Stan Lee scene shows that picture, whole, in place of the drawing)
   "A real superhero": a line by Stan Lee comes up word by word over a pair of tinted glasses, the guide's own
   drawing of a thing, not of a person.
   Someone who asked their device for less motion gets each end state at once. */
(function (root) {
  "use strict";
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  /* The window as a grid of small squares, about `cap` of them: the squares a picture breaks into. */
  function grid(w, h, cap) {
    var g = Math.max(4, Math.ceil(Math.sqrt(w * h / cap)));
    return { g: g, cols: Math.ceil(w / g), rows: Math.ceil(h / g) };
  }
  /* When, from 0 to 1, the square in column `c` arrives: a sweep across the window from the left, a little ragged. */
  function letGo(c, cols, noise) {
    var u = cols > 1 ? c / (cols - 1) : 0;
    return clamp(u * 0.7 + noise * 0.1);
  }
  /* Where a picture of iw by ih sits when it covers a window of w by h. */
  function cover(iw, ih, w, h) {
    var k = Math.max(w / iw, h / ih);
    return { x: (w - iw * k) / 2, y: (h - ih * k) / 2, w: iw * k, h: ih * k };
  }
  /* The same "random" number for the same n, every time: the reactor is drawn from the clock alone, so the
     frame the dust comes together into is the very frame the turning scene starts from. */
  function rnd(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  /* A YouTube video id, and nothing else: eleven letters, digits, - or _. Anything else gives "". */
  function youtubeId(v) { return typeof v === "string" && /^[A-Za-z0-9_-]{11}$/.test(v) ? v : ""; }
  /* Where a picture of iw by ih sits when all of it is shown inside a window of w by h. */
  function fit(iw, ih, w, h) {
    var k = Math.min(w / iw, h / ih);
    return { x: (w - iw * k) / 2, y: (h - ih * k) / 2, w: iw * k, h: ih * k };
  }
  /* Words of the given widths, set in lines no wider than `max` with `space` between two words: the lines,
     each a list of word numbers. A word wider than a line gets a line to itself. */
  function wrap(widths, space, max) {
    var lines = [], line = [], used = 0, i;
    for (i = 0; i < widths.length; i++) {
      if (line.length && used + space + widths[i] > max) { lines.push(line); line = []; used = 0; }
      used += (line.length ? space : 0) + widths[i]; line.push(i);
    }
    if (line.length) lines.push(line);
    return lines;
  }
  var STAN_LINE = "That person who helps others simply because it should or must be done, and because it is the right thing to do, is indeed without a doubt, a real superhero.";
  var api = { grid: grid, letGo: letGo, cover: cover, fit: fit, wrap: wrap, clamp: clamp, rnd: rnd, youtubeId: youtubeId, STAN_LINE: STAN_LINE };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  var doc = root.document, S = root.WatchStrands, cfg = root.WATCHMAP || {};
  var calm = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(id) { return doc.getElementById(id); }
  var stage = $("stage"), canvas = $("stage-canvas"), video = $("stage-video"), frame = $("stage-frame");
  var tools = { watch: $("stage-watch"), door: $("stage-door"), back: $("stage-back"), home: $("stage-home") };
  var st = S.makeStrands(canvas);
  if (!st) return;
  var ctx = st.ctx, FLIGHT = 0.24;
  var scene = null; /* what is playing: { step(t), ... } */
  var again = null; /* draws a settled scene once more, after the window changes size */
  var plays = 0;    /* goes up each time the stage opens: a picture that arrives late knows its scene is gone */
  var t0 = 0;
  var tick = S.ticker(function (now, dt) { st.t += dt; if (scene) scene.step((now - t0) / 1000); });
  function show(names) { Object.keys(tools).forEach(function (k) { tools[k].hidden = names.indexOf(k) === -1; }); }
  function begin(next) { scene = next; t0 = root.performance.now(); if (calm) next.step(99); else tick.start(); }

  /* ---------- the picture ---------- */
  /* The guide's own scene, drawn to fill the window at time t (seconds). It is a device, not a person. */
  function reactor(o, w, h, t) {
    var u = Math.min(w, h), g, i, a, r;
    o.globalAlpha = 1; o.globalCompositeOperation = "source-over"; o.shadowBlur = 0;
    o.fillStyle = "#000"; o.fillRect(0, 0, w, h);
    o.textAlign = "center"; o.textBaseline = "middle"; o.lineCap = "round";
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
  /* The picture at the size of the window, as a canvas: the copy's own if it names one, else the reactor. */
  function picture(done) {
    var off = doc.createElement("canvas"), o;
    off.width = Math.max(1, Math.round(st.w)); off.height = Math.max(1, Math.round(st.h));
    o = off.getContext("2d");
    if (!cfg.ironman) { reactor(o, off.width, off.height, 0); done(off, true); return; }
    var im = new root.Image();
    im.onload = function () { var f = cover(im.width, im.height, off.width, off.height); o.fillStyle = "#000"; o.fillRect(0, 0, off.width, off.height); o.drawImage(im, f.x, f.y, f.w, f.h); done(off, false); };
    im.onerror = function () { reactor(o, off.width, off.height, 0); done(off, true); };
    im.src = cfg.ironman;
  }

  /* ---------- dust ---------- */
  /* A picture coming together out of dust: all of it is hidden, a grain flies in for each square, and the
     square shows when its grain lands. */
  function makeDust(pic) {
    var w = pic.width, h = pic.height, gr = grid(w, h, 26000), g = gr.g;
    var data = pic.getContext("2d").getImageData(0, 0, w, h).data;
    var mask = doc.createElement("canvas"); mask.width = w; mask.height = h;
    var m = mask.getContext("2d"), cells = [];
    for (var r = 0; r < gr.rows; r++) {
      for (var c = 0; c < gr.cols; c++) {
        var px = Math.min(w - 1, c * g + (g >> 1)), py = Math.min(h - 1, r * g + (g >> 1)), i = (py * w + px) * 4;
        var bright = data[i] + data[i + 1] + data[i + 2];
        cells.push({ x: c * g, y: r * g, at: letGo(c, gr.cols, Math.random()), col: "rgb(" + data[i] + "," + data[i + 1] + "," + data[i + 2] + ")",
          fly: bright > 40 && Math.random() < 0.5, vx: 0.3 + Math.random(), vy: -(0.05 + Math.random() * 0.8), wob: Math.random() * 6.283 });
      }
    }
    cells.sort(function (a, b) { return a.at - b.at; });
    m.fillStyle = "#000"; m.fillRect(0, 0, w, h);
    return { pic: pic, mask: mask, m: m, cells: cells, g: g, shown: 0, launched: 0, flying: [], reach: Math.max(w, h) * 0.22 };
  }
  /* Draw the dust at p, from 0 (nothing there yet) to about 1.05 (all of it arrived). */
  function drawDust(d, p) {
    var c, i, q, x, y, s = Math.max(2, d.g * 0.62);
    while (d.launched < d.cells.length && d.cells[d.launched].at - FLIGHT <= p) { c = d.cells[d.launched++]; if (c.fly) d.flying.push(c); }
    while (d.shown < d.cells.length && d.cells[d.shown].at <= p) { c = d.cells[d.shown++]; d.m.clearRect(c.x, c.y, d.g, d.g); }
    ctx.clearRect(0, 0, st.w, st.h);
    ctx.drawImage(d.pic, 0, 0);
    ctx.globalCompositeOperation = "destination-out"; ctx.drawImage(d.mask, 0, 0); ctx.globalCompositeOperation = "source-over";
    for (i = d.flying.length - 1; i >= 0; i--) {
      c = d.flying[i];
      q = 1 - clamp((p - (c.at - FLIGHT)) / FLIGHT); /* how far from home, 1 to 0 */
      if (q <= 0) { d.flying.splice(i, 1); continue; }
      x = c.x + c.vx * q * d.reach + Math.sin(c.wob + q * 5) * q * 14; y = c.y + c.vy * q * d.reach;
      ctx.globalAlpha = 1 - q; ctx.fillStyle = c.col; ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- "I am inevitable": the Iron Man scene ---------- */
  var held = null; /* a still picture left on the stage (a copy's own, or the reactor when less motion was asked for) */
  /* The page turns to dust, left to right, and nothing is left; then the picture comes together out of dust.
     The guide's own reactor then keeps turning, from the very frame the dust came together into. */
  function playIron() {
    open(); show([]);
    picture(function (pic, mine) {
      var OUT = 2.4, GAP = 0.5, IN = 2.8, front = [], inn = null;
      if (stage.hidden) return; /* closed while a copy's own picture was still loading */
      doc.body.classList.add("to-dust"); /* the stylesheet wipes the page away */
      begin({ step: function (t) {
        var p, i, f;
        if (t < OUT) { /* the grains that leave the page, at the edge of the wipe */
          p = t / OUT;
          ctx.clearRect(0, 0, st.w, st.h);
          for (i = 0; i < 46; i++) front.push({ x: st.w * p + (Math.random() - 0.5) * 40, y: Math.random() * st.h, vx: 1.2 + Math.random() * 3, vy: -(0.3 + Math.random() * 2.2), life: 1, col: ["#f4f0e8", "#e5383b", "#f6c453", "#a9a2b1"][i % 4] });
          for (i = front.length - 1; i >= 0; i--) { f = front[i]; f.x += f.vx * 2.2; f.y += f.vy * 1.6; f.life -= 0.035; if (f.life <= 0) { front.splice(i, 1); continue; } ctx.globalAlpha = f.life; ctx.fillStyle = f.col; ctx.fillRect(f.x, f.y, 3, 3); }
          ctx.globalAlpha = 1;
          return;
        }
        doc.body.classList.add("stage-full"); /* the page is gone: nothing is left behind the stage */
        if (t < OUT + GAP) { ctx.clearRect(0, 0, st.w, st.h); return; }
        if (!inn) inn = makeDust(pic);
        p = (t - OUT - GAP) / IN * 1.05;
        if (p < 1.05) { drawDust(inn, p); return; }
        ctx.clearRect(0, 0, st.w, st.h); ctx.drawImage(pic, 0, 0);
        show(["back", "home"]);
        if (!mine || calm) { held = pic; tick.stop(); scene = null; return; }
        t0 = root.performance.now();
        scene = { step: function (now) { reactor(ctx, st.w, st.h, now); } };
      } });
    });
  }

  /* ---------- "Where is Loki in the timeline?" ---------- */
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

  /* ---------- "A real superhero": the Stan Lee scene ---------- */
  /* One lens of a pair of aviators: flat along the brow, deepest low on its outer side. `out` is 1 when
     the outer side is on the right and -1 when it is on the left. */
  function lens(o, x, y, w, h, out) {
    var a = out * w / 2, b = h / 2;
    o.beginPath(); o.moveTo(x - a * 0.78, y - b); o.lineTo(x + a * 0.7, y - b * 0.94);
    o.bezierCurveTo(x + a * 1.02, y - b * 0.9, x + a * 1.06, y - b * 0.2, x + a * 0.96, y + b * 0.3);
    o.bezierCurveTo(x + a * 0.84, y + b * 0.95, x + a * 0.2, y + b * 1.08, x - a * 0.3, y + b * 0.9);
    o.bezierCurveTo(x - a * 0.86, y + b * 0.7, x - a * 1.04, y + b * 0.1, x - a, y - b * 0.55);
    o.bezierCurveTo(x - a * 0.99, y - b * 0.85, x - a * 0.92, y - b, x - a * 0.78, y - b);
    o.closePath();
  }
  /* A pair of tinted glasses seen from a little to one side: the far lens is narrower and sits a touch
     higher, and one arm runs back to the ear and hooks down. The drawing is about 2.8 × `s` wide, centred
     on (cx, cy), with a band of light that crosses the lenses every few seconds. The guide's own drawing:
     a thing, not a person. */
  function glasses(o, cx, cy, s, t) {
    var line = Math.max(2, s * 0.04), floor = cy + s * 0.56, g, i, L, sweep,
      lenses = [{ x: cx - s * 1.04, y: cy - s * 0.03, w: s * 0.6, h: s * 0.56, out: -1 }, { x: cx - s * 0.18, y: cy, w: s * 0.84, h: s * 0.68, out: 1 }];
    o.lineJoin = "round"; o.lineCap = "round";
    g = o.createRadialGradient(cx, floor, 0, cx, floor, s * 1.5); /* the light it rests in */
    g.addColorStop(0, "rgba(123,79,214,0.38)"); g.addColorStop(1, "rgba(123,79,214,0)");
    o.save(); o.translate(0, floor); o.scale(1, 0.14); o.translate(0, -floor); o.fillStyle = g; o.fillRect(cx - s * 1.6, floor - s * 1.6, s * 3.2, s * 3.2); o.restore();
    o.strokeStyle = "#f4f0e8"; o.lineWidth = line * 1.2; /* the arm: back from the hinge, then down behind the ear */
    o.beginPath(); o.moveTo(cx + s * 0.2, cy - s * 0.27);
    o.bezierCurveTo(cx + s * 0.7, cy - s * 0.3, cx + s * 1.08, cy - s * 0.24, cx + s * 1.24, cy - s * 0.11);
    o.bezierCurveTo(cx + s * 1.35, cy - s * 0.02, cx + s * 1.41, cy + s * 0.14, cx + s * 1.43, cy + s * 0.3); o.stroke();
    o.lineWidth = line;
    for (i = 0; i < lenses.length; i++) {
      L = lenses[i];
      g = o.createLinearGradient(L.x - L.w / 2, L.y - L.h / 2, L.x + L.w / 2, L.y + L.h / 2); g.addColorStop(0, "rgba(246,196,83,0.62)"); g.addColorStop(1, "rgba(229,56,59,0.42)");
      lens(o, L.x, L.y, L.w, L.h, L.out); o.fillStyle = "#0b0a0e"; o.fill(); o.fillStyle = g; o.fill();
      o.save(); lens(o, L.x, L.y, L.w, L.h, L.out); o.clip();
      sweep = L.x - L.w / 2 + (((t * 0.16 + i * 0.07) % 1) * 3.2 - 0.8) * L.w;
      o.fillStyle = "rgba(255,255,255,0.2)";
      o.beginPath(); o.moveTo(sweep, L.y - L.h / 2); o.lineTo(sweep + L.w * 0.2, L.y - L.h / 2); o.lineTo(sweep - L.w * 0.12, L.y + L.h / 2); o.lineTo(sweep - L.w * 0.32, L.y + L.h / 2); o.closePath(); o.fill();
      o.restore();
      lens(o, L.x, L.y, L.w, L.h, L.out); o.stroke();
    }
    o.beginPath(); o.moveTo(cx - s * 0.8, cy - s * 0.3); o.lineTo(cx - s * 0.52, cy - s * 0.335); /* the two bars of the bridge */
    o.moveTo(cx - s * 0.75, cy - s * 0.15); o.lineTo(cx - s * 0.6, cy - s * 0.16); o.stroke();
  }
  /* The line comes up word by word, his name after it, and the glasses rise into place under them. A copy
     that names its own picture shows that picture instead, whole, coming up out of the dark. */
  function playStan() {
    var mine, img = null, settled = false, words = STAN_LINE.toUpperCase().split(" "), START = 1.1, EACH = 0.17, END = START + words.length * EACH + 0.4;
    open(); mine = plays; doc.body.classList.add("stage-full"); show(["back"]);
    var play = { step: function (t) {
      var w = st.w, h = st.h, u = Math.min(w, h), f, fs, space, widths, lines, lh, top, y, x, i, k, a, right = 0, room, s;
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.shadowBlur = 0;
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
      if (img) {
        f = fit(img.width, img.height, w, h);
        ctx.globalAlpha = clamp(t / 1.8); ctx.drawImage(img, f.x, f.y, f.w, f.h); ctx.globalAlpha = 1;
        if (t >= 1.8 && !settled) { settled = true; show(["back", "home"]); tick.stop(); scene = null; }
        return;
      }
      fs = Math.max(17, Math.min(46, u * 0.052));
      ctx.font = "400 " + Math.round(fs) + "px Anton, Impact, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      space = fs * 0.3; widths = words.map(function (word) { return ctx.measureText(word).width; });
      lines = wrap(widths, space, Math.min(w * 0.86, fs * 24)); lh = fs * 1.42; top = Math.max(fs * 2, h * 0.12);
      for (i = 0; i < lines.length; i++) {
        x = (w - lines[i].reduce(function (sum, n) { return sum + widths[n]; }, 0) - space * (lines[i].length - 1)) / 2; y = top + lh * i + fs;
        for (k = 0; k < lines[i].length; k++) {
          a = clamp((t - START - lines[i][k] * EACH) / 0.35);
          ctx.globalAlpha = a; ctx.fillStyle = lines[i][k] === words.length - 1 ? "#f6c453" : "#f4f0e8";
          ctx.fillText(words[lines[i][k]], x, y - (1 - a) * fs * 0.25);
          x += widths[lines[i][k]] + space;
        }
        right = Math.max(right, x - space);
      }
      y = top + lh * lines.length + fs * 1.1;
      ctx.globalAlpha = clamp((t - END) / 0.9) * 0.85; ctx.fillStyle = "#f4f0e8"; ctx.textAlign = "right";
      ctx.font = "400 " + Math.round(fs * 0.82) + "px Anton, Impact, sans-serif"; ctx.fillText("\u2014 STAN LEE", right, y);
      room = h * 0.86 - y; s = Math.max(34, Math.min(u * 0.2, w * 0.3, room * 0.62)); a = clamp(t / 1.3); a = a * a * (3 - 2 * a);
      ctx.globalAlpha = a; glasses(ctx, w / 2, y + room * 0.56 + (1 - a) * s * 0.5, s, t); ctx.globalAlpha = 1;
      if (t >= END + 1.1 && !settled) { settled = true; show(["back", "home"]); }
    } };
    again = function () { if (calm || (img && settled)) play.step(99); };
    if (!cfg.stan) { begin(play); return; }
    var im = new root.Image();
    im.onload = function () { if (stage.hidden || plays !== mine) return; img = im; begin(play); };
    im.onerror = function () { if (stage.hidden || plays !== mine) return; begin(play); }; /* no picture: the drawing */
    im.src = cfg.stan;
  }

  /* ---------- the stage ---------- */
  function open() { plays += 1; stage.hidden = false; st.size(); ctx.clearRect(0, 0, st.w, st.h); held = null; again = null; }
  function close() {
    tick.stop(); scene = null; held = null; again = null;
    video.pause(); video.removeAttribute("src"); video.load(); video.hidden = true;
    frame.removeAttribute("src"); frame.hidden = true; stage.classList.remove("has-frame");
    show([]); stage.hidden = true;
    doc.body.classList.remove("to-dust", "stage-full");
  }
  $("play-loki").addEventListener("click", playLoki);
  $("play-iron").addEventListener("click", playIron);
  $("play-stan").addEventListener("click", playStan);
  tools.back.addEventListener("click", close);
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && !stage.hidden) close(); });
  root.addEventListener("resize", function () {
    if (stage.hidden) return;
    st.size();
    if (held) picture(function (pic) { if (!held) return; held = pic; ctx.clearRect(0, 0, st.w, st.h); ctx.drawImage(pic, 0, 0); }); /* a still picture: draw it again at the new size */
    if (again) again();
  });
})(typeof window !== "undefined" ? window : globalThis);
