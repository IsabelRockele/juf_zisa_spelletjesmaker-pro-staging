document.addEventListener("DOMContentLoaded", () => {
    // --- Globale variabelen en DOM-elementen ---
    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d");

    let gridWidth = parseInt(document.getElementById('gridWidth').value);
    let gridHeight = parseInt(document.getElementById('gridHeight').value);
    let cellSize;

    let drawingMatrix = [];
    let history = [];
    let historyPointer = -1;
    const MAX_HISTORY_STATES = 50;

    let mirrorAxisColumn = null;
    let isAxisSelectionMode = false;

    let currentColorName = "Achtergrond";
    let isDrawing = false;
    let catalogData = {};

    const colorPaletteDiv = document.getElementById('colorPalette');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearDrawingBtn = document.getElementById('clearDrawingBtn');
    const showPreviewBtn = document.getElementById('showPreviewBtn');
    const operationTypeRadios = document.querySelectorAll('input[name="operationType"]');
    const rangeControls = document.getElementById('rangeControls');
    const numberRangeSelect = document.getElementById('numberRange');
    const tablesControls = document.getElementById('tablesControls');
    const allTablesCheckbox = document.querySelector('input[name="tafel"][value="all"]');
    const gridWidthInput = document.getElementById('gridWidth');
    const gridHeightInput = document.getElementById('gridHeight');
    const updateGridSizeBtn = document.getElementById('updateGridSizeBtn');
    const saveDrawingBtn = document.getElementById('saveDrawingBtn');
    const loadDrawingInput = document.getElementById('loadDrawingInput');
    const loadDrawingBtn = document.getElementById('loadDrawingBtn');
    const meldingContainer = document.getElementById('meldingContainer');
    const catalogBtn = document.getElementById('catalogBtn');
    const catalogModal = document.getElementById('catalogModal');
    const closeModalBtn = document.querySelector('.close-button');
    const backToThemesBtn = document.getElementById('backToThemesBtn');
    const themesContainer = document.getElementById('catalog-themes');
    const choicesContainer = document.getElementById('catalog-choices');
    const modalTitle = document.getElementById('modal-title');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const worksheetTypeRadios = document.querySelectorAll('input[name="worksheetType"]');
    const exerciseControlsContainer = document.getElementById('exerciseControlsContainer');
    const widthAdjustDirectionRadios = document.querySelectorAll('input[name="widthAdjustDirection"]');
    const heightAdjustDirectionRadios = document.querySelectorAll('input[name="heightAdjustDirection"]');
    const werkbladModal = document.getElementById('werkblad-modal');
    const werkbladCanvas = document.getElementById('werkblad-canvas');
    const werkbladCtx = werkbladCanvas.getContext('2d');
    const sluitWerkbladBtn = document.getElementById('sluit-werkblad-btn');
    const werkbladTitle = document.getElementById('werkblad-title');
    const werkbladLegendContainer = document.getElementById('werkblad-legend-container');
    const werkbladLegendTitle = document.getElementById('werkblad-legend-title');
    const werkbladLegendContent = document.getElementById('werkblad-legend-content');
    const werkbladDownloadPdfBtn = document.getElementById('werkblad-download-pdf');
    const werkbladDownloadPngBtn = document.getElementById('werkblad-download-png');


    const COLOR_INFO_MAP = [
        { name: "Achtergrond", hex: "#F8F8F8" }, { name: "Zwart", hex: "#333333" },
        { name: "Geel", hex: "#FFD700" }, { name: "Rood", hex: "#FF4500" },
        { name: "Oranje", hex: "#FF8C00" }, { name: "Blauw", hex: "#1E90FF" },
        { name: "Groen", hex: "#32CD32" }, { name: "Paars", hex: "#9932CC" },
        { name: "Bruin", hex: "#A0522D" }, { name: "Roze", hex: "#FFB6C1" },
        { name: "Lichtgroen", hex: "#90EE90" }, { name: "Lichtblauw", hex: "#87CEEB" },
        { name: "Lichtbruin", hex: "#CD853F" }, { name: "Lichtgrijs", hex: "#D3D3D3" },
    ];
    function getColorInfoByName(name) { return COLOR_INFO_MAP.find(c => c.name === name); }
    
    function showMelding(text, duration = 0) {
        meldingContainer.textContent = text;
        if (duration > 0) {
            setTimeout(() => {
                meldingContainer.textContent = '';
            }, duration);
        }
    }
    
    function clearMelding() {
        meldingContainer.textContent = '';
    }

    // --- Functies voor de teken-modus ---
    function initializeDrawingCanvas() {
        cellSize = Math.min(canvas.width / gridWidth, canvas.height / gridHeight);
        if (drawingMatrix.length === 0 || drawingMatrix.length !== gridHeight || (drawingMatrix.length > 0 && drawingMatrix[0].length !== gridWidth)) {
            const old = JSON.parse(JSON.stringify(drawingMatrix)); const oldHeight = old.length; const oldWidth = oldHeight > 0 ? old[0].length : 0;
            const newMatrix = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill("Achtergrond"));
            const widthAdjustDirection = document.querySelector('input[name="widthAdjustDirection"]:checked').value; const heightAdjustDirection = document.querySelector('input[name="heightAdjustDirection"]:checked').value;
            for (let r = 0; r < Math.min(gridHeight, oldHeight); r++) {
                for (let c = 0; c < Math.min(gridWidth, oldWidth); c++) {
                    let sourceRow = r; let sourceCol = c; let targetRow = r; let targetCol = c;
                    if (heightAdjustDirection === 'top' && oldHeight > gridHeight) { sourceRow += (oldHeight - gridHeight); }
                    if (widthAdjustDirection === 'left' && oldWidth > gridWidth) { sourceCol += (oldWidth - gridWidth); }
                    if (sourceRow < oldHeight && sourceCol < oldWidth && sourceRow >= 0 && sourceCol >= 0) { newMatrix[targetRow][targetCol] = old[sourceRow][sourceCol]; }
                }
            }
            drawingMatrix = newMatrix;
        }
        redrawDrawing(); 
        saveState(); 
        updateUndoRedoButtons();
    }
    function populateColorPalette() {
        colorPaletteDiv.innerHTML = ''; 
        COLOR_INFO_MAP.forEach((c) => {
            const b = document.createElement('div'); b.className = 'color-box'; b.style.backgroundColor = c.hex; b.dataset.colorName = c.name; b.title = c.name;
            b.addEventListener('click', () => { 
                document.querySelectorAll('.color-box').forEach(x => x.classList.remove('selected')); 
                b.classList.add('selected'); 
                currentColorName = c.name; 
            });
            colorPaletteDiv.appendChild(b);
        });
        if (colorPaletteDiv.children.length > 0) { 
            colorPaletteDiv.children[0].click(); 
        }
    }
    function drawGridLines(targetCtx, width, height, cell, xOffset = 0, yOffset = 0) {
        targetCtx.strokeStyle = '#D3D3D3'; 
        targetCtx.lineWidth = 1;
        for (let i = 0; i <= width; i++) { targetCtx.beginPath(); targetCtx.moveTo(xOffset + i * cell, yOffset); targetCtx.lineTo(xOffset + i * cell, yOffset + height * cell); targetCtx.stroke(); }
        for (let i = 0; i <= height; i++) { targetCtx.beginPath(); targetCtx.moveTo(xOffset, yOffset + i * cell); targetCtx.lineTo(xOffset + width * cell, yOffset + i * cell); targetCtx.stroke(); }
    }
    
    function redrawDrawing() {
        const totalWidth = gridWidth * cellSize;
        const totalHeight = gridHeight * cellSize;
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        ctx.clearRect(0, 0, totalWidth, totalHeight);
        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                const n = drawingMatrix[r][c];
                const ci = getColorInfoByName(n);
                if (ci) {
                    ctx.fillStyle = ci.hex;
                    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                }
            }
        }
        drawGridLines(ctx, gridWidth, gridHeight, cellSize);
        if (mirrorAxisColumn !== null) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.beginPath();
            const axisX = mirrorAxisColumn * cellSize;
            ctx.moveTo(axisX, 0);
            ctx.lineTo(axisX, totalHeight);
            ctx.stroke();
        }
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, totalWidth, totalHeight);
    }

    function getMousePos(canvas, evt) { const rect = canvas.getBoundingClientRect(); return { x: (evt.clientX - rect.left) * (canvas.width / rect.width), y: (evt.clientY - rect.top) * (canvas.height / rect.height) }; }
    function paintCell(x, y) { const c = Math.floor(x / cellSize); const r = Math.floor(y / cellSize); if (r >= 0 && r < gridHeight && c >= 0 && c < gridWidth) { if (drawingMatrix[r][c] !== currentColorName) { drawingMatrix[r][c] = currentColorName; redrawDrawing(); } } }
    
    // GECORRIGEERDE GESCHIEDENIS FUNCTIES
    function saveState() { 
        if (historyPointer < history.length - 1) { history = history.slice(0, historyPointer + 1); } 
        const currentState = {matrix: drawingMatrix, axis: mirrorAxisColumn};
        history.push(JSON.parse(JSON.stringify(currentState))); // Push een deep copy object
        if (history.length > MAX_HISTORY_STATES) { history.shift(); } 
        historyPointer = history.length - 1; 
        updateUndoRedoButtons(); 
    }
    
    function undo() { 
        if (historyPointer > 0) { 
            historyPointer--; 
            const state = JSON.parse(JSON.stringify(history[historyPointer])); // Haal een deep copy op
            drawingMatrix = state.matrix; 
            mirrorAxisColumn = state.axis; 
            redrawDrawing(); 
            updateUndoRedoButtons(); 
        } 
    }
    
    function redo() { 
        if (historyPointer < history.length - 1) { 
            historyPointer++; 
            const state = JSON.parse(JSON.stringify(history[historyPointer])); // Haal een deep copy op
            drawingMatrix = state.matrix; 
            mirrorAxisColumn = state.axis; 
            redrawDrawing(); 
            updateUndoRedoButtons(); 
        } 
    }
    
    function updateUndoRedoButtons() { 
        undoBtn.disabled = historyPointer <= 0; 
        redoBtn.disabled = historyPointer >= history.length - 1; 
    }
    
    function clearDrawing() { 
        drawingMatrix = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill("Achtergrond")); 
        mirrorAxisColumn = null; 
        redrawDrawing(); 
        saveState(); 
    }
    
    function updateOperationControls() { const op = document.querySelector('input[name="operationType"]:checked').value; const isAddSub = ['optellen', 'aftrekken', 'beide_opt_aft'].includes(op); const isMulDiv = ['vermenigvuldigen', 'delen', 'beide_verm_del'].includes(op); rangeControls.style.display = isAddSub ? 'block' : 'none'; tablesControls.style.display = isMulDiv ? 'block' : 'none'; if(isMulDiv) applyAllTablesState(); }
    
    function applyAllTablesState() { const all = allTablesCheckbox.checked; document.querySelectorAll('input[name="tafel"]').forEach(cb => { if (cb.value !== 'all') cb.disabled = all; }); }

    function updateWorksheetTypeControls() {
        const selectedType = document.querySelector('input[name="worksheetType"]:checked').value;
        exerciseControlsContainer.style.display = selectedType === 'oefeningen' ? 'block' : 'none';
        showPreviewBtn.disabled = (selectedType === 'spiegelen');
        
        isAxisSelectionMode = (selectedType === 'spiegelen');

        if (isAxisSelectionMode) {
            canvas.style.cursor = 'col-resize';
            showMelding('Klik op het raster om de spiegelas te bepalen.');
        } else {
            canvas.style.cursor = 'crosshair';
            if (mirrorAxisColumn !== null) {
                mirrorAxisColumn = null;
                redrawDrawing();
                saveState();
            }
        }
    }
    
    function generateWorksheetPreview() {
        const type = document.querySelector('input[name="worksheetType"]:checked').value;
        werkbladModal.style.display = 'flex';
        switch (type) {
            case 'oefeningen': drawExercisesPreview(); break;
            case 'natekenen': drawRedrawPreview(); break;
            case 'pixeltekening': drawPixelArtPreview(); break;
        }
    }

    async function generateWorksheetPdf() {
        const type = document.querySelector('input[name="worksheetType"]:checked').value;
        showMelding('Bezig met genereren van PDF...', 0);
        try {
            switch (type) {
                case 'oefeningen': await generateExercisesPdf(); break;
                case 'natekenen': await generateRedrawPdf(); break;
                case 'pixeltekening': await generatePixelArtPdf(); break;
            }
        } catch (e) { console.error("PDF Generation Error:", e); showMelding('Fout bij het maken van de PDF.', 3000); } 
        finally { clearMelding(); }
    }
    
    function generateProblemForOutcome(desiredOutcome, operationType, options) {
        const maxRange = parseInt(options.numberRange) || 100; let selectedTables;
        if (options.selectedTables.includes('all')) { selectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; } 
        else { selectedTables = (options.selectedTables || []).map(Number).filter(n => n > 0); }
        const operation = operationType.includes('beide') ? (operationType.includes('opt_aft') ? (Math.random() > 0.5 ? 'optellen' : 'aftrekken') : (Math.random() > 0.5 ? 'vermenigvuldigen' : 'delen')) : operationType;
        switch (operation) {
            case 'optellen': if (desiredOutcome > maxRange * 2) return null; for (let i = 0; i < 50; i++) { const num1 = Math.floor(Math.random() * (desiredOutcome + 1)); const num2 = desiredOutcome - num1; if (num1 <= maxRange && num2 <= maxRange && num2 >= 0) return `${num1} + ${num2}`; } return null;
            case 'aftrekken': if (desiredOutcome > maxRange) return null; for (let i = 0; i < 100; i++) { const num2 = Math.floor(Math.random() * (maxRange - desiredOutcome + 1)); const num1 = desiredOutcome + num2; if (num1 <= maxRange) return `${num1} - ${num2}`; } return null;
            case 'vermenigvuldigen': if (selectedTables.length === 0) return null; const possibleFactors = selectedTables.filter(factor => desiredOutcome % factor === 0 && (desiredOutcome / factor) <= 10); if (possibleFactors.length > 0) { const factor1 = possibleFactors[Math.floor(Math.random() * possibleFactors.length)]; const factor2 = desiredOutcome / factor1; return Math.random() > 0.5 ? `${factor1} x ${factor2}` : `${factor2} x ${factor1}`; } return null;
            case 'delen': if (selectedTables.length === 0 || desiredOutcome > 10) return null; const possibleDivisors = selectedTables.filter(divisor => (desiredOutcome * divisor) <= 100); if (possibleDivisors.length > 0) { const divisor = possibleDivisors[Math.floor(Math.random() * possibleDivisors.length)]; const dividend = desiredOutcome * divisor; return `${dividend} : ${divisor}`; } return null;
            default: return null;
        }
    }
    function getWorksheetData() {
        const operationType = document.querySelector('input[name="operationType"]:checked').value; const options = { numberRange: numberRangeSelect.value, selectedTables: Array.from(document.querySelectorAll('input[name="tafel"]:checked')).map(cb => cb.value) };
        const isMulDiv = ['vermenigvuldigen', 'delen', 'beide_verm_del'].includes(operationType); let maxOutcomeRange;
        if (operationType === 'delen') { maxOutcomeRange = 10; } else if (isMulDiv) { maxOutcomeRange = 100; } else { maxOutcomeRange = parseInt(options.numberRange) || 100; }
        let MIN_EXERCISES;
        if (isMulDiv) { const numTables = options.selectedTables.filter(t => t !== 'all').length; if (options.selectedTables.includes('all') || numTables > 3) MIN_EXERCISES = 15; else if (numTables >= 2) MIN_EXERCISES = 10; else MIN_EXERCISES = 6; } else { const range = options.numberRange; if (range === "20") MIN_EXERCISES = 10; else if (range === "100" || range === "1000") MIN_EXERCISES = 15; else MIN_EXERCISES = 6; }
        MIN_EXERCISES = Math.min(MIN_EXERCISES, maxOutcomeRange + 1); const colorCounts = new Map(); let totalFigureCells = 0;
        drawingMatrix.flat().forEach(name => { if (name !== "Achtergrond") { colorCounts.set(name, (colorCounts.get(name) || 0) + 1); totalFigureCells++; } });
        const exercisesPerColor = new Map(); if (totalFigureCells > 0) { const sortedColorsByCount = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]); if (sortedColorsByCount.length > 0) { sortedColorsByCount.forEach(([name, count]) => { exercisesPerColor.set(name, Math.max(1, Math.round((count / totalFigureCells) * MIN_EXERCISES))); }); let currentTotalExercises = Array.from(exercisesPerColor.values()).reduce((sum, count) => sum + count, 0); while (currentTotalExercises < MIN_EXERCISES) { for (const [name] of sortedColorsByCount) { if (currentTotalExercises >= MIN_EXERCISES) break; exercisesPerColor.set(name, exercisesPerColor.get(name) + 1); currentTotalExercises++; } } } }
        const legendData = new Map(); const outcomesForLegend = new Set(); const availableOutcomes = [];
        for (let i = 0; i <= maxOutcomeRange; i++) { availableOutcomes.push(i); }
        for (let i = availableOutcomes.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[availableOutcomes[i], availableOutcomes[j]] = [availableOutcomes[j], availableOutcomes[i]]; }
        exercisesPerColor.forEach((num, name) => { const exercises = []; let attempts = 0; while (exercises.length < num && attempts < 500) { if (availableOutcomes.length === 0) break; const outcome = availableOutcomes.pop(); const problem = generateProblemForOutcome(outcome, operationType, options); if (problem) { exercises.push({ problem, outcome }); outcomesForLegend.add(outcome); } else { availableOutcomes.unshift(outcome); } attempts++; } legendData.set(name, exercises); });
        const distractorNumbers = [];
        if (isMulDiv) { const tableNumbersToUse = options.selectedTables.includes('all') ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : options.selectedTables.map(Number).filter(n => n > 0); if (tableNumbersToUse.length > 0) { const possibleProducts = new Set(); tableNumbersToUse.forEach(tableNum => { for (let i = 1; i <= 10; i++) { possibleProducts.add(tableNum * i); } }); possibleProducts.forEach(product => { if (!outcomesForLegend.has(product)) { distractorNumbers.push(product); } }); } } else { for (let i = 0; i <= maxOutcomeRange; i++) { if (!outcomesForLegend.has(i)) { distractorNumbers.push(i); } } }
        return { legendData, distractorNumbers };
    }
    function generateAndDisplayLegend(legendData) {
        werkbladLegendContent.innerHTML = ''; werkbladLegendContent.style.cssText = 'display: flex; flex-direction: row; flex-wrap: wrap; align-content: flex-start;'; let allExercises = [];
        legendData.forEach((exercises, name) => { const colorInfo = getColorInfoByName(name); exercises.forEach(exercise => allExercises.push({ ...exercise, colorName: name, colorHex: colorInfo.hex })); });
        allExercises.forEach(ex => { const item = document.createElement('div'); item.style.cssText = 'display: flex; align-items: center; margin-bottom: 5px; flex-basis: 50%; box-sizing: border-box; padding-right: 10px;'; item.innerHTML = `<div style="width: 15px; height: 15px; background-color: ${ex.colorHex}; border: 1px solid #333; margin-right: 10px;"></div><span>${ex.problem} = </span>`; werkbladLegendContent.appendChild(item); });
    }
    function drawExercisesPreview() {
        werkbladTitle.textContent = "Werkblad Voorbeeld"; werkbladLegendContainer.style.display = 'block'; werkbladLegendTitle.textContent = "Kleurcode:";
        const contentWrapper = document.getElementById('werkblad-content'); const availableWidth = contentWrapper.clientWidth - 40;
        werkbladCanvas.width = availableWidth; werkbladCanvas.height = (availableWidth / gridWidth) * gridHeight;
        const { legendData, distractorNumbers } = getWorksheetData();
        const werkbladCellSize = werkbladCanvas.width / gridWidth;
        werkbladCtx.clearRect(0, 0, werkbladCanvas.width, werkbladCanvas.height);
        drawGridLines(werkbladCtx, gridWidth, gridHeight, werkbladCellSize);
        werkbladCtx.textAlign = 'center'; werkbladCtx.textBaseline = 'middle'; werkbladCtx.fillStyle = 'black';
        const fontSize = Math.max(10, werkbladCellSize * 0.7); werkbladCtx.font = `${fontSize}px Arial`;
        const outcomePools = new Map();
        legendData.forEach((exercises, name) => outcomePools.set(name, exercises.map(e => e.outcome)));
        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                const colorName = drawingMatrix[r][c]; let displayedNumber;
                if (colorName === "Achtergrond") { displayedNumber = distractorNumbers.length > 0 ? distractorNumbers[Math.floor(Math.random() * distractorNumbers.length)] : ''; } 
                else { const pool = outcomePools.get(colorName); displayedNumber = pool && pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : '?'; }
                werkbladCtx.fillText(displayedNumber.toString(), c * werkbladCellSize + werkbladCellSize / 2, r * werkbladCellSize + werkbladCellSize / 2);
            }
        }
        generateAndDisplayLegend(legendData);
    }
    async function generateExercisesPdf() {
        const { jsPDF } = window.jspdf; const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); const margin = 10;
        const { legendData, distractorNumbers } = getWorksheetData(); let allExercises = [];
        legendData.forEach((exercises, name) => { const colorInfo = getColorInfoByName(name); exercises.forEach(exercise => allExercises.push({ ...exercise, colorName: name, colorHex: colorInfo.hex })); });
        const legendLineHeight = 8; const legendHeight = (Math.ceil(allExercises.length / 2) * legendLineHeight) + 30; const availableHeight = pageHeight - 2 * margin - legendHeight;
        const pdfCellSize = Math.min((pageWidth - 2 * margin) / gridWidth, availableHeight / gridHeight); const textFontSize = Math.max(4, Math.min(12, pdfCellSize * 2.8));
        doc.setFontSize(textFontSize); const outcomePools = new Map();
        legendData.forEach((exercises, name) => outcomePools.set(name, exercises.map(e => e.outcome))); let currentY = margin;
        for (let r = 0; r < gridHeight; r++) { for (let c = 0; c < gridWidth; c++) { const colorName = drawingMatrix[r][c]; let num; if (colorName === "Achtergrond") { num = distractorNumbers.length > 0 ? distractorNumbers[Math.floor(Math.random() * distractorNumbers.length)] : ''; } else { const pool = outcomePools.get(colorName); num = pool && pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : '?'; } const x = margin + c * pdfCellSize; const y = currentY + r * pdfCellSize; doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.1); doc.rect(x, y, pdfCellSize, pdfCellSize); doc.text(num.toString(), x + pdfCellSize / 2, y + pdfCellSize / 2, { align: 'center', baseline: 'middle' }); } }
        currentY += gridHeight * pdfCellSize + 10;
        if (currentY > pageHeight - legendHeight) { doc.addPage(); currentY = margin; }
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text("Oefeningen", margin, currentY); currentY += 10;
        doc.setFontSize(12); doc.setFont('helvetica', 'normal');
        const initialY = currentY; const col2X = margin + (pageWidth / 2 - margin); const midpoint = Math.ceil(allExercises.length / 2);
        allExercises.forEach((exercise, index) => {
            const xPos = index < midpoint ? margin : col2X;
            if (index === midpoint) currentY = initialY;
            const colorInfo = getColorInfoByName(exercise.colorName); doc.setFillColor(colorInfo.hex); doc.rect(xPos, currentY - 4, 6, 6, 'F');
            doc.setTextColor(0, 0, 0); doc.text(`${exercise.problem} = `, xPos + 10, currentY);
            currentY += legendLineHeight;
        });
        doc.save(`reken-en-kleur-werkblad.pdf`);
    }
    function drawRedrawPreview() {
        werkbladTitle.textContent = "Natekenen Voorbeeld";
        werkbladLegendContainer.style.display = 'none';
        const contentWrapper = document.getElementById('werkblad-content');
        const availableWidth = (contentWrapper.clientWidth - 40) * 0.85;
        const previewCellSize = availableWidth / gridWidth;
        const spacing = 15;
        const totalHeight = (previewCellSize * gridHeight * 2) + spacing;
        werkbladCanvas.width = availableWidth;
        werkbladCanvas.height = totalHeight;
        werkbladCtx.clearRect(0, 0, werkbladCanvas.width, werkbladCanvas.height);
        for (let r = 0; r < gridHeight; r++) { for (let c = 0; c < gridWidth; c++) { const colorName = drawingMatrix[r][c]; const colorInfo = getColorInfoByName(colorName); if (colorInfo) { werkbladCtx.fillStyle = colorInfo.hex; werkbladCtx.fillRect(c * previewCellSize, r * previewCellSize, previewCellSize, previewCellSize); } } }
        drawGridLines(werkbladCtx, gridWidth, gridHeight, previewCellSize, 0, 0);
        werkbladCtx.strokeRect(0, 0, previewCellSize * gridWidth, previewCellSize * gridHeight);
        const emptyGridYOffset = (previewCellSize * gridHeight) + spacing;
        drawGridLines(werkbladCtx, gridWidth, gridHeight, previewCellSize, 0, emptyGridYOffset);
        werkbladCtx.strokeRect(0, emptyGridYOffset, previewCellSize * gridWidth, previewCellSize * gridHeight);
    }
    async function generateRedrawPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const spacing = 10;
        const singleDrawingMaxWidth = pageWidth - 2 * margin;
        const singleDrawingMaxHeight = (pageHeight - 2 * margin - spacing) / 2;
        const aspectRatio = gridWidth / gridHeight;
        let pdfDrawingWidth = singleDrawingMaxWidth;
        let pdfDrawingHeight = pdfDrawingWidth / aspectRatio;
        if (pdfDrawingHeight > singleDrawingMaxHeight) {
            pdfDrawingHeight = singleDrawingMaxHeight;
            pdfDrawingWidth = pdfDrawingHeight * aspectRatio;
        }
        const xOffset = (pageWidth - pdfDrawingWidth) / 2;
        const imgData = canvas.toDataURL('image/png');
        const yOffset1 = margin;
        doc.addImage(imgData, 'PNG', xOffset, yOffset1, pdfDrawingWidth, pdfDrawingHeight);
        const yOffset2 = yOffset1 + pdfDrawingHeight + spacing;
        const pdfCellSize = pdfDrawingWidth / gridWidth;
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                const x = xOffset + c * pdfCellSize;
                const y = yOffset2 + r * pdfCellSize;
                doc.rect(x, y, pdfCellSize, pdfCellSize);
            }
        }
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.rect(xOffset, yOffset2, pdfDrawingWidth, pdfDrawingHeight);
        doc.save('werkblad-natekenen.pdf');
    }
    function generatePixelArtData() {
        const data = [];
        for (let r = 0; r < gridHeight; r++) {
            const rowData = [];
            if (drawingMatrix[r].length === 0) {
                data.push(rowData);
                continue;
            }
            let currentCount = 1;
            let currentColor = drawingMatrix[r][0];
            for (let c = 1; c < gridWidth; c++) {
                if (drawingMatrix[r][c] === currentColor) {
                    currentCount++;
                } else {
                    rowData.push({ color: currentColor, count: currentCount });
                    currentColor = drawingMatrix[r][c];
                    currentCount = 1;
                }
            }
            rowData.push({ color: currentColor, count: currentCount });
            data.push(rowData);
        }
        return data;
    }
    function drawPixelArtPreview() {
        werkbladTitle.textContent = "Pixeltekening Voorbeeld";
        werkbladLegendContainer.style.display = 'none';
        const data = generatePixelArtData();
        const contentWrapper = document.getElementById('werkblad-content');
        const availableWidth = contentWrapper.clientWidth - 40;
        const instructionWidth = availableWidth * 0.4;
        const gridWidthPx = availableWidth * 0.6;
        const previewCellSize = gridWidthPx / gridWidth;
        const totalHeight = previewCellSize * gridHeight;
        werkbladCanvas.width = availableWidth;
        werkbladCanvas.height = totalHeight;
        werkbladCtx.clearRect(0, 0, werkbladCanvas.width, werkbladCanvas.height);
        const instructionCellSize = Math.min(previewCellSize, 20);
        werkbladCtx.font = `${instructionCellSize * 0.7}px Arial`;
        werkbladCtx.textBaseline = 'middle';
        werkbladCtx.textAlign = 'center';
        for (let r = 0; r < gridHeight; r++) {
            const rowInstructions = data[r]; let currentX = 5;
            const y = r * previewCellSize + (previewCellSize / 2);
            for (const inst of rowInstructions) {
                const colorInfo = getColorInfoByName(inst.color);
                werkbladCtx.fillStyle = colorInfo.hex;
                werkbladCtx.fillRect(currentX, y - instructionCellSize/2, instructionCellSize, instructionCellSize);
                werkbladCtx.fillStyle = '#000';
                werkbladCtx.strokeRect(currentX, y - instructionCellSize/2, instructionCellSize, instructionCellSize);
                werkbladCtx.fillText(inst.count, currentX + instructionCellSize/2, y);
                currentX += instructionCellSize + 2;
            }
        }
        drawGridLines(werkbladCtx, gridWidth, gridHeight, previewCellSize, instructionWidth, 0);
    }
    async function generatePixelArtPdf() {
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF('l', 'mm', 'a4'); 
        const pageWidth = doc.internal.pageSize.getWidth(); 
        const pageHeight = doc.internal.pageSize.getHeight(); 
        const margin = 10;
        const data = generatePixelArtData();
        const instructionSquareSize = 5;
        const maxInstructions = Math.max(1, ...data.map(row => row.length));
        const instructionAreaWidth = maxInstructions * (instructionSquareSize + 1);
        const gridAreaWidth = pageWidth - instructionAreaWidth - 2 * margin;
        const pdfCellSize = Math.min(gridAreaWidth / gridWidth, (pageHeight - 2 * margin) / gridHeight);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(instructionSquareSize * 2.8);
        for (let r = 0; r < gridHeight; r++) {
            const y_row_top = margin + r * pdfCellSize;
            let currentX = margin;
            const y_instruction_top = y_row_top + (pdfCellSize / 2) - (instructionSquareSize / 2);
            for (const inst of data[r]) {
                const colorInfo = getColorInfoByName(inst.color);
                doc.setFillColor(colorInfo.hex);
                doc.setDrawColor(0); 
                doc.setLineWidth(0.2);
                doc.rect(currentX, y_instruction_top, instructionSquareSize, instructionSquareSize, 'FD');
                doc.setTextColor(0, 0, 0);
                const textOptions = { align: 'center', baseline: 'middle' };
                const textX = currentX + instructionSquareSize / 2;
                const textY = y_instruction_top + instructionSquareSize / 2;
                doc.text(String(inst.count), textX, textY, textOptions);
                currentX += instructionSquareSize + 1;
            }
            for(let c = 0; c < gridWidth; c++) {
                const gridX = margin + instructionAreaWidth + c * pdfCellSize;
                doc.setDrawColor(180, 180, 180); 
                doc.setLineWidth(0.1);
                doc.rect(gridX, y_row_top, pdfCellSize, pdfCellSize);
            }
        }
        doc.save('werkblad-pixeltekening.pdf');
    }
    
    async function downloadDrawingPdf() { 
        showMelding('Bezig met genereren van PDF...', 0);
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF('p', 'mm', 'a4'); 
        const imgData = canvas.toDataURL('image/png'); 
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const availableWidth = pageWidth - 2 * margin;
        const aspectRatio = canvas.width / canvas.height;
        let imgWidth = availableWidth;
        let imgHeight = imgWidth / aspectRatio;
        if (imgHeight > pageHeight - 2 * margin) {
            imgHeight = pageHeight - 2 * margin;
            imgWidth = imgHeight * aspectRatio;
        }
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;
        doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight); 
        doc.save('tekening.pdf'); 
        clearMelding();
    }
    async function loadCatalog() { try { const response = await fetch('reken_en_kleur_afbeeldingen/catalog.json'); if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); } catalogData = await response.json(); } catch (e) { console.error("Kon de catalogus niet laden:", e); showMelding("Fout bij laden van de catalogus.", 3000); } }
    function openCatalog() { populateThemes(); catalogModal.style.display = 'block'; }
    function closeCatalog() { catalogModal.style.display = 'none'; themesContainer.style.display = 'grid'; choicesContainer.style.display = 'none'; backToThemesBtn.style.display = 'none'; modalTitle.textContent = 'Catalogus'; }
    function populateThemes() { themesContainer.innerHTML = ''; Object.keys(catalogData).forEach(theme => { const btn = document.createElement('button'); btn.textContent = theme; btn.onclick = () => showChoices(theme); themesContainer.appendChild(btn); }); }
    function showChoices(theme) {
        choicesContainer.innerHTML = ''; const choices = catalogData[theme];
        if (!choices || choices.length === 0) { choicesContainer.innerHTML = '<p>Nog geen tekeningen beschikbaar voor dit thema.</p>'; } else { choices.forEach(choice => { const btn = document.createElement('button'); btn.className = 'catalog-choice-button'; btn.onclick = () => loadDrawingFromCatalog(choice.bestandsnaam); const img = document.createElement('img'); img.src = `reken_en_kleur_afbeeldingen/${choice.afbeelding}`; img.alt = choice.naam; const span = document.createElement('span'); span.textContent = choice.naam; btn.appendChild(img); btn.appendChild(span); choicesContainer.appendChild(btn); }); }
        themesContainer.style.display = 'none'; choicesContainer.style.display = 'grid'; backToThemesBtn.style.display = 'block'; modalTitle.textContent = theme;
    }
    function showThemes() { themesContainer.style.display = 'grid'; choicesContainer.style.display = 'none'; backToThemesBtn.style.display = 'none'; modalTitle.textContent = 'Catalogus'; }
    async function loadDrawingFromCatalog(fileName) { showMelding('Tekening laden...', 0); try { const response = await fetch(`reken_en_kleur_afbeeldingen/${fileName}`); if (!response.ok) { throw new Error(`HTTP error! status: ${status}`); } const data = await response.json(); gridWidthInput.value = data.gridWidth; gridHeightInput.value = data.gridHeight; gridWidth = data.gridWidth; gridHeight = data.gridHeight; drawingMatrix = JSON.parse(JSON.stringify(data.drawingMatrix)); initializeDrawingCanvas(); closeCatalog(); } catch (e) { console.error("Kon tekening niet laden:", e); showMelding("Fout bij laden van de tekening.", 3000); } finally { setTimeout(() => { clearMelding() }, 3000); } }

    // --- Event Listeners ---
    canvas.addEventListener('mousedown', (e) => {
        if (isAxisSelectionMode) {
            const pos = getMousePos(canvas, e);
            const clickedColumn = Math.round(pos.x / cellSize);

            for (let r = 0; r < gridHeight; r++) {
                for (let c = clickedColumn; c < gridWidth; c++) {
                    drawingMatrix[r][c] = "Achtergrond";
                }
            }
            
            mirrorAxisColumn = clickedColumn;
            
            isAxisSelectionMode = false;
            canvas.style.cursor = 'crosshair';
            showMelding('Spiegelas geplaatst en rechterkant gewist.', 3000);
            redrawDrawing();
            saveState();
        } else {
            isDrawing = true;
            paintCell(getMousePos(canvas, e).x, getMousePos(canvas, e).y);
        }
    });
    canvas.addEventListener('mousemove', (e) => { if (isDrawing) { paintCell(getMousePos(canvas, e).x, getMousePos(canvas, e).y); } });
    canvas.addEventListener('mouseup', () => { if (isDrawing) { isDrawing = false; saveState(); }});
    canvas.addEventListener('mouseleave', () => { if (isDrawing) { isDrawing = false; saveState(); }});
    updateGridSizeBtn.addEventListener('click', () => { const w = parseInt(gridWidthInput.value); const h = parseInt(gridHeightInput.value); if (w >= 10 && h >= 10 && w <= 60 && h <= 60) { gridWidth = w; gridHeight = h; initializeDrawingCanvas(); } });
    operationTypeRadios.forEach(r => r.addEventListener('change', updateOperationControls));
    document.querySelectorAll('input[name="tafel"]').forEach(cb => { cb.addEventListener('change', () => { if (cb.value !== 'all' && cb.checked) { allTablesCheckbox.checked = false; } applyAllTablesState(); }); });
    worksheetTypeRadios.forEach(r => r.addEventListener('change', updateWorksheetTypeControls));
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    clearDrawingBtn.addEventListener('click', clearDrawing);
    saveDrawingBtn.addEventListener('click', () => { if (!drawingMatrix || drawingMatrix.length === 0) { showMelding("Er is geen tekening om op te slaan.", 3000); return; } try { const data = { gridWidth, gridHeight, drawingMatrix, mirrorAxisColumn }; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' })); a.download = 'tekening.json'; a.click(); URL.revokeObjectURL(a.href); } catch (e) { console.error("Fout bij opslaan:", e); showMelding("Kon de tekening niet opslaan.", 3000); } });
    loadDrawingBtn.addEventListener('click', () => loadDrawingInput.click());
    loadDrawingInput.addEventListener('change', (e) => { 
        const file = e.target.files[0]; 
        if (!file) return; 
        const reader = new FileReader(); 
        reader.onload = (ev) => { 
            try { 
                const data = JSON.parse(ev.target.result); 
                gridWidthInput.value = data.gridWidth; 
                gridHeightInput.value = data.gridHeight; 
                gridWidth = data.gridWidth; 
                gridHeight = data.gridHeight; 
                drawingMatrix = data.drawingMatrix; 
                mirrorAxisColumn = data.mirrorAxisColumn || null; 
                initializeDrawingCanvas(); 
                if (mirrorAxisColumn) { 
                    document.querySelector('input[name=worksheetType][value=spiegelen]').checked = true; 
                } else { 
                    document.querySelector('input[name=worksheetType][value=oefeningen]').checked = true;
                } 
                updateWorksheetTypeControls();
            } catch (err) { 
                showMelding("Fout bij laden: " + err.message, 3000); 
                console.error("Load error:", err); 
            } 
        }; 
        reader.readAsText(file); 
    });
    downloadPngBtn.addEventListener('click', () => { const link = document.createElement('a'); link.download = 'tekening.png'; link.href = canvas.toDataURL("image/png"); link.click(); });
    downloadPdfBtn.addEventListener('click', downloadDrawingPdf);
    catalogBtn.addEventListener('click', openCatalog);
    closeModalBtn.addEventListener('click', closeCatalog);
    backToThemesBtn.addEventListener('click', showThemes);
    window.addEventListener('click', (e) => { if (e.target == catalogModal) { closeCatalog(); } });
    showPreviewBtn.addEventListener('click', generateWorksheetPreview);
    sluitWerkbladBtn.addEventListener('click', () => { werkbladModal.style.display = 'none'; });
    werkbladDownloadPdfBtn.addEventListener('click', generateWorksheetPdf);
    werkbladDownloadPngBtn.addEventListener('click', () => { const link = document.createElement('a'); link.download = 'werkblad.png'; link.href = werkbladCanvas.toDataURL('image/png'); link.click(); });

    // --- INITIALISATIE ---
    async function init() {
        await loadCatalog();
        allTablesCheckbox.checked = false;
        populateColorPalette();
        updateOperationControls();
        updateWorksheetTypeControls(); 
        initializeDrawingCanvas();
    }

    init();
});