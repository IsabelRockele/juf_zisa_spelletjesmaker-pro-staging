document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTEN ===
    const instellingenScherm = document.getElementById('instellingen-scherm');
    const spelScherm = document.getElementById('spel-scherm');
    const startKnop = document.getElementById('start-knop');
    const stopKnop = document.getElementById('stop-knop');
    const oefeningDisplay = document.getElementById('oefening-display');
    const weg = document.getElementById('weg');
    const tijdInput = document.getElementById('tijd-oefening');
    // NIEUW: Elementen voor het uitlegscherm
    const uitlegScherm = document.getElementById('uitleg-scherm');
    const startNaUitlegKnop = document.getElementById('start-na-uitleg-knop');

    // Optie containers
    const operatieTypeRadios = document.querySelectorAll('input[name="operatie-type"]');
    const maalDeelOpties = document.getElementById('maal-deel-opties');
    const plusMinOpties = document.getElementById('plus-min-opties');
    const tafelSelectie = document.getElementById('tafel-selectie');
    const bereikRadios = document.querySelectorAll('input[name="bereik"]');
    const brugOpties = document.getElementById('brug-opties');

    let gameInterval;

    // === INSTELLINGEN UI LOGICA ===
    for (let i = 1; i <= 10; i++) {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="tafel" value="${i}" checked> Tafel van ${i}`;
        tafelSelectie.appendChild(label);
    }
    operatieTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            maalDeelOpties.classList.toggle('verborgen', radio.value !== 'maal-deel');
            plusMinOpties.classList.toggle('verborgen', radio.value !== 'plus-min');
        });
    });
    bereikRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            brugOpties.classList.toggle('verborgen', radio.value === '10');
        });
    });

    // === OEFENINGEN GENEREREN ===
    function genereerOefening() {
        // (Deze functie blijft ongewijzigd)
        const geselecteerdType = document.querySelector('input[name="operatie-type"]:checked').value;
        if (geselecteerdType === 'maal-deel') {
            let geselecteerdeBewerking = document.querySelector('input[name="maal-deel-bewerking"]:checked').value;
            const tafels = Array.from(document.querySelectorAll('input[name="tafel"]:checked')).map(cb => parseInt(cb.value));
            if (tafels.length === 0) return null;
            let bewerking = (geselecteerdeBewerking === 'beide') ? (Math.random() < 0.5 ? 'maal' : 'deel') : geselecteerdeBewerking;
            const tafel = tafels[Math.floor(Math.random() * tafels.length)];
            const vermenigvuldiger = Math.floor(Math.random() * 10) + 1;
            return (bewerking === 'maal') ? `${vermenigvuldiger} x ${tafel} =` : `${vermenigvuldiger * tafel} : ${tafel} =`;
        }
        if (geselecteerdType === 'plus-min') {
            let geselecteerdeBewerking = document.querySelector('input[name="plus-min-bewerking"]:checked').value;
            const bereik = parseInt(document.querySelector('input[name="bereik"]:checked').value);
            const brugOpties = Array.from(document.querySelectorAll('input[name="brug"]:checked')).map(cb => cb.value);
            if ((bereik === 20 || bereik === 100) && brugOpties.length === 0) return null;
            let bewerking = (geselecteerdeBewerking === 'beide') ? (Math.random() < 0.5 ? 'plus' : 'min') : geselecteerdeBewerking;
            let a, b, pogingen = 0;
            while (pogingen < 100) {
                pogingen++; a = Math.floor(Math.random() * bereik); b = Math.floor(Math.random() * (bereik - a));
                if (bewerking === 'min' && a < b) [a, b] = [b, a];
                if (bereik > 10) { const metBrug = (bewerking === 'plus') ? (a % 10 + b % 10) >= 10 : (a % 10) < (b % 10); const brugKeuze = brugOpties[Math.floor(Math.random() * brugOpties.length)]; if ((brugKeuze === 'met' && metBrug) || (brugKeuze === 'zonder' && !metBrug)) break;
                } else break;
            }
            return (bewerking === 'plus') ? `${a} + ${b} =` : `${a} - ${b} =`;
        }
        return null;
    }

    // === SPEL LOGICA ===

    // AANGEPAST: Deze functie toont nu EERST de uitleg
    function startSpel() {
        if (!genereerOefening()) {
            alert("Controleer je keuzes! Zorg dat er tenminste één tafel of optie is geselecteerd.");
            return;
        }
        uitlegScherm.classList.remove('verborgen');
    }

    // NIEUW: Deze functie start de daadwerkelijke game loop
    function startSpelLoop() {
        uitlegScherm.classList.add('verborgen');
        instellingenScherm.classList.add('verborgen');
        spelScherm.classList.remove('verborgen');
        weg.style.animationPlayState = 'running';

        const tijdPerItem = parseInt(tijdInput.value) * 1000;

        function spelTick() {
            oefeningDisplay.textContent = '';
            document.querySelectorAll('.obstakel').forEach(o => o.remove());
            if (Math.random() < 0.75) {
                const nieuweOefening = genereerOefening();
                if (nieuweOefening) oefeningDisplay.textContent = nieuweOefening;
            } else {
                maakObstakel();
            }
        }
        
        spelTick();
        gameInterval = setInterval(spelTick, tijdPerItem);
    }

    function stopSpel() {
        clearInterval(gameInterval);
        instellingenScherm.classList.remove('verborgen');
        spelScherm.classList.add('verborgen');
        weg.style.animationPlayState = 'paused';
    }

    function maakObstakel() {
        const obstakel = document.createElement('div');
        obstakel.classList.add('obstakel');
        if (Math.random() < 0.5) {
            obstakel.classList.add('obstakel-laag', 'obstakel-bewegend');
            obstakel.innerHTML = `<img src="loopspel_afbeeldingen/steen.png" alt="Steen">`;
        } else {
            obstakel.classList.add('obstakel-hoog', 'obstakel-hangend');
            obstakel.innerHTML = `<img src="loopspel_afbeeldingen/tak.png" alt="Tak">`;
        }
        weg.appendChild(obstakel);
        obstakel.addEventListener('animationend', () => obstakel.remove());
    }

    // === EVENT LISTENERS ===
    startKnop.addEventListener('click', startSpel);
    startNaUitlegKnop.addEventListener('click', startSpelLoop); // Nieuwe listener
    stopKnop.addEventListener('click', stopSpel);
});