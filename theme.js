/* The switch in the top bar, shared by every page.
   - Every page but the map: Dark and Light. The button with the id "theme" shows the one the page is in.
   - The map page (<html data-map>): no theme button. It has two views, Default and Sacred Timeline, chosen
     with the two buttons inside the element with the id "view" and remembered on their own. Default is
     the usual map, in the dark or light theme chosen elsewhere. A link to map.html#sacred opens the
     Sacred Timeline view.
   Choices are kept in this browser. Load this in the <head> so they apply before the page is drawn. */
(function (root) {
  "use strict";
  var LABEL = { dark: "Dark", light: "Light" }, THEME = "watchmap.theme", VIEW = "watchmap.view";
  function next(now) { return now === "dark" ? "light" : "dark"; }
  /* a saved theme is dark or light; anything else (older versions saved "green") counts as dark */
  function theme(saved) { return saved === "light" ? "light" : "dark"; }
  /* the map page's two views; the address can ask for the sacred one */
  function view(saved, hash) { return hash === "#sacred" || saved === "sacred" ? "sacred" : "default"; }
  var api = { next: next, theme: theme, view: view, LABEL: LABEL };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  var doc = root.document, html = doc.documentElement, MAP = html.hasAttribute("data-map");
  /* the site had background music for an hour on 16 Nov 2026 and kept its on/off choice; that is cleared */
  try { root.localStorage.removeItem("watchmap.sound"); } catch (e) { /* nothing was stored */ }
  function read(key) { try { return root.localStorage.getItem(key); } catch (e) { return null; } }
  function keep(key, value) { try { root.localStorage.setItem(key, value); } catch (e) { /* not stored: it lasts for this visit */ } }
  function tell(detail) { doc.dispatchEvent(new root.CustomEvent("themechange", { detail: detail })); }

  if (MAP) {
    /* the stylesheet draws the Sacred Timeline view under data-theme="green"; Default is the dark or light page */
    var paint = function (v) { return v === "sacred" ? "green" : theme(read(THEME)); };
    var first = view(read(VIEW), root.location.hash);
    if (root.location.hash === "#sacred") keep(VIEW, "sacred");
    html.setAttribute("data-theme", paint(first));
    var showView = function (v) {
      html.setAttribute("data-theme", paint(v));
      Array.prototype.forEach.call(doc.querySelectorAll("#view button"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-view") === v ? "true" : "false"); });
      tell(paint(v));
    };
    var bindView = function () {
      showView(first);
      Array.prototype.forEach.call(doc.querySelectorAll("#view button"), function (b) {
        b.addEventListener("click", function () { var v = view(b.getAttribute("data-view")); keep(VIEW, v); showView(v); });
      });
    };
    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", bindView); else bindView();
    root.WatchTheme = api;
    return;
  }

  var now = theme(read(THEME));
  html.setAttribute("data-theme", now);
  function label() {
    var b = doc.getElementById("theme");
    if (b) { b.textContent = LABEL[now]; b.setAttribute("title", LABEL[now] + " theme. Press for " + LABEL[next(now)] + "."); }
  }
  function bind() {
    label();
    var b = doc.getElementById("theme");
    if (b) b.addEventListener("click", function () { now = next(now); html.setAttribute("data-theme", now); keep(THEME, now); label(); tell(now); });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", bind); else bind();
  root.WatchTheme = api;
})(typeof window !== "undefined" ? window : globalThis);
