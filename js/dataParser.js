(() => {
  const Glimpse = window.Glimpse || (window.Glimpse = {});
  Glimpse.data = Glimpse.data || {};
  const data = Glimpse.data;

  function parseLine(row) {
    const safeRow = row == null ? "" : String(row);
    return safeRow.split(",");
  }

  function defineObj(header) {
    const obj = {};
    for (let i = 0; i < header.length; i++) {
      obj[header[i]] = [];
    }
    return obj;
  }

  function verifyGoodName(name) {
    return name.map(element => element.replace(' ', ''));
  }

  function header4noHeader(n) {
    const headerObj = {
      header: ["TIME"],
      startIdx: 0
    };
    for (let i = 1; i < n; i++) {
      headerObj.header.push("S" + i);
    }
    return headerObj;
  }

  function isEcopiaHeader(header) {
    return header.includes("Yaw") && header.includes("BatteryVoltage");
  }

  function getHeader(resultLines, options) {
    const headerObj = {
      header: Glimpse.config.defaultHeader.slice(),
      startIdx: 0
    };

    const scanLimit = Math.min(Glimpse.config.maxHeaderScanLines, resultLines.length);
    let detectedHeader = null;
    let detectedStartIdx = 0;

    for (let i = 0; i < scanLimit; i++) {
      const tLine = parseLine(resultLines[i]);
      if (tLine.length > 2 && isNaN(tLine[1])) {
        detectedHeader = verifyGoodName(tLine);
        detectedStartIdx = i + 1;
        break;
      }
    }

    if (options && options.useLabels && options.labelsText) {
      const userHeader = parseLine(options.labelsText);
      if (userHeader.length > 2 && isNaN(userHeader[1])) {
        headerObj.header = verifyGoodName(userHeader);
        headerObj.startIdx = 0;
        return headerObj;
      }
    }

    if (detectedHeader) {
      headerObj.header = detectedHeader;
      headerObj.startIdx = detectedStartIdx;
    }

    const sampleLine = parseLine(resultLines[headerObj.startIdx] || "");
    if (sampleLine.length !== headerObj.header.length) {
      return header4noHeader(sampleLine.length);
    }

    return headerObj;
  }

  function parseText(text, options) {
    const resultLines = text.split(/\r?\n/);
    const headerObj = getHeader(resultLines, options);
    const rows = defineObj(headerObj.header);

    for (let i = headerObj.startIdx; i < resultLines.length; i++) {
      const tLine = parseLine(resultLines[i]);
      if (tLine.length === headerObj.header.length) {
        for (let j = 0; j < headerObj.header.length; j++) {
          rows[headerObj.header[j]].push(tLine[j]);
        }
      }
    }

    return { rows, header: headerObj.header, startIdx: headerObj.startIdx };
  }

  data.parseLine = parseLine;
  data.defineObj = defineObj;
  data.verifyGoodName = verifyGoodName;
  data.header4noHeader = header4noHeader;
  data.getHeader = getHeader;
  data.isEcopiaHeader = isEcopiaHeader;
  data.parseText = parseText;
})();
