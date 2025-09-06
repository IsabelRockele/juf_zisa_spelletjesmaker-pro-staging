document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d");
    const meldingContainer = document.getElementById("meldingContainer");

    let laatsteInstellingen = null;

    const wekkerImg = new Image();
    wekkerImg.src = 'klok_afbeeldingen/wekker.png';
    wekkerImg.onload = () => {
        genereerWerkblad();
    };
    wekkerImg.onerror = () => {
        meldingContainer.textContent = "Fout: kon 'wekker.png' niet laden. Zorg ervoor dat het bestand in de map 'klok_afbeeldingen' staat.";
    }

    function genereerWerkblad() {
        const instellingen = {
            numClocks: parseInt(document.getElementById("numClocks").value),
            toonHulpminuten: document.getElementById("hulpminuten").checked,
            toon24Uur: document.getElementById("hulp24uur").checked,
            toonHulpAnaloog: document.getElementById("hulpAnaloog").checked,
            voorOverHulpType: document.getElementById("voorOverHulp").value,
            moeilijkheden: Array.from(document.querySelectorAll('input[name="moeilijkheid"]:checked')).map(cb => cb.value),
            tijdnotatie: document.querySelector('input[name="tijdnotatie"]:checked').value,
            invulmethode: document.querySelector('input[name="invulmethode"]:checked').value,
            tijden: []
        };

        meldingContainer.textContent = "";
        if (instellingen.moeilijkheden.length === 0) {
            meldingContainer.textContent = "Kies minstens één moeilijkheidsgraad!";
            return;
        }

        for (let i = 0; i < instellingen.numClocks; i++) {
            instellingen.tijden.push(genereerTijd(instellingen.moeilijkheden));
        }

        laatsteInstellingen = instellingen;
        tekenCanvas(laatsteInstellingen, 'compact');
    }

    function tekenCanvas(instellingen, layoutType) {
        if (!instellingen) return;

        const { numClocks, toonHulpminuten, toon24Uur, toonHulpAnaloog, voorOverHulpType, tijdnotatie, invulmethode, tijden } = instellingen;

        let actualClockDiameter;
        const clockVerticalOffset = 20;

        let paddingBetweenClocks;
        let wekkerDisplayWidth;

        if (layoutType === 'pdf') {
            // Bepaal de diameter van de klok gebaseerd op de tijdnotatie voor de PDF
            if (tijdnotatie === '24uur') {
                actualClockDiameter = 240; // Kleinere klok voor 24-uurs oefening in PDF
            } else {
                actualClockDiameter = 180; // Grotere klok voor standaard oefening in PDF
            }
            
            paddingBetweenClocks = 30;

            // --- AANPASSING: Dynamische wekkergrootte voor PDF ---
            if (tijdnotatie === '24uur') {
                // Twee wekkers naast elkaar, dus maak ze kleiner
                wekkerDisplayWidth = 160; 
            } else {
                // Slechts één wekker, dus deze mag groter zijn
                wekkerDisplayWidth = 140; 
            }
            // --- EINDE AANPASSING ---

        } else { // 'compact' layout voor de web-weergave
            actualClockDiameter = 150; // Standaardgrootte voor de weergave op de website
            paddingBetweenClocks = 20;
            wekkerDisplayWidth = 130;
        }

        let answerBlockHeight = 0;
        let minRequiredWidthForAnswerArea = actualClockDiameter;

        const wekkerRatio = wekkerImg.height > 0 ? wekkerImg.width / wekkerImg.height : 1;

        if (invulmethode === 'analoog') {
            answerBlockHeight = 60;
            minRequiredWidthForAnswerArea = actualClockDiameter;
        } else {
            if (tijdnotatie === '24uur') {
                const labelHeight = 12;
                const spacingBetweenTwoWekkers = 15;
                const calculatedWekkerHeight = wekkerDisplayWidth / wekkerRatio;
                answerBlockHeight = (labelHeight * 2) + calculatedWekkerHeight + spacingBetweenTwoWekkers;
                minRequiredWidthForAnswerArea = (wekkerDisplayWidth * 2) + spacingBetweenTwoWekkers;
            } else {
                answerBlockHeight = wekkerDisplayWidth / wekkerRatio;
                minRequiredWidthForAnswerArea = wekkerDisplayWidth;
            }
        }

        // --- AANPASSING: Vakbreedte voor PDF ---
        let singleCellTotalWidth;
        if (layoutType === 'pdf' && tijdnotatie === 'standaard') {
            // Voor standaardoefeningen in PDF, voeg extra witruimte toe (bv. 60px)
            // zodat de 24-uurs hulpcijfers niet tegen de rand komen.
            singleCellTotalWidth = Math.max(actualClockDiameter + 60, minRequiredWidthForAnswerArea + 20);
        } else {
            // Gebruik de standaardberekening voor de web-weergave en 24u-PDF's.
            singleCellTotalWidth = Math.max(actualClockDiameter + 20, minRequiredWidthForAnswerArea + 20);
        }
        // --- EINDE AANPASSING ---

        const spacingBelowClock = (voorOverHulpType !== 'geen' || tijdnotatie === '24uur' || toon24Uur) ? 45 : 20;
        const singleCellTotalHeight = clockVerticalOffset + actualClockDiameter + spacingBelowClock + answerBlockHeight;

        const numCols = 3;
        const numRows = Math.ceil(numClocks / numCols);

        canvas.width = (singleCellTotalWidth * numCols) + (paddingBetweenClocks * (numCols + 1));
        canvas.height = (singleCellTotalHeight * numRows) + (paddingBetweenClocks * (numRows + 1));
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < numClocks; i++) {
            const row = Math.floor(i / numCols);
            const col = i % numCols;

            const x_box_start = paddingBetweenClocks + col * (singleCellTotalWidth + paddingBetweenClocks);
            const y_box_start = paddingBetweenClocks + row * (singleCellTotalHeight + paddingBetweenClocks);

            ctx.strokeStyle = '#dddddd';
            ctx.lineWidth = 1;
            ctx.strokeRect(x_box_start, y_box_start, singleCellTotalWidth, singleCellTotalHeight);

            const clockX = x_box_start + (singleCellTotalWidth - actualClockDiameter) / 2;
            const clockY = y_box_start + clockVerticalOffset;

            const tijd = tijden[i];
            tekenKlokSessie(clockX, clockY, actualClockDiameter, tijd, toonHulpminuten, toon24Uur, toonHulpAnaloog, voorOverHulpType, tijdnotatie, invulmethode, singleCellTotalHeight, wekkerDisplayWidth, singleCellTotalWidth, x_box_start);
        }
    }

    function genereerTijd(moeilijkheden) {
        let uur = Math.floor(Math.random() * 12) + 1;
        let minuutPool = new Set();
        if (moeilijkheden.includes('uur')) minuutPool.add(0);
        if (moeilijkheden.includes('halfuur')) minuutPool.add(30);
        if (moeilijkheden.includes('kwartier')) {
            minuutPool.add(15);
            minuutPool.add(45);
        }
        if (moeilijkheden.includes('5minuten')) {
            for (let m = 0; m < 60; m += 5) minuutPool.add(m);
        }
        if (moeilijkheden.includes('minuut')) {
            for (let m = 0; m < 60; m++) minuutPool.add(m);
        }
        const minutenArray = Array.from(minuutPool);
        let minuut = minutenArray[Math.floor(Math.random() * minutenArray.length)];
        return { uur, minuut };
    }

    function tekenKlokSessie(x_clock, y_clock, clockSize, tijd, toonHulpminuten, toon24Uur, toonHulpAnaloog, voorOverHulpType, tijdnotatie, invulmethode, totalCellHeight, wekkerDisplayWidth, totalCellWidth, x_box_start) {
        const { uur, minuut } = tijd;
        const radius = clockSize / 2;
        const centerX = x_clock + radius;
        const centerY = y_clock + radius;
        tekenKlokBasis(centerX, centerY, radius, toonHulpminuten, toon24Uur, voorOverHulpType);
        tekenWijzers(centerX, centerY, radius, uur, minuut);

        const spaceBelowClock = (voorOverHulpType !== 'geen' || tijdnotatie === '24uur' || toon24Uur) ? 45 : 20;
        const y_answerAreaStart = y_clock + clockSize + spaceBelowClock;

        if (invulmethode === 'analoog') {
            const lineHeight = clockSize * 0.25; // Verhoogd van 0.15 voor meer ruimte
            ctx.font = `${clockSize * 0.11}px Arial`;
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textX = x_box_start + totalCellWidth / 2;

            if (toonHulpAnaloog) {
                let zin1 = "";
                let zin2 = "";

                if (voorOverHulpType === 'hulp2' && minuut !== 0 && minuut !== 30) {
                    if (minuut === 15 || minuut === 45) {
                        zin1 = "Het is kwart";
                        zin2 = "voor / over ___";
                    } else if (minuut > 15 && minuut < 45) {
                        zin1 = "Het is ___ min.";
                        zin2 = "voor / over half ___";
                    } else {
                        zin1 = "Het is ___ min.";
                        zin2 = "voor / over ___ u.";
                    }
                } else {
                     if (minuut === 0) {
                        zin1 = "Het is ___ uur";
                    } else if (minuut === 30) {
                        zin1 = "Het is half ___";
                    } else if (minuut === 15 || minuut === 45) {
                        zin1 = "Het is kwart";
                        zin2 = "voor / over ___";
                    } else {
                        zin1 = "Het is ___ min.";
                        zin2 = "voor / over ___";
                    }
                }

                if (zin2) {
                    ctx.fillText(zin1, textX, y_answerAreaStart);
                    ctx.fillText(zin2, textX, y_answerAreaStart + lineHeight);
                } else if (zin1) {
                    ctx.fillText(zin1, textX, y_answerAreaStart + (lineHeight / 2));
                } else {
                    ctx.fillText("Het is ___________", textX, y_answerAreaStart + (lineHeight / 2));
                }

            } else {
                ctx.fillText("Het is ___________", textX, y_answerAreaStart + (lineHeight / 2));
            }

        } else { // Digitale wekkers
            const wekkerRatio = wekkerImg.height > 0 ? wekkerImg.width / wekkerImg.height : 1;
            let currentWekkerDisplayWidth = wekkerDisplayWidth;

            if (tijdnotatie === '24uur') {
                const labelHeight = 12;
                const spacingBetweenTwoWekkers = 15;

                const requiredWekkersTotalWidth = (currentWekkerDisplayWidth * 2) + spacingBetweenTwoWekkers;
                const startX_wekkerGroup = x_box_start + (totalCellWidth - requiredWekkersTotalWidth) / 2;

                const y_labels = y_answerAreaStart;
                const y_wekkers = y_answerAreaStart + labelHeight;
                const wekkerDisplayHeight = currentWekkerDisplayWidth / wekkerRatio;

                const x1_label = startX_wekkerGroup + (currentWekkerDisplayWidth / 2);
                ctx.font = `italic ${labelHeight - 3}px Arial`;
                ctx.fillStyle = '#555';
                ctx.textAlign = 'center';
                ctx.fillText("ochtend/voormiddag", x1_label, y_labels);
                ctx.drawImage(wekkerImg, startX_wekkerGroup, y_wekkers, currentWekkerDisplayWidth, wekkerDisplayHeight);

                const x2_wekker = startX_wekkerGroup + currentWekkerDisplayWidth + spacingBetweenTwoWekkers;
                const x2_label = x2_wekker + (currentWekkerDisplayWidth / 2);
                ctx.fillText("namiddag/avond", x2_label, y_labels);
                ctx.drawImage(wekkerImg, x2_wekker, y_wekkers, currentWekkerDisplayWidth, wekkerDisplayHeight);

            } else {
                const wekkerDisplayHeight = currentWekkerDisplayWidth / wekkerRatio;
                const wekkerX = x_box_start + (totalCellWidth - currentWekkerDisplayWidth) / 2;
                ctx.drawImage(wekkerImg, wekkerX, y_answerAreaStart, currentWekkerDisplayWidth, wekkerDisplayHeight);
            }
        }
    }

    function tekenKlokBasis(centerX, centerY, radius, toonHulpminuten, toon24Uur, voorOverHulpType) {
        const klokRadius = radius * 0.9;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#A9D8E8";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX, centerY, klokRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "white";
        ctx.fill();

        if (voorOverHulpType === 'hulp1') {
            ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, klokRadius, -0.5 * Math.PI, 0.5 * Math.PI); ctx.closePath(); ctx.fillStyle = 'rgba(144, 238, 144, 0.2)'; ctx.fill();
            ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, klokRadius, 0.5 * Math.PI, 1.5 * Math.PI); ctx.closePath(); ctx.fillStyle = 'rgba(255, 182, 193, 0.2)'; ctx.fill();
            
            // --- AANPASSING: Tekst BOVEN de klok plaatsen ---
            ctx.font = `italic bold ${klokRadius * 0.12}px Arial`; 
            ctx.textAlign = 'center'; 
            ctx.textBaseline = 'middle';

            // Bepaal Y-positie in de witruimte boven de klok
            const textY = centerY - radius - 10; 

            // Horizontale positie voor 'voor' en 'over'
            const textXOffset = radius * 0.5;

            ctx.fillStyle = 'darkred';
            ctx.fillText("voor", centerX - textXOffset, textY);
            
            ctx.fillStyle = 'darkgreen';
            ctx.fillText("over", centerX + textXOffset, textY);

        } else if (voorOverHulpType === 'hulp2') {
            const colorGreen = 'rgba(144, 238, 144, 0.3)'; const colorOrange = 'rgba(255, 165, 0, 0.3)';
            const drawQuadrant = (startAngle, endAngle, color) => {
                ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, klokRadius, startAngle, endAngle); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
            };
            drawQuadrant(-0.5 * Math.PI, 0, colorGreen);
            drawQuadrant(0, 0.5 * Math.PI, colorOrange);
            drawQuadrant(0.5 * Math.PI, Math.PI, colorGreen);
            drawQuadrant(Math.PI, 1.5 * Math.PI, colorOrange);

            ctx.font = `bold ${radius * 0.1}px Arial`;
            ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
            
            // Plaats de tekst net buiten de klokcirkel
            const textRadius = radius * 1.15; 
            const textLineHeight = radius * 0.12;

            ctx.fillStyle = 'darkgreen';
            ctx.fillText("over", centerX + textRadius * Math.cos(-Math.PI/4), centerY + textRadius * Math.sin(-Math.PI/4));

            ctx.fillStyle = 'darkorange';
            ctx.fillText("voor", centerX + textRadius * Math.cos(Math.PI/4), centerY + textRadius * Math.sin(Math.PI/4));

            ctx.fillStyle = 'darkgreen';
            let textX = centerX + textRadius * Math.cos(3*Math.PI/4); let textY = centerY + textRadius * Math.sin(3*Math.PI/4);
            ctx.fillText("over", textX, textY - textLineHeight/2); ctx.fillText("half", textX, textY + textLineHeight/2);

            ctx.fillStyle = 'darkorange';
            textX = centerX + textRadius * Math.cos(-3*Math.PI/4); textY = centerY + textRadius * Math.sin(-3*Math.PI/4);
            ctx.fillText("voor", textX, textY - textLineHeight/2); ctx.fillText("half", textX, textY + textLineHeight/2);
        }

        if (toon24Uur) {
            ctx.font = `bold ${radius * 0.12}px Arial`;
            ctx.fillStyle = "red"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            for (let uur = 1; uur <= 12; uur++) {
                const label = uur + 12;
                const hoek = (uur - 3) * (Math.PI / 6);
                const buitenRadius = radius * 1.05;
                const x = centerX + buitenRadius * Math.cos(hoek);
                const y = centerY + buitenRadius * Math.sin(hoek);
                ctx.fillText(label.toString(), x, y);
            }
        }

        ctx.font = `bold ${klokRadius * 0.15}px Arial`; ctx.fillStyle = "#448866"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        for (let uur = 1; uur <= 12; uur++) {
            const hoek = (uur - 3) * (Math.PI / 6);
            const x = centerX + klokRadius * 0.75 * Math.cos(hoek); const y = centerY + klokRadius * 0.75 * Math.sin(hoek);
            ctx.fillText(uur.toString(), x, y);
        }
        for (let i = 0; i < 60; i++) {
            const hoek = i * (Math.PI / 30);
            const buiten = klokRadius; const binnen = i % 5 === 0 ? klokRadius * 0.92 : klokRadius * 0.95;
            ctx.beginPath(); ctx.moveTo(centerX + buiten * Math.cos(hoek), centerY + buiten * Math.sin(hoek));
            ctx.lineTo(centerX + binnen * Math.cos(hoek), centerY + binnen * Math.sin(hoek));
            ctx.strokeStyle = "#444"; ctx.lineWidth = i % 5 === 0 ? 1.5 : 1; ctx.stroke();
        }
        if (toonHulpminuten) {
            ctx.font = `${klokRadius * 0.1}px Arial`; ctx.fillStyle = "#448866";
            for (let i = 1; i <= 12; i++) {
                const minuten = (i * 5) % 60; const label = minuten === 0 ? "00" : minuten.toString(); const hoek = (i - 3) * (Math.PI / 6);
                const x = centerX + klokRadius * 0.55 * Math.cos(hoek); const y = centerY + klokRadius * 0.55 * Math.sin(hoek);
                ctx.fillText(label, x, y);
            }
        }
    }

    function tekenWijzers(centerX, centerY, radius, uur, minuut) {
        const klokRadius = radius * 0.9;
        const uurPos = (uur % 12 + minuut / 60);
        const uurHoek = (uurPos - 3) * (Math.PI / 6);
        tekenWijzer(centerX, centerY, uurHoek, klokRadius * 0.6, 2.5, "#333");
        const minuutHoek = (minuut - 15) * (Math.PI / 30);
        tekenWijzer(centerX, centerY, minuutHoek, klokRadius * 0.85, 2, "#333");
    }

    function tekenWijzer(cx, cy, hoek, lengte, dikte, kleur) {
        ctx.beginPath(); ctx.lineWidth = dikte; ctx.lineCap = "round"; ctx.strokeStyle = kleur;
        ctx.moveTo(cx, cy); ctx.lineTo(cx + lengte * Math.cos(hoek), cy + lengte * Math.sin(hoek));
        ctx.stroke();
    }

    document.getElementById("genereerBtn").addEventListener("click", genereerWerkblad);
    document.getElementById("numClocks").addEventListener("change", genereerWerkblad);
    document.getElementById("hulpminuten").addEventListener("change", genereerWerkblad);
    document.getElementById("hulp24uur").addEventListener("change", genereerWerkblad);
    document.querySelectorAll('input[name="tijdnotatie"]').forEach(radio => { radio.addEventListener("change", genereerWerkblad); });
    document.querySelectorAll('input[name="invulmethode"]').forEach(radio => { radio.addEventListener("change", genereerWerkblad); });
    document.getElementById("hulpAnaloog").addEventListener("change", genereerWerkblad);
    document.getElementById("voorOverHulp").addEventListener("change", genereerWerkblad);

    const moeilijkheidCheckboxes = document.querySelectorAll('input[name="moeilijkheid"]');
    moeilijkheidCheckboxes.forEach(cb => cb.addEventListener('change', genereerWerkblad));
    const selecteerAllesCheckbox = document.getElementById('selecteerAlles');
    selecteerAllesCheckbox.addEventListener('change', () => {
        moeilijkheidCheckboxes.forEach(checkbox => { checkbox.checked = selecteerAllesCheckbox.checked; });
        genereerWerkblad();
    });

    document.getElementById("downloadPngBtn").addEventListener("click", () => {
        tekenCanvas(laatsteInstellingen, 'compact');
        const dataURL = canvas.toDataURL("image/png");
        const a = document.createElement("a"); a.href = dataURL; a.download = "kloklezen_werkblad.png"; a.click();
        tekenCanvas(laatsteInstellingen, 'compact');
    });

    document.getElementById("downloadPdfBtn").addEventListener("click", () => {
        if (!laatsteInstellingen) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const CLOCKS_PER_PAGE = 9;
        const totalClocks = laatsteInstellingen.numClocks;
        const numPages = Math.ceil(totalClocks / CLOCKS_PER_PAGE);

        for (let page = 0; page < numPages; page++) {
            if (page > 0) {
                doc.addPage();
            }

            const startIndex = page * CLOCKS_PER_PAGE;
            const endIndex = startIndex + CLOCKS_PER_PAGE;
            const pageTijden = laatsteInstellingen.tijden.slice(startIndex, endIndex);

            const pageInstellingen = {
                ...laatsteInstellingen,
                numClocks: pageTijden.length,
                tijden: pageTijden
            };

            tekenCanvas(pageInstellingen, 'pdf');

            const dataURL = canvas.toDataURL("image/png");
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;
            const usableWidth = pageWidth - 2 * margin;
            const usableHeight = pageHeight - 2 * margin;
            const ratio = canvas.width / canvas.height;

            let pdfImgWidth = usableWidth;
            let pdfImgHeight = pdfImgWidth / ratio;

            if (pdfImgHeight > usableHeight) {
                pdfImgHeight = usableHeight;
                pdfImgWidth = pdfImgHeight * ratio;
            }

            const xPos = (pageWidth - pdfImgWidth) / 2;
            const yPos = (pageHeight - pdfImgHeight) / 2;

            const headerText = numPages > 1 ? `Kloklezen Oefening (Pagina ${page + 1}/${numPages})` : "Kloklezen Oefening";
            doc.text(headerText, pageWidth / 2, margin, { align: 'center' });
            doc.addImage(dataURL, 'PNG', xPos, yPos, pdfImgWidth, pdfImgHeight);
        }

        doc.save("kloklezen_werkblad.pdf");
        tekenCanvas(laatsteInstellingen, 'compact');
    });
});