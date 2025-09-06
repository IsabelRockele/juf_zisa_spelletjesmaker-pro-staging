document.addEventListener("DOMContentLoaded", () => {
    // --- Algemene Elementen ---
    const selectAllTafelsCheckbox = document.getElementById('selectAllTafels');
    const tafelKeuzeDiv = document.getElementById('tafelKeuze');

    // --- Vul de tafel-checkboxes ---
    for (let i = 1; i <= 12; i++) {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'tafelNummer';
        checkbox.value = i;
        if (i <= 10) checkbox.checked = true;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${i}`));
        tafelKeuzeDiv.appendChild(label);
    }
    const tafelCheckboxes = document.querySelectorAll('input[name="tafelNummer"]');
    selectAllTafelsCheckbox.addEventListener('change', (e) => {
        tafelCheckboxes.forEach(cb => cb.checked = e.target.checked);
    });

    // --- Logica voor Vak 1: Splitsen ---
    const maakSplitsBtn = document.getElementById('maakSplitsBtn');
    const groteSplitshuizenCheckbox = document.getElementById('groteSplitshuizenCheckbox');
    const numOefeningenSplitsDiv = document.getElementById('numOefeningenSplitsDiv');
    const splitsStijlDiv = document.getElementById('splitsStijlDiv');
    const splitsSomCheckbox = document.getElementById('splitsSomCheckbox');
    const splitsMelding = document.getElementById('splitsMelding');

    groteSplitshuizenCheckbox.addEventListener('change', () => {
        const isGrootHuis = groteSplitshuizenCheckbox.checked;
        numOefeningenSplitsDiv.style.display = isGrootHuis ? 'none' : '';
        splitsStijlDiv.style.display = isGrootHuis ? 'none' : '';
        splitsSomCheckbox.disabled = isGrootHuis;
        if (isGrootHuis) {
            splitsSomCheckbox.checked = false;
        }
    });

    maakSplitsBtn.addEventListener('click', () => {
        splitsMelding.textContent = '';
        const gekozenGetallen = Array.from(document.querySelectorAll('input[name="splitsGetal"]:checked')).map(cb => parseInt(cb.value));

        if (gekozenGetallen.length === 0) {
            splitsMelding.textContent = "Kies minstens één getal om te splitsen.";
            return;
        }

        const settings = {
            hoofdBewerking: 'splitsen',
            groteSplitshuizen: groteSplitshuizenCheckbox.checked,
            splitsGetallenArray: gekozenGetallen,
            splitsWissel: document.getElementById('splitsWisselCheckbox').checked,
            splitsSom: splitsSomCheckbox.checked,
            numOefeningen: parseInt(document.getElementById('numOefeningen_splits').value),
            splitsStijl: document.querySelector('input[name="splitsStijl"]:checked').value,
        };
        stuurDoor(settings);
    });

    // --- Logica voor Vak 2: Bewerkingen ---
    const maakRekenBtn = document.getElementById('maakRekenBtn');
    const rekenMelding = document.getElementById('rekenMelding');
    maakRekenBtn.addEventListener('click', () => {
        rekenMelding.textContent = '';
        const somTypes = Array.from(document.querySelectorAll('input[name="somType"]:checked')).map(cb => cb.value);
        if (somTypes.length === 0) {
            rekenMelding.textContent = 'Kies minstens één type som!';
            return;
        }
        const settings = {
            hoofdBewerking: 'rekenen',
            numOefeningen: parseInt(document.getElementById('numOefeningen_reken').value),
            rekenMaxGetal: parseInt(document.getElementById('rekenMaxGetal').value),
            rekenType: document.querySelector('input[name="rekenType"]:checked').value,
            somTypes: somTypes,
            rekenBrug: document.getElementById('rekenBrug').value,
        };
        stuurDoor(settings);
    });

    // --- Logica voor Vak 3: Tafels ---
    const maakTafelBtn = document.getElementById('maakTafelBtn');
    const tafelMelding = document.getElementById('tafelMelding');
    maakTafelBtn.addEventListener('click', () => {
        tafelMelding.textContent = '';
        const gekozenTafels = Array.from(document.querySelectorAll('input[name="tafelNummer"]:checked')).map(cb => parseInt(cb.value));
        if (gekozenTafels.length === 0) {
            tafelMelding.textContent = 'Kies minstens één tafel!';
            return;
        }
        const settings = {
            hoofdBewerking: 'tafels',
            numOefeningen: parseInt(document.getElementById('numOefeningen_tafel').value),
            tafelType: document.querySelector('input[name="tafelType"]:checked').value,
            gekozenTafels: gekozenTafels,
        };
        stuurDoor(settings);
    });

    // --- Algemene Functie om door te sturen ---
    function stuurDoor(settings) {
        localStorage.setItem('werkbladSettings', JSON.stringify(settings));
        window.location.href = 'bewerkingen_werkblad.html';
    }
});