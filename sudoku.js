document.addEventListener("DOMContentLoaded", () => {
    // --- Globale variabelen en initialisatie ---
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    const size = 4; // 4x4 Sudoku

    let userImages = []; // Voor geüploade afbeeldingen (wanneer GEEN thema is gekozen)
    let uploadedImageData = new Set(); // Voor detectie van duplicaten bij uploads
    let currentPuzzle = [];

    // Voor themaselectie
    let selectedTheme = null; // Houdt bij welk thema is geselecteerd (bijv. "herfst")
    let allLoadedThemeImages = []; // Array met ALLE 20 geladen Image objecten van het geselecteerde thema
    let selectedThemeImagesForSudoku = []; // Array met de daadwerkelijk door de gebruiker gekozen thema Image objecten voor de Sudoku

    // --- DOM-elementen ophalen ---
    const typeRadios = document.querySelectorAll('input[name="sudokuType"]');
    const themeSelectionGroup = document.getElementById('themeSelectionGroup');
    const themeSelect = document.getElementById('themeSelect');
    const themeImageSelection = document.getElementById('themeImageSelection');
    const selectableThemeImagePreviews = document.getElementById('selectableThemeImagePreviews');
    const confirmThemeImagesBtn = document.getElementById('confirmThemeImagesBtn');
    const themeImageSelectionLabel = document.getElementById('themeImageSelectionLabel');
    const imageControls = document.getElementById('image-controls');
    const userUploadControls = document.getElementById('userUploadControls');
    const imageInput = document.getElementById('imageInput');
    const imageInputLabel = document.getElementById('imageInputLabel');
    const imagePreviews = document.getElementById('image-previews');
    const clearImagesBtn = document.getElementById('clearImagesBtn');
    const imageVarietyControls = document.getElementById('image-variety-controls');
    const imageVarietyRadios = document.querySelectorAll('input[name="imageVariety"]');
    const difficultySelect = document.getElementById('difficulty');
    const aantalSelect = document.getElementById('aantalSudokus');
    const aantalMelding = document.getElementById('aantalMelding');
    const generateBtn = document.getElementById('genereerBtn');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const meldingContainer = document.getElementById('meldingContainer');

    // --- Thema Afbeeldingen Configuratie ---
    const themeImagePaths = {
        "terug_naar_school": [], "herfst": [], "halloween": [], "sinterklaas": [],
        "winter": [], "kerst": [], "lente": [], "pasen": [], "carnaval": [], "zomer": []
    };

    function populateThemeImagePaths() {
        for (const theme in themeImagePaths) {
            for (let i = 1; i <= 20; i++) {
                const paddedIndex = i.toString().padStart(2, '0');
                themeImagePaths[theme].push(`sudoku_afbeeldingen/${theme}/${paddedIndex}.png`);
            }
        }
    }
    populateThemeImagePaths();

    // --- Sudoku Generatie Logica ---
    const shuffle = (array) => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
        return array;
    };

    function generateSolvedGrid() {
        const base = shuffle([1, 2, 3, 4]);
        let grid = Array(size).fill(null).map(() => Array(size));
        grid[0] = base;
        for (let r = 1; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r][c] = grid[r - 1][(c + ((r % 2 === 0) ? 1 : 2)) % size];
            }
        }
        for (let i = 0; i < 5; i++) {
            shuffleRows(grid);
            shuffleCols(grid);
            shuffleBlockRows(grid);
            shuffleBlockCols(grid);
        }
        return grid;
    }

    function shuffleRows(grid) {
        const rowBlocks = [[0,1], [2,3]];
        for (const block of rowBlocks) {
            const [r1, r2] = shuffle(block);
            [grid[r1], grid[r2]] = [grid[r2], grid[r1]];
        }
    }

    function shuffleCols(grid) {
        const colBlocks = [[0,1], [2,3]];
        for (const block of colBlocks) {
            const [c1, c2] = shuffle(block);
            for (let r = 0; r < size; r++) {
                [grid[r][c1], grid[r][c2]] = [grid[r][c2], grid[r][c1]];
            }
        }
    }

    function shuffleBlockRows(grid) {
        const blocks = shuffle([0, 1]);
        const newGrid = Array(size).fill(null).map(() => Array(size));
        for (let r = 0; r < size; r++) {
            const originalBlockIndex = Math.floor(r / 2);
            const newBlockIndex = blocks.indexOf(originalBlockIndex);
            const newRowIndex = (newBlockIndex * 2) + (r % 2);
            newGrid[newRowIndex] = grid[r];
        }
        for(let r = 0; r < size; r++) grid[r] = newGrid[r];
    }

    function shuffleBlockCols(grid) {
        const blocks = shuffle([0, 1]);
        const newGrid = Array(size).fill(null).map(() => Array(size));
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const originalBlockIndex = Math.floor(c / 2);
                const newBlockIndex = blocks.indexOf(originalBlockIndex);
                const newColIndex = (newBlockIndex * 2) + (c % 2);
                newGrid[r][newColIndex] = grid[r][c];
            }
        }
        for(let r = 0; r < size; r++) grid[r] = newGrid[r];
    }

    function createPuzzle(grid, difficulty) {
        let puzzle = JSON.parse(JSON.stringify(grid));
        const difficulties = { easy: 6, medium: 8, hard: 10 };
        let cells = [];
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) cells.push({ r, c });
        
        const cellsToRemove = Math.min(difficulties[difficulty] || 8, size * size);
        shuffle(cells).slice(0, cellsToRemove).forEach(cell => puzzle[cell.r][cell.c] = 0);
        return puzzle;
    }

    // --- Canvas Teken Logica (AANGEPAST VOOR SCHALEN) ---
    function drawGrid(ctx, x, y, size) {
        const cellSize = size / 4;
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, size, size);

        for (let i = 0; i <= 4; i++) {
            ctx.lineWidth = (i % 2 === 0) ? 2.5 : 1; // Lijnen iets dunner voor kleinere weergave
            ctx.strokeStyle = '#004080';
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, size); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize); ctx.lineTo(size, i * cellSize); ctx.stroke();
        }
        ctx.restore();
    }

    function drawPuzzle(ctx, puzzle, type, imagesToUse, x, y, size) {
        drawGrid(ctx, x, y, size);
        const cellSize = size / 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const value = puzzle[r][c];
                if (value === 0) continue;

                const drawX_center = x + c * cellSize + cellSize / 2;
                const drawY_center = y + r * cellSize + cellSize / 2;

                if (type === 'getallen') {
                    ctx.fillStyle = '#000';
                    ctx.font = `${cellSize * 0.6}px Arial`;
                    ctx.fillText(value, drawX_center, drawY_center);
                } else {
                    const imgIndex = value - 1;
                    if (imagesToUse && imagesToUse[imgIndex] && imagesToUse[imgIndex].complete) {
                        const img = imagesToUse[imgIndex];
                        const margin = cellSize * 0.1;
                        const availableSpace = cellSize - 2 * margin;

                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        let newWidth, newHeight;

                        if (aspectRatio > 1) {
                            newWidth = availableSpace;
                            newHeight = availableSpace / aspectRatio;
                        } else {
                            newHeight = availableSpace;
                            newWidth = availableSpace * aspectRatio;
                        }

                        const cellX = x + c * cellSize;
                        const cellY = y + r * cellSize;
                        const drawX = cellX + (cellSize - newWidth) / 2;
                        const drawY = cellY + (cellSize - newHeight) / 2;

                        ctx.drawImage(img, drawX, drawY, newWidth, newHeight);
                    }
                }
            }
        }
    }
    
    // --- UI Update & Validatie Functies ---
    function getNeededImagesCount() {
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        if (type !== 'afbeeldingen') return 0;

        const aantal = parseInt(aantalSelect.value);
        const variety = document.querySelector('input[name="imageVariety"]:checked').value;
        
        return (variety === 'different' && aantal > 1) ? size * aantal : size;
    }
    
    function updateUiForImageOptions() {
        const aantal = parseInt(aantalSelect.value);
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        const needed = getNeededImagesCount();
        
        themeSelectionGroup.style.display = (type === 'afbeeldingen') ? 'block' : 'none';
        imageControls.style.display = (type === 'afbeeldingen') ? 'block' : 'none';

        const isThemeConfirmed = (selectedTheme && selectedThemeImagesForSudoku.length === needed);
        themeImageSelection.style.display = (type === 'afbeeldingen' && selectedTheme && !isThemeConfirmed) ? 'block' : 'none';

        userUploadControls.style.display = (type === 'afbeeldingen' && !selectedTheme) ? 'block' : 'none';
        imageVarietyControls.style.display = (type === 'afbeeldingen' && aantal > 1) ? 'block' : 'none';

        aantalMelding.textContent = (aantal > 1) ? `Het werkblad zal ${aantal} verschillende sudoku's bevatten.` : '';
        
        updateImageUploadLabel();
        renderImagePreviews();
    }

    function updateImageUploadLabel() {
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        if (type === 'getallen') {
            meldingContainer.textContent = '';
            return;
        }

        const needed = getNeededImagesCount();
        if (selectedTheme) {
            themeImageSelectionLabel.textContent = `Kies ${needed} afbeelding(en) uit het thema:`;
            const currentSelectedCount = selectedThemeImagesForSudoku.length;
            if (currentSelectedCount < needed) {
                meldingContainer.textContent = `Selecteer nog ${needed - currentSelectedCount} afbeelding(en).`;
                meldingContainer.style.color = '#d9534f';
                confirmThemeImagesBtn.disabled = true;
            } else if (currentSelectedCount > needed) {
                meldingContainer.textContent = `Je hebt er ${currentSelectedCount - needed} te veel geselecteerd.`;
                meldingContainer.style.color = '#d9534f';
                confirmThemeImagesBtn.disabled = true;
            } else {
                meldingContainer.textContent = `Perfect! Klik op 'Bevestig selectie'.`;
                meldingContainer.style.color = 'green';
                confirmThemeImagesBtn.disabled = false;
            }
            return;
        }

        const currentUploadedCount = userImages.length;
        imageInputLabel.textContent = `Kies ${needed} afbeeldingen:`;
        if (needed > 0 && currentUploadedCount < needed) {
            meldingContainer.textContent = `${currentUploadedCount}/${needed} geselecteerd. Nog ${needed - currentUploadedCount} nodig.`;
            meldingContainer.style.color = '#d9534f';
        } else if (currentUploadedCount >= needed && needed > 0) {
            meldingContainer.textContent = `Perfect! Je hebt ${currentUploadedCount} unieke afbeeldingen.`;
            meldingContainer.style.color = 'green';
        } else {
            meldingContainer.textContent = '';
        }
    }

    function renderImagePreviews() {
        imagePreviews.innerHTML = '';
        selectableThemeImagePreviews.innerHTML = '';

        const imagesToRender = selectedTheme ? allLoadedThemeImages : userImages;
        const previewContainer = selectedTheme ? selectableThemeImagePreviews : imagePreviews;

        imagesToRender.forEach(img => {
            const imgWrapper = document.createElement('div');
            imgWrapper.classList.add('theme-image-wrapper');
            
            const previewImg = document.createElement('img');
            previewImg.src = img.src;
            imgWrapper.appendChild(previewImg);
            previewContainer.appendChild(imgWrapper);

            if (selectedTheme) {
                if (selectedThemeImagesForSudoku.some(selectedImg => selectedImg.src === img.src)) {
                    imgWrapper.classList.add('selected');
                }
                imgWrapper.addEventListener('click', () => {
                    const index = selectedThemeImagesForSudoku.findIndex(sImg => sImg.src === img.src);
                    const needed = getNeededImagesCount();
                    if (index > -1) {
                        selectedThemeImagesForSudoku.splice(index, 1);
                        imgWrapper.classList.remove('selected');
                    } else if (selectedThemeImagesForSudoku.length < needed) {
                        selectedThemeImagesForSudoku.push(img);
                        imgWrapper.classList.add('selected');
                    }
                    updateImageUploadLabel();
                });
            }
        });
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Afbeelding niet geladen: ${src}`));
        });
    }

    // --- Event Handlers ---
    async function generateAndDraw() {
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        const aantal = parseInt(aantalSelect.value);
        const variety = document.querySelector('input[name="imageVariety"]:checked').value;
        const useDifferentImagesPerSudoku = (type === 'afbeeldingen' && aantal > 1 && variety === 'different');

        let imagesForWorksheet = [];
        if (type === 'afbeeldingen') {
            const needed = getNeededImagesCount();
            const sourceImages = selectedTheme ? selectedThemeImagesForSudoku : userImages;
            if (sourceImages.length < needed) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                updateImageUploadLabel();
                return;
            }
            imagesForWorksheet = sourceImages;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cols = (aantal === 2 || aantal === 4) ? 2 : 1;
        const rows = (aantal === 3) ? 3 : (aantal === 4 ? 2 : (aantal === 1 ? 1 : (aantal === 2 ? 1 : 2)));
        
        const padding = 15;
        const availableWidth = canvas.width - (cols + 1) * padding;
        const availableHeight = canvas.height - (rows + 1) * padding;
        const sudokuSize = Math.min(availableWidth / cols, availableHeight / rows);

        for (let i = 0; i < aantal; i++) {
            const puzzle = createPuzzle(generateSolvedGrid(), difficultySelect.value);
            if (i === 0) currentPuzzle = puzzle;

            let imagesForCurrentSudoku = [];
            if (type === 'afbeeldingen') {
                imagesForCurrentSudoku = useDifferentImagesPerSudoku ?
                    imagesForWorksheet.slice(i * size, (i + 1) * size) :
                    imagesForWorksheet.slice(0, size);
                shuffle(imagesForCurrentSudoku);
            }
            
            const col = i % cols;
            const row = (cols === 1) ? i : Math.floor(i / cols);
            const x = padding + col * (sudokuSize + padding);
            const y = padding + row * (sudokuSize + padding);

            drawPuzzle(ctx, puzzle, type, imagesForCurrentSudoku, x, y, sudokuSize);
        }
    }
    
    [...typeRadios, ...imageVarietyRadios, aantalSelect, difficultySelect].forEach(el => {
        el.addEventListener('change', () => {
            if (el.name === 'sudokuType' || el.name === 'imageVariety' || el.id === 'aantalSudokus') {
                clearSelectionAndResetUI();
            } else {
                generateAndDraw();
            }
        });
    });

    themeSelect.addEventListener('change', async (event) => {
        const theme = event.target.value;
        clearSelectionAndResetUI(false);
        selectedTheme = theme;

        if (theme) {
            meldingContainer.textContent = `Thema ${themeSelect.options[themeSelect.selectedIndex].text} laden...`;
            try {
                allLoadedThemeImages = await Promise.all(themeImagePaths[theme].map(path => loadImage(path)));
                meldingContainer.textContent = '';
            } catch (error) {
                meldingContainer.textContent = "Fout bij laden thema-afbeeldingen.";
                allLoadedThemeImages = [];
                selectedTheme = null;
                themeSelect.value = "";
            }
        }
        updateUiForImageOptions();
        generateAndDraw();
    });

    confirmThemeImagesBtn.addEventListener('click', async () => {
        const needed = getNeededImagesCount();
        if (selectedThemeImagesForSudoku.length === needed) {
            await Promise.all(selectedThemeImagesForSudoku.map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; })));
            updateUiForImageOptions();
            generateAndDraw();
        }
    });

    imageInput.addEventListener('change', async (event) => {
        const files = Array.from(event.target.files);
        if (selectedTheme || files.length === 0) {
            imageInput.value = null;
            return;
        }

        const needed = getNeededImagesCount();
        userImages = [];
        uploadedImageData.clear();

        const readers = files.map(file => new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ dataURL: e.target.result });
            reader.readAsDataURL(file);
        }));

        const results = await Promise.all(readers);
        let newImagesLoaded = [];
        for (const { dataURL } of results) {
            if (!uploadedImageData.has(dataURL) && newImagesLoaded.length < needed) {
                uploadedImageData.add(dataURL);
                const img = new Image();
                img.src = dataURL;
                newImagesLoaded.push(img);
            }
        }
        userImages = newImagesLoaded;
        
        updateUiForImageOptions();
        generateAndDraw();
        imageInput.value = null;
    });

    function clearSelectionAndResetUI(resetThemeDropdown = true) {
        userImages = [];
        uploadedImageData.clear();
        allLoadedThemeImages = [];
        selectedThemeImagesForSudoku = [];
        if (resetThemeDropdown) {
            selectedTheme = null;
            themeSelect.value = "";
        }
        imageInput.value = null;
        updateUiForImageOptions();
        generateAndDraw();
    }

    clearImagesBtn.addEventListener('click', () => clearSelectionAndResetUI(true));
    generateBtn.addEventListener('click', generateAndDraw);
    
    // --- Download Functies ---
    downloadPngBtn.addEventListener('click', () => {
        const aantal = parseInt(aantalSelect.value);
        const dataURL = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = `sudoku-werkblad-${aantal}.png`;
        a.click();
    });

    downloadPdfBtn.addEventListener('click', async () => {
        meldingContainer.textContent = 'Bezig met het genereren van de PDF...';
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        const aantal = parseInt(aantalSelect.value);
        const type = document.querySelector('input[name="sudokuType"]:checked').value;
        const difficulty = difficultySelect.value;
        const variety = document.querySelector('input[name="imageVariety"]:checked').value;
        const useDifferentImagesPerSudoku = (type === 'afbeeldingen' && aantal > 1 && variety === 'different');

        let imagesForWorksheet = [];
        if (type === 'afbeeldingen') {
            const needed = getNeededImagesCount();
            const sourceImages = selectedTheme ? selectedThemeImagesForSudoku : userImages;
            if (sourceImages.length < needed) {
                meldingContainer.textContent = `Selecteer eerst ${needed} afbeeldingen!`;
                setTimeout(() => updateImageUploadLabel(), 3000);
                return;
            }
            imagesForWorksheet = sourceImages;
        }

        let allMissingDataForCutout = [];
        let puzzles = [];

        for (let i = 0; i < aantal; i++) {
            const solvedGrid = generateSolvedGrid();
            const puzzle = createPuzzle(solvedGrid, difficulty);
            puzzles.push(puzzle);

            if (type === 'afbeeldingen') {
                let imagesForCurrentSudoku = useDifferentImagesPerSudoku ?
                    imagesForWorksheet.slice(i * size, (i + 1) * size) :
                    imagesForWorksheet.slice(0, size);
                
                const shuffledImages = shuffle([...imagesForCurrentSudoku]);

                for (let r = 0; r < size; r++) {
                    for (let c = 0; c < size; c++) {
                        if (puzzle[r][c] === 0) {
                            const solutionValue = solvedGrid[r][c];
                            const imageToCut = shuffledImages[solutionValue - 1];
                            if (imageToCut) {
                                allMissingDataForCutout.push(imageToCut);
                            }
                        }
                    }
                }
            }
        }
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;

        let knipbladHoogte = 0;
        if (type === 'afbeeldingen' && allMissingDataForCutout.length > 0) {
            const cutImagesPerRow = Math.min(10, allMissingDataForCutout.length);
            const cutImageSize = (pageWidth - 2 * margin) / cutImagesPerRow - 2;
            const numRows = Math.ceil(allMissingDataForCutout.length / cutImagesPerRow);
            knipbladHoogte = numRows * (cutImageSize + 2) + margin + 10;
        }
        
        const layouts = calculateLayouts(aantal, pageWidth, pageHeight, margin, knipbladHoogte, 0);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 512;
        tempCanvas.height = 512;
        const tempCtx = tempCanvas.getContext('2d');

        for (let i = 0; i < puzzles.length; i++) {
            let imagesForCurrentSudoku = useDifferentImagesPerSudoku ?
                imagesForWorksheet.slice(i * size, (i + 1) * size) :
                imagesForWorksheet.slice(0, size);
            
            drawPuzzle(tempCtx, puzzles[i], type, shuffle([...imagesForCurrentSudoku]), 0, 0, tempCanvas.width);
            const layout = layouts[i];
            doc.addImage(tempCanvas.toDataURL('image/png'), 'PNG', layout.x, layout.y, layout.size, layout.size);
        }

        if (type === 'afbeeldingen' && allMissingDataForCutout.length > 0) {
            const cutImagesPerRow = Math.min(10, allMissingDataForCutout.length);
            const imgBoxSpacing = 2;
            const cutImageSize = (pageWidth - 2 * margin - (cutImagesPerRow - 1) * imgBoxSpacing) / cutImagesPerRow;
            
            const totalBlockWidth = cutImagesPerRow * (cutImageSize + imgBoxSpacing) - imgBoxSpacing;
            const startX = (pageWidth - totalBlockWidth) / 2;
            const startY = pageHeight - knipbladHoogte + margin;

            doc.setFontSize(14);
            doc.text("Knip de afbeeldingen uit en plak ze op de juiste plaats:", pageWidth / 2, startY - 5, { align: 'center' });

            // GECORRIGEERD BLOK BEGINT HIER
            for(let i = 0; i < allMissingDataForCutout.length; i++){
                const img = allMissingDataForCutout[i];
                const col = i % cutImagesPerRow;
                const row = Math.floor(i / cutImagesPerRow);
                const boxX = startX + col * (cutImageSize + imgBoxSpacing);
                const boxY = startY + row * (cutImageSize + imgBoxSpacing);

                // Teken het gestippelde vierkante kader
                doc.setDrawColor('#004080');
                doc.setLineDashPattern([2, 1.5], 0);
                doc.rect(boxX, boxY, cutImageSize, cutImageSize);
                doc.setLineDashPattern([], 0);

                if (img && img.complete) {
                    const marginInBox = 1; // Kleine witte rand binnen het kader
                    const availableSpace = cutImageSize - 2 * marginInBox;

                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    let newWidth, newHeight;

                    if (aspectRatio > 1) { // Afbeelding is breder dan hoog
                        newWidth = availableSpace;
                        newHeight = availableSpace / aspectRatio;
                    } else { // Afbeelding is hoger dan breed of vierkant
                        newHeight = availableSpace;
                        newWidth = availableSpace * aspectRatio;
                    }

                    // Centreer de afbeelding binnen het kader
                    const drawX = boxX + (cutImageSize - newWidth) / 2;
                    const drawY = boxY + (cutImageSize - newHeight) / 2;

                    // Voeg de afbeelding toe met de correcte, berekende afmetingen
                    doc.addImage(img.src, 'PNG', drawX, drawY, newWidth, newHeight);
                }
            }
            // GECORRIGEERD BLOK EINDIGT HIER
        }
        
        doc.save(`sudoku-werkblad-${aantal}.pdf`);
        meldingContainer.textContent = '';
    });

    function calculateLayouts(aantal, pageWidth, pageHeight, margin, bottomSpace, topSpace) {
        const layouts = [];
        const vPadding = 10;
        const hPadding = 10;
        const contentStartY = topSpace + margin;
        
        let availableHeight = pageHeight - topSpace - bottomSpace - 2 * margin;
        let availableWidth = pageWidth - 2 * margin;
        
        let sudokuSize, startX, startY, totalContentWidth, totalContentHeight;

        if (aantal === 1) {
            sudokuSize = Math.min(availableWidth, availableHeight);
            layouts.push({ x: margin + (availableWidth - sudokuSize) / 2, y: contentStartY + (availableHeight - sudokuSize) / 2, size: sudokuSize });
        } else if (aantal === 2) {
            sudokuSize = Math.min((availableWidth - hPadding) / 2, availableHeight);
            totalContentWidth = 2 * sudokuSize + hPadding;
            startX = margin + (availableWidth - totalContentWidth) / 2;
            startY = contentStartY + (availableHeight - sudokuSize) / 2;
            layouts.push({ x: startX, y: startY, size: sudokuSize });
            layouts.push({ x: startX + sudokuSize + hPadding, y: startY, size: sudokuSize });
        } else if (aantal === 3) {
            sudokuSize = Math.min(availableWidth, (availableHeight - 2 * vPadding) / 3);
            totalContentHeight = 3 * sudokuSize + 2 * vPadding;
            startX = margin + (availableWidth - sudokuSize) / 2;
            startY = contentStartY + (availableHeight - totalContentHeight) / 2;
            layouts.push({ x: startX, y: startY, size: sudokuSize });
            layouts.push({ x: startX, y: startY + sudokuSize + vPadding, size: sudokuSize });
            layouts.push({ x: startX, y: startY + 2 * (sudokuSize + vPadding), size: sudokuSize });
        } else if (aantal === 4) {
            sudokuSize = Math.min((availableWidth - hPadding) / 2, (availableHeight - vPadding) / 2);
            totalContentWidth = 2 * sudokuSize + hPadding;
            totalContentHeight = 2 * sudokuSize + vPadding;
            startX = margin + (availableWidth - totalContentWidth) / 2;
            startY = contentStartY + (availableHeight - totalContentHeight) / 2;
            layouts.push({ x: startX, y: startY, size: sudokuSize });
            layouts.push({ x: startX + sudokuSize + hPadding, y: startY, size: sudokuSize });
            layouts.push({ x: startX, y: startY + sudokuSize + vPadding, size: sudokuSize });
            layouts.push({ x: startX + sudokuSize + hPadding, y: startY + sudokuSize + vPadding, size: sudokuSize });
        }
        return layouts;
    }

    // --- Initiele UI en Puzzel ---
    updateUiForImageOptions();
    generateAndDraw();
});