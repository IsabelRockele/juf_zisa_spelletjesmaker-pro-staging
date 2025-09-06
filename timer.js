document.addEventListener('DOMContentLoaded', () => {
    // Schermen
    const themeSelectionScreen = document.getElementById('themeSelectionScreen');
    const timerScreen = document.getElementById('timerScreen');
    
    // Keuze knoppen
    const themeButtons = document.querySelectorAll('.theme-buttons button');
    const timeButtonsContainer = document.querySelector('.time-buttons');
    const timeButtons = document.querySelectorAll('.time-buttons button');
    const timeChoiceHeader = document.getElementById('timeChoiceHeader');

    // Timer display elementen
    const currentThemeDisplay = document.getElementById('currentThemeDisplay');
    const countdownDisplay = document.getElementById('countdown');
    const timerMessage = document.getElementById('timerMessage');

    // Visuele containers
    const rainbowContainer = document.getElementById('rainbowContainer');
    const starContainer = document.getElementById('starContainer');
    const aquariumContainer = document.getElementById('aquariumContainer');
    
    // Regenboog elementen
    const rainbowPaths = Array.from(document.querySelectorAll('.rainbow-path')).reverse();
    const goldImage = document.getElementById('goldImage');
    let pathLengths = [];

    // Ster elementen
    const finalStar = document.getElementById('finalStar');
    let growingStars = [];

    // Aquarium elementen
    const treasureChestClosed = document.getElementById('treasureChestClosed');
    const treasureChestOpen = document.getElementById('treasureChestOpen');
    const bigGoldCoin = document.getElementById('bigGoldCoin');
    let fishElements = [];

    // Knoppen
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const newTimerButton = document.getElementById('newTimerButton');

    // Timer state
    let countdownInterval;
    let totalSeconds;
    let initialTotalSeconds = 0;
    let isPaused = false;
    let currentThemeChosen = '';

    // Geluid
    const timeUpSound = new Audio('sounds/chime.mp3');

    function showScreen(screenToShow) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        screenToShow.classList.add('active');
    }

    function showVisual(theme) {
        [rainbowContainer, starContainer, aquariumContainer].forEach(c => c.classList.remove('active'));
        if (theme === 'rainbow') rainbowContainer.classList.add('active');
        if (theme === 'star') starContainer.classList.add('active');
        if (theme === 'aquarium') {
            aquariumContainer.classList.add('active');
            initializeAquarium();
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    // --- Regenboog Specifiek ---
    function updateRainbow() {
        if (!initialTotalSeconds) return;
        const elapsedPercentage = (initialTotalSeconds - totalSeconds) / initialTotalSeconds;
        const animationPhase = elapsedPercentage * rainbowPaths.length;
        rainbowPaths.forEach((path, index) => {
            const fillPercentage = Math.max(0, Math.min(1, animationPhase - index));
            path.style.strokeDashoffset = pathLengths[index] * (1 - fillPercentage);
        });
    }

    // --- Ster Specifiek ---
    function createNewStar() {
        const star = document.createElement('img');
        star.src = 'afbeeldingen klok/ster.png';
        star.className = 'growing-star';

        const starCount = growingStars.length;
        const positions = [
            { top: '50%', left: '50%'}, { top: '35%', left: '30%'},
            { top: '35%', left: '70%'}, { top: '65%', left: '70%'},
            { top: '65%', left: '30%'}, { top: '25%', left: '50%'},
            { top: '75%', left: '50%'},
        ];
        const pos = positions[starCount % positions.length];
        star.style.top = pos.top;
        star.style.left = pos.left;

        starContainer.appendChild(star);
        growingStars.push(star);
    }
    
    function animateLastStar(shouldAnimate) {
        if (growingStars.length > 0) {
            const lastStar = growingStars[growingStars.length - 1];
            if (shouldAnimate && !lastStar.classList.contains('animate')) {
                lastStar.classList.add('animate');
            }
            if (lastStar.classList.contains('animate')) {
                 lastStar.style.animationPlayState = shouldAnimate ? 'running' : 'paused';
            }
        }
    }

    function freezeLastStar() {
        if (growingStars.length > 0) {
            const lastStar = growingStars[growingStars.length - 1];
            if (lastStar.classList.contains('animate')) {
                const computedStyle = window.getComputedStyle(lastStar);
                lastStar.style.transform = computedStyle.transform;
                lastStar.style.opacity = computedStyle.opacity;
                lastStar.classList.remove('animate');
            }
        }
    }
    
    function clearGrowingStars() {
        if (starContainer) starContainer.innerHTML = '';
        growingStars = [];
    }

    // --- Aquarium Specifiek ---
    function initializeAquarium() {
        aquariumContainer.querySelectorAll('.fish').forEach(fish => fish.remove());
        fishElements = [];
        const cols = 10, rows = 6, cellWidth = 90 / cols, cellHeight = 70 / rows;
        let positions = Array.from({ length: cols * rows }, (_, i) => i).sort(() => Math.random() - 0.5);

        for (let i = 0; i < 60; i++) {
            const fish = document.createElement('img');
            fish.src = `klok_afbeeldingen/vis${(i % 10) + 1}.png`;
            fish.className = 'fish';
            fish.id = `fish-${i}`;
            const scale = Math.random() * 0.7 + 0.5, direction = Math.random() > 0.5 ? 1 : -1;
            fish.style.transform = `scale(${scale}) scaleX(${direction})`;
            fish.style.zIndex = Math.round(scale * 10);
            const gridIndex = positions[i], col = gridIndex % cols, row = Math.floor(gridIndex / cols);
            const finalLeft = (col * cellWidth) + (Math.random() * cellWidth * 0.5);
            const finalTop = (row * cellHeight) + (Math.random() * cellHeight * 0.5);
            fish.style.top = `${finalTop}%`;
            fish.style.left = `${finalLeft}%`;
            aquariumContainer.appendChild(fish);
            fishElements.push(fish);
        }
    }

    function updateAquarium() {
        if (!initialTotalSeconds) return;
        if ((totalSeconds + 1) % 60 === 0 && totalSeconds + 1 !== initialTotalSeconds) {
            fishElements.forEach(fish => fish.style.opacity = '1');
        }
        const secondsInMinute = totalSeconds % 60;
        const fishToHide = document.getElementById(`fish-${secondsInMinute}`);
        if (fishToHide) fishToHide.style.opacity = '0';
    }

    // --- Hoofd Timer Functies ---
    function startCountdown() {
        if (isPaused) {
            isPaused = false;
        }
        
        if (currentThemeChosen === 'star') animateLastStar(true);
        
        startButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
        
        countdownInterval = setInterval(() => {
            if (totalSeconds <= 0) {
                clearInterval(countdownInterval);
                countdownDisplay.textContent = "00:00";
                timerMessage.textContent = "Tijd is om!";
                timeUpSound.play();
                
                if (currentThemeChosen === 'rainbow') {
                    goldImage.classList.add('visible');
                }
                if (currentThemeChosen === 'star') {
                    clearGrowingStars(); 
                    finalStar.classList.add('visible', 'animate');
                }
                if (currentThemeChosen === 'aquarium') {
                    treasureChestClosed.style.opacity = '0';
                    treasureChestOpen.style.opacity = '1';
                    bigGoldCoin.classList.add('visible', 'animate');
                }
                
                startButton.textContent = "Opnieuw";
                startButton.style.display = 'inline-block';
                pauseButton.style.display = 'none';
                return;
            }

            totalSeconds--;
            countdownDisplay.textContent = formatTime(totalSeconds);

            if (currentThemeChosen === 'rainbow') updateRainbow();
            if (currentThemeChosen === 'aquarium') updateAquarium();
            if (currentThemeChosen === 'star') {
                const elapsedSeconds = initialTotalSeconds - totalSeconds;
                if (elapsedSeconds > 0 && elapsedSeconds % 60 === 0 && elapsedSeconds < initialTotalSeconds) {
                    freezeLastStar();
                    createNewStar();
                    animateLastStar(true);
                }
            }
        }, 1000);
    }

    function pauseCountdown() {
        clearInterval(countdownInterval);
        isPaused = true;
        if (currentThemeChosen === 'star') animateLastStar(false);
        
        startButton.textContent = "Hervat";
        startButton.style.display = 'inline-block';
        pauseButton.style.display = 'none';
    }

    function resetTimer() {
        clearInterval(countdownInterval);
        isPaused = false;
        totalSeconds = initialTotalSeconds;
        countdownDisplay.textContent = formatTime(totalSeconds);
        timerMessage.textContent = '';
        
        goldImage.classList.remove('visible');
        clearGrowingStars();
        if (finalStar) finalStar.classList.remove('visible', 'animate');
        if (fishElements.length > 0) fishElements.forEach(fish => fish.style.opacity = '1');
        treasureChestClosed.style.opacity = '1';
        treasureChestOpen.style.opacity = '0';
        bigGoldCoin.classList.remove('visible', 'animate');
        updateRainbow();

        startButton.textContent = "Start";
        startButton.style.display = 'inline-block';
        pauseButton.style.display = 'none';
    }

    // --- Event Listeners ---
    themeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            currentThemeChosen = event.target.dataset.theme;
            timeChoiceHeader.textContent = `Kies tijd voor de ${event.target.textContent}:`;
            timeButtonsContainer.style.display = 'block';
        });
    });

    timeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            initialTotalSeconds = parseInt(event.target.dataset.minutes) * 60;
            document.body.className = `theme-${currentThemeChosen}`;
            currentThemeDisplay.textContent = {
                rainbow: 'Regenboog Timer', star: 'Groeiende Ster', aquarium: 'Aquarium Timer'
            }[currentThemeChosen];
            
            showScreen(timerScreen);
            showVisual(currentThemeChosen);
            resetTimer();

            if (currentThemeChosen === 'star') createNewStar();
        });
    });

    // **VERBETERDE LOGICA VOOR START/OPNIEUW KNOP**
    startButton.addEventListener('click', () => {
        // De 'Opnieuw' knop is alleen zichtbaar als de timer is afgelopen (totalSeconds <= 0).
        // In alle andere gevallen is het een 'Start' of 'Hervat' actie.
        if (startButton.textContent === 'Opnieuw') {
            resetTimer();
            if (currentThemeChosen === 'star') {
                createNewStar();
            }
        }
        startCountdown();
    });

    pauseButton.addEventListener('click', pauseCountdown);

    // **VERBETERDE LOGICA VOOR NIEUWE TIMER KNOP**
    newTimerButton.addEventListener('click', () => {
        // Stop de huidige timer volledig
        clearInterval(countdownInterval);
        isPaused = false;
        // Reset de timer variabelen voor een schone lei
        initialTotalSeconds = 0;
        totalSeconds = 0;
        
        // Ga terug naar het keuzemenu
        document.body.className = '';
        timeButtonsContainer.style.display = 'none';
        themeSelectionScreen.querySelector('h1').textContent = "Kies een thema & tijd:";
        showScreen(themeSelectionScreen);
    });

    // --- Initialisatie ---
    function initialize() {
        showScreen(themeSelectionScreen);
        rainbowPaths.forEach(path => {
            const length = path.getTotalLength();
            pathLengths.push(length);
            path.style.strokeDasharray = `${length} ${length}`;
            path.style.strokeDashoffset = length;
        });
    }

    initialize();
});