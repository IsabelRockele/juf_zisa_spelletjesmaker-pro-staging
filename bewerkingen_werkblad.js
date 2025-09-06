document.addEventListener("DOMContentLoaded", () => {
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const opnieuwBtn = document.getElementById('opnieuwBtn');
    const werkbladContainer = document.getElementById('werkblad-container');

    opnieuwBtn.addEventListener('click', () => {
        window.location.href = 'bewerkingen_keuze.html';
    });

    downloadPdfBtn.disabled = true;
    downloadPdfBtn.style.backgroundColor = '#aaa';
    downloadPdfBtn.style.cursor = 'not-allowed';

    try {
        let laatsteOefeningen = [];
        let settings;

        const settingsJSON = localStorage.getItem('werkbladSettings');
        if (!settingsJSON) {
            throw new Error("Geen instellingen gevonden. Ga terug en maak eerst je keuzes.");
        }
        settings = JSON.parse(settingsJSON);

        function genereerWerkblad() {
            laatsteOefeningen = [];
            if (settings.hoofdBewerking === 'splitsen' && settings.groteSplitshuizen) {
                toonWerkblad([]);
                return;
            }

            for (let i = 0; i < settings.numOefeningen; i++) {
                let oefening;
                if (settings.hoofdBewerking === 'rekenen') oefening = genereerRekensom();
                else if (settings.hoofdBewerking === 'splitsen') oefening = genereerSplitsing();
                else if (settings.hoofdBewerking === 'tafels') oefening = genereerTafelsom();
                laatsteOefeningen.push(oefening);
            }
            toonWerkblad(laatsteOefeningen);
        }

        function toonWerkblad(oefeningen) {
            werkbladContainer.innerHTML = '';

            // --- Grote splitshuizen (speciaal geval) ---
            if (settings.hoofdBewerking === 'splitsen' && settings.groteSplitshuizen) {
                settings.splitsGetallenArray.forEach(maxGetal => {
                    let huisHTML = `<div class="splitshuis"><div class="dak">${maxGetal}</div>`;
                    let showLeft = true;
                    for (let i = 0; i <= maxGetal; i++) {
                        const deel1 = i;
                        const deel2 = maxGetal - i;
                        huisHTML += `<div class="kamers">`;
                        if (settings.splitsWissel) {
                            if (showLeft) {
                                huisHTML += `<div class="kamer">${deel1}</div><div class="kamer">___</div>`;
                            } else {
                                huisHTML += `<div class="kamer">___</div><div class="kamer">${deel2}</div>`;
                            }
                            showLeft = !showLeft;
                        } else {
                            huisHTML += `<div class="kamer">${deel1}</div><div class="kamer">___</div>`;
                        }
                        huisHTML += `</div>`;
                    }
                    huisHTML += `</div>`;
                    werkbladContainer.innerHTML += huisHTML;
                });
                return;
            }
            
            // --- Standaard weergave voor alle oefeningen ---
            let wissel = false;
            oefeningen.forEach(oef => {
                const oefeningDiv = document.createElement('div');
                oefeningDiv.className = 'oefening';

                if (oef.type === 'splitsen') {
                    const totaalHTML = oef.isSom ? '___' : oef.totaal;
                    let deel1HTML, deel2HTML;

                    if (oef.isSom) {
                        deel1HTML = oef.deel1;
                        deel2HTML = oef.deel2;
                    } else {
                        if (settings.splitsWissel) {
                            deel1HTML = wissel ? oef.deel1 : '___';
                            deel2HTML = wissel ? '___' : oef.deel2;
                        } else {
                            deel1HTML = '___';
                            deel2HTML = oef.deel2;
                        }
                    }
                    
                    if (settings.splitsStijl === 'huisje') {
                        oefeningDiv.innerHTML = `<div class="splitshuis"><div class="dak">${totaalHTML}</div><div class="kamers"><div class="kamer">${deel1HTML}</div><div class="kamer">${deel2HTML}</div></div></div>`;
                    } else {
                        oefeningDiv.innerHTML = `<div class="splitsbenen"><div class="top">${totaalHTML}</div><div class="benen-container"><div class="been links"></div><div class="been rechts"></div></div><div class="bottom"><div class="bottom-deel">${deel1HTML}</div><div class="bottom-deel">${deel2HTML}</div></div></div>`;
                    }
                    wissel = !wissel;
                } else {
                    oefeningDiv.innerHTML = `${oef.getal1} ${oef.operator} ${oef.getal2} = ___`;
                }
                werkbladContainer.appendChild(oefeningDiv);
            });
        }
        
        function genereerSplitsing() {
            const gekozenGetal = settings.splitsGetallenArray[Math.floor(Math.random() * settings.splitsGetallenArray.length)] || 10;
            if (settings.splitsSom && Math.random() < 0.25) {
                const deel1 = Math.floor(Math.random() * (gekozenGetal / 2)) + 1;
                const deel2 = Math.floor(Math.random() * (gekozenGetal / 2)) + 1;
                return { type: 'splitsen', isSom: true, deel1: deel1, deel2: deel2, totaal: deel1 + deel2 };
            } else {
                const totaal = Math.floor(Math.random() * gekozenGetal) + 1;
                const deel1 = Math.floor(Math.random() * (totaal + 1));
                const deel2 = totaal - deel1;
                return { type: 'splitsen', isSom: false, totaal, deel1, deel2 };
            }
        }

        function genereerRekensom() {
            const gekozenType = settings.somTypes[Math.floor(Math.random() * settings.somTypes.length)];
            const maxGetal = settings.rekenMaxGetal;
            let getal1, getal2, operator, pogingen = 0;
            do {
                pogingen++;
                if (pogingen > 100) throw new Error(`Kon geen som genereren voor ${gekozenType} tot ${maxGetal}.`);
                const willekeurigGetal = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
                switch (gekozenType) {
                    case 'E+E': getal1 = willekeurigGetal(1, 9); getal2 = willekeurigGetal(1, 9); break;
                    case 'T+E': getal1 = willekeurigGetal(1, 9) * 10; getal2 = willekeurigGetal(1, 9); break;
                    case 'T+T': getal1 = willekeurigGetal(1, 9) * 10; getal2 = willekeurigGetal(1, 9) * 10; break;
                    case 'TE+E': getal1 = willekeurigGetal(11, 99); getal2 = willekeurigGetal(1, 9); break;
                    case 'TE+TE': getal1 = willekeurigGetal(11, 99); getal2 = willekeurigGetal(11, 99); break;
                    case 'H+H': getal1 = willekeurigGetal(1, 9) * 100; getal2 = willekeurigGetal(1, 9) * 100; break;
                    case 'HT+HT': getal1 = willekeurigGetal(10, 99) * 10; getal2 = willekeurigGetal(10, 99) * 10; break;
                    case 'HTE+HTE': getal1 = willekeurigGetal(100, 999); getal2 = willekeurigGetal(100, 999); break;
                }
                operator = settings.rekenType === 'beide' ? (Math.random() < 0.5 ? '+' : '-') : (settings.rekenType === 'optellen' ? '+' : '-');

                if (operator === '+') {
                    while (getal1 + getal2 > maxGetal) {
                        if (getal1 > getal2) getal1 = Math.floor(getal1 / 2);
                        else getal2 = Math.floor(getal2 / 2);
                    }
                }
                if (operator === '-') {
                    if (getal1 < getal2) [getal1, getal2] = [getal2, getal1];
                    while (getal1 > maxGetal) {
                        getal1 = Math.floor(getal1 / 2);
                        if (getal1 < getal2) [getal1, getal2] = [getal2, getal1];
                    }
                }
            } while (!checkBrug(getal1, getal2, operator, settings.rekenBrug));
            return { type: 'rekenen', getal1, getal2, operator };
        }

        function checkBrug(g1, g2, op, brugType) {
            if (brugType === 'beide' || g1 < 10 || g2 < 10) return true;
            const heeftBrug = op === '+' ? (g1 % 10) + (g2 % 10) > 9 : (g1 % 10) < (g2 % 10);
            return (brugType === 'met' && heeftBrug) || (brugType === 'zonder' && !heeftBrug);
        }

        function genereerTafelsom() {
            const tafel = settings.gekozenTafels[Math.floor(Math.random() * settings.gekozenTafels.length)];
            let operator = settings.tafelType === 'maal' ? 'x' : ':';
            if (settings.tafelType === 'beide') operator = Math.random() < 0.5 ? 'x' : ':';
            let getal1, getal2;
            if (operator === 'x') { getal1 = tafel; getal2 = Math.floor(Math.random() * 10) + 1; } 
            else { getal2 = tafel; getal1 = getal2 * (Math.floor(Math.random() * 10) + 1); }
            return { type: 'tafels', getal1, getal2, operator };
        }

        // --- Hulpfuncties om te tekenen in de PDF ---
        
        function drawSplitshuisInPDF(doc, x, y, oef, wissel) {
            const totaalHTML = oef.isSom ? '___' : oef.totaal;
            let deel1HTML, deel2HTML;
            if (oef.isSom) {
                deel1HTML = oef.deel1; deel2HTML = oef.deel2;
            } else {
                if (settings.splitsWissel) {
                    deel1HTML = wissel ? oef.deel1 : '___';
                    deel2HTML = wissel ? '___' : oef.deel2;
                } else {
                    deel1HTML = '___'; deel2HTML = oef.deel2;
                }
            }
            
            const breedte = 32, hoogteDak = 8, hoogteKamer = 8, radius = 1;
            
            doc.setLineWidth(0.5);
            doc.setDrawColor(51, 51, 51);
            
            doc.setFillColor(224, 242, 247);
            doc.roundedRect(x, y, breedte, hoogteDak, radius, radius, 'FD');
            
            doc.setDrawColor(204, 204, 204);
            doc.roundedRect(x, y + hoogteDak, breedte, hoogteKamer, radius, radius, 'D');
            doc.line(x + breedte / 2, y + hoogteDak, x + breedte / 2, y + hoogteDak + hoogteKamer);

            doc.setTextColor(0);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(String(totaalHTML), x + breedte / 2, y + 5.5, { align: 'center' });
            
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(12);
            doc.text(String(deel1HTML), x + breedte / 4, y + hoogteDak + 5.5, { align: 'center' });
            doc.text(String(deel2HTML), x + breedte * 0.75, y + hoogteDak + 5.5, { align: 'center' });
        }

        function drawSplitsbenenInPDF(doc, x, y, oef, wissel) {
            const totaalHTML = oef.isSom ? '___' : oef.totaal;
             let deel1HTML, deel2HTML;
            if (oef.isSom) {
                deel1HTML = oef.deel1; deel2HTML = oef.deel2;
            } else {
                 if (settings.splitsWissel) {
                    deel1HTML = wissel ? oef.deel1 : '___';
                    deel2HTML = wissel ? '___' : oef.deel2;
                } else {
                    deel1HTML = '___'; deel2HTML = oef.deel2;
                }
            }
        
            const boxB = 10, boxH = 7, spreiding = 9, radius = 1; 
            const middenX = x;

            doc.setLineWidth(0.5);
            doc.setDrawColor(51, 51, 51);
            
            doc.setFillColor(224, 242, 247);
            doc.roundedRect(middenX - boxB / 2, y, boxB, boxH, radius, radius, 'FD');
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(String(totaalHTML), middenX, y + 5, { align: 'center' });
        
            const yBottom = y + boxH + 8;
            doc.roundedRect(middenX - spreiding - boxB / 2, yBottom, boxB, boxH, radius, radius, 'D');
            doc.roundedRect(middenX + spreiding - boxB / 2, yBottom, boxB, boxH, radius, radius, 'D');
            
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(12);
            doc.text(String(deel1HTML), middenX - spreiding, yBottom + 5, { align: 'center' });
            doc.text(String(deel2HTML), middenX + spreiding, yBottom + 5, { align: 'center' });
        
            doc.line(middenX, y + boxH, middenX - spreiding, yBottom);
            doc.line(middenX, y + boxH, middenX + spreiding, yBottom);
        }
        
        function drawRekensomInPDF(doc, x, y, oef) {
            const text = `${oef.getal1} ${oef.operator} ${oef.getal2} = ___`;
            doc.setFont('Courier', 'normal');
            doc.setFontSize(14);
            doc.text(text, x, y, { align: 'left' });
        }

        function drawGrootSplitshuisInPDF(doc, x, y, maxGetal, settings) {
            const breedte = 32, hoogteDak = 8, hoogteKamer = 7, radius = 1, tekstMarge = 5;

            doc.setLineWidth(0.5);
            doc.setDrawColor(51, 51, 51);
            doc.setFillColor(224, 242, 247);
            doc.roundedRect(x, y, breedte, hoogteDak, radius, radius, 'FD');
            doc.setTextColor(0);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(String(maxGetal), x + breedte / 2, y + tekstMarge, { align: 'center' });

            let showLeft = true;
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(12);
            for (let i = 0; i <= maxGetal; i++) {
                const kamerY = y + hoogteDak + (i * hoogteKamer);
                const deel1 = i;
                const deel2 = maxGetal - i;

                doc.setDrawColor(204, 204, 204);
                doc.rect(x, kamerY, breedte, hoogteKamer, 'D');
                doc.line(x + breedte / 2, kamerY, x + breedte / 2, kamerY + hoogteKamer);
                
                let deel1HTML = '___', deel2HTML = '___';
                if (settings.splitsWissel) {
                    if (showLeft) {
                        deel1HTML = deel1;
                    } else {
                        deel2HTML = deel2;
                    }
                    showLeft = !showLeft;
                } else {
                    deel1HTML = deel1;
                }
                doc.text(String(deel1HTML), x + breedte / 4, kamerY + tekstMarge, { align: 'center' });
                doc.text(String(deel2HTML), x + breedte * 0.75, kamerY + tekstMarge, { align: 'center' });
            }
        }

        function downloadPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            doc.setFontSize(16);
            doc.setFont('Helvetica', 'bold');
            doc.text("Werkblad Bewerkingen", 105, 15, { align: 'center' });

            if (settings.hoofdBewerking === 'splitsen' && settings.groteSplitshuizen) {
                const xPosities = [15, 60, 105, 150];
                const numColumns = 4;
                let yPos = 30;
                const pageHeight = doc.internal.pageSize.getHeight();
                const bottomMargin = 20;
                const rowMargin = 15;

                for (let i = 0; i < settings.splitsGetallenArray.length; i += numColumns) {
                    const rowGetallen = settings.splitsGetallenArray.slice(i, i + numColumns);
                    let maxHeightInRow = 0;

                    rowGetallen.forEach(maxGetal => {
                        const hoogteDak = 8, hoogteKamer = 7;
                        const huisHoogte = hoogteDak + (maxGetal + 1) * hoogteKamer;
                        if (huisHoogte > maxHeightInRow) {
                            maxHeightInRow = huisHoogte;
                        }
                    });

                    if (yPos + maxHeightInRow > pageHeight - bottomMargin && yPos > 30) {
                        doc.addPage();
                        yPos = 15;
                    }

                    rowGetallen.forEach((maxGetal, index) => {
                        drawGrootSplitshuisInPDF(doc, xPosities[index], yPos, maxGetal, settings);
                    });
                    
                    yPos += maxHeightInRow + rowMargin;
                }

            } else {
                const xPosities = [35, 85, 135, 185]; 
                const yStart = 30;
                const yIncrement = 33;
                const maxRijen = 8;
                let wissel = false;

                laatsteOefeningen.forEach((oef, index) => {
                    if (index >= (maxRijen * 4)) return; 

                    const kolom = index % 4;
                    const rij = Math.floor(index / 4);
                    const x = xPosities[kolom];
                    const y = yStart + (rij * yIncrement);

                    if (oef.type === 'splitsen') {
                        if (settings.splitsStijl === 'huisje') {
                            drawSplitshuisInPDF(doc, x - 16, y, oef, wissel);
                        } else { 
                            drawSplitsbenenInPDF(doc, x, y, oef, wissel);
                        }
                        wissel = !wissel;
                    } else { 
                        drawRekensomInPDF(doc, x - 15, y, oef);
                    }
                });
            }
            doc.save('bewerkingen_werkblad.pdf');
        }

        genereerWerkblad();

        downloadPdfBtn.addEventListener('click', downloadPDF);
        downloadPdfBtn.disabled = false;
        downloadPdfBtn.style.backgroundColor = '';
        downloadPdfBtn.style.cursor = 'pointer';

    } catch (error) {
        werkbladContainer.innerHTML = `<p style="color: red; font-weight: bold;">Fout: Kon werkblad niet maken.</p><p>${error.message}</p>`;
    }
});