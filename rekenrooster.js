document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("roosterCanvas");
    const ctx = canvas.getContext("2d");

    const genereerBtn = document.getElementById("genereerBtn");
    const oplossingBtn = document.getElementById("oplossingBtn");
    const downloadPngBtn = document.getElementById("downloadPngBtn");
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");
    const bewerkingCheckboxes = document.querySelectorAll('#bewerking-keuze input[type="checkbox"]');
    const puzzelTypeSelect = document.getElementById("puzzelType");
    const gridSizeSelect = document.getElementById("gridSize");
    const numberRangeSelect = document.getElementById("numberRange");
    const getalbereikGroup = document.getElementById("getalbereik-group");
    const tafelsGroup = document.getElementById("tafels-group");
    const tafelKeuzeDiv = document.getElementById("tafelKeuze");
    const tafelHintSpan = document.getElementById("tafelHint");
    const aantalTabellenRadios = document.querySelectorAll('input[name="aantalTabellen"]');
    const legeVakkenSlider = document.getElementById("legeVakken");
    const legeVakkenLabel = document.getElementById("legeVakkenLabel");

    let puzzles = [];

    for (let i = 1; i <= 10; i++) {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = i;
        const span = document.createElement('span');
        span.textContent = i;
        label.appendChild(checkbox);
        label.appendChild(span);
        tafelKeuzeDiv.appendChild(label);
    }
    const tafelCheckboxes = document.querySelectorAll('#tafelKeuze input[type="checkbox"]');

    function shuffleArray(array) {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    }
    
    function getUniqueRandomNumbers(min, max, count) {
        const numbers = new Set();
        if (max < min || (max - min + 1) < count) {
            return null;
        }
        while (numbers.size < count) {
            const num = Math.floor(Math.random() * (max - min + 1)) + min;
            numbers.add(num);
        }
        return Array.from(numbers);
    }

    function updateControlsVisibility() {
        const bewerkingen = Array.from(bewerkingCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const showTafels = bewerkingen.includes('x');
        const showRange = bewerkingen.includes('+') || bewerkingen.includes('-');
        tafelsGroup.style.display = showTafels ? 'block' : 'none';
        getalbereikGroup.style.display = showRange ? 'block' : 'none';
    }

    function updateTafelHint() {
        const gridSize = parseInt(gridSizeSelect.value);
        const vereistAantal = gridSize - 1;
        tafelHintSpan.textContent = `(kies er minstens ${vereistAantal})`;
    }

    function generateWorksheet() {
        puzzles = []; // Reset de puzzels
        const aantal = parseInt(document.querySelector('input[name="aantalTabellen"]:checked').value);
        let bewerkingen = Array.from(bewerkingCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        
        if (bewerkingen.length === 0) {
            drawWorksheet();
            return;
        }
        
        for (let i = 0; i < aantal; i++) {
            const bewerking = bewerkingen[i % bewerkingen.length];
            const puzzle = generateSinglePuzzle(bewerking);
            
            if (puzzle) {
                puzzles.push(puzzle);
            }
        }
        drawWorksheet();
    }

    function generateSinglePuzzle(bewerking) {
        let gridSize = parseInt(gridSizeSelect.value);
        const numberRange = parseInt(numberRangeSelect.value);
        const aantalLegeVakken = parseInt(legeVakkenSlider.value);
        const geselecteerdeTafels = Array.from(tafelCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value));

        if ((bewerking === '+' || bewerking === '-') && numberRange <= 10 && gridSize > 3) {
            gridSize = 3;
        } else if ((bewerking === '+' || bewerking === '-') && numberRange <= 20 && gridSize > 4) {
            gridSize = 4;
        }
        
        const solutionGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
        solutionGrid[0][0] = bewerking;

        let colHeaders, rowHeaders;
        const required = gridSize - 1;

        if (required <= 0) return null;

        if (bewerking === 'x') {
            if (geselecteerdeTafels.length < required) return null;
            colHeaders = shuffleArray(geselecteerdeTafels).slice(0, required);
            rowHeaders = shuffleArray(geselecteerdeTafels).slice(0, required);
        } else if (bewerking === '+') {
            const midPoint = Math.floor(numberRange / 2);
            if((midPoint) < required) return null; 
            const allHeaders = getUniqueRandomNumbers(1, midPoint, required * 2);
            if (!allHeaders) return null;
            colHeaders = allHeaders.slice(0, required);
            rowHeaders = allHeaders.slice(required, required * 2);
        } else if (bewerking === '-') {
            colHeaders = getUniqueRandomNumbers(1, numberRange - required, required);
            if (!colHeaders) return null;
            
            const maxKolomkop = Math.max(...colHeaders);
            rowHeaders = getUniqueRandomNumbers(maxKolomkop + 1, numberRange, required);
            if (!rowHeaders) return null;
        }

        if (!colHeaders || !rowHeaders) return null;

        for (let c = 0; c < colHeaders.length; c++) {
            solutionGrid[0][c + 1] = colHeaders[c];
        }
        for (let r = 0; r < rowHeaders.length; r++) {
            solutionGrid[r + 1][0] = rowHeaders[r];
        }

        for (let r = 1; r < gridSize; r++) {
            for (let c = 1; c < gridSize; c++) {
                const rowVal = solutionGrid[r][0];
                const colVal = solutionGrid[0][c];
                if (bewerking === '+') solutionGrid[r][c] = rowVal + colVal;
                if (bewerking === '-') solutionGrid[r][c] = rowVal - colVal;
                if (bewerking === 'x') solutionGrid[r][c] = rowVal * colVal;
            }
        }
        
        const displayGrid = JSON.parse(JSON.stringify(solutionGrid));
        const puzzelType = puzzelTypeSelect.value;

        // --- START VAN DE AANGEPASTE LOGICA ---
        if (puzzelType === 'klassiek') {
            // Klassiek: maak alleen de binnenste cellen (resultaten) leeg.
            const mogelijkeVakken = [];
            for (let r = 1; r < gridSize; r++) {
                for (let c = 1; c < gridSize; c++) {
                    mogelijkeVakken.push({ r, c });
                }
            }
            const shuffledEmptyCells = shuffleArray(mogelijkeVakken);
            for (let i = 0; i < Math.min(aantalLegeVakken, shuffledEmptyCells.length); i++) {
                const { r, c } = shuffledEmptyCells[i];
                displayGrid[r][c] = '';
            }
        } else { // Omgekeerd: maak startgetallen en resultaten leeg, maar zorg voor oplosbaarheid.
            const allHeaders = [];
            for (let i = 1; i < gridSize; i++) {
                allHeaders.push({ r: 0, c: i }); // Bovenste rij
                allHeaders.push({ r: i, c: 0 }); // Linker kolom
            }

            const allResults = [];
            for (let r = 1; r < gridSize; r++) {
                for (let c = 1; c < gridSize; c++) {
                    allResults.push({ r, c });
                }
            }

            const protectedCells = new Set(); // Sla cellen op die niet leeg mogen worden gemaakt.
            let emptyCount = 0;

            // 1. Bepaal welke startgetallen we leegmaken en bescherm een "hint"-cel.
            const shuffledHeaders = shuffleArray(allHeaders);
            // Maak maximaal 1/3 van de lege vakken een startgetal, of minder als er niet genoeg zijn.
            const numHeadersToEmpty = Math.min(shuffledHeaders.length, Math.ceil(aantalLegeVakken / 3));
            const headersToEmpty = shuffledHeaders.slice(0, numHeadersToEmpty);

            headersToEmpty.forEach(headerPos => {
                let cluePos;
                if (headerPos.r === 0) { // Startgetal in bovenste rij
                    // Bescherm een willekeurige cel in dezelfde kolom
                    const randomRow = Math.floor(Math.random() * (gridSize - 1)) + 1;
                    cluePos = { r: randomRow, c: headerPos.c };
                } else { // Startgetal in linker kolom
                    // Bescherm een willekeurige cel in dezelfde rij
                    const randomCol = Math.floor(Math.random() * (gridSize - 1)) + 1;
                    cluePos = { r: headerPos.r, c: randomCol };
                }
                // Voeg de "hint"-cel toe aan de beschermde set. De key is een string "rij,kolom".
                protectedCells.add(`${cluePos.r},${cluePos.c}`);
            });

            // 2. Maak de geselecteerde startgetallen leeg.
            headersToEmpty.forEach(({ r, c }) => {
                if (emptyCount < aantalLegeVakken) {
                    displayGrid[r][c] = '';
                    emptyCount++;
                }
            });

            // 3. Maak de overige lege vakken op uit de resultaatcellen, maar respecteer de beschermde cellen.
            const shuffledResults = shuffleArray(allResults);
            for (const resultPos of shuffledResults) {
                if (emptyCount >= aantalLegeVakken) break;

                const posKey = `${resultPos.r},${resultPos.c}`;
                if (!protectedCells.has(posKey)) {
                    displayGrid[resultPos.r][resultPos.c] = '';
                    emptyCount++;
                }
            }
        }
        // --- EINDE VAN DE AANGEPASTE LOGICA ---

        return { solutionGrid, displayGrid };
    }
    
    function drawWorksheet() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bewerkingen = Array.from(bewerkingCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        
        if (bewerkingen.length === 0) {
            return;
        }
        
        if (bewerkingen.includes('x')) {
            const gridSize = parseInt(gridSizeSelect.value);
            const geselecteerdeTafels = Array.from(tafelCheckboxes).filter(cb => cb.checked);
            const vereistAantal = gridSize - 1;

            if (geselecteerdeTafels.length < vereistAantal) {
                const nogTeKiezen = vereistAantal - geselecteerdeTafels.length;
                ctx.font = "18px Arial";
                ctx.textAlign = 'center';
                ctx.fillStyle = '#555';
                ctx.fillText(`Kies nog ${nogTeKiezen} tafel(s) om een ${gridSize}x${gridSize} rooster te maken.`, canvas.width / 2, canvas.height / 2);
                return;
            }
        }

        if (puzzles.length === 0) {
            ctx.font = "16px Arial";
            ctx.textAlign = 'center';
            ctx.fillStyle = 'black';
            ctx.fillText("Kon geen rooster genereren. Probeer andere instellingen.", canvas.width / 2, canvas.height / 2);
            return;
        }

        const layout = { 1: { x: 1, y: 1 }, 2: { x: 2, y: 1 }, 4: { x: 2, y: 2 } }[puzzles.length] || { x: 1, y: 1 };
        const padding = 20;
        const totalWidth = canvas.width - padding * (layout.x + 1);
        const totalHeight = canvas.height - padding * (layout.y + 1);
        const singleGridWidth = totalWidth / layout.x;
        const singleGridHeight = totalHeight / layout.y;

        puzzles.forEach((puzzle, index) => {
            const gridX = (index % layout.x) * (singleGridWidth + padding) + padding;
            const gridY = Math.floor(index / layout.x) * (singleGridHeight + padding) + padding;
            drawSingleGrid(puzzle.displayGrid, gridX, gridY, singleGridWidth, singleGridHeight);
        });
    }

    function drawSolutions() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const aantal = puzzles.length;
        if (aantal === 0) return;

        const layout = { 1: { x: 1, y: 1 }, 2: { x: 2, y: 1 }, 4: { x: 2, y: 2 } }[puzzles.length] || { x: 1, y: 1 };
        const padding = 20;
        const totalWidth = canvas.width - padding * (layout.x + 1);
        const totalHeight = canvas.height - padding * (layout.y + 1);
        const singleGridWidth = totalWidth / layout.x;
        const singleGridHeight = totalHeight / layout.y;

        puzzles.forEach((puzzle, index) => {
            const gridX = (index % layout.x) * (singleGridWidth + padding) + padding;
            const gridY = Math.floor(index / layout.x) * (singleGridHeight + padding) + padding;
            drawSingleGrid(puzzle.solutionGrid, gridX, gridY, singleGridWidth, singleGridHeight, true);
        });
    }

    function drawSingleGrid(gridData, x, y, width, height, isSolution = false) {
        const gridSize = gridData.length;
        const cellSize = Math.min(width / gridSize, height / gridSize);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.font = `${cellSize * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cellX = x + c * cellSize;
                const cellY = y + r * cellSize;
                
                // Bepaal of de cel in de originele puzzel leeg was
                const wasEmpty = puzzles.some(p => p.displayGrid[r]?.[c] === '');

                if (r === 0 || c === 0) {
                    ctx.fillStyle = '#f0faff';
                    ctx.fillRect(cellX, cellY, cellSize, cellSize);
                }
                
                ctx.strokeRect(cellX, cellY, cellSize, cellSize);
                
                if (gridData[r][c] !== null && gridData[r][c] !== '') {
                    // Een cel is een "antwoord" als we de oplossing tonen én de cel oorspronkelijk leeg was.
                    const isAnswerCell = isSolution && wasEmpty;
                    ctx.fillStyle = isAnswerCell ? '#008000' : (r === 0 || c === 0) ? '#004080' : 'black';
                    ctx.fillText(gridData[r][c], cellX + cellSize / 2, cellY + cellSize / 2);
                }
            }
        }
    }

    genereerBtn.addEventListener("click", generateWorksheet);
    oplossingBtn.addEventListener("click", drawSolutions);

    const controlsToListen = [puzzelTypeSelect, numberRangeSelect, ...aantalTabellenRadios];
    controlsToListen.forEach(control => control.addEventListener('change', generateWorksheet));
    
    gridSizeSelect.addEventListener('change', () => {
        updateTafelHint();
        generateWorksheet();
    });

    bewerkingCheckboxes.forEach(cb => cb.addEventListener("change", () => {
        updateControlsVisibility();
        generateWorksheet();
    }));

    tafelCheckboxes.forEach(cb => cb.addEventListener("change", generateWorksheet));
    
    legeVakkenSlider.addEventListener("input", () => {
        legeVakkenLabel.textContent = legeVakkenSlider.value;
    });
    legeVakkenSlider.addEventListener("change", generateWorksheet);

    downloadPngBtn.addEventListener("click", () => {
        const link = document.createElement('a');
        link.download = 'rekentabellen.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    downloadPdfBtn.addEventListener("click", async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const dataURL = canvas.toDataURL("image/png");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        let pdfImgWidth = pageWidth - 2 * margin;
        let pdfImgHeight = pdfImgWidth / ratio;
        if (pdfImgHeight > pageHeight - 2 * margin) {
            pdfImgHeight = pageHeight - 2 * margin;
            pdfImgWidth = pdfImgHeight * ratio;
        }
        const xPos = (pageWidth - pdfImgWidth) / 2;
        const yPos = (pageHeight - pdfImgHeight) / 2;
        doc.addImage(dataURL, 'PNG', xPos, yPos, pdfImgWidth, pdfImgHeight);
        doc.save("rekentabellen.pdf");
    });

    legeVakkenLabel.textContent = legeVakkenSlider.value;
    if (Array.from(bewerkingCheckboxes).filter(cb => cb.checked).length === 0) {
        document.querySelector('#bewerking-keuze input[value="+"]').checked = true;
    }
    updateControlsVisibility();
    updateTafelHint();
    generateWorksheet();
});