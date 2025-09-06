// Helper function to get random integer
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to shuffle letters of a word
function husselWoord(woord) {
    const letters = woord.split('');
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters.join('');
}

// Function to update word count message
function updateWordCountMessage(currentWordCount) {
    const woordAantalMelding = document.getElementById("woordAantalMelding");
    const MIN_WORDS = 5;
    const MAX_WORDS = 20;

    if (currentWordCount < MIN_WORDS) {
        woordAantalMelding.textContent = `Je moet nog ${MIN_WORDS - currentWordCount} woord(en) toevoegen.`;
        woordAantalMelding.style.color = "red";
    } else if (currentWordCount > MAX_WORDS) {
        woordAantalMelding.textContent = `Te veel woorden: ${currentWordCount - MAX_WORDS} woord(en) worden genegeerd.`;
        woordAantalMelding.style.color = "orange";
    } else {
        woordAantalMelding.textContent = `Aantal woorden: ${currentWordCount} (OK)`;
        woordAantalMelding.style.color = "#004080";
    }
}

// Function to update sentence message
function updateZinMessage(currentZinLength) {
    const zinMelding = document.getElementById("zinMelding");
    const MIN_ZIN_LENGTH = 5;

    if (currentZinLength < MIN_ZIN_LENGTH) {
        zinMelding.textContent = `Voer een zin in van minimaal ${MIN_ZIN_LENGTH - currentZinLength} letter(s).`;
        zinMelding.style.color = "red";
    } else {
        zinMelding.textContent = `Zin lengte: ${currentZinLength} letters (OK)`;
        zinMelding.style.color = "#004080";
    }
}

// Main function to generate and display the letter code puzzle
function genereerLettercodePuzzel() {
    const bronWoordenInput = document.getElementById("bronWoordenInput").value;
    const gecodeerdeZinInput = document.getElementById("gecodeerdeZinInput").value;
    const puzzelOutputDiv = document.getElementById("puzzelOutput");
    const meldingContainer = document.getElementById("meldingContainer");
    const woordFeedbackList = document.getElementById("woordFeedbackList");


    meldingContainer.innerHTML = "";
    meldingContainer.style.color = "#004080";
    puzzelOutputDiv.innerHTML = ""; // Clear previous puzzle
    woordFeedbackList.innerHTML = ""; // Clear previous feedback

    // 1. Process source words
    let woorden = bronWoordenInput.split('\n')
                                  .map(word => word.trim().toUpperCase())
                                  .filter(word => word.length > 0 && /^[A-Z]+$/.test(word));
    
    updateWordCountMessage(woorden.length);

    const MIN_WORDS = 5;
    const MAX_WORDS = 20;
    const MAX_WORD_LENGTH = 12; // Maximum letters per word (for display/practicality)

    if (woorden.length < MIN_WORDS) {
        meldingContainer.style.color = "red";
        meldingContainer.innerHTML = `Voer minimaal ${MIN_WORDS} geldige woorden in.`;
        return;
    }
    if (woorden.length > MAX_WORDS) {
        woorden = woorden.slice(0, MAX_WORDS);
        if (meldingContainer.innerHTML !== "") meldingContainer.innerHTML += "<br>";
        meldingContainer.style.color = "orange";
        meldingContainer.innerHTML += `Meer dan ${MAX_WORDS} woorden ingevoerd. De eerste ${MAX_WORDS} worden gebruikt.`;
    }

    let needsTruncationWarning = false;
    woorden = woorden.map(word => {
        if (word.length > MAX_WORD_LENGTH) {
            needsTruncationWarning = true;
            return word.substring(0, MAX_WORD_LENGTH);
        }
        return word;
    });

    if (needsTruncationWarning) {
        if (meldingContainer.innerHTML !== "") meldingContainer.innerHTML += "<br>";
        meldingContainer.style.color = "orange";
        meldingContainer.innerHTML += `Sommige woorden zijn te lang en zijn afgekapt tot ${MAX_WORD_LENGTH} letters.`;
    }

    // 2. Process the coded sentence
    const fullGecodeerdeZin = gecodeerdeZinInput.toUpperCase();
    const zinLettersOnly = fullGecodeerdeZin.split('').filter(char => /^[A-Z]$/.test(char));
    updateZinMessage(zinLettersOnly.length);

    const MIN_ZIN_LENGTH = 5;

    if (zinLettersOnly.length < MIN_ZIN_LENGTH) {
        meldingContainer.style.color = "red";
        if (meldingContainer.innerHTML !== "") meldingContainer.innerHTML += "<br>";
        meldingContainer.innerHTML += `De geheime zin moet minimaal ${MIN_ZIN_LENGTH} letters bevatten.`;
        return;
    }

    // --- Toewijzingslogica ---
    // Structure to hold final assignments: { originalWordIndex: { letterIndexInWord: assignedNumber } }
    const assignedLettersToWords = {}; 
    // To track which specific instances of letters in words are used for assignment
    const usedWordLetterInstances = {}; // {`originalWordIdx-letterIdx`: true}

    // Array to store the mapping for the sentence grid
    const sentenceAssignments = Array(zinLettersOnly.length).fill(null); // Will store {char: 'A', number: 1, originalWordIdx: 0, originalLetterIdx: 0}

    // Available numbers for assignment (these will be popped as they are used)
    const availableNumbers = Array.from({ length: zinLettersOnly.length }, (_, i) => i + 1);
    
    // Attempt to assign all letters from the sentence
    const MAX_TOTAL_ASSIGNMENT_ATTEMPTS = zinLettersOnly.length * 200; // Increased attempts for robustness
    let totalAssignmentAttempts = 0;

    // Loop until all sentence letters are assigned or max attempts reached
    while (availableNumbers.length > 0 && totalAssignmentAttempts < MAX_TOTAL_ASSIGNMENT_ATTEMPTS) {
        const unassignedZinIndices = sentenceAssignments
            .map((val, idx) => val === null ? idx : -1)
            .filter(idx => idx !== -1);
        
        if (unassignedZinIndices.length === 0) break; // All letters assigned

        const zinCharIdxToAssign = unassignedZinIndices[getRandomInt(0, unassignedZinIndices.length - 1)];
        const targetLetter = zinLettersOnly[zinCharIdxToAssign];
        let assignedInThisAttempt = false;

        // Shuffle words for this attempt (using original indices from the `woorden` array)
        const shuffledWordsIndices = Array.from({ length: woorden.length }, (_, i) => i).sort(() => Math.random() - 0.5);

        for (const currentWordArrIndex of shuffledWordsIndices) { // This `currentWordArrIndex` corresponds to index in `woorden` array
            const word = woorden[currentWordArrIndex];
            const originalWordLetters = word.split('');

            // Determine max assignments for this specific word based on its length
            let maxAssignmentsForThisWord = 3; 
            if (word.length <= 4) { // For words of 3 or 4 letters, max 2 assignments
                maxAssignmentsForThisWord = 2;
            }

            // Check current assignments in this word (using its original index in `woorden` array)
            const currentAssignmentsInWord = Object.values(assignedLettersToWords[currentWordArrIndex] || {}).length;
            if (currentAssignmentsInWord >= maxAssignmentsForThisWord) {
                continue; // Skip if max assignments reached for this word
            }

            // Find all available instances of the targetLetter in the current word
            const potentialLetterIndices = originalWordLetters
                .map((char, idx) => (char === targetLetter && !usedWordLetterInstances[`${currentWordArrIndex}-${idx}`] ? idx : -1))
                .filter(idx => idx !== -1);
            
            if (potentialLetterIndices.length > 0) {
                // Choose a random available instance
                const selectedLetterIndexInWord = potentialLetterIndices[getRandomInt(0, potentialLetterIndices.length - 1)];

                if (availableNumbers.length > 0) {
                    const randomIndexForNumber = getRandomInt(0, availableNumbers.length - 1);
                    const assignedNumber = availableNumbers.splice(randomIndexForNumber, 1)[0];
                    
                    if (!assignedLettersToWords[currentWordArrIndex]) {
                        assignedLettersToWords[currentWordArrIndex] = {};
                    }
                    assignedLettersToWords[currentWordArrIndex][selectedLetterIndexInWord] = assignedNumber;
                    usedWordLetterInstances[`${currentWordArrIndex}-${selectedLetterIndexInWord}`] = true;
                    sentenceAssignments[zinCharIdxToAssign] = { 
                        char: targetLetter, 
                        number: assignedNumber, 
                        originalWordIdx: currentWordArrIndex, // Store the index from the `woorden` array
                        originalLetterIdx: selectedLetterIndexInWord 
                    };
                    assignedInThisAttempt = true;
                    break; // Move to the next sentence letter (or continue overall loop)
                }
            }
        }
        if (!assignedInThisAttempt) {
            totalAssignmentAttempts++; // Increment if no assignment was made in this iteration
        }
    }


    // Filter out words that ultimately didn't contribute at least 1 letter
    let finalWoordenForDisplay = [];
    let wordsNotUsedWarning = false;
    
    const wordsThatGotAtLeastOneAssignment = new Set();
    for (const assignment of sentenceAssignments) {
        if (assignment && assignment.originalWordIdx !== undefined) {
            wordsThatGotAtLeastOneAssignment.add(assignment.originalWordIdx);
        }
    }

    // Now, build `finalWoordenForDisplay` using `woorden`'s current indices
    for (let i = 0; i < woorden.length; i++) { // `woorden` is already sliced if needed
        if (wordsThatGotAtLeastOneAssignment.has(i)) {
            finalWoordenForDisplay.push({ word: woorden[i], displayIndex: i });
        } else {
            // Only warn if the word was a valid alphabetic word from the initial input that got processed
            const originalInputLine = bronWoordenInput.split('\n')[i]?.trim().toUpperCase();
            if (originalInputLine && originalInputLine.length > 0 && /^[A-Z]+$/.test(originalInputLine)) {
                 wordsNotUsedWarning = true;
            }
        }
    }
    
    if (wordsNotUsedWarning) {
        if (meldingContainer.innerHTML !== "") meldingContainer.innerHTML += "<br>";
        meldingContainer.style.color = "orange";
        meldingContainer.innerHTML += `Sommige ingevoerde woorden konden niet worden gebruikt omdat ze geen letters konden bijdragen aan de geheime zin (min. 1 toewijzing per woord, of geen matchende letters/limiet bereikt).`;
    }

    // Determine missing letters from the sentence that couldn't be assigned
    const unassignedSentenceChars = [];
    for (let i = 0; i < sentenceAssignments.length; i++) {
        if (sentenceAssignments[i] === null) {
            unassignedSentenceChars.push(zinLettersOnly[i]);
        }
    }
    
    if (unassignedSentenceChars.length > 0) {
        meldingContainer.style.color = "red";
        if (meldingContainer.innerHTML !== "") meldingContainer.innerHTML += "<br>";
        const uniqueMissingChars = [...new Set(unassignedSentenceChars)].sort().join(', ');
        meldingContainer.innerHTML += `De volgende letters van de geheime zin ontbreken of konden niet worden toegewezen: <b>${uniqueMissingChars}</b>. Voeg woorden toe met deze letters.`;
    }

    // 4. Generate HTML for each word and its grid (using the `finalWoordenForDisplay` list)
    finalWoordenForDisplay.forEach((wordObj) => { 
        const word = wordObj.word;
        const currentWordArrIndex = wordObj.displayIndex; // This is the index in the current `woorden` array

        const woordRij = document.createElement("div");
        woordRij.className = "woord-rij";

        const gehusseldWoordDiv = document.createElement("div");
        gehusseldWoordDiv.className = "woord-hussel";
        gehusseldWoordDiv.textContent = husselWoord(word);
        woordRij.appendChild(gehusseldWoordDiv);

        const woordRoosterDiv = document.createElement("div");
        woordRoosterDiv.className = "woord-rooster";

        const originalLetters = word.split('');
        originalLetters.forEach((letter, letterIndex) => {
            const vakDiv = document.createElement("div");
            vakDiv.className = "vak";
            
            // Look up assignment using currentWordArrIndex (which is the index in the `woorden` array)
            if (assignedLettersToWords[currentWordArrIndex] && assignedLettersToWords[currentWordArrIndex][letterIndex]) {
                const nummerSpan = document.createElement("span");
                nummerSpan.className = "nummer";
                nummerSpan.textContent = assignedLettersToWords[currentWordArrIndex][letterIndex];
                vakDiv.appendChild(nummerSpan);
            }
            // De letter zelf komt er niet in, alleen het nummer
            woordRoosterDiv.appendChild(vakDiv);
        });
        woordRij.appendChild(woordRoosterDiv);
        puzzelOutputDiv.appendChild(woordRij);
    });

    // Genereer woordfeedback lijst
    woordFeedbackList.innerHTML = ''; // Clear previous feedback
    // Use the original (potentially truncated) `woorden` array for feedback, as it reflects input words.
    woorden.forEach((word, wordIndex) => {
        const li = document.createElement('li');
        const dot = document.createElement('span');
        dot.className = 'feedback-dot';

        // Check if this word (by its `wordIndex` in the `woorden` array) was used for any assignment
        const assignmentsInThisWord = Object.values(assignedLettersToWords[wordIndex] || {}).length;

        if (assignmentsInThisWord > 0) {
            dot.classList.add('used');
            dot.title = `Dit woord draagt ${assignmentsInThisWord} letter(s) bij aan de zin.`;
        } else {
            dot.classList.add('not-used');
            dot.title = 'Dit woord draagt geen letters bij aan de zin.';
        }
        
        li.appendChild(dot);
        li.appendChild(document.createTextNode(word));
        woordFeedbackList.appendChild(li);
    });


    // 5. Generate HTML for the coded sentence grid
    const gecodeerdeZinContainer = document.createElement("div");
    gecodeerdeZinContainer.className = "gecodeerde-zin-container";
    
    const zinTitel = document.createElement("h2");
    zinTitel.textContent = "Geheime boodschap:";
    gecodeerdeZinContainer.appendChild(zinTitel);

    const gecodeerdeZinRooster = document.createElement("div");
    gecodeerdeZinRooster.className = "gecodeerde-zin-rooster";

    let currentZinLetterActualIndex = 0; // Tracks index in zinLettersOnly
    
    for (let i = 0; i < fullGecodeerdeZin.length; i++) {
        const char = fullGecodeerdeZin[i];
        
        if (char === ' ') {
            const vakDiv = document.createElement("div");
            vakDiv.className = 'vak space'; 
            gecodeerdeZinRooster.appendChild(vakDiv);
        } else if (/[A-Z]/.test(char)) {
            // Dit is een letter, deze moet deel uitmaken van een woordGroep
            // We groeperen aaneengesloten letters tot een "woord"
            const startOfWordIndex = i;
            let endOfWordIndex = i;
            while (endOfWordIndex < fullGecodeerdeZin.length && /[A-Z]/.test(fullGecodeerdeZin[endOfWordIndex])) {
                endOfWordIndex++;
            }
            const currentWord = fullGecodeerdeZin.substring(startOfWordIndex, endOfWordIndex);
            
            const woordGroepDiv = document.createElement("div");
            woordGroepDiv.className = 'woord-groep';

            for (const wordChar of currentWord) {
                const letterVakDiv = document.createElement("div");
                letterVakDiv.className = 'vak';

                const assignedInfo = sentenceAssignments[currentZinLetterActualIndex];
                
                if (assignedInfo && assignedInfo.number) {
                    const nummerSpan = document.createElement("span");
                    nummerSpan.className = "nummer";
                    nummerSpan.textContent = assignedInfo.number;
                    letterVakDiv.appendChild(nummerSpan);
                }
                const letterSpan = document.createElement("span");
                letterSpan.className = "letter";
                letterVakDiv.appendChild(letterSpan); // Placeholder for the actual letter
                woordGroepDiv.appendChild(letterVakDiv); // Voeg vakje toe aan woordGroep
                currentZinLetterActualIndex++;
            }
            gecodeerdeZinRooster.appendChild(woordGroepDiv); // Voeg woordGroep toe aan het rooster
            i = endOfWordIndex - 1; // Spring over de reeds verwerkte letters van het woord
        } else {
            // Voor andere tekens zoals leestekens
            const vakDiv = document.createElement("div");
            vakDiv.className = 'vak non-letter';
            vakDiv.textContent = char; 
            gecodeerdeZinRooster.appendChild(vakDiv);
        }
    }


    gecodeerdeZinContainer.appendChild(gecodeerdeZinRooster);
    puzzelOutputDiv.appendChild(gecodeerdeZinContainer);

    // Enable download buttons.
    document.getElementById("downloadPngBtn").disabled = false;
    document.getElementById("downloadPdfBtn").disabled = false;
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    genereerLettercodePuzzel(); // Generate initial puzzle on page load

    document.getElementById("bronWoordenInput").addEventListener("input", genereerLettercodePuzzel);
    document.getElementById("gecodeerdeZinInput").addEventListener("input", genereerLettercodePuzzel);
    
    // Event listener voor de "Opnieuw Genereren" knop
    document.getElementById("regenereerBtn").addEventListener("click", genereerLettercodePuzzel);

    // Download PNG
    document.getElementById("downloadPngBtn").addEventListener("click", () => {
        const puzzelOutput = document.getElementById("puzzelOutput");
        html2canvas(puzzelOutput, { scale: 2, useCORS: true, backgroundColor: null }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'lettercode-puzzel.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    // Download PDF
    document.getElementById("downloadPdfBtn").addEventListener("click", () => {
        const puzzelOutput = document.getElementById("puzzelOutput");
        html2canvas(puzzelOutput, { scale: 2, useCORS: true, backgroundColor: null }).then(canvas => {
            const { jsPDF } = window.jspdf;
            const imgData = canvas.toDataURL('image/png');
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Calculate image dimensions to fit page width with a small margin
            const margin = 10; // mm
            const imgWidthPdf = pageWidth - (2 * margin);
            const imgHeightPdf = (canvas.height * imgWidthPdf) / canvas.width;

            let heightLeft = imgHeightPdf;
            let yPosition = margin; // Start from top margin

            // Center the image horizontally on the PDF page
            const xOffset = (pageWidth - imgWidthPdf) / 2;

            doc.addImage(imgData, 'PNG', xOffset, yPosition, imgWidthPdf, imgHeightPdf);
            heightLeft -= (pageHeight - yPosition); 

            while (heightLeft > -10) { 
                doc.addPage();
                yPosition = margin; // Reset position for new page
                doc.addImage(imgData, 'PNG', xOffset, yPosition - (imgHeightPdf - heightLeft), imgWidthPdf, imgHeightPdf);
                heightLeft -= (pageHeight - (2 * margin)); 
            }
            
            doc.save('lettercode-puzzel.pdf');
        });
    });
});