/* The Quiz page. The questions and the answers are in this file, and what a visitor answers is kept in
   that visitor's own browser (localStorage "watchmap.quiz"). Nothing is sent anywhere. */
(function (root) {
  "use strict";
  var KEY = "watchmap.quiz";
  /* kind "pick": choose one of `options`. kind "type": write the missing words; `accept` lists what counts.
     `full` is shown once the answer is right. */
  var QUESTIONS = [
    { id: "strongest", kind: "pick", ask: "Who is the strongest Avenger?", options: ["Thor", "Hulk", "Scarlet Witch", "Doctor Strange"], answer: "Hulk" },
    { id: "potato", kind: "pick", ask: "Who handles the big potato stuff?", options: ["Spider-Man", "The Avengers", "The Thunderbolts", "The TVA"], answer: "The Thunderbolts" },
    { id: "god", kind: "pick", ask: "Who is the god of the multiverse?", options: ["Loki", "Doom", "Thanos", "Ultron"], answer: "Loki" },
    { id: "universe", kind: "type", ask: "I love you ____", accept: ["in every universe", "i love you in every universe"], full: "I love you in every universe.",
      hint: "This was said by the same person who said “If I tell you what happens, it won’t happen”." },
    { id: "chris", kind: "type", ask: "Who is Deadpool’s favourite Chris?", accept: ["chris hemsworth", "hemsworth"], full: "Chris Hemsworth." },
    { id: "dead", kind: "type", ask: "In Marvel, everyone stays dead except ____", accept: ["uncle ben", "ben", "ben parker", "uncle ben parker"], full: "In Marvel, everyone stays dead except Uncle Ben." },
    { id: "power", kind: "type", ask: "With great power comes ____", accept: ["great responsibility", "responsibility"], full: "With great power comes great responsibility." }
  ];

  /* Letters and digits only, lower case: "  In EVERY universe! " and "in every universe" are the same answer. */
  function plain(text) { return String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function isRight(q, given) {
    if (q.kind === "pick") return given === q.answer;
    var g = plain(given);
    return g !== "" && q.accept.some(function (a) { return plain(a) === g; });
  }
  function score(answers) {
    return QUESTIONS.filter(function (q) { return isRight(q, answers[q.id]); }).length;
  }
  var api = { QUESTIONS: QUESTIONS, plain: plain, isRight: isRight, score: score };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  var doc = root.document;
  function $(id) { return doc.getElementById(id); }
  function el(tag, cls, text) { var n = doc.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
  function load() {
    try { var o = JSON.parse(root.localStorage.getItem(KEY) || "{}"); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch (e) { return {}; }
  }
  function save(answers) { try { root.localStorage.setItem(KEY, JSON.stringify(answers)); } catch (e) { /* kept for this visit only */ } }
  var answers = load();

  function card(q, n) {
    var box = el("section", "q"), say = el("p", "q-say");
    say.setAttribute("aria-live", "polite");
    box.appendChild(el("p", "q-n", "Question " + n + " of " + QUESTIONS.length));
    box.appendChild(el("h2", "", q.ask));

    function settle() {
      var given = answers[q.id], right = isRight(q, given);
      box.classList.toggle("right", right);
      say.className = "q-say" + (right ? " good" : "");
      say.textContent = right ? "Right." : (given ? "Not that one. Try again." : "");
      var full = box.querySelector(".q-full");
      if (full) full.hidden = !right;
      $("score").textContent = score(answers);
    }

    if (q.kind === "pick") {
      var row = el("div", "q-options");
      row.setAttribute("role", "group"); row.setAttribute("aria-label", q.ask);
      q.options.forEach(function (o) {
        var b = el("button", "", o); b.type = "button";
        b.addEventListener("click", function () { answers[q.id] = o; save(answers); paint(); settle(); });
        row.appendChild(b);
      });
      var paint = function () {
        Array.prototype.forEach.call(row.children, function (b) {
          var mine = answers[q.id] === b.textContent;
          b.className = mine ? (isRight(q, b.textContent) ? "picked-right" : "picked-wrong") : "";
          b.setAttribute("aria-pressed", mine ? "true" : "false");
        });
      };
      box.appendChild(row); paint();
    } else {
      var form = el("form", "q-type"), input = el("input"), go = el("button", "cta", "Check");
      input.type = "text"; input.autocomplete = "off"; input.setAttribute("aria-label", "Your answer"); input.placeholder = "Type the answer";
      input.value = answers[q.id] || "";
      go.type = "submit";
      form.appendChild(input); form.appendChild(go);
      form.addEventListener("submit", function (e) { e.preventDefault(); answers[q.id] = input.value; save(answers); settle(); });
      box.appendChild(form);
      if (q.hint) {
        var ask = el("button", "ghost-link", "Show a hint"), hint = el("p", "q-hint", "Hint: " + q.hint);
        ask.type = "button"; hint.hidden = true;
        ask.addEventListener("click", function () { hint.hidden = !hint.hidden; ask.textContent = hint.hidden ? "Show a hint" : "Hide the hint"; });
        var wrap = el("p", "q-hint"); wrap.appendChild(ask);
        box.appendChild(wrap); box.appendChild(hint);
      }
    }
    box.appendChild(say);
    if (q.full) { var full = el("p", "q-full", q.full); full.hidden = true; box.appendChild(full); }
    settle();
    return box;
  }

  function draw() {
    var list = $("quiz"); list.textContent = "";
    QUESTIONS.forEach(function (q, i) { list.appendChild(card(q, i + 1)); });
    $("total").textContent = QUESTIONS.length;
    $("score").textContent = score(answers);
  }
  $("again").addEventListener("click", function () { answers = {}; save(answers); draw(); root.scrollTo(0, 0); });
  draw();
})(typeof window !== "undefined" ? window : globalThis);
