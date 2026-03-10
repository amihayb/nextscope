(() => {
  const Glimpse = window.Glimpse || (window.Glimpse = {});
  Glimpse.data = Glimpse.data || {};
  const data = Glimpse.data;

  function mean(array) {
    return array.reduce((a, b) => parseFloat(a) + parseFloat(b)) / array.length;
  }

  function std(values) {
    const mu = mean(values);
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += Math.pow(Math.abs(values[i] - mu), 2);
    }
    return Math.sqrt(sum / (values.length - 1));
  }

  function mult(array, factor) {
    return array.map((x) => x * factor);
  }

  function removeFirst(array) {
    return array.map((item, idx, all) => parseFloat(item) - parseFloat(all[0]));
  }

  function removeMean(array) {
    return array.map((item, idx, all) => parseFloat(item) - mean(all));
  }

  function diff(y, sampleTime) {
    const Ts = sampleTime ?? Glimpse.config.defaultSampleTime;
    const d = [];
    for (let i = 1; i < y.length; i++) {
      d[i] = (Number(y[i]) - Number(y[i - 1])) / Ts;
    }
    d[0] = d[1];
    return d;
  }

  function integrate(y, sampleTime) {
    const Ts = sampleTime ?? Glimpse.config.defaultSampleTime;
    const yInt = [];
    yInt[0] = parseFloat(y[0]);
    for (let i = 1; i < y.length; i++) {
      yInt[i] = yInt[i - 1] + Ts * parseFloat(y[i]);
    }
    return yInt;
  }

  function filter(y, ws) {
    const Ts = Glimpse.config.defaultSampleTime;
    const w = parseFloat(ws);
    const pi = 3.1416;
    const D0 = pi ** 2 * w ** 2 + 140 * pi * w + 10000;
    const D1 = (2 * pi ** 2 * w ** 2 - 20000) / D0;
    const D2 = (pi ** 2 * w ** 2 - 140 * pi * w + 10000) / D0;
    const N0 = (w ** 2 * pi ** 2) / D0;
    const N1 = (2 * w ** 2 * pi ** 2) / D0;
    const N2 = N0;

    const yf = [];
    for (let i = 0; i < y.length; i++) {
      yf[i] = (i >= 2)
        ? parseFloat(N0 * y[i] + N1 * y[i - 1] + N2 * y[i - 2] - D1 * yf[i - 1] - D2 * yf[i - 2])
        : parseFloat(y[i]);
    }
    return yf;
  }

  function detrend(y) {
    const a = (parseFloat(y[y.length - 1]) - parseFloat(y[0])) / (y.length - 1);
    return y.map((item, i) => parseFloat(y[i]) - a * i);
  }

  function fixAngle(y) {
    const yo = [];
    let bias = 0;
    yo[0] = y[0];
    for (let i = 1; i < y.length; i++) {
      bias += (y[i] - y[i - 1] > 300) ? -360 : 0;
      bias += (y[i] - y[i - 1] < -300) ? 360 : 0;
      yo[i] = y[i] + bias;
    }
    return yo;
  }

  function strClean(str) {
    return str.replace(/[^a-zA-Z0-9 ]/g, "");
  }

  function exportToCsv(filename, rows) {
    const processRow = function (row) {
      let finalVal = '';
      for (let j = 0; j < row.length; j++) {
        const result = processVal(row[j]);
        if (j > 0) {
          finalVal += ',';
        }
        finalVal += result;
      }
      return finalVal + '\n';
    };

    let csvFile = '';
    const fields = Object.keys(rows);
    csvFile += processRow(Object.keys(rows));
    for (let j = 0; j < rows[fields[0]].length; j++) {
      csvFile += columnToRow(rows, j);
    }

    const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, filename);
    } else {
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }

    function columnToRow(row, j) {
      let finalVal = '';
      Object.keys(rows).forEach(field => {
        finalVal += processVal(row[field][j]) + ',';
      });
      finalVal = finalVal.slice(0, -1);
      return finalVal + '\n';
    }

    function processVal(val) {
      let innerValue = val === null ? '' : val.toString();
      if (val instanceof Date) {
        innerValue = val.toLocaleString();
      }
      let result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) {
        result = '"' + result + '"';
      }
      return result;
    }
  }

  data.stats = {
    mean,
    std
  };

  data.transforms = {
    diff,
    integrate,
    filter,
    detrend,
    fixAngle,
    mult,
    removeFirst,
    removeMean
  };

  data.strClean = strClean;
  data.exportToCsv = exportToCsv;
})();
