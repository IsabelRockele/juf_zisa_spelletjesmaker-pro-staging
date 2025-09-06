document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTEN KOPPELEN ---
    const uploadBtn = document.getElementById('uploadImageBtn');
    const fileInput = document.getElementById('fileInput');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const undoBtn = document.getElementById('undoBtn');
    const opnieuwBtn = document.getElementById('opnieuwBtn');

    const canvasOrigineel = document.getElementById('canvasOrigineel');
    const ctxOrigineel = canvasOrigineel.getContext('2d', { willReadFrequently: true });
    const canvasVerschillen = document.getElementById('canvasVerschillen');
    const ctxVerschillen = canvasVerschillen.getContext('2d', { willReadFrequently: true });

    const statusText = document.getElementById('status-text');

    // Tools
    const toolButtons = document.querySelectorAll('.tool-btn');
    const selectionToolsDiv = document.getElementById('selection-tools');
    const dikteInput = document.getElementById('dikte');
    const gumvormSelect = document.getElementById('gumvorm');
    const gumSettingsDiv = document.getElementById('gum-settings');
    const colorDisplay = document.getElementById('color-display');

    // Modal
    const editModalOverlay = document.getElementById('edit-modal-overlay');
    const editCanvas = document.getElementById('editCanvas');
    const ctxEdit = editCanvas.getContext('2d', { willReadFrequently: true });
    const saveEditBtn = document.getElementById('saveEditBtn');
    const editFlipHorizontalBtn = document.getElementById('editFlipHorizontalBtn');
    const editFlipVerticalBtn = document.getElementById('editFlipVerticalBtn');
    const editUndoBtn = document.getElementById('editUndoBtn');
    const transparentBgCheckbox = document.getElementById('transparentBgCheckbox');

    // Clipboard
    const clipboardPreviewContainer = document.getElementById('clipboard-preview-container');
    const clipboardCanvas = document.getElementById('clipboardCanvas');
    const ctxClipboard = clipboardCanvas.getContext('2d');
    // NIEUW: Koppel de plakken knop
    const plakkenBtn = document.getElementById('plakkenBtn');


    // --- STATE VARIABELEN ---
    let originalImage = null;
    let currentTool = 'potlood';
    let isDrawing = false;
    let startX, startY;
    let currentColor = '#000000';

    let selectionRect = null;
    let undoStack = [];
    let editUndoStack = [];
    const MAX_UNDO_STATES = 20;

    let transformableObject = null;
    // NIEUW: Apart object voor het klembord
    let clipboardObject = null; 
    let isPlacingNewObject = false;
    
    let transformAction = 'none'; 
    let dragStart = { x: 0, y: 0 };


    // --- INIT ---
    updateColorDisplay();


    // --- EVENT LISTENERS ---
    uploadBtn.addEventListener('click', () => fileInput.click());
    opnieuwBtn.addEventListener('click', resetApplication);
    fileInput.addEventListener('change', handleImageUpload);
    downloadPngBtn.addEventListener('click', () => downloadPuzzel('png'));
    downloadPdfBtn.addEventListener('click', () => downloadPuzzel('pdf'));
    undoBtn.addEventListener('click', doUndo);

    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            stampTransformableObject();
            document.querySelector('.tool-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            gumSettingsDiv.style.display = (currentTool === 'gum') ? 'flex' : 'none';
            canvasVerschillen.style.cursor = getCursorForTool(currentTool);
        });
    });

    // AANGEPAST: De 'save' knop in de modal slaat nu op naar het klembord.
    saveEditBtn.addEventListener('click', saveSelectionToClipboard);
    editUndoBtn.addEventListener('click', doEditUndo);
    editFlipHorizontalBtn.addEventListener('click', () => { transformEditCanvas(-1, 1); saveEditState(); });
    editFlipVerticalBtn.addEventListener('click', () => { transformEditCanvas(1, -1); saveEditState(); });

    editCanvas.addEventListener('mousedown', () => isDrawing = true);
    editCanvas.addEventListener('mouseup', () => { if(isDrawing) { saveEditState(); isDrawing = false; } });
    editCanvas.addEventListener('mouseleave', () => { if(isDrawing) { saveEditState(); isDrawing = false; } });
    editCanvas.addEventListener('mousemove', (e) => { if (e.buttons === 1) eraseOnEditCanvas(e); });

    canvasVerschillen.addEventListener('mousedown', startAction);
    canvasVerschillen.addEventListener('mousemove', moveAction);
    canvasVerschillen.addEventListener('mouseup', endAction);
    canvasVerschillen.addEventListener('mouseleave', (e) => {
        if (isDrawing || transformAction !== 'none' || isPlacingNewObject) {
            endAction(e);
        }
    });

    canvasVerschillen.addEventListener('mousemove', handleCursorUpdate);
    
    // NIEUW: Event listener voor de plakken knop
    plakkenBtn.addEventListener('click', pasteFromClipboard);


    // --- FUNCTIES ---

    function updateColorDisplay() {
        colorDisplay.style.backgroundColor = currentColor;
    }
    
    function componentToHex(c) {
        const hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    function resetApplication() {
        ctxOrigineel.clearRect(0, 0, canvasOrigineel.width, canvasOrigineel.height);
        ctxVerschillen.clearRect(0, 0, canvasVerschillen.width, canvasVerschillen.height);
        originalImage = null; undoStack = []; selectionRect = null;
        isDrawing = false; transformableObject = null; clipboardObject = null;
        isPlacingNewObject = false; transformAction = 'none';
        currentColor = '#000000'; updateColorDisplay();
        statusText.textContent = 'Upload een afbeelding om te beginnen.';
        undoBtn.disabled = true; downloadPngBtn.disabled = true; downloadPdfBtn.disabled = true;
        selectionToolsDiv.style.display = 'none';
        plakkenBtn.disabled = true;
        clipboardPreviewContainer.classList.add('hidden');
        fileInput.value = '';
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage = new Image();
            originalImage.onload = () => {
                const aspectRatio = originalImage.width / originalImage.height;
                const canvasWidth = 400;
                const canvasHeight = canvasWidth / aspectRatio;
                canvasOrigineel.width = canvasVerschillen.width = canvasWidth;
                canvasOrigineel.height = canvasVerschillen.height = canvasHeight;
                ctxOrigineel.drawImage(originalImage, 0, 0, canvasWidth, canvasHeight);
                ctxVerschillen.drawImage(originalImage, 0, 0, canvasWidth, canvasHeight);
                resetApplicationStateAfterUpload();
                statusText.textContent = 'Afbeelding geladen. Kies een tool om te beginnen.';
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function resetApplicationStateAfterUpload() {
        undoStack = []; saveState();
        undoBtn.disabled = true;
        downloadPngBtn.disabled = false;
        downloadPdfBtn.disabled = false;
        transformableObject = null; clipboardObject = null; transformAction = 'none';
        selectionToolsDiv.style.display = 'none';
        plakkenBtn.disabled = true;
        clipboardPreviewContainer.classList.add('hidden');
    }

    function getCursorForTool(tool) {
        switch (tool) {
            case 'potlood': return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath fill='black' stroke='white' stroke-width='1.5' d='M26.75 5.25L22.75 1.25C22.5 1 22.25 1 22 1.25L19 4.25L23.75 9L26.75 6C27 5.75 27 5.5 26.75 5.25Z'/%3E%3Cpath fill='black' stroke='white' stroke-width='1' d='M18.25 5L3.25 20C3 20.25 3 20.5 3.25 20.75L7.25 24.75C7.5 25 7.75 25 8 24.75L23 9.75L18.25 5Z'/%3E%3Cpath fill='rgba(0,0,0,0.5)' d='M3.25 20L8 24.75L7.25 21.5L3.25 20Z'/%3E%3C/svg%3E") 4 24, auto`;
            case 'cirkel': case 'rechthoek': case 'lijn': return 'crosshair';
            case 'gum': return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'%3E%3Ccircle cx='9' cy='9' r='7' fill='none' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E") 9 9, auto`;
            case 'pipet': case 'opvulemmer': return 'crosshair';
            default: return 'default';
        }
    }
    
    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }
    
    function getTransformHandles(obj) {
        const w = obj.width * obj.scale;
        const h = obj.height * obj.scale;
        const halfW = w / 2;
        const halfH = h / 2;
        const corners = [
            { x: -halfW, y: -halfH }, { x: halfW, y: -halfH },
            { x: halfW, y: halfH }, { x: -halfW, y: halfH }
        ].map(p => {
            const rotatedX = p.x * Math.cos(obj.rotation) - p.y * Math.sin(obj.rotation);
            const rotatedY = p.x * Math.sin(obj.rotation) + p.y * Math.cos(obj.rotation);
            return { x: rotatedX + obj.x, y: rotatedY + obj.y };
        });
        const rotationHandle = {
            x: -Math.sin(obj.rotation) * (halfH + 20) + obj.x,
            y: Math.cos(obj.rotation) * (halfH + 20) + obj.y,
        };
        return { corners, rotationHandle };
    }

    function drawTransformableObject() {
        if (!transformableObject || transformableObject.x < 0) return;
        const { type, x, y, scale, rotation, width, height, imageData, color, thickness } = transformableObject;
        
        ctxVerschillen.save();
        ctxVerschillen.translate(x, y);
        ctxVerschillen.rotate(rotation);
        ctxVerschillen.scale(scale, scale);

        setDrawingStyle();
        ctxVerschillen.strokeStyle = color || currentColor;
        ctxVerschillen.lineWidth = thickness || dikteInput.value;

        switch (type) {
            case 'imageData':
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = width;
                tempCanvas.height = height;
                tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
                ctxVerschillen.drawImage(tempCanvas, -width / 2, -height / 2, width, height);
                break;
            case 'rechthoek':
                ctxVerschillen.strokeRect(-width / 2, -height / 2, width, height);
                break;
            case 'cirkel':
                ctxVerschillen.beginPath();
                ctxVerschillen.arc(0, 0, width / 2, 0, 2 * Math.PI);
                ctxVerschillen.stroke();
                break;
            case 'lijn':
                 ctxVerschillen.beginPath();
                 ctxVerschillen.moveTo(-width / 2, 0);
                 ctxVerschillen.lineTo(width / 2, 0);
                 ctxVerschillen.stroke();
                break;
        }
        ctxVerschillen.restore();
    }


    function drawTransformHandles() {
        if (!transformableObject || transformableObject.x < 0) return;
        const handles = getTransformHandles(transformableObject);
        ctxVerschillen.save();
        ctxVerschillen.strokeStyle = '#007bff';
        ctxVerschillen.fillStyle = 'white';
        ctxVerschillen.lineWidth = 1;
        ctxVerschillen.beginPath();
        ctxVerschillen.moveTo(handles.corners[0].x, handles.corners[0].y);
        for (let i = 1; i < handles.corners.length; i++) {
            ctxVerschillen.lineTo(handles.corners[i].x, handles.corners[i].y);
        }
        ctxVerschillen.closePath();
        ctxVerschillen.stroke();
        ctxVerschillen.beginPath();
        const topMidX = (handles.corners[0].x + handles.corners[1].x) / 2;
        const topMidY = (handles.corners[0].y + handles.corners[1].y) / 2;
        ctxVerschillen.moveTo(topMidX, topMidY);
        ctxVerschillen.lineTo(handles.rotationHandle.x, handles.rotationHandle.y);
        ctxVerschillen.stroke();
        handles.corners.forEach(p => {
            ctxVerschillen.fillRect(p.x - 4, p.y - 4, 8, 8);
            ctxVerschillen.strokeRect(p.x - 4, p.y - 4, 8, 8);
        });
        ctxVerschillen.beginPath();
        ctxVerschillen.arc(handles.rotationHandle.x, handles.rotationHandle.y, 5, 0, 2 * Math.PI);
        ctxVerschillen.fill();
        ctxVerschillen.stroke();
        ctxVerschillen.restore();
    }

    function getActionForPoint(pos) {
        if (!transformableObject || transformableObject.x < 0) return 'none';
        const handles = getTransformHandles(transformableObject);
        if (Math.hypot(pos.x - handles.rotationHandle.x, pos.y - handles.rotationHandle.y) < 10) return 'rotate';
        for(let i=0; i<handles.corners.length; i++) {
            if (Math.hypot(pos.x - handles.corners[i].x, pos.y - handles.corners[i].y) < 10) return 'scale';
        }
        let inside = false;
        for (let i = 0, j = handles.corners.length - 1; i < handles.corners.length; j = i++) {
            const xi = handles.corners[i].x, yi = handles.corners[i].y;
            const xj = handles.corners[j].x, yj = handles.corners[j].y;
            const intersect = ((yi > pos.y) !== (yj > pos.y)) && (pos.x < (xj - xi) * (pos.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        if (inside) return 'move';
        return 'none';
    }
    
    function handleCursorUpdate(e) {
        if (transformAction !== 'none' || isDrawing || isPlacingNewObject) return;
        const pos = getMousePos(canvasVerschillen, e);
        const action = getActionForPoint(pos);
        switch(action) {
            case 'move': canvasVerschillen.style.cursor = 'move'; break;
            case 'scale': canvasVerschillen.style.cursor = 'nwse-resize'; break;
            case 'rotate': canvasVerschillen.style.cursor = `url('data:image/svg+xml;charset=utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Cpath d="M24.73,12.24a1,1,0,0,0-1.41,0l-2,2a1,1,0,0,0,1.41,1.41l2-2A1,1,0,0,0,24.73,12.24Z" fill="%23000000"/%3E%3Cpath d="M16.5,2A10.5,10.5,0,0,0,6.23,19.34l-1.35-1.35a1,1,0,0,0-1.41,1.41l3.09,3.09a1,1,0,0,0,.7.29h.1a1,1,0,0,0,.71-.29l3.09-3.09a1,1,0,0,0-1.41-1.41L8.23,19.1A8.5,8.5,0,1,1,16.5,28.5a1,1,0,0,0,0,2,10.5,10.5,0,0,0,0-21Z" fill="%23000000"/%3E%3C/svg%3E') 16 16, auto`; break;
            default: canvasVerschillen.style.cursor = getCursorForTool(currentTool);
        }
    }
    
    function redrawCanvasWithTransformableObject() {
        if (!transformableObject) return;
        restoreState(undoStack[undoStack.length - 1]);
        drawTransformableObject();
        if (transformableObject.x > -1) {
            drawTransformHandles();
        }
    }

    function stampTransformableObject() {
        if (!transformableObject || transformableObject.x < 0) return;
        restoreState(undoStack[undoStack.length - 1]);
        drawTransformableObject();
        transformableObject = null;
        transformAction = 'none';
        saveState();
        statusText.textContent = 'Object vastgezet.';
        canvasVerschillen.style.cursor = 'default';
    }

    function startAction(e) {
        const pos = getMousePos(canvasVerschillen, e);
        transformAction = getActionForPoint(pos);
        if (transformAction !== 'none') {
            dragStart = pos; return;
        }
        
        stampTransformableObject();
        if (!originalImage) return;

        if (currentTool === 'pipet') {
            const p = ctxVerschillen.getImageData(pos.x, pos.y, 1, 1).data;
            currentColor = rgbToHex(p[0], p[1], p[2]);
            updateColorDisplay();
            document.querySelector('.tool-btn[data-tool="potlood"]').click();
            return;
        }
        
        if (currentTool === 'opvulemmer') {
            floodFill(pos.x, pos.y);
            saveState();
            return;
        }

        isDrawing = true;
        startX = pos.x;
        startY = pos.y;
        
        if (['potlood', 'gum'].includes(currentTool)) {
            saveState();
        }
    }

    function moveAction(e) {
        if (isPlacingNewObject && transformableObject) {
            const pos = getMousePos(canvasVerschillen, e);
            transformableObject.x = pos.x;
            transformableObject.y = pos.y;
            redrawCanvasWithTransformableObject();
            return;
        }
        if (transformAction !== 'none' && transformableObject) {
            const pos = getMousePos(canvasVerschillen, e);
            if (transformAction === 'move') {
                transformableObject.x += pos.x - dragStart.x;
                transformableObject.y += pos.y - dragStart.y;
            } else if (transformAction === 'rotate') {
                const angle = Math.atan2(pos.y - transformableObject.y, pos.x - transformableObject.x);
                const startAngle = Math.atan2(dragStart.y - transformableObject.y, dragStart.x - transformableObject.x);
                transformableObject.rotation += angle - startAngle;
            } else if (transformAction === 'scale') {
                const dist = Math.hypot(pos.x - transformableObject.x, pos.y - transformableObject.y);
                const startDist = Math.hypot(dragStart.x - transformableObject.x, dragStart.y - transformableObject.y);
                if (startDist > 0) transformableObject.scale *= dist / startDist;
            }
            dragStart = pos;
            redrawCanvasWithTransformableObject();
            return;
        }

        if (!isDrawing) return;
        const pos = getMousePos(canvasVerschillen, e);
        
        if (['lijn', 'rechthoek', 'cirkel', 'select'].includes(currentTool)) {
            restoreState(undoStack[undoStack.length - 1]);
        }

        setDrawingStyle();
        switch (currentTool) {
            case 'potlood': draw(pos.x, pos.y); startX = pos.x; startY = pos.y; break;
            case 'gum': erase(pos.x, pos.y); break;
            case 'select': drawSelectionRectangle(pos.x, pos.y); break;
            case 'lijn': drawLine(pos.x, pos.y); break;
            case 'rechthoek': drawRectangle(pos.x, pos.y); break;
            case 'cirkel': drawCircle(pos.x, pos.y); break;
        }
    }

    function endAction(e) {
        if (isPlacingNewObject && transformableObject) {
            isPlacingNewObject = false;
            statusText.textContent = 'Object geplaatst. Verplaats, roteer of schaal het. Klik ernaast om vast te zetten.';
            handleCursorUpdate(e);
            return;
        }
        if (transformAction !== 'none') {
            transformAction = 'none';
            return;
        }
        if (!isDrawing) return;
        isDrawing = false;
        
        const pos = getMousePos(canvasVerschillen, e);
        
        if (['potlood', 'gum'].includes(currentTool)) {
            undoStack.pop();
            saveState();
        } else if (['lijn', 'rechthoek', 'cirkel'].includes(currentTool)) {
            restoreState(undoStack[undoStack.length - 1]);
            const endX = pos.x, endY = pos.y;
            const centerX = (startX + endX) / 2;
            const centerY = (startY + endY) / 2;
            let width = Math.abs(startX - endX);
            let height = Math.abs(startY - endY);

            transformableObject = {
                type: currentTool,
                x: centerX,
                y: centerY,
                scale: 1,
                color: currentColor,
                thickness: dikteInput.value,
            };

            if (currentTool === 'lijn') {
                transformableObject.width = Math.hypot(endX - startX, endY - startY);
                transformableObject.height = parseFloat(dikteInput.value);
                transformableObject.rotation = Math.atan2(endY - startY, endX - startX);
            } else if (currentTool === 'rechthoek') {
                transformableObject.width = width;
                transformableObject.height = height;
                transformableObject.rotation = 0;
            } else if (currentTool === 'cirkel') {
                const radius = Math.hypot(endX - startX, endY - startY) / 2;
                transformableObject.x = startX + (endX - startX) / 2;
                transformableObject.y = startY + (endY - startY) / 2;
                transformableObject.width = radius * 2;
                transformableObject.height = radius * 2;
                transformableObject.rotation = 0;
            }
            
            saveState();
            redrawCanvasWithTransformableObject();
            statusText.textContent = 'Vorm geplaatst. Verplaats, roteer of schaal. Klik ernaast om vast te zetten.';

        } else if (currentTool === 'select') {
             restoreState(undoStack[undoStack.length - 1]);
            if (selectionRect && selectionRect.width > 1 && selectionRect.height > 1) {
                openEditModalWithSelection();
            }
            selectionRect = null;
        }
    }

    function setDrawingStyle() {
        ctxVerschillen.strokeStyle = currentColor;
        ctxVerschillen.fillStyle = currentColor;
        ctxVerschillen.lineWidth = dikteInput.value;
        ctxVerschillen.lineCap = 'round';
        ctxVerschillen.lineJoin = 'round';
    }
    
    function draw(x, y) { ctxVerschillen.beginPath(); ctxVerschillen.moveTo(startX, startY); ctxVerschillen.lineTo(x, y); ctxVerschillen.stroke(); }

    function erase(x, y) {
        const size = parseFloat(dikteInput.value);
        const halfSize = size / 2;
        const shape = gumvormSelect.value;
        ctxVerschillen.save();
        ctxVerschillen.fillStyle = 'white';
        ctxVerschillen.beginPath();
        if (shape === 'rond') {
            ctxVerschillen.arc(x, y, halfSize, 0, Math.PI * 2);
        } else {
            ctxVerschillen.rect(x - halfSize, y - halfSize, size, size);
        }
        ctxVerschillen.fill();
        ctxVerschillen.restore();
    }
    
    function drawLine(endX, endY) { ctxVerschillen.beginPath(); ctxVerschillen.moveTo(startX, startY); ctxVerschillen.lineTo(endX, endY); ctxVerschillen.stroke(); }
    function drawRectangle(endX, endY) { ctxVerschillen.strokeRect(startX, startY, endX - startX, endY - startY); }
    function drawCircle(endX, endY) { const radius = Math.hypot(endX - startX, endY - startY) / 2; ctxVerschillen.beginPath(); ctxVerschillen.arc(startX + (endX - startX) / 2, startY + (endY - startY) / 2, radius, 0, 2 * Math.PI); ctxVerschillen.stroke(); }
    function drawSelectionRectangle(endX, endY) { selectionRect = { x: Math.min(startX, endX), y: Math.min(startY, endY), width: Math.abs(startX - endX), height: Math.abs(startY - endY) }; ctxVerschillen.save(); ctxVerschillen.strokeStyle = '#555'; ctxVerschillen.lineWidth = 1; ctxVerschillen.setLineDash([5, 5]); ctxVerschillen.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height); ctxVerschillen.restore(); }

    function floodFill(startX, startY) {
        const w = canvasVerschillen.width;
        const h = canvasVerschillen.height;
        const imageData = ctxVerschillen.getImageData(0, 0, w, h);
        const data = imageData.data;
        const stack = [[Math.floor(startX), Math.floor(startY)]];
        const startPos = (Math.floor(startY) * w + Math.floor(startX)) * 4;
        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];
        const fillR = parseInt(currentColor.slice(1, 3), 16);
        const fillG = parseInt(currentColor.slice(3, 5), 16);
        const fillB = parseInt(currentColor.slice(5, 7), 16);
        const tolerance = 45;

        if (Math.abs(startR - fillR) < 5 && Math.abs(startG - fillG) < 5 && Math.abs(startB - fillB) < 5) {
            return;
        }

        const visited = new Uint8Array(w * h);
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const index = y * w + x;
            if (visited[index]) {
                continue;
            }
            const currentPos = index * 4;
            if (Math.abs(data[currentPos] - startR) <= tolerance &&
                Math.abs(data[currentPos + 1] - startG) <= tolerance &&
                Math.abs(data[currentPos + 2] - startB) <= tolerance) {
                data[currentPos] = fillR;
                data[currentPos + 1] = fillG;
                data[currentPos + 2] = fillB;
                data[currentPos + 3] = 255;
                visited[index] = 1;
                if (x > 0) stack.push([x - 1, y]);
                if (x < w - 1) stack.push([x + 1, y]);
                if (y > 0) stack.push([x, y - 1]);
                if (y < h - 1) stack.push([x, y + 1]);
            }
        }
        ctxVerschillen.putImageData(imageData, 0, 0);
    }

    function openEditModalWithSelection() {
        if (selectionRect && selectionRect.width > 0 && selectionRect.height > 0) {
            let imageData = ctxVerschillen.getImageData(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
            editCanvas.width = selectionRect.width; editCanvas.height = selectionRect.height;
            ctxEdit.putImageData(imageData, 0, 0);
            editUndoStack = []; saveEditState();
            editModalOverlay.classList.remove('hidden');
            statusText.textContent = 'Bewerk de selectie in de pop-up.';
        }
    }

    function eraseOnEditCanvas(e) {
        const rect = editCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctxEdit.clearRect(x - 5, y - 5, 10, 10);
    }

    // AANGEPAST: Deze functie slaat nu op naar een apart klembord-object.
    function saveSelectionToClipboard() {
        let editedImageData = ctxEdit.getImageData(0, 0, editCanvas.width, editCanvas.height);
        if (transparentBgCheckbox.checked) {
            const data = editedImageData.data;
            const bgR = data[0], bgG = data[1], bgB = data[2];
            const tolerance = 10;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2];
                if (Math.abs(r - bgR) < tolerance && Math.abs(g - bgG) < tolerance && Math.abs(b - bgB) < tolerance) {
                    data[i + 3] = 0;
                }
            }
        }
        transparentBgCheckbox.checked = false;
        editModalOverlay.classList.add('hidden');
        clipboardCanvas.width = editedImageData.width; clipboardCanvas.height = editedImageData.height;
        ctxClipboard.putImageData(editedImageData, 0, 0);
        
        selectionToolsDiv.style.display = 'flex';
        clipboardPreviewContainer.classList.remove('hidden');
        plakkenBtn.disabled = false;
        
        clipboardObject = { 
            type: 'imageData',
            imageData: editedImageData, 
            width: editedImageData.width, 
            height: editedImageData.height
        };
        statusText.textContent = 'Selectie opgeslagen op klembord. Klik op "Plakken" om het in de afbeelding te plaatsen.';
    }

    // NIEUW: Functie om het object van het klembord op de canvas te plakken.
    function pasteFromClipboard() {
        if (!clipboardObject) return;

        // Zet een eventueel al actief object eerst vast.
        stampTransformableObject();

        transformableObject = {
            ...clipboardObject, // Kopieer data van klembord
            x: canvasVerschillen.width / 2, // Start in het midden
            y: canvasVerschillen.height / 2,
            scale: 1,
            rotation: 0
        };

        saveState(); // Sla staat op voor de 'plak' actie
        redrawCanvasWithTransformableObject();
        statusText.textContent = 'Object geplakt. Verplaats, roteer of schaal het. Klik ernaast om vast te zetten.';
    }

    function transformEditCanvas(scaleX, scaleY) {
        const imageData = ctxEdit.getImageData(0, 0, editCanvas.width, editCanvas.height);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = editCanvas.width; tempCanvas.height = editCanvas.height;
        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
        ctxEdit.clearRect(0, 0, editCanvas.width, editCanvas.height);
        ctxEdit.save();
        ctxEdit.translate(scaleX === -1 ? editCanvas.width : 0, scaleY === -1 ? editCanvas.height : 0);
        ctxEdit.scale(scaleX, scaleY);
        ctxEdit.drawImage(tempCanvas, 0, 0);
        ctxEdit.restore();
    }

    function saveState() {
        if (undoStack.length >= MAX_UNDO_STATES) { undoStack.shift(); }
        undoStack.push(ctxVerschillen.getImageData(0, 0, canvasVerschillen.width, canvasVerschillen.height));
        undoBtn.disabled = undoStack.length <= 1;
    }

    function restoreState(imageData) { if (imageData) { ctxVerschillen.putImageData(imageData, 0, 0); } }

    function doUndo() {
        transformableObject = null; transformAction = 'none';
        if (undoStack.length > 1) {
            undoStack.pop();
            const prevState = undoStack[undoStack.length - 1];
            restoreState(prevState);
            undoBtn.disabled = undoStack.length <= 1;
            statusText.textContent = 'Laatste actie ongedaan gemaakt.';
        }
    }

    function saveEditState() {
        if (editUndoStack.length >= MAX_UNDO_STATES) { editUndoStack.shift(); }
        editUndoStack.push(ctxEdit.getImageData(0, 0, editCanvas.width, editCanvas.height));
        editUndoBtn.disabled = editUndoStack.length <= 1;
    }

    function restoreEditState(imageData) {
        if (imageData) {
            ctxEdit.putImageData(imageData, 0, 0);
        }
    }

    function doEditUndo() {
        if (editUndoStack.length > 1) {
            editUndoStack.pop();
            restoreEditState(editUndoStack[editUndoStack.length - 1]);
            editUndoBtn.disabled = editUndoStack.length <= 1;
        }
    }

    function downloadPuzzel(format) {
        stampTransformableObject();
        if (format === 'pdf') {
            const { jsPDF } = window.jspdf;
            const gap = 40, borderWidth = 4;
            const sourceCanvas = document.createElement('canvas');
            const sourceCtx = sourceCanvas.getContext('2d');
            sourceCanvas.width = canvasOrigineel.width; sourceCanvas.height = (canvasOrigineel.height * 2) + gap;
            sourceCtx.fillStyle = 'white';
            sourceCtx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
            sourceCtx.drawImage(canvasOrigineel, 0, 0);
            sourceCtx.drawImage(canvasVerschillen, 0, canvasOrigineel.height + gap);
            sourceCtx.strokeStyle = '#004080';
            sourceCtx.lineWidth = borderWidth;
            sourceCtx.strokeRect(borderWidth / 2, borderWidth / 2, sourceCanvas.width - borderWidth, canvasOrigineel.height - borderWidth);
            sourceCtx.strokeRect(borderWidth / 2, canvasOrigineel.height + gap + (borderWidth / 2), sourceCanvas.width - borderWidth, canvasOrigineel.height - borderWidth);
            const dataURL = sourceCanvas.toDataURL('image/png');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            const a4Width = 595.28, a4Height = 841.89, margin = 40;
            const availableWidth = a4Width - (margin * 2), availableHeight = a4Height - (margin * 2);
            const scale = Math.min(availableWidth / sourceCanvas.width, availableHeight / sourceCanvas.height);
            const imgWidth = sourceCanvas.width * scale, imgHeight = sourceCanvas.height * scale;
            const x = (a4Width - imgWidth) / 2, y = (a4Height - imgHeight) / 2;
            doc.addImage(dataURL, 'PNG', x, y, imgWidth, imgHeight);
            doc.save('zoek-de-verschillen-puzzel.pdf');
        } else {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            const gap = 20;
            tempCanvas.width = canvasOrigineel.width * 2 + gap; tempCanvas.height = canvasOrigineel.height;
            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(canvasOrigineel, 0, 0);
            tempCtx.drawImage(canvasVerschillen, canvasOrigineel.width + gap, 0);
            const a = document.createElement('a');
            a.href = tempCanvas.toDataURL('image/png');
            a.download = 'zoek-de-verschillen-puzzel.png';
            a.click();
        }
    }
});