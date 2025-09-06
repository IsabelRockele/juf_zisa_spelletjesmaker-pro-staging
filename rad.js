document.addEventListener('DOMContentLoaded', () => {
    // ===== DOM ELEMENTEN =====
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const spinBtn = document.getElementById('spinBtn');

    const itemInput = document.getElementById('itemInput');
    const fileUpload = document.getElementById('fileUpload');
    const imageUpload = document.getElementById('imageUpload');
    const exportListBtn = document.getElementById('exportListBtn'); // Nieuwe knop

    const resultModal = document.getElementById('resultModal');
    const resultOutput = document.getElementById('resultOutput');
    const timerBarContainer = document.getElementById('timer-bar-container');
    const timerBar = document.getElementById('timer-bar');
    const closeBtn = document.querySelector('.close-btn');

    // Reken-gerelateerd
    const mathPresetBtns = document.querySelectorAll('.math-btn');
    const generateTablesBtn = document.getElementById('generateTablesBtn');
    const generateSumsBtn = document.getElementById('generateSumsBtn');
    const maalCheckboxesContainer = document.getElementById('maal-checkboxes');
    const timedMathCheckbox = document.getElementById('timedMathCheckbox');

    // Overige genereren-knoppen
    const generateEfBtn = document.getElementById('generateEfBtn');
    const generateMovementBtn = document.getElementById('generateMovementBtn');
    const generateTaalBtn = document.getElementById('generateTaalBtn');
    const generateTechLezenBtn = document.getElementById('generateTechLezenBtn');
    const generateMixBtn = document.getElementById('generateMixBtn');
    const mixCategoryCheckboxes = document.querySelectorAll('.mix-category-checkbox');

    // Weergave-wissel knoppen
    const showWheelBtn = document.getElementById('showWheelBtn');
    const newOptionsBtn = document.getElementById('newOptionsBtn');
    const restartBtn = document.getElementById('restartBtn');
    const downloadListBtn = document.getElementById('downloadListBtn');

    // ===== VARIABELEN =====
    let items = ['Typ hier', 'je opties', 'of gebruik', 'de knoppen', 'om een lijst', 'te genereren'];
    let usedItems = [];
    let spinHistory = [];
    let colors = ['#3498db', '#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
    let currentRotation = 0;
    let isSpinning = false;
    let activeTimer = null;
    let selectedMathLimit = 0;

    // ===== WEERGAVE-WISSEL =====
    const showOptionsView = () => {
        document.body.classList.remove('wheel-view');
        document.body.classList.add('options-view');
        if (downloadListBtn) downloadListBtn.style.display = 'none';
    };

    const showWheelView = () => {
        if (items.length <= 1 && !(items[0] instanceof Image)) {
            alert("Voeg eerst minstens 2 opties toe aan het rad.");
            return;
        }
        document.body.classList.remove('options-view');
        document.body.classList.add('wheel-view');
        if (downloadListBtn && items.length > 0) {
            downloadListBtn.style.display = 'inline-block';
        }
    };

    showWheelBtn?.addEventListener('click', showWheelView);

    const resetSession = () => {
        spinHistory = [];
        if (downloadListBtn) downloadListBtn.style.display = (items && items.length > 0 && document.body.classList.contains('wheel-view')) ? 'inline-block' : 'none';
    };

    newOptionsBtn?.addEventListener('click', () => {
        items = ['Typ hier', 'je opties', 'of gebruik', 'de knoppen', 'om een lijst', 'te genereren'];
        if (itemInput) itemInput.value = '';

        const removeAfterSpin = document.getElementById('removeAfterSpin');
        if (removeAfterSpin) removeAfterSpin.checked = true;
        document.querySelectorAll('input[name="tafel"]')?.forEach(cb => cb.checked = false);
        const maalRadio = document.querySelector('input[name="table_type"][value="maal"]');
        if (maalRadio) maalRadio.checked = true;
        const zonderBrug = document.querySelector('input[name="brug_option"][value="zonder"]');
        const metBrug = document.querySelector('input[name="brug_option"][value="met"]');
        if (zonderBrug) zonderBrug.checked = true;
        if (metBrug) metBrug.checked = true;
        if (timedMathCheckbox) timedMathCheckbox.checked = false;
        document.querySelectorAll('input[name="ef_category"]')?.forEach(cb => cb.checked = false);
        const imageModeCheckbox = document.getElementById('imageModeCheckbox');
        if (imageModeCheckbox) imageModeCheckbox.checked = false;
        document.querySelectorAll('input[name="taal_category"]')?.forEach(cb => cb.checked = true);

        selectedMathLimit = 0;
        mathPresetBtns?.forEach(btn => btn.classList.remove('selected'));

        resetWheel();
        resetSession();
        showOptionsView();
    });

    restartBtn?.addEventListener('click', () => {
        resetWheel();
        alert("Het rad is gereset. Je kunt opnieuw met alle originele opties spelen.");
        isSpinning = false;
        if (spinBtn) spinBtn.disabled = false;
    });

    // ===== DATASETS =====
    const efTasks = {
        werkgeheugen: [
            { text: "Herhaal achterstevoren", gameType: "timed_hide", duration: 7, category: "Werkgeheugen", supportsImageMode: true },
            { text: "Onthoud deze woorden", gameType: "timed_hide", duration: 10, category: "Werkgeheugen", supportsImageMode: true },
            { text: "Geheugenspel: Wat is er weg?", gameType: "whats_missing", duration: 10, category: "Werkgeheugen", supportsImageMode: true },
            { text: "Geheugenspel: Spelleider doet 3 acties voor. De speler moet de volgorde exact nadoen.", category: "Werkgeheugen", requiresLeader: true },
            { text: "Tel hardop van 20 terug naar 1", category: "Werkgeheugen" }
        ],
        inhibitie: [
            { text: "Spelregel: Klap enkel als je een dier hoort. Spelleider zegt willekeurige woorden.", category: "Inhibitie (Stop & Denk)", requiresLeader: true },
            { text: "Zeg de KLEUR, niet het woord:", gameType: "stroop_game", category: "Inhibitie (Stop & Denk)" },
            { text: "Muziekspel: De spelleider start en stopt muziek. Spelers dansen als de muziek speelt en bevriezen als hij stopt.", category: "Inhibitie (Stop & Denk)", requiresLeader: true },
            { text: "Blijf 10 seconden zo stil als een standbeeld.", gameType: "timer_only", duration: 10, category: "Inhibitie (Stop & Denk)" },
        ],
        flexibiliteit: [
            { text: "Noem 3 dingen die je kan doen met een lepel (behalve eten).", category: "Flexibiliteit", requiresLeader: true },
            { text: "Verzin een ander einde voor het sprookje van Roodkapje.", category: "Flexibiliteit", requiresLeader: true },
            { type: "dynamic", template: "Noem 5 dingen die {kleur} zijn.", category: "Flexibiliteit", requiresLeader: true }
        ],
        planning: [
            { text: "Wat zijn de stappen om een boterham met choco te maken?", category: "Planning", requiresLeader: true },
            { text: "Je gaat zwemmen. Wat moet er allemaal in je zwemtas?", category: "Planning", requiresLeader: true },
            { text: "Hoe zou je je kamer opruimen? Waar begin je en wat is de volgende stap?", category: "Planning", requiresLeader: true }
        ]
    };

    const movementTasks = [
        { text: "Doe 20 seconden jumping jacks.", gameType: "timer_only", duration: 20, category: "Beweging" },
        { text: "Loop 30 seconden ter plaatse.", gameType: "timer_only", duration: 30, category: "Beweging" },
        { text: "Doe 10 keer knieheffen (elke kant).", category: "Beweging" },
        { text: "Raak 10 keer je tenen aan.", category: "Beweging" },
        { text: "Balanceer 15 seconden op je rechterbeen.", gameType: "timer_only", duration: 15, category: "Beweging" },
        { text: "Balanceer 15 seconden op je linkerbeen.", gameType: "timer_only", duration: 15, category: "Beweging" },
        { text: "Doe 20 seconden de 'plank' houding.", gameType: "timer_only", duration: 20, category: "Beweging" },
        { text: "Doe 10 ster-sprongen (star jumps).", category: "Beweging" },
        { text: "Beeld uit dat je 20 seconden een ladder beklimt.", gameType: "timer_only", duration: 20, category: "Beweging" },
        { text: "Maak jezelf zo groot als een reus en dan zo klein als een muis. Herhaal 5 keer.", category: "Beweging" },
        { text: "Doe 10 'windmolens' (raak met je rechterhand je linkervoet aan en wissel af).", category: "Beweging" },
        { text: "Draai 15 seconden rondjes met je armen naar voren.", gameType: "timer_only", duration: 15, category: "Beweging" },
        { text: "Doe 10 squats (door je knieën buigen alsof je op een stoel gaat zitten).", category: "Beweging" },
        { text: "Boks 20 seconden in de lucht (links, rechts, links, rechts...).", gameType: "timer_only", duration: 20, category: "Beweging" },
        { text: "Loop 5 stappen als een ooievaar (trek je knieën zo hoog mogelijk op).", category: "Beweging" }
    ];

    const taalTasks = {
        rijmen: [
            { type: 'rijmen', word: 'huis' }, { type: 'rijmen', word: 'kat' },
            { type: 'rijmen', word: 'maan' }, { type: 'rijmen', word: 'school' },
            { type: 'rijmen', word: 'boek' }, { type: 'rijmen', word: 'stoel' },
        ],
        zinmaken: [
            { type: 'zinmaken', word: 'fiets' }, { type: 'zinmaken', word: 'lachen' },
            { type: 'zinmaken', word: 'vrienden' }, { type: 'zinmaken', word: 'zon' },
            { type: 'zinmaken', word: 'eten' }, { type: 'zinmaken', word: 'slapen' },
        ],
        noem3: [
            { type: 'noem3', category: 'soorten fruit' }, { type: 'noem3', category: 'kleuren' },
            { type: 'noem3', category: 'dieren op de boerderij' }, { type: 'noem3', category: 'dingen in een klaslokaal' },
            { type: 'noem3', category: 'sporten' }, { type: 'noem3', category: 'vervoersmiddelen' },
        ],
        grammatica: [
            { type: 'meervoud', word: 'boek', answer: 'boeken' }, { type: 'meervoud', word: 'kind', answer: 'kinderen' },
            { type: 'meervoud', word: 'stad', answer: 'steden' }, { type: 'meervoud', word: 'ei', answer: 'eieren' },
            { type: 'verkleinwoord', word: 'boom', answer: 'boompje' }, { type: 'verkleinwoord', word: 'bloem', answer: 'bloemetje' },
            { type: 'verkleinwoord', word: 'ring', answer: 'ringetje' }, { type: 'verkleinwoord', word: 'koning', answer: 'koninkje' },
        ],
        tegengestelden: [
            { type: 'tegengestelden', word: 'warm', answer: 'koud' }, { type: 'tegengestelden', word: 'groot', answer: 'klein' },
            { type: 'tegengestelden', word: 'snel', answer: 'traag' }, { type: 'tegengestelden', word: 'hoog', answer: 'laag' },
            { type: 'tegengestelden', word: 'dag', answer: 'nacht' }, { type: 'tegengestelden', word: 'blij', answer: 'boos' },
        ]
    };


     const techLezenTasks = [
        { text: "Lees de tekst voor als een robot.", category: "Technisch Lezen" },
        { text: "Lees de tekst terwijl je op één been staat.", category: "Technisch Lezen" },
        { text: "Lees de tekst met je tong uit je mond.", category: "Technisch Lezen" },
        { text: "Lees de tekst met een heel droevige stem.", category: "Technisch Lezen" },
        { text: "Lees de tekst met een heel blije stem.", category: "Technisch Lezen" },
        { text: "Lees fluisterend alsof je een groot geheim vertelt.", category: "Technisch Lezen" },
        { text: "Lees de tekst alsof je een operazanger bent.", category: "Technisch Lezen" },
        { text: "Lees elke zin met een andere emotie (boos, blij, bang...).", category: "Technisch Lezen" },
        { text: "Lees de tekst terwijl je zachtjes op je plaats marcheert.", category: "Technisch Lezen" },
        { text: "Lees de tekst met een heel hoge stem (als een muis).", category: "Technisch Lezen" },
        { text: "Lees de tekst alsof je heel erg moe bent en bijna in slaap valt.", category: "Technisch Lezen" },
        { text: "Lees de tekst zo snel als je kan, als een raceauto.", category: "Technisch Lezen" },
        { text: "Lees de tekst heel traag, als een slak.", category: "Technisch Lezen" },
        { text: "Lees de tekst en klap na elke zin in je handen.", category: "Technisch Lezen" },
        { text: "Lees de tekst voor aan een (denkbeeldige) plant of stoel.", category: "Technisch Lezen" },
        { text: "Lees de tekst alsof je een nieuwslezer op tv bent.", category: "Technisch Lezen" },
        { text: "Lees de tekst met je neus dichtgeknepen.", category: "Technisch Lezen" },
        { text: "Lees de tekst met een heel lage stem (als een beer).", category: "Technisch Lezen" },
        { text: "Lees de tekst en spring bij elke punt omhoog.", category: "Technisch Lezen" },
        { text: "Lees de tekst voor aan een klasgenoot die de tekst ook heeft.", category: "Technisch Lezen" }
    ];

    const dynamicData = {
        colorMap: { "ROOD": "#e74c3c", "GROEN": "#2ecc71", "BLAUW": "#3498db", "GEEL": "#f1c40f", "PAARS": "#9b59b6" },
        woorden: ["appel", "stoel", "auto", "fiets", "wolk", "banaan", "olifant", "paraplu", "boek", "schoen"],
        emojiMap: {
            "appel": "🍎", "stoel": "🪑", "auto": "🚗", "fiets": "🚲",
            "wolk": "☁️", "banaan": "🍌", "olifant": "🐘", "paraplu": "☂️",
            "boek": "📖", "schoen": "👟"
        },
        getColorNames: () => Object.keys(dynamicData.colorMap),
        generateReeks: (count) => Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1),
        generateWordSequence: (count) => shuffleArray([...dynamicData.woorden]).slice(0, count),
        generateMissingGameSequence: (count) => {
            const fullSequence = shuffleArray([...dynamicData.woorden]).slice(0, count);
            const missingIndex = Math.floor(Math.random() * count);
            const missingItem = fullSequence[missingIndex];
            const partialSequence = [...fullSequence];
            partialSequence[missingIndex] = '___';
            return { fullSequence, partialSequence, missingItem };
        }
    };

    // ===== HULPFUNCTIES =====
    const calculateAnswer = (exercise) => {
        if (typeof exercise !== 'string') return null;
        try {
            const sanitized = exercise.replace('×', '*').replace('÷', '/');
            return new Function('return ' + sanitized)();
        } catch {
            return null;
        }
    };

    const createDiceSvg = (number) => {
        const dots = { 1: [[50, 50]], 2: [[25, 25], [75, 75]], 3: [[25, 25], [50, 50], [75, 75]], 4: [[25, 25], [25, 75], [75, 25], [75, 75]], 5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]], 6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]] };
        const circles = (dots[number] || []).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="black" />`).join('');
        return `<svg width="80" height="80" viewBox="0 0 100 100" style="margin:0 5px;"><rect width="100" height="100" rx="15" ry="15" fill="white" stroke="black" stroke-width="4"/>${circles}</svg>`;
    };

    const createCheckboxes = () => {
        if (!maalCheckboxesContainer) return;
        maalCheckboxesContainer.innerHTML = '';
        for (let i = 1; i <= 10; i++) {
            maalCheckboxesContainer.innerHTML += `<label><input type="checkbox" name="tafel" value="${i}">${i}</label>`;
        }
    };

    const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
        const words = text.split(' ');
        let line = '';
        let lines = [];
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            if (context.measureText(testLine).width > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        let startY = y - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach(l => {
            context.fillText(l, x, startY);
            startY += lineHeight;
        });
    };

    const drawWheel = () => {
        const numItems = items.length;
        if (numItems === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        const anglePerItem = (2 * Math.PI) / numItems;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2 - 10;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        items.forEach((item, i) => {
            const startAngle = i * anglePerItem;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + anglePerItem);
            ctx.closePath();
            ctx.fillStyle = usedItems.includes(i) ? '#bbbbbb' : colors[i % colors.length];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + anglePerItem / 2);
            const itemText = (typeof item === 'object' && item.label) ? item.label : item;
            if (item instanceof Image) {
                const img = item;
                const maxW = radius * 0.8;
                const maxH = radius * 0.4;
                const imgRatio = img.width / img.height;
                let w = maxW, h = maxH;
                if (imgRatio > (maxW / maxH)) { h = w / imgRatio; } else { w = h * imgRatio; }
                ctx.drawImage(img, radius * 0.5, -w / 2, h, w);
            } else {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Poppins, sans-serif';
                ctx.textAlign = 'right';
                wrapText(ctx, String(itemText), radius - 15, 5, radius * 0.75, 18);
            }
            ctx.restore();
        });
    };

    const resetWheel = () => {
        usedItems = [];
        currentRotation = 0;
        canvas.style.transition = 'none';
        canvas.style.transform = 'rotate(0deg)';
        drawWheel();
    };

    const shuffleArray = (array) => {
        const a = [...array];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };
    
    const loadNewItems = (newItems) => {
        itemInput?.removeEventListener('input', updateItemsFromTextarea);

        if (!Array.isArray(newItems) || newItems.length === 0) {
            items = [];
            if (itemInput) itemInput.value = '';
            showWheelBtn && (showWheelBtn.disabled = true);
        } else {
            items = newItems;
            if (itemInput) {
                const isText = typeof newItems[0] === 'string';
                itemInput.value = isText ? newItems.join('\n') : '[Afbeeldingen succesvol geladen]';
            }
            showWheelBtn && (showWheelBtn.disabled = false);
        }
        
        resetWheel();
        resetSession();

        itemInput?.addEventListener('input', updateItemsFromTextarea);
    };

    // ===== GENERATORS =====
    const processDynamicTask = (task) => {
        if (task?.type !== 'dynamic') return task;
        let text = task.template;
        if (text.includes('{kleur}')) {
            const randomColor = dynamicData.getColorNames()[Math.floor(Math.random() * dynamicData.getColorNames().length)];
            text = text.replace('{kleur}', randomColor.toLowerCase());
        }
        return { ...task, text };
    };

    const generateEfTasks = () => {
        const selected = Array.from(document.querySelectorAll('input[name="ef_category"]:checked')).map(cb => cb.value);
        if (selected.length === 0) { alert("Kies minstens één EF-categorie."); return; }
        let all = [];
        selected.forEach(cat => all = all.concat(efTasks[cat]));
        const shuffled = shuffleArray(all).slice(0, 20);
        const finalItems = shuffled.map((task, i) => ({ label: `Opdracht ${i + 1}`, fullTask: task }));
        loadNewItems(finalItems);
    };

    const generateMovementTasks = () => {
        const shuffled = shuffleArray(movementTasks).slice(0, 20);
        const finalItems = shuffled.map((task, i) => ({ label: `Opdracht ${i + 1}`, fullTask: task }));
        loadNewItems(finalItems);
    };

    const generateTaalTasks = () => {
        const selected = Array.from(document.querySelectorAll('input[name="taal_category"]:checked')).map(cb => cb.value);
        if (selected.length === 0) { alert("Kies minstens één taalcategorie."); return; }
        let all = [];
        selected.forEach(cat => { if (taalTasks[cat]) all = all.concat(taalTasks[cat]); });
        const shuffled = shuffleArray(all).slice(0, 20);
        const finalItems = shuffled.map((task, i) => ({ label: `Opdracht ${i + 1}`, fullTask: task }));
        loadNewItems(finalItems);
    };

    const generateTechLezenTasks = () => {
        const shuffled = shuffleArray(techLezenTasks).slice(0, 20);
        const finalItems = shuffled.map((task, i) => ({ label: `Leesopdracht ${i + 1}`, fullTask: task }));
        loadNewItems(finalItems);
    };

    const generateSelectedTables = () => {
        const tableType = document.querySelector('input[name="table_type"]:checked')?.value || 'maal';
        const selectedTables = Array.from(document.querySelectorAll('input[name="tafel"]:checked')).map(cb => parseInt(cb.value, 10));
        if (selectedTables.length === 0) { alert("Selecteer minstens één tafel!"); return; }
        let problems = [];
        if (tableType === 'maal' || tableType === 'beide') {
            selectedTables.forEach(t => { for (let i = 1; i <= 10; i++) problems.push(`${i} × ${t}`); });
        }
        if (tableType === 'deel' || tableType === 'beide') {
            selectedTables.forEach(t => { for (let i = 1; i <= 10; i++) problems.push(`${i * t} ÷ ${t}`); });
        }
        loadNewItems(shuffleArray(problems).slice(0, 25));
    };

    const generateSums = (limit, allowWithBridge, allowWithoutBridge) => {
        let sums = new Set();
        const maxAttempts = 200;
        let attempts = 0;
        while (sums.size < 25 && attempts < maxAttempts) {
            attempts++;
            const a = Math.floor(Math.random() * limit) + 1;
            const b = Math.floor(Math.random() * limit) + 1;
            const op = Math.random() > 0.5 ? '+' : '-';
            if (op === '+') {
                if (a + b > limit) continue;
                const withBridge = (a % 10) + (b % 10) >= 10;
                if ((withBridge && allowWithBridge) || (!withBridge && allowWithoutBridge)) sums.add(`${a} + ${b}`);
            } else {
                if (a - b < 0) continue;
                const withBridge = (a % 10) < (b % 10);
                if ((withBridge && allowWithBridge) || (!withBridge && allowWithoutBridge)) sums.add(`${a} - ${b}`);
            }
        }
        if (sums.size === 0) {
            alert("Kon geen sommen genereren met de gekozen opties.");
            return;
        }
        loadNewItems(shuffleArray([...sums]));
    };

    const generateMixedWheel = () => {
        const selectedCategories = Array.from(mixCategoryCheckboxes).filter(cb => cb.checked).map(cb => cb.dataset.category);
        if (selectedCategories.length === 0) { alert("Kies minstens één categorie voor de Mix & Match."); return; }
        let mixedItems = [];
        const itemsPerCategory = Math.floor(25 / selectedCategories.length);
        if (selectedCategories.includes('rekenen_tafels')) {
            const tableType = document.querySelector('input[name="table_type"]:checked')?.value || 'maal';
            const selectedTables = Array.from(document.querySelectorAll('input[name="tafel"]:checked')).map(cb => parseInt(cb.value, 10));
            if (selectedTables.length > 0) {
                let problems = [];
                if (tableType === 'maal' || tableType === 'beide') {
                    selectedTables.forEach(t => { for (let i = 1; i <= 10; i++) problems.push(`${i} × ${t}`); });
                }
                if (tableType === 'deel' || tableType === 'beide') {
                    selectedTables.forEach(t => { for (let i = 1; i <= 10; i++) problems.push(`${i * t} ÷ ${t}`); });
                }
                mixedItems = mixedItems.concat(shuffleArray(problems).slice(0, itemsPerCategory));
            }
        }
        if (selectedCategories.includes('rekenen_sommen')) {
            const options = Array.from(document.querySelectorAll('input[name="brug_option"]:checked')).map(cb => cb.value);
            const allowWithBridge = options.includes('met');
            const allowWithoutBridge = options.includes('zonder');
            if (selectedMathLimit === 0) { alert("Voor 'Rekenen: Sommen' kies eerst een bereik (bijv. tot 20)."); return; }
            let sums = new Set();
            const maxAttempts = 200;
            let attempts = 0;
            while (sums.size < itemsPerCategory && attempts < maxAttempts) {
                attempts++;
                const a = Math.floor(Math.random() * selectedMathLimit) + 1;
                const b = Math.floor(Math.random() * selectedMathLimit) + 1;
                const op = Math.random() > 0.5 ? '+' : '-';
                if (op === '+') {
                    if (a + b > selectedMathLimit) continue;
                    const withBridge = (a % 10) + (b % 10) >= 10;
                    if ((withBridge && allowWithBridge) || (!withBridge && allowWithoutBridge)) sums.add(`${a} + ${b}`);
                } else {
                    if (a - b < 0) continue;
                    const withBridge = (a % 10) < (b % 10);
                    if ((withBridge && allowWithBridge) || (!withBridge && allowWithoutBridge)) sums.add(`${a} - ${b}`);
                }
            }
            mixedItems = mixedItems.concat(shuffleArray([...sums]).slice(0, itemsPerCategory));
        }
        if (selectedCategories.includes('ef')) {
            const selEf = Array.from(document.querySelectorAll('input[name="ef_category"]:checked')).map(cb => cb.value);
            if (selEf.length > 0) {
                let efItems = [];
                selEf.forEach(cat => efItems = efItems.concat(efTasks[cat]));
                const finalEf = efItems.map(task => ({ fullTask: processDynamicTask(task) }));
                mixedItems = mixedItems.concat(shuffleArray(finalEf).slice(0, itemsPerCategory));
            }
        }
        if (selectedCategories.includes('beweging')) {
            const finalMov = shuffleArray(movementTasks).map(task => ({ fullTask: task }));
            mixedItems = mixedItems.concat(finalMov.slice(0, itemsPerCategory));
        }
        if (selectedCategories.includes('taal')) {
            const selTaal = Array.from(document.querySelectorAll('input[name="taal_category"]:checked')).map(cb => cb.value);
            if (selTaal.length > 0) {
                let taalItems = [];
                selTaal.forEach(cat => { if (taalTasks[cat]) taalItems = taalItems.concat(taalTasks[cat]); });
                const finalTaal = taalItems.map(task => ({ fullTask: task }));
                mixedItems = mixedItems.concat(shuffleArray(finalTaal).slice(0, itemsPerCategory));
            }
        }
        if (selectedCategories.includes('taal_lezen')) {
            const finalTech = shuffleArray(techLezenTasks).map(task => ({ fullTask: task }));
            mixedItems = mixedItems.concat(finalTech.slice(0, itemsPerCategory));
        }
        if (mixedItems.length === 0) { alert("Kon geen opdrachten genereren."); return; }
        const finalWheelItems = shuffleArray(mixedItems).slice(0, 25).map((it, idx) => {
            if (typeof it === 'string') return it;
            return { ...it, label: `${it.fullTask?.category || 'Gemengd'} ${idx + 1}` };
        });
        loadNewItems(finalWheelItems);
    };

    // ===== RAD-LOGICA =====
    const spin = () => {
        if (isSpinning) return;
        let winningIndex;
        const removeItems = document.getElementById('removeAfterSpin')?.checked ?? true;
        if (removeItems) {
            const available = items.map((_, i) => i).filter(i => !usedItems.includes(i));
            if (available.length === 0) { alert("Alle opties zijn gebruikt! Klik op 'Nog eens met dit rad' om opnieuw te beginnen."); return; }
            winningIndex = available[Math.floor(Math.random() * available.length)];
        } else {
            if (items.length === 0) return;
            winningIndex = Math.floor(Math.random() * items.length);
        }
        isSpinning = true;
        spinBtn.disabled = true;
        if (restartBtn) restartBtn.disabled = true;
        if (newOptionsBtn) newOptionsBtn.disabled = true;

        const anglePerItem = 360 / items.length;
        const targetAngle = (winningIndex * anglePerItem) + (anglePerItem / 2);
        const requiredRotation = 360 - targetAngle + 270;
        const totalRotation = currentRotation - (currentRotation % 360) + (360 * 10) + requiredRotation;
        currentRotation = totalRotation;
        canvas.style.transition = 'transform 8s cubic-bezier(0.2, 0.8, 0.2, 1)';
        canvas.style.transform = `rotate(${currentRotation}deg)`;
        
        setTimeout(() => {
            try {
                if (removeItems) {
                    usedItems.push(winningIndex);
                    drawWheel();
                }
                const winningItem = items[winningIndex];
                const exerciseText = (typeof winningItem === 'object' && winningItem.fullTask) ? (winningItem.fullTask.text || winningItem.fullTask.word) : winningItem;
                const answer = calculateAnswer(exerciseText);
                spinHistory.push({ exercise: String(exerciseText), answer: (answer !== null ? answer : 'N/A') });
                if (downloadListBtn) downloadListBtn.style.display = 'inline-block';
                
                showResult(winningItem);
            } catch (error) {
                console.error("Fout bij weergeven resultaat:", error);
                alert("Er is een onverwachte fout opgetreden.");
            } finally {
                // Dit wordt ALTIJD uitgevoerd, zelfs na een fout.
                isSpinning = false;
                spinBtn.disabled = false;
                if (restartBtn) restartBtn.disabled = false;
                if (newOptionsBtn) newOptionsBtn.disabled = false;
            }
        }, 8000);
    };

    const runTimer = (duration, onEnd) => {
        timerBar.style.transition = 'none';
        timerBar.style.width = '100%';
        timerBarContainer.style.display = 'block';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                timerBar.style.transition = `width ${duration}s linear`;
                timerBar.style.width = '0%';
            });
        });
        activeTimer = setTimeout(() => {
            onEnd?.();
            timerBarContainer.style.display = 'none';
        }, duration * 1000);
    };

    const showResult = (result) => {
        if (activeTimer) clearTimeout(activeTimer);
        timerBarContainer.style.display = 'none';
        resultOutput.innerHTML = '';
        const taskForModal = (typeof result === 'object' && result.fullTask) ? result.fullTask : result;
        const processedTask = processDynamicTask(taskForModal);
        const isTimedMath = timedMathCheckbox?.checked && calculateAnswer(String(result)) !== null;

        if (isTimedMath) {
            resultOutput.innerHTML = `<p>${result}</p>`;
            runTimer(4, () => closeModal());
            resultModal.style.display = 'flex';
            return;
        }

        let resultText;
        if (typeof processedTask === 'string') {
            resultText = processedTask;
        } else if (processedTask?.type === 'rijmen') {
            resultText = `Verzin een woord dat rijmt op: <strong>${processedTask.word}</strong>`;
        } else if (processedTask?.type === 'zinmaken') {
            resultText = `Maak een mooie zin met het woord: <strong>${processedTask.word}</strong>`;
        } else if (processedTask?.type === 'noem3') {
            resultText = `Noem 3 soorten <strong>${processedTask.category}</strong>`;
        } else if (processedTask?.type === 'meervoud' || processedTask?.type === 'verkleinwoord') {
            const q = processedTask.type === 'meervoud' ? 'Wat is het meervoud van' : 'Wat is het verkleinwoord van';
            resultText = `${q}: <strong>${processedTask.word}</strong>?`;
        } else if (processedTask?.type === 'tegengestelden') {
            resultText = `Wat is het tegengestelde van: <strong>${processedTask.word}</strong>?`;
        } else {
            resultText = processedTask?.text || String(taskForModal);
        }

        const DURATION = processedTask?.duration || 10;
        const gameType = processedTask?.gameType;
        const isImageMode = document.getElementById('imageModeCheckbox')?.checked;

        switch (gameType) {
            case 'whats_missing': {
                const difficultyLevels = [5, 6, 7, 8, 9, 10];
                let selectedCount = 0;
                resultOutput.innerHTML = `<p>${resultText}</p><h4>Kies een moeilijkheidsgraad:</h4>`;
                const container = document.createElement('div');
                container.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;';
                const startBtn = document.createElement('button');
                startBtn.textContent = 'Start Spel';
                startBtn.className = 'generate-btn';
                startBtn.disabled = true;
                startBtn.style.marginTop = '20px';
                difficultyLevels.forEach(level => {
                    const btn = document.createElement('button');
                    btn.textContent = level;
                    btn.className = 'preset-btn';
                    btn.style.width = '60px';
                    btn.onclick = () => {
                        selectedCount = level;
                        startBtn.disabled = false;
                        container.querySelectorAll('button').forEach(b => b.style.border = '2px solid transparent');
                        btn.style.border = '2px solid var(--action-color)';
                    };
                    container.appendChild(btn);
                });
                resultOutput.appendChild(container);
                resultOutput.appendChild(startBtn);
                startBtn.onclick = () => {
                    if (selectedCount === 0) return;
                    const gameData = dynamicData.generateMissingGameSequence(selectedCount);
                    const displaySequence = (sequence) => {
                        const div = document.createElement('div');
                        div.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 10px; min-height: 80px;';
                        if (isImageMode) {
                            div.innerHTML = sequence.map(item => (item === '___') ? '<span style="font-size:4rem;">___</span>' : `<span style="font-size:5rem;">${dynamicData.emojiMap[item] || ''}</span>`).join('');
                        } else {
                            div.innerHTML = `<p style="font-size:2rem;">${sequence.join(' &nbsp; ')}</p>`;
                        }
                        resultOutput.innerHTML = `<p>${resultText}</p>`;
                        resultOutput.appendChild(div);
                    };
                    displaySequence(gameData.fullSequence);
                    runTimer(DURATION, () => {
                        resultOutput.innerHTML = `<p>Welk item is verdwenen?</p>`;
                        displaySequence(gameData.partialSequence);
                        const showAnswerBtn = document.createElement('button');
                        showAnswerBtn.id = 'show-answer-btn';
                        showAnswerBtn.className = 'preset-btn';
                        showAnswerBtn.textContent = 'Toon Antwoord';
                        resultOutput.appendChild(showAnswerBtn);
                        showAnswerBtn.onclick = () => {
                            const html = gameData.fullSequence.map(item => {
                                const isMissing = item === gameData.missingItem;
                                return isImageMode ? `<span style="font-size:5rem;${isMissing ? 'padding:5px;border-radius:10px;background-color:#2ecc7130;' : ''}">${dynamicData.emojiMap[item]}</span>` : `<span style="${isMissing ? 'color:#2ecc71;font-weight:bold;' : ''}">${item}</span>`;
                            }).join(isImageMode ? '' : ' &nbsp; ');
                            resultOutput.querySelector('div').innerHTML = html;
                            showAnswerBtn.disabled = true;
                        };
                    });
                };
                break;
            }
            case 'timed_hide': {
                const instructionText = resultText + ":";
                const difficultyLevels = [3, 5, 6, 7, 8, 9, 10];
                let selectedCount = 0;
                let contentItems = [];
                resultOutput.innerHTML = `<p>${instructionText}</p><h4>Kies een moeilijkheidsgraad:</h4>`;
                const container = document.createElement('div');
                container.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;';
                const startBtn = document.createElement('button');
                startBtn.textContent = 'Start Spel';
                startBtn.className = 'generate-btn';
                startBtn.disabled = true;
                startBtn.style.marginTop = '20px';
                difficultyLevels.forEach(level => {
                    const btn = document.createElement('button');
                    btn.textContent = level;
                    btn.className = 'preset-btn';
                    btn.style.width = '60px';
                    btn.onclick = () => {
                        selectedCount = level;
                        startBtn.disabled = false;
                        container.querySelectorAll('button').forEach(b => b.style.border = '2px solid transparent');
                        btn.style.border = '2px solid var(--action-color)';
                    };
                    container.appendChild(btn);
                });
                resultOutput.appendChild(container);
                resultOutput.appendChild(startBtn);
                startBtn.onclick = () => {
                    if (selectedCount === 0) return;
                    const isBackwards = instructionText.includes("achterstevoren");
                    contentItems = isBackwards ? dynamicData.generateReeks(selectedCount) : dynamicData.generateWordSequence(selectedCount);
                    const display = (isAnswer = false) => {
                        const build = (sequence) => {
                            const div = document.createElement('div');
                            div.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; align-items: center; margin-top: 15px;';
                            if (isImageMode && processedTask.supportsImageMode) {
                                sequence.forEach(item => {
                                    if (isBackwards) div.innerHTML += createDiceSvg(item);
                                    else if (dynamicData.emojiMap[item]) div.innerHTML += `<span style="font-size:5rem;">${dynamicData.emojiMap[item]}</span>`;
                                });
                            } else {
                                div.innerHTML = `<p style="color:#2c3e50; font-size:3.5rem;">${sequence.join(isBackwards ? ' - ' : ', ')}</p>`;
                            }
                            return div;
                        };
                        resultOutput.innerHTML = '';
                        resultOutput.innerHTML = `<p>${(isAnswer && isBackwards) ? "Oorspronkelijke reeks:" : instructionText}</p>`;
                        resultOutput.appendChild(build(contentItems));
                        if (isAnswer && isBackwards) {
                            resultOutput.innerHTML += `<p style="font-size:1.2rem; margin-top:20px; font-weight:bold;">Juiste antwoord (om te zeggen):</p>`;
                            resultOutput.appendChild(build([...contentItems].reverse()));
                        }
                    };
                    display();
                    runTimer(DURATION, () => {
                        resultOutput.innerHTML = `<p style="font-style:italic;">Herhaal!</p><button id="show-answer-btn" class="preset-btn">Toon Antwoord</button>`;
                        document.getElementById('show-answer-btn').onclick = () => display(true);
                    });
                };
                break;
            }
            case 'timer_only': {
                resultOutput.innerHTML = `<p>${resultText}</p><button id="start-timer-btn" class="generate-btn">▶️ Start</button>`;
                document.getElementById('start-timer-btn').onclick = () => {
                    resultOutput.innerHTML = `<p>${resultText}</p>`;
                    runTimer(DURATION, () => { resultOutput.innerHTML = `<p style="font-style: italic;">Klaar!</p>`; });
                };
                break;
            }
            case 'stroop_game': {
                resultOutput.innerHTML = `<p>${resultText}</p>`;
                const cont = document.createElement('div');
                cont.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin-top: 20px;';
                const colorNames = dynamicData.getColorNames();
                for (let i = 0; i < 10; i++) {
                    const word = colorNames[Math.floor(Math.random() * colorNames.length)];
                    let colorKey;
                    do { colorKey = colorNames[Math.floor(Math.random() * colorNames.length)]; } while (colorKey === word);
                    cont.innerHTML += `<span style="color:${dynamicData.colorMap[colorKey]}; padding:5px 10px; font-size:2.5rem; font-weight:bold;">${word}</span>`;
                }
                resultOutput.appendChild(cont);
                break;
            }
            default: {
                if (taskForModal instanceof Image) {
                    resultOutput.appendChild(taskForModal.cloneNode());
                } else {
                    resultOutput.innerHTML = `<p>${resultText}</p>`;
                }
                if (processedTask?.answer) {
                    const btn = document.createElement('button');
                    btn.className = 'preset-btn';
                    btn.textContent = 'Toon Antwoord';
                    btn.style.marginTop = '15px';
                    resultOutput.appendChild(btn);
                    btn.onclick = () => {
                        resultOutput.innerHTML = `<p>${resultText}</p><p style="color:var(--action-color);font-weight:bold;margin-top:10px;">${processedTask.answer}</p>`;
                        btn.disabled = true;
                    };
                }
                if (processedTask?.requiresLeader) {
                    resultOutput.innerHTML += `<p class="manual-tip">Tip: zie de handleiding (PDF) voor voorbeelden en variaties.</p>`;
                }
                break;
            }
        }
        resultModal.style.display = 'flex';
    };

    const closeModal = () => {
        if (activeTimer) clearTimeout(activeTimer);
        resultModal.style.display = 'none';
    };

    // ===== EVENT LISTENERS =====
    closeBtn?.addEventListener('click', closeModal);
    resultModal?.addEventListener('click', (e) => {
        if (e.target === resultModal) closeModal();
    });

    spinBtn?.addEventListener('click', spin);

    mathPresetBtns?.forEach(btn => {
        btn.addEventListener('click', () => {
            mathPresetBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            const type = btn.dataset.type;
            selectedMathLimit = (type === 'plusmin10') ? 10 : (type === 'plusmin20') ? 20 : (type === 'plusmin100') ? 100 : 1000;
        });
    });

    generateTablesBtn?.addEventListener('click', generateSelectedTables);
    generateSumsBtn?.addEventListener('click', () => {
        if (!selectedMathLimit) { alert("Kies eerst een bereik (+/- tot 10/20/100/1000)."); return; }
        const options = Array.from(document.querySelectorAll('input[name="brug_option"]:checked')).map(cb => cb.value);
        generateSums(selectedMathLimit, options.includes('met'), options.includes('zonder'));
    });

    generateEfBtn?.addEventListener('click', generateEfTasks);
    generateMovementBtn?.addEventListener('click', generateMovementTasks);
    generateTaalBtn?.addEventListener('click', generateTaalTasks);
    generateTechLezenBtn?.addEventListener('click', generateTechLezenTasks);
    generateMixBtn?.addEventListener('click', generateMixedWheel);

    downloadListBtn?.addEventListener('click', () => {
        if ((!items || items.length === 0) && spinHistory.length === 0) { alert("Er is nog geen inhoud om te downloaden."); return; }
        let content = "Overzicht van de oefeningen (gedraaide resultaten):\n\n";
        if (spinHistory.length > 0) {
            spinHistory.forEach((it, idx) => { content += `Oefening ${idx + 1}: ${it.exercise} = ${it.answer}\n`; });
        } else {
            content += "Er is nog niet gedraaid met het rad.\n";
        }
        content += "\n\n";

        if (items && items.length > 0) {
            content += "Volledige lijst met items op het rad:\n\n";
            content += items.map((it, idx) => {
                if (typeof it === 'object' && it.label) {
                    const detail = it.fullTask?.text || it.fullTask?.word || '';
                    return detail ? `${idx + 1}: ${it.label} — ${detail}` : `${idx + 1}: ${it.label}`;
                }
                return `${idx + 1}: ${String(it)}`;
            }).join('\n') + "\n";
        }
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'rad_van_fortuin_overzicht.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    // +++++ NIEUWE FUNCTIE VOOR EXPORTEREN +++++
    exportListBtn?.addEventListener('click', () => {
        const content = itemInput.value;
        if (content.trim() === '') {
            alert("Er is geen invoer om te bewaren.");
            return;
        }

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mijn_lijst.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
    
    // --- Functie voor handmatig typen ---
    const updateItemsFromTextarea = () => {
        const lines = itemInput.value.split('\n').filter(i => i.trim() !== '');
        items = lines;
        if (items.length > 0) {
            showWheelBtn.disabled = false;
            resetWheel();
        } else {
            showWheelBtn.disabled = true;
        }
    };
    
    // --- Upload Handlers ---
    const handleImageUpload = (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        const promises = Array.from(files).map(f => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(f);
        }));
        Promise.all(promises).then(loadNewItems).catch(err => console.error("Fout bij laden afbeeldingen:", err));
    };

    const handleFileUpload = (event) => {
        const f = event.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = String(e.target.result || '');
            const lines = text.split(/\r\n?|\n/).map(s => s.trim()).filter(Boolean); // Robuuster gemaakt
            loadNewItems(lines);
        };
        // Laat de browser zelf de codering raden voor betere compatibiliteit
        reader.readAsText(f);
    };

    imageUpload?.addEventListener('change', handleImageUpload);
    fileUpload?.addEventListener('change', handleFileUpload);
    itemInput?.addEventListener('input', updateItemsFromTextarea);

    // Init
    createCheckboxes();
    drawWheel();
    showOptionsView();
});