(() => {
  const Glimpse = window.Glimpse || (window.Glimpse = {});
  Glimpse.plot = Glimpse.plot || {};
  const plot = Glimpse.plot;

  const defaultConfig = {
    responsive: true,
    editable: true
  };

  function getThemeColors() {
    const root = document.documentElement;
    const get = (name) => getComputedStyle(root).getPropertyValue(name).trim() || undefined;
    return {
      bg: get('--color-bg'),
      surface: get('--color-surface'),
      border: get('--color-border'),
      textPrimary: get('--color-text-primary'),
      textSecondary: get('--color-text-secondary'),
      primary: get('--color-primary')
    };
  }

  function buildTrace(signalName, axisIndex, rows, xAxisName) {
    const x = rows[xAxisName] || [];
    const y = rows[signalName] || [];
    return {
      x,
      y,
      yaxis: 'y' + axisIndex,
      name: signalName,
      type: 'scatter'
    };
  }

  function buildLayout(rowCount, options) {
    const grid = {
      rows: rowCount,
      columns: 1,
      pattern: 'coupled'
    };
    if (options && options.roworder) {
      grid.roworder = options.roworder;
    }
    const theme = getThemeColors();
    const axisCommon = {
      gridcolor: theme.border,
      linecolor: theme.border,
      zerolinecolor: theme.border,
      tickfont: { color: theme.textSecondary },
      title: { font: { color: theme.textPrimary } }
    };
    return {
      height: window.innerHeight - 80,
      grid,
      paper_bgcolor: theme.bg,
      plot_bgcolor: theme.bg,
      font: { color: theme.textPrimary, family: '"Lato", sans-serif' },
      xaxis: { ...axisCommon },
      yaxis: { ...axisCommon },
      yaxis2: { ...axisCommon },
      margin: { t: 40, r: 40, b: 40, l: 60 },
      legend: {
        bgcolor: theme.surface,
        bordercolor: theme.border,
        font: { color: theme.textPrimary }
      },
      annotations: [],
      shapes: []
    };
  }

  function render(traces, layout, configOverride) {
    const config = { ...defaultConfig, ...(configOverride || {}) };
    Plotly.newPlot('plot', traces, layout, config);
  }

  plot.buildTrace = buildTrace;
  plot.buildLayout = buildLayout;
  plot.render = render;
})();
