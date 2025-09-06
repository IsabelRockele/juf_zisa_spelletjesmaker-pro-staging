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
    const NUM_SEGMENTS = 6;

    // --- Hulpfuncties ---
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Controleer of een oefening met/zonder brug is, en filter volgens de keuze.
     * - operation '+' => brug indien eenheden optellen tot >= 10
     * - operation '-' => brug indien lenen nodig is (units1 < units2)
     * - brugType: 'met' | 'zonder' | 'beide'
     */
    function checkBridging(num1, num2, operation, brugType) {
        if (brugType === 'beide') return true;

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

    function generateCircleData() {
        const { niveau, brug, typeOefening } = {
            niveau: controls.niveau(),
            brug: controls.brug(),
            typeOefening: controls.typeOefening()
        };

        let attempts = 0;
        while (attempts < 200) {
            attempts++;
            const centerNumber = getRandomInt(Math.min(10, niveau), niveau);
            let solutionPairs = [];
            let isValidSet = true;

            for (let i = 0; i < NUM_SEGMENTS; i++) {
                const term1 = getRandomInt(1, centerNumber - 1);
                const term2 = centerNumber - term1;
                
                let checkIsValid;
                if (typeOefening === 'zoekSom') {
                    // Gebruiker telt op, dus we checken de optelling
                    checkIsValid = checkBridging(term1, term2, '+', brug);
                } else { // 'zoekTerm'
                    // Gebruiker trekt af, dus we checken de aftrekking (centerNumber - term1)
                    checkIsValid = checkBridging(centerNumber, term1, '-', brug);
                }

                if (checkIsValid) {
                    solutionPairs.push({ inner: term1, outer: term2 });
                } else {
                    isValidSet = false;
                    break; // Deze set voldoet niet, probeer een nieuwe centerNumber
                }
            }
            
            if (isValidSet) {
                // Maak de display-data op basis van het type oefening
                let displayData;
                if (typeOefening === 'zoekSom') {
                    displayData = { center: '?', pairs: solutionPairs };
                } else { // 'zoekTerm'
                    const displayPairs = solutionPairs.map(pair => {
                        // Verberg willekeurig de binnenste of buitenste term
                        if (Math.random() > 0.5) {
                            return { inner: '?', outer: pair.outer };
                        } else {
                            return { inner: pair.inner, outer: '?' };
                        }
                    });
                    displayData = { center: centerNumber, pairs: displayPairs };
                }
                const solutionData = { center: centerNumber, pairs: solutionPairs };
                return { display: displayData, solution: solutionData };
            }
        }
        
        document.getElementById("meldingContainer").textContent = "Kon geen oefening maken met deze strenge eisen. Probeer een andere combinatie (bv. 'Beide').";
        return null;
    }

    // --- Tekenfuncties ---

    function drawField(value, x, y, boxSize) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (value === "?") {
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#aaaaaa";
            ctx.lineWidth = 1.5;
            const size = boxSize * 1.8;
            ctx.strokeRect(x - size / 2, y - size / 2, size, size);
        } else {
            ctx.fillStyle = "#004080";
            ctx.font = `bold ${boxSize}px Arial`;
            ctx.fillText(value, x, y);
        }
        ctx.restore();
    }

    function drawSingleCircle(data, xOffset, yOffset, width) {
        if (!data) return;
        const radius = width / 2;
        const centerX = xOffset + radius;
        const centerY = yOffset + radius;

        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;

        // Teken de cirkels
        const centerRadius = radius * 0.25;
        const innerRingRadius = radius * 0.6;
        const outerRingRadius = radius;

        ctx.beginPath();
        ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRingRadius, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRingRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // Teken de scheidingslijnen
        for (let i = 0; i < NUM_SEGMENTS; i++) {
            const angle = (i / NUM_SEGMENTS) * 2 * Math.PI;
            const startX = centerX + Math.cos(angle) * centerRadius;
            const startY = centerY + Math.sin(angle) * centerRadius;
            const endX = centerX + Math.cos(angle) * outerRingRadius;
            const endY = centerY + Math.sin(angle) * outerRingRadius;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Teken de getallen
        const boxSize = radius * 0.12;
        drawField(data.center, centerX, centerY, boxSize * 1.2);

        const innerNumberRadius = (centerRadius + innerRingRadius) / 2;
        const outerNumberRadius = (innerRingRadius + outerRingRadius) / 2;

        for (let i = 0; i < NUM_SEGMENTS; i++) {
            const angle = (i / NUM_SEGMENTS) * 2 * Math.PI + (Math.PI / NUM_SEGMENTS); // Roteer voor centrering in segment
            
            const innerX = centerX + Math.cos(angle) * innerNumberRadius;
            const innerY = centerY + Math.sin(angle) * innerNumberRadius;
            drawField(data.pairs[i].inner, innerX, innerY, boxSize);

            const outerX = centerX + Math.cos(angle) * outerNumberRadius;
            const outerY = centerY + Math.sin(angle) * outerNumberRadius;
            drawField(data.pairs[i].outer, outerX, outerY, boxSize);
        }
    }

    // --- Hoofdfunctie ---
    function generateWorksheet() {
        document.getElementById("meldingContainer").textContent = ""; // Reset melding
        const numGrids = controls.numGrids();
        let cols, rows;
        if (numGrids === 1) { cols = 1; rows = 1; } 
        else if (numGrids === 2) { cols = 2; rows = 1; } 
        else if (numGrids === 4) { cols = 2; rows = 2; } 
        else if (numGrids === 6) { cols = 2; rows = 3; }

        const singleWidth = 250;
        const singleHeight = 250; // Cirkels zijn vierkant
        const padding = 25;
        canvas.width = (singleWidth * cols) + (padding * (cols + 1));
        canvas.height = (singleHeight * rows) + (padding * (rows + 1));
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < numGrids; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const xOffset = padding + (col * (singleWidth + padding));
            const yOffset = padding + (row * (singleHeight + padding));

            const circle = generateCircleData();
            if(circle) {
                drawSingleCircle(circle.display, xOffset, yOffset, singleWidth);
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
            a.download = "rekencirkels.png";
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
            doc.save("rekencirkels-werkblad.pdf");
        });
    }

    // --- Initialisatie ---
    setupEventListeners();
    generateWorksheet();
});
