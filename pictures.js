/* Pictures that failed to load get asked for again. A preview can be left broken when its loading is cut off
   (the visitor moved to another page) and the browser later brings the page back as it was; the server is not
   at fault, so one more request, with an address the browser has not remembered as failed, puts it right.
   Each picture is tried again at most twice. */
(function (root) {
  "use strict";
  /* The same address with a harmless marker added, so that it is fetched afresh: "a.jpg" -> "a.jpg?again=1". */
  function again(src, n) {
    var parts = String(src).split("#"), base = parts[0].replace(/([?&])again=\d+(&|$)/, function (m, lead, tail) { return tail ? lead : ""; });
    return base + (base.indexOf("?") === -1 ? "?" : "&") + "again=" + n; /* anything after a # is dropped: it never reaches the server */
  }
  var api = { again: again, MOST: 2 };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  var doc = root.document;
  function retry(img) {
    var n = Number(img.getAttribute("data-again") || 0) + 1;
    if (n > api.MOST) return;
    img.setAttribute("data-again", n);
    img.src = again(img.getAttribute("src"), n);
  }
  function broken(img) { return img.complete && img.naturalWidth === 0; }
  function sweep() { Array.prototype.forEach.call(doc.images, function (img) { if (broken(img)) retry(img); }); }
  doc.addEventListener("error", function (e) { if (e.target && e.target.tagName === "IMG") retry(e.target); }, true);
  root.addEventListener("pageshow", sweep);       /* also when Back brings the page out of the browser's memory */
  if (doc.readyState === "complete") sweep(); else root.addEventListener("load", sweep);
})(typeof window !== "undefined" ? window : globalThis);
