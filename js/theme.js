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
    if (window.Nextscope && window.Nextscope.plot && window.Nextscope.plot.buildLayout) {
      const grid = plotEl.layout && plotEl.layout.grid;
      const rows = grid ? grid.rows : 1;
      const cols = grid ? grid.columns : 1;
      const newLayout = window.Nextscope.plot.buildLayout(rows, cols, grid || {});
      const update = {
        paper_bgcolor: newLayout.paper_bgcolor,
        plot_bgcolor: newLayout.plot_bgcolor,
        font: newLayout.font,
        legend: newLayout.legend
      };
      const subplotCount = rows * cols;
      const axisStyle = (axis) => ({
        gridcolor: axis.gridcolor,
        linecolor: axis.linecolor,
        zerolinecolor: axis.zerolinecolor,
        tickfont: axis.tickfont
      });
      for (let i = 1; i <= subplotCount; i++) {
        const xKey = 'xaxis' + (i === 1 ? '' : i);
        const yKey = 'yaxis' + (i === 1 ? '' : i);
        if (newLayout[xKey]) {
          Object.assign(update, Object.fromEntries(
            Object.entries(axisStyle(newLayout[xKey])).map(([k, v]) => [xKey + '.' + k, v])
          ));
        }
        if (newLayout[yKey]) {
          Object.assign(update, Object.fromEntries(
            Object.entries(axisStyle(newLayout[yKey])).map(([k, v]) => [yKey + '.' + k, v])
          ));
        }
      }
      Plotly.relayout('plot', update);
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
