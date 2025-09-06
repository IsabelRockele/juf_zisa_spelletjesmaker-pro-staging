document.addEventListener("DOMContentLoaded", () => {
    // --- Canvas en contexten ---
    const drawingCanvas = document.getElementById("drawingCanvas");
    const drawCtx = drawingCanvas.getContext("2d");
    const worksheetCanvas = document.getElementById("worksheetCanvas");
    const worksheetCtx = worksheetCanvas.getContext("2d");

    // --- DOM-elementen ---
    const gridWidthInput = document.getElementById("gridWidth");
    const gridHeightInput = document.getElementById("gridHeight");
    const resetGridBtn = document.getElementById('resetGridBtn');
    const generateBtn = document.getElementById("generateBtn");
    const clearBtn = document.getElementById("clearBtn");
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");
    const meldingContainer = document.getElementById("meldingContainer");
    const instructionsOutput = document.getElementById("instructions-output");
    const toolBtns = document.querySelectorAll(".tool-btn");
    const saveDrawingBtn = document.getElementById('saveDrawingBtn');
    const loadDrawingBtn = document.getElementById('loadDrawingBtn');
    const loadDrawingInput = document.getElementById('loadDrawingInput');
    const catalogBtn = document.getElementById('catalogBtn');
    const catalogModal = document.getElementById('catalogModal');
    const closeModalBtn = document.querySelector('.close-button');
    const backToThemesBtn = document.getElementById('backToThemesBtn');
    const themesContainer = document.getElementById('catalog-themes');
    const choicesContainer = document.getElementById('catalog-choices');
    const modalTitle = document.getElementById('modal-title');
    const addColLeftBtn = document.getElementById('addColLeftBtn');
    const removeColLeftBtn = document.getElementById('removeColLeftBtn');
    const addColRightBtn = document.getElementById('addColRightBtn');
    const removeColRightBtn = document.getElementById('removeColRightBtn');
    const addRowTopBtn = document.getElementById('addRowTopBtn');
    const removeRowTopBtn = document.getElementById('removeRowTopBtn');
    const addRowBottomBtn = document.getElementById('addRowBottomBtn');
    const removeRowBottomBtn = document.getElementById('removeRowBottomBtn');
    const lineColorInput = document.getElementById('lineColor');
    const featureColorInput = document.getElementById('featureColor');
    // NIEUWE ELEMENTEN
    const fillTriangleCheckbox = document.getElementById('fillTriangleCheckbox');
    const undoCodeBtn = document.getElementById('undoCodeBtn');


    // --- Status variabelen ---
    let gridWidth, gridHeight, cellSize;
    let features = [];
    let codedPath = [];
    let freehandLines = [];
    let coloredLines = [];
    let startPoint = null;
    let isDrawing = false;
    let currentTool = 'start';
    let selectedFeature = null;
    let action = null;
    let previewLine = null;
    let previewColoredLine = null;
    let catalogData = {};
    let dragStartPos = null;

    // --- INITIALISATIE ---
    function initializeGrid() {
        gridWidth = parseInt(gridWidthInput.value);
        gridHeight = parseInt(gridHeightInput.value);
        resetDrawing();
        updateCanvasAndRedraw();
    }

    function resetDrawing() {
        features = [];
        codedPath = [];
        freehandLines = [];
        coloredLines = [];
        startPoint = null;
        selectedFeature = null;
        clearOutput();
        redrawAll();
    }

    function updateCanvasAndRedraw() {
        const container = drawingCanvas.parentElement;
        const containerWidth = container.clientWidth - 20;
        const containerHeight = container.clientHeight - 20;
        cellSize = Math.min(containerWidth / gridWidth, containerHeight / gridHeight);
        drawingCanvas.width = gridWidth * cellSize;
        drawingCanvas.height = gridHeight * cellSize;
        redrawAll();
    }

    function clearOutput() {
        instructionsOutput.innerHTML = '';
        worksheetCtx.clearRect(0, 0, worksheetCanvas.width, worksheetCanvas.height);
        downloadPdfBtn.disabled = true;
        meldingContainer.textContent = '';
    }

    // --- TEKENFUNCTIES (HERTEKEN ALLES) ---
    function redrawAll() {
        drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
        drawGridLines(drawCtx);

        if (codedPath.length > 1) {
            drawCtx.strokeStyle = '#333';
            drawCtx.lineWidth = Math.max(1.5, cellSize / 10);
            drawCtx.lineCap = 'round';
            drawCtx.lineJoin = 'round';
            drawCtx.beginPath();
            drawCtx.moveTo(codedPath[0].vx * cellSize, codedPath[0].vy * cellSize);
            for (let i = 1; i < codedPath.length; i++) {
                drawCtx.lineTo(codedPath[i].vx * cellSize, codedPath[i].vy * cellSize);
            }
            drawCtx.stroke();
        }

        features.forEach(f => drawFeature(drawCtx, f));

        if (selectedFeature) {
            drawSelectionBox(drawCtx, selectedFeature);
        }

        freehandLines.forEach(path => {
            drawCtx.strokeStyle = '#000';
            drawCtx.lineWidth = Math.max(1, cellSize / 10);
            drawCtx.beginPath();
            if (path.length > 0) {
                drawCtx.moveTo(path[0].gridX * cellSize, path[0].gridY * cellSize);
                for (let i = 1; i < path.length; i++) {
                    drawCtx.lineTo(path[i].gridX * cellSize, path[i].gridY * cellSize);
                }
            }
            drawCtx.stroke();
        });
        
        coloredLines.forEach(line => {
            drawCtx.strokeStyle = line.color;
            drawCtx.lineWidth = Math.max(1.5, cellSize / 10);
            drawCtx.beginPath();
            drawCtx.moveTo(line.startGridX * cellSize, line.startGridY * cellSize);
            drawCtx.lineTo(line.endGridX * cellSize, line.endGridY * cellSize);
            drawCtx.stroke();
        });

        if (codedPath.length > 0) {
            const currentStartPoint = codedPath[0];
            drawCtx.fillStyle = '#ff0000';
            drawCtx.beginPath();
            drawCtx.arc(currentStartPoint.vx * cellSize, currentStartPoint.vy * cellSize, cellSize / 3.5, 0, Math.PI * 2);
            drawCtx.fill();
        }
        
        if (previewLine) {
            drawCtx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            drawCtx.lineWidth = 1;
            drawCtx.setLineDash([2, 3]);
            drawCtx.beginPath();
            drawCtx.moveTo(previewLine.start.vx * cellSize, previewLine.start.vy * cellSize);
            drawCtx.lineTo(previewLine.end.vx * cellSize, previewLine.end.vy * cellSize);
            drawCtx.stroke();
            drawCtx.setLineDash([]);
        }

        if (previewColoredLine) {
            drawCtx.strokeStyle = previewColoredLine.color;
            drawCtx.lineWidth = Math.max(1.5, cellSize / 10);
            drawCtx.beginPath();
            drawCtx.moveTo(previewColoredLine.startGridX * cellSize, previewColoredLine.startGridY * cellSize);
            drawCtx.lineTo(previewColoredLine.endGridX * cellSize, previewColoredLine.endGridY * cellSize);
            drawCtx.stroke();
        }
    }

    function drawGridLines(ctx) {
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridWidth; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, gridHeight * cellSize);
            ctx.stroke();
        }
        for (let i = 0; i <= gridHeight; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(gridWidth * cellSize, i * cellSize);
            ctx.stroke();
        }
    }

    function drawFeature(ctx, feature) {
        const pixelX = feature.gridX * cellSize;
        const pixelY = feature.gridY * cellSize;
        
        ctx.save();
        ctx.translate(pixelX, pixelY);
        ctx.rotate(feature.rotation || 0);
        
        const featureSize = feature.sizeRatio * cellSize;

        switch (feature.type) {
            case 'eye':
            case 'nose':
                ctx.fillStyle = feature.color || '#000000';
                ctx.beginPath();
                ctx.arc(0, 0, featureSize / 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'mouth':
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = Math.max(1.5, cellSize / 12);
                ctx.beginPath();
                ctx.arc(0, 0, featureSize / 2, 0.2 * Math.PI, 0.8 * Math.PI);
                ctx.stroke();
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(0, -featureSize / 2);
                ctx.lineTo(featureSize / 2, featureSize / 2);
                ctx.lineTo(-featureSize / 2, featureSize / 2);
                ctx.closePath();
                if (feature.isFilled) {
                    ctx.fillStyle = feature.color || '#000000';
                    ctx.fill();
                } else {
                    ctx.strokeStyle = feature.color || '#000000';
                    ctx.lineWidth = Math.max(1.5, cellSize / 12);
                    ctx.stroke();
                }
                break;
        }
        ctx.restore();
    }

    function drawSelectionBox(ctx, feature) {
        const bounds = getFeatureBounds(feature);
        ctx.save();
        ctx.translate(feature.gridX * cellSize, feature.gridY * cellSize);
        ctx.rotate(feature.rotation || 0);
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(-bounds.w / 2, -bounds.h / 2, bounds.w, bounds.h);
        ctx.setLineDash([]);
        
        if (feature.type === 'mouth' || feature.type === 'triangle') {
            const handleSize = 8;
            ctx.fillStyle = '#00aaff';
            ctx.fillRect(bounds.w / 2 - handleSize / 2, -handleSize / 2, handleSize, handleSize);
            ctx.fillRect(-bounds.w / 2 - handleSize / 2, -handleSize / 2, handleSize, handleSize);
            
            ctx.fillStyle = '#ff8c00';
            ctx.beginPath();
            ctx.arc(0, -bounds.h / 2 - 20, handleSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, -bounds.h / 2);
            ctx.lineTo(0, -bounds.h / 2 - 20);
            ctx.stroke();
        }
        ctx.restore();
    }

    function getFeatureBounds(feature) {
        const size = feature.sizeRatio * cellSize;
        if (feature.type === 'mouth') {
            return { w: size, h: size * 0.8 };
        }
        return { w: size, h: size };
    }

    // --- INTERACTIE & GEBRUIKERSINPUT ---
    function getMousePos(event) {
        const rect = drawingCanvas.getBoundingClientRect();
        return { 
            x: event.clientX - rect.left, 
            y: event.clientY - rect.top,
            gridX: (event.clientX - rect.left) / cellSize,
            gridY: (event.clientY - rect.top) / cellSize
        };
    }

    function handleMouseDown(event) {
        isDrawing = true;
        const pos = getMousePos(event);
        dragStartPos = pos;
        action = null;
        
        if (currentTool === 'move') {
            const clickedHandle = getClickedHandle(pos, selectedFeature);
            if (clickedHandle) {
                action = clickedHandle;
            } else {
                selectedFeature = getFeatureAtPos(pos);
                if (selectedFeature) {
                    action = 'move';
                }
            }
        } else if (currentTool === 'line') {
            const startVertex = codedPath.length > 0 ? codedPath[codedPath.length - 1] : codedPath[0];
            if (startVertex) {
                previewLine = { start: startVertex, end: startVertex };
            } else { isDrawing = false; }
        } else if (currentTool === 'freehand') {
            freehandLines.push([{ gridX: pos.gridX, gridY: pos.gridY }]);
        } else if (currentTool === 'coloredLine') {
            previewColoredLine = { startGridX: pos.gridX, startGridY: pos.gridY, endGridX: pos.gridX, endGridY: pos.gridY, color: lineColorInput.value };
        } else {
            selectedFeature = null;
        }
        redrawAll();
    }
    
    function handleMouseMove(event) {
        if (!isDrawing) return;
        const pos = getMousePos(event);
        
        if (currentTool === 'move' && selectedFeature && action) {
            const dx = pos.x - dragStartPos.x;
            const dy = pos.y - dragStartPos.y;
            const gridDx = dx / cellSize;
            const gridDy = dy / cellSize;

            switch(action) {
                case 'move': 
                    selectedFeature.gridX += gridDx; 
                    selectedFeature.gridY += gridDy; 
                    break;
                case 'resize':
                    const initialSize = getFeatureBounds(selectedFeature).w / cellSize;
                    selectedFeature.sizeRatio = Math.max(0.2, initialSize + (dx*2 / cellSize));
                    break;
                case 'rotate':
                    const angle = Math.atan2(pos.y - selectedFeature.gridY * cellSize, pos.x - selectedFeature.gridX * cellSize);
                    selectedFeature.rotation = angle - Math.PI / 2;
                    break;
            }
            dragStartPos = pos;
        } else if (currentTool === 'line' && previewLine) {
            previewLine.end = { vx: Math.round(pos.gridX), vy: Math.round(pos.gridY) };
        } else if (currentTool === 'freehand' && freehandLines.length > 0) {
            freehandLines[freehandLines.length - 1].push({ gridX: pos.gridX, gridY: pos.gridY });
        } else if (currentTool === 'coloredLine' && previewColoredLine) {
            previewColoredLine.endGridX = pos.gridX;
            previewColoredLine.endGridY = pos.gridY;
        } else if (currentTool === 'eraser') {
            const tolerance = 0.5; // Halve cel als gumgrootte
            const newFreehandLines = [];
            freehandLines.forEach(path => {
                let currentSegment = [];
                path.forEach(point => {
                    const dist = Math.hypot(point.gridX - pos.gridX, point.gridY - pos.gridY);
                    if (dist > tolerance) {
                        currentSegment.push(point);
                    } else {
                        if (currentSegment.length > 1) {
                            newFreehandLines.push(currentSegment);
                        }
                        currentSegment = [];
                    }
                });
                if (currentSegment.length > 1) {
                    newFreehandLines.push(currentSegment);
                }
            });
            freehandLines = newFreehandLines;
        }
        redrawAll();
    }
    
    function handleMouseUp(event) {
        if (!isDrawing) return;
        isDrawing = false;
        action = null;

        if (currentTool === 'line' && previewLine) {
            const endVertex = previewLine.end;
            let lastVertex = previewLine.start;
            while (lastVertex.vx !== endVertex.vx || lastVertex.vy !== endVertex.vy) {
                const dx = Math.sign(endVertex.vx - lastVertex.vx);
                const dy = Math.sign(endVertex.vy - lastVertex.vy);
                const nextVertex = { vx: lastVertex.vx + dx, vy: lastVertex.vy + dy };
                codedPath.push(nextVertex);
                lastVertex = nextVertex;
            }
            previewLine = null;
        }
        
        if (currentTool === 'coloredLine' && previewColoredLine) {
            coloredLines.push(previewColoredLine);
            previewColoredLine = null;
        }
        redrawAll();
    }
    
    function handleClick(event) {
        if (isDrawing) return;
        const pos = getMousePos(event);
        
        switch (currentTool) {
            case 'start': 
                startPoint = { vx: Math.round(pos.gridX), vy: Math.round(pos.gridY) };
                codedPath = [startPoint];
                break;
            case 'eye': 
                features.push({type: 'eye', gridX: pos.gridX, gridY: pos.gridY, sizeRatio: 1, rotation: 0, color: featureColorInput.value}); 
                break;
            case 'nose': 
                features.push({type: 'nose', gridX: pos.gridX, gridY: pos.gridY, sizeRatio: 1.2, rotation: 0, color: featureColorInput.value}); 
                break;
            case 'mouth': 
                features.push({type: 'mouth', gridX: pos.gridX, gridY: pos.gridY, sizeRatio: 2, rotation: 0}); 
                break;
            case 'triangle': 
                features.push({
                    type: 'triangle', 
                    gridX: pos.gridX, 
                    gridY: pos.gridY, 
                    sizeRatio: 2, 
                    rotation: 0, 
                    color: featureColorInput.value,
                    isFilled: fillTriangleCheckbox.checked
                }); 
                break;
            case 'move':
                selectedFeature = getFeatureAtPos(pos);
                break;
        }
        redrawAll();
    }
    
    function getFeatureAtPos(pos) {
        for (let i = features.length - 1; i >= 0; i--) {
            const f = features[i];
            const bounds = getFeatureBounds(f);
            
            const featurePixelX = f.gridX * cellSize;
            const featurePixelY = f.gridY * cellSize;

            const dx = pos.x - featurePixelX;
            const dy = pos.y - featurePixelY;
            const rotatedX = dx * Math.cos(-f.rotation) - dy * Math.sin(-f.rotation);
            const rotatedY = dx * Math.sin(-f.rotation) + dy * Math.cos(-f.rotation);

            if (Math.abs(rotatedX) < bounds.w / 2 && Math.abs(rotatedY) < bounds.h / 2) {
                return f;
            }
        }
        return null;
    }

    function getClickedHandle(pos, feature) {
        if (!feature || (feature.type !== 'mouth' && feature.type !== 'triangle')) return null;

        const bounds = getFeatureBounds(feature);
        const handleSize = 10;
        
        const featurePixelX = feature.gridX * cellSize;
        const featurePixelY = feature.gridY * cellSize;

        const dx = pos.x - featurePixelX;
        const dy = pos.y - featurePixelY;
        const localX = dx * Math.cos(-feature.rotation) - dy * Math.sin(-feature.rotation);
        const localY = dx * Math.sin(-feature.rotation) + dy * Math.cos(-feature.rotation);
        
        if (Math.abs(localX - bounds.w / 2) < handleSize/2 || Math.abs(localX + bounds.w / 2) < handleSize/2) {
             if (Math.abs(localY) < handleSize/2) return 'resize';
        }
        if (Math.hypot(localX, localY - (-bounds.h / 2 - 20)) < handleSize) return 'rotate';
        return null;
    }

    // --- GRID MANIPULATIE (ROBUUSTE VERSIE) ---
    function addColumn(atLeft) {
        gridWidth++;
        gridWidthInput.value = gridWidth;
        if (atLeft) {
            codedPath.forEach(p => p.vx++);
            features.forEach(f => f.gridX++);
            freehandLines.forEach(path => path.forEach(p => p.gridX++));
            coloredLines.forEach(l => {
                l.startGridX++;
                l.endGridX++;
            });
        }
        updateCanvasAndRedraw();
    }

    function removeColumn(atLeft) {
        if (gridWidth <= 5) return;
        gridWidth--;
        gridWidthInput.value = gridWidth;
        if (atLeft) {
            codedPath.forEach(p => p.vx--);
            features.forEach(f => f.gridX--);
            freehandLines.forEach(path => path.forEach(p => p.gridX--));
            coloredLines.forEach(l => {
                l.startGridX--;
                l.endGridX--;
            });
        }
        updateCanvasAndRedraw();
    }

    function addRow(atTop) {
        gridHeight++;
        gridHeightInput.value = gridHeight;
        if (atTop) {
            codedPath.forEach(p => p.vy++);
            features.forEach(f => f.gridY++);
            freehandLines.forEach(path => path.forEach(p => p.gridY++));
            coloredLines.forEach(l => {
                l.startGridY++;
                l.endGridY++;
            });
        }
        updateCanvasAndRedraw();
    }

    function removeRow(atTop) {
        if (gridHeight <= 5) return;
        gridHeight--;
        gridHeightInput.value = gridHeight;
        if (atTop) {
            codedPath.forEach(p => p.vy--);
            features.forEach(f => f.gridY--);
            freehandLines.forEach(path => path.forEach(p => p.gridY--));
            coloredLines.forEach(l => {
                l.startGridY--;
                l.endGridY--;
            });
        }
        updateCanvasAndRedraw();
    }

    // --- ACTIES & EXPORT ---
    function undoLastCodeStep() {
        if (codedPath.length > 1) {
            codedPath.pop();
            redrawAll();
            // Werk de code bij als die al gegenereerd was
            if (instructionsOutput.innerHTML !== '') {
                generateCode();
            }
        }
    }

    function generateCode() {
        if (codedPath.length < 2) {
            meldingContainer.textContent = 'Teken eerst een volledige lijn vanaf het startpunt!';
            return;
        }
        const instructions = convertPathToInstructions(codedPath);
        displayOutput(instructions);
        downloadPdfBtn.disabled = false;
    }

    function convertPathToInstructions(path) {
        const directions = [];
        for (let i = 0; i < path.length - 1; i++) {
            directions.push(getDirectionArrow(path[i + 1].vy - path[i].vy, path[i + 1].vx - path[i].vx));
        }
        if (directions.length === 0) return [];
        const instructions = [];
        let count = 1, currentDir = directions[0];
        for (let i = 1; i < directions.length; i++) {
            if (directions[i] === currentDir) {
                count++;
            } else {
                instructions.push({ dir: currentDir, count: count });
                currentDir = directions[i];
                count = 1;
            }
        }
        instructions.push({ dir: currentDir, count: count });
        return instructions;
    }

    function getDirectionArrow(dr, dc) {
        if (dr === -1 && dc === 0) return '⬆️';
        if (dr === 1 && dc === 0) return '⬇️';
        if (dr === 0 && dc === -1) return '⬅️';
        if (dr === 0 && dc === 1) return '➡️';
        if (dr === -1 && dc === 1) return '↗️';
        if (dr === -1 && dc === -1) return '↖️';
        if (dr === 1 && dc === 1) return '↘️';
        if (dr === 1 && dc === -1) return '↙️';
        return '?';
    }

    function displayOutput(instructions) {
        instructionsOutput.innerHTML = instructions.map(instr => `<span>${instr.count} ${instr.dir}</span>`).join('');
        
        worksheetCanvas.width = drawingCanvas.width;
        worksheetCanvas.height = drawingCanvas.height;
        const wsCtx = worksheetCanvas.getContext('2d');
        wsCtx.clearRect(0, 0, worksheetCanvas.width, worksheetCanvas.height);
        
        drawGridLines(wsCtx);
        if (codedPath.length > 0) {
            const currentStartPoint = codedPath[0];
            wsCtx.fillStyle = '#ff0000';
            wsCtx.beginPath();
            wsCtx.arc(currentStartPoint.vx * cellSize, currentStartPoint.vy * cellSize, cellSize / 3.5, 0, Math.PI * 2);
            wsCtx.fill();
        }

        features.forEach(f => drawFeature(wsCtx, f));
        freehandLines.forEach(path => {
            wsCtx.strokeStyle = '#000';
            wsCtx.lineWidth = Math.max(1, cellSize / 10);
            wsCtx.beginPath();
            if (path.length > 0) {
                wsCtx.moveTo(path[0].gridX * cellSize, path[0].gridY * cellSize);
                for (let i = 1; i < path.length; i++) wsCtx.lineTo(path[i].gridX * cellSize, path[i].gridY * cellSize)
            }
            wsCtx.stroke()
        });
        coloredLines.forEach(line => {
            wsCtx.strokeStyle = line.color;
            wsCtx.lineWidth = Math.max(1.5, cellSize / 10);
            wsCtx.beginPath();
            wsCtx.moveTo(line.startGridX * cellSize, line.startGridY * cellSize);
            wsCtx.lineTo(line.endGridX * cellSize, line.endGridY * cellSize);
            wsCtx.stroke();
        });
    }

    function downloadPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageMargin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const contentWidth = pageWidth - (pageMargin * 2);
        let currentY = 20;

        const drawArrow = (doc, x, y, size, direction) => {
            const s = size / 2;
            doc.setLineWidth(0.5);
            doc.setDrawColor(0);
            switch (direction) {
                case '⬆️': doc.line(x, y + s, x, y - s); doc.line(x, y - s, x - s / 2, y - s / 2); doc.line(x, y - s, x + s / 2, y - s / 2); break;
                case '⬇️': doc.line(x, y - s, x, y + s); doc.line(x, y + s, x - s / 2, y + s / 2); doc.line(x, y + s, x + s / 2, y + s / 2); break;
                case '⬅️': doc.line(x + s, y, x - s, y); doc.line(x - s, y, x - s / 2, y - s / 2); doc.line(x - s, y, x - s / 2, y + s / 2); break;
                case '➡️': doc.line(x - s, y, x + s, y); doc.line(x + s, y, x + s / 2, y - s / 2); doc.line(x + s, y, x + s / 2, y + s / 2); break;
                case '↗️': doc.line(x - s*0.7, y + s*0.7, x + s*0.7, y - s*0.7); doc.line(x + s*0.7, y - s*0.7, x + s*0.2, y - s*0.5); doc.line(x + s*0.7, y - s*0.7, x + s*0.5, y - s*0.2); break;
                case '↖️': doc.line(x + s*0.7, y + s*0.7, x - s*0.7, y - s*0.7); doc.line(x - s*0.7, y - s*0.7, x - s*0.2, y - s*0.5); doc.line(x - s*0.7, y - s*0.7, x - s*0.5, y - s*0.2); break;
                case '↘️': doc.line(x - s*0.7, y - s*0.7, x + s*0.7, y + s*0.7); doc.line(x + s*0.7, y + s*0.7, x + s*0.2, y + s*0.5); doc.line(x + s*0.7, y + s*0.7, x + s*0.5, y + s*0.2); break;
                case '↙️': doc.line(x + s*0.7, y - s*0.7, x - s*0.7, y + s*0.7); doc.line(x - s*0.7, y + s*0.7, x - s*0.2, y + s*0.5); doc.line(x - s*0.7, y + s*0.7, x - s*0.5, y + s*0.2); break;
            }
        };

        doc.setFontSize(18);
        doc.text("Code-tekenen Werkblad", pageWidth / 2, currentY, { align: 'center' });
        currentY += 15;

        doc.setFontSize(12);
        doc.text("Code:", pageMargin, currentY);
        currentY += 12;

        let currentX = pageMargin;
        const numberArrowSpacing = 3;
        const itemSpacing = 12;
        const arrowSize = 4;
        const lineHeight = 12;

        instructionsOutput.querySelectorAll('span').forEach(span => {
            const parts = span.textContent.trim().split(' ');
            if (parts.length !== 2) return;
            const count = parts[0];
            const arrowEmoji = parts[1];
            const numberWidth = doc.getTextWidth(count);
            const currentItemWidth = numberWidth + numberArrowSpacing + arrowSize + itemSpacing;

            if (currentX + currentItemWidth > pageWidth - pageMargin) {
                currentX = pageMargin;
                currentY += lineHeight;
            }
            
            doc.text(count, currentX, currentY, { baseline: 'middle' });
            currentX += numberWidth + numberArrowSpacing;
            drawArrow(doc, currentX, currentY, arrowSize, arrowEmoji);
            currentX += itemSpacing;
        });
        currentY += lineHeight + 5;

        try {
            const imageData = worksheetCanvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imageData);
            const imgRatio = imgProps.height / imgProps.width;
            const imgWidth = contentWidth;
            const imgHeight = imgWidth * imgRatio;

            if (currentY + imgHeight > doc.internal.pageSize.getHeight() - pageMargin) {
                doc.addPage();
                currentY = pageMargin;
            }
            doc.addImage(imageData, 'PNG', pageMargin, currentY, imgWidth, imgHeight);
        } catch (e) {
            console.error("Fout bij toevoegen van canvas aan PDF:", e);
            doc.text("Fout: Kon de tekening niet toevoegen.", pageMargin, currentY);
        }
        
        doc.save('code-tekenen-werkblad.pdf');
    }

    // --- BESTANDSBEHEER ---
    function saveDrawing() {
        const drawingData = { gridWidth, gridHeight, codedPath, features, freehandLines, coloredLines };
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(drawingData)], { type: 'application/json' }));
        a.download = 'tekening.json';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function loadDrawing(data) {
        resetDrawing();
        gridWidth = parseInt(data.gridWidth);
        gridHeight = parseInt(data.gridHeight);
        gridWidthInput.value = gridWidth;
        gridHeightInput.value = gridHeight;
        
        updateCanvasAndRedraw();

        codedPath = data.codedPath || [];
        startPoint = codedPath.length > 0 ? codedPath[0] : null;
        features = data.features || [];
        freehandLines = data.freehandLines || [];
        coloredLines = data.coloredLines || [];
        
        const needsConversion = (features.length > 0 && features[0].x !== undefined) ||
                                (coloredLines.length > 0 && coloredLines[0].startX !== undefined) ||
                                (freehandLines.length > 0 && freehandLines[0].length > 0 && freehandLines[0][0].x !== undefined);

        if (needsConversion) {
            meldingContainer.textContent = "Let op: oud tekening-formaat geladen. Conversie wordt uitgevoerd.";
            const tempCanvasWidth = gridWidth * cellSize;
            const tempCanvasHeight = gridHeight * cellSize;

            features.forEach(f => {
                if (f.x !== undefined) {
                    f.gridX = f.x / tempCanvasWidth * gridWidth;
                    f.gridY = f.y / tempCanvasHeight * gridHeight;
                    f.sizeRatio = (f.radius || f.width || f.size || cellSize) / cellSize;
                    if (f.isFilled === undefined) f.isFilled = false;
                    delete f.x; delete f.y; delete f.radius; delete f.width; delete f.size;
                }
            });

            coloredLines.forEach(line => {
                if (line.startX !== undefined) {
                    line.startGridX = line.startX / tempCanvasWidth * gridWidth;
                    line.startGridY = line.startY / tempCanvasHeight * gridHeight;
                    line.endGridX = line.endX / tempCanvasWidth * gridWidth;
                    line.endGridY = line.endY / tempCanvasHeight * gridHeight;
                    delete line.startX; delete line.startY; delete line.endX; delete line.endY;
                }
            });

            freehandLines.forEach(path => {
                path.forEach(p => {
                    if (p.x !== undefined) {
                        p.gridX = p.x / tempCanvasWidth * gridWidth;
                        p.gridY = p.y / tempCanvasHeight * gridHeight;
                        delete p.x; delete p.y;
                    }
                });
            });
        }
        
        redrawAll();
    }

    function handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                loadDrawing(data);
            } catch (err) {
                meldingContainer.textContent = "Fout bij laden: " + err.message;
            }
        };
        reader.readAsText(file);
    }

    async function openCatalog() {
        if (Object.keys(catalogData).length === 0) {
            try {
                const response = await fetch('coderen_afbeeldingen/catalog.json');
                if (!response.ok) throw new Error('catalog.json niet gevonden!');
                catalogData = await response.json();
            } catch (error) {
                meldingContainer.textContent = error.message;
                return;
            }
        }
        showThemes();
        catalogModal.style.display = 'block';
    }

    function closeCatalog() {
        catalogModal.style.display = 'none';
    }

    function showThemes() {
        themesContainer.innerHTML = '';
        choicesContainer.style.display = 'none';
        themesContainer.style.display = 'grid';
        backToThemesBtn.style.display = 'none';
        modalTitle.textContent = 'Catalogus';
        for (const theme in catalogData) {
            const themeBtn = document.createElement('button');
            themeBtn.className = 'catalog-theme-button';
            themeBtn.innerHTML = `<span>${theme}</span>`;
            themeBtn.onclick = () => displayChoices(theme);
            themesContainer.appendChild(themeBtn);
        }
    }

    function displayChoices(theme) {
        choicesContainer.innerHTML = '';
        themesContainer.style.display = 'none';
        choicesContainer.style.display = 'grid';
        backToThemesBtn.style.display = 'block';
        modalTitle.textContent = theme;
        const choices = catalogData[theme];
        choices.forEach(choice => {
            const choiceBtn = document.createElement('button');
            choiceBtn.className = 'catalog-choice-button';
            choiceBtn.innerHTML = `
                <img src="${choice.image}" alt="${choice.name}">
                <span>${choice.name}</span>
            `;
            choiceBtn.onclick = () => loadChoice(choice.json);
            choicesContainer.appendChild(choiceBtn);
        });
    }

    async function loadChoice(jsonPath) {
        if (!jsonPath) {
            meldingContainer.textContent = "Dit item heeft geen tekeningbestand.";
            return;
        }
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) throw new Error(`Bestand ${jsonPath} niet gevonden!`);
            const data = await response.json();
            loadDrawing(data);
            closeCatalog();
        } catch (error) {
            meldingContainer.textContent = error.message;
        }
    }

    // --- EVENT LISTENERS ---
    resetGridBtn.addEventListener('click', initializeGrid);
    clearBtn.addEventListener('click', resetDrawing);
    addColLeftBtn.addEventListener('click', () => addColumn(true));
    addColRightBtn.addEventListener('click', () => addColumn(false));
    removeColLeftBtn.addEventListener('click', () => removeColumn(true));
    removeColRightBtn.addEventListener('click', () => removeColumn(false));
    addRowTopBtn.addEventListener('click', () => addRow(true));
    addRowBottomBtn.addEventListener('click', () => addRow(false));
    removeRowTopBtn.addEventListener('click', () => removeRow(true));
    removeRowBottomBtn.addEventListener('click', () => removeRow(false));
    generateBtn.addEventListener('click', generateCode);
    downloadPdfBtn.addEventListener('click', downloadPdf);
    undoCodeBtn.addEventListener('click', undoLastCodeStep);

    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toolBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            currentTool = btn.dataset.tool;
            drawingCanvas.classList.toggle('eraser-cursor', currentTool === 'eraser');
            drawingCanvas.classList.toggle('move-cursor', currentTool === 'move');
            selectedFeature = null;
            redrawAll();
        });
    });

    drawingCanvas.addEventListener('mousedown', handleMouseDown);
    drawingCanvas.addEventListener('mousemove', handleMouseMove);
    drawingCanvas.addEventListener('mouseup', handleMouseUp);
    drawingCanvas.addEventListener('click', handleClick);

    saveDrawingBtn.addEventListener('click', saveDrawing);
    loadDrawingBtn.addEventListener('click', () => loadDrawingInput.click());
    loadDrawingInput.addEventListener('change', handleFileLoad);

    catalogBtn.addEventListener('click', openCatalog);
    closeModalBtn.addEventListener('click', closeCatalog);
    backToThemesBtn.addEventListener('click', showThemes);
    window.addEventListener('click', (e) => {
        if (e.target == catalogModal) {
            closeCatalog();
        }
    });
    
    window.addEventListener('keydown', (e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFeature) {
            features = features.filter(f => f !== selectedFeature);
            selectedFeature = null;
            redrawAll();
        }
    });

    // Initialisatie bij laden van de pagina
    initializeGrid();
});