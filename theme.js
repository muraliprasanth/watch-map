/* The switch in the top bar, shared by every page. The button with the id "theme" shows the setting the
   page is in.
   - Most pages: Dark and Light.
   - The guide page (<html data-home>): Dark, then the Sacred Timeline, then Light. The Sacred Timeline is
     a show, not a colour theme: the page clears and app.js plays it. It is never saved; Escape leaves it.
   - The map page (<html data-map>): no theme at all. It has two views, Default and Sacred Timeline,
     chosen with the two buttons inside the element with the id "view", and remembered on their own.
   Choices are kept in this browser. Load this in the <head> so they apply before the page is drawn. */
(function (root) {
  "use strict";
  var LABEL = { dark: "Dark", light: "Light", sacred: "Sacred Timeline" }, THEME = "watchmap.theme", VIEW = "watchmap.view";
  /* the next setting after `now`; the guide page has the show between dark and light */
  function next(now, home) {
    if (now === "dark") return home ? "sacred" : "light";
    if (now === "sacred") return "light";
    return "dark";
  }
  /* a saved theme is dark or light; anything else (older versions saved "green") counts as dark */
  function theme(saved) { return saved === "light" ? "light" : "dark"; }
  /* the map page's two views */
  function view(saved) { return saved === "sacred" ? "sacred" : "default"; }
  var api = { next: next, theme: theme, view: view, LABEL: LABEL };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  var doc = root.document, html = doc.documentElement, HOME = html.hasAttribute("data-home"), MAP = html.hasAttribute("data-map");
  function read(key) { try { return root.localStorage.getItem(key); } catch (e) { return null; } }
  function keep(key, value) { try { root.localStorage.setItem(key, value); } catch (e) { /* not stored: it lasts for this visit */ } }
  function tell(name, detail) { doc.dispatchEvent(new root.CustomEvent(name, { detail: detail })); }

  if (MAP) {
    /* the sacred view is drawn by the stylesheet under data-theme="green"; the default view is the dark page */
    var showView = function (v) {
      html.setAttribute("data-theme", v === "sacred" ? "green" : "dark");
      Array.prototype.forEach.call(doc.querySelectorAll("#view button"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-view") === v ? "true" : "false"); });
      tell("themechange", v === "sacred" ? "green" : "dark");
    };
    html.setAttribute("data-theme", view(read(VIEW)) === "sacred" ? "green" : "dark");
    var bindView = function () {
      showView(view(read(VIEW)));
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
    if (b) { b.textContent = LABEL[now]; b.setAttribute("title", LABEL[now] + ". Press for " + LABEL[next(now, HOME)] + "."); }
  }
  function set(to) {
    var was = now;
    now = to;
    if (to === "sacred") tell("sacredshow", true);
    else {
      if (was === "sacred") tell("sacredshow", false);
      html.setAttribute("data-theme", to); keep(THEME, to); tell("themechange", to);
    }
    label();
  }
  function bind() {
    label();
    var b = doc.getElementById("theme");
    if (b) b.addEventListener("click", function () { set(next(now, HOME)); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && now === "sacred") set("dark"); });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", bind); else bind();
  root.WatchTheme = api;
})(typeof window !== "undefined" ? window : globalThis);
