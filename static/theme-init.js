// Applies the saved spooky theme before first paint to avoid a flash
// of the default accent. Injected via docusaurus.config.ts `scripts`.
(function () {
  try {
    var themes = {
      dracula: ["#bd93f9", "#ff79c6"],
      pink: ["#ff79c6", "#bd93f9"],
      forest: ["#50fa7b", "#8be9fd"],
      ocean: ["#8be9fd", "#50fa7b"],
      blood: ["#ff5555", "#ffb86c"],
      amber: ["#ffb86c", "#f1fa8c"],
      toxic: ["#a3e635", "#22d3ee"],
      ghost: ["#e6e6fa", "#bd93f9"],
      void: ["#64748b", "#94a3b8"],
    };
    var name = localStorage.getItem("spookyTheme");
    if (name && themes[name]) {
      document.documentElement.style.setProperty("--spooky-accent", themes[name][0]);
      document.documentElement.style.setProperty("--spooky-accent-2", themes[name][1]);
    }
  } catch (e) {
    /* no localStorage or blocked — keep the default palette */
  }
})();
