document.addEventListener('DOMContentLoaded', () => {

    const woordenLijsten = {
        "AVI-START": ["auto", "saus", "goud", "hout", "boek", "zoek", "deur", "kleur", "brief", "ziek", "trein", "klein", "dijk", "kijk", "huis", "duim", "boom", "rook", "zee", "thee", "maan", "vaas", "vuur", "muur", "sneeuw", "nieuw", "haai", "zaai", "kooi", "vlooi", "foei", "groei", "lang", "bang", "drink", "plank", "school", "schat", "schrijf", "schrik", "ik", "kim", "vis", "pen", "een", "aap", "noot", "mies"],
        "AVI-M3": ["de", "maan", "roos", "vis", "ik", "en", "een", "is", "in", "pen", "an", "doos", "doek", "buik", "ik", "hij", "zij", "wij", "nee", "ja", "sok", "boom", "boot", "vuur", "koek", "zeep", "wei", "ui", "huis", "duif", "kous", "hout", "jas", "jet", "dag", "weg", "lach", "zeg", "jij", "bij", "heuvel", "nieuw", "schip", "ring", "bank", "vang", "klink", "plank", "zon", "zee", "zus"],
        "AVI-E3": ["school", "vriend", "fiets", "groen", "lacht", "naar", "straat", "plant", "groeit", "vogel", "fluit", "schat", "zoekt", "onder", "steen", "vindt", "niks", "draak", "sprookje", "woont", "kasteel", "prinses", "redt", "hem", "eerst", "dan", "later", "eind", "goed", "al", "sneeuw", "wit", "koud", "winter", "schaatsen", "ijs", "pret", "warm", "melk", "koekje", "erbij", "blij", "schijnt", "lucht", "blauw", "wolk", "drijft", "zacht", "wind"],
        "AVI-M4": ["zwaaien", "leeuw", "meeuw", "duw", "sneeuw", "kieuw", "nieuw", "sluw", "ruw", "uw", "geeuw", "schreeuw", "ooi", "kooi", "haai", "vlaai", "prooi", "draai", "kraai", "strooi", "mooi", "gloei", "foei", "boei", "groei", "bloei", "vloei", "ai", "ui", "ei", "eeuw", "ieuw", "oei", "aai", "spring", "breng", "kring", "zing", "ding", "bang", "stang", "wang", "streng", "jong", "tong", "zong", "lang", "hang", "plank", "slank", "vonk", "dronk", "stank", "bank"],
        "AVI-E4": ["bezoek", "gevaar", "verkeer", "verhaal", "gebak", "bestek", "geluk", "getal", "gezin", "begin", "beton", "beroep", "geheim", "geduld", "verstand", "verkoop", "ontbijt", "ontdek", "ontwerp", "ontvang", "ontmoet", "herhaal", "herken", "herfst", "achtig", "plechtig", "krachtig", "zestig", "zinnig", "koppig", "lastig", "smelt", "helpt", "werkt", "fietst", "lacht", "drinkt", "zwaait", "geloof", "gebeurt", "betaal", "vergeet", "verlies", "geniet", "gevoel", "gebruik", "verrassing", "beleef", "vertrouw", "verdien", "ontsnap"],
        "AVI-M5": ["vrolijk", "moeilijk", "eerlijk", "gevaarlijk", "heerlijk", "dagelijks", "eindelijk", "vriendelijk", "lelijk", "afschuwelijk", "persoonlijk", "landelijk", "tijdelijk", "ordelijk", "duidelijk", "eigenlijk", "schadelijk", "mogelijk", "onmogelijk", "waarschijnlijk", "thee", "koffie", "taxi", "menu", "baby", "hobby", "pony", "jury", "bureau", "cadeau", "plateau", "niveau", "station", "actie", "politie", "vakantie", "informatie", "traditie", "positie", "conditie", "chauffeur", "douche", "machine", "chef", "journaal", "restaurant", "trottoir", "horloge", "garage", "bagage"],
        "AVI-E5": ["bibliotheek", "interessant", "temperatuur", "onmiddellijk", "belangrijk", "elektrisch", "verschillende", "eigenlijk", "omgeving", "gebeurtenis", "ervaring", "industrie", "internationaal", "communicatie", "organisatie", "president", "discussie", "officieel", "traditioneel", "automatisch", "fotograaf", "enthousiast", "atmosfeer", "categorie", "laboratorium", "journalist", "architect", "kampioenschap", "psycholoog", "helikopter", "paraplu", "professor", "abonnement", "encyclopedie", "ceremonie", "chocolade", "concert", "dinosaurus", "expeditie", "fantasie", "generatie", "instrument", "kritiek", "literatuur", "medicijn", "museum", "operatie", "populair", "respect", "signaal"]
    };
    const klanken = "abcdefghijklmnopqrstuvwxyz".split('').concat(["au", "ou", "oe", "eu", "ie", "ei", "ij", "ui", "oo", "ee", "aa", "uu", "eeuw", "ieuw", "aai", "ooi", "oei", "ng", "nk", "sch", "schr"]);
    
    let kaartItemsLijst = [];

    // --- PAGINA DETECTIE ---
    if (document.querySelector('.hoofd-menu')) {
        initKeuzeScherm();
    } else if (document.querySelector('#spel-wrapper')) {
        initSpelScherm();
    }

    // --- LOGICA VOOR HET KEUZESCHERM (pro/bingo.html) ---
    function initKeuzeScherm() {
        const kiesAviKnop = document.getElementById('kies-avi-knop');
        const aviSelectieDiv = document.getElementById('avi-selectie');
        const aviStartSubkeuzeDiv = document.getElementById('avi-start-subkeuze');
        const aviStartKlankkeuzeDiv = document.getElementById('avi-start-klankkeuze');
        const klankKiezerDiv = document.getElementById('klank-kiezer');
        const kiesGetalKnop = document.getElementById('kies-getal-knop');
        const getalSelectieDiv = document.getElementById('getal-selectie');
        const kiesTafelKnop = document.getElementById('kies-tafel-knop');
        const tafelSelectieDiv = document.getElementById('tafel-selectie');
        const tafelKiezerDiv = document.getElementById('tafel-kiezer');
        const startTafelSpelKnop = document.getElementById('start-tafel-spel-knop');
        const kiesRekenKnop = document.getElementById('kies-reken-knop');
        const rekenSelectieDiv = document.getElementById('reken-selectie');
        const startRekenSpelKnop = document.getElementById('start-reken-spel-knop');
        const importSpelKnop = document.getElementById('import-spel-knop');
        const importSpelInput = document.getElementById('import-spel-input');
        const herstelMelding = document.getElementById('herstel-melding');
        const herstelJaKnop = document.getElementById('herstel-ja');
        const herstelNeeKnop = document.getElementById('herstel-nee');
        const instructiePaneel = document.getElementById('instructie-paneel');
        const actiePaneel = document.getElementById('actie-paneel');
        const gekozenSpelTitel = document.getElementById('gekozen-spel-titel');
        const kaartenKnop = document.getElementById('maak-kaarten-knop');
        const exportSpelKnop = document.getElementById('export-spel-knop');
        const modalOverlay = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        const modalGenereerKnop = document.getElementById('modal-genereer-knop');
        const modalAnnulerenKnop = document.getElementById('modal-annuleren-knop');

        const opgeslagenSpelJSON = localStorage.getItem('bingoGameState');
        if (opgeslagenSpelJSON) {
            herstelMelding.classList.remove('verborgen');
        }

        herstelJaKnop.addEventListener('click', () => {
            const opgeslagenSpel = JSON.parse(localStorage.getItem('bingoGameState'));
            activeerSpel(
                opgeslagenSpel.levelNaam, 
                opgeslagenSpel.kaartItemsLijst, 
                opgeslagenSpel.isGetallenSpel, 
                opgeslagenSpel.isOefenSpel, 
                opgeslagenSpel.oefeningenLijst
            );
            herstelMelding.classList.add('verborgen');
        });

        herstelNeeKnop.addEventListener('click', () => {
            localStorage.removeItem('bingoGameState');
            herstelMelding.classList.add('verborgen');
        });
        
        function activeerSpel(levelNaam, itemsVoorKaart, isGetal = false, isOefening = false, oefeningen = {}) {
            const gameState = {
                levelNaam: levelNaam,
                kaartItemsLijst: itemsVoorKaart,
                isGetallenSpel: isGetal,
                isOefenSpel: isOefening,
                oefeningenLijst: oefeningen
            };
            localStorage.setItem('bingoGameState', JSON.stringify(gameState));
            kaartItemsLijst = [...itemsVoorKaart]; 

            gekozenSpelTitel.textContent = levelNaam;
            instructiePaneel.classList.add('verborgen');
            actiePaneel.classList.remove('verborgen');
        }

        // --- HIER IS DE ONTBREKENDE FUNCTIE TERUGGEPLAATST ---
        function genereerPrintbarePagina(aantalKaarten, kaartGrootte, vulAanMetDubbels) {
            const aantalVakjes = kaartGrootte * kaartGrootte;
            const actieKnoppenHTML = `
                <div class="actie-balk">
                    <button onclick="window.print()">🖨️ Afdrukken</button>
                    <button id="download-pdf-knop">📄 Download als PDF</button>
                    <button onclick="window.close()">❌ Sluiten</button>
                </div>
            `;
            const printStyles = `
                <style>
                    body { margin: 0; font-family: sans-serif; background: #eee; }
                    .actie-balk { padding: 10px; text-align: center; background: #333; }
                    .actie-balk button { font-size: 16px; padding: 10px 20px; margin: 0 10px; cursor: pointer; border-radius: 5px; border: none; color: white; }
                    .actie-balk button[onclick*="print"] { background-color: #27ae60; }
                    .actie-balk button#download-pdf-knop { background-color: #2980b9; }
                    .actie-balk button[onclick*="close"] { background-color: #c0392b; }
                    .actie-balk button:disabled { background-color: #95a5a6; cursor: not-allowed; }
                    #kaarten-wrapper { text-align: center; padding: 20px; background: white; }
                    .bingokaart { display: inline-block; width: 48%; margin: 1%; box-sizing: border-box; border: 2px solid black; page-break-inside: avoid; vertical-align: top; }
                    .bingokaart h3 { text-align: center; font-family: Arial, sans-serif; font-size: 18pt; background-color: #ddd; margin: 0; padding: 5px; }
                    .bingo-grid { display: grid; grid-template-columns: repeat(${kaartGrootte}, 1fr); }
                    .bingo-vakje { height: ${kaartGrootte === 5 ? '80px' : '90px'}; border: 1px solid #ccc; display: flex; justify-content: center; align-items: center; font-family: Arial, sans-serif; font-size: 14pt; font-weight: bold; padding: 2px; box-sizing: border-box; overflow: hidden; text-align: center; }
                    @media print {
                        body { background: white; }
                        .actie-balk { display: none; }
                        #kaarten-wrapper { padding: 0; }
                        @page { size: landscape; }
                        .bingokaart { width: 45%; height: 45vh; margin: 2%; }
                    }
                </style>`;
            const pdfScript = `
                <script>
                    document.getElementById('download-pdf-knop').addEventListener('click', async () => {
                        const downloadBtn = document.getElementById('download-pdf-knop');
                        downloadBtn.disabled = true;
                        downloadBtn.textContent = 'Bezig met genereren...';
                        const { jsPDF } = window.jspdf;
                        const bingoKaarten = document.querySelectorAll('.bingokaart');
                        try {
                            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                            const pageW = pdf.internal.pageSize.getWidth();
                            const pageH = pdf.internal.pageSize.getHeight();
                            const margin = 10;
                            if (bingoKaarten.length === 0) {
                                alert("Geen kaarten om te genereren.");
                                return;
                            }
                            const cardWidth = (pageW - 3 * margin) / 2;
                            const cardHeight = (pageH - 3 * margin) / 2;
                            for (let i = 0; i < bingoKaarten.length; i++) {
                                const kaart = bingoKaarten[i];
                                const kaartPositieOpPagina = i % 4;
                                if (i > 0 && kaartPositieOpPagina === 0) {
                                    pdf.addPage();
                                }
                                let cursorX, cursorY;
                                if (kaartPositieOpPagina === 0) { cursorX = margin; cursorY = margin; } 
                                else if (kaartPositieOpPagina === 1) { cursorX = margin * 2 + cardWidth; cursorY = margin; } 
                                else if (kaartPositieOpPagina === 2) { cursorX = margin; cursorY = margin * 2 + cardHeight; } 
                                else { cursorX = margin * 2 + cardWidth; cursorY = margin * 2 + cardHeight; }
                                const canvas = await html2canvas(kaart, { scale: 2 });
                                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', cursorX, cursorY, cardWidth, cardHeight);
                            }
                            pdf.save('bingokaarten.pdf');
                        } catch (error) {
                            console.error('Fout bij het genereren van de PDF:', error);
                            alert('Er is een fout opgetreden bij het maken van de PDF.');
                        } finally {
                            downloadBtn.disabled = false;
                            downloadBtn.textContent = '📄 Download als PDF';
                        }
                    });
                </script>`;

            let kaartenHTML = '';
            for (let i = 0; i < aantalKaarten; i++) {
                let kaartItems;
                if (vulAanMetDubbels) {
                    let aangevuldeLijst = [];
                    while (aangevuldeLijst.length < aantalVakjes) { aangevuldeLijst.push(...kaartItemsLijst); }
                    kaartItems = aangevuldeLijst.slice(0, aantalVakjes).sort(() => Math.random() - 0.5);
                } else {
                    const geschuddeItems = [...kaartItemsLijst].sort(() => Math.random() - 0.5);
                    kaartItems = geschuddeItems.slice(0, aantalVakjes);
                }
                kaartenHTML += `<div class="bingokaart"><h3>Bingokaart ${i + 1}</h3><div class="bingo-grid">`;
                kaartItems.forEach(item => { kaartenHTML += `<div class="bingo-vakje">${item}</div>`; });
                kaartenHTML += `</div></div>`;
            }
            
            return `<html><head><title>Bingokaarten</title>${printStyles}<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" integrity="sha512-BNaRQnYJYiPSqHHDb58B0yaPfCu+Wgds8Gp/gU33kqBtgNS4tSPHuGibyoeqMV/TJlSKda6FXzoEyYGjTe+vXA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" integrity="sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script></head><body>${actieKnoppenHTML}<div id="kaarten-wrapper">${kaartenHTML}</div>${pdfScript}</body></html>`;
        }
        
        kaartenKnop.addEventListener('click', () => {
            if (kaartItemsLijst.length === 0) {
                alert('Configureer of importeer eerst een spel.');
                return;
            }
            toonKaartOptiesModal();
        });

        function toonKaartOptiesModal() {
            const MIN_KAARTEN = 4;
            const aantalItems = kaartItemsLijst.length;
            
            modalBody.innerHTML = `
                <div class="modal-optie">
                    <label for="aantal-kaarten-input">Hoeveel kaarten wil je maken?</label>
                    <input type="number" id="aantal-kaarten-input" value="25" min="${MIN_KAARTEN}" step="1">
                </div>
                <div class="modal-optie">
                    <label>Kies de kaartgrootte (suggesties):</label>
                    <div id="grid-opties-wrapper"></div>
                </div>
            `;
            const gridOptiesWrapper = document.getElementById('grid-opties-wrapper');

            function updateGridOpties() {
                gridOptiesWrapper.innerHTML = '';
                let besteOptie = null;
                if (aantalItems >= 25) besteOptie = 5;
                else if (aantalItems >= 16) besteOptie = 4;
                else if (aantalItems >= 9) besteOptie = 3;

                if (aantalItems >= 9) {
                    const aanbevolen = (besteOptie === 3) ? ' <strong>(Aanbevolen)</strong>' : '';
                    gridOptiesWrapper.innerHTML += `<label><input type="radio" name="grid-grootte" value="3"> 3x3 (vereist 9 items)${aanbevolen}</label>`;
                }
                if (aantalItems >= 16) {
                    const aanbevolen = (besteOptie === 4) ? ' <strong>(Aanbevolen)</strong>' : '';
                    gridOptiesWrapper.innerHTML += `<label><input type="radio" name="grid-grootte" value="4"> 4x4 (vereist 16 items)${aanbevolen}</label>`;
                }
                if (aantalItems >= 25) {
                    const aanbevolen = (besteOptie === 5) ? ' <strong>(Aanbevolen)</strong>' : '';
                    gridOptiesWrapper.innerHTML += `<label><input type="radio" name="grid-grootte" value="5"> 5x5 (vereist 25 items)${aanbevolen}</label>`;
                }
                gridOptiesWrapper.innerHTML += `<label><input type="radio" name="grid-grootte" value="5-dubbel"> 5x5 (met dubbels)<small>Verhoogt de kans dat meerdere kinderen tegelijk bingo hebben.</small></label>`;

                if (besteOptie) {
                    document.querySelector(`input[name="grid-grootte"][value="${besteOptie}"]`).checked = true;
                } else {
                    document.querySelector(`input[name="grid-grootte"][value="5-dubbel"]`).checked = true;
                }
            }
            
            updateGridOpties();
            modalOverlay.classList.remove('verborgen');
        }
        
        modalGenereerKnop.addEventListener('click', () => {
            const aantalKaarten = parseInt(document.getElementById('aantal-kaarten-input').value);
            const gekozenGridInput = document.querySelector('input[name="grid-grootte"]:checked');
            if (!gekozenGridInput) { alert('Selecteer een kaartgrootte.'); return; }
            const gekozenGrid = gekozenGridInput.value;
            if (!aantalKaarten || aantalKaarten < 4) { alert('Voer een geldig aantal kaarten in (minimaal 4).'); return; }
            let kaartGrootte;
            let vulAanMetDubbels = false;
            if (gekozenGrid === '5-dubbel') {
                kaartGrootte = 5;
                vulAanMetDubbels = true;
            } else {
                kaartGrootte = parseInt(gekozenGrid);
            }
            const html = genereerPrintbarePagina(aantalKaarten, kaartGrootte, vulAanMetDubbels);
            if (html) {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(html);
                printWindow.document.close();
            }
            modalOverlay.classList.add('verborgen');
        });

        modalAnnulerenKnop.onclick = () => { modalOverlay.classList.add('verborgen'); };

        exportSpelKnop.addEventListener('click', () => {
            const opgeslagenSpel = localStorage.getItem('bingoGameState');
            if (!opgeslagenSpel) {
                alert('Er is geen actief spel om te exporteren.');
                return;
            }
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(opgeslagenSpel);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "bingo-spel.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });

        importSpelKnop.addEventListener('click', () => {
            importSpelInput.click(); 
        });

        importSpelInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const geimporteerdSpel = JSON.parse(e.target.result);
                    if (geimporteerdSpel.levelNaam && geimporteerdSpel.kaartItemsLijst) {
                        activeerSpel(
                            geimporteerdSpel.levelNaam,
                            geimporteerdSpel.kaartItemsLijst,
                            geimporteerdSpel.isGetallenSpel,
                            geimporteerdSpel.isOefenSpel,
                            geimporteerdSpel.oefeningenLijst
                        );
                        alert('Spel succesvol geïmporteerd!');
                    } else {
                        alert('Fout: Het gekozen bestand is geen geldig bingospel-bestand.');
                    }
                } catch (error) {
                    alert('Fout bij het lezen van het bestand. Is het een geldig JSON-bestand?');
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        });

        function verbergAlleMenus() {
            aviSelectieDiv.classList.add('verborgen');
            aviStartSubkeuzeDiv.classList.add('verborgen');
            aviStartKlankkeuzeDiv.classList.add('verborgen');
            getalSelectieDiv.classList.add('verborgen');
            tafelSelectieDiv.classList.add('verborgen');
            rekenSelectieDiv.classList.add('verborgen');
        }

        kiesAviKnop.addEventListener('click', () => { verbergAlleMenus(); aviSelectieDiv.classList.toggle('verborgen'); });
        kiesGetalKnop.addEventListener('click', () => { verbergAlleMenus(); getalSelectieDiv.classList.toggle('verborgen'); });
        kiesTafelKnop.addEventListener('click', () => { verbergAlleMenus(); tafelSelectieDiv.classList.toggle('verborgen'); });
        kiesRekenKnop.addEventListener('click', () => { verbergAlleMenus(); rekenSelectieDiv.classList.toggle('verborgen'); });

        document.querySelectorAll('.avi-knop').forEach(knop => {
            knop.addEventListener('click', (e) => {
                const level = e.target.dataset.level;
                if (level === 'AVI-START') {
                    aviStartSubkeuzeDiv.classList.remove('verborgen');
                } else { 
                    activeerSpel(level, woordenLijsten[level]);
                }
            });
        });

        document.getElementById('start-met-letters').addEventListener('click', () => { toonKlankKiezer("letters"); });
        document.getElementById('start-met-woorden').addEventListener('click', () => { toonKlankKiezer("woorden"); });
        
        function toonKlankKiezer(modus) {
            klankKiezerDiv.dataset.mode = modus;
            klankKiezerDiv.innerHTML = '';
            klanken.forEach(klank => {
                const btn = document.createElement('button');
                btn.className = 'klank-knop';
                btn.textContent = klank;
                btn.dataset.klank = klank;
                btn.addEventListener('click', () => btn.classList.toggle('selected'));
                klankKiezerDiv.appendChild(btn);
            });
            aviStartKlankkeuzeDiv.classList.remove('verborgen');
        }

        document.getElementById('start-met-klanken-knop').addEventListener('click', () => {
            const geselecteerde = [...document.querySelectorAll('#klank-kiezer .klank-knop.selected')].map(k => k.dataset.klank);
            if (geselecteerde.length === 0) { alert('Selecteer eerst letters of klanken.'); return; }
            if (klankKiezerDiv.dataset.mode === "letters") {
                activeerSpel("AVI Start (Klanken)", geselecteerde);
            } else {
                const gefilterdeWoorden = woordenLijsten["AVI-START"].filter(woord => {
                    let tempWoord = woord;
                    for (const klank of geselecteerde.sort((a, b) => b.length - a.length)) { tempWoord = tempWoord.split(klank).join(''); }
                    return tempWoord.length === 0;
                });
                activeerSpel("AVI Start (Woorden)", gefilterdeWoorden);
            }
        });

        document.querySelectorAll('.getal-knop').forEach(knop => {
            knop.addEventListener('click', (e) => {
                const max = parseInt(e.target.dataset.max);
                activeerSpel(`Getallen tot ${max}`, Array.from({ length: max }, (_, i) => i + 1), true);
            });
        });

        function initTafelKiezer() {
            tafelKiezerDiv.innerHTML = '';
            for (let i = 1; i <= 12; i++) {
                const btn = document.createElement('button');
                btn.className = 'tafel-knop-select';
                btn.textContent = i;
                btn.dataset.tafel = i;
                btn.addEventListener('click', () => btn.classList.toggle('selected'));
                tafelKiezerDiv.appendChild(btn);
            }
        }
        initTafelKiezer();

        startTafelSpelKnop.addEventListener('click', () => {
            const geselecteerdeTafels = [...document.querySelectorAll('#tafel-kiezer .selected')].map(k => parseInt(k.dataset.tafel));
            const type = document.querySelector('input[name="tafel-type"]:checked').value;
            if (geselecteerdeTafels.length === 0) { alert('Selecteer eerst één of meerdere tafels.'); return; }
            const nieuweOefeningen = {};
            const antwoorden = [];
            geselecteerdeTafels.forEach(tafel => {
                if (type === 'maal' || type === 'mix') {
                    for (let i = 1; i <= 10; i++) {
                        nieuweOefeningen[`${tafel} x ${i}`] = tafel * i;
                        antwoorden.push(tafel * i);
                    }
                }
                if (type === 'deel' || type === 'mix') {
                    for (let i = 1; i <= 10; i++) {
                        nieuweOefeningen[`${tafel * i} / ${tafel}`] = i;
                        antwoorden.push(i);
                    }
                }
            });
            activeerSpel("Tafelbingo", [...new Set(antwoorden)], false, true, nieuweOefeningen);
        });

        startRekenSpelKnop.addEventListener('click', () => {
            const max = parseInt(document.querySelector('input[name="reken-bereik"]:checked').value);
            const brug = document.querySelector('input[name="reken-brug"]:checked').value;
            const bewerking = document.querySelector('input[name="reken-bewerking"]:checked').value;
            const nieuweOefeningen = {};
            let pogingen = 0;
            const checkOptelBrug = (a, b) => (a % 10) + (b % 10) >= 10;
            const checkAftrekBrug = (a, b) => (a % 10) < (b % 10);
            while (Object.keys(nieuweOefeningen).length < 50 && pogingen < 2000) {
                pogingen++;
                const gekozenBewerking = (bewerking === 'mix') ? (Math.random() < 0.5 ? 'optellen' : 'aftrekken') : bewerking;
                if (gekozenBewerking === 'optellen') {
                    const a = Math.floor(Math.random() * (max + 1));
                    const b = Math.floor(Math.random() * (max - a + 1));
                    const heeftBrug = checkOptelBrug(a, b);
                    if (brug === 'gemengd' || (brug === 'met' && heeftBrug) || (brug === 'zonder' && !heeftBrug)) {
                        nieuweOefeningen[`${a} + ${b}`] = a + b;
                    }
                } else {
                    const a = Math.floor(Math.random() * (max + 1));
                    const b = Math.floor(Math.random() * (a + 1));
                    const heeftBrug = checkAftrekBrug(a, b);
                    if (brug === 'gemengd' || (brug === 'met' && heeftBrug) || (brug === 'zonder' && !heeftBrug)) {
                        nieuweOefeningen[`${a} - ${b}`] = a - b;
                    }
                }
            }
            const uniekeAntwoorden = [...new Set(Object.values(nieuweOefeningen))];
            if (uniekeAntwoorden.length === 0) {
                alert('Kon geen oefeningen vinden voor deze selectie. Probeer een andere combinatie.');
                return;
            }
            activeerSpel(`Rekenbingo tot ${max}`, uniekeAntwoorden, false, true, nieuweOefeningen);
        });
    }

    // --- LOGICA VOOR HET SPELSCHERM (pro/spel.html) ---
    function initSpelScherm() {
        const spelWrapper = document.getElementById('spel-wrapper');
        const titel = document.getElementById('huidig-niveau-titel');
        const itemsOverzichtDiv = document.getElementById('items-overzicht');
        const ballenBandDiv = document.getElementById('ballen-band');
        const startKnop = document.getElementById('start-schuiven-knop');
        const machineDiv = document.getElementById('schuif-machine');
        const geenSpelMelding = document.getElementById('geen-spel-melding');
        let teTrekkenItems = [];
        let ballenItems = [];

        const opgeslagenSpelJSON = localStorage.getItem('bingoGameState');
        if (!opgeslagenSpelJSON) {
            spelWrapper.classList.add('verborgen');
            geenSpelMelding.classList.remove('verborgen');
            return;
        }

        const spelData = JSON.parse(opgeslagenSpelJSON);
        titel.textContent = spelData.levelNaam;
        
        let huidigeSpelItems;
        if (spelData.isOefenSpel) {
            teTrekkenItems = Object.keys(spelData.oefeningenLijst);
            huidigeSpelItems = [...teTrekkenItems];
        } else {
            teTrekkenItems = [...spelData.kaartItemsLijst];
            huidigeSpelItems = [...teTrekkenItems];
        }

        const sortedItems = [...huidigeSpelItems].sort((a, b) => String(a).localeCompare(String(b), undefined, {numeric: true}));
        sortedItems.forEach(item => {
            const itemSpan = document.createElement('span');

            // --- AANGEPAST BLOK ---
            // Als het een getallenspel is, toon H/T/E notatie. Anders, toon de opgave/het woord.
            if (spelData.isGetallenSpel) {
                itemSpan.textContent = ontleedGetal(item);
            } else {
                itemSpan.textContent = String(item).replace(/\*/g, '×').replace(/\//g, '÷');
            }
            // --- EINDE AANPASSING ---
            
            itemSpan.id = `item-${item}`;
            itemsOverzichtDiv.appendChild(itemSpan);
        });
        
        const kleuren = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
        ballenItems = [...huidigeSpelItems];
        const geschuddeItems = [...ballenItems].sort(() => Math.random() - 0.5);
        const ballenLijst = [...geschuddeItems, ...geschuddeItems, ...geschuddeItems];
        ballenBandDiv.innerHTML = '';
        ballenLijst.forEach((item, index) => {
            const balDiv = document.createElement('div');
            balDiv.className = 'bal';
            balDiv.textContent = spelData.isOefenSpel ? String(item).replace(/\*/g, '×').replace(/\//g, '÷') : (spelData.isGetallenSpel ? ontleedGetal(item) : item);
            balDiv.style.backgroundColor = kleuren[index % kleuren.length];
            balDiv.dataset.item = item;
            ballenBandDiv.appendChild(balDiv);
        });
        
        startKnop.addEventListener('click', () => {
            if (teTrekkenItems.length === 0) { alert("Alle items zijn geweest!"); startKnop.disabled = true; return; }
            startKnop.disabled = true;

            const randomIndex = Math.floor(Math.random() * teTrekkenItems.length);
            const gekozenItem = teTrekkenItems.splice(randomIndex, 1)[0];
            const itemSpan = document.getElementById(`item-${gekozenItem}`);
            const alleBallen = document.querySelectorAll('.bal');
            let doelBal = null;
            for (let i = Math.floor(ballenItems.length * 1.5); i < alleBallen.length; i++) {
                if (alleBallen[i]?.dataset.item === String(gekozenItem)) { doelBal = alleBallen[i]; break; }
            }
            if (!doelBal) {
                for (let i = 0; i < alleBallen.length; i++) {
                    if (alleBallen[i]?.dataset.item === String(gekozenItem)) { doelBal = alleBallen[i]; break; }
                }
            }
            
            if (doelBal) {
                const machineBreedte = machineDiv.offsetWidth;
                const doelPositie = doelBal.offsetLeft + (doelBal.offsetWidth / 2);
                const schuifAfstand = (machineBreedte / 2) - doelPositie;
                ballenBandDiv.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)';
                ballenBandDiv.style.transform = `translateX(${schuifAfstand}px)`;
            }

            setTimeout(() => {
                if (itemSpan) itemSpan.classList.add('is-geweest');
                if (teTrekkenItems.length > 0) { 
                    startKnop.disabled = false; 
                } else { 
                    alert("Alle items van dit niveau zijn geweest!"); 
                }
            }, 4000);
        });
    }
    
    // Hulpfunctie die door beide schermen gebruikt kan worden
    function ontleedGetal(n) {
        if (n >= 1000) return n;
        let h = Math.floor(n / 100);
        let t = Math.floor((n % 100) / 10);
        let e = n % 10;
        let parts = [];
        if (h > 0) parts.push(`${h}H`);
        if (t > 0) parts.push(`${t}T`);
        if (e > 0 || n === 0) parts.push(`${e}E`);
        return parts.join(' ');
    }
});