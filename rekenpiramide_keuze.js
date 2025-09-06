document.addEventListener("DOMContentLoaded", () => {
    // Optelpiramide elementen
    const maakOptelPiramideBtn = document.getElementById('maakOptelPiramideBtn');
    const optelPiramideMelding = document.getElementById('optelPiramideMelding');
    
    // Vermenigvuldigpiramide elementen
    const maakVermenigvuldigPiramideBtn = document.getElementById('maakVermenigvuldigPiramideBtn');
    const vermenigvuldigPiramideMelding = document.getElementById('vermenigvuldigPiramideMelding');
    const selectAllTafelsVermenigvuldigCheckbox = document.getElementById('selectAllTafelsVermenigvuldig');
    const tafelKeuzeVermenigvuldigDiv = document.getElementById('tafelKeuzeVermenigvuldig');

    // Vul de tafel-checkboxes voor vermenigvuldigen
    for (let i = 1; i <= 12; i++) {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'tafelNummerVermenigvuldig';
        checkbox.value = i;
        // DEZE LIJN IS NU UITGESCHAKELD/VERWIJDERD ZODAT CHECKBOXES STANDAARD UITGEVINKT ZIJN
        // if (i <= 10) checkbox.checked = true; // Was standaard tafels 1 t/m 10 geselecteerd
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${i}`));
        tafelKeuzeVermenigvuldigDiv.appendChild(label);
    }
    const tafelCheckboxesVermenigvuldig = document.querySelectorAll('input[name="tafelNummerVermenigvuldig"]');
    selectAllTafelsVermenigvuldigCheckbox.addEventListener('change', (e) => {
        tafelCheckboxesVermenigvuldig.forEach(cb => cb.checked = e.target.checked);
    });

    // Event listener voor Optelpiramide knop
    maakOptelPiramideBtn.addEventListener('click', () => {
        optelPiramideMelding.textContent = '';
        
        const numOefeningen = parseInt(document.getElementById('numOefeningen_optelpiramide').value);
        const piramideHoogte = parseInt(document.getElementById('optelPiramideHoogte').value);
        const optellenMaxGetal = parseInt(document.getElementById('optellenMaxGetal').value);
        const optellenBrug = document.getElementById('optellenBrug').value;
        const piramideType = document.querySelector('input[name="optelPiramideType"]:checked').value;

        if (isNaN(optellenMaxGetal) || optellenMaxGetal < 1) {
            optelPiramideMelding.textContent = "Voer een geldig maximaal getal in voor de optelpiramide.";
            return;
        }

        const settings = {
            hoofdBewerking: 'optelpiramides',
            numOefeningen: numOefeningen,
            piramideHoogte: piramideHoogte,
            optellenMaxGetal: optellenMaxGetal,
            optellenBrug: optellenBrug,
            piramideType: piramideType
        };
        
        stuurDoor(settings);
    });

    // Event listener voor Vermenigvuldigpiramide knop
    maakVermenigvuldigPiramideBtn.addEventListener('click', () => {
        vermenigvuldigPiramideMelding.textContent = '';
        
        const numOefeningen = parseInt(document.getElementById('numOefeningen_vermenigvuldigpiramide').value);
        const piramideHoogte = parseInt(document.getElementById('vermenigvuldigPiramideHoogte').value);
        const gekozenTafels = Array.from(document.querySelectorAll('input[name="tafelNummerVermenigvuldig"]:checked')).map(cb => parseInt(cb.value));
        const piramideType = document.querySelector('input[name="vermenigvuldigPiramideType"]:checked').value;

        if (gekozenTafels.length === 0) {
            vermenigvuldigPiramideMelding.textContent = 'Kies minstens één tafel voor de vermenigvuldigpiramide!';
            return;
        }

        const settings = {
            hoofdBewerking: 'vermenigvuldigpiramides',
            numOefeningen: numOefeningen,
            piramideHoogte: piramideHoogte,
            gekozenTafels: gekozenTafels,
            piramideType: piramideType
        };
        
        stuurDoor(settings);
    });

    function stuurDoor(settings) {
        localStorage.setItem('werkbladSettings', JSON.stringify(settings));
        window.location.href = 'rekenpiramide_werkblad.html';
    }
});