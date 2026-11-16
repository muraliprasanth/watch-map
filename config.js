/* Settings for this copy of the site.
   ticks: false = a plain guide. Nobody can mark what they have watched and nothing about a visitor is kept.
   ticks: true  = each title gets a "seen it" circle, kept in that visitor's own browser only.
   The Cloudflare copy ships with false. tools/publish_github_pages.sh writes true into the GitHub Pages copy. */
window.WATCHMAP = { ticks: true };
if (!window.WATCHMAP.ticks) document.documentElement.className += " no-ticks";
