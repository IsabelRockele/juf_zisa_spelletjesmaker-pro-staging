document.addEventListener("DOMContentLoaded", () => {
    // --- SCHERM BEHEER ---
    const choiceScreen = document.getElementById('choice-screen');
    const generatorScreen = document.getElementById('generator-screen');
    const choiceButtons = document.querySelectorAll('.choice-button');
    const menuBtn = document.getElementById('menuBtn');

    // --- GENERATOR VARIABELEN ---
    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d");

    const CONFIG = {
        clics: {
            title: "Clics Bouwplaat Generator",
            templateImageSrc: 'clic_template01.png',
            drawFunction: drawClic,
            colors: [
                { name: "Achtergrond", hex: "rgba(0,0,0,0)" },
                { name: "Wit", hex: "#FFFFFF" },
                { name: "Zwart", hex: "#333333" },
                { name: "Geel", hex: "#FFEB3B" },
                { name: "Rood", hex: "#F44336" },
                { name: "Oranje", hex: "#FF9800" },
                { name: "Blauw", hex: "#2196F3" },
                { name: "Groen", hex: "#4CAF50" },
                { name: "Paars", hex: "#9C27B0" },
                { name: "Bruin", hex: "#795548" },
                { name: "Roze", hex: "#E91E63" }
            ]
        },
        linkin_cubes: {
            title: "Linkin Cubes Generator",
            templateImageSrc: null,
            drawFunction: drawLinkinCube,
            colors: [
                { name: "Achtergrond", hex: "rgba(0,0,0,0)" },
                { name: "Wit", hex: "#FFFFFF" },
                { name: "Zwart", hex: "#333333" },
                { name: "Rood", hex: "#F44336" },
                { name: "Licht Blauw", hex: "#03A9F4" },
                { name: "Donker Blauw", hex: "#1976D2" },
                { name: "Licht Groen", hex: "#8BC34A" },
                { name: "Donker Groen", hex: "#4CAF50" },
                { name: "Geel", hex: "#FFEB3B" },
                { name: "Oranje", hex: "#FF9800" },
                { name: "Paars", hex: "#9C27B0" },
                { name: "Bruin", hex: "#795548" }
            ]
        }
    };
    
    let currentConfig;
    let generatorType;
    const templateImage = new Image();
    let imageReady = false;
    const coloredCache = {}; 
    let gridWidth, gridHeight;
    let cellSize;
    let drawingMatrix = [];
    let history = [];
    let historyPointer = -1;
    const MAX_HISTORY_STATES = 50;
    let currentColorName = "Wit";
    let isDrawing = false;

    // --- ELEMENTEN ---
    const colorPaletteDiv = document.getElementById('colorPalette');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearDrawingBtn = document.getElementById('clearDrawingBtn');
    const gridWidthInput = document.getElementById('gridWidth');
    const gridHeightInput = document.getElementById('gridHeight');
    const updateGridSizeBtn = document.getElementById('updateGridSizeBtn');
    const saveDrawingBtn = document.getElementById('saveDrawingBtn');
    const loadDrawingInput = document.getElementById('loadDrawingInput');
    const loadDrawingBtn = document.getElementById('loadDrawingBtn');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    
    // --- TEKENFUNCTIES ---
    function drawClic(targetCtx, col, row, cellData, size) {
        if (!imageReady && currentConfig.templateImageSrc) return;
        const x = col * size;
        const y = row * size;
        const colorInfo = getColorInfoByName(cellData.color);
        if (colorInfo.name === "Achtergrond") {
            targetCtx.fillStyle = '#EAEAEA';
            targetCtx.beginPath();
            targetCtx.arc(x + size / 2, y + size / 2, 2, 0, 2 * Math.PI);
            targetCtx.fill();
            return;
        }
        if (!coloredCache[colorInfo.name]) coloredCache[colorInfo.name] = createColoredVersion(colorInfo.hex);
        const imageToDraw = coloredCache[colorInfo.name];
        
        const isRotated = (row + col) % 2 !== 0;

        targetCtx.save();
        targetCtx.translate(x + size / 2, y + size / 2);

        if (isRotated) {
            targetCtx.rotate(Math.PI / 2);
        }

        const scaleFactor = 1.35;
        
        const aspectRatio = templateImage.naturalWidth / templateImage.naturalHeight;
        
        let drawHeight = size * scaleFactor;
        let drawWidth = drawHeight * aspectRatio;

        targetCtx.drawImage(imageToDraw, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        
        targetCtx.restore();
    }

    function drawLinkinCube(targetCtx, col, row, cellData, size) {
        const x = col * size;
        const y = row * size;
        const colorInfo = getColorInfoByName(cellData.color);
        if (colorInfo.name === "Achtergrond") {
            targetCtx.fillStyle = '#EAEAEA';
            targetCtx.beginPath();
            targetCtx.arc(x + size / 2, y + size / 2, 2, 0, 2 * Math.PI);
            targetCtx.fill();
            return;
        }
        targetCtx.fillStyle = colorInfo.hex;
        targetCtx.strokeStyle = '#333333';
        targetCtx.lineWidth = size * 0.05;
        const padding = targetCtx.lineWidth / 2;
        targetCtx.fillRect(x + padding, y + padding, size - 2 * padding, size - 2 * padding);
        targetCtx.strokeRect(x + padding, y + padding, size - 2 * padding, size - 2 * padding);
        targetCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        targetCtx.beginPath();
        targetCtx.arc(x + size / 2, y + size / 2, size * 0.2, 0, 2 * Math.PI);
        targetCtx.fill();
    }

    // --- ALGEMENE FUNCTIES ---
    function createColoredVersion(color) {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = templateImage.width;
        offscreenCanvas.height = templateImage.height;
        const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
        offscreenCtx.drawImage(templateImage, 0, 0);
        const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        const data = imageData.data;
        const r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
        for (let i = 0; i < data.length; i += 4) {
            if (data[i+3] > 0 && data[i] > 200 && data[i+1] > 200 && data[i+2] > 200) {
                data[i] = r; data[i+1] = g; data[i+2] = b;
            }
        }
        offscreenCtx.putImageData(imageData, 0, 0);
        return offscreenCanvas;
    }

    function redrawDrawing() {
        if (!isGeneratorActive()) return;
        const containerRect = canvas.parentElement.getBoundingClientRect();
        cellSize = Math.min(containerRect.width / gridWidth, containerRect.height / gridHeight);
        canvas.width = gridWidth * cellSize;
        canvas.height = gridHeight * cellSize;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                const cellData = drawingMatrix[r][c] || { color: "Achtergrond" };
                currentConfig.drawFunction(ctx, c, r, cellData, cellSize);
            }
        }
    }
    
    function pixelToCell(x, y) {
        if (cellSize <= 0) return { col: -1, row: -1 };
        return { col: Math.floor(x / cellSize), row: Math.floor(y / cellSize) };
    }

    function paintCell(x, y) {
        const { col, row } = pixelToCell(x, y);
        if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
            if (!drawingMatrix[row][col] || drawingMatrix[row][col].color !== currentColorName) {
                drawingMatrix[row][col] = { color: currentColorName };
                redrawDrawing();
            }
        }
    }

    function initializeDrawingCanvas() {
        gridWidth = parseInt(gridWidthInput.value);
        gridHeight = parseInt(gridHeightInput.value);
        drawingMatrix = Array.from({ length: gridHeight }, () => Array.from({ length: gridWidth }, () => ({ color: "Achtergrond" })));
        history = [];
        historyPointer = -1;
        redrawDrawing();
        saveState();
        updateUndoRedoButtons();
    }

    function populateColorPalette() {
        colorPaletteDiv.innerHTML = '';
        currentConfig.colors.forEach(c => {
            const b = document.createElement('div');
            b.className = 'color-box';
            b.style.backgroundColor = c.hex === 'rgba(0,0,0,0)' ? '#f0faff' : c.hex;
            b.style.border = '1px solid #ccc';
            if (c.name === "Achtergrond") {
                b.style.display = 'flex'; b.style.alignItems = 'center';
                b.style.justifyContent = 'center'; b.innerText = 'Wis';
            }
            b.dataset.colorName = c.name;
            b.title = c.name;
            b.addEventListener('click', () => {
                document.querySelectorAll('.color-box').forEach(x => x.classList.remove('selected'));
                b.classList.add('selected');
                currentColorName = c.name;
            });
            colorPaletteDiv.appendChild(b);
        });
        if (colorPaletteDiv.children.length > 1) colorPaletteDiv.children[1].click();
    }
    
    function getColorInfoByName(name) { return currentConfig.colors.find(c => c.name === name); }
    function getMousePos(canvasEl, evt) { const rect = canvasEl.getBoundingClientRect(); return { x: (evt.clientX - rect.left) * (canvasEl.width / rect.width), y: (evt.clientY - rect.top) * (canvasEl.height / rect.height) }; }
    function saveState() { if (historyPointer < history.length - 1) history = history.slice(0, historyPointer + 1); history.push(JSON.stringify(drawingMatrix)); if (history.length > MAX_HISTORY_STATES) history.shift(); historyPointer = history.length - 1; updateUndoRedoButtons(); }
    function undo() { if (historyPointer > 0) { historyPointer--; drawingMatrix = JSON.parse(history[historyPointer]); redrawDrawing(); updateUndoRedoButtons(); } }
    function redo() { if (historyPointer < history.length - 1) { historyPointer++; drawingMatrix = JSON.parse(history[historyPointer]); redrawDrawing(); updateUndoRedoButtons(); } }
    function clearDrawing() { initializeDrawingCanvas(); }

    function updateUndoRedoButtons() {
        undoBtn.disabled = historyPointer <= 0;
        redoBtn.disabled = historyPointer >= history.length - 1;
    }

    function setupEventListeners() {
        updateGridSizeBtn.addEventListener('click', () => {
            gridWidth = parseInt(gridWidthInput.value);
            gridHeight = parseInt(gridHeightInput.value);
            initializeDrawingCanvas();
        });
        canvas.addEventListener('mousedown', (e) => { isDrawing = true; paintCell(getMousePos(canvas, e).x, getMousePos(canvas, e).y); e.preventDefault(); });
        canvas.addEventListener('mousemove', (e) => { if (isDrawing) paintCell(getMousePos(canvas, e).x, getMousePos(canvas, e).y); });
        canvas.addEventListener('mouseup', () => { if (isDrawing) { isDrawing = false; saveState(); } });
        canvas.addEventListener('mouseleave', () => { if (isDrawing) { isDrawing = false; saveState(); } });
        undoBtn.addEventListener('click', undo); redoBtn.addEventListener('click', redo);
        clearDrawingBtn.addEventListener('click', clearDrawing);
        saveDrawingBtn.addEventListener('click', () => { const data = { type: generatorType, gridWidth, gridHeight, drawingMatrix }; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' })); a.download = `${generatorType}-tekening.json`; a.click(); URL.revokeObjectURL(a.href); });
        loadDrawingBtn.addEventListener('click', () => loadDrawingInput.click());
        loadDrawingInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { try { const data = JSON.parse(ev.target.result); if (data.type !== generatorType) { alert(`Fout: Dit is een ${data.type} bestand. Laad een ${generatorType} bestand.`); return; } gridWidthInput.value = data.gridWidth; gridHeightInput.value = data.gridHeight; initializeDrawingCanvas(); drawingMatrix = data.drawingMatrix; redrawDrawing(); saveState(); } catch (err) { alert("Fout bij laden: " + err.message); } }; reader.readAsText(file); e.target.value = ''; });
        downloadPngBtn.addEventListener('click', () => { const link = document.createElement('a'); link.download = `${generatorType}-tekening.png`; link.href = canvas.toDataURL("image/png"); link.click(); });
        
        downloadPdfBtn.addEventListener('click', () => {
            const exportCellSize = 150;
            const pdfCanvas = document.createElement('canvas');
            pdfCanvas.width = gridWidth * exportCellSize;
            pdfCanvas.height = gridHeight * exportCellSize;
            const pdfCtx = pdfCanvas.getContext('2d');
            pdfCtx.fillStyle = 'white';
            pdfCtx.fillRect(0, 0, pdfCanvas.width, pdfCanvas.height);
            for (let r = 0; r < gridHeight; r++) {
                for (let c = 0; c < gridWidth; c++) {
                    const cellData = drawingMatrix[r][c];
                    if (cellData && cellData.color !== "Achtergrond") {
                        currentConfig.drawFunction(pdfCtx, c, r, cellData, exportCellSize);
                    }
                }
            }
            const { jsPDF } = window.jspdf;
            const imgData = pdfCanvas.toDataURL('image/png');
            const orientation = pdfCanvas.width > pdfCanvas.height ? 'l' : 'p';
            const doc = new jsPDF(orientation, 'mm');
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();
            const ratio = pdfCanvas.width / pdfCanvas.height;
            let imgWidth = pdfWidth - 20;
            let imgHeight = imgWidth / ratio;
            if (imgHeight > pdfHeight - 20) {
                imgHeight = pdfHeight - 20;
                imgWidth = imgHeight * ratio;
            }
            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2;
            doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            doc.save(`${generatorType}-tekening.pdf`);
        });

        window.addEventListener('resize', redrawDrawing);
    }
    
    function startGenerator(type) {
        generatorType = type;
        currentConfig = CONFIG[generatorType];
        if (!currentConfig) return;

        choiceScreen.classList.add('hidden');
        generatorScreen.classList.remove('hidden');
        document.getElementById('generatorTitle').textContent = currentConfig.title;
        
        populateColorPalette();
        
        if (currentConfig.templateImageSrc) {
            templateImage.onload = () => { 
                imageReady = true; 
                initializeDrawingCanvas(); 
            };
            templateImage.onerror = () => { 
                alert(`Kon '${currentConfig.templateImageSrc}' niet laden. Zorg ervoor dat het bestand in dezelfde map staat als 'bouwplaat.html'.`); 
            };
            templateImage.src = currentConfig.templateImageSrc;
        } else {
            imageReady = true;
            initializeDrawingCanvas();
        }
    }

    function showChoiceScreen() {
        generatorScreen.classList.add('hidden');
        choiceScreen.classList.remove('hidden');
        currentConfig = null;
        generatorType = null;
    }

    function isGeneratorActive() {
        return !generatorScreen.classList.contains('hidden');
    }

    // --- INIT ---
    choiceButtons.forEach(button => {
        button.addEventListener('click', () => {
            startGenerator(button.dataset.type);
        });
    });
    menuBtn.addEventListener('click', showChoiceScreen);
    setupEventListeners();
});
