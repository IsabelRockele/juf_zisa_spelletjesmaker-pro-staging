document.addEventListener("DOMContentLoaded", () => {
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const opnieuwBtn = document.getElementById('opnieuwBtn');
    const werkbladContainer = document.getElementById('werkblad-container');
    const bewerkingTekstSpan = document.getElementById('bewerkingTekst');

    opnieuwBtn.addEventListener('click', () => {
        window.location.href = 'rekenpiramide_keuze.html';
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

        if (settings.hoofdBewerking !== 'optelpiramides' && settings.hoofdBewerking !== 'vermenigvuldigpiramides') {
            throw new Error("Ongeldige werkbladinstellingen. Ga terug en maak de juiste keuzes.");
        }

        // Toon de bewerking in de header
        if (settings.hoofdBewerking === 'optelpiramides') {
            bewerkingTekstSpan.textContent = 'Optellen';
        } else {
            bewerkingTekstSpan.textContent = 'Vermenigvuldigen';
        }


        function genereerWerkblad() {
            laatsteOefeningen = [];
            // Voor vermenigvuldigen, maak een kopie van gekozenTafels en shuffle deze
            // Zodat elke piramide een andere tafel kan gebruiken indien van toepassing.
            let beschikbareTafels = settings.hoofdBewerking === 'vermenigvuldigpiramides' 
                                    ? [...settings.gekozenTafels].sort(() => 0.5 - Math.random()) 
                                    : [];
            let tafelIndex = 0;


            for (let i = 0; i < settings.numOefeningen; i++) {
                try {
                    let piramideTafel = null;
                    if (settings.hoofdBewerking === 'vermenigvuldigpiramides' && beschikbareTafels.length > 0) {
                        piramideTafel = beschikbareTafels[tafelIndex % beschikbareTafels.length];
                        tafelIndex++;
                    }

                    const piramide = genereerRekenpiramide(piramideTafel);
                    laatsteOefeningen.push(piramide);
                } catch (e) {
                    console.warn("Kon piramide " + (i + 1) + " niet genereren met de huidige instellingen, probeer opnieuw:", e.message);
                    if (laatsteOefeningen.length < (settings.numOefeningen / 2)) {
                        i--;
                    } else {
                        console.error("Voldoende piramides gegenereerd, de rest kon niet efficiënt worden gemaakt met deze instellingen.");
                        break;
                    }
                }
            }
            if (laatsteOefeningen.length === 0) {
                 throw new Error("Geen enkele piramide kon worden gegenereerd met de gekozen instellingen. Pas de instellingen aan.");
            }
            toonWerkblad(laatsteOefeningen);
        }

        // 'huidigeTafel' is de specifiek gekozen tafel voor deze piramide (voor vermenigvuldigen)
        function genereerRekenpiramide(huidigeTafel = null) { 
            const hoogte = settings.piramideHoogte;
            const bewerking = settings.hoofdBewerking;
            let piramideStructuur = [];
            let pogingen = 0;
            const maxPogingen = 500;

            while (pogingen < maxPogingen) {
                pogingen++;
                piramideStructuur = [];

                let basisRij = [];
                if (bewerking === 'optelpiramides') {
                    let maxBasisGetal = 0;
                    if (settings.optellenMaxGetal <= 20) maxBasisGetal = 5;
                    else if (settings.optellenMaxGetal <= 100) maxBasisGetal = 15;
                    else if (settings.optellenMaxGetal <= 500) maxBasisGetal = 50;
                    else maxBasisGetal = 100;

                    maxBasisGetal = Math.min(maxBasisGetal, settings.optellenMaxGetal / Math.pow(2, hoogte - 1) + 5);

                    for (let i = 0; i < hoogte; i++) {
                        basisRij.push(Math.floor(Math.random() * maxBasisGetal) + 1);
                    }
                } else { // 'vermenigvuldigpiramides'
                    // Gebruik de specifieke tafel voor deze piramide
                    const tafel = huidigeTafel || settings.gekozenTafels[Math.floor(Math.random() * settings.gekozenTafels.length)];
                    const maxFactor = 10; // Maximale factor die gebruikt mag worden (voor tafelkennis tot x10)

                    for (let i = 0; i < hoogte; i++) {
                        // Kies een willekeurige factor (1-maxFactor)
                        basisRij.push(Math.floor(Math.random() * maxFactor) + 1);
                    }
                }
                piramideStructuur.push(basisRij);

                let isGeldig = true;
                for (let r = 1; r < hoogte; r++) {
                    let nieuweRij = [];
                    const vorigeRij = piramideStructuur[r - 1];
                    for (let i = 0; i < vorigeRij.length - 1; i++) {
                        let resultaat;
                        if (bewerking === 'optelpiramides') {
                            resultaat = vorigeRij[i] + vorigeRij[i + 1];
                            if (resultaat > settings.optellenMaxGetal) {
                                isGeldig = false;
                                break;
                            }
                            const heeftBrug = (vorigeRij[i] % 10) + (vorigeRij[i + 1] % 10) >= 10;
                            if (settings.optellenBrug === 'zonder' && heeftBrug) {
                                isGeldig = false;
                                break;
                            }
                            if (settings.optellenBrug === 'met' && !heeftBrug) {
                                isGeldig = false;
                                break;
                            }
                        } else { // 'vermenigvuldigpiramides'
                            resultaat = vorigeRij[i] * vorigeRij[i + 1];
                            
                            // Dynamische check op max product voor deze specifieke tafel.
                            // Bijv. voor tafel van 2 is max 20, voor tafel van 5 is max 50 etc.
                            // We vermenigvuldigen de tafel met 10 (standaard tafellimiet)
                            // Plus een algemene bovengrens voor de producten in hogere lagen.
                            const maxToelaatbaarProductVoorTafel = (huidigeTafel || 1) * 10; // Minimaal 1 om delen door 0 te voorkomen
                            const algeheleMaxProduct = 5000; // Algemene vangnet voor extreme producten

                            if (resultaat > algeheleMaxProduct || resultaat > maxToelaatbaarProductVoorTafel * (r + 1)) {
                                // Resultaat is te groot voor de algehele limiet
                                // OF te groot voor de specifieke tafel x de factor die de rijhoogte simuleert
                                isGeldig = false;
                                break;
                            }
                             // Zorg dat de factoren voor de volgende stap niet te groot zijn voor bekende tafels
                            // Indien we verder rekenen met producten, moeten de *factoren* van dit product klein zijn.
                            // Dit is de complexiteit: 24 = 3 * 8, beide zijn "kleine" getallen
                            // Maar 24 = 2 * 12, dan is 12 geen standaardfactor.
                            // Voor vermenigvuldigen is het hier vaak lastig, dus we beperken de input getallen stevig.
                            // De beperking op de hoogte (max 3 rijen) helpt hier enorm.
                        }
                        nieuweRij.push(resultaat);
                    }
                    if (!isGeldig) break;

                    piramideStructuur.push(nieuweRij);
                }

                if (isGeldig && piramideStructuur.length === hoogte) {
                    return formatPiramideForDisplay(piramideStructuur, settings);
                }
            }
            throw new Error(`Kon geen geldige piramide genereren na ${maxPogingen} pogingen. Verlaag mogelijk de hoogte of verruim de filters (Max getal, Brug of Gekozen tafels).`);
        }

        function formatPiramideForDisplay(piramideVolledig, settings) {
            let weergavePiramide = JSON.parse(JSON.stringify(piramideVolledig));
            const hoogte = weergavePiramide.length;

            weergavePiramide.reverse(); 

            const totaalVakjes = hoogte * (hoogte + 1) / 2;
            let aantalLeegTeMaken = 0;

            if (settings.piramideType === 'som') {
                for (let r = 0; r < hoogte - 1; r++) { 
                    for (let c = 0; c < weergavePiramide[r].length; c++) {
                        weergavePiramide[r][c] = '___';
                    }
                }
            } else { // 'ontbrekend' of 'mengeling'
                if (settings.piramideType === 'ontbrekend') {
                    if (hoogte === 2) aantalLeegTeMaken = 1; // 3 vakjes, 1 leeg
                    else if (hoogte === 3) aantalLeegTeMaken = 2; // 6 vakjes, 2 leeg
                    else if (hoogte === 4) aantalLeegTeMaken = 3; // 10 vakjes, 3 leeg
                    else if (hoogte === 5) aantalLeegTeMaken = 4; // 15 vakjes, 4 leeg
                    else aantalLeegTeMaken = Math.floor(totaalVakjes / 3); // Ongeveer 1/3
                    
                    maakWillekeurigeVakjesLeeg(weergavePiramide, aantalLeegTeMaken, hoogte, false);
                } else { // 'mengeling'
                    if (hoogte === 2) aantalLeegTeMaken = 1; // Bij 2 rijen, 1 of 2 leeg. Niet te veel.
                    else if (hoogte === 3) aantalLeegTeMaken = 3; // 6 vakjes, 3 leeg
                    else if (hoogte === 4) aantalLeegTeMaken = 4; // 10 vakjes, 4 leeg
                    else if (hoogte === 5) aantalLeegTeMaken = 6; // 15 vakjes, 6 leeg
                    else aantalLeegTeMaken = Math.floor(totaalVakjes / 2.5); // Ongeveer 40%
                    
                    maakWillekeurigeVakjesLeeg(weergavePiramide, aantalLeegTeMaken, hoogte, true);
                }
            }

            return {
                type: 'piramide',
                structuur: piramideVolledig,
                weergave: weergavePiramide
            };
        }

        function maakWillekeurigeVakjesLeeg(piramideArray, count, hoogte, allowBaseRow) {
            let gemaakteLegeVakjes = 0;
            let pogingen = 0;
            const maxPogingenVakje = 200;

            const mogelijkeVakjes = [];
            for (let r = 0; r < piramideArray.length; r++) {
                if (!allowBaseRow && r === piramideArray.length - 1) continue;
                for (let c = 0; c < piramideArray[r].length; c++) {
                    mogelijkeVakjes.push({r, c});
                }
            }

            for (let i = mogelijkeVakjes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [mogelijkeVakjes[i], mogelijkeVakjes[j]] = [mogelijkeVakjes[j], mogelijkeVakjes[i]];
            }

            for (let i = 0; i < mogelijkeVakjes.length && gemaakteLegeVakjes < count; i++) {
                const {r, c} = mogelijkeVakjes[i];
                if (piramideArray[r][c] !== '___') {
                    piramideArray[r][c] = '___';
                    gemaakteLegeVakjes++;
                }
            }
            if (gemaakteLegeVakjes === 0 && count > 0 && hoogte >= 2) { // Aangepast naar hoogte >= 2
                 piramideArray[0][0] = '___';
            }
        }


        function toonWerkblad(oefeningen) {
            werkbladContainer.innerHTML = '';
            oefeningen.forEach(oef => {
                const piramideDiv = document.createElement('div');
                piramideDiv.className = 'rekenpiramide';

                oef.weergave.forEach((rij, rIndex) => {
                    const rijDiv = document.createElement('div');
                    rijDiv.className = 'piramide-rij';
                    
                    const margePerRij = 20;
                    rijDiv.style.marginLeft = `${rIndex * margePerRij}px`;
                    rijDiv.style.marginRight = `${rIndex * margePerRij}px`;

                    rij.forEach(vakje => {
                        const vakDiv = document.createElement('div');
                        vakDiv.className = 'piramide-vak';
                        vakDiv.textContent = vakje;
                        rijDiv.appendChild(vakDiv);
                    });
                    piramideDiv.appendChild(rijDiv);
                });
                werkbladContainer.appendChild(piramideDiv);
            });
        }

        function drawRekenpiramideInPDF(doc, xStart, yStart, piramideData, hoogte) {
            const vakBreedte = 14;
            const vakHoogte = 12;
            const lijnDikte = 0.5;
            const fontSize = 12;

            doc.setLineWidth(lijnDikte);
            doc.setDrawColor(51, 51, 51);
            doc.setTextColor(0);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(fontSize);

            for (let r = 0; r < hoogte; r++) {
                const rijLengte = piramideData[r].length;
                const offsetX = xStart + (hoogte - 1 - r) * (vakBreedte / 2);
                const currentY = yStart + r * vakHoogte;

                for (let c = 0; c < rijLengte; c++) {
                    const currentX = offsetX + c * vakBreedte;
                    const text = String(piramideData[r][c]);

                    doc.setFillColor(248, 248, 248);
                    doc.rect(currentX, currentY, vakBreedte, vakHoogte, 'FD');

                    doc.text(text, currentX + vakBreedte / 2, currentY + vakHoogte / 2 + (fontSize * 0.3), { align: 'center' });
                }
            }
        }

        function downloadPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            doc.setFontSize(16);
            doc.setFont('Helvetica', 'bold');
            
            let headerText = "Werkblad Rekenpiramides";
            if (settings.hoofdBewerking === 'optelpiramides') {
                headerText += " (Optellen)";
            } else {
                headerText += " (Vermenigvuldigen)";
            }
            doc.text(headerText, 105, 15, { align: 'center' });

            const vakBreedte = 14;
            const vakHoogte = 12;
            
            const breedteVanEenPiramide = settings.piramideHoogte * vakBreedte;
            const piramideHoogteMM = settings.piramideHoogte * vakHoogte;

            const horizontaleMargeTussenPiramides = 10;
            const verticaleMargeTussenPiramides = 15;

            const kolommen = 3; // Start met 3 kolommen
            const pageWidth = doc.internal.pageSize.getWidth();
            const leftPageMargin = 15;
            const rightPageMargin = 15;

            const beschikbareBreedte = pageWidth - leftPageMargin - rightPageMargin;

            // Bepaal het werkelijke aantal kolommen op basis van de piramidebreedte
            let actueleKolommen = kolommen;
            while (actueleKolommen > 0) {
                const totaleNodigeBreedteVoorKolommen = (actueleKolommen * breedteVanEenPiramide) + ((actueleKolommen - 1) * horizontaleMargeTussenPiramides);
                if (totaleNodigeBreedteVoorKolommen <= beschikbareBreedte) {
                    break; // Dit aantal kolommen past
                }
                actueleKolommen--; // Probeer minder kolommen
            }
            if (actueleKolommen === 0) actueleKolommen = 1; // Zorg dat er altijd minstens 1 kolom is

            const xPosities = [];
            const effectieveTotaalBreedte = (actueleKolommen * breedteVanEenPiramide) + ((actueleKolommen - 1) * horizontaleMargeTussenPiramides);
            const startXOffset = (pageWidth - effectieveTotaalBreedte) / 2; // Centreer de kolommen

            for (let k = 0; k < actueleKolommen; k++) {
                xPosities.push(startXOffset + (k * breedteVanEenPiramide) + (k * horizontaleMargeTussenPiramides));
            }


            const startY = 25;
            const pageHeight = doc.internal.pageSize.getHeight();
            const bottomMargin = 20;

            let currentY = startY;

            laatsteOefeningen.forEach((oef, index) => {
                const kolomIndex = index % actueleKolommen;

                if (currentY + piramideHoogteMM + verticaleMargeTussenPiramides > pageHeight - bottomMargin && index > 0 && kolomIndex === 0) {
                    doc.addPage();
                    currentY = startY;
                }

                const x = xPosities[kolomIndex];
                
                drawRekenpiramideInPDF(doc, x, currentY, oef.weergave, settings.piramideHoogte);

                if (kolomIndex === actueleKolommen - 1 || index === laatsteOefeningen.length - 1) {
                    currentY += piramideHoogteMM + verticaleMargeTussenPiramides;
                }
            });

            doc.save('rekenpiramide_werkblad.pdf');
        }

        genereerWerkblad();

        downloadPdfBtn.addEventListener('click', downloadPDF);
        downloadPdfBtn.disabled = false;
        downloadPdfBtn.style.backgroundColor = '';
        downloadPdfBtn.style.cursor = 'pointer';

    } catch (error) {
        werkbladContainer.innerHTML = `<p style="color: red; font-weight: bold;">Fout: Kon werkblad niet maken.</p><p>${error.message}</p><p><button onclick="window.location.href='rekenpiramide_keuze.html'" style="background-color: #007bff; color: white; padding: 10px 15px; border-radius: 5px; cursor: pointer;">Terug naar Keuzemenu</button></p>`;
    }
});