/* The theme switch, shared by every page: dark, light, green, and round again. The button with the id
   "theme" is the switch and shows the theme the page is in.
   Dark and light recolour the page. Green is one view, not a recolouring: only the timeline, on moving
   green strands, and it lives on the map page (its <html> carries data-green). Choosing green anywhere
   else opens the map page in green; a page that is not the map shows a saved "green" as dark.
   The choice is kept in this browser. Load this in the <head> so it applies before the page is drawn. */
(function (root) {
  "use strict";
  var ORDER = ["dark", "light", "green"], LABEL = { dark: "Dark", light: "Light", green: "Green" }, KEY = "watchmap.theme";
  function next(theme) { return ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]; }
  /* what a page shows for a saved choice: green only where the page has the green view */
  function shown(saved, hasGreen) {
    if (ORDER.indexOf(saved) === -1) return "dark";
    return saved === "green" && !hasGreen ? "dark" : saved;
  }
  var api = { ORDER: ORDER, next: next, shown: shown };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  var doc = root.document, html = doc.documentElement, GREEN = html.hasAttribute("data-green");
  function saved() { try { return root.localStorage.getItem(KEY); } catch (e) { return null; } }
  function keep(theme) { try { root.localStorage.setItem(KEY, theme); } catch (e) { /* not stored: it lasts for this visit */ } }
  function current() { return shown(html.getAttribute("data-theme"), GREEN); }
  function apply(theme) {
    html.setAttribute("data-theme", theme);
    var b = doc.getElementById("theme");
    if (b) { b.textContent = LABEL[theme]; b.setAttribute("title", "Theme: " + LABEL[theme] + ". Press for " + LABEL[next(theme)] + "."); }
    doc.dispatchEvent(new root.CustomEvent("themechange", { detail: theme }));
  }
  html.setAttribute("data-theme", shown(saved(), GREEN));
  function bind() {
    apply(current());
    var b = doc.getElementById("theme");
    if (b) b.addEventListener("click", function () {
      var t = next(current());
      keep(t);
      if (t === "green" && !GREEN) { root.location.href = "map.html"; return; } /* the green view is on the map page */
      apply(t);
    });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", bind); else bind();
  root.WatchTheme = api;
})(typeof window !== "undefined" ? window : globalThis);
