const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Globale variabelen om de huidige puzzelstatus bij te houden
let currentPuzzleState = {};
let solutionVisible = false;

// Helper function to get random integer
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get a random letter
function getRandomLetter() {
    return ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
}

/**
 * Places a word into the grid at a given starting position and direction.
 * @param {Array<Array<string>>} grid The puzzle grid.
 * @param {string} word The word to place.
 * @param {number} row The starting row.
 * @param {number} col The starting column.
 * @param {number} dr The row increment (-1, 0, or 1).
 * @param {number} dc The column increment (-1, 0, or 1).
 * @returns {boolean} True if the word was successfully placed, false otherwise.
 */
function placeWord(grid, word, row, col, dr, dc) {
    const wordLength = word.length;
    const gridSize = grid.length;

    for (let i = 0; i < wordLength; i++) {
        const r = row + i * dr;
        const c = col + i * dc;
        if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) {
            return false;
        }
        if (grid[r][c] !== "" && grid[r][c] !== word[i]) {
            return false;
        }
    }

    for (let i = 0; i < wordLength; i++) {
        const r = row + i * dr;
        const c = col + i * dc;
        grid[r][c] = word[i];
    }
    return true;
}

/**
 * Generates a word search puzzle grid.
 * @param {Array<string>} words The list of words to include.
 * @param {number} gridSize The size of the square grid.
 * @param {Object} directions An object indicating allowed directions.
 * @returns {Object} An object containing the grid, placed words, unplaced words, and their locations.
 */
function generateWordSearch(words, gridSize, directions) {
    let grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(""));
    const possibleDirections = [];
    
    let successfullyPlacedWords = [];
    let unplacedWords = [];
    let wordLocations = []; 

    if (directions.horizontaal) possibleDirections.push({ dr: 0, dc: 1 });
    if (directions.verticaal) possibleDirections.push({ dr: 1, dc: 0 });
    if (directions.diagonaal) {
        // AANGEPAST: Diagonale richtingen starten nu altijd links.
        possibleDirections.push({ dr: 1, dc: 1 });  // Van linksboven naar rechtsonder
        possibleDirections.push({ dr: -1, dc: 1 }); // Van linksonder naar rechtsboven
    }

    if (possibleDirections.length === 0) possibleDirections.push({ dr: 0, dc: 1 });

    words.sort((a, b) => b.length - a.length);

    for (const word of words) {
        let wordPlaced = false;
        const shuffledDirections = [...possibleDirections].sort(() => Math.random() - 0.5);

        for (const direction of shuffledDirections) {
            if (wordPlaced) break;
            
            for (let i = 0; i < 150; i++) {
                const startRow = getRandomInt(0, gridSize - 1);
                const startCol = getRandomInt(0, gridSize - 1);
                const { dr, dc } = direction;

                let tempGrid = JSON.parse(JSON.stringify(grid));
                if (placeWord(tempGrid, word, startRow, startCol, dr, dc)) {
                    grid = tempGrid;
                    wordPlaced = true;
                    successfullyPlacedWords.push(word);
                    wordLocations.push({ word, row: startRow, col: startCol, dr, dc });
                    break;
                }
            }
        }

        if (!wordPlaced) {
            unplacedWords.push(word);
            console.warn(`Kon woord niet plaatsen: ${word}`);
        }
    }

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (grid[r][c] === "") grid[r][c] = getRandomLetter();
        }
    }

    return { grid, successfullyPlacedWords, unplacedWords, wordLocations };
}

/**
 * Tekent de volledige puzzel op het canvas, inclusief de oplossing indien nodig.
 */
function drawPuzzle() {
    if (!currentPuzzleState.grid) return;

    const { grid, gridSize } = currentPuzzleState;
    const vakBreedte = canvas.width / gridSize;
    const vakHoogte = canvas.height / gridSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Teken letters
    ctx.font = `${Math.min(vakHoogte * 0.6, 30)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            ctx.fillText(grid[r][c], c * vakBreedte + vakBreedte / 2, r * vakHoogte + vakHoogte / 2);
        }
    }
    
    // Teken rasterlijnen
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * vakBreedte, 0);
        ctx.lineTo(i * vakBreedte, canvas.height);
        ctx.stroke();
    }
    for (let j = 0; j <= gridSize; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * vakHoogte);
        ctx.lineTo(canvas.width, j * vakHoogte);
        ctx.stroke();
    }

    // Teken oplossing indien zichtbaar
    if (solutionVisible) {
        drawSolution();
    }
}

/**
 * Tekent de highlight-lijnen voor de oplossing.
 */
function drawSolution() {
    const { wordLocations, gridSize } = currentPuzzleState;
    if (!wordLocations || wordLocations.length === 0) return;

    const vakBreedte = canvas.width / gridSize;
    const vakHoogte = canvas.height / gridSize;

    ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)'; // Felgeel, half-transparant
    ctx.lineWidth = vakHoogte * 0.7;
    ctx.lineCap = 'round';

    wordLocations.forEach(loc => {
        const startX = loc.col * vakBreedte + vakBreedte / 2;
        const startY = loc.row * vakHoogte + vakHoogte / 2;
        const endX = (loc.col + (loc.word.length - 1) * loc.dc) * vakBreedte + vakBreedte / 2;
        const endY = (loc.row + (loc.word.length - 1) * loc.dr) * vakHoogte + vakHoogte / 2;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    });
}


/**
 * Schakelt de zichtbaarheid van de oplossing.
 */
function toggleSolution() {
    if (Object.keys(currentPuzzleState).length === 0) return; 
    
    solutionVisible = !solutionVisible;
    const btn = document.getElementById("toonOplossingBtn");
    btn.textContent = solutionVisible ? "Verberg Oplossing" : "Toon Oplossing";
    
    drawPuzzle();
}

function updateWordCountMessage(currentWordCount) {
    const woordAantalMelding = document.getElementById("woordAantalMelding");
    const MIN_WORDS = 6;
    const MAX_WORDS = 20;

    if (currentWordCount < MIN_WORDS) {
        const remaining = MIN_WORDS - currentWordCount;
        woordAantalMelding.textContent = `Je moet nog ${remaining} woord(en) toevoegen.`;
        woordAantalMelding.style.color = "red";
    } else if (currentWordCount > MAX_WORDS) {
        const excess = currentWordCount - MAX_WORDS;
        woordAantalMelding.textContent = `Te veel woorden: ${excess} woord(en) worden genegeerd.`;
        woordAantalMelding.style.color = "orange";
    } else {
        woordAantalMelding.textContent = `Aantal woorden: ${currentWordCount} (OK)`;
        woordAantalMelding.style.color = "#004080";
    }
}


/**
 * Hoofdfunctie om de woordzoeker te genereren en weer te geven.
 */
function genereerWoordzoeker() {
    const woordenInput = document.getElementById("woordenInput").value;
    let woorden = woordenInput.split('\n')
                              .map(word => word.trim().toUpperCase())
                              .filter(word => word.length > 0 && /^[A-Z]+$/.test(word));

    updateWordCountMessage(woorden.length);

    const rasterFormaat = document.getElementById("rasterFormaat").value;
    let gridSize;

    const MIN_WORDS = 6, MAX_WORDS = 20, MAX_WORD_LENGTH = 12, MIN_GRID_SIZE_AUTO = 8;
    const meldingContainer = document.getElementById("meldingContainer");
    meldingContainer.innerHTML = "";
    meldingContainer.style.color = "#004080";

    if (woorden.length < MIN_WORDS) {
        meldingContainer.style.color = "red";
        meldingContainer.innerHTML = `Voer minimaal ${MIN_WORDS} geldige woorden in.`;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        document.getElementById("woordenLijst").innerHTML = "";
        return;
    }

    if (woorden.length > MAX_WORDS) woorden = woorden.slice(0, MAX_WORDS);
    
    let needsTruncationWarning = false;
    woorden = woorden.map(word => {
        if (word.length > MAX_WORD_LENGTH) {
            needsTruncationWarning = true;
            return word.substring(0, MAX_WORD_LENGTH);
        }
        return word;
    });

    if (needsTruncationWarning) {
        meldingContainer.style.color = "orange";
        meldingContainer.innerHTML += `Sommige woorden zijn afgekapt tot ${MAX_WORD_LENGTH} letters.<br>`;
    }
    
    const selectedGridSize = parseInt(rasterFormaat.split('x')[0]);
    if ([6, 8, 10].includes(selectedGridSize)) {
        let maxLen = Math.max(...woorden.map(w => w.length));
        if (maxLen > selectedGridSize) {
             meldingContainer.style.color = "orange";
             meldingContainer.innerHTML += `Let op: Raster van ${selectedGridSize}x${selectedGridSize} is krap voor woorden langer dan ${selectedGridSize} letters.<br>`;
        }
    }

    if (rasterFormaat === "auto") {
        let maxWordLength = Math.max(...woorden.map(w => w.length));
        gridSize = Math.max(maxWordLength + 3, Math.ceil(Math.sqrt(woorden.length) * 3) + 3);
        gridSize = Math.min(gridSize, 25); 
        gridSize = Math.max(gridSize, MIN_GRID_SIZE_AUTO);
    } else {
        gridSize = parseInt(rasterFormaat.split('x')[0]);
    }

    const allowedDirections = {
        horizontaal: document.querySelector('input[value="horizontaal"]').checked,
        verticaal: document.querySelector('input[value="verticaal"]').checked,
        diagonaal: document.querySelector('input[value="diagonaal"]').checked
    };

    if (!allowedDirections.horizontaal && !allowedDirections.verticaal && !allowedDirections.diagonaal) {
        meldingContainer.style.color = "red";
        meldingContainer.innerHTML += "Selecteer minstens één zoekrichting.";
        ctx.clearRect(0,0,canvas.width,canvas.height);
        document.getElementById("woordenLijst").innerHTML = "";
        return;
    }
    
    const result = generateWordSearch(woorden, gridSize, allowedDirections);
    
    currentPuzzleState = {
        grid: result.grid,
        gridSize: gridSize,
        wordLocations: result.wordLocations
    };
    
    solutionVisible = false;
    document.getElementById("toonOplossingBtn").textContent = "Toon Oplossing";

    drawPuzzle();

    if (result.unplacedWords.length > 0) {
        meldingContainer.style.color = "red";
        meldingContainer.innerHTML += `<b>Opgelet:</b> De volgende woorden konden niet geplaatst worden: ${result.unplacedWords.join(', ')}. Probeer een groter raster.`;
    }

    const woordenLijstDiv = document.getElementById("woordenLijst");
    woordenLijstDiv.innerHTML = "";
    result.successfullyPlacedWords.sort();
    const ul = document.createElement("ul");
    ul.className = "kolommen";
    result.successfullyPlacedWords.forEach(word => {
        const li = document.createElement("li");
        li.textContent = word;
        ul.appendChild(li);
    });
    woordenLijstDiv.appendChild(ul);
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    genereerWoordzoeker();

    document.getElementById("genereerBtn").addEventListener("click", genereerWoordzoeker);
    document.getElementById("toonOplossingBtn").addEventListener("click", toggleSolution);
    document.getElementById("woordenInput").addEventListener("input", genereerWoordzoeker);
    document.getElementById("rasterFormaat").addEventListener("change", genereerWoordzoeker);
    document.querySelectorAll('input[name="richting"]').forEach(checkbox => {
        checkbox.addEventListener("change", genereerWoordzoeker);
    });
});

// Download functions
document.getElementById("downloadPngBtn").addEventListener("click", () => {
    const wasVisible = solutionVisible;
    if (wasVisible) {
        toggleSolution(); 
    }

    const dataURL = canvas.toDataURL("image/png");
    const a = document.createElement("a");
a.href = dataURL;
    a.download = "woordzoeker.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (wasVisible) {
        toggleSolution();
    }
});

document.getElementById("downloadPdfBtn").addEventListener("click", async () => {
    const wasVisible = solutionVisible;
    if (wasVisible) {
        toggleSolution();
    }

    const dataURL = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 64, 128);
    doc.text("Woordzoeker", pageWidth / 2, 20, { align: 'center' });

    const imgWidth = canvas.width, imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    let pdfImgWidth = pageWidth * 0.8;
    let pdfImgHeight = pdfImgWidth / ratio;
    if (pdfImgHeight > pageHeight * 0.55) {
        pdfImgHeight = pageHeight * 0.55;
        pdfImgWidth = pdfImgHeight * ratio;
    }
    const xPosImg = (pageWidth - pdfImgWidth) / 2;
    const yPosImg = 30;
    doc.addImage(dataURL, 'PNG', xPosImg, yPosImg, pdfImgWidth, pdfImgHeight);

    const woorden = Array.from(document.querySelectorAll('#woordenLijst li')).map(li => li.textContent);
    const listTitleFontSize = 16, wordFontSize = 12, lineHeight = 7, listMarginTop = 10;
    let listStartY = yPosImg + pdfImgHeight + listMarginTop;
    const estimatedListHeight = listTitleFontSize / doc.internal.scaleFactor + (Math.ceil(woorden.length / 3) * lineHeight) + 10;
    if (listStartY + estimatedListHeight > pageHeight) {
        doc.addPage();
        listStartY = 20;
    }

    doc.setFontSize(listTitleFontSize);
    doc.setTextColor(0, 64, 128);
    doc.text("Woorden om te vinden:", 20, listStartY);

    listStartY += listTitleFontSize / 2 + 5;
    doc.setFontSize(wordFontSize);
    doc.setTextColor(0, 0, 0);

    const outerMargin = 20, columnGap = 20, bulletRadius = 2.5, bulletTextGap = 2, columnPadding = 5;
    const totalContentWidth = pageWidth - (2 * outerMargin);
    const singleColumnWidth = (totalContentWidth - (2 * columnGap)) / 3;
    let itemsPerColumn = Math.ceil(woorden.length / 3);
    if (itemsPerColumn === 0) itemsPerColumn = 1;

    for (let i = 0; i < woorden.length; i++) {
        const word = woorden[i];
        const currentColumnIndex = Math.floor(i / itemsPerColumn);
        let currentWordY = listStartY + (i % itemsPerColumn) * lineHeight;
        let currentColumnX = outerMargin + currentColumnIndex * (singleColumnWidth + columnGap);
        doc.circle(currentColumnX + bulletRadius + columnPadding, currentWordY - lineHeight / 2 + (wordFontSize / doc.internal.scaleFactor / 2), bulletRadius, 'D');
        doc.text(word, currentColumnX + bulletRadius * 2 + bulletTextGap + columnPadding, currentWordY);
    }
    doc.save("woordzoeker.pdf");
    
    if (wasVisible) {
        toggleSolution();
    }
});