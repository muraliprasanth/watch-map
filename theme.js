/* The theme switch, shared by every page: dark, light and green, in that order. The choice is kept in this
   browser. Load this in the <head> so the saved theme applies before the page is drawn; the button with
   the id "theme" becomes the switch and always names the theme the next press will bring. */
(function (root) {
  "use strict";
  var ORDER = ["dark", "light", "green"], LABEL = { dark: "Dark", light: "Light", green: "Green" }, KEY = "watchmap.theme";
  function next(theme) { return ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]; }
  function valid(theme) { return ORDER.indexOf(theme) !== -1 ? theme : "dark"; }
  var api = { ORDER: ORDER, next: next, valid: valid };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  var doc = root.document, html = doc.documentElement;
  function saved() { try { return root.localStorage.getItem(KEY); } catch (e) { return null; } }
  function current() { return valid(html.getAttribute("data-theme")); }
  function apply(theme) {
    html.setAttribute("data-theme", theme);
    var b = doc.getElementById("theme");
    if (b) { b.textContent = LABEL[next(theme)]; b.setAttribute("title", "Switch to the " + next(theme) + " theme"); }
    doc.dispatchEvent(new root.CustomEvent("themechange", { detail: theme }));
  }
  html.setAttribute("data-theme", valid(saved()));
  function bind() {
    apply(current());
    var b = doc.getElementById("theme");
    if (b) b.addEventListener("click", function () {
      var t = next(current());
      apply(t);
      try { root.localStorage.setItem(KEY, t); } catch (e) { /* not stored: it lasts for this visit */ }
    });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", bind); else bind();
  root.WatchTheme = api;
})(typeof window !== "undefined" ? window : globalThis);
