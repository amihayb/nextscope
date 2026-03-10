(() => {
  const Nextscope = window.Nextscope || (window.Nextscope = {});
  Nextscope.ui = Nextscope.ui || {};
  const ui = Nextscope.ui;

  function getCheckedBoxes(chkboxName) {
    const checkboxes = document.getElementsByName(chkboxName);
    const checkboxesChecked = [];
    for (let i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        checkboxesChecked.push(checkboxes[i]);
      }
    }
    return checkboxesChecked;
  }

  function addDropdown(values) {
    const select = document.createElement("select");
    select.name = "x_axis";
    select.id = "x_axis";

    for (const val of values) {
      const option = document.createElement("option");
      option.value = val;
      option.text = val.charAt(0).toUpperCase() + val.slice(1);
      select.appendChild(option);
    }

    const label = document.createElement("label");
    label.innerHTML = "X Axis: ";
    label.htmlFor = "x_axis";

    const container = document.getElementById("xaxis_dropdown");
    if (container) {
      container.appendChild(label).appendChild(select);
    }
  }

  function addCheckbox(colName) {
    const cont = document.createElement('container');
    cont.className = "container1";
    cont.id = colName;
    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.id = colName;
    checkbox.name = "signalCheckbox";
    checkbox.onclick = () => {
      if (Nextscope.actions && Nextscope.actions.selectSignals) {
        Nextscope.actions.selectSignals();
      }
    };

    const checkbox2 = document.createElement('input');
    checkbox2.type = "checkbox";
    checkbox2.id = colName;
    checkbox2.name = "signalCheckbox2";
    checkbox2.onclick = () => {
      if (Nextscope.actions && Nextscope.actions.selectSignals) {
        Nextscope.actions.selectSignals();
      }
    };

    const br = document.createElement('br');
    br.onclick = "console.log(\"click\")";

    const element = document.getElementById("checkboxesPlace");
    if (!element) {
      return;
    }
    element.appendChild(cont);
    cont.appendChild(checkbox);
    cont.appendChild(checkbox2);
    cont.appendChild(document.createTextNode(colName));
    cont.appendChild(br);
  }

  function cleanUp() {
    const explanationText = document.getElementById("explenation_text");
    if (explanationText) {
      explanationText.style.display = "none";
    }

    const containers = document.getElementsByClassName("container1");
    for (let i = containers.length - 1; i >= 0; i--) {
      containers[i].remove();
    }
    const dropdown = document.getElementById("xaxis_dropdown");
    if (dropdown && dropdown.children.length > 0) {
      dropdown.children[0].remove();
    }
  }

  function getXAxisName() {
    const xAxis = document.getElementById("x_axis");
    return xAxis ? xAxis.value : null;
  }

  ui.getCheckedBoxes = getCheckedBoxes;
  ui.addDropdown = addDropdown;
  ui.addCheckbox = addCheckbox;
  ui.cleanUp = cleanUp;
  ui.getXAxisName = getXAxisName;
})();
