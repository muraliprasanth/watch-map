/* Settings for this copy of the site.
   ticks: false = a plain guide. Nobody can mark what they have watched and nothing about a visitor is kept.
   ticks: true  = each title gets a "seen it" circle, kept in that visitor's own browser only.
   Every copy ships with true since 16 Nov 2026 (the owner asked for the tick list on the public site too). */
window.WATCHMAP = { ticks: true };
if (!window.WATCHMAP.ticks) document.documentElement.className += " no-ticks";
