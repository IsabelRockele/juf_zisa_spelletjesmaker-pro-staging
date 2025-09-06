document.addEventListener("DOMContentLoaded", () => {
    // --- Globale variabelen en DOM-elementen ---
    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d");

    let gridWidth = parseInt(document.getElementById('gridWidth').value);
    let gridHeight = parseInt(document.getElementById('gridHeight').value);
    
    // --- Hexagon specifieke variabelen ---
    let hexSize, hexWidth, hexHeight, hexVertSpacing, hexHorizSpacing;

    let drawingMatrix = [];
    let history = [];
    let historyPointer = -1;
    const MAX_HISTORY_STATES = 50;

    // --- Nieuwe tool state ---
    let currentTool = "color"; // 'color' of 'eye'
    let currentColorName = "Achtergrond";
    let isDrawing = false;
    let catalogData = {}; // Voor catalogus data

    // --- DOM Elementen ---
    const colorPaletteDiv = document.getElementById('colorPalette');
    const eyeToolBtn = document.getElementById('eyeToolBtn');
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
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const worksheetTypeRadios = document.querySelectorAll('input[name="worksheetType"]');
    const exerciseControlsContainer = document.getElementById('exerciseControlsContainer');
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
    
    // Catalogus DOM elementen
    const catalogBtn = document.getElementById('catalogBtn');
    const catalogModal = document.getElementById('catalogModal');
    const closeModalBtn = document.querySelector('.close-button');
    const backToThemesBtn = document.getElementById('backToThemesBtn');
    const themesContainer = document.getElementById('catalog-themes');
    const choicesContainer = document.getElementById('catalog-choices');
    const modalTitle = document.getElementById('modal-title');
    
    const COLOR_INFO_MAP = [
        { name: "Achtergrond", hex: "#FFFFFF" }, { name: "Wit", hex: "#F8F8F8" }, 
        { name: "Zwart", hex: "#333333" }, { name: "Geel", hex: "#FFD700" }, 
        { name: "Rood", hex: "#FF4500" }, { name: "Oranje", hex: "#FF8C00" }, 
        { name: "Blauw", hex: "#1E90FF" }, { name: "Groen", hex: "#32CD32" }, 
        { name: "Paars", hex: "#9932CC" }, { name: "Bruin", hex: "#A0522D" }, 
        { name: "Roze", hex: "#FFB6C1" }, { name: "Lichtgroen", hex: "#90EE90" }, 
        { name: "Lichtblauw", hex: "#87CEEB" }, { name: "Lichtbruin", hex: "#CD853F" },
        { name: "Lichtgrijs", hex: "#D3D3D3" },
    ];
    function getColorInfoByName(name) { return COLOR_INFO_MAP.find(c => c.name === name); }

    // --- Hexagon Wiskunde en Tekenfuncties ---
    function getHexMetrics(totalWidth) {
        hexHorizSpacing = totalWidth / (gridWidth + 0.5);
        hexSize = hexHorizSpacing / Math.sqrt(3);
        hexWidth = Math.sqrt(3) * hexSize;
        hexHeight = 2 * hexSize;
        hexVertSpacing = hexHeight * 0.75;
    }

    function getHexPath(centerX, centerY, size) {
        const path = new Path2D();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 180 * (60 * i + 30);
            const x = centerX + size * Math.cos(angle);
            const y = centerY + size * Math.sin(angle);
            if (i === 0) path.moveTo(x, y);
            else path.lineTo(x, y);
        }
        path.closePath();
        return path;
    }
    
    function getHexPoints(centerX, centerY, size) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 180 * (60 * i + 30);
            points.push([
                centerX + size * Math.cos(angle),
                centerY + size * Math.sin(angle)
            ]);
        }
        return points;
    }

    function getHexCenter(col, row, currentHexSize, currentHexWidth, currentHexVertSpacing) {
        const xOffset = currentHexWidth / 2;
        const yOffset = (currentHexSize * 2) / 2;
        const x = xOffset + col * currentHexWidth + (row % 2 !== 0 ? currentHexWidth / 2 : 0);
        const y = yOffset + row * currentHexVertSpacing;
        return { x, y };
    }

    function drawHexagon(targetCtx, col, row, cellData, size, width, vertSpacing, withContent, content) {
        const { x, y } = getHexCenter(col, row, size, width, vertSpacing);
        const colorInfo = getColorInfoByName(cellData.color);

        targetCtx.fillStyle = colorInfo ? colorInfo.hex : '#FFFFFF';
        targetCtx.strokeStyle = '#D3D3D3';
        targetCtx.lineWidth = 1;
        
        const hexPath = getHexPath(x, y, size);
        targetCtx.fill(hexPath);
        targetCtx.stroke(hexPath);
        
        if (cellData.special === 'eye') {
            targetCtx.fillStyle = '#000000';
            targetCtx.beginPath();
            targetCtx.arc(x, y, size * 0.4, 0, 2 * Math.PI);
            targetCtx.fill();
            
            targetCtx.fillStyle = '#FFFFFF';
            targetCtx.beginPath();
            targetCtx.arc(x - size * 0.1, y - size * 0.1, size * 0.15, 0, 2 * Math.PI);
            targetCtx.fill();
        }

        if (withContent && content !== undefined && cellData.special !== 'eye') {
             const fontSize = Math.max(8, size * 0.8);
             targetCtx.font = `${fontSize}px Arial`;
             targetCtx.fillStyle = 'black';
             targetCtx.textAlign = 'center';
             targetCtx.textBaseline = 'middle';
             targetCtx.fillText(content.toString(), x, y);
        }
    }
    
    // GECORRIGEERDE FUNCTIE
function pixelToHex(x, y) {
    // Correcte wiskundige formule voor "pointy-topped" hexagons.
    const q = (Math.sqrt(3)/3 * x - 1/3 * y) / hexSize;
    const r = (2/3 * y) / hexSize;
    return hexRound(q, r);
}
    
    function hexRound(q, r) {
        const s = -q - r;
        let rq = Math.round(q);
        let rr = Math.round(r);
        let rs = Math.round(s);
        const q_diff = Math.abs(rq - q);
        const r_diff = Math.abs(rr - r);
        const s_diff = Math.abs(rs - s);
        if (q_diff > r_diff && q_diff > s_diff) {
            rq = -rr - rs;
        } else if (r_diff > s_diff) {
            rr = -rq - rs;
        }
        const col = rq + (rr - (rr&1)) / 2;
        const row = rr;
        return { col, row };
    }

    // --- Kern Applicatie Functies ---
    function initializeDrawingCanvas() {
        if (drawingMatrix.length !== gridHeight || (drawingMatrix.length > 0 && drawingMatrix[0].length !== gridWidth)) {
            drawingMatrix = Array(gridHeight).fill(null).map(() => 
                Array(gridWidth).fill({ color: "Achtergrond", special: null })
            );
        }
        redrawDrawing();
        saveState();
        updateUndoRedoButtons();
    }

    function populateColorPalette() {
        colorPaletteDiv.innerHTML = ''; 
        const colors = COLOR_INFO_MAP.filter(c => c.name !== 'Achtergrond');
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
        const containerWidth = canvas.parentElement.getBoundingClientRect().width * 0.95;
        getHexMetrics(containerWidth);
        
        const totalWidth = (gridWidth + 0.5) * hexWidth;
        const totalHeight = (gridHeight * 0.75 + 0.25) * hexHeight;
        canvas.width = totalWidth;
        canvas.height = totalHeight;

        ctx.clearRect(0, 0, totalWidth, totalHeight);
        
        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                const cellData = drawingMatrix[r][c] || { color: "Achtergrond", special: null };
                drawHexagon(ctx, c, r, cellData, hexSize, hexWidth, hexVertSpacing, false);
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
    
    // AANGEPAST: De correctie zit hier. De klikcoördinaten worden nu correct vertaald
    // voordat ze naar de wiskundige formule worden gestuurd.
    function paintCell(x, y) {
        // De 'pixelToHex' formule verwacht coördinaten die relatief zijn aan het centrum van de hex op (0,0).
        // Het centrum van die hex is (hexWidth / 2, hexHeight / 2). We rekenen de klik om.
        const translatedX = x - (hexWidth / 2);
        const translatedY = y - (hexHeight / 2);

        const { col, row } = pixelToHex(translatedX, translatedY);
        
        if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
            const currentCell = drawingMatrix[row][col];
            let changed = false;

            if (currentTool === 'eye') {
                const newSpecial = currentCell.special === 'eye' ? null : 'eye';
                if (currentCell.special !== newSpecial) {
                    const newColor = newSpecial === 'eye' ? "Wit" : "Achtergrond";
                    drawingMatrix[row][col] = { ...currentCell, color: newColor, special: newSpecial };
                    changed = true;
                }
            } else { 
                if (currentCell.color !== currentColorName || currentCell.special !== null) {
                    drawingMatrix[row][col] = { color: currentColorName, special: null };
                    changed = true;
                }
            }
            
            if (changed) {
                redrawDrawing();
            }
        }
    }
    
    // --- State, Undo/Redo, Opslaan/Laden ---
    function saveState() {
        if (historyPointer < history.length - 1) { history = history.slice(0, historyPointer + 1); }
        history.push(JSON.stringify(drawingMatrix));
        if (history.length > MAX_HISTORY_STATES) { history.shift(); }
        historyPointer = history.length - 1;
        updateUndoRedoButtons();
    }
    function undo() { if (historyPointer > 0) { historyPointer--; drawingMatrix = JSON.parse(history[historyPointer]); redrawDrawing(); updateUndoRedoButtons(); } }
    function redo() { if (historyPointer < history.length - 1) { historyPointer++; drawingMatrix = JSON.parse(history[historyPointer]); redrawDrawing(); updateUndoRedoButtons(); } }
    function updateUndoRedoButtons() { undoBtn.disabled = historyPointer <= 0; redoBtn.disabled = historyPointer >= history.length - 1; }
    function clearDrawing() { drawingMatrix = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill({ color: "Achtergrond", special: null })); redrawDrawing(); saveState(); }
    
    // --- Werkblad Generatie ---
    function generateWorksheetPreview() {
        const type = document.querySelector('input[name="worksheetType"]:checked').value;
        werkbladModal.style.display = 'flex';
        setTimeout(() => {
            switch (type) {
                case 'oefeningen': drawExercisesPreview(); break;
                case 'natekenen': drawRedrawPreview(); break;
                case 'pixeltekening': drawPixelArtPreview(); break;
            }
        }, 0);
    }
    
    async function generateWorksheetPdf() {
        const type = document.querySelector('input[name="worksheetType"]:checked').value;
        meldingContainer.textContent = 'Bezig met genereren van PDF...';
        try {
            switch (type) {
                case 'oefeningen': await generateExercisesPdf(); break;
                case 'natekenen': await generateRedrawPdf(); break;
                case 'pixeltekening': await generatePixelArtPdf(); break;
            }
             meldingContainer.textContent = 'PDF succesvol aangemaakt!';
        } catch (e) { 
            console.error("PDF Generation Error:", e); 
            meldingContainer.textContent = 'Fout bij het maken van de PDF.'; 
        } finally { 
            setTimeout(() => { meldingContainer.textContent = '' }, 3000); 
        }
    }

    // --- Data generatie ---
    function getWorksheetData() {
        const operationType = document.querySelector('input[name="operationType"]:checked').value;
        const options = { numberRange: numberRangeSelect.value, selectedTables: Array.from(document.querySelectorAll('input[name="tafel"]:checked')).map(cb => cb.value) };
        let colorCounts = new Map();
        let totalFigureCells = 0;
        drawingMatrix.flat().forEach(cell => {
            if (cell.special === 'eye') return; // vak met oogje telt niet mee voor oefeningen/legende
            if (cell.color !== "Achtergrond") { colorCounts.set(cell.color, (colorCounts.get(cell.color) || 0) + 1); totalFigureCells++; }
        });
        const isMulDiv = ['vermenigvuldigen', 'delen', 'beide_verm_del'].includes(operationType);
        let maxOutcomeRange;
        if (operationType === 'delen') { maxOutcomeRange = 10; } 
        else if (isMulDiv) { maxOutcomeRange = 100; } 
        else { maxOutcomeRange = parseInt(options.numberRange) || 100; }
        let MIN_EXERCISES = 15;
        const exercisesPerColor = new Map();
        if (totalFigureCells > 0) {
            const sortedColorsByCount = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
            if (sortedColorsByCount.length > 0) {
                sortedColorsByCount.forEach(([name, count]) => { exercisesPerColor.set(name, Math.max(1, Math.round((count / totalFigureCells) * MIN_EXERCISES))); });
                let currentTotalExercises = Array.from(exercisesPerColor.values()).reduce((sum, count) => sum + count, 0);
                while (currentTotalExercises < MIN_EXERCISES) { for (const [name] of sortedColorsByCount) { if (currentTotalExercises >= MIN_EXERCISES) break; exercisesPerColor.set(name, exercisesPerColor.get(name) + 1); currentTotalExercises++; } }
            }
        }
        const legendData = new Map();
        const outcomesForLegend = new Set();
        const availableOutcomes = Array.from({length: maxOutcomeRange + 1}, (_, i) => i);
        for (let i = availableOutcomes.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[availableOutcomes[i], availableOutcomes[j]] = [availableOutcomes[j], availableOutcomes[i]]; }
        exercisesPerColor.forEach((num, name) => {
            const exercises = []; let attempts = 0;
            while (exercises.length < num && attempts < 500) {
                if (availableOutcomes.length === 0) break;
                const outcome = availableOutcomes.pop();
                const problem = generateProblemForOutcome(outcome, operationType, options);
                if (problem) { exercises.push({ problem, outcome }); outcomesForLegend.add(outcome); } 
                else { if(outcome !== undefined) availableOutcomes.unshift(outcome); }
                attempts++;
            }
            legendData.set(name, exercises);
        });
        const distractorNumbers = [];
        for (let i = 0; i <= maxOutcomeRange; i++) { if (!outcomesForLegend.has(i)) distractorNumbers.push(i); }
        return { legendData, distractorNumbers };
    }
    
    function generateProblemForOutcome(desiredOutcome, operationType, options) {
        const maxRange = parseInt(options.numberRange) || 100;
        let selectedTables = options.selectedTables.includes('all') ? [1,2,3,4,5,6,7,8,9,10] : (options.selectedTables || []).map(Number).filter(n => n > 0);
        const operation = operationType.includes('beide') ? (operationType.includes('opt_aft') ? (Math.random() > 0.5 ? 'optellen' : 'aftrekken') : (Math.random() > 0.5 ? 'vermenigvuldigen' : 'delen')) : operationType;
        switch (operation) {
            case 'optellen': if (desiredOutcome > maxRange * 2) return null; for (let i = 0; i < 50; i++) { const num1 = Math.floor(Math.random() * (desiredOutcome + 1)); const num2 = desiredOutcome - num1; if (num1 <= maxRange && num2 <= maxRange && num2 >= 0) return `${num1} + ${num2}`; } return null;
            case 'aftrekken': if (desiredOutcome > maxRange) return null; for (let i = 0; i < 100; i++) { const num2 = Math.floor(Math.random() * (maxRange - desiredOutcome + 1)); const num1 = desiredOutcome + num2; if (num1 <= maxRange) return `${num1} - ${num2}`; } return null;
            case 'vermenigvuldigen': if (selectedTables.length === 0) return null; const possibleFactors = selectedTables.filter(factor => desiredOutcome % factor === 0 && (desiredOutcome / factor) <= 10); if (possibleFactors.length > 0) { const factor1 = possibleFactors[Math.floor(Math.random() * possibleFactors.length)]; const factor2 = desiredOutcome / factor1; return Math.random() > 0.5 ? `${factor1} x ${factor2}` : `${factor2} x ${factor1}`; } return null;
            case 'delen': if (selectedTables.length === 0 || desiredOutcome > 10) return null; const possibleDivisors = selectedTables.filter(divisor => (desiredOutcome * divisor) <= 100); if (possibleDivisors.length > 0) { const divisor = possibleDivisors[Math.floor(Math.random() * possibleDivisors.length)]; const dividend = desiredOutcome * divisor; return `${dividend} : ${divisor}`; } return null;
            default: return null;
        }
    }

    function generateAndDisplayLegend(legendData) {
        werkbladLegendContent.innerHTML = '';
        werkbladLegendContent.style.cssText = 'display: flex; flex-direction: row; flex-wrap: wrap; align-content: flex-start;';
        let allExercises = [];
        legendData.forEach((exercises, name) => { const colorInfo = getColorInfoByName(name); exercises.forEach(exercise => allExercises.push({ ...exercise, colorName: name, colorHex: colorInfo.hex })); });
        allExercises.forEach(ex => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; margin-bottom: 5px; flex-basis: 50%; box-sizing: border-box; padding-right: 10px;';
            item.innerHTML = `<div style="width: 15px; height: 15px; background-color: ${ex.colorHex}; border: 1px solid #333; margin-right: 10px;"></div><span>${ex.problem} = </span>`;
            werkbladLegendContent.appendChild(item);
        });
    }

    // --- Preview en PDF functies (Stabiele Versie) ---
    function prepareWerkbladCanvas(isStacked = false) {
        const contentWrapper = document.getElementById('werkblad-content');
        const legend = document.getElementById('werkblad-legend-container');
        const buttons = document.getElementById('werkblad-knoppen');
        
        const availableWidth = contentWrapper.clientWidth;
        let availableHeight = contentWrapper.clientHeight - (legend.clientHeight + buttons.clientHeight + 40);
        if (isStacked) {
            availableHeight = (availableHeight / 2) - 15;
        }

        const hexSizeByWidth = (availableWidth / (gridWidth + 0.5)) / Math.sqrt(3);
        const hexSizeByHeight = (availableHeight / (gridHeight * 0.75 + 0.25)) / 2;
        const finalHexSize = Math.min(hexSizeByWidth, hexSizeByHeight);

        const finalCanvasWidth = (gridWidth + 0.5) * (finalHexSize * Math.sqrt(3));
        const finalCanvasHeight = ((gridHeight * 0.75 + 0.25) * (2 * finalHexSize));
        const totalCanvasHeight = isStacked ? (finalCanvasHeight * 2) + 30 : finalCanvasHeight;
        
        werkbladCanvas.width = finalCanvasWidth;
        werkbladCanvas.height = totalCanvasHeight;
        werkbladCanvas.style.width = `${finalCanvasWidth}px`;
        werkbladCanvas.style.height = `${totalCanvasHeight}px`;
        
        return {
            hexSize: finalHexSize,
            hexWidth: finalHexSize * Math.sqrt(3),
            hexVertSpacing: (2 * finalHexSize) * 0.75,
            singleGridHeight: finalCanvasHeight,
            spacing: 30
        };
    }
    
    function drawHexagonInPdf(doc, points, eyeData) {
        doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.1);
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i]; const p2 = points[(i + 1) % points.length];
            if (!isNaN(p1[0]) && !isNaN(p1[1]) && !isNaN(p2[0]) && !isNaN(p2[1])) {
                doc.line(p1[0], p1[1], p2[0], p2[1]);
            }
        }
        if (eyeData) {
            doc.setFillColor("#000000"); doc.circle(eyeData.x, eyeData.y, eyeData.radius, 'F');
            doc.setFillColor("#FFFFFF"); doc.circle(eyeData.x - eyeData.radius * 0.25, eyeData.y - eyeData.radius * 0.25, eyeData.radius * 0.375, 'F');
        }
    }

    function drawExercisesPreview() {
        werkbladTitle.textContent = "Werkblad Voorbeeld"; werkbladLegendContainer.style.display = 'block'; werkbladLegendTitle.textContent = "Kleurcode:";
        const { hexSize, hexWidth, hexVertSpacing } = prepareWerkbladCanvas(false);
        const { legendData, distractorNumbers } = getWorksheetData();
        werkbladCtx.clearRect(0, 0, werkbladCanvas.width, werkbladCanvas.height);
        const outcomePools = new Map();
        legendData.forEach((exercises, name) => outcomePools.set(name, exercises.map(e => e.outcome)));
        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                const originalCell = drawingMatrix[r][c];
                const pool = outcomePools.get(originalCell.color);
                let displayedNumber = originalCell.color === "Achtergrond" ? (distractorNumbers.length > 0 ? distractorNumbers[Math.floor(Math.random() * distractorNumbers.length)] : '') : pool && pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : '?';
                // Geen getal tonen in een vak met oogje
                if (originalCell.special === 'eye') { displayedNumber = ''; }
                const cellForDrawing = { color: 'Achtergrond', special: originalCell.special };
                drawHexagon(werkbladCtx, c, r, cellForDrawing, hexSize, hexWidth, hexVertSpacing, true, displayedNumber);
            }
        }
        generateAndDisplayLegend(legendData);
    }
    
    async function generateExercisesPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const { legendData, distractorNumbers } = getWorksheetData();
        const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); const margin = 10;
        let allExercises = [];
        legendData.forEach((exercises, name) => { const colorInfo = getColorInfoByName(name); exercises.forEach(exercise => allExercises.push({ ...exercise, colorName: name, colorHex: colorInfo.hex })); });
        const legendLineHeight = 8; const legendHeight = (Math.ceil(allExercises.length / 2) * legendLineHeight) + 30;
        const hexSizeByWidth = ((pageWidth - 2 * margin) / (gridWidth + 0.5)) / Math.sqrt(3);
        const hexSizeByHeight = ((pageHeight - 2 * margin - legendHeight) / (gridHeight * 0.75 + 0.25)) / 2;
        const pdfHexSize = Math.min(hexSizeByWidth, hexSizeByHeight);
        const pdfHexWidth = pdfHexSize * Math.sqrt(3); const pdfHexVertSpacing = (2 * pdfHexSize) * 0.75;
        const totalGridWidth = (gridWidth + 0.5) * pdfHexWidth; const xOffset = (pageWidth - totalGridWidth) / 2;
        const outcomePools = new Map();
        legendData.forEach((exercises, name) => outcomePools.set(name, exercises.map(e => e.outcome)));
        doc.setFontSize(pdfHexSize * 2.5);
        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                const originalCell = drawingMatrix[r][c];
                const pool = outcomePools.get(originalCell.color);
                let num = originalCell.color === "Achtergrond" ? (distractorNumbers.length > 0 ? distractorNumbers[Math.floor(Math.random() * distractorNumbers.length)] : '') : pool && pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : '?';
                const center = getHexCenter(c, r, pdfHexSize, pdfHexWidth, pdfHexVertSpacing);
                const points = getHexPoints(xOffset + center.x, margin + center.y, pdfHexSize);
                const eyeData = originalCell.special === 'eye' ? { x: xOffset + center.x, y: margin + center.y, radius: pdfHexSize * 0.4 } : null;
                drawHexagonInPdf(doc, points, eyeData);
                // Geen getal tekenen achter een oogje
                if (originalCell.special !== 'eye') {
                    doc.text(num.toString(), xOffset + center.x, margin + center.y, { align: 'center', baseline: 'middle' });
                }
            }
        }
        let currentY = margin + (gridHeight * 0.75 + 0.25) * (2 * pdfHexSize) + 10;
        if (currentY > pageHeight - legendHeight) { doc.addPage(); currentY = margin; }
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text("Oefeningen", margin, currentY); currentY += 10;
        doc.setFontSize(12); doc.setFont('helvetica', 'normal');
        const initialY = currentY; const col2X = margin + (pageWidth / 2 - margin); const midpoint = Math.ceil(allExercises.length / 2);
        allExercises.forEach((exercise, index) => {
            const xPos = index < midpoint ? margin : col2X;
            if (index === midpoint) currentY = initialY;
            doc.setFillColor(getColorInfoByName(exercise.colorName).hex);
            doc.rect(xPos, currentY - 4, 6, 6, 'F');
            doc.setTextColor(0, 0, 0);
            doc.text(`${exercise.problem} = `, xPos + 10, currentY);
            currentY += legendLineHeight;
        });
        doc.save(`hexagon-reken-werkblad.pdf`);
    }

    function drawRedrawPreview() {
        werkbladTitle.textContent = "Natekenen Voorbeeld"; werkbladLegendContainer.style.display = 'none';
        const { hexSize, hexWidth, hexVertSpacing, singleGridHeight, spacing } = prepareWerkbladCanvas(true);
        werkbladCtx.clearRect(0, 0, werkbladCanvas.width, werkbladCanvas.height);
        for (let r = 0; r < gridHeight; r++) { for (let c = 0; c < gridWidth; c++) { drawHexagon(werkbladCtx, c, r, drawingMatrix[r][c], hexSize, hexWidth, hexVertSpacing, false); } }
        const emptyGridYOffset = singleGridHeight + spacing;
        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                 const center = getHexCenter(c, r, hexSize, hexWidth, hexVertSpacing);
                 const path = getHexPath(center.x, center.y + emptyGridYOffset, hexSize);
                 werkbladCtx.strokeStyle = '#333'; werkbladCtx.stroke(path);
                 if(drawingMatrix[r][c].special === 'eye') {
                    werkbladCtx.fillStyle = '#000'; werkbladCtx.beginPath();
                    werkbladCtx.arc(center.x, center.y + emptyGridYOffset, hexSize * 0.4, 0, 2*Math.PI);
                    werkbladCtx.fill();
                    werkbladCtx.fillStyle = '#FFF'; werkbladCtx.beginPath();
                    werkbladCtx.arc(center.x - hexSize * 0.1, center.y + emptyGridYOffset - hexSize * 0.1, hexSize * 0.15, 0, 2*Math.PI);
                    werkbladCtx.fill();
                 }
            }
        }
    }
    
    async function generateRedrawPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgData = canvas.toDataURL('image/png');
        const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); const margin = 10; const spacing = 10;
        const availableWidth = pageWidth - 2 * margin; const availableHeight = (pageHeight - 2 * margin - spacing) / 2;
        const imgAspectRatio = canvas.width / canvas.height;
        let pdfDrawingWidth = availableWidth; let pdfDrawingHeight = pdfDrawingWidth / imgAspectRatio;
        if (pdfDrawingHeight > availableHeight) { pdfDrawingHeight = availableHeight; pdfDrawingWidth = pdfDrawingHeight * imgAspectRatio; }
        const xOffset = (pageWidth - pdfDrawingWidth) / 2;
        doc.addImage(imgData, 'PNG', xOffset, margin, pdfDrawingWidth, pdfDrawingHeight);
        const yOffset2 = margin + pdfDrawingHeight + spacing;
        const hexSizeByWidth = (pdfDrawingWidth / (gridWidth + 0.5)) / Math.sqrt(3);
        const hexSizeByHeight = (pdfDrawingHeight / (gridHeight * 0.75 + 0.25)) / 2;
        const pdfHexSize = Math.min(hexSizeByWidth, hexSizeByHeight);
        const pdfHexWidth = pdfHexSize * Math.sqrt(3); const pdfHexVertSpacing = (2 * pdfHexSize) * 0.75;
        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                 const center = getHexCenter(c, r, pdfHexSize, pdfHexWidth, pdfHexVertSpacing);
                 const points = getHexPoints(xOffset + center.x, yOffset2 + center.y, pdfHexSize);
                 const eyeData = drawingMatrix[r][c].special === 'eye' ? { x: xOffset + center.x, y: yOffset2 + center.y, radius: pdfHexSize * 0.4 } : null;
                 drawHexagonInPdf(doc, points, eyeData);
            }
        }
        doc.save('werkblad-natekenen-hexagon.pdf');
    }

    function generatePixelArtData() {
        const data = [];
        for (let r = 0; r < gridHeight; r++) {
            const rowData = [];
            if (drawingMatrix[r].length === 0) { data.push(rowData); continue; }
            let currentCount = 1; let currentColor = drawingMatrix[r][0].color;
            for (let c = 1; c < gridWidth; c++) { if (drawingMatrix[r][c].color === currentColor) { currentCount++; } else { rowData.push({ color: currentColor, count: currentCount }); currentColor = drawingMatrix[r][c].color; currentCount = 1; } }
            rowData.push({ color: currentColor, count: currentCount });
            data.push(rowData);
        }
        return data;
    }
    
    function drawPixelArtPreview() {
        werkbladTitle.textContent = "Hexagon-per-rij Code"; werkbladLegendContainer.style.display = 'none';
        const { hexSize, hexWidth, hexVertSpacing } = prepareWerkbladCanvas(false);
        const data = generatePixelArtData();
        const instructionWidth = werkbladCanvas.width * 0.4;
        werkbladCtx.clearRect(0, 0, werkbladCanvas.width, werkbladCanvas.height);
        const instructionCellSize = Math.min(hexVertSpacing, 20);
        werkbladCtx.font = `${instructionCellSize * 0.7}px Arial`; werkbladCtx.textBaseline = 'middle'; werkbladCtx.textAlign = 'left';
        for (let r = 0; r < gridHeight; r++) {
            const rowInstructions = data[r]; let currentX = 5;
            const y = getHexCenter(0,r,hexSize, hexWidth, hexVertSpacing).y;
            for (const inst of rowInstructions) {
                const colorInfo = getColorInfoByName(inst.color);
                werkbladCtx.fillStyle = colorInfo.hex;
                werkbladCtx.fillRect(currentX, y - instructionCellSize/2, instructionCellSize, instructionCellSize);
                werkbladCtx.fillStyle = '#000';
                werkbladCtx.strokeRect(currentX, y - instructionCellSize/2, instructionCellSize, instructionCellSize);
                werkbladCtx.fillText(inst.count, currentX + instructionCellSize + 2, y);
                currentX += instructionCellSize + 2 + werkbladCtx.measureText(inst.count).width + 5;
            }
        }
        const gridXOffset = instructionWidth;
        for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
                const center = getHexCenter(c,r,hexSize, hexWidth, hexVertSpacing);
                const path = getHexPath(center.x + gridXOffset, center.y, hexSize);
                werkbladCtx.strokeStyle = '#AAA'; werkbladCtx.stroke(path);
                if (drawingMatrix[r][c].special === 'eye') {
                    werkbladCtx.fillStyle = '#000'; werkbladCtx.beginPath();
                    werkbladCtx.arc(center.x + gridXOffset, center.y, hexSize * 0.4, 0, 2*Math.PI);
                    werkbladCtx.fill();
                    werkbladCtx.fillStyle = '#FFF'; werkbladCtx.beginPath();
                    werkbladCtx.arc(center.x + gridXOffset - hexSize * 0.1, center.y - hexSize * 0.1, hexSize * 0.15, 0, 2*Math.PI);
                    werkbladCtx.fill();
                }
            }
        }
    }
    
    async function generatePixelArtPdf() {
         const { jsPDF } = window.jspdf; 
         const doc = new jsPDF('l', 'mm', 'a4'); 
         const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); const margin = 10;
         const data = generatePixelArtData();
         const instructionSquareSize = 4; const instructionAreaWidth = 80; const gridAreaWidth = pageWidth - instructionAreaWidth - 2 * margin;
         const hexSizeByWidth = (gridAreaWidth / (gridWidth + 0.5)) / Math.sqrt(3);
         const hexSizeByHeight = ((pageHeight - 2 * margin) / (gridHeight * 0.75 + 0.25)) / 2;
         const pdfHexSize = Math.min(hexSizeByWidth, hexSizeByHeight);
         const pdfHexWidth = pdfHexSize * Math.sqrt(3); const pdfHexVertSpacing = (2 * pdfHexSize) * 0.75;
         doc.setFont('helvetica', 'normal'); doc.setFontSize(instructionSquareSize * 2.5);
         for (let r = 0; r < gridHeight; r++) {
             const row_center_y = getHexCenter(0, r, pdfHexSize, pdfHexWidth, pdfHexVertSpacing).y + margin;
             let currentX = margin;
             for (const inst of data[r]) {
                 const colorInfo = getColorInfoByName(inst.color);
                 doc.setFillColor(colorInfo.hex);
                 doc.setDrawColor(0); doc.setLineWidth(0.1);
                 doc.rect(currentX, row_center_y - instructionSquareSize/2, instructionSquareSize, instructionSquareSize, 'FD');
                 doc.setTextColor(0, 0, 0);
                 doc.text(String(inst.count), currentX + instructionSquareSize + 1, row_center_y, { baseline: 'middle' });
                 currentX += instructionSquareSize + 1 + doc.getTextWidth(String(inst.count)) + 2;
             }
         }
         const gridXOffset = margin + instructionAreaWidth;
         for (let r = 0; r < gridHeight; r++) {
            for(let c = 0; c < gridWidth; c++) {
                const center = getHexCenter(c,r,pdfHexSize, pdfHexWidth, pdfHexVertSpacing);
                const points = getHexPoints(gridXOffset + center.x, margin + center.y, pdfHexSize);
                const eyeData = drawingMatrix[r][c].special === 'eye' ? { x: gridXOffset + center.x, y: margin + center.y, radius: pdfHexSize * 0.4 } : null;
                drawHexagonInPdf(doc, points, eyeData);
            }
         }
         doc.save('werkblad-hexagon-code.pdf');
    }

    // --- Catalogus Functies ---
    async function loadCatalog() {
        try { const response = await fetch('hexagon_afbeeldingen/catalog.json'); if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); catalogData = await response.json(); } catch (e) { console.error("Kon de catalogus niet laden:", e); meldingContainer.textContent = "Fout bij laden van de catalogus."; }
    }
    function openCatalog() { populateThemes(); catalogModal.style.display = 'block'; }
    function closeCatalog() { catalogModal.style.display = 'none'; themesContainer.style.display = 'grid'; choicesContainer.style.display = 'none'; backToThemesBtn.style.display = 'none'; modalTitle.textContent = 'Catalogus'; }
    function populateThemes() { themesContainer.innerHTML = ''; Object.keys(catalogData).forEach(theme => { const btn = document.createElement('button'); btn.textContent = theme; btn.onclick = () => showChoices(theme); themesContainer.appendChild(btn); }); }
    function showChoices(theme) {
        choicesContainer.innerHTML = ''; const choices = catalogData[theme];
        if (!choices || choices.length === 0) { choicesContainer.innerHTML = '<p>Nog geen tekeningen beschikbaar.</p>'; } else {
            choices.forEach(choice => { const btn = document.createElement('button'); btn.className = 'catalog-choice-button'; btn.onclick = () => loadDrawingFromCatalog(choice.bestandsnaam); const img = document.createElement('img'); img.src = `hexagon_afbeeldingen/${choice.afbeelding}`; img.alt = choice.naam; const span = document.createElement('span'); span.textContent = choice.naam; btn.appendChild(img); btn.appendChild(span); choicesContainer.appendChild(btn); });
        }
        themesContainer.style.display = 'none'; choicesContainer.style.display = 'grid'; backToThemesBtn.style.display = 'block'; modalTitle.textContent = theme;
    }
    function showThemes() { themesContainer.style.display = 'grid'; choicesContainer.style.display = 'none'; backToThemesBtn.style.display = 'none'; modalTitle.textContent = 'Catalogus'; }
    async function loadDrawingFromCatalog(fileName) {
        meldingContainer.textContent = 'Tekening laden...';
        try {
            const response = await fetch(`hexagon_afbeeldingen/${fileName}`); if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); const data = await response.json();
            gridWidthInput.value = data.gridWidth; gridHeightInput.value = data.gridHeight; gridWidth = data.gridWidth; gridHeight = data.gridHeight; drawingMatrix = data.drawingMatrix;
            initializeDrawingCanvas(); closeCatalog();
        } catch (e) { console.error("Kon tekening niet laden:", e); meldingContainer.textContent = "Fout bij laden van de tekening."; } finally { setTimeout(() => { meldingContainer.textContent = '' }, 3000); }
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        updateGridSizeBtn.addEventListener('click', () => { const w = parseInt(gridWidthInput.value); const h = parseInt(gridHeightInput.value); if (w >= 10 && h >= 10 && w <= 60 && h <= 60) { gridWidth = w; gridHeight = h; initializeDrawingCanvas(); } });
        eyeToolBtn.addEventListener('click', () => { currentTool = 'eye'; eyeToolBtn.classList.add('selected'); document.querySelectorAll('.color-box').forEach(x => x.classList.remove('selected')); });
        canvas.addEventListener('mousedown', (e) => { isDrawing = true; paintCell(getMousePos(canvas, e).x, getMousePos(canvas, e).y); });
        canvas.addEventListener('mousemove', (e) => { if (isDrawing) paintCell(getMousePos(canvas, e).x, getMousePos(canvas, e).y); });
        canvas.addEventListener('mouseup', () => { if (isDrawing) { isDrawing = false; saveState(); }});
        canvas.addEventListener('mouseleave', () => { if (isDrawing) { isDrawing = false; saveState(); }});
        undoBtn.addEventListener('click', undo); redoBtn.addEventListener('click', redo); clearDrawingBtn.addEventListener('click', clearDrawing);
        operationTypeRadios.forEach(r => r.addEventListener('change', updateOperationControls));
        document.querySelectorAll('input[name="tafel"]').forEach(cb => { cb.addEventListener('change', () => { if (cb.value !== 'all' && cb.checked) allTablesCheckbox.checked = false; applyAllTablesState(); }); });
        worksheetTypeRadios.forEach(r => r.addEventListener('change', updateWorksheetTypeControls));
        saveDrawingBtn.addEventListener('click', () => { if (!drawingMatrix || drawingMatrix.length === 0) { meldingContainer.textContent = "Er is geen tekening om op te slaan."; setTimeout(() => { meldingContainer.textContent = '' }, 3000); return; } try { const data = { gridWidth, gridHeight, drawingMatrix }; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' })); a.download = 'hexagon-tekening.json'; a.click(); URL.revokeObjectURL(a.href); } catch (e) { console.error("Fout bij opslaan:", e); meldingContainer.textContent = "Kon de tekening niet opslaan."; } });
        loadDrawingBtn.addEventListener('click', () => loadDrawingInput.click());
        loadDrawingInput.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try { const data = JSON.parse(ev.target.result); gridWidthInput.value = data.gridWidth; gridHeightInput.value = data.gridHeight; gridWidth = data.gridWidth; gridHeight = data.gridHeight; drawingMatrix = data.drawingMatrix; initializeDrawingCanvas(); } catch (err) { meldingContainer.textContent = "Fout bij laden: " + err.message; }
                finally { setTimeout(() => { meldingContainer.textContent = '' }, 3000); }
            };
            reader.readAsText(file);
        });
        downloadPngBtn.addEventListener('click', () => { const link = document.createElement('a'); link.download = 'hexagon-tekening.png'; link.href = canvas.toDataURL("image/png"); link.click(); });
        downloadPdfBtn.addEventListener('click', async () => { meldingContainer.textContent = 'Bezig met genereren van Tekening PDF...'; const { jsPDF } = window.jspdf; const doc = new jsPDF('p', 'mm', 'a4'); const imgData = canvas.toDataURL('image/png'); const imgProps = doc.getImageProperties(imgData); const pdfWidth = doc.internal.pageSize.getWidth() - 20; const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width; doc.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight); doc.save('hexagon-tekening.pdf'); meldingContainer.textContent = ''; });
        showPreviewBtn.addEventListener('click', generateWorksheetPreview);
        sluitWerkbladBtn.addEventListener('click', () => { werkbladModal.style.display = 'none'; });
        werkbladDownloadPdfBtn.addEventListener('click', generateWorksheetPdf);
        werkbladDownloadPngBtn.addEventListener('click', () => { const link = document.createElement('a'); link.download = 'werkblad-hexagon.png'; link.href = werkbladCanvas.toDataURL('image/png'); link.click(); });
        catalogBtn.addEventListener('click', openCatalog);
        closeModalBtn.addEventListener('click', closeCatalog);
        backToThemesBtn.addEventListener('click', showThemes);
        window.addEventListener('click', (e) => { if (e.target == catalogModal) closeCatalog(); });
    }
    
    function updateOperationControls() { const op = document.querySelector('input[name="operationType"]:checked').value; const isAddSub = ['optellen', 'aftrekken', 'beide_opt_aft'].includes(op); const isMulDiv = ['vermenigvuldigen', 'delen', 'beide_verm_del'].includes(op); rangeControls.style.display = isAddSub ? 'block' : 'none'; tablesControls.style.display = isMulDiv ? 'block' : 'none'; if(isMulDiv) applyAllTablesState(); }
    function applyAllTablesState() { const all = allTablesCheckbox.checked; document.querySelectorAll('input[name="tafel"]').forEach(cb => { if (cb.value !== 'all') cb.disabled = all; }); }
    function updateWorksheetTypeControls() { const selectedType = document.querySelector('input[name="worksheetType"]:checked').value; exerciseControlsContainer.style.display = selectedType === 'oefeningen' ? 'block' : 'none'; }

    // --- INITIALISATIE ---
    async function init() {
        await loadCatalog();
        allTablesCheckbox.checked = false;
        populateColorPalette();
        updateOperationControls();
        updateWorksheetTypeControls(); 
        setupEventListeners();
        initializeDrawingCanvas();
        window.addEventListener('resize', redrawDrawing);
    }

    init();
});
