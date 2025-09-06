document.addEventListener("DOMContentLoaded", () => {
    // --- Globale Variabelen ---
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    const controls = {
        typeOefening: () => document.querySelector('input[name="typeOefening"]:checked').value,
        niveau: () => parseInt(document.getElementById("niveau").value),
        numGrids: () => parseInt(document.querySelector('input[name="numGrids"]:checked').value),
        brug: () => document.querySelector('input[name="brug"]:checked').value
    };

    // --- Hulpfuncties ---

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function checkBridging(num1, num2, operation, brugType) {
        if (brugType === 'beide' || num1 < 10 || num2 < 10) return true;

        const units1 = num1 % 10;
        const units2 = num2 % 10;
        let isBridging;

        if (operation === '+') {
            isBridging = (units1 + units2) >= 10;
        } else { // '-'
            isBridging = (units1 < units2);
        }

        return (brugType === 'met' && isBridging) || (brugType === 'zonder' && !isBridging);
    }

    // --- Functies voor het genereren van oefeningen ---

    function generateTriangleData() {
        const { niveau, brug, typeOefening } = {
            niveau: controls.niveau(),
            brug: controls.brug(),
            typeOefening: controls.typeOefening()
        };
        
        let attempts = 0;
        while (attempts < 20000) {
            attempts++;
            const maxTerm = Math.max(5, Math.floor(niveau * 0.6));
            let a = getRandomInt(1, maxTerm);
            let b = getRandomInt(1, maxTerm);
            let c = getRandomInt(1, maxTerm);

            const sums = { sumAB: a + b, sumAC: a + c, sumBC: b + c };

            if (sums.sumAB > niveau || sums.sumAC > niveau || sums.sumBC > niveau) continue;

            if (typeOefening === 'zoekSom') {
                const check1 = checkBridging(a, b, '+', brug);
                const check2 = checkBridging(a, c, '+', brug);
                const check3 = checkBridging(b, c, '+', brug);
                if (check1 && check2 && check3) {
                     const fullSolution = { a, b, c, ...sums };
                     let displayData = { ...fullSolution, sumAB: '?', sumAC: '?', sumBC: '?' };
                     return { display: displayData, solution: fullSolution };
                }
            } else { // 'zoekTerm'
                const possibleSolutions = [
                    { term: 'a', sum: 'sumAC', check: checkBridging(sums.sumAC, c, '-', brug) },
                    { term: 'a', sum: 'sumAB', check: checkBridging(sums.sumAB, b, '-', brug) },
                    { term: 'b', sum: 'sumAB', check: checkBridging(sums.sumAB, a, '-', brug) },
                    { term: 'b', sum: 'sumBC', check: checkBridging(sums.sumBC, c, '-', brug) },
                    { term: 'c', sum: 'sumAC', check: checkBridging(sums.sumAC, a, '-', brug) },
                    { term: 'c', sum: 'sumBC', check: checkBridging(sums.sumBC, b, '-', brug) },
                ].filter(s => s.check);

                if (possibleSolutions.length > 0) {
                    const chosenSolution = possibleSolutions[getRandomInt(0, possibleSolutions.length - 1)];
                    const fullSolution = { a, b, c, ...sums };
                    
                    const displayData = { a: '?', b: '?', c: '?', sumAB: '?', sumAC: '?', sumBC: '?' };

                    // Toon de relevante som
                    displayData[chosenSolution.sum] = fullSolution[chosenSolution.sum];

                    // Toon de twee binnentermen die nodig zijn om de puzzel volledig op te lossen
                    if (chosenSolution.sum === 'sumAB') {
                        displayData.c = fullSolution.c; // Extra getal
                        if (chosenSolution.term === 'a') displayData.b = fullSolution.b;
                        else displayData.a = fullSolution.a;
                    } else if (chosenSolution.sum === 'sumAC') {
                        displayData.b = fullSolution.b; // Extra getal
                        if (chosenSolution.term === 'a') displayData.c = fullSolution.c;
                        else displayData.a = fullSolution.a;
                    } else if (chosenSolution.sum === 'sumBC') {
                        displayData.a = fullSolution.a; // Extra getal
                        if (chosenSolution.term === 'b') displayData.c = fullSolution.c;
                        else displayData.b = fullSolution.b;
                    }

                    return { display: displayData, solution: fullSolution };
                }
            }
        }
        document.getElementById("meldingContainer").textContent = "Kon geen oefening maken met deze strenge eisen. Probeer een andere combinatie (bv. 'Beide').";
        return null;
    }

    // --- Tekenfuncties (ongewijzigd) ---

    function drawField(value, x, y, boxSize) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (value === "?") {
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#aaaaaa";
            ctx.lineWidth = 1.5;
            const size = boxSize * 1.5;
            ctx.strokeRect(x - size / 2, y - size / 2, size, size);
        } else {
            ctx.fillStyle = "#004080";
            ctx.font = `bold ${boxSize}px Arial`;
            ctx.fillText(value, x, y);
        }
        ctx.restore();
    }

    function drawSingleTriangle(data, xOffset, yOffset, width) {
        if (!data) return;
        const height = width * (Math.sqrt(3) / 2);
        const p = (point) => ({ x: xOffset + point.x * width, y: yOffset + point.y * height });
        const top = { x: 0.5, y: 0 }, left = { x: 0, y: 1 }, right = { x: 1, y: 1 };
        const midTopLeft = { x: (top.x + left.x) / 2, y: (top.y + left.y) / 2 };
        const midTopRight = { x: (top.x + right.x) / 2, y: (top.y + right.y) / 2 };
        const midBottom = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };

        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        [[top, left], [left, right], [right, top], [midTopLeft, midTopRight], [midTopRight, midBottom], [midBottom, midTopLeft]].forEach(line => {
            ctx.beginPath();
            ctx.moveTo(p(line[0]).x, p(line[0]).y);
            ctx.lineTo(p(line[1]).x, p(line[1]).y);
            ctx.stroke();
        });

        const boxSize = width * 0.1;
        const posA = p({ x: (top.x + midTopLeft.x + midTopRight.x) / 3, y: (top.y + midTopLeft.y + midTopRight.y) / 3 });
        const posB = p({ x: (left.x + midTopLeft.x + midBottom.x) / 3, y: (left.y + midTopLeft.y + midBottom.y) / 3 });
        const posC = p({ x: (right.x + midTopRight.x + midBottom.x) / 3, y: (right.y + midTopRight.y + midBottom.y) / 3 });

        drawField(data.a, posA.x, posA.y, boxSize);
        drawField(data.b, posB.x, posB.y, boxSize);
        drawField(data.c, posC.x, posC.y, boxSize);

        const sumBoxSize = width * 0.09;
        drawField(data.sumAB, p(midTopLeft).x - width * 0.1, p(midTopLeft).y, sumBoxSize);
        drawField(data.sumAC, p(midTopRight).x + width * 0.1, p(midTopRight).y, sumBoxSize);
        drawField(data.sumBC, p(midBottom).x, p(midBottom).y + height * 0.1, sumBoxSize);
    }

    // --- Hoofdfunctie ---
    function generateWorksheet() {
        document.getElementById("meldingContainer").textContent = "";
        const numGrids = controls.numGrids();
        let cols, rows;
        if (numGrids === 1) { cols = 1; rows = 1; } else if (numGrids === 2) { cols = 2; rows = 1; } else if (numGrids === 4) { cols = 2; rows = 2; } else if (numGrids === 6) { cols = 2; rows = 3; }

        const singleWidth = 250;
        const singleHeight = singleWidth * 0.95;
        const padding = 25;
        canvas.width = (singleWidth * cols) + (padding * (cols + 1));
        canvas.height = (singleHeight * rows) + (padding * (rows + 1));
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < numGrids; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const xOffset = padding + (col * (singleWidth + padding));
            const yOffset = padding + (row * (singleHeight + padding)) + (singleWidth * 0.05);

            const triangle = generateTriangleData();
            if(triangle) {
                drawSingleTriangle(triangle.display, xOffset, yOffset, singleWidth * 0.9);
            }
        }
    }
    
    // --- Event Listeners ---
    function setupEventListeners() {
        document.getElementById("genereerBtn").addEventListener("click", generateWorksheet);
        document.querySelectorAll('#controls input, #controls select').forEach(el => {
            el.addEventListener("change", generateWorksheet);
        });
        document.getElementById("downloadPngBtn").addEventListener("click", () => {
            const a = document.createElement("a");
            a.href = canvas.toDataURL("image/png");
            a.download = "rekendriehoeken.png";
            a.click();
        });
        document.getElementById("downloadPdfBtn").addEventListener("click", () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const dataURL = canvas.toDataURL("image/png");
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const ratio = canvas.width / canvas.height;
            let pdfImgWidth = pageWidth - 20;
            let pdfImgHeight = pdfImgWidth / ratio;
            if (pdfImgHeight > pageHeight - 20) {
                pdfImgHeight = pageHeight - 20;
                pdfImgWidth = pdfImgHeight * ratio;
            }
            const xPos = (pageWidth - pdfImgWidth) / 2;
            const yPos = 10;
            doc.addImage(dataURL, 'PNG', xPos, yPos, pdfImgWidth, pdfImgHeight);
            doc.save("rekendriehoeken-werkblad.pdf");
        });
    }

    // --- Initialisatie ---
    setupEventListeners();
    generateWorksheet();
});