/* Settings for this copy of the site.
   ticks: false = a plain guide. Nobody can mark what they have watched and nothing about a visitor is kept.
   ticks: true  = each title gets a "seen it" circle, kept in that visitor's own browser only.
   Both public copies (Cloudflare and GitHub Pages) ship with false, at the owner's word (16 Nov 2026). */
window.WATCHMAP = { ticks: false };
/* The Loki scene on the Animation page ends with this video, played by YouTube's own player from the
   palkova channel, with a button beside it that opens the video on YouTube. Only the video's id is named
   here; nothing is hosted on this site. */
window.WATCHMAP.sacred = { youtube: "bdZxzb8z6SE" };
if (!window.WATCHMAP.ticks) document.documentElement.className += " no-ticks";
