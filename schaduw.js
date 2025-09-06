document.addEventListener('DOMContentLoaded', () => {
    // --- Globale Variabelen & State ---
    let originalFiles = [];
    let generatedItems = [];
    let isMoveModeEnabled = false;
    let selectedItem = null;

    // --- Element Referenties ---
    const imageUpload = document.getElementById('imageUpload');
    const uploadTriggerBtn = document.getElementById('uploadTriggerBtn');
    const fileFeedback = document.getElementById('file-feedback');
    const createShadowsBtn = document.getElementById('create-shadows-btn');
    const renderWorksheetBtn = document.getElementById('render-worksheet-btn');
    const werkbladWeergave = document.getElementById('werkbladWeergave');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const resetBtn = document.getElementById('resetBtn');
    const hiddenCanvas = document.getElementById('hiddenCanvas');
    const werkbladTypeRadios = document.querySelectorAll('input[name="werkbladType"]');
    const editControls = document.getElementById('edit-controls');
    const enableMoveBtn = document.getElementById('enable-move-btn');
    const resizeControls = document.getElementById('resize-controls');
    const increaseSizeBtn = document.getElementById('increase-size-btn');
    const decreaseSizeBtn = document.getElementById('decrease-size-btn');
    const sizeFeedback = document.getElementById('size-feedback');

    // --- Hulpfuncties ---
    function createImage(src, alt) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        return img;
    }

    function createItemWrapper(imgSrc, imgAlt) {
        const wrapper = document.createElement('div');
        wrapper.className = 'item-wrapper';
        wrapper.appendChild(createImage(imgSrc, imgAlt));
        return wrapper;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- Weergave Functies ---
    function displayOriginalImages() {
        werkbladWeergave.innerHTML = '';
        werkbladWeergave.className = 'preview-grid';
        originalFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'image-preview-item';
                const img = document.createElement('img');
                img.src = e.target.result;
                itemDiv.appendChild(img);
                werkbladWeergave.appendChild(itemDiv);
            };
            reader.readAsDataURL(file);
        });
    }

    function displayShadowPairs() {
        werkbladWeergave.innerHTML = '';
        werkbladWeergave.className = 'preview-grid';
        generatedItems.forEach(item => {
            const pairDiv = document.createElement('div');
            pairDiv.className = 'shadow-pair-container';
            const originalWrapper = document.createElement('div');
            originalWrapper.className = 'image-wrapper';
            originalWrapper.appendChild(createImage(item.original, 'Origineel'));
            const shadowWrapper = document.createElement('div');
            shadowWrapper.className = 'image-wrapper';
            shadowWrapper.appendChild(createImage(item.shadow, 'Schaduw'));
            pairDiv.appendChild(originalWrapper);
            pairDiv.appendChild(shadowWrapper);
            werkbladWeergave.appendChild(pairDiv);
        });
    }

    function renderTwoColumnWorksheet() {
        werkbladWeergave.innerHTML = '';
        werkbladWeergave.className = 'werkblad-container-final';
        const objectenKolom = document.createElement('div');
        objectenKolom.className = 'kolom';
        const schaduwenKolom = document.createElement('div');
        schaduwenKolom.className = 'kolom';
        const geschuddeObjecten = shuffleArray([...generatedItems]);
        const geschuddeSchaduwen = shuffleArray([...generatedItems]);
        geschuddeObjecten.forEach(item => objectenKolom.appendChild(createItemWrapper(item.original, 'Object')));
        geschuddeSchaduwen.forEach(item => schaduwenKolom.appendChild(createItemWrapper(item.shadow, 'Schaduw')));
        werkbladWeergave.appendChild(objectenKolom);
        werkbladWeergave.appendChild(schaduwenKolom);
    }

    function renderCentralObjectWorksheet(chosenIndex) {
        werkbladWeergave.innerHTML = '';
        werkbladWeergave.className = 'werkblad-type-1-final';
        const middenItem = generatedItems[chosenIndex];
        const middenObjectDiv = document.createElement('div');
        middenObjectDiv.className = 'midden-object';
        middenObjectDiv.appendChild(createImage(middenItem.original, 'Centraal Object'));
        werkbladWeergave.appendChild(middenObjectDiv);

        const placementSlots = [
            { top: '15%', left: '15%' }, { top: '15%', left: '50%' }, { top: '15%', left: '85%' },
            { top: '35%', left: '15%' }, { top: '35%', left: '85%' },
            { top: '50%', left: '15%' }, { top: '50%', left: '85%' },
            { top: '65%', left: '15%' }, { top: '65%', left: '85%' },
            { top: '85%', left: '15%' }, { top: '85%', left: '50%' }, { top: '85%', left: '85%' },
            { top: '30%', left: '35%' }, { top: '30%', left: '65%' },
            { top: '70%', left: '35%' }, { top: '70%', left: '65%' }
        ];

        const schaduwOpties = generatedItems.map(item => item.shadow);
        const geschuddePosities = shuffleArray(placementSlots);
        const geschuddeSchaduwen = shuffleArray(schaduwOpties);

        for (let i = 0; i < geschuddeSchaduwen.length; i++) {
            const wrapper = createItemWrapper(geschuddeSchaduwen[i], 'Schaduw Optie');
            const position = geschuddePosities[i];
            wrapper.style.top = position.top;
            wrapper.style.left = position.left;
            const randomRotation = Math.floor(Math.random() * 90) - 45;
            wrapper.style.transform = `translate(-50%, -50%) rotate(${randomRotation}deg)`;
            werkbladWeergave.appendChild(wrapper);
            makeElementDraggable(wrapper);
        }
        
        editControls.style.display = 'flex';
    }

    function showCentralImageSelectionUI() {
        werkbladWeergave.innerHTML = '<h2 class="selection-title">Kies de afbeelding voor in het midden</h2>';
        werkbladWeergave.className = 'selection-grid';
        generatedItems.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'selection-item';
            itemDiv.onclick = () => renderCentralObjectWorksheet(index);
            const img = document.createElement('img');
            img.src = item.original;
            itemDiv.appendChild(img);
            werkbladWeergave.appendChild(itemDiv);
        });
    }

    // --- Verfijn-modus Functies ---
    function toggleMoveMode() {
        isMoveModeEnabled = !isMoveModeEnabled;
        werkbladWeergave.classList.toggle('move-mode-active', isMoveModeEnabled);
        enableMoveBtn.classList.toggle('active', isMoveModeEnabled);
        enableMoveBtn.textContent = isMoveModeEnabled ? 'Klaar met verfijnen' : 'Verplaats & Pas Grootte Aan';

        if (isMoveModeEnabled) {
            resizeControls.style.display = 'flex';
        } else {
            resizeControls.style.display = 'none';
            if (selectedItem) {
                selectedItem.classList.remove('selected-for-edit');
                selectedItem = null;
            }
        }
    }

    function makeElementDraggable(element) {
        element.addEventListener('click', () => {
            if (!isMoveModeEnabled) return;
    
            if (selectedItem) {
                selectedItem.classList.remove('selected-for-edit');
            }
    
            selectedItem = element;
            selectedItem.classList.add('selected-for-edit');
    
            const currentSize = selectedItem.offsetWidth;
            sizeFeedback.textContent = `Grootte: ${currentSize}px`;
        });

        element.addEventListener('mousedown', function(e) {
            if (!isMoveModeEnabled) return;
            e.preventDefault();
            element.classList.add('dragging');
            const rect = element.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            function onMouseMove(e) {
                const parentRect = werkbladWeergave.getBoundingClientRect();
                let newLeft = e.clientX - parentRect.left - offsetX;
                let newTop = e.clientY - parentRect.top - offsetY;
                newLeft = Math.max(0, Math.min(newLeft, parentRect.width - element.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, parentRect.height - element.offsetHeight));
                
                element.style.left = newLeft + 'px';
                element.style.top = newTop + 'px';
                
                const originalTransform = element.style.transform;
                const rotationMatch = originalTransform.match(/rotate\((.+?)\)/);
                element.style.transform = rotationMatch ? rotationMatch[0] : '';
            }

            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                element.classList.remove('dragging');
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    // --- Hoofd Workflow & Systeemfuncties ---
    function handleFileSelection() {
        originalFiles = Array.from(imageUpload.files);
        fileFeedback.textContent = `${originalFiles.length} bestand(en) geselecteerd.`;
        if (originalFiles.length > 0) {
            displayOriginalImages();
            createShadowsBtn.disabled = false;
            renderWorksheetBtn.disabled = true;
            werkbladTypeRadios.forEach(radio => radio.disabled = true);
            editControls.style.display = 'none';
        } else {
            resetGenerator();
        }
    }

    async function handleShadowCreation() {
        fileFeedback.textContent = 'Schaduwen worden gemaakt...';
        generatedItems = [];
        const processingPromises = originalFiles.map(createShadowFromBlob);
        generatedItems = await Promise.all(processingPromises);
        displayShadowPairs();
        fileFeedback.textContent = 'Schaduwen zijn gemaakt. Kies een werkbladtype.';
        renderWorksheetBtn.disabled = false;
        werkbladTypeRadios.forEach(radio => radio.disabled = false);
    }

    function renderFinalWorksheet() {
        const selectedType = document.querySelector('input[name="werkbladType"]:checked').value;
        editControls.style.display = 'none';
        if (selectedType === 'type2') {
            renderTwoColumnWorksheet();
        } else {
            const imageCount = generatedItems.length;
            if (imageCount < 8 || imageCount > 15) {
                alert(`Voor het 'Midden Object' werkblad zijn minimaal 8 en maximaal 15 afbeeldingen nodig.\nU heeft er ${imageCount}.`);
                return;
            }
            showCentralImageSelectionUI();
        }
    }

    async function downloadWorksheetAsPDF() {
        const wasMoveMode = isMoveModeEnabled;
        if (wasMoveMode) toggleMoveMode();
        
        const worksheetElement = document.getElementById('werkbladWeergave');
        if (!worksheetElement.hasChildNodes() || worksheetElement.querySelector('.placeholder-text')) {
            alert("Genereer eerst een werkblad om te downloaden.");
            if (wasMoveMode) toggleMoveMode();
            return;
        }
        try {
            const canvas = await html2canvas(worksheetElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const availableW = pageW - margin * 2;
            const availableH = pageH - margin * 2;
            const imgProps = pdf.getImageProperties(imgData);
            const imgRatio = imgProps.width / imgProps.height;
            let pdfImgW = availableW;
            let pdfImgH = pdfImgW / imgRatio;
            if (pdfImgH > availableH) {
                pdfImgH = availableH;
                pdfImgW = pdfImgH * imgRatio;
            }
            const x = (pageW - pdfImgW) / 2;
            const y = (pageH - pdfImgH) / 2;
            pdf.addImage(imgData, 'PNG', x, y, pdfImgW, pdfImgH);
            pdf.save('schaduw-werkblad.pdf');
        } catch (error) {
            console.error("Fout bij het maken van de PDF:", error);
            alert("Er is een fout opgetreden bij het maken van de PDF.");
        } finally {
            if (wasMoveMode) toggleMoveMode();
        }
    }

    function createShadowFromBlob(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = async () => {
                    const originalDataURL = e.target.result;
                    const shadowDataURL = await convertImageToShadow(img);
                    resolve({ original: originalDataURL, shadow: shadowDataURL });
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    function convertImageToShadow(imgElement) {
        const ctx = hiddenCanvas.getContext('2d');
        hiddenCanvas.width = imgElement.naturalWidth;
        hiddenCanvas.height = imgElement.naturalHeight;
        ctx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
        ctx.drawImage(imgElement, 0, 0);
        const imageData = ctx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] > 50) {
                pixels[i] = 0; pixels[i + 1] = 0; pixels[i + 2] = 0; pixels[i + 3] = 255;
            } else {
                pixels[i + 3] = 0;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return Promise.resolve(hiddenCanvas.toDataURL('image/png'));
    }

    function resetGenerator() {
        originalFiles = [];
        generatedItems = [];
        isMoveModeEnabled = false;
        selectedItem = null;
        imageUpload.value = '';
        werkbladWeergave.innerHTML = '<p class="placeholder-text">Begin bij Stap 1 om afbeeldingen te kiezen.</p>';
        werkbladWeergave.className = '';
        fileFeedback.textContent = 'Geen bestanden geselecteerd.';
        createShadowsBtn.disabled = true;
        renderWorksheetBtn.disabled = true;
        editControls.style.display = 'none';
        werkbladTypeRadios.forEach(radio => {
            radio.disabled = true;
            radio.checked = radio.value === 'type2';
        });
    }

    // --- Functies voor Resizen ---
    function resizeSelectedItem(amount) {
        if (!selectedItem) {
            alert("Selecteer eerst een schaduw door erop te klikken.");
            return;
        }

        const currentWidth = selectedItem.offsetWidth;
        const currentHeight = selectedItem.offsetHeight;
        const newWidth = currentWidth + amount;
        const newHeight = currentHeight + amount;

        if (newWidth < 20 || newHeight < 20) {
            sizeFeedback.textContent = "Minimale grootte bereikt";
            return;
        }

        selectedItem.style.width = newWidth + 'px';
        selectedItem.style.height = newHeight + 'px';
        
        sizeFeedback.textContent = `Grootte: ${newWidth}px`;
    }

    // --- Event Listeners ---
    uploadTriggerBtn.addEventListener('click', () => imageUpload.click());
    imageUpload.addEventListener('change', handleFileSelection);
    createShadowsBtn.addEventListener('click', handleShadowCreation);
    renderWorksheetBtn.addEventListener('click', renderFinalWorksheet);
    resetBtn.addEventListener('click', resetGenerator);
    downloadPdfBtn.addEventListener('click', downloadWorksheetAsPDF);
    enableMoveBtn.addEventListener('click', toggleMoveMode);
    increaseSizeBtn.addEventListener('click', () => resizeSelectedItem(10));
    decreaseSizeBtn.addEventListener('click', () => resizeSelectedItem(-10));
});