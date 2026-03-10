(() => {
  const STORAGE_KEY = 'np-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateIcon(theme);
    updateThemeColorMeta();
    refreshPlotTheme();
  }

  function updateThemeColorMeta() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.content = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-surface').trim();
  }

  function updateIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    icon.className = theme === 'light' ? 'fa fa-sun-o' : 'fa fa-moon-o';
  }

  function refreshPlotTheme() {
    const plotEl = document.getElementById('plot');
    if (!plotEl || !plotEl.data || !plotEl.data.length) return;
    if (window.Glimpse && window.Glimpse.plot && window.Glimpse.plot.buildLayout) {
      const rowCount = plotEl.layout && plotEl.layout.grid ? plotEl.layout.grid.rows : 1;
      const newLayout = window.Glimpse.plot.buildLayout(rowCount, plotEl.layout.grid || {});
      Plotly.relayout('plot', {
        paper_bgcolor: newLayout.paper_bgcolor,
        plot_bgcolor: newLayout.plot_bgcolor,
        font: newLayout.font,
        'xaxis.gridcolor': newLayout.xaxis.gridcolor,
        'xaxis.linecolor': newLayout.xaxis.linecolor,
        'xaxis.zerolinecolor': newLayout.xaxis.zerolinecolor,
        'xaxis.tickfont': newLayout.xaxis.tickfont,
        'yaxis.gridcolor': newLayout.yaxis.gridcolor,
        'yaxis.linecolor': newLayout.yaxis.linecolor,
        'yaxis.zerolinecolor': newLayout.yaxis.zerolinecolor,
        'yaxis.tickfont': newLayout.yaxis.tickfont,
        'yaxis2.gridcolor': newLayout.yaxis.gridcolor,
        'yaxis2.linecolor': newLayout.yaxis.linecolor,
        'yaxis2.zerolinecolor': newLayout.yaxis.zerolinecolor,
        'yaxis2.tickfont': newLayout.yaxis.tickfont,
        legend: newLayout.legend
      });
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  document.addEventListener('DOMContentLoaded', function () {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateIcon(currentTheme);
    updateThemeColorMeta();

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
    }
  });
})();
