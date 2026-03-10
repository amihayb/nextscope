(() => {
  const Glimpse = window.Glimpse || (window.Glimpse = {});
  Glimpse.io = Glimpse.io || {};
  const io = Glimpse.io;

  function attachFileSelector() {
    const fileSelector = document.getElementById('file-selector');
    if (!fileSelector) {
      return;
    }
    fileSelector.addEventListener('change', (event) => {
      const fileList = event.target.files;
      if (!fileList) {
        return;
      }
      for (const file of fileList) {
        readFile(file);
      }
    });
  }

  function attachDragAndDrop(targetIds) {
    if (!Array.isArray(targetIds)) {
      return;
    }

    targetIds.forEach((targetId) => {
      const target = document.getElementById(targetId);
      if (!target) {
        return;
      }

      const addActive = () => target.classList.add('drop-target--active');
      const removeActive = () => target.classList.remove('drop-target--active');

      target.addEventListener('dragenter', (event) => {
        event.preventDefault();
        addActive();
      });

      target.addEventListener('dragover', (event) => {
        event.preventDefault();
        addActive();
      });

      target.addEventListener('dragleave', () => {
        removeActive();
      });

      target.addEventListener('drop', (event) => {
        event.preventDefault();
        removeActive();
        const files = event.dataTransfer ? event.dataTransfer.files : null;
        if (!files) {
          return;
        }
        for (const file of files) {
          readFile(file);
        }
      });
    });
  }

  function readFile(file) {
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const text = event.target.result || "";
      const labelsNav = document.getElementById("labelsNavBar");
      const labelsInput = document.getElementById("labelsInput");
      const useLabels = labelsNav && labelsNav.style.display !== "none";
      const labelsText = labelsInput ? labelsInput.value : "";
      const parsed = Glimpse.data.parseText(text, { useLabels, labelsText });
      if (Glimpse.actions && Glimpse.actions.handleDataLoaded) {
        Glimpse.actions.handleDataLoaded({
          rows: parsed.rows,
          header: parsed.header,
          fileName: file.name
        });
      }
    });
    reader.readAsText(file);
  }

  io.attachFileSelector = attachFileSelector;
  io.attachDragAndDrop = attachDragAndDrop;
  io.readFile = readFile;
})();
