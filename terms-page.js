/* The Terms page: one tab per kind of term, a search box, and a card per term. Data comes from terms.js. */
(function (root) {
  "use strict";
  var ROWS = [["what", "What it is"], ["origin", "Where it comes from"], ["power", "What it can do"], ["story", "What happens"]];

  /* Which terms to show: the search box wins over the tab. Kept free of page access so it can be tested. */
  function pick(terms, group, query) {
    var q = (query || "").trim().toLowerCase();
    if (q) {
      return terms.filter(function (t) {
        return [t.name, t.also, t.what, t.origin, t.power, t.story].join(" ").toLowerCase().indexOf(q) !== -1;
      });
    }
    return terms.filter(function (t) { return group === "all" || t.group === group; });
  }

  if (typeof module !== "undefined" && module.exports) { module.exports = { pick: pick, ROWS: ROWS }; return; }

  var doc = root.document, DATA = root.TERMS;
  function $(id) { return doc.getElementById(id); }
  function el(tag, attrs, text) {
    var n = doc.createElement(tag), k;
    for (k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (text) n.textContent = text;
    return n;
  }

  var state = { group: DATA.groups[0].id };

  function card(t) {
    var box = el("article", { "class": "term", id: t.id });
    box.appendChild(el("h2", null, t.name));
    if (t.also) box.appendChild(el("p", { "class": "term-also" }, t.also));
    var dl = el("dl");
    ROWS.forEach(function (row) {
      if (!t[row[0]]) return;
      dl.appendChild(el("dt", null, row[1]));
      dl.appendChild(el("dd", null, t[row[0]]));
    });
    box.appendChild(dl);
    var see = el("p", { "class": "term-see" });
    see.appendChild(el("span", null, "See it in"));
    t.see.forEach(function (id) {
      var title = DATA.titles[id];
      see.appendChild(el("b", null, title.t + (title.y ? " (" + title.y + ")" : "")));
    });
    box.appendChild(see);
    return box;
  }

  function draw() {
    var query = $("find").value, shown = pick(DATA.terms, state.group, query);
    Array.prototype.forEach.call(doc.querySelectorAll("#tabs button"), function (b) {
      b.setAttribute("aria-pressed", !query.trim() && b.getAttribute("data-group") === state.group ? "true" : "false");
    });
    var list = $("list");
    list.textContent = "";
    shown.forEach(function (t) { list.appendChild(card(t)); });
    $("count").textContent = query.trim()
      ? (shown.length ? shown.length + (shown.length === 1 ? " term matches" : " terms match") + " “" + query.trim() + "”." : "Nothing matches “" + query.trim() + "”. Try a shorter word.")
      : shown.length + (shown.length === 1 ? " term." : " terms.");
  }

  function tab(id, title) {
    var b = el("button", { type: "button", "data-group": id, "aria-pressed": "false" }, title);
    b.addEventListener("click", function () { state.group = id; $("find").value = ""; draw(); });
    return b;
  }

  function fromHash() {
    var id = (root.location.hash || "").replace("#", ""), found = null;
    DATA.terms.forEach(function (t) { if (t.id === id) found = t; });
    if (!found) return;
    state.group = found.group; $("find").value = ""; draw();
    var node = $(found.id);
    if (node) { node.classList.add("term-lit"); node.scrollIntoView({ block: "start" }); }
  }

  DATA.groups.forEach(function (g) { $("tabs").appendChild(tab(g.id, g.title)); });
  $("tabs").appendChild(tab("all", "Everything"));
  $("find").addEventListener("input", draw);

  draw();
  fromHash();
  root.addEventListener("hashchange", fromHash);
})(typeof window !== "undefined" ? window : globalThis);
