(() => {
  const Nextscope = window.Nextscope || (window.Nextscope = {});
  Nextscope.views = {};

  const STORAGE_KEY = 'np-views';

  // ── Persistence ──────────────────────────────────────────────────────────

  function loadViews() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function persistViews(views) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  }

  // ── Capture / Apply ───────────────────────────────────────────────────────

  function captureConfig() {
    const xAxis = Nextscope.ui.getXAxisName();
    const gridRows = (Nextscope.state && Nextscope.state.gridRows) || 2;
    const gridCols = (Nextscope.state && Nextscope.state.gridCols) || 1;
    const gridPattern = (Nextscope.state && Nextscope.state.gridPattern) || 'coupled';
    const subplotCount = gridRows * gridCols;

    const checkedBySlot = {};
    for (let slot = 1; slot <= subplotCount; slot++) {
      const name = 'signalCheckbox' + (slot === 1 ? '' : slot);
      checkedBySlot[slot] = Array.from(document.getElementsByName(name))
        .filter(cb => cb.checked)
        .map(cb => cb.id);
    }

    const operationsLog = [...((Nextscope.state && Nextscope.state.operationsLog) || [])];

    return { xAxis, gridRows, gridCols, gridPattern, checkedBySlot, operationsLog };
  }

  function replayOperations(ops) {
    if (!ops || ops.length === 0) return;
    const rows = Nextscope.state.rows;
    const transforms = Nextscope.data && Nextscope.data.transforms;
    if (!transforms) return;

    ops.forEach(op => {
      if (!rows[op.source]) return; // source signal not present in loaded data
      let result;
      switch (op.type) {
        case 'Mult':        result = transforms.mult(rows[op.source], op.params.factor); break;
        case 'Diff':        result = transforms.diff(rows[op.source]); break;
        case 'Integrate':   result = transforms.integrate(rows[op.source]); break;
        case 'filter':      result = transforms.filter(rows[op.source], op.params.cutoff); break;
        case 'Detrend':     result = transforms.detrend(rows[op.source]); break;
        case 'removeFirst': result = transforms.removeFirst(rows[op.source]); break;
        case 'removeMean':  result = transforms.removeMean(rows[op.source]); break;
        case 'fixAngle':    result = transforms.fixAngle(rows[op.source]); break;
        default: return;
      }
      if (result) {
        rows[op.result] = result;
        Nextscope.ui.addCheckbox(op.result);
        Nextscope.state.operationsLog.push(op);
      }
    });
  }

  function applyView(view) {
    // Set grid size first (rebuilds checkboxes)
    if (Nextscope.actions && Nextscope.actions.setSubplotGrid) {
      Nextscope.actions.setSubplotGrid(view.gridRows, view.gridCols);
    }

    // Set pattern (coupled / independent)
    if (Nextscope.actions && Nextscope.actions.setPattern) {
      Nextscope.actions.setPattern(view.gridPattern || 'coupled');
    }

    // Set X-axis dropdown
    const xAxisEl = document.getElementById('x_axis');
    if (xAxisEl && view.xAxis) {
      xAxisEl.value = view.xAxis;
    }

    // Replay signal operations (creates derived signals like _diff, _x_0.5, etc.)
    replayOperations(view.operationsLog);

    // Uncheck all checkboxes
    document.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.checked = false;
    });

    // Re-check saved ones
    const checkedBySlot = view.checkedBySlot || {};
    const subplotCount = view.gridRows * view.gridCols;
    for (let slot = 1; slot <= subplotCount; slot++) {
      const name = 'signalCheckbox' + (slot === 1 ? '' : slot);
      const signals = checkedBySlot[slot] || [];
      signals.forEach(signalId => {
        const cbs = document.getElementsByName(name);
        for (const cb of cbs) {
          if (cb.id === signalId) {
            cb.checked = true;
            break;
          }
        }
      });
    }

    // Re-render the plot
    if (Nextscope.actions && Nextscope.actions.selectSignals) {
      Nextscope.actions.selectSignals();
    }
  }

  // ── Save / Delete ─────────────────────────────────────────────────────────

  function saveNewView() {
    Swal.fire({
      title: 'Save View',
      input: 'text',
      inputLabel: 'View name',
      inputPlaceholder: 'e.g. Overview',
      showCancelButton: true,
      confirmButtonText: 'Save',
      inputValidator: value => {
        if (!value || !value.trim()) return 'Please enter a name.';
      }
    }).then(result => {
      if (!result.isConfirmed) return;
      const name = result.value.trim();
      const config = captureConfig();
      const views = loadViews();
      views.push({ name, ...config });
      persistViews(views);
      renderButtons();
    });
  }

  function deleteView(index) {
    const views = loadViews();
    views.splice(index, 1);
    persistViews(views);
    renderButtons();
  }

  // ── Render Buttons ────────────────────────────────────────────────────────

  function renderButtons() {
    const list = document.getElementById('viewsnav-list');
    if (!list) return;
    list.innerHTML = '';

    const views = loadViews();
    views.forEach((view, i) => {
      const row = document.createElement('div');
      row.className = 'viewsnav-row';

      const btn = document.createElement('button');
      btn.className = 'viewsnav-view-btn';
      btn.textContent = view.name;
      btn.title = 'Apply view: ' + view.name;
      btn.addEventListener('click', () => applyView(view));

      const del = document.createElement('button');
      del.className = 'viewsnav-delete-btn';
      del.title = 'Delete view';
      del.innerHTML = '&times;';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteView(i);
      });

      row.appendChild(btn);
      row.appendChild(del);
      list.appendChild(row);
    });
  }

  // ── Export / Import JSON ──────────────────────────────────────────────────

  function exportJSON() {
    const views = loadViews();
    const blob = new Blob([JSON.stringify(views, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nextscope-views.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw new Error('Expected an array.');
        const existing = loadViews();
        const merged = existing.concat(imported);
        persistViews(merged);
        renderButtons();
        Swal.fire({ icon: 'success', title: 'Views imported', text: imported.length + ' view(s) added.' });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Import failed', text: 'Invalid JSON file.' });
      }
    };
    reader.readAsText(file);
  }

  // ── Toggle Sidebar ────────────────────────────────────────────────────────

  function toggle() {
    document.body.classList.toggle('views-open');
    const btn = document.getElementById('views-toggle-btn');
    if (btn) {
      const isOpen = document.body.classList.contains('views-open');
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.setAttribute('title', isOpen ? 'Close Views' : 'Views');
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    renderButtons();

    const saveBtn = document.getElementById('viewsnav-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveNewView);

    const exportBtn = document.getElementById('viewsnav-export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportJSON);

    const importInput = document.getElementById('viewsnav-import-input');
    const importBtn = document.getElementById('viewsnav-import-btn');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          importJSON(file);
          importInput.value = '';
        }
      });
    }
  }

  Nextscope.views.toggle = toggle;
  Nextscope.views.saveNewView = saveNewView;
  Nextscope.views.exportJSON = exportJSON;
  Nextscope.views.renderButtons = renderButtons;

  document.addEventListener('DOMContentLoaded', init);
})();
