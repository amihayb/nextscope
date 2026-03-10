(() => {
  const Nextscope = window.Nextscope || (window.Nextscope = {});
  Nextscope.state = {
    rows: {},
    header: [],
    fileName: null
  };
  Nextscope.actions = Nextscope.actions || {};

  function handleDataLoaded(payload) {
    Nextscope.state.rows = payload.rows;
    Nextscope.state.header = payload.header;
    Nextscope.state.fileName = payload.fileName || null;

    Nextscope.ui.cleanUp();
    Nextscope.ui.addDropdown(payload.header);
    payload.header.forEach(Nextscope.ui.addCheckbox);

    if (Nextscope.data.isEcopiaHeader(payload.header)) {
      setEcopiaRec();
    }

    setExampleButtonVisible(false);
    plotDefaultSignals();
  }

  function plotDefaultSignals() {
    const rows = Nextscope.state.rows;
    const header = Nextscope.state.header;
    const xAxis = Nextscope.ui.getXAxisName();
    const preferred = ["OUTPUT", "ENCODERS_DIFF"];
    const available = preferred.filter(name => rows[name]);
    let signals = available;
    if (signals.length === 0) {
      signals = header.filter(name => name !== xAxis).slice(0, 2);
    }

    const traces = signals.map(name => Nextscope.plot.buildTrace(name, 0, rows, xAxis));
    const layout = Nextscope.plot.buildLayout(1, { roworder: 'bottom to top' });
    Nextscope.plot.render(traces, layout);
  }

  function showExample() {
    const header = ["TIME", "Sine", "Cosine", "Random"];
    const rows = Nextscope.data.defineObj(header);
    rows["TIME"] = Plotly.d3.range(0.1, 10, 0.1);
    rows["Sine"] = rows["TIME"].map(x => Math.sin(x));
    rows["Cosine"] = rows["TIME"].map(x => Math.cos(x));
    rows["Random"] = rows["TIME"].map(x => Math.random());

    Nextscope.state.rows = rows;
    Nextscope.state.header = header;

    Nextscope.ui.cleanUp();
    Nextscope.ui.addDropdown(header);
    header.forEach(Nextscope.ui.addCheckbox);

    const traces = [
      Nextscope.plot.buildTrace(header[1], 1, rows, "TIME"),
      Nextscope.plot.buildTrace(header[2], 1, rows, "TIME")
    ];
    const layout = Nextscope.plot.buildLayout(1, { roworder: 'bottom to top' });
    Nextscope.plot.render(traces, layout);
    setExampleButtonVisible(false);
  }

  function setExampleButtonVisible(isVisible) {
    const button = document.getElementById("exampleDataButton");
    if (!button) {
      return;
    }
    button.style.display = isVisible ? "" : "none";
  }

  function selectSignals() {
    const checkedBoxes = Nextscope.ui.getCheckedBoxes("signalCheckbox");
    const checkedBoxes2 = Nextscope.ui.getCheckedBoxes("signalCheckbox2");
    const rows = Nextscope.state.rows;
    const xAxis = Nextscope.ui.getXAxisName();

    const traces = [];
    checkedBoxes.forEach(box => {
      traces.push(Nextscope.plot.buildTrace(box.id, 1, rows, xAxis));
    });
    checkedBoxes2.forEach(box => {
      traces.push(Nextscope.plot.buildTrace(box.id, 2, rows, xAxis));
    });

    const layout = Nextscope.plot.buildLayout(2);
    Nextscope.plot.render(traces, layout);
  }

  function setEcopiaRec() {
    const rows = Nextscope.state.rows;
    rows["Yaw"] = Nextscope.data.transforms.mult(rows["Yaw"], 0.01);
    rows["Pitch"] = Nextscope.data.transforms.mult(rows["Pitch"], 0.01);
    rows["Roll"] = Nextscope.data.transforms.mult(rows["Roll"], 0.01);
    rows["Yaw_angFix"] = Nextscope.data.transforms.fixAngle(rows["Yaw"]);
    Nextscope.ui.addCheckbox("Yaw_angFix");
  }

  function menuItemExecute(caller, action) {
    const rows = Nextscope.state.rows;
    switch (action) {
      case "Rename":
        renameVar(caller);
        break;
      case "Mult": {
        const factor = prompt(caller + " x ? ", 0.01);
        if (factor !== null) {
          const newVarName = Nextscope.data.strClean(caller + "_x_" + factor);
          rows[newVarName] = Nextscope.data.transforms.mult(rows[caller], factor);
          Nextscope.ui.addCheckbox(newVarName);
        }
        break;
      }
      case "Diff":
        rows[caller + "_diff"] = Nextscope.data.transforms.diff(rows[caller]);
        Nextscope.ui.addCheckbox(caller + "_diff");
        break;
      case "Integrate":
        rows[caller + "_int"] = Nextscope.data.transforms.integrate(rows[caller]);
        Nextscope.ui.addCheckbox(caller + "_int");
        break;
      case "filter": {
        const filterW = prompt("LPF Cutoff Frequency? [Hz] ", 5);
        if (filterW !== null) {
          rows[caller + "_filter"] = Nextscope.data.transforms.filter(rows[caller], filterW);
          Nextscope.ui.addCheckbox(caller + "_filter");
        }
        break;
      }
      case "Detrend":
        rows[caller + "_detrend"] = Nextscope.data.transforms.detrend(rows[caller]);
        Nextscope.ui.addCheckbox(caller + "_detrend");
        break;
      case "removeFirst":
        rows[caller + "_rem1"] = Nextscope.data.transforms.removeFirst(rows[caller]);
        Nextscope.ui.addCheckbox(caller + "_rem1");
        break;
      case "removeMean":
        rows[caller + "_remMean"] = Nextscope.data.transforms.removeMean(rows[caller]);
        Nextscope.ui.addCheckbox(caller + "_remMean");
        break;
      case "fixAngle":
        rows[caller + "_angFix"] = Nextscope.data.transforms.fixAngle(rows[caller]);
        Nextscope.ui.addCheckbox(caller + "_angFix");
        break;
      case "showStat":
        showStat();
        break;
      case "cutToZoom":
        cutToZoom();
        break;
      case "dataTips":
        markDataTips();
        break;
    }
  }

  function renameVar(oldName) {
    const newName = prompt("Please enter new variable name", oldName);
    if (newName != null && newName !== oldName) {
      const rows = Nextscope.state.rows;
      rows[newName] = rows[oldName];
      delete rows[oldName];
      const toChange = document.getElementById(oldName);
      if (toChange) {
        toChange.innerHTML = toChange.innerHTML.replaceAll(oldName, newName);
        toChange.onclick = selectSignals;
      }
    }
  }

  function showStat() {
    const gd = document.getElementById('plot');
    const xRange = gd.layout.xaxis.range;
    let yRange;
    try {
      yRange = gd.layout.yaxis.range;
    } catch {
      yRange = gd.layout.yaxis2.range;
    }
    const rows = Nextscope.state.rows;
    const xAxis = Nextscope.ui.getXAxisName();

    let xIdx = [];
    if (typeof rows[xAxis][2] === 'string') {
      xIdx[0] = rows[xAxis][Math.floor(xRange[0])];
      xIdx[1] = rows[xAxis][Math.floor(xRange[1])];
    } else {
      xIdx = xRange;
    }

    const stat = {
      Name: [],
      Mean: [],
      STD: [],
      Min: [],
      Max: []
    };

    gd.data.forEach(trace => {
      const len = Math.min(trace.x.length, trace.y.length);
      const xInside = [];
      const yInside = [];

      for (let i = 0; i < len; i++) {
        const x = trace.x[i];
        const y = trace.y[i];

        if (x > xIdx[0] && x < xIdx[1] && y > yRange[0] && y < yRange[1]) {
          xInside.push(x);
          yInside.push(y);
        }
      }
      stat.Name.push(trace.name);
      stat.Mean.push(Nextscope.data.stats.mean(yInside));
      stat.STD.push(Nextscope.data.stats.std(yInside));
      stat.Min.push(Math.min(...yInside));
      stat.Max.push(Math.max(...yInside));
    });

    alert(niceStr(stat));

    function niceStr(stat) {
      let str = '';
      for (let i = 0; i < stat.Mean.length; i++) {
        str += stat.Name[i] + ': \n';
        str += 'Min: ' + stat.Min[i].toFixed(3) + '\n';
        str += 'Max: ' + stat.Max[i].toFixed(3) + '\n';
        str += 'Mean: ' + stat.Mean[i].toFixed(3) + '\n';
        str += 'STD: ' + stat.STD[i].toFixed(3) + '\n\n';
      }
      return str;
    }
  }

  function cutToZoom() {
    const gd = document.getElementById('plot');
    const xRange = gd.layout.xaxis.range;
    const xAxis = Nextscope.ui.getXAxisName();
    const rows = Nextscope.state.rows;

    let idx = [];
    if (typeof rows[xAxis][2] !== 'string') {
      idx[0] = rows[xAxis].findIndex((val) => val > xRange[0]);
      idx[1] = rows[xAxis].findIndex((val) => val > xRange[1]);
    } else {
      idx = xRange;
    }

    const fields = Object.keys(rows);
    fields.forEach(field => {
      rows[field] = rows[field].slice(idx[0], idx[1]);
    });

    selectSignals();
  }

  function relativeTime() {
    const rows = Nextscope.state.rows;
    const Ts = prompt("Time Sample?", Nextscope.config.defaultSampleTime);
    Nextscope.state.rows = addTimeVectorToExistingObject(rows, Ts);
    Nextscope.ui.addCheckbox("Time");

    const selectElement = document.getElementById("x_axis");
    const newOption = document.createElement("option");
    newOption.value = "Time";
    newOption.text = "Time";
    if (selectElement) {
      selectElement.insertBefore(newOption, selectElement.firstChild);
    }

    function addTimeVectorToExistingObject(existingObject, sampleTime) {
      if (typeof existingObject !== 'object' || existingObject === null) {
        throw new Error('Invalid existing object. Please provide a valid object.');
      }
      const firstVectorKey = Object.keys(existingObject)[0];
      const vectorLength = existingObject[firstVectorKey].length;
      const timeVector = Array.from({ length: vectorLength }, (_, i) => i * sampleTime);
      return { Time: timeVector, ...existingObject };
    }
  }

  function markDataTips() {
    const myPlot = document.getElementById('plot');
    myPlot.on('plotly_click', function (data) {
      for (let i = 0; i < data.points.length; i++) {
        const annotateText = 'x = ' + data.points[i].x +
          ', y = ' + data.points[i].y.toPrecision(4);
        const annotation = {
          text: annotateText,
          x: data.points[i].x,
          y: parseFloat(data.points[i].y.toPrecision(4)),
          xref: data.points[0].xaxis._id,
          yref: data.points[0].yaxis._id
        };
        const annotations = myPlot.layout.annotations || [];
        annotations.push(annotation);
        Plotly.relayout('plot', { annotations: annotations });
      }
    });
  }

  function export2csv() {
    Nextscope.data.exportToCsv('download.csv', Nextscope.state.rows);
  }

  function addLabelsLine() {
    const labelsNavBar = document.getElementById("labelsNavBar");
    if (!labelsNavBar) {
      return;
    }

    if (labelsNavBar.style.display === "none") {
      labelsNavBar.style.display = 'flex';
      document.body.classList.add("labels-open");

      const signalLabels = localStorage["SignalLabels"];
      if (signalLabels !== undefined) {
        document.getElementById("labelsInput").value = signalLabels;
      }
      document.getElementById("labelsInput").addEventListener('input', updateValue);
    } else {
      labelsNavBar.style.display = 'none';
      document.body.classList.remove("labels-open");
    }

    function updateValue() {
      localStorage.setItem('SignalLabels', document.getElementById("labelsInput").value);
    }
  }

  function initSidenavResizer() {
    const resizer = document.getElementById("sidenav-resizer");
    if (!resizer) {
      return;
    }

    const root = document.documentElement;
    const minWidth = 200;
    const maxWidth = 520;

    function setWidths(width) {
      const clamped = Math.min(Math.max(width, minWidth), maxWidth);
      root.style.setProperty("--sidenav-width", `${clamped}px`);
      root.style.setProperty("--explenation-offset", `${clamped + 20}px`);
      root.style.setProperty("--plot-offset", `${Math.max(clamped - 20, 0)}px`);
    }

    resizer.addEventListener("mousedown", (event) => {
      event.preventDefault();
      document.body.classList.add("resizing");

      function onMouseMove(moveEvent) {
        setWidths(moveEvent.clientX);
      }

      function onMouseUp() {
        document.body.classList.remove("resizing");
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      }

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });
  }

  function initDropIndicator() {
    const indicator = document.querySelector(".drop-indicator");
    const fileSelector = document.getElementById("file-selector");
    if (!indicator || !fileSelector) {
      return;
    }

    indicator.addEventListener("click", () => {
      fileSelector.click();
    });
  }

  function init() {
    if (Nextscope.io && Nextscope.io.attachFileSelector) {
      Nextscope.io.attachFileSelector();
    }
    if (Nextscope.io && Nextscope.io.attachDragAndDrop) {
      Nextscope.io.attachDragAndDrop(["explenation_text", "plot"]);
    }
    setExampleButtonVisible(true);
    initSidenavResizer();
    initDropIndicator();
  }

  Nextscope.actions.handleDataLoaded = handleDataLoaded;
  Nextscope.actions.showExample = showExample;
  Nextscope.actions.selectSignals = selectSignals;
  Nextscope.actions.menuItemExecute = menuItemExecute;
  Nextscope.actions.renameVar = renameVar;
  Nextscope.actions.showStat = showStat;
  Nextscope.actions.cutToZoom = cutToZoom;
  Nextscope.actions.relativeTime = relativeTime;
  Nextscope.actions.markDataTips = markDataTips;
  Nextscope.actions.export2csv = export2csv;
  Nextscope.actions.addLabelsLine = addLabelsLine;

  document.addEventListener('DOMContentLoaded', init);

  window.about = function () {
    Swal.fire({
      title: "Nextscope<br>NextPower Telemetry Analysis",
      html: "For support, contact me:<br><br> Amihay Blau <br> mail: amihay@blaurobotics.co.il <br> Phone: +972-54-6668902",
      icon: "info"
    });
  };
})();
