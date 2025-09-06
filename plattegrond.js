document.addEventListener('DOMContentLoaded', () => {
    const canvasEl = document.getElementById('canvas');
    const canvas = new fabric.Canvas(canvasEl, {
        backgroundColor: '#fff',
        preserveObjectStacking: true
    });

    // === LEGENDE-NAAMMAPPING (bepaalt ook wat wel/niet in legende komt) ===
    // Alles wat hier geen sleutel heeft, verschijnt NIET in de legende (bv. 'paal').
    const legendeNamen = {
        bureau: "Bureau juf",
        leerlingBureau: "Bureau",
        schoolbank: "Schoolbank",
        kast: "Kast",
        wastafel: "Wastafel",
        schoolbord: "Schoolbord",
        schoolbordFlappen: "Schoolbord",
        deur: "Deur",
        raam: "Raam",
        muur: "Muur",
        kring: "Kring"
        // paal bewust weggelaten
    };

    // --- HELPER: INTERACTIEVE OBJECTEN ---
    function maakInteractief(obj) {
        obj.set({
            selectable: true,
            hasControls: true,
            hasBorders: true,
            lockScalingFlip: true,
            lockUniScaling: false,
            cornerStyle: 'circle',
            transparentCorners: false,
            borderDashArray: null
        });
        return obj;
    }

    // --- PAD NAAR PNG-MEUBELS ---
    const IMG_PATH = 'plattegrond_afbeeldingen/';

    // --- HELPER: HTML-icoon (voor de legendeweergave op pagina) ---
    function maakIcoonElement(type) {
        // PNG-types (exact dezelfde als op de plattegrond)
        const pngTypes = ['schoolbank','bureau','kast','wastafel', 'kring'];
        if (pngTypes.includes(type)) {
            const wrapper = document.createElement('span');
            wrapper.style.display = 'inline-flex';
            wrapper.style.justifyContent = 'center';
            wrapper.style.alignItems = 'center';
            wrapper.style.width = '30px';
            wrapper.style.height = '30px';
            wrapper.style.border = '1px solid #333';
            wrapper.style.margin = '0 8px';

            const img = document.createElement('img');
            img.src = `${IMG_PATH}${type}.png`;
            img.alt = type;
            img.style.maxWidth = '24px';
            img.style.maxHeight = '24px';
            wrapper.appendChild(img);
            return wrapper;
        }

        // Vector-icoontjes (aangepast aan wat op canvas gebruikt wordt)
        let svg = '';
        if (type === 'leerlingBureau') {
            svg = `<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
                     <rect x="2" y="2" width="56" height="36" fill="none" stroke="#333" stroke-width="2"/>
                     <circle cx="45" cy="20" r="6" fill="none" stroke="#333" stroke-width="2"/>
                   </svg>`;
        } else if (type === 'tafel') {
            svg = `<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg">
                     <rect x="2" y="2" width="76" height="46" fill="none" stroke="#333" stroke-width="2"/>
                   </svg>`;
        } else if (type === 'schoolbord' || type === 'schoolbordFlappen') {
            // LET OP: neutraal lichtgrijs zoals op plattegrond
            svg = `<svg viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg">
                     <rect x="10" y="10" width="100" height="10" fill="#e6e6e6" stroke="#000" stroke-width="2"/>
                     ${type === 'schoolbordFlappen'
                        ? `<rect x="-15" y="10" width="25" height="10" fill="#f2f2f2" stroke="#000" stroke-width="2"/>
                           <rect x="110" y="10" width="25" height="10" fill="#f2f2f2" stroke="#000" stroke-width="2"/>`
                        : '' }
                   </svg>`;
        } else if (type === 'muur') {
            svg = `<svg viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg">
                     <line x1="5" y1="10" x2="115" y2="10" stroke="#333" stroke-width="8" />
                   </svg>`;
        } else if (type === 'deur') {
            svg = `<svg viewBox="0 0 50 45" xmlns="http://www.w3.org/2000/svg">
                     <line x1="5" y1="5" x2="5" y2="40" stroke="#000" stroke-width="2"/>
                     <path d="M5 5 Q45 5 45 40" fill="none" stroke="#000" stroke-width="2"/>
                   </svg>`;
        } else if (type === 'raam') {
            svg = `<svg viewBox="0 0 84 16" xmlns="http://www.w3.org/2000/svg">
                     <rect x="2" y="4" width="80" height="8" fill="#fff" stroke="#000" stroke-width="1.5"/>
                     <line x1="6" y1="8" x2="78" y2="8" stroke="#6cace4" stroke-width="2.5"/>
                   </svg>`;
        } else {
            svg = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"></svg>`;
        }

        const wrapper = document.createElement('span');
        wrapper.style.display = 'inline-flex';
        wrapper.style.justifyContent = 'center';
        wrapper.style.alignItems = 'center';
        wrapper.style.width = '30px';
        wrapper.style.height = '30px';
        wrapper.style.border = '1px solid #333';
        wrapper.style.margin = '0 8px';
        wrapper.innerHTML = svg;
        return wrapper;
    }

    // --- VARIABELEN & STATUS ---
    let modus = 'meubel';
    let isWisselModusActief = false;
    let bouwTool = '';
    let isDrawingWall = false;
    let wallStartPoint;
    let gridVisible = false;
    let gridGroup = new fabric.Group([], { selectable: false, evented: false, excludeFromExport: true });
    const gridSize = 20;
    let actieveLegendeType = null;
    let actieveLegendeKleur = '#FFEB3B'; // Start met geel
    // Map: type -> { kleur: string|null }
    let gebruikteLegendeItems = new Map();
    let history = [];
    let redoStack = [];
    let isUpdatingState = false;
    const customProperties = ['studentNaam', 'voorwerpType', 'isNaam', 'gekoppeldAan'];

    // --- UI ELEMENTEN ---
    const formaatWisselKnop = document.getElementById('formaatWisselKnop');
    const undoKnop = document.getElementById('undoKnop');
    const redoKnop = document.getElementById('redoKnop');
    const verwijderKnop = document.getElementById('verwijderKnop');
    const dupliceerKnop = document.getElementById('dupliceerKnop');
    const nieuwKnop = document.getElementById('nieuwKnop');
    const exporteerJsonKnop = document.getElementById('exporteerJsonKnop');
    const importeerJsonKnop = document.getElementById('importeerJsonKnop');
    const jsonFileInput = document.getElementById('json-file-input');
    const legendeCategorieKnoppen = document.querySelectorAll('#legende-categorieen button');
    const modusKnoppen = {
        bouw: document.getElementById('bouwModusKnop'),
        meubel: document.getElementById('meubelModusKnop'),
        namen: document.getElementById('namenModusKnop'),
        legende: document.getElementById('legendeModusKnop'),
        wissel: document.getElementById('wisselModusKnop')
    };
    const werkbalken = {
        bouw: document.getElementById('bouw-werkbalk'),
        meubel: document.getElementById('meubel-werkbalk'),
        namen: document.getElementById('namen-werkbalk'),
    };
    const legendeContainer = document.getElementById('legende-container');
    const rasterToggle = document.getElementById('rasterToggle');
    const namenTonenToggle = document.getElementById('namenTonenToggle');
    const namenWachtlijstContainer = document.getElementById('namen-wachtlijst-container');
    const namenLijst = document.getElementById('namen-lijst');
    const kleurenpalet = document.getElementById('kleurenpalet');

    // --- FORMAAT WISSELEN LOGICA ---
    function wisselCanvasFormaat() {
        const wasRasterZichtbaar = gridVisible;
        const json = canvas.toJSON(customProperties);

        const oldWidth = canvas.getWidth();
        const oldHeight = canvas.getHeight();

        canvas.setWidth(oldHeight);
        canvas.setHeight(oldWidth);
        canvasEl.width = oldHeight;
        canvasEl.height = oldWidth;

        canvas.loadFromJSON(json, () => {
            canvas.renderAll();
            if (wasRasterZichtbaar) tekenRaster();
        });

        setTimeout(saveStateImmediate, 200);
    }
    formaatWisselKnop.addEventListener('click', wisselCanvasFormaat);

    // --- PERFORMANCE HELPER: DEBOUNCE ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // --- AUTOMATISCH OPSLAAN & HERLADEN ---
    function slaCanvasOpInBrowser() {
        if (isUpdatingState) return;
        try {
            const json = JSON.stringify(canvas.toJSON(customProperties));
            localStorage.setItem('plattegrondData', json);
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error("LocalStorage quota overschreden. Automatisch opslaan is uitgeschakeld.");
                if (!window.quotaExceededNotified) {
                    alert("De plattegrond is te groot geworden voor automatisch opslaan in de browser. Exporteer uw werk handmatig om verlies te voorkomen.");
                    window.quotaExceededNotified = true;
                }
            } else {
                console.error("Kon niet opslaan naar localStorage:", e);
            }
        }
    }
    function laadCanvasUitBrowser() {
        const opgeslagenData = localStorage.getItem('plattegrondData');
        if (opgeslagenData) {
            if (confirm("Er is een opgeslagen tekening gevonden. Wilt u deze herstellen?")) {
                laadJsonData(opgeslagenData);
            } else {
                localStorage.removeItem('plattegrondData');
                startNieuweTekening(false);
            }
        } else {
            startNieuweTekening(false);
        }
    }
    function startNieuweTekening(vraagBevestiging = true) {
        if (vraagBevestiging && !confirm("Weet u zeker dat u alles wilt wissen en opnieuw wilt beginnen?")) return;
        isUpdatingState = true;
        canvas.clear();
        canvas.backgroundColor = '#fff';
        isUpdatingState = false;

        rasterToggle.checked = false;
        gridVisible = false;
        canvas.remove(gridGroup);
        rebuildLegendFromCanvas();

        canvas.renderAll();

        localStorage.removeItem('plattegrondData');
        const emptyState = JSON.stringify(canvas.toJSON(customProperties));
        history = [emptyState];
        redoStack = [];
        updateUndoRedoButtons();
    }
    nieuwKnop.addEventListener('click', () => startNieuweTekening(true));

    // --- UNDO / REDO ---
    const saveState = debounce(() => {
        if (isUpdatingState || isWisselModusActief || canvas.isDrawingMode) return;
        redoStack = [];
        const jsonState = JSON.stringify(canvas.toJSON(customProperties));
        history.push(jsonState);
        slaCanvasOpInBrowser();
        updateUndoRedoButtons();
    }, 300);
    function saveStateImmediate() {
        if (isUpdatingState || isWisselModusActief || canvas.isDrawingMode) return;
        redoStack = [];
        const jsonState = JSON.stringify(canvas.toJSON(customProperties));
        history.push(jsonState);
        slaCanvasOpInBrowser();
        updateUndoRedoButtons();
    }
    function undo() {
        if (history.length > 1) {
            isUpdatingState = true;
            redoStack.push(history.pop());
            const prevState = history[history.length - 1];
            laadJsonData(prevState, true);
        }
        updateUndoRedoButtons();
    }
    function redo() {
        if (redoStack.length > 0) {
            isUpdatingState = true;
            const nextState = redoStack.pop();
            history.push(nextState);
            laadJsonData(nextState, true);
        }
        updateUndoRedoButtons();
    }
    function updateUndoRedoButtons() {
        undoKnop.disabled = history.length <= 1;
        redoKnop.disabled = redoStack.length === 0;
    }
    canvas.on('object:added', saveStateImmediate);
    canvas.on('object:modified', saveState);
    canvas.on('path:created', saveStateImmediate);
    undoKnop.addEventListener('click', undo);
    redoKnop.addEventListener('click', redo);

    // --- JSON IMP/EXP ---
    function laadJsonData(jsonData, isUndoRedo = false) {
        isUpdatingState = true;
        canvas.clear();
        rasterToggle.checked = false;
        gridVisible = false;

        const data = JSON.parse(jsonData);
        if (data.width && data.height) {
            canvas.setWidth(data.width);
            canvas.setHeight(data.height);
        }

        canvas.loadFromJSON(jsonData, () => {
            const objectsToRemove = [];
            canvas.forEachObject(obj => {
                if (obj.type === 'line' && obj.stroke === '#ddd' && obj.selectable === false && obj.evented === false) {
                    objectsToRemove.push(obj);
                }
                if (obj.type === 'group' && obj.getObjects().length > 10 && obj.getObjects()[0].stroke === '#ddd') {
                     objectsToRemove.push(obj);
                }
            });
            if (objectsToRemove.length > 0) {
                objectsToRemove.forEach(obj => canvas.remove(obj));
            }

            isUpdatingState = false;
            if (!isUndoRedo) {
                history = [typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData)];
                redoStack = [];
                slaCanvasOpInBrowser();
                updateUndoRedoButtons();
            }
            schakelModus('meubel', true);
            setNamenZichtbaarheid(namenTonenToggle.checked);
            rebuildLegendFromCanvas();
            canvas.renderAll();
        });
    }
    exporteerJsonKnop.addEventListener('click', () => {
        const json = canvas.toJSON(customProperties);
        json.width = canvas.getWidth();
        json.height = canvas.getHeight();
        const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'klasplattegrond.json';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    });
    importeerJsonKnop.addEventListener('click', () => jsonFileInput.click());
    jsonFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try { laadJsonData(event.target.result); }
            catch { alert("Fout bij het importeren. Is dit een geldig plattegrond-bestand?"); }
        };
        reader.readAsText(file); e.target.value = '';
    });

    // --- WISSELMODUS ---
    function startPlaatsenWisselen() {
        const groepen = canvas.getObjects().filter(obj => obj.studentNaam);
        if (groepen.length === 0) { alert("Er zijn geen namen op de plattegrond om te wisselen."); return; }
        isWisselModusActief = true; schakelModus('wissel'); modusKnoppen.wissel.textContent = 'Klaar';

        let clonesDone = 0; const clonedMeubels = []; const namenVoorWachtruimte = [];
        groepen.forEach(groep => {
            const meubel = groep.getObjects().find(item => !item.isNaam);
            const naam = groep.studentNaam;
            if (meubel) {
                meubel.clone(kloon => {
                    kloon.set({ left: groep.getCenterPoint().x, top: groep.getCenterPoint().y,
                        angle: groep.angle, originX: 'center', originY: 'center',
                        selectable: false, evented: false });
                    clonedMeubels.push(kloon); namenVoorWachtruimte.push(naam);
                    clonesDone++;
                    if (clonesDone === groepen.length) {
                        groepen.forEach(g => canvas.remove(g));
                        clonedMeubels.forEach(m => canvas.add(m));
                        namenLijst.innerHTML = '';
                        namenVoorWachtruimte.forEach(n => {
                            const naamItem = document.createElement('div');
                            naamItem.className = 'naam-item'; naamItem.draggable = true;
                            naamItem.textContent = n.trim(); naamItem.dataset.naam = n.trim();
                            namenLijst.appendChild(naamItem);
                        });
                        namenWachtlijstContainer.classList.remove('verborgen');
                        canvas.renderAll();
                    }
                }, customProperties);
            } else {
                clonesDone++; if (clonesDone === groepen.length) { groepen.forEach(g => canvas.remove(g)); canvas.renderAll(); }
            }
        });
        namenLijst.addEventListener('dragstart', handleDragStart);
        canvas.upperCanvasEl.addEventListener('dragover', handleDragOver);
        canvas.upperCanvasEl.addEventListener('drop', handleDrop);
    }
    function stopPlaatsenWisselen() {
        if (namenLijst.children.length > 0) {
            if (!confirm("Er staan nog namen in de wachtruimte. Stoppen? Niet-geplaatste namen worden verwijderd.")) return;
        }
        isWisselModusActief = false; modusKnoppen.wissel.textContent = 'Plaatsen Wisselen';
        namenWachtlijstContainer.classList.add('verborgen'); namenLijst.innerHTML = '';
        namenLijst.removeEventListener('dragstart', handleDragStart);
        canvas.upperCanvasEl.removeEventListener('dragover', handleDragOver);
        canvas.upperCanvasEl.removeEventListener('drop', handleDrop);

        let teVerwijderen = []; let teGroeperen = new Map();
        canvas.forEachObject(obj => {
            if (obj.isNaam) {
                const meubel = canvas.getObjects().find(m => m.gekoppeldAan === obj.studentNaam);
                if (meubel) teGroeperen.set(obj.studentNaam, { naamObj: obj, meubelObj: meubel });
                else teVerwijderen.push(obj);
            }
        });
        teGroeperen.forEach(({ naamObj, meubelObj }) => {
            groepeerNaamMetObject(naamObj.studentNaam, meubelObj);
            teVerwijderen.push(naamObj, meubelObj);
        });
        teVerwijderen.forEach(obj => canvas.remove(obj));
        canvas.forEachObject(obj => { if (obj.voorwerpType) obj.set({ gekkoppeldAan: null }); obj.set({ selectable: true, evented: true }); });
        schakelModus('meubel'); saveStateImmediate();
    }
    function handleDragStart(e){ e.dataTransfer.setData('text/plain', e.target.dataset.naam); e.dataTransfer.effectAllowed='move'; }
    function handleDragOver(e){ e.preventDefault(); e.dataTransfer.dropEffect='move'; }
    function handleDrop(e){
        e.preventDefault();
        const naam = e.dataTransfer.getData('text/plain').trim(); if (!naam) return;
        const pointer = canvas.getPointer(e);
        const meubels = canvas.getObjects().filter(obj => obj.voorwerpType && !obj.isNaam);
        const doelMeubel = meubels.reverse().find(m => m.containsPoint(pointer));
        if (!doelMeubel) return;

        const zittendeNaam = doelMeubel.gekoppeldAan;
        if (zittendeNaam && zittendeNaam !== naam) {
            const zittendeNaamObject = canvas.getObjects().find(o => o.isNaam && o.studentNaam === zittendeNaam);
            if (zittendeNaamObject) canvas.remove(zittendeNaamObject);
            doelMeubel.set('gekoppeldAan', null);
            const naamItem = document.createElement('div');
            naamItem.className = 'naam-item'; naamItem.draggable = true;
            naamItem.textContent = zittendeNaam; naamItem.dataset.naam = zittendeNaam;
            namenLijst.appendChild(naamItem);
        }
        const gesleepteNaamElement = Array.from(namenLijst.children).find(el => el.dataset.naam === naam);
        if (gesleepteNaamElement) gesleepteNaamElement.remove();

        const alGeplaatsteNaam = canvas.getObjects().find(obj => obj.studentNaam === naam && obj.isNaam);
        if (alGeplaatsteNaam) canvas.remove(alGeplaatsteNaam);

        const tekst = new fabric.IText(naam, {
            left: doelMeubel.getCenterPoint().x, top: doelMeubel.getCenterPoint().y,
            fontSize: 16, fontFamily: 'Arial', originX: 'center', originY: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 4,
            studentNaam: naam, isNaam: true, selectable: true
        });
        doelMeubel.set('gekoppeldAan', naam);
        canvas.add(tekst); canvas.renderAll();
    }
    canvas.on('object:modified', (e) => {
        if (!isWisselModusActief || !e.target.isNaam) return;
        const naamObject = e.target;
        const meubels = canvas.getObjects().filter(obj => obj.voorwerpType && !obj.isNaam);
        const vorigMeubel = meubels.find(m => m.gekoppeldAan === naamObject.studentNaam);
        const doelMeubel = meubels.find(m => m.containsPoint(naamObject.getCenterPoint()));
        if (doelMeubel && doelMeubel !== vorigMeubel) {
            const zittendeNaam = doelMeubel.gekoppeldAan;
            if (zittendeNaam && vorigMeubel) {
                const zittendeNaamObject = canvas.getObjects().find(o => o.isNaam && o.studentNaam === zittendeNaam);
                if (zittendeNaamObject) {
                    zittendeNaamObject.set({ left: vorigMeubel.getCenterPoint().x, top: vorigMeubel.getCenterPoint().y });
                    vorigMeubel.set('gekoppeldAan', zittendeNaam);
                    zittendeNaamObject.setCoords();
                }
            } else if (vorigMeubel) {
                vorigMeubel.set('gekoppeldAan', null);
            }
            naamObject.set({ left: doelMeubel.getCenterPoint().x, top: doelMeubel.getCenterPoint().y });
            doelMeubel.set('gekoppeldAan', naamObject.studentNaam);
        } else if (!doelMeubel && vorigMeubel) {
            vorigMeubel.set('gekoppeldAan', null);
        } else if (vorigMeubel) {
            naamObject.set({ left: vorigMeubel.getCenterPoint().x, top: vorigMeubel.getCenterPoint().y });
        }
        naamObject.setCoords(); canvas.requestRenderAll();
    });

    // --- MODUS SWITCHER ---
    function schakelModus(nieuweModus) {
        modus = nieuweModus; canvas.isDrawingMode = false;
        Object.values(modusKnoppen).forEach(knop => knop.classList.remove('actief'));
        if (modusKnoppen[nieuweModus]) modusKnoppen[nieuweModus].classList.add('actief');
        Object.values(werkbalken).forEach(balk => balk.classList.add('verborgen'));
        if (werkbalken[nieuweModus]) werkbalken[nieuweModus].classList.remove('verborgen');
        legendeContainer.classList.toggle('verborgen', nieuweModus !== 'legende');

        const isInteractief = !['legende', 'wissel'].includes(nieuweModus);
        canvas.selection = isInteractief; canvas.defaultCursor = 'default';

        canvas.forEachObject(obj => {
            if (nieuweModus === 'wissel') obj.set({ selectable: obj.isNaam });
            else obj.set({ selectable: isInteractief });
            if (obj.voorwerpType === 'muur') obj.set({ evented: (modus === 'bouw') });
        });
        canvas.renderAll();
    }
    Object.keys(modusKnoppen).forEach(key => {
        if(key !== 'wissel') modusKnoppen[key].addEventListener('click', () => schakelModus(key));
        else modusKnoppen[key].addEventListener('click', () => { if (isWisselModusActief) { stopPlaatsenWisselen(); } else { startPlaatsenWisselen(); }});
    });

    // --- RASTER & BOUWMODUS ---
    function tekenRaster() {
        canvas.remove(gridGroup);
        const width = canvas.getWidth(), height = canvas.getHeight();
        const lines = [];
        const lineOptions = { stroke: '#ddd', selectable: false, evented: false, excludeFromExport: true };
        for (let i = 0; i < (width / gridSize); i++) { lines.push(new fabric.Line([i * gridSize, 0, i * gridSize, height], lineOptions)); }
        for (let i = 0; i < (height / gridSize); i++) { lines.push(new fabric.Line([0, i * gridSize, width, i * gridSize], lineOptions)); }
        gridGroup = new fabric.Group(lines, { selectable: false, evented: false, excludeFromExport: true });
        canvas.add(gridGroup); gridGroup.moveTo(0); canvas.renderAll();
    }
    rasterToggle.addEventListener('change', (e) => {
        gridVisible = e.target.checked;
        if (gridVisible) tekenRaster(); else { canvas.remove(gridGroup); canvas.renderAll(); }
    });
    function zetBouwTool(nieuweTool) { bouwTool = nieuweTool; canvas.isDrawingMode = (bouwTool === 'gom'); }
    document.getElementById('tekenMuurKnop').addEventListener('click', () => zetBouwTool('muur'));
    document.getElementById('plaatsKlasKnop').addEventListener('click', () => {
        zetBouwTool('klas');
        const klasRechthoek = new fabric.Rect({
            left: 100, top: 100, width: 400, height: 300, fill: 'transparent',
            stroke: '#333', strokeWidth: 8, strokeUniform: true, voorwerpType: 'muur',
            originX: 'left', originY: 'top'
        });
        maakInteractief(klasRechthoek); canvas.add(klasRechthoek); canvas.setActiveObject(klasRechthoek); canvas.renderAll();
    });
    document.getElementById('plaatsDeurKnop').addEventListener('click', () => {
        zetBouwTool('deur');
        const deurSymbol = new fabric.Path('M 0 0 L 0 40 M 0 0 Q 40 0 40 40', { fill: '', stroke: 'black', strokeWidth: 2 });
        const achtergrond = new fabric.Rect({ width: 42, height: 8, fill: canvas.backgroundColor, originX: 'center', originY: 'center'});
        const deur = new fabric.Group([achtergrond, deurSymbol], { left: 50, top: 50, voorwerpType: 'deur', originX: 'left', originY: 'bottom' });
        maakInteractief(deur); canvas.add(deur); canvas.setActiveObject(deur); canvas.renderAll();
    });
    document.getElementById('plaatsRaamKnop').addEventListener('click', () => {
        zetBouwTool('raam');
        const raamAchtergrond = new fabric.Rect({ left: 0, top: 0, width: 80, height: 8, fill: canvas.backgroundColor, stroke: 'black', strokeWidth: 1.2 });
        const glas = new fabric.Line([5, 4, 75, 4], { stroke: '#6cace4', strokeWidth: 2.2 });
        const raam = new fabric.Group([raamAchtergrond, glas], { left: 50, top: 100, voorwerpType: 'raam' });
        maakInteractief(raam); canvas.add(raam); canvas.setActiveObject(raam); canvas.renderAll();
    });
    document.getElementById('plaatsGomKnop').addEventListener('click', () => {
        zetBouwTool('gom'); canvas.freeDrawingBrush.color = canvas.backgroundColor; canvas.freeDrawingBrush.width = 10; canvas.freeDrawingCursor = 'square';
    });
    document.getElementById('plaatsPaalKnop').addEventListener('click', () => {
        zetBouwTool('paal');
        const paal = new fabric.Rect({ left: 100, top: 100, width: gridSize, height: gridSize, fill: '#333', stroke: '#333', strokeWidth: 1, voorwerpType: 'paal' });
        maakInteractief(paal); canvas.add(paal); canvas.setActiveObject(paal); canvas.renderAll();
    });
    canvas.on('mouse:down', (o) => {
        if (modus === 'bouw' && bouwTool === 'muur' && !isDrawingWall) {
             isDrawingWall = true;
             const p = canvas.getPointer(o.e);
             wallStartPoint = { x: Math.round(p.x / gridSize) * gridSize, y: Math.round(p.y / gridSize) * gridSize };
        }
    });
    canvas.on('mouse:up', (o) => {
        if (!isDrawingWall) return; isDrawingWall = false;
        const p = canvas.getPointer(o.e);
        let endX = Math.round(p.x / gridSize) * gridSize;
        let endY = Math.round(p.y / gridSize) * gridSize;
        if (o.e.shiftKey) {
            const dx = Math.abs(endX - wallStartPoint.x), dy = Math.abs(endY - wallStartPoint.y);
            if (dx > dy) endY = wallStartPoint.y; else endX = wallStartPoint.x;
        }
        const muur = new fabric.Line([wallStartPoint.x, wallStartPoint.y, endX, endY],
            { stroke: '#333', strokeWidth: 8, strokeUniform: true, voorwerpType: 'muur', selectable: true, evented: true });
        maakInteractief(muur); canvas.add(muur); canvas.renderAll();
        bouwTool = ''; // ✅ na één muur tekenen stopt het tool, opnieuw klikken om een nieuwe muur te starten
    });

    // --- MEUBELMODUS ---
    werkbalken.meubel.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') return;
        const type = e.target.dataset.type;

        const renderCallback = (obj) => { canvas.add(obj); canvas.setActiveObject(obj); canvas.renderAll(); };

        if (['schoolbank','bureau','kast','wastafel', 'kring'].includes(type)) {
            fabric.Image.fromURL(`${IMG_PATH}${type}.png`, (img) => {
                img.set({ left: 100, top: 100, voorwerpType: type, originX: 'left', originY: 'top' });
                img.scaleToWidth(80); maakInteractief(img); renderCallback(img);
            }, { crossOrigin: 'Anonymous' });
        } else if (type === 'leerlingBureau') {
            const bureauRect = new fabric.Rect({ width: 60, height: 40, fill: 'transparent', stroke: '#333', strokeWidth: 1, originX: 'center', originY: 'center' });
            const stoelCirkel = new fabric.Circle({ radius: 8, fill: 'transparent', stroke: '#333', strokeWidth: 1, left: 20, top: -10, originX: 'center', originY: 'center' });
            const leerlingBureauGroep = new fabric.Group([bureauRect, stoelCirkel], { left: 100, top: 100, voorwerpType: 'leerlingBureau', originX: 'left', originY: 'top' });
            maakInteractief(leerlingBureauGroep); renderCallback(leerlingBureauGroep);
        } else if (type === 'tafel') {
            const item = new fabric.Rect({ left: 100, top: 100, width: 80, height: 50, fill: 'transparent', stroke: '#333', strokeWidth: 1, voorwerpType: type, originX: 'left', originY: 'top' });
            maakInteractief(item); renderCallback(item);
        } else if (type === 'schoolbord') {
            // standaard zeer lichtgrijs
            const bord = new fabric.Rect({ left: 150, top: 50, width: 150, height: 10, fill: '#e6e6e6', stroke: 'black', strokeWidth: 2, voorwerpType: 'schoolbord', originX: 'left', originY: 'top' });
            maakInteractief(bord); renderCallback(bord);
        } else if (type === 'schoolbordFlappen') {
            // midden lichtgrijs, flappen nog lichter
            const midden = new fabric.Rect({ width: 100, height: 10, fill: '#e6e6e6', stroke: 'black', strokeWidth: 2 });
            const flapL = new fabric.Rect({ width: 50, height: 10, fill: '#f2f2f2', stroke: 'black', strokeWidth: 2, left: -50 });
            const flapR = new fabric.Rect({ width: 50, height: 10, fill: '#f2f2f2', stroke: 'black', strokeWidth: 2, left: 100 });
            const bordMetFlappen = new fabric.Group([midden, flapL, flapR], { left: 200, top: 100, voorwerpType: 'schoolbordFlappen', originX: 'left', originY: 'top' });
            maakInteractief(bordMetFlappen); renderCallback(bordMetFlappen);
        }
    });

    // --- NAMENMODUS ---
    function groepeerNaamMetObject(naam, object) {
        const objAngle = object.angle || 0;
        const tekst = new fabric.IText(naam, {
            fontSize: 16, fontFamily: 'Arial', originX: 'center', originY: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 4,
            angle: -objAngle, selectable: true, isNaam: true,
        });
        const objPos = object.getCenterPoint();
        const objVoorwerpType = object.voorwerpType;
        object.set({ originX: 'center', originY: 'center', top: 0, left: 0, angle: 0 });
        const groep = new fabric.Group([object, tekst], {
            left: objPos.x, top: objPos.y, angle: objAngle, originX: 'center', originY: 'center',
            voorwerpType: objVoorwerpType, studentNaam: naam, subTargetCheck: true
        });
        maakInteractief(groep); canvas.add(groep);
    }
    document.getElementById('naamToevoegenKnop').addEventListener('click', () => {
        const naamInput = document.getElementById('naamInput');
        const naam = naamInput.value.trim();
        const actieveObject = canvas.getActiveObject();
        if (!actieveObject || !naam || actieveObject.studentNaam) return;
        groepeerNaamMetObject(naam, actieveObject); canvas.remove(actieveObject);
        naamInput.value = ''; canvas.renderAll();
    });

    // --- LEGENDE (HTML + detectie) ---
    function updateLegendeWeergave() {
        const container = document.getElementById('legende-weergave-container');
        const wrapper = document.getElementById('legende-weergave-wrapper');
        container.innerHTML = '';

        if (gebruikteLegendeItems.size === 0) { 
            wrapper.classList.add('verborgen'); 
            return; 
        }
        wrapper.classList.remove('verborgen');

        gebruikteLegendeItems.forEach((waarde, type) => {
            // toon enkel wanneer type in mapping staat (bv. 'paal' is niet gemapt)
            if (!legendeNamen[type]) return;

            const { kleur } = waarde || {};
            const itemDiv = document.createElement('div');
            itemDiv.className = 'legende-weergave-item';

            // kolom 1: kleurvakje (ruimte blijft gereserveerd)
            const kleurDiv = document.createElement('div');
            kleurDiv.className = 'legende-weergave-kleur';
            if (kleur && type !== 'muur' && type !== 'raam') {
                kleurDiv.style.backgroundColor = kleur;
                kleurDiv.style.visibility = 'visible';
            } else {
                // géén kleur voor muur/raam of niet gekleurd: kolomruimte behouden
                kleurDiv.style.backgroundColor = 'transparent';
                kleurDiv.style.visibility = 'hidden';
            }

            // kolom 2: icoon/afbeelding (exact hetzelfde als op de plattegrond)
            const icoonEl = maakIcoonElement(type);

            // kolom 3: label
            const tekstSpan = document.createElement('span');
            tekstSpan.className = 'legende-weergave-tekst';
            tekstSpan.textContent = legendeNamen[type] || type;

            itemDiv.appendChild(kleurDiv);
            itemDiv.appendChild(icoonEl);
            itemDiv.appendChild(tekstSpan);
            container.appendChild(itemDiv);
        });
    }

    function rebuildLegendFromCanvas() {
        gebruikteLegendeItems.clear();
        // Voeg de lichtgrijze standaardkleuren toe zodat ze NIET als "gekleurde legende" geteld worden
        const defaultKleuren = [
            '#fff', 'transparent',
            '#4a536b', '#5c6784',           // oude bordkleuren (voor compatibiliteit)
            '#e6e6e6', '#f2f2f2',           // nieuwe standaard lichtgrijs (bord)
            'darkgray', '', 'black', '#333'
        ];

        canvas.forEachObject(obj => {
            const type = obj.voorwerpType;
            if (!type || obj.isNaam) return;

            if (!gebruikteLegendeItems.has(type)) gebruikteLegendeItems.set(type, { kleur: null });

            let kleur = null;
            if (obj.isType && obj.isType('image') && obj.filters && obj.filters.length > 0) {
                const blendFilter = obj.filters.find(f => f.type === 'BlendColor');
                if (blendFilter) kleur = blendFilter.color;
            } else if (obj.voorwerpType === 'deur') {
                const deurSymbol = obj.getObjects && obj.getObjects().find(o => o.type === 'path');
                if (deurSymbol && deurSymbol.stroke && !defaultKleuren.includes(deurSymbol.stroke)) kleur = deurSymbol.stroke;
            } else if (obj.isType && obj.isType('group')) {
                const gekleurdItem = obj.getObjects().find(item => item.fill && !defaultKleuren.includes(item.fill));
                if (gekleurdItem) kleur = gekleurdItem.fill;
            } else if (obj.fill && !defaultKleuren.includes(obj.fill)) {
                kleur = obj.fill;
            }

            // FORCEREN: muur en raam nooit een kleurvakje
            if (type === 'muur' || type === 'raam') kleur = null;

            if (kleur) gebruikteLegendeItems.set(type, { kleur });
        });
        updateLegendeWeergave();
    }

    kleurenpalet.addEventListener('click', (e) => {
        if (e.target.classList.contains('kleur-staal')) {
            const vorigActief = kleurenpalet.querySelector('.actief');
            if (vorigActief) vorigActief.classList.remove('actief');
            e.target.classList.add('actief');
            actieveLegendeKleur = e.target.dataset.kleur;
        }
    });
    legendeCategorieKnoppen.forEach(knop => {
        knop.addEventListener('click', () => {
            const vorigeActieve = document.querySelector('#legende-categorieen button.actief');
            if (vorigeActieve) vorigeActieve.classList.remove('actief');
            if (actieveLegendeType === knop.dataset.type) { actieveLegendeType = null; canvas.defaultCursor = 'default'; }
            else { actieveLegendeType = knop.dataset.type; knop.classList.add('actief'); canvas.defaultCursor = 'crosshair'; }
        });
    });

    canvas.on('mouse:down', (o) => {
        if (modus !== 'legende' || !actieveLegendeType || !o.target) return;
        const obj = o.target.group ? o.target.group : o.target;
        const kleur = actieveLegendeKleur;

        let typeMatch = (obj.voorwerpType === actieveLegendeType);
        if (actieveLegendeType === 'schoolbord' && obj.voorwerpType === 'schoolbordFlappen') typeMatch = true;

        if (typeMatch) {
            const kleurItem = (item) => {
                if (!item || item.isNaam) return;
                if (item.isType && item.isType('image')) {
                    item.filters = [];
                    const filter = new fabric.Image.filters.BlendColor({ color: kleur, mode: 'multiply', alpha: 1.0 });
                    item.filters.push(filter); item.applyFilters();
                } else if (item.voorwerpType === 'deur' && actieveLegendeType === 'deur') {
                    const deurSymbol = item.getObjects && item.getObjects().find(o => o.type === 'path');
                    if(deurSymbol) deurSymbol.set('stroke', kleur);
                } else if (item.voorwerpType !== 'muur' && item.voorwerpType !== 'raam') {
                    item.set('fill', kleur);
                }
            };
            if (obj.isType && obj.isType('group')) {
                if (obj.voorwerpType === 'deur' && actieveLegendeType === 'deur') kleurItem(obj);
                else obj.getObjects().forEach(item => kleurItem(item));
            } else kleurItem(obj);

            // update legenda, maar nooit kleur tonen voor muur of raam
            const type = obj.voorwerpType;
            const setKleur = (type === 'muur' || type === 'raam') ? null : kleur;
            gebruikteLegendeItems.set(type, { kleur: setKleur });
            updateLegendeWeergave();
            canvas.renderAll();
            saveStateImmediate();
        } else if (obj.voorwerpType) {
            alert(`Fout! Dit is een '${obj.voorwerpType}'. Je hebt de categorie '${actieveLegendeType}' geselecteerd.`);
        }
    });

    // --- ALGEMEEN ---
    function setNamenZichtbaarheid(zichtbaar) {
        canvas.forEachObject(obj => {
            if (obj.isType && obj.isType('group') && obj.studentNaam) {
                const tekstObject = obj.getObjects().find(item => item.isNaam);
                if (tekstObject) tekstObject.set('visible', zichtbaar);
            } else if (obj.isNaam) obj.set('visible', zichtbaar);
        });
        canvas.renderAll();
    }
    namenTonenToggle.addEventListener('change', (e) => setNamenZichtbaarheid(e.target.checked));
    function verwijderSelectie() {
        const sel = canvas.getActiveObjects(); if (!sel || sel.length === 0) return;
        sel.forEach(obj => canvas.remove(obj));
        canvas.discardActiveObject(); saveStateImmediate(); rebuildLegendFromCanvas(); canvas.renderAll();
    }
    verwijderKnop.addEventListener('click', verwijderSelectie);
    function dupliceerSelectie() {
        const obj = canvas.getActiveObject(); if (!obj) return;
        obj.clone((kloon) => {
            canvas.discardActiveObject();
            kloon.set({ left: kloon.left + gridSize, top: kloon.top + gridSize });
            if (kloon.type === 'activeSelection') { kloon.canvas = canvas; kloon.forEachObject(o => canvas.add(o)); kloon.setCoords(); }
            else canvas.add(kloon);
            maakInteractief(kloon); canvas.setActiveObject(kloon); canvas.requestRenderAll();
        }, customProperties);
    }
    dupliceerKnop.addEventListener('click', dupliceerSelectie);
    window.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT')) return;
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); dupliceerSelectie(); }
        if (e.key === 'Delete' || e.key === 'Backspace') { verwijderSelectie(); }
    });

    // --- PDF: ICONEN ALS DATAURL (PNG) ZODAT ZE IDENTIEK ZIJN AAN APP ---
    const iconCache = new Map(); // type -> dataURL
    function svgStringForType(type){
        if (type === 'leerlingBureau') {
            return `<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="56" height="36" fill="none" stroke="#333" stroke-width="2"/>
                      <circle cx="45" cy="20" r="6" fill="none" stroke="#333" stroke-width="2"/>
                    </svg>`;
        } else if (type === 'tafel') {
            return `<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="76" height="46" fill="none" stroke="#333" stroke-width="2"/>
                    </svg>`;
        } else if (type === 'schoolbord' || type === 'schoolbordFlappen') {
            // neutrale grijstinten i.p.v. donker
            return `<svg viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg">
                      <rect x="10" y="10" width="100" height="10" fill="#e6e6e6" stroke="#000" stroke-width="2"/>
                      ${type === 'schoolbordFlappen'
                        ? `<rect x="-15" y="10" width="25" height="10" fill="#f2f2f2" stroke="#000" stroke-width="2"/>
                           <rect x="110" y="10" width="25" height="10" fill="#f2f2f2" stroke="#000" stroke-width="2"/>`
                        : '' }
                    </svg>`;
        } else if (type === 'muur') {
            return `<svg viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg">
                      <line x1="5" y1="10" x2="115" y2="10" stroke="#333" stroke-width="8" />
                    </svg>`;
        } else if (type === 'deur') {
            return `<svg viewBox="0 0 50 45" xmlns="http://www.w3.org/2000/svg">
                      <line x1="5" y1="5" x2="5" y2="40" stroke="#000" stroke-width="2"/>
                      <path d="M5 5 Q45 5 45 40" fill="none" stroke="#000" stroke-width="2"/>
                    </svg>`;
        } else if (type === 'raam') {
            return `<svg viewBox="0 0 84 16" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="4" width="80" height="8" fill="#fff" stroke="#000" stroke-width="1.5"/>
                      <line x1="6" y1="8" x2="78" y2="8" stroke="#6cace4" stroke-width="2.5"/>
                    </svg>`;
        }
        return `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"></svg>`;
    }
    function loadImage(src){
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = ()=>resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    async function iconToDataUrl(type, sizePx=160){
        if (iconCache.has(type)) return iconCache.get(type);
        const pngTypes = ['schoolbank','bureau','kast','wastafel', 'kring'];
        let dataUrl;
        if (pngTypes.includes(type)) {
            const img = await loadImage(`${IMG_PATH}${type}.png`);
            const c = document.createElement('canvas'); c.width = sizePx; c.height = sizePx;
            const ctx = c.getContext('2d');
            const pad = Math.round(sizePx*0.15);
            const inner = sizePx - pad*2;
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.strokeRect(pad, pad, inner, inner);
            const max = Math.round(inner*0.8);
            let w = img.width, h = img.height;
            const scale = Math.min(max/w, max/h);
            w = Math.round(w*scale); h = Math.round(h*scale);
            const ix = pad + Math.round((inner - w)/2);
            const iy = pad + Math.round((inner - h)/2);
            ctx.drawImage(img, ix, iy, w, h);
            dataUrl = c.toDataURL('image/png');
        } else {
            const svg = svgStringForType(type);
            const svgBlob = new Blob([svg], {type:'image/svg+xml'});
            const svgUrl = URL.createObjectURL(svgBlob);
            const img = await loadImage(svgUrl);
            const c = document.createElement('canvas'); c.width = sizePx; c.height = sizePx;
            const ctx = c.getContext('2d');
            const pad = Math.round(sizePx*0.15);
            const inner = sizePx - pad*2;
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.strokeRect(pad, pad, inner, inner);
            const max = Math.round(inner*0.8);
            const scale = Math.min(max/img.width, max/img.height);
            const w = Math.round(img.width*scale), h = Math.round(img.height*scale);
            const ix = pad + Math.round((inner - w)/2);
            const iy = pad + Math.round((inner - h)/2);
            ctx.drawImage(img, ix, iy, w, h);
            dataUrl = c.toDataURL('image/png');
            URL.revokeObjectURL(svgUrl);
        }
        iconCache.set(type, dataUrl);
        return dataUrl;
    }

    // --- PDF GENERATIE ---
    async function genereerPdf(opties) {
        const { toonNamen, toonLegende } = opties;
        const huidigeNamenZichtbaarheid = namenTonenToggle.checked;

        const wasRasterZichtbaar = gridVisible;
        if (wasRasterZichtbaar) { canvas.remove(gridGroup); canvas.renderAll(); }

        setNamenZichtbaarheid(toonNamen);
        const plattegrondDataUrl = canvas.toDataURL({ format: 'png', quality: 1.0 });
        setNamenZichtbaarheid(huidigeNamenZichtbaarheid);

        if (wasRasterZichtbaar) { canvas.add(gridGroup); gridGroup.moveTo(0); canvas.renderAll(); }

        const orientation = canvas.getWidth() > canvas.getHeight() ? 'landscape' : 'portrait';
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: orientation, unit: 'mm', format: 'a4' });

        const A4_WIDTH = (orientation === 'landscape') ? 297 : 210;
        const A4_HEIGHT = (orientation === 'landscape') ? 210 : 297;
        const MARGIN = 10;
        const PRINT_WIDTH = A4_WIDTH - (MARGIN * 2);
        const PRINT_HEIGHT = A4_HEIGHT - (MARGIN * 2);

        const plattegrondTitel = `Klaslokaal Plattegrond ${toonNamen ? '(met namen)' : ''}`;
        doc.setFontSize(14);
        doc.text(plattegrondTitel, A4_WIDTH / 2, MARGIN + 2, { align: 'center' });

        const scale = Math.min(PRINT_WIDTH / canvas.getWidth(), PRINT_HEIGHT / canvas.getHeight());
        const scaledWidth = canvas.getWidth() * scale;
        const scaledHeight = canvas.getHeight() * scale;
        const x = MARGIN + (PRINT_WIDTH - scaledWidth) / 2;
        const y = MARGIN + 5 + (PRINT_HEIGHT - 5 - scaledHeight) / 2;
        doc.addImage(plattegrondDataUrl, 'PNG', x, y, scaledWidth, scaledHeight);

        // === LEGENDEPAGINA (3 kolommen: kleur | icoon | woord) ===
        if (toonLegende && gebruikteLegendeItems.size > 0) {
            doc.addPage();
            doc.setFontSize(18);
            doc.text("Legende", A4_WIDTH / 2, MARGIN + 6, { align: 'center' });
            doc.setFontSize(15);

            const items = Array.from(gebruikteLegendeItems.entries())
                .filter(([type]) => !!legendeNamen[type]);

            const outerColCount = 2;
            const rowH = 22;
            const startY = MARGIN + 20;
            const startX = MARGIN;
            const outerColGap = 16;
            const outerColWidth = (A4_WIDTH - 2*MARGIN - outerColGap) / outerColCount;

            const colorColW = 9;   // kolom 1
            const iconColW  = 16;  // kolom 2
            const innerGap  = 3;

            const colorBox   = 9;
            const iconSizeMm = 16;

            let col = 0, row = 0;

            for (const [type, waarde] of items) {
                const baseX = startX + col * (outerColWidth + outerColGap);
                const baseY = startY + row * rowH;

                // kolom 1: kleur (ruimte behouden)
                const kleur = (waarde && waarde.kleur && type !== 'muur' && type !== 'raam') ? waarde.kleur : null;
                if (kleur) {
                    let r=255,g=235,b=59;
                    if (kleur.startsWith('#')) {
                        const hex = kleur.length===4
                            ? `#${kleur[1]}${kleur[1]}${kleur[2]}${kleur[2]}${kleur[3]}${kleur[3]}`
                            : kleur;
                        const num = parseInt(hex.slice(1), 16);
                        r = (num >> 16) & 255; g = (num >> 8) & 255; b = num & 255;
                    }
                    doc.setFillColor(r,g,b);
                    doc.rect(baseX, baseY - (colorBox/2) + (rowH/2) - (colorBox/2), colorBox, colorBox, 'F');
                } else {
                    // geen kleur: laat de ruimte blanco
                }

                // kolom 2: icoon (PNG van exact het object)
                const iconX = baseX + colorColW + innerGap;
                const iconY = baseY - (iconSizeMm/2) + (rowH/2) - (iconSizeMm/2);
                const iconDataUrl = await iconToDataUrl(type, 160);
                doc.addImage(iconDataUrl, 'PNG', iconX, iconY, iconSizeMm, iconSizeMm);

                // kolom 3: label
                const textX = iconX + iconColW + innerGap + 1;
                const textY = baseY + (rowH/2) + 4;
                doc.text(legendeNamen[type] || type, textX, textY);

                // volgende rij/kolom
                row++;
                const maxRows = Math.floor((A4_HEIGHT - startY - MARGIN) / rowH);
                if (row >= maxRows) { row = 0; col++; if (col >= outerColCount) { doc.addPage(); col = 0; } }
            }
        }

        // Opslaan
        doc.save(`plattegrond${toonLegende ? '_met_legende' : (toonNamen ? '_met_namen' : '')}.pdf`);
    }

    // --- PDF knoppen ---
    document.getElementById('downloadPdfPlattegrondKnop').addEventListener('click', () => {
        genereerPdf({ toonNamen: false, toonLegende: false });
    });
    document.getElementById('downloadPdfNamenKnop').addEventListener('click', () => {
        genereerPdf({ toonNamen: true, toonLegende: false });
    });
    document.getElementById('downloadPdfLegendeKnop').addEventListener('click', () => {
        genereerPdf({ toonNamen: false, toonLegende: true }); // ✅ namen uit bij legende-PDF
    });

    laadCanvasUitBrowser();
});