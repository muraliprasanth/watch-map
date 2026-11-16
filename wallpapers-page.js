/* The Wallpapers page: only the dark and light switch. The page itself is plain HTML. */
(function (root) {
  "use strict";
  var doc = root.document, button = doc.getElementById("theme"), saved = null;
  try { saved = root.localStorage.getItem("watchmap.theme"); } catch (e) { saved = null; }
  function setTheme(t) { doc.documentElement.setAttribute("data-theme", t); button.textContent = t === "dark" ? "Light" : "Dark"; }
  setTheme(saved === "light" ? "light" : "dark");
  button.addEventListener("click", function () {
    var next = doc.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(next); try { root.localStorage.setItem("watchmap.theme", next); } catch (e) { /* not stored */ }
  });
})(window);
