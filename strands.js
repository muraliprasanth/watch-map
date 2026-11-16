/* Glowing green strands, this guide's own drawing, used behind the map's Sacred Timeline view and on the
   Animation page.
   Kept cheap so a page stays smooth over it: the canvas is drawn at screen pixels at most (the glow is soft
   anyway), the glow is two wide faint strokes under each line instead of a blur, and it runs at about 30
   frames a second. */
(function (root) {
  "use strict";
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function makeStrands(c) {
    var ctx = c && c.getContext && c.getContext("2d");
    if (!ctx) return null;
    var s = { ctx: ctx, lines: [], w: 0, h: 0, t: 0 };
    s.size = function () {
      var d = Math.min(1, root.devicePixelRatio || 1);
      s.w = root.innerWidth; s.h = root.innerHeight;
      c.width = Math.round(s.w * d); c.height = Math.round(s.h * d); ctx.setTransform(d, 0, 0, d, 0, 0);
      var n = Math.round(Math.min(64, Math.max(28, s.w / 22)));
      s.lines = [];
      for (var i = 0; i < n; i++) {
        s.lines.push({ off: (i + 0.5) / n - 0.5, amp: 18 + Math.random() * 46, len: 320 + Math.random() * 520, ph: Math.random() * 6.283,
          sp: 0.15 + Math.random() * 0.35, wd: 0.7 + Math.random() * 2.1, hue: Math.round(128 + Math.random() * 30), lt: Math.round(38 + Math.random() * 34), al: 0.16 + Math.random() * 0.4 });
      }
    };
    /* gain: how bright, 0 to 1. open: how far the bundle has opened, from one thread (0) to the whole timeline (1). */
    s.draw = function (gain, open) {
      var cy = s.h * 0.52, step = Math.max(22, s.w / 70);
      ctx.clearRect(0, 0, s.w, s.h);
      if (gain <= 0) return;
      ctx.globalCompositeOperation = "lighter";
      ctx.lineJoin = "round";
      for (var i = 0; i < s.lines.length; i++) {
        var l = s.lines[i], first = true;
        ctx.beginPath();
        for (var x = -step; x <= s.w + step; x += step) {
          /* the bundle is tight in the middle of the window and fans out to both sides, like branches */
          var fan = 0.18 + 0.82 * Math.pow(Math.abs(x / s.w - 0.5) * 2, 1.35);
          var y = cy + l.off * s.h * 1.25 * fan * open + Math.sin(x / l.len * 6.283 + l.ph + s.t * l.sp) * l.amp * (0.35 + fan) * (0.2 + 0.8 * open);
          if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
        }
        var a = l.al * gain, glow = "hsla(" + l.hue + ",95%,55%,";
        ctx.strokeStyle = glow + (a * 0.1).toFixed(3) + ")"; ctx.lineWidth = l.wd * 9; ctx.stroke();
        ctx.strokeStyle = glow + (a * 0.22).toFixed(3) + ")"; ctx.lineWidth = l.wd * 4; ctx.stroke();
        ctx.strokeStyle = "hsla(" + l.hue + ",85%," + l.lt + "%," + a.toFixed(3) + ")"; ctx.lineWidth = l.wd; ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    };
    return s;
  }
  /* Call step(now, seconds since the last call) about 30 times a second while started. */
  function ticker(step) {
    var raf = 0, last = 0, on = false;
    function frame(now) {
      if (!on) return;
      raf = root.requestAnimationFrame(frame);
      if (now - last < 32) return;
      var dt = Math.min(0.1, (now - last) / 1000); last = now; step(now, dt);
    }
    return { start: function () { if (on) return; on = true; last = root.performance.now(); raf = root.requestAnimationFrame(frame); },
      stop: function () { on = false; root.cancelAnimationFrame(raf); } };
  }
  var api = { makeStrands: makeStrands, ticker: ticker, clamp: clamp };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  root.WatchStrands = api;
})(typeof window !== "undefined" ? window : globalThis);
