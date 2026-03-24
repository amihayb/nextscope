(() => {
  const Nextscope = window.Nextscope || (window.Nextscope = {});
  Nextscope.plot = Nextscope.plot || {};
  const plot = Nextscope.plot;

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

  function buildTrace(signalName, subplotIndex, rows, xAxisName) {
    const x = rows[xAxisName] || [];
    const y = rows[signalName] || [];
    const pattern = (Nextscope.state && Nextscope.state.gridPattern) || 'coupled';
    const gridRows = (Nextscope.state && Nextscope.state.gridRows) || 2;
    const gridCols = (Nextscope.state && Nextscope.state.gridCols) || 1;

    let xRef, yRef;
    if (pattern === 'coupled') {
      const plotlyRow = Math.floor((subplotIndex - 1) / gridCols) + 1;
      const plotlyCol = ((subplotIndex - 1) % gridCols) + 1;
      xRef = 'x' + (plotlyCol === 1 ? '' : plotlyCol);
      yRef = 'y' + (plotlyRow === 1 ? '' : plotlyRow);
    } else {
      xRef = 'x' + (subplotIndex === 1 ? '' : subplotIndex);
      yRef = 'y' + (subplotIndex === 1 ? '' : subplotIndex);
    }
    return {
      x,
      y,
      xaxis: xRef,
      yaxis: yRef,
      name: signalName,
      type: 'scatter'
    };
  }

  function buildLayout(rows, cols, options) {
    if (typeof rows === 'number' && typeof cols === 'undefined') {
      cols = 1;
    }
    rows = rows || 2;
    cols = cols || 1;
    const pattern = (Nextscope.state && Nextscope.state.gridPattern) || 'coupled';
    const grid = {
      rows,
      columns: cols,
      pattern,
      roworder: (options && options.roworder) || 'bottom to top'
    };
    const theme = getThemeColors();
    const axisCommon = {
      gridcolor: theme.border,
      linecolor: theme.border,
      zerolinecolor: theme.border,
      tickfont: { color: theme.textSecondary },
      title: { font: { color: theme.textPrimary } }
    };
    const layout = {
      height: window.innerHeight - 80,
      grid,
      paper_bgcolor: theme.bg,
      plot_bgcolor: theme.bg,
      font: { color: theme.textPrimary, family: '"Lato", sans-serif' },
      margin: { t: 40, r: 40, b: 40, l: 60 },
      legend: {
        bgcolor: theme.surface,
        bordercolor: theme.border,
        font: { color: theme.textPrimary }
      },
      annotations: [],
      shapes: []
    };
    if (pattern === 'coupled') {
      for (let c = 1; c <= cols; c++) {
        layout['xaxis' + (c === 1 ? '' : c)] = { ...axisCommon };
      }
      for (let r = 1; r <= rows; r++) {
        layout['yaxis' + (r === 1 ? '' : r)] = { ...axisCommon };
      }
    } else {
      const subplotCount = rows * cols;
      for (let i = 1; i <= subplotCount; i++) {
        layout['xaxis' + (i === 1 ? '' : i)] = { ...axisCommon };
        layout['yaxis' + (i === 1 ? '' : i)] = { ...axisCommon };
      }
    }
    return layout;
  }

  function render(traces, layout, configOverride) {
    const config = { ...defaultConfig, ...(configOverride || {}) };
    Plotly.newPlot('plot', traces, layout, config);
  }

  plot.buildTrace = buildTrace;
  plot.buildLayout = buildLayout;
  plot.render = render;
})();
