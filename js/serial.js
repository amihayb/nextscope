(() => {
  const Nextscope = window.Nextscope || (window.Nextscope = {});
  Nextscope.serial = Nextscope.serial || {};

  let port = null;
  let reader = null;
  let readableStreamClosed = null;
  let lineBuffer = '';
  let isInitialized = false;
  let pendingUpdate = false;
  let updateTimer = null;

  let fetchMode = false;
  let fetchBuffer = '';
  let fetchTimeout = null;

  const FETCH_COMMAND = 'flog read normal\r';
  const ERASE_COMMAND = 'flog erase\r';
  const FETCH_IDLE_MS = 1500;
  const FETCH_CHAR_DELAY_MS = 5;

  async function toggleConnection() {
    if (port) {
      await disconnect();
    } else {
      await connect();
    }
  }

  async function connect() {
    if (!navigator.serial) {
      Swal.fire({
        icon: 'error',
        title: 'Not Supported',
        text: 'Web Serial API is not supported in this browser. Please use Chrome or Edge (desktop).'
      });
      return;
    }

    try {
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      console.log('[Serial] Connected at 115200 baud');

      lineBuffer = '';
      isInitialized = false;
      pendingUpdate = false;

      setConnected(true);
      startUpdateTimer();
      readLoop();
    } catch (err) {
      port = null;
      if (err.name !== 'NotFoundError') {
        Swal.fire({ icon: 'error', title: 'Connection Failed', text: err.message });
      }
      console.warn('[Serial] Connection failed:', err.message);
    }
  }

  async function disconnect() {
    stopUpdateTimer();
    try {
      if (reader) {
        await reader.cancel().catch(() => {});
        reader = null;
      }
      if (readableStreamClosed) {
        await readableStreamClosed.catch(() => {});
        readableStreamClosed = null;
      }
      if (port) {
        await port.close().catch(() => {});
        port = null;
      }
    } catch (err) {
      console.warn('[Serial] Disconnect error:', err);
    }
    console.log('[Serial] Disconnected');
    setConnected(false);
  }

  async function readLoop() {
    try {
      const textDecoder = new TextDecoderStream();
      readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      reader = textDecoder.readable.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        processChunk(value);
      }
    } catch (err) {
      if (port) console.warn('Serial read error:', err);
    } finally {
      if (reader) {
        reader.releaseLock();
        reader = null;
      }
    }
  }

  function processChunk(chunk) {
    if (fetchMode) {
      fetchBuffer += chunk;
      if (fetchTimeout) clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(() => {
        fetchMode = false;
        fetchTimeout = null;
        console.log(`[Serial] Fetch response complete — ${fetchBuffer.trim().split(/\r?\n/).length} lines received`);
        saveFetchedCsv();
      }, FETCH_IDLE_MS);
    }

    lineBuffer += chunk;
    const lines = lineBuffer.split(/\r?\n/);
    lineBuffer = lines.pop();
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) processLine(trimmed);
    }
  }

  async function fetchData() {
    if (!port) {
      Swal.fire({ icon: 'warning', title: 'Not Connected', text: 'Please connect to a serial port first.' });
      return;
    }

    fetchBuffer = '';
    fetchMode = true;
    console.log('[Serial] Sending fetch command:', FETCH_COMMAND.trim());

    await sendCommand(FETCH_COMMAND);
    console.log('[Serial] Fetch command sent, waiting for response...');
  }

  async function eraseData() {
    if (!port) {
      Swal.fire({ icon: 'warning', title: 'Not Connected', text: 'Please connect to a serial port first.' });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      icon: 'warning',
      title: 'Erase Data?',
      text: 'This will send the erase command to the device. Are you sure?',
      showCancelButton: true,
      confirmButtonText: 'Erase'
    });
    if (!isConfirmed) return;

    console.log('[Serial] Sending erase command:', ERASE_COMMAND.trim());
    await sendCommand(ERASE_COMMAND);
    console.log('[Serial] Erase command sent');
  }

  async function sendCommand(command) {
    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    try {
      for (const char of command) {
        await writer.write(encoder.encode(char));
        await new Promise(resolve => setTimeout(resolve, FETCH_CHAR_DELAY_MS));
      }
    } finally {
      writer.releaseLock();
    }
  }

  function saveFetchedCsv() {
    const data = fetchBuffer.trim();
    if (!data) return;
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flog_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function processLine(line) {
    const parts = line.split(',');
    if (parts.length < 2) return;

    if (!isInitialized) {
      let header;
      if (isNaN(parts[1])) {
        header = Nextscope.data.verifyGoodName(parts.map(s => s.trim()));
      } else {
        header = Nextscope.data.header4noHeader(parts.length).header;
        appendDataLine(parts, header);
      }
      const rows = Nextscope.data.defineObj(header);
      Nextscope.state.rows = rows;
      Nextscope.state.header = header;
      Nextscope.state.fileName = 'Serial Port';

      Nextscope.ui.cleanUp();
      Nextscope.ui.addDropdown(header);
      header.forEach(Nextscope.ui.addCheckbox);

      const exBtn = document.getElementById('exampleDataButton');
      if (exBtn) exBtn.style.display = 'none';

      isInitialized = true;
      pendingUpdate = true;
    } else {
      appendDataLine(parts, Nextscope.state.header);
    }
  }

  function appendDataLine(parts, header) {
    const rows = Nextscope.state.rows;
    if (!rows || parts.length !== header.length) return;
    for (let j = 0; j < header.length; j++) {
      rows[header[j]].push(parseFloat(parts[j]));
    }
    pendingUpdate = true;
  }

  function liveRender() {
    if (!isInitialized) return;
    const rows = Nextscope.state.rows;
    const header = Nextscope.state.header;

    const checkedBoxes = Nextscope.ui.getCheckedBoxes('signalCheckbox');
    const checkedBoxes2 = Nextscope.ui.getCheckedBoxes('signalCheckbox2');

    if (checkedBoxes.length > 0 || checkedBoxes2.length > 0) {
      Nextscope.actions.selectSignals();
      return;
    }

    const xAxis = Nextscope.ui.getXAxisName();
    const preferred = ['OUTPUT', 'ENCODERS_DIFF'];
    const available = preferred.filter(name => rows[name] && rows[name].length > 0);
    const signals = available.length > 0
      ? available
      : header.filter(name => name !== xAxis).slice(0, 2);

    const traces = signals.map(name => Nextscope.plot.buildTrace(name, 0, rows, xAxis));
    const layout = Nextscope.plot.buildLayout(1, { roworder: 'bottom to top' });
    Nextscope.plot.render(traces, layout);
  }

  function startUpdateTimer() {
    updateTimer = setInterval(() => {
      if (pendingUpdate) {
        pendingUpdate = false;
        liveRender();
      }
    }, 500);
  }

  function stopUpdateTimer() {
    if (updateTimer) {
      clearInterval(updateTimer);
      updateTimer = null;
    }
  }

  function setConnected(connected) {
    const btn = document.getElementById('serial-connect-btn');
    if (btn) {
      if (connected) {
        btn.classList.add('serial-connected');
        btn.title = 'Disconnect Serial Port';
      } else {
        btn.classList.remove('serial-connected');
        btn.title = 'Connect to Serial Port';
      }
    }
    const fetchBtn = document.getElementById('serial-fetch-btn');
    if (fetchBtn) fetchBtn.classList.toggle('serial-disabled', !connected);

    const eraseBtn = document.getElementById('serial-erase-btn');
    if (eraseBtn) eraseBtn.classList.toggle('serial-disabled', !connected);
  }

  Nextscope.serial.toggleConnection = toggleConnection;
  Nextscope.serial.connect = connect;
  Nextscope.serial.disconnect = disconnect;
  Nextscope.serial.fetchData = fetchData;
  Nextscope.serial.eraseData = eraseData;

  document.addEventListener('DOMContentLoaded', () => setConnected(false));
})();
