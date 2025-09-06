document.addEventListener("DOMContentLoaded", () => {
    // --- Globale variabelen en DOM-elementen ---
    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d");

    let gridWidth = 20;
    let gridHeight = 20;
    let cellSize, radius;
    let drawingMatrix = [];
    let history = [];
    let historyPointer = -1;

    // --- Tool state ---
    let currentMode = 'bouwkaart';
    let currentTool = "color";
    let currentColorName = "Zwart";
    let isDrawing = false;
    let drawingModeColor = null;

    // --- DOM Elementen ---
    const gridWidthInput = document.getElementById('gridWidth');
    const gridHeightInput = document.getElementById('gridHeight');
    const updateGridSizeBtn = document.getElementById('updateGridSizeBtn');
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const werkbladToolsDiv = document.getElementById('werkbladTools');
    const worksheetTypeControls = document.getElementById('worksheetTypeControls');
    const colorPaletteDiv = document.getElementById('colorPalette');
    const eyeToolBtn = document.getElementById('eyeToolBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearDrawingBtn = document.getElementById('clearDrawingBtn');
    const saveDrawingBtn = document.getElementById('saveDrawingBtn');
    const loadDrawingInput = document.getElementById('loadDrawingInput');
    const loadDrawingBtn = document.getElementById('loadDrawingBtn');
    const meldingContainer = document.getElementById('meldingContainer');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const showPreviewBtn = document.getElementById('showPreviewBtn');
    const werkbladModal = document.getElementById('werkblad-modal');
    const werkbladCanvas = document.getElementById('werkblad-canvas');
    const werkbladCtx = werkbladCanvas.getContext('2d');
    const sluitWerkbladBtn = document.getElementById('sluit-werkblad-btn');
    const werkbladDownloadPdfBtn = document.getElementById('werkblad-download-pdf');
    const werkbladDownloadPngBtn = document.getElementById('werkblad-download-png');

    const COLOR_INFO_MAP = [
        { name: "Wit", hex: "#FFFFFF" }, { name: "Zwart", hex: "#333333" },
        { name: "Grijs", hex: "#D3D3D3" }, { name: "Geel", hex: "#FFD700" },
        { name: "Rood", hex: "#FF4500" }, { name: "Oranje", hex: "#FF8C00" },
        { name: "Blauw", hex: "#1E90FF" }, { name: "Groen", hex: "#32CD32" },
        { name: "Paars", hex: "#9932CC" }, { name: "Bruin", hex: "#A0522D" },
        { name: "Roze", hex: "#FFB6C1" }, { name: "Lichtgroen", hex: "#90EE90" },
        { name: "Lichtblauw", hex: "#87CEEB" }, { name: "Lichtbruin", hex: "#CD853F" },
    ];
    function getColorInfoByName(name) { return COLOR_INFO_MAP.find(c => c.name === name); }

    function getCellMetrics(totalWidth, totalHeight) {
        const cellWidth = totalWidth / gridWidth;
        const cellHeight = totalHeight / gridHeight;
        cellSize = Math.min(cellWidth, cellHeight);
        radius = (cellSize * 0.9) / 2;
    }

    function drawCircle(targetCtx, col, row, cellData, currentCellSize, currentRadius, yOffset = 0) {
        const centerX = (col + 0.5) * currentCellSize;
        const centerY = (row + 0.5) * currentCellSize + yOffset;
        const colorInfo = getColorInfoByName(cellData.color);

        targetCtx.fillStyle = colorInfo ? colorInfo.hex : '#FFFFFF';
        targetCtx.strokeStyle = '#CCCCCC';
        targetCtx.lineWidth = 1;

        targetCtx.beginPath();
        targetCtx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI);
        targetCtx.fill();
        targetCtx.stroke();

        if (cellData.special === 'eye') {
            const eyeRadius = currentRadius * 0.8;
            targetCtx.fillStyle = '#FFFFFF';
            targetCtx.beginPath();
            targetCtx.arc(centerX, centerY, eyeRadius, 0, 2 * Math.PI);
            targetCtx.fill();
            targetCtx.strokeStyle = '#000000';
            targetCtx.stroke();
            targetCtx.fillStyle = '#000000';
            targetCtx.beginPath();
            targetCtx.arc(centerX, centerY, eyeRadius * 0.5, 0, 2 * Math.PI);
            targetCtx.fill();
            targetCtx.fillStyle = '#FFFFFF';
            targetCtx.beginPath();
            targetCtx.arc(centerX - eyeRadius * 0.2, centerY - eyeRadius * 0.2, eyeRadius * 0.2, 0, 2 * Math.PI);
            targetCtx.fill();
        }
    }

    function pixelToGridCell(x, y) {
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        return { col, row };
    }

    function initializeDrawingCanvas() {
        gridWidth = parseInt(gridWidthInput.value);
        gridHeight = parseInt(gridHeightInput.value);
        const defaultColor = (currentMode === 'bouwkaart') ? "Zwart" : "Wit";
        drawingMatrix = Array(gridHeight).fill(null).map(() =>
            Array(gridWidth).fill({ color: defaultColor, special: null })
        );
        redrawDrawing();
        saveState();
    }

    function populateColorPalette() {
        colorPaletteDiv.innerHTML = '';
        const colors = COLOR_INFO_MAP.filter(c => !['Zwart', 'Grijs'].includes(c.name));
        colors.forEach((c) => {
            const b = document.createElement('div');
            b.className = 'color-box';
            b.style.backgroundColor = c.hex;
            b.dataset.colorName = c.name;
            b.title = c.name;
            b.addEventListener('click', () => {
                document.querySelectorAll('.color-box').forEach(x => x.classList.remove('selected'));
                eyeToolBtn.classList.remove('selected');
                b.classList.add('selected');
                currentTool = 'color';
                currentColorName = c.name;
            });
            colorPaletteDiv.appendChild(b);
        });
        if (colorPaletteDiv.children.length > 0) {
            colorPaletteDiv.children[0].click();
        }
    }

    function redrawDrawing() {
        const container = canvas.parentElement;
        const maxContainerWidth = container.clientWidth * 0.95;
        const maxContainerHeight = container.clientHeight * 0.95;

        const potentialCellSizeW = maxContainerWidth / gridWidth;
        const potentialCellSizeH = maxContainerHeight / gridHeight;
        cellSize = Math.min(potentialCellSizeW, potentialCellSizeH);
        radius = (cellSize * 0.9) / 2;

        const canvasWidth = cellSize * gridWidth;
        const canvasHeight = cellSize * gridHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                const cellData = drawingMatrix[r][c] || { color: "Wit", special: null };
                drawCircle(ctx, c, r, cellData, cellSize, radius);
            }
        }
    }

    function getMousePos(canvasEl, evt) {
        const rect = canvasEl.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) * (canvasEl.width / rect.width),
            y: (evt.clientY - rect.top) * (canvasEl.height / rect.height)
        };
    }

    function paintCell(x, y) {
        const { col, row } = pixelToGridCell(x, y);
        if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
            const currentCell = drawingMatrix[row][col];
            let changed = false;
            if (currentMode === 'werkblad') {
                if (currentTool === 'eye') {
                    if (currentCell.special !== 'eye') {
                        drawingMatrix[row][col] = { ...currentCell, color: "Wit", special: 'eye' };
                        changed = true;
                    }
                } else {
                    if (currentCell.color !== currentColorName || currentCell.special !== null) {
                        drawingMatrix[row][col] = { color: currentColorName, special: null };
                        changed = true;
                    }
                }
            } else {
                if (currentCell.color !== drawingModeColor) {
                    drawingMatrix[row][col] = { ...currentCell, color: drawingModeColor };
                    changed = true;
                }
            }
            if (changed) { redrawDrawing(); }
        }
    }

    function updateControlsForMode() {
        currentMode = document.querySelector('input[name="mode"]:checked').value;
        if (currentMode === 'werkblad') {
            werkbladToolsDiv.style.display = 'block';
            worksheetTypeControls.style.display = 'block';
            populateColorPalette();
        } else {
            werkbladToolsDiv.style.display = 'none';
            worksheetTypeControls.style.display = 'none';
        }
        initializeDrawingCanvas();
    }

    function saveState() {
        if (historyPointer < history.length - 1) { history = history.slice(0, historyPointer + 1); }
        history.push(JSON.stringify({ matrix: drawingMatrix, width: gridWidth, height: gridHeight }));
        historyPointer = history.length - 1;
        updateUndoRedoButtons();
    }

    function undo() {
        if (historyPointer > 0) {
            historyPointer--;
            const state = JSON.parse(history[historyPointer]);
            loadState(state);
        }
    }

    function redo() {
        if (historyPointer < history.length - 1) {
            historyPointer++;
            const state = JSON.parse(history[historyPointer]);
            loadState(state);
        }
    }

    function loadState(state) {
        drawingMatrix = state.matrix;
        gridWidth = state.width;
        gridHeight = state.height;
        gridWidthInput.value = gridWidth;
        gridHeightInput.value = gridHeight;
        redrawDrawing();
        updateUndoRedoButtons();
    }

    function updateUndoRedoButtons() { undoBtn.disabled = historyPointer <= 0; redoBtn.disabled = historyPointer >= history.length - 1; }
    function clearDrawing() { initializeDrawingCanvas(); }

    function generateWorksheetPreview() {
        const type = document.querySelector('input[name="worksheetType"]:checked').value;
        werkbladModal.style.display = 'flex';
        setTimeout(() => {
            if (type === 'natekenen' && currentMode === 'werkblad') {
                drawRedrawPreview();
            } else {
                drawColoredPreview();
            }
        }, 10);
    }

    function generatePdf() {
        if (currentMode === 'bouwkaart') {
            return generateColoredPdf(true);
        }
        const type = document.querySelector('input[name="worksheetType"]:checked').value;
        if (type === 'natekenen') {
            return generateRedrawPdf();
        } else {
            return generateColoredPdf(true);
        }
    }

    function drawColoredPreview() {
        const aspect = gridWidth / gridHeight;
        let previewWidth = Math.min(window.innerWidth * 0.8, 600);
        let previewHeight = previewWidth / aspect;
        if(previewHeight > window.innerHeight * 0.7){
            previewHeight = window.innerHeight * 0.7;
            previewWidth = previewHeight * aspect;
        }

        werkbladCanvas.width = previewWidth;
        werkbladCanvas.height = previewHeight;
        const previewCellSize = previewWidth / gridWidth;
        const previewRadius = (previewCellSize * 0.9) / 2;

        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                drawCircle(werkbladCtx, c, r, drawingMatrix[r][c], previewCellSize, previewRadius);
            }
        }
    }

    function drawRedrawPreview() {
        const aspect = gridWidth / gridHeight;
        let singleGridWidth = Math.min(window.innerWidth * 0.8, 600);
        let singleGridHeight = singleGridWidth / aspect;
        const spacing = 30;
        
        if((singleGridHeight * 2 + spacing) > window.innerHeight * 0.8) {
            singleGridHeight = (window.innerHeight * 0.8 - spacing) / 2;
            singleGridWidth = singleGridHeight * aspect;
        }

        werkbladCanvas.width = singleGridWidth;
        werkbladCanvas.height = singleGridHeight * 2 + spacing;
        
        const previewCellSize = singleGridWidth / gridWidth;
        const previewRadius = (previewCellSize * 0.9) / 2;
        
        werkbladCtx.clearRect(0, 0, werkbladCanvas.width, werkbladCanvas.height);

        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                drawCircle(werkbladCtx, c, r, drawingMatrix[r][c], previewCellSize, previewRadius);
            }
        }
        const emptyCell = { color: 'Wit', special: null };
        const yOffset = singleGridHeight + spacing;
        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                drawCircle(werkbladCtx, c, r, emptyCell, previewCellSize, previewRadius, yOffset);
            }
        }
    }

    async function generateColoredPdf(isDownload = true) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;

        const boxW = pageWidth - margin * 2;
        const boxH = pageHeight - margin * 2;
        const aspect = gridWidth / gridHeight;
        let pdfGridW = boxW;
        let pdfGridH = pdfGridW / aspect;
        if(pdfGridH > boxH){
            pdfGridH = boxH;
            pdfGridW = pdfGridH * aspect;
        }
        const xOffset = (pageWidth - pdfGridW) / 2;
        const yOffset = (pageHeight - pdfGridH) / 2;

        const pdfCellSize = pdfGridW / gridWidth;
        const pdfRadius = (pdfCellSize * 0.9) / 2;

        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                const cellData = drawingMatrix[r][c];
                const colorInfo = getColorInfoByName(cellData.color);
                const centerX = xOffset + (c + 0.5) * pdfCellSize;
                const centerY = yOffset + (r + 0.5) * pdfCellSize;
                doc.setFillColor(colorInfo.hex.substring(1));
                doc.setDrawColor(204, 204, 204);
                doc.setLineWidth(0.1);
                doc.circle(centerX, centerY, pdfRadius, 'FD');
            }
        }
        if (isDownload) doc.save(`pixelart-werkblad.pdf`);
    }

    async function generateRedrawPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const spacing = 10;
        const aspect = gridWidth / gridHeight;
        
        let singleGridH = (pageHeight - (2 * margin) - spacing) / 2;
        let singleGridW = singleGridH * aspect;
        if(singleGridW > pageWidth - 2 * margin){
            singleGridW = pageWidth - 2 * margin;
            singleGridH = singleGridW / aspect;
        }

        const xOffset = (pageWidth - singleGridW) / 2;
        const pdfCellSize = singleGridW / gridWidth;
        const pdfRadius = (pdfCellSize * 0.9) / 2;
        const emptyCell = { color: 'Wit', special: null };
        const whiteColor = getColorInfoByName('Wit');

        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                const cell = drawingMatrix[r][c];
                const color = getColorInfoByName(cell.color);
                const cx = xOffset + (c + 0.5) * pdfCellSize;
                const cy = margin + (r + 0.5) * pdfCellSize;
                doc.setFillColor(color.hex.substring(1));
                doc.setDrawColor(204, 204, 204);
                doc.setLineWidth(0.1);
                doc.circle(cx, cy, pdfRadius, 'FD');
            }
        }

        const yOffset2 = margin + singleGridH + spacing;
        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                const cx = xOffset + (c + 0.5) * pdfCellSize;
                const cy = yOffset2 + (r + 0.5) * pdfCellSize;
                doc.setFillColor(whiteColor.hex.substring(1));
                doc.setDrawColor(204, 204, 204);
                doc.setLineWidth(0.1);
                doc.circle(cx, cy, pdfRadius, 'FD');
            }
        }
        doc.save('pixelart-natekenen-werkblad.pdf');
    }

    function setupEventListeners() {
        updateGridSizeBtn.addEventListener('click', initializeDrawingCanvas);
        modeRadios.forEach(radio => radio.addEventListener('change', updateControlsForMode));
        eyeToolBtn.addEventListener('click', () => {
            currentTool = 'eye';
            eyeToolBtn.classList.add('selected');
            document.querySelectorAll('.color-box').forEach(x => x.classList.remove('selected'));
        });
        
        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const pos = getMousePos(canvas, e);
            const { col, row } = pixelToGridCell(pos.x, pos.y);
            if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
                if (currentMode === 'bouwkaart') {
                    const currentCellColor = drawingMatrix[row][col].color;
                    drawingModeColor = currentCellColor === 'Zwart' ? 'Grijs' : 'Zwart';
                }
            }
            paintCell(pos.x, pos.y);
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (isDrawing) { paintCell(getMousePos(canvas, e).x, getMousePos(canvas, e).y) };
        });
        
        canvas.addEventListener('mouseup', () => {
            if (isDrawing) { isDrawing = false; drawingModeColor = null; saveState(); }
        });
        
        canvas.addEventListener('mouseleave', () => {
            if (isDrawing) { isDrawing = false; drawingModeColor = null; saveState(); }
        });

        undoBtn.addEventListener('click', undo);
        redoBtn.addEventListener('click', redo);
        clearDrawingBtn.addEventListener('click', clearDrawing);

        saveDrawingBtn.addEventListener('click', () => {
            const data = { width: gridWidth, height: gridHeight, matrix: drawingMatrix, mode: currentMode };
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
            a.download = 'pixel-art.json';
            a.click();
            URL.revokeObjectURL(a.href);
        });

        loadDrawingBtn.addEventListener('click', () => loadDrawingInput.click());
        loadDrawingInput.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    document.querySelector(`input[name="mode"][value="${data.mode}"]`).checked = true;
                    updateControlsForMode();
                    loadState(data);
                } catch (err) { meldingContainer.textContent = "Fout bij laden: " + err.message; }
                finally { setTimeout(() => { meldingContainer.textContent = '' }, 3000); }
            };
            reader.readAsText(file);
        });

        downloadPngBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'pixel-art-tekening.png';
            link.href = canvas.toDataURL("image/png");
            link.click();
        });
        
        downloadPdfBtn.addEventListener('click', generatePdf);
        showPreviewBtn.addEventListener('click', generateWorksheetPreview);
        sluitWerkbladBtn.addEventListener('click', () => { werkbladModal.style.display = 'none'; });
        werkbladDownloadPdfBtn.addEventListener('click', generatePdf);
        werkbladDownloadPngBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'werkblad-pixel-art.png';
            link.href = werkbladCanvas.toDataURL('image/png');
            link.click();
        });
        
        window.addEventListener('resize', redrawDrawing);
    }

    function init() {
        gridWidthInput.value = gridWidth;
        gridHeightInput.value = gridHeight;
        updateControlsForMode();
        setupEventListeners();
    }

    init();
});