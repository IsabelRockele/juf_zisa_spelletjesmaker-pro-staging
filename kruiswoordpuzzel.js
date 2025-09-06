document.addEventListener("DOMContentLoaded", () => {
    // ======================================================
    // ALGEMEEN: KEUZESCHERM LOGICA
    // ======================================================
    const keuzescherm = document.getElementById('keuzescherm');
    const generatorKlassiek = document.getElementById('generator-klassiek');
    const generatorVerborgenWoord = document.getElementById('generator-verborgenwoord');

    const kiesKlassiekBtn = document.getElementById('kies-klassiek');
    const kiesVerborgenWoordBtn = document.getElementById('kies-verborgenwoord');
    
    const terugNaarKeuzeBtn = document.getElementById('terugNaarKeuzeBtn');

    kiesKlassiekBtn.addEventListener('click', () => {
        keuzescherm.classList.add('verborgen');
        generatorKlassiek.classList.remove('verborgen');
        terugNaarKeuzeBtn.classList.remove('verborgen');
        initKlassiekeGenerator();
    });

    kiesVerborgenWoordBtn.addEventListener('click', () => {
        keuzescherm.classList.add('verborgen');
        generatorVerborgenWoord.classList.remove('verborgen');
        terugNaarKeuzeBtn.classList.remove('verborgen');
        initVerborgenWoordGenerator();
    });

    terugNaarKeuzeBtn.addEventListener('click', () => {
        generatorKlassiek.classList.add('verborgen');
        generatorVerborgenWoord.classList.add('verborgen');
        terugNaarKeuzeBtn.classList.add('verborgen');
        
        // Verberg ook de specifieke werkruimtes
        document.getElementById('klassiek-werkruimte').classList.add('verborgen');
        document.getElementById('klassiek-keuzescherm').classList.remove('verborgen');

        keuzescherm.classList.remove('verborgen');
        resetGenerators();
    });

    function resetGenerators() {
        // Reset Klassieke generator
        document.getElementById("woordenInput").value = '';
        document.getElementById("klassiekWoordenContainer").innerHTML = '';
        document.getElementById("aantalWoordenInput").value = '5';
        document.getElementById("meldingContainer").textContent = '';
        const canvas = document.getElementById("mainCanvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById("horizontal-clues-list").innerHTML = '';
        document.getElementById("vertical-clues-list").innerHTML = '';

        // Reset Verborgen Woord generator
        document.getElementById("verborgenWoordInput").value = '';
        document.getElementById("vwAntwoordenContainer").innerHTML = '';
        document.getElementById("vwGeneratorKnoppen").classList.add('verborgen');
        document.getElementById("vwWerkbladContainer").innerHTML = `
            <div class="vw-placeholder">
                <p>Vul links de gegevens in om een werkblad te genereren.</p>
            </div>`;
        document.getElementById("vw-export-knoppen").classList.add('verborgen');
    }


    // ======================================================
    // LOGICA VOOR KLASSIEKE KRUISWOORDPUZZEL
    // ======================================================
    function initKlassiekeGenerator() {
        // --- Referenties naar DOM elementen ---
        const klassiekKeuzescherm = document.getElementById('klassiek-keuzescherm');
        const klassiekWerkruimte = document.getElementById('klassiek-werkruimte');
        const kiesSimpelBtn = document.getElementById('kies-simpel-modus');
        const kiesOmschrijvingBtn = document.getElementById('kies-omschrijving-modus');

        const simpelInvoer = document.getElementById('klassiek-simpel-invoer');
        const omschrijvingInvoer = document.getElementById('klassiek-omschrijving-invoer');
        
        let actieveModus = ''; // Houdt bij welke invoermodus actief is

        // --- Event Listeners voor sub-keuze ---
        kiesSimpelBtn.addEventListener('click', () => {
            actieveModus = 'simpel';
            klassiekKeuzescherm.classList.add('verborgen');
            simpelInvoer.classList.remove('verborgen');
            omschrijvingInvoer.classList.add('verborgen');
            klassiekWerkruimte.classList.remove('verborgen');
        });

        kiesOmschrijvingBtn.addEventListener('click', () => {
            actieveModus = 'omschrijving';
            klassiekKeuzescherm.classList.add('verborgen');
            omschrijvingInvoer.classList.remove('verborgen');
            simpelInvoer.classList.add('verborgen');
            klassiekWerkruimte.classList.remove('verborgen');
        });

        // --- Logica voor uitgebreide invoer ---
        const aantalWoordenInput = document.getElementById('aantalWoordenInput');
        const genereerWoordVeldenBtn = document.getElementById('genereerWoordVeldenBtn');
        const klassiekWoordenContainer = document.getElementById('klassiekWoordenContainer');

        genereerWoordVeldenBtn.addEventListener('click', () => {
            const aantal = parseInt(aantalWoordenInput.value, 10);
            klassiekWoordenContainer.innerHTML = '';
            for (let i = 1; i <= aantal; i++) {
                const rij = document.createElement('div');
                rij.className = 'klassiek-woord-rij';
                rij.innerHTML = `
                    <label>${i}.</label>
                    <input type="text" class="klassiek-woord-input" placeholder="Woord">
                    <input type="text" class="klassiek-omschrijving-input" placeholder="Omschrijving">
                `;
                klassiekWoordenContainer.appendChild(rij);
            }
        });

        // --- Algemene generator logica ---
        const canvas = document.getElementById("mainCanvas");
        const ctx = canvas.getContext("2d");
        const generateBtn = document.getElementById("genereerBtn");
        const downloadPngBtn = document.getElementById("downloadPngBtn");
        const downloadPdfBtn = document.getElementById("downloadPdfBtn");
        const meldingContainer = document.getElementById("meldingContainer");

        const INTERNAL_GRID_SIZE = 40;
        let grid = [];
        let placedWordsInfo = [];

        function getKlassiekePuzzelData() {
            if (actieveModus === 'simpel') {
                const woordenInput = document.getElementById("woordenInput");
                const rawInput = woordenInput.value.trim().split('\n');
                return rawInput
                    .map(line => {
                        const parts = line.split(';');
                        const word = (parts[0] || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
                        const clue = (parts[1] || '').trim() || word; // Gebruik woord als omschrijving als leeg
                        return { word, clue };
                    })
                    .filter(item => item.word.length > 1);
            } 
            else if (actieveModus === 'omschrijving') {
                const rijen = klassiekWoordenContainer.querySelectorAll('.klassiek-woord-rij');
                const data = [];
                rijen.forEach(rij => {
                    const wordInput = rij.querySelector('.klassiek-woord-input');
                    const clueInput = rij.querySelector('.klassiek-omschrijving-input');
                    const word = (wordInput.value || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
                    const clue = (clueInput.value || '').trim();
                    if (word.length > 1 && clue) {
                        data.push({ word, clue });
                    }
                });
                return data;
            }
            return []; // Geen geldige modus
        }

        function cleanGrid() { /* ... ongewijzigd ... */ }
        function drawGrid(puzzleData) { /* ... ongewijzigd ... */ }
        function canPlaceWord(word, r, c, direction) { /* ... ongewijzigd ... */ }
        function placeSingleWord(wordObj, r, c, direction) { /* ... ongewijzigd ... */ }
        function placeWords(words) { /* ... ongewijzigd ... */ }
        function finalizeGrid() { /* ... ongewijzigd ... */ }
        function displayClues(wordData) { /* ... ongewijzigd ... */ }
        function wrapTextAndCalcHeight(context, text, maxWidth, lineHeight) { /* ... ongewijzigd ... */ }
        function drawWrappedText(context, text, x, y, maxWidth, lineHeight) { /* ... ongewijzigd ... */ }
        function downloadAs(type) { /* ... ongewijzigd ... */ }
        
        // ... Plak hier alle ongewijzigde functies van de klassieke generator ...
        // (De functies hieronder zijn identiek aan de vorige versie, maar zijn hier voor de volledigheid)
        cleanGrid = function() {
            grid = Array(INTERNAL_GRID_SIZE).fill(null).map(() => Array(INTERNAL_GRID_SIZE).fill(null));
            placedWordsInfo = [];
        }
        drawGrid = function(puzzleData) {
            const { puzzleGrid } = puzzleData;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!puzzleGrid || puzzleGrid.length === 0) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                return;
            }
            const gridSize = puzzleGrid.length;
            const cellSize = canvas.width / gridSize;
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    const cell = puzzleGrid[r][c];
                    if (cell) {
                        ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
                        if (cell.number) {
                            ctx.fillStyle = "#004080";
                            ctx.font = `bold ${cellSize * 0.3}px Arial`;
                            ctx.textAlign = "left";
                            ctx.textBaseline = "top";
                            ctx.fillText(cell.number, c * cellSize + 3, r * cellSize + 2);
                        }
                    }
                }
            }
        }
        canPlaceWord = function(word, r, c, direction) {
            let intersections = 0;
            if (direction === 'horizontal') {
                if (c < 0 || r < 0 || c + word.length > INTERNAL_GRID_SIZE || r >= INTERNAL_GRID_SIZE) return false;
                if (c > 0 && grid[r][c - 1] !== null) return false;
                if (c + word.length < INTERNAL_GRID_SIZE && grid[r][c + word.length] !== null) return false;
                for (let i = 0; i < word.length; i++) {
                    const curR = r;
                    const curC = c + i;
                    if (grid[curR][curC] !== null && grid[curR][curC] !== word[i]) return false;
                    if (grid[curR][curC] !== null && grid[curR][curC] === word[i]) {
                        intersections++;
                    } else {
                        if (curR > 0 && grid[curR - 1][curC] !== null) return false;
                        if (curR < INTERNAL_GRID_SIZE - 1 && grid[curR + 1][curC] !== null) return false;
                    }
                }
            } else { // Vertical
                if (r < 0 || c < 0 || r + word.length > INTERNAL_GRID_SIZE || c >= INTERNAL_GRID_SIZE) return false;
                if (r > 0 && grid[r - 1][c] !== null) return false;
                if (r + word.length < INTERNAL_GRID_SIZE && grid[r + word.length][c] !== null) return false;
                for (let i = 0; i < word.length; i++) {
                    const curR = r + i;
                    const curC = c;
                    if (grid[curR][curC] !== null && grid[curR][curC] !== word[i]) return false;
                    if (grid[curR][curC] !== null && grid[curR][curC] === word[i]) {
                        intersections++;
                    } else {
                        if (curC > 0 && grid[curR][curC - 1] !== null) return false;
                        if (curC < INTERNAL_GRID_SIZE - 1 && grid[curR][curC + 1] !== null) return false;
                    }
                }
            }
            return intersections > 0;
        }
        placeSingleWord = function(wordObj, r, c, direction) {
            for (let i = 0; i < wordObj.word.length; i++) {
                if (direction === 'horizontal') {
                    grid[r][c + i] = wordObj.word[i];
                } else {
                    grid[r + i][c] = wordObj.word[i];
                }
            }
            placedWordsInfo.push({ ...wordObj, row: r, col: c, direction });
        }
        placeWords = function(words) {
            const firstWord = words.shift();
            if (!firstWord) return;
            const startRow = Math.floor(INTERNAL_GRID_SIZE / 2);
            const startCol = Math.floor((INTERNAL_GRID_SIZE - firstWord.word.length) / 2);
            placeSingleWord(firstWord, startRow, startCol, 'horizontal');
            let unplacedWords = [...words];
            let placedThisRound = true;
            while (unplacedWords.length > 0 && placedThisRound) {
                placedThisRound = false;
                const wordsToTry = [...unplacedWords];
                unplacedWords = [];
                for (const wordObj of wordsToTry) {
                    let bestPlacement = null;
                    for (const pWord of placedWordsInfo) {
                        for (let i = 0; i < wordObj.word.length; i++) {
                            for (let j = 0; j < pWord.word.length; j++) {
                                if (wordObj.word[i] === pWord.word[j]) {
                                    const direction = pWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
                                    let r, c;
                                    if (direction === 'vertical') {
                                        r = pWord.row - i;
                                        c = pWord.col + j;
                                    } else {
                                        r = pWord.row + j;
                                        c = pWord.col - i;
                                    }
                                    if (canPlaceWord(wordObj.word, r, c, direction)) {
                                        bestPlacement = { r, c, direction };
                                        break;
                                    }
                                }
                            }
                            if (bestPlacement) break;
                        }
                        if (bestPlacement) break;
                    }
                    if (bestPlacement) {
                        placeSingleWord(wordObj, bestPlacement.r, bestPlacement.c, bestPlacement.direction);
                        placedThisRound = true;
                    } else {
                        unplacedWords.push(wordObj);
                    }
                }
            }
            if (unplacedWords.length > 0) {
                const unplacedList = unplacedWords.map(w => w.word).join(', ');
                meldingContainer.textContent = `De volgende woorden konden niet worden geplaatst: ${unplacedList}.`;
                meldingContainer.style.color = '#d9534f';
            }
        }
        finalizeGrid = function() {
            if (placedWordsInfo.length === 0) return { puzzleGrid: [], wordData: [] };
            let minR = INTERNAL_GRID_SIZE, minC = INTERNAL_GRID_SIZE, maxR = 0, maxC = 0;
            placedWordsInfo.forEach(w => {
                minR = Math.min(minR, w.row);
                maxR = Math.max(maxR, w.direction === 'horizontal' ? w.row : w.row + w.word.length - 1);
                minC = Math.min(minC, w.col);
                maxC = Math.max(maxC, w.direction === 'horizontal' ? w.col + w.word.length - 1 : w.col);
            });
            const height = maxR - minR + 1;
            const width = maxC - minC + 1;
            const puzzleGridSize = Math.max(height, width) + 2;
            let puzzleGrid = Array(puzzleGridSize).fill(null).map(() => Array(puzzleGridSize).fill(null));
            let number = 1;
            placedWordsInfo.sort((a,b) => (a.row * INTERNAL_GRID_SIZE + a.col) - (b.row * INTERNAL_GRID_SIZE + b.col));
            const numberedPositions = {};
            const wordData = [];
            for (const word of placedWordsInfo) {
                const r = word.row - minR + 1;
                const c = word.col - minC + 1;
                const posKey = `${r},${c}`;
                let currentNumber = numberedPositions[posKey];
                if (!currentNumber) {
                    currentNumber = number;
                    numberedPositions[posKey] = number;
                    number++;
                }
                wordData.push({...word, number: currentNumber });
                for (let i = 0; i < word.word.length; i++) {
                    const curR = word.direction === 'vertical' ? r + i : r;
                    const curC = word.direction === 'horizontal' ? c + i : c;
                    if (!puzzleGrid[curR][curC]) {
                         puzzleGrid[curR][curC] = {};
                    }
                    puzzleGrid[curR][curC].letter = word.word[i];
                }
                puzzleGrid[r][c].number = currentNumber;
            }
            return { puzzleGrid, wordData };
        }
        displayClues = function(wordData) {
            const hList = document.getElementById("horizontal-clues-list");
            const vList = document.getElementById("vertical-clues-list");
            hList.innerHTML = "";
            vList.innerHTML = "";
            wordData.sort((a, b) => a.number - b.number);
            const handled = new Set();
            wordData.forEach(word => {
                const key = `${word.number}-${word.direction}`;
                if(handled.has(key)) return;
                const listItem = document.createElement('li');
                listItem.textContent = `${word.number}. ${word.clue}`;
                if (word.direction === 'horizontal') {
                    hList.appendChild(listItem);
                } else {
                    vList.appendChild(listItem);
                }
                handled.add(key);
            });
        }
        wrapTextAndCalcHeight = function(context, text, maxWidth, lineHeight) {
            const words = text.split(' ');
            let line = '';
            let lineCount = 0;
            if (words.length > 0) lineCount = 1;
            for (const word of words) {
                const testLine = line ? line + ' ' + word : word;
                if (context.measureText(testLine).width > maxWidth && line) {
                    lineCount++;
                    line = word;
                } else {
                    line = testLine;
                }
            }
            return lineCount * lineHeight;
        }
        drawWrappedText = function(context, text, x, y, maxWidth, lineHeight) {
            const words = text.split(' ');
            let line = '';
            let currentY = y;
            for (const word of words) {
                const testLine = line ? line + ' ' + word : word;
                if (context.measureText(testLine).width > maxWidth && line) {
                    context.fillText(line, x, currentY);
                    currentY += lineHeight;
                    line = word;
                } else {
                    line = testLine;
                }
            }
            context.fillText(line, x, currentY);
            return currentY - y + lineHeight;
        }
        downloadAs = function(type) {
            const { puzzleGrid, wordData } = finalizeGrid();
            if (!puzzleGrid || puzzleGrid.length === 0) {
                alert("Genereer eerst een puzzel voordat je deze downloadt.");
                return;
            }

            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            const uniqueClues = new Map();
            wordData.forEach(w => {
                const key = `${w.number}-${w.direction}`;
                if (!uniqueClues.has(key)) { uniqueClues.set(key, w); }
            });
            const sortedClues = Array.from(uniqueClues.values()).sort((a, b) => a.number - b.number);
            const hClues = sortedClues.filter(w => w.direction === 'horizontal');
            const vClues = sortedClues.filter(w => w.direction === 'vertical');

            const puzzleSize = 800;
            const padding = 50;
            const titleFontSize = 40;
            const clueTitleFontSize = 30;
            const clueFontSize = 24;
            const lineHeight = 30;
            const clueGap = 15;
            const columnWidth = (puzzleSize / 2) - (padding / 2);

            tempCtx.font = `${clueFontSize}px Arial`;
            let hCluesHeight = 0;
            hClues.forEach(clue => { hCluesHeight += wrapTextAndCalcHeight(tempCtx, `${clue.number}. ${clue.clue}`, columnWidth, lineHeight) + clueGap; });
            let vCluesHeight = 0;
            vClues.forEach(clue => { vCluesHeight += wrapTextAndCalcHeight(tempCtx, `${clue.number}. ${clue.clue}`, columnWidth, lineHeight) + clueGap; });

            const totalClueHeight = Math.max(hCluesHeight, vCluesHeight) + clueTitleFontSize + padding;
            const totalHeight = puzzleSize + titleFontSize + padding * 2 + totalClueHeight;
            
            tempCanvas.width = puzzleSize + padding * 2;
            tempCanvas.height = totalHeight;
            tempCtx.fillStyle = "#FFF";
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            tempCtx.fillStyle = "#004080";
            tempCtx.font = `bold ${titleFontSize}px Arial`;
            tempCtx.textAlign = "center";
            tempCtx.fillText("Kruiswoordpuzzel", tempCanvas.width / 2, padding);
            
            const gridSize = puzzleGrid.length;
            const cellSize = puzzleSize / gridSize;
            const gridX = padding;
            const gridY = padding + titleFontSize + 20;
            tempCtx.lineWidth = 2;
            tempCtx.strokeStyle = "#000";
            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    if (puzzleGrid[r][c]) {
                        tempCtx.strokeRect(gridX + c * cellSize, gridY + r * cellSize, cellSize, cellSize);
                        if (puzzleGrid[r][c].number) {
                            tempCtx.fillStyle = "#004080";
                            tempCtx.font = `bold ${cellSize * 0.3}px Arial`;
                            tempCtx.textAlign = "left";
                            tempCtx.textBaseline = "top";
                            tempCtx.fillText(puzzleGrid[r][c].number, gridX + c * cellSize + 4, gridY + r * cellSize + 4);
                        }
                    }
                }
            }
            
            let clueY = gridY + puzzleSize + 40;
            const hClueX = padding;
            const vClueX = tempCanvas.width / 2 + padding / 2;
            tempCtx.fillStyle = "#004080";
            tempCtx.font = `bold ${clueTitleFontSize}px Arial`;
            tempCtx.textAlign = "left";
            tempCtx.textBaseline = "top";
            tempCtx.fillText("Horizontaal", hClueX, clueY);
            tempCtx.fillText("Verticaal", vClueX, clueY);
            
            clueY += clueTitleFontSize + 10;
            tempCtx.fillStyle = "#000";
            tempCtx.font = `${clueFontSize}px Arial`;
            
            let currentHClueY = clueY;
            hClues.forEach(word => {
                const textBlockHeight = drawWrappedText(tempCtx, `${word.number}. ${word.clue}`, hClueX, currentHClueY, columnWidth, lineHeight);
                currentHClueY += textBlockHeight + clueGap;
            });

            let currentVClueY = clueY;
            vClues.forEach(word => {
                const textBlockHeight = drawWrappedText(tempCtx, `${word.number}. ${word.clue}`, vClueX, currentVClueY, columnWidth, lineHeight);
                currentVClueY += textBlockHeight + clueGap;
            });

            if (type === 'png') {
                const a = document.createElement("a");
                a.href = tempCanvas.toDataURL("image/png");
                a.download = "kruiswoordpuzzel.png";
                a.click();
            } else if (type === 'pdf') {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [tempCanvas.width, tempCanvas.height] });
                doc.addImage(tempCanvas.toDataURL("image/png"), 'PNG', 0, 0, tempCanvas.width, tempCanvas.height);
                doc.save("kruiswoordpuzzel.pdf");
            }
        }

        function generateCrossword() {
            cleanGrid();
            meldingContainer.textContent = "";
            
            const words = getKlassiekePuzzelData().sort((a, b) => b.word.length - a.word.length);
            
            if (words.length < 1) {
                meldingContainer.textContent = "Voer geldige woorden en omschrijvingen in (woord minstens 2 letters).";
                drawGrid({});
                displayClues([]);
                return;
            }

            placeWords(words);
            const puzzleData = finalizeGrid();
            drawGrid(puzzleData);
            displayClues(puzzleData.wordData);
        }

        generateBtn.addEventListener("click", generateCrossword);
        downloadPngBtn.addEventListener("click", () => downloadAs('png'));
        downloadPdfBtn.addEventListener("click", () => downloadAs('pdf'));
    }


    // ======================================================
    // LOGICA VOOR VERBORGEN WOORD PUZZEL
    // ======================================================
    function initVerborgenWoordGenerator() {
        // --- Referenties naar VW DOM elementen ---
        const verborgenWoordInput = document.getElementById("verborgenWoordInput");
        const startBtn = document.getElementById("vwStartBtn");
        const antwoordenContainer = document.getElementById("vwAntwoordenContainer");
        const generatorKnoppen = document.getElementById("vwGeneratorKnoppen");
        const genereerWerkbladBtn = document.getElementById("vwGenereerWerkbladBtn");
        const genereerOplossingBtn = document.getElementById("vwGenereerOplossingBtn");
        const werkbladContainer = document.getElementById("vwWerkbladContainer");
        const exportKnoppen = document.getElementById("vw-export-knoppen");
        const printBtn = document.getElementById("vwPrintBtn");
        const downloadPngBtn = document.getElementById("vwDownloadPngBtn");
        const downloadPdfBtn = document.getElementById("vwDownloadPdfBtn");

        // --- Event Listeners ---
        startBtn.addEventListener("click", setupInvulVelden);
        genereerWerkbladBtn.addEventListener("click", () => genereerWerkblad(false));
        genereerOplossingBtn.addEventListener("click", () => genereerWerkblad(true));
        printBtn.addEventListener("click", () => window.print());
        downloadPngBtn.addEventListener("click", () => vwDownloadAs('png'));
        downloadPdfBtn.addEventListener("click", () => vwDownloadAs('pdf'));
        
        // --- Functies ---
        function setupInvulVelden() {
            const woord = verborgenWoordInput.value.toUpperCase().replace(/[^A-Z]/g, '');
            if (woord.length < 3) {
                alert("Voer een verborgen woord van minstens 3 letters in.");
                return;
            }
            verborgenWoordInput.value = woord;
            antwoordenContainer.innerHTML = '';
            
            for (let i = 0; i < woord.length; i++) {
                const letter = woord[i];
                const rij = document.createElement('div');
                rij.className = 'vw-antwoord-rij';
                rij.innerHTML = `
                    <span class="vw-letter-indicator">${letter}</span>
                    <input type="text" class="vw-antwoord-input" data-letter="${letter}" placeholder="Antwoord (bevat '${letter}')">
                    <input type="text" class="vw-omschrijving-input" placeholder="Omschrijving">
                `;
                antwoordenContainer.appendChild(rij);
            }
            generatorKnoppen.classList.remove('verborgen');
        }

        function verzamelPuzzelData() {
            const data = [];
            const rijen = antwoordenContainer.querySelectorAll('.vw-antwoord-rij');
            let isGeldig = true;
            
            rijen.forEach((rij, index) => {
                const antwoordInput = rij.querySelector('.vw-antwoord-input');
                const omschrijvingInput = rij.querySelector('.vw-omschrijving-input');
                const antwoord = antwoordInput.value.toUpperCase().replace(/[^A-Z]/g, '');
                const vereisteLetter = antwoordInput.dataset.letter;

                antwoordInput.classList.remove('vw-error');
                if (!antwoord || !omschrijvingInput.value || antwoord.indexOf(vereisteLetter) === -1) {
                    isGeldig = false;
                    antwoordInput.classList.add('vw-error');
                }

                data.push({
                    antwoord: antwoord,
                    omschrijving: omschrijvingInput.value,
                    verborgenLetter: vereisteLetter,
                    nummer: index + 1
                });
            });
            
            return isGeldig ? data : null;
        }

        function genereerWerkblad(isOplossing) {
            const puzzelData = verzamelPuzzelData();
            if (!puzzelData) {
                alert("Controleer de invoer. Elk veld moet ingevuld zijn en het antwoord moet de juiste letter bevatten.");
                return;
            }

            let maxVoorvoegsel = 0;
            puzzelData.forEach(item => {
                const positie = item.antwoord.indexOf(item.verborgenLetter);
                if (positie > maxVoorvoegsel) maxVoorvoegsel = positie;
            });

            let roosterHTML = '<table class="vw-puzzel-rooster">';
            let omschrijvingenHTML = '<ol class="vw-omschrijvingen-lijst">';

            puzzelData.forEach(item => {
                omschrijvingenHTML += `<li>${item.omschrijving}</li>`;
                roosterHTML += '<tr>';
                const letterPositie = item.antwoord.indexOf(item.verborgenLetter);
                roosterHTML += `<td class="leeg nummer-cel"><span class="vw-nummer">${item.nummer}</span></td>`;
                for (let i = 0; i < maxVoorvoegsel - letterPositie; i++) {
                    roosterHTML += '<td class="leeg"></td>';
                }
                for (let i = 0; i < item.antwoord.length; i++) {
                    const celKlasse = (i === letterPositie) ? 'verborgen-letter-cel' : '';
                    const celInhoud = isOplossing ? item.antwoord[i] : '';
                    roosterHTML += `<td class="${celKlasse}">${celInhoud}</td>`;
                }
                roosterHTML += '</tr>';
            });

            roosterHTML += '</table>';
            omschrijvingenHTML += '</ol>';
            
            const verborgenWoordOplossing = isOplossing ? `<p>Het verborgen woord is: <strong>${verborgenWoordInput.value}</strong></p>` : `<p>Het verborgen woord is: <strong>${'_ '.repeat(verborgenWoordInput.value.length)}</strong></p>`;

            werkbladContainer.innerHTML = `
                <h2>Verborgen Woord Puzzel</h2>
                <p>Vul de omschrijvingen in. Schrijf het woord in het rooster. Welk woord lees je in de gekleurde vakjes?</p>
                ${omschrijvingenHTML}
                ${roosterHTML}
                ${verborgenWoordOplossing}
            `;
            exportKnoppen.classList.remove('verborgen');
        }

        function vwDownloadAs(type) {
            const puzzelData = verzamelPuzzelData();
            if (!puzzelData) {
                alert("Genereer eerst een geldige puzzel voordat je deze downloadt.");
                return;
            }

            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            
            const padding = 50;
            const contentWidth = 800;
            const titleFontSize = 32;
            const instructionFontSize = 16;
            const clueFontSize = 16;
            const clueLineHeight = 24;
            const gridCellSize = 35;
            const numberFontSize = 16;
            const finalWordFontSize = 18;

            let currentY = padding;
            ctx.font = `bold ${titleFontSize}px Arial`;
            currentY += titleFontSize + 10;
            ctx.font = `${instructionFontSize}px Arial`;
            currentY += instructionFontSize + 30;
            
            ctx.font = `${clueFontSize}px Arial`;
            puzzelData.forEach(item => {
                currentY += clueLineHeight;
            });
            currentY += 30;

            currentY += puzzelData.length * gridCellSize + 40;
            currentY += finalWordFontSize + padding;
            const totalHeight = currentY;
            const totalWidth = contentWidth + 2 * padding;

            tempCanvas.width = totalWidth;
            tempCanvas.height = totalHeight;

            ctx.fillStyle = "#FFF";
            ctx.fillRect(0, 0, totalWidth, totalHeight);

            currentY = padding;
            ctx.fillStyle = "#004080";
            ctx.font = `bold ${titleFontSize}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText("Verborgen Woord Puzzel", totalWidth / 2, currentY);
            currentY += titleFontSize + 10;
            
            ctx.fillStyle = "#000";
            ctx.font = `${instructionFontSize}px Arial`;
            ctx.fillText("Vul de omschrijvingen in. Schrijf het woord in het rooster. Welk woord lees je in de gekleurde vakjes?", totalWidth / 2, currentY);
            currentY += instructionFontSize + 30;

            ctx.textAlign = "left";
            puzzelData.forEach(item => {
                ctx.fillText(`${item.nummer}. ${item.omschrijving}`, padding, currentY);
                currentY += clueLineHeight;
            });
            currentY += 30;

            let maxVoorvoegsel = 0;
            let maxWoordLengte = 0;
            puzzelData.forEach(item => {
                const positie = item.antwoord.indexOf(item.verborgenLetter);
                if (positie > maxVoorvoegsel) maxVoorvoegsel = positie;
                if (item.antwoord.length > maxWoordLengte) maxWoordLengte = item.antwoord.length;
            });

            const gridStartX = (totalWidth - (maxVoorvoegsel + maxWoordLengte) * gridCellSize) / 2;
            const gridStartY = currentY;

            ctx.strokeStyle = "#333";
            ctx.lineWidth = 1;

            puzzelData.forEach((item, index) => {
                const y = gridStartY + index * gridCellSize;
                
                ctx.fillStyle = "#333";
                ctx.font = `bold ${numberFontSize}px Arial`;
                ctx.textAlign = "right";
                ctx.textBaseline = "middle";
                ctx.fillText(item.nummer, gridStartX - 10, y + gridCellSize / 2);

                const letterPositie = item.antwoord.indexOf(item.verborgenLetter);
                for(let i = 0; i < item.antwoord.length; i++) {
                    const x = gridStartX + (maxVoorvoegsel - letterPositie + i) * gridCellSize;
                    if (i === letterPositie) {
                        ctx.fillStyle = "#ffeca7";
                        ctx.fillRect(x, y, gridCellSize, gridCellSize);
                    }
                    ctx.strokeRect(x, y, gridCellSize, gridCellSize);
                }
            });
            currentY += puzzelData.length * gridCellSize + 40;

            ctx.fillStyle = "#000";
            ctx.font = `${finalWordFontSize}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(`Het verborgen woord is: ${'_ '.repeat(verborgenWoordInput.value.length)}`, totalWidth / 2, currentY);

            if (type === 'png') {
                const a = document.createElement("a");
                a.href = tempCanvas.toDataURL("image/png");
                a.download = "verborgen-woord-puzzel.png";
                a.click();
            } else if (type === 'pdf') {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [totalWidth, totalHeight] });
                doc.addImage(tempCanvas.toDataURL("image/png"), 'PNG', 0, 0, totalWidth, totalHeight);
                doc.save("verborgen-woord-puzzel.pdf");
            }
        }
    }
});