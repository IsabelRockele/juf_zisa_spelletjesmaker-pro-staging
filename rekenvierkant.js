const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");

// Helper function to get random integer
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get the units digit of a number
function getUnits(num) {
    return num % 10;
}

/**
 * Generates a consistent grid (5x5 or 7x7) where all horizontal and vertical sums are correct.
 * Supports 'optellen', 'aftrekken', and 'gemengd' logic.
 * Numbers are generated generally within the 'niveau' range.
 * @param {number} cols Number of columns (5 or 7).
 * @param {number} rows Number of rows (5 or 7).
 * @param {number} niveau The maximum value for numbers (e.g., 10, 20, 100, 1000).
 * @param {string} typeOpgave The type of operation ("optellen", "aftrekken", "gemengd").
 * @returns {Array<Array<any>>} A 2D array representing the consistent grid.
 */
function generateConsistentGrid(cols, rows, niveau, typeOpgave) {
    let actualMaxVal = parseInt(niveau);
    let grid = Array(rows).fill(null).map(() => Array(cols).fill(""));

    let attempts = 0;
    const MAX_ATTEMPTS = 100000;

    while (attempts < MAX_ATTEMPTS) {
        attempts++;

        let generatedBaseNumbers = [];

        const numBaseInputs = (cols === 5) ? 4 : 9;

        let currentMaxBaseForGeneration;
        if (typeOpgave === "optellen") {
            currentMaxBaseForGeneration = Math.floor(actualMaxVal / (cols === 5 ? 2 : 3));
        } else if (typeOpgave === "aftrekken") {
            currentMaxBaseForGeneration = actualMaxVal;
        } else { // gemengd
            currentMaxBaseForGeneration = actualMaxVal;
        }
        if (currentMaxBaseForGeneration < 1) currentMaxBaseForGeneration = 1;

        for (let i = 0; i < numBaseInputs; i++) {
            generatedBaseNumbers.push(getRandomInt(1, currentMaxBaseForGeneration));
        }

        if (cols === 5) {
            grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1];
            grid[2][0] = generatedBaseNumbers[2]; grid[2][2] = generatedBaseNumbers[3];
        } else if (cols === 7) {
            grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1]; grid[0][4] = generatedBaseNumbers[2];
            grid[2][0] = generatedBaseNumbers[3]; grid[2][2] = generatedBaseNumbers[4]; grid[2][4] = generatedBaseNumbers[5];
            grid[4][0] = generatedBaseNumbers[6]; grid[4][2] = generatedBaseNumbers[7]; grid[4][4] = generatedBaseNumbers[8];
        }

        for (let r = 0; r < rows; r += 2) {
            for (let c = 0; c < cols; c += 2) {
                if (grid[r][c] === 0) grid[r][c] = 1;
            }
        }

        let isValidCombination = true;
        let derivedValues = {};

        const performOp = (a, b, sign) => {
            if (sign === "+") {
                if (a + b > actualMaxVal) { isValidCombination = false; return null; }
                return a + b;
            }
            if (a < b) { isValidCombination = false; return null; }
            return a - b;
        };

        const performTripleOp = (a, b, c, sign1, sign2) => {
            let intermediateResult;
            if (sign1 === "+") {
                intermediateResult = a + b;
            } else { // "-"
                if (a < b) { isValidCombination = false; return null; }
                intermediateResult = a - b;
            }

            if (intermediateResult === null || !Number.isInteger(intermediateResult) || intermediateResult < 0 || intermediateResult > actualMaxVal) {
                isValidCombination = false;
                return null;
            }

            if (sign2 === "+") {
                if (intermediateResult + c > actualMaxVal) { isValidCombination = false; return null; }
                return intermediateResult + c;
            } else { // "-"
                if (intermediateResult < c) { isValidCombination = false; return null; }
                return intermediateResult - c;
            }
        };

        if (typeOpgave === "gemengd") {
            const opTypes = ["+", "-"];
            if (cols === 5) {
                grid[0][1] = opTypes[getRandomInt(0, 1)];
                grid[2][1] = opTypes[getRandomInt(0, 1)];
                grid[4][1] = opTypes[getRandomInt(0, 1)];
                grid[1][0] = opTypes[getRandomInt(0, 1)];
                grid[1][2] = opTypes[getRandomInt(0, 1)];
                grid[1][4] = opTypes[getRandomInt(0, 1)];
            } else { // 7x7
                grid[0][1] = opTypes[getRandomInt(0, 1)]; grid[0][3] = opTypes[getRandomInt(0, 1)];
                grid[2][1] = opTypes[getRandomInt(0, 1)]; grid[2][3] = opTypes[getRandomInt(0, 1)];
                grid[4][1] = opTypes[getRandomInt(0, 1)]; grid[4][3] = opTypes[getRandomInt(0, 1)];
                grid[6][1] = opTypes[getRandomInt(0, 1)]; grid[6][3] = opTypes[getRandomInt(0, 1)];
                grid[1][0] = opTypes[getRandomInt(0, 1)]; grid[1][2] = opTypes[getRandomInt(0, 1)]; grid[1][4] = opTypes[getRandomInt(0, 1)];
                grid[3][0] = opTypes[getRandomInt(0, 1)]; grid[3][2] = opTypes[getRandomInt(0, 1)]; grid[3][4] = opTypes[getRandomInt(0, 1)];
                grid[5][0] = opTypes[getRandomInt(0, 1)]; grid[5][2] = opTypes[getRandomInt(0, 1)]; grid[5][4] = opTypes[getRandomInt(0, 1)];
            }
        } else {
            const fixedOp = (typeOpgave === "optellen") ? "+" : "-";
            if (cols === 5) {
                grid[0][1] = fixedOp; grid[2][1] = fixedOp; grid[4][1] = fixedOp;
                grid[1][0] = fixedOp; grid[1][2] = fixedOp; grid[1][4] = fixedOp;
            } else { // 7x7
                grid[0][1] = fixedOp; grid[0][3] = fixedOp;
                grid[2][1] = fixedOp; grid[2][3] = fixedOp;
                grid[4][1] = fixedOp; grid[4][3] = fixedOp;
                grid[6][1] = fixedOp; grid[6][3] = fixedOp;
                grid[1][0] = fixedOp; grid[1][2] = fixedOp; grid[1][4] = fixedOp;
                grid[3][0] = fixedOp; grid[3][2] = fixedOp; grid[3][4] = fixedOp;
                grid[5][0] = fixedOp; grid[5][2] = fixedOp; grid[5][4] = fixedOp;
            }
        }

        if (cols === 5) {
            grid[0][3] = "="; grid[2][3] = "="; grid[4][3] = "=";
            grid[3][0] = "="; grid[3][2] = "="; grid[3][4] = "=";
        } else if (cols === 7) {
            grid[0][5] = "="; grid[2][5] = "="; grid[4][5] = "="; grid[6][5] = "=";
            grid[5][0] = "="; grid[5][2] = "="; grid[5][4] = "="; grid[5][6] = "=";
        }

        if (cols === 5) {
            derivedValues.r0c4 = performOp(grid[0][0], grid[0][2], grid[0][1]);
            derivedValues.r2c4 = performOp(grid[2][0], grid[2][2], grid[2][1]);
            derivedValues.r4c0 = performOp(grid[0][0], grid[2][0], grid[1][0]);
            derivedValues.r4c2 = performOp(grid[0][2], grid[2][2], grid[1][2]);

            if (derivedValues.r0c4 === null || derivedValues.r2c4 === null || derivedValues.r4c0 === null || derivedValues.r4c2 === null) {
                isValidCombination = false;
            } else {
                derivedValues.r4c4_from_h = performOp(derivedValues.r4c0, derivedValues.r4c2, grid[4][1]);
                derivedValues.r4c4_from_v = performOp(derivedValues.r0c4, derivedValues.r2c4, grid[1][4]);
            }

        } else if (cols === 7) {
            derivedValues.r0c6 = performTripleOp(grid[0][0], grid[0][2], grid[0][4], grid[0][1], grid[0][3]);
            derivedValues.r2c6 = performTripleOp(grid[2][0], grid[2][2], grid[2][4], grid[2][1], grid[2][3]);
            derivedValues.r4c6 = performTripleOp(grid[4][0], grid[4][2], grid[4][4], grid[4][1], grid[4][3]);
            derivedValues.r6c0 = performTripleOp(grid[0][0], grid[2][0], grid[4][0], grid[1][0], grid[3][0]);
            derivedValues.r6c2 = performTripleOp(grid[0][2], grid[2][2], grid[4][2], grid[1][2], grid[3][2]);
            derivedValues.r6c4 = performTripleOp(grid[0][4], grid[2][4], grid[4][4], grid[1][4], grid[3][4]);

            if (derivedValues.r0c6 === null || derivedValues.r2c6 === null || derivedValues.r4c6 === null ||
                derivedValues.r6c0 === null || derivedValues.r6c2 === null || derivedValues.r6c4 === null) {
                isValidCombination = false;
            } else {
                derivedValues.r6c6_from_h = performTripleOp(derivedValues.r6c0, derivedValues.r6c2, derivedValues.r6c4, grid[6][1], grid[6][3]);
                derivedValues.r6c6_from_v = performTripleOp(derivedValues.r0c6, derivedValues.r2c6, derivedValues.r4c6, grid[1][6], grid[3][6]);
            }
        }

        if (!isValidCombination || (cols === 5 && (derivedValues.r4c4_from_h === null || derivedValues.r4c4_from_v === null)) ||
            (cols === 7 && (derivedValues.r6c6_from_h === null || derivedValues.r6c6_from_v === null))) {
            continue;
        }

        let finalConsistencyCheck = false;
        let finalResult = null;

        if (cols === 5) {
            finalConsistencyCheck = (derivedValues.r4c4_from_h === derivedValues.r4c4_from_v);
            finalResult = derivedValues.r4c4_from_h;
        } else if (cols === 7) {
            finalConsistencyCheck = (derivedValues.r6c6_from_h === derivedValues.r6c6_from_v);
            finalResult = derivedValues.r6c6_from_h;
        }

        let allNumbersValid = true;
        const allNumbersInGrid = [];
        if (cols === 5) {
            allNumbersInGrid.push(grid[0][0], grid[0][2], derivedValues.r0c4,
                                   grid[2][0], grid[2][2], derivedValues.r2c4,
                                   derivedValues.r4c0, derivedValues.r4c2, finalResult);
        } else if (cols === 7) {
            allNumbersInGrid.push(grid[0][0], grid[0][2], grid[0][4], derivedValues.r0c6,
                                   grid[2][0], grid[2][2], grid[2][4], derivedValues.r2c6,
                                   grid[4][0], grid[4][2], grid[4][4], derivedValues.r4c6,
                                   derivedValues.r6c0, derivedValues.r6c2, derivedValues.r6c4, finalResult);
        }

        for (const num of allNumbersInGrid) {
            if (num === null || !Number.isInteger(num) || num < 0 || num > actualMaxVal) {
                allNumbersValid = false;
                break;
            }
        }

        if (finalConsistencyCheck && allNumbersValid) {
            if (cols === 5) {
                grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1];
                grid[2][0] = generatedBaseNumbers[2]; grid[2][2] = generatedBaseNumbers[3];
            } else if (cols === 7) {
                grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1]; grid[0][4] = generatedBaseNumbers[2];
                grid[2][0] = generatedBaseNumbers[3]; grid[2][2] = generatedBaseNumbers[4]; grid[2][4] = generatedBaseNumbers[5];
                grid[4][0] = generatedBaseNumbers[6]; grid[4][2] = generatedBaseNumbers[7]; grid[4][4] = generatedBaseNumbers[8];
            }

            if (cols === 5) {
                grid[0][4] = derivedValues.r0c4;
                grid[2][4] = derivedValues.r2c4;
                grid[4][0] = derivedValues.r4c0;
                grid[4][2] = derivedValues.r4c2;
                grid[4][4] = finalResult;
            } else if (cols === 7) {
                grid[0][6] = derivedValues.r0c6;
                grid[2][6] = derivedValues.r2c6;
                grid[4][6] = derivedValues.r4c6;
                grid[6][0] = derivedValues.r6c0;
                grid[6][2] = derivedValues.r6c2;
                grid[6][4] = derivedValues.r6c4;
                grid[6][6] = finalResult;
            }
            return grid;
        }
    }

    console.warn(`Kon geen consistent ${cols}x${rows} grid genereren na ${MAX_ATTEMPTS} pogingen voor opgave: ${typeOpgave}, niveau: ${niveau}`);
    return Array(rows).fill(null).map(() => Array(cols).fill(""));
}


/**
 * Generates a consistent grid for multiplication/division.
 * @param {number} cols Number of columns (5 or 7).
 * @param {number} rows Number of rows (5 or 7).
 * @param {string} typeTafeloefening Type of table exercise ("maal", "delen", "gemengd").
 * @param {Array<number>} selectedTables Array of selected multiplication tables (e.g., [2, 5, 10]).
 * @param {number} maxUitkomst Maximum allowed outcome for results.
 * @returns {Array<Array<any>>} A 2D array representing the consistent grid.
 */
function generateConsistentGridMaalDeel(cols, rows, typeTafeloefening, selectedTables, maxUitkomst) {
    let grid = Array(rows).fill(null).map(() => Array(cols).fill(""));

    let attempts = 0;
    const MAX_ATTEMPTS = 500000;

    const performMaalDeelOp = (a, b, sign) => {
        if (sign === "x") {
            return a * b;
        } else if (sign === ":") {
            if (b === 0 || a % b !== 0) {
                return null;
            }
            return a / b;
        }
        return null;
    };

    const performMaalDeelTripleOp = (a, b, c, sign1, sign2) => {
        let intermediateResult;
        if (sign1 === "x") {
            intermediateResult = a * b;
        } else if (sign1 === ":") {
            if (b === 0 || a % b !== 0) { return null; }
            intermediateResult = a / b;
        } else { return null; }

        if (intermediateResult === null || !Number.isInteger(intermediateResult) || intermediateResult < 0 || intermediateResult > maxUitkomst) {
             return null;
        }

        if (sign2 === "x") {
            return intermediateResult * c;
        } else if (sign2 === ":") {
            if (c === 0 || intermediateResult % c !== 0) { return null; }
            return intermediateResult / c;
        } else { return null; }
    };


    while (attempts < MAX_ATTEMPTS) {
        attempts++;
        let generatedBaseNumbers = [];
        let isValidCombination = true;

        const numBaseInputs = (cols === 5) ? 4 : 9;

        for (let i = 0; i < numBaseInputs; i++) {
            let num1, num2;
            let foundValidPair = false;
            let innerAttempts = 0;
            const MAX_INNER_ATTEMPTS = 500;

            while (!foundValidPair && innerAttempts < MAX_INNER_ATTEMPTS) {
                innerAttempts++;

                if (selectedTables.length > 0) {
                    const tableNum = selectedTables[getRandomInt(0, selectedTables.length - 1)];

                    if (typeTafeloefening === "maal" || typeTafeloefening === "gemengd") {
                        let factor1 = getRandomInt(1, Math.min(10, maxUitkomst / (tableNum || 1)));
                        num1 = factor1;
                        num2 = tableNum;

                        if (num1 * num2 <= maxUitkomst) {
                            foundValidPair = true;
                        }
                    }

                    if (!foundValidPair && (typeTafeloefening === "delen" || typeTafeloefening === "gemengd")) {
                        let quotient = getRandomInt(1, Math.min(10, maxUitkomst / (tableNum || 1)));
                        num1 = quotient * tableNum;
                        num2 = tableNum;

                        if (num1 > 0 && num2 > 0 && num1 % num2 === 0 && num1 <= maxUitkomst) {
                            foundValidPair = true;
                        }
                    }

                } else {
                    if (typeTafeloefening === "maal" || typeTafeloefening === "gemengd") {
                        num1 = getRandomInt(1, Math.min(10, Math.floor(Math.sqrt(maxUitkomst))));
                        num2 = getRandomInt(1, Math.min(10, Math.floor(maxUitkomst / (num1 || 1))));
                        if (num1 * num2 <= maxUitkomst) {
                            foundValidPair = true;
                        }
                    }
                    if (!foundValidPair && (typeTafeloefening === "delen" || typeTafeloefening === "gemengd")) {
                        let tempNum2 = getRandomInt(1, Math.min(10, maxUitkomst));
                        let tempQuotient = getRandomInt(1, Math.min(10, Math.floor(maxUitkomst / (tempNum2 || 1))));
                        num1 = tempQuotient * tempNum2;
                        num2 = tempNum2;

                        if (num1 > 0 && num2 > 0 && num1 % num2 === 0 && num1 <= maxUitkomst) {
                            foundValidPair = true;
                        }
                    }
                }
            }

            if (!foundValidPair) {
                isValidCombination = false;
                break;
            }
            generatedBaseNumbers.push(num1, num2);
        }

        if (!isValidCombination) continue;

        if (cols === 5) {
            grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1];
            grid[2][0] = generatedBaseNumbers[2]; grid[2][2] = generatedBaseNumbers[3];
        } else if (cols === 7) {
            grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1]; grid[0][4] = generatedBaseNumbers[2];
            grid[2][0] = generatedBaseNumbers[3]; grid[2][2] = generatedBaseNumbers[4]; grid[2][4] = generatedBaseNumbers[5];
            grid[4][0] = generatedBaseNumbers[6]; grid[4][2] = generatedBaseNumbers[7]; grid[4][4] = generatedBaseNumbers[8];
        }

        for (let r = 0; r < rows; r += 2) {
            for (let c = 0; c < cols; c += 2) {
                if (grid[r][c] === 0) grid[r][c] = 1;
            }
        }

        let opSymbols = ["x", ":"];
        if (typeTafeloefening === "gemengd") {
            if (cols === 5) {
                grid[0][1] = opSymbols[getRandomInt(0, 1)];
                grid[2][1] = opSymbols[getRandomInt(0, 1)];
                grid[4][1] = opSymbols[getRandomInt(0, 1)];

                grid[1][0] = opSymbols[getRandomInt(0, 1)];
                grid[1][2] = opSymbols[getRandomInt(0, 1)];
                grid[1][4] = opSymbols[getRandomInt(0, 1)];
            } else if (cols === 7) {
                grid[0][1] = opSymbols[getRandomInt(0, 1)]; grid[0][3] = opSymbols[getRandomInt(0, 1)];
                grid[2][1] = "x"; grid[2][3] = "x";
                grid[4][1] = opSymbols[getRandomInt(0, 1)]; grid[4][3] = opSymbols[getRandomInt(0, 1)];
                grid[6][1] = opSymbols[getRandomInt(0, 1)]; grid[6][3] = opSymbols[getRandomInt(0, 1)];

                grid[1][0] = opSymbols[getRandomInt(0, 1)]; grid[1][2] = opSymbols[getRandomInt(0, 1)]; grid[1][4] = opSymbols[getRandomInt(0, 1)];
                grid[3][0] = opSymbols[getRandomInt(0, 1)]; grid[3][2] = "x"; grid[3][4] = "x";
                grid[5][0] = opSymbols[getRandomInt(0, 1)]; grid[5][2] = opSymbols[getRandomInt(0, 1)]; grid[5][4] = opSymbols[getRandomInt(0, 1)];
            }
        } else {
            const fixedOp = (typeTafeloefening === "maal") ? "x" : ":";
            if (cols === 5) {
                grid[0][1] = fixedOp; grid[2][1] = fixedOp; grid[4][1] = fixedOp;
                grid[1][0] = fixedOp; grid[1][2] = fixedOp; grid[1][4] = fixedOp;
            } else if (cols === 7) {
                if (fixedOp === ":") {
                     console.warn("Delen in 7x7 roosters kan zeer complex zijn; de generator zal proberen, maar kan vaker falen.");
                     const allX = "x";
                     grid[0][1] = allX; grid[0][3] = allX; grid[2][1] = allX; grid[2][3] = allX;
                     grid[4][1] = allX; grid[4][3] = allX; grid[6][1] = allX; grid[6][3] = allX;
                     grid[1][0] = allX; grid[1][2] = allX; grid[1][4] = allX; grid[3][0] = allX;
                     grid[3][2] = allX; grid[3][4] = allX; grid[5][0] = allX; grid[5][2] = allX; grid[5][4] = allX;
                } else {
                    grid[0][1] = fixedOp; grid[0][3] = fixedOp; grid[2][1] = fixedOp; grid[2][3] = fixedOp;
                    grid[4][1] = fixedOp; grid[4][3] = fixedOp; grid[6][1] = fixedOp; grid[6][3] = fixedOp;
                    grid[1][0] = fixedOp; grid[1][2] = fixedOp; grid[1][4] = fixedOp; grid[3][0] = fixedOp;
                    grid[3][2] = fixedOp; grid[3][4] = fixedOp; grid[5][0] = fixedOp; grid[5][2] = fixedOp; grid[5][4] = fixedOp;
                }
            }
        }

        if (cols === 5) {
            grid[0][3] = "="; grid[2][3] = "="; grid[4][3] = "=";
            grid[3][0] = "="; grid[3][2] = "="; grid[3][4] = "=";
        } else if (cols === 7) {
            grid[0][5] = "="; grid[2][5] = "="; grid[4][5] = "="; grid[6][5] = "=";
            grid[5][0] = "="; grid[5][2] = "="; grid[5][4] = "="; grid[5][6] = "=";
        }

        let derivedValues = {};

        if (cols === 5) {
            derivedValues.r0c4 = performMaalDeelOp(grid[0][0], grid[0][2], grid[0][1]);
            derivedValues.r2c4 = performMaalDeelOp(grid[2][0], grid[2][2], grid[2][1]);
            derivedValues.r4c0 = performMaalDeelOp(grid[0][0], grid[2][0], grid[1][0]);
            derivedValues.r4c2 = performMaalDeelOp(grid[0][2], grid[2][2], grid[1][2]);

            if (derivedValues.r0c4 === null || derivedValues.r2c4 === null || derivedValues.r4c0 === null || derivedValues.r4c2 === null) {
                isValidCombination = false;
            } else {
                derivedValues.r4c4_from_h = performMaalDeelOp(derivedValues.r4c0, derivedValues.r4c2, grid[4][1]);
                derivedValues.r4c4_from_v = performMaalDeelOp(derivedValues.r0c4, derivedValues.r2c4, grid[1][4]);
            }
        } else if (cols === 7) {
            derivedValues.r0c6 = performMaalDeelTripleOp(grid[0][0], grid[0][2], grid[0][4], grid[0][1], grid[0][3]);
            derivedValues.r2c6 = performMaalDeelTripleOp(grid[2][0], grid[2][2], grid[2][4], grid[2][1], grid[2][3]);
            derivedValues.r4c6 = performMaalDeelTripleOp(grid[4][0], grid[4][2], grid[4][4], grid[4][1], grid[4][3]);

            derivedValues.r6c0 = performMaalDeelTripleOp(grid[0][0], grid[2][0], grid[4][0], grid[1][0], grid[3][0]);
            derivedValues.r6c2 = performMaalDeelTripleOp(grid[0][2], grid[2][2], grid[4][2], grid[1][2], grid[3][2]);
            derivedValues.r6c4 = performMaalDeelTripleOp(grid[0][4], grid[2][4], grid[4][4], grid[1][4], grid[3][4]);

            if (derivedValues.r0c6 === null || derivedValues.r2c6 === null || derivedValues.r4c6 === null ||
                derivedValues.r6c0 === null || derivedValues.r6c2 === null || derivedValues.r6c4 === null) {
                isValidCombination = false;
            } else {
                derivedValues.r6c6_from_h = performMaalDeelTripleOp(derivedValues.r6c0, derivedValues.r6c2, derivedValues.r6c4, grid[6][1], grid[6][3]);
                derivedValues.r6c6_from_v = performMaalDeelTripleOp(derivedValues.r0c6, derivedValues.r2c6, derivedValues.r4c6, grid[1][6], grid[3][6]);
            }
        }

        if (!isValidCombination || (cols === 5 && (derivedValues.r4c4_from_h === null || derivedValues.r4c4_from_v === null)) ||
            (cols === 7 && (derivedValues.r6c6_from_h === null || derivedValues.r6c6_from_v === null))) {
            continue;
        }

        let finalConsistencyCheck = false;
        let finalResult = null;

        if (cols === 5) {
            finalConsistencyCheck = (derivedValues.r4c4_from_h === derivedValues.r4c4_from_v);
            finalResult = derivedValues.r4c4_from_h;
        } else if (cols === 7) {
            finalConsistencyCheck = (derivedValues.r6c6_from_h === derivedValues.r6c6_from_v);
            finalResult = derivedValues.r6c6_from_h;
        }

        let allNumbersValid = true;
        const allNumbersInGrid = [];
        if (cols === 5) {
            allNumbersInGrid.push(grid[0][0], grid[0][2], derivedValues.r0c4,
                                   grid[2][0], grid[2][2], derivedValues.r2c4,
                                   derivedValues.r4c0, derivedValues.r4c2, finalResult);
        } else if (cols === 7) {
            allNumbersInGrid.push(grid[0][0], grid[0][2], grid[0][4], derivedValues.r0c6,
                                   grid[2][0], grid[2][2], grid[2][4], derivedValues.r2c6,
                                   grid[4][0], grid[4][2], grid[4][4], derivedValues.r4c6,
                                   derivedValues.r6c0, derivedValues.r6c2, derivedValues.r6c4, finalResult);
        }

        for (const num of allNumbersInGrid) {
            if (num === null || !Number.isInteger(num) || num < 0 || num > maxUitkomst) {
                allNumbersValid = false;
                break;
            }
        }

        if (finalConsistencyCheck && allNumbersValid) {
            if (cols === 5) {
                grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1];
                grid[2][0] = generatedBaseNumbers[2]; grid[2][2] = generatedBaseNumbers[3];
            } else if (cols === 7) {
                grid[0][0] = generatedBaseNumbers[0]; grid[0][2] = generatedBaseNumbers[1]; grid[0][4] = generatedBaseNumbers[2];
                grid[2][0] = generatedBaseNumbers[3]; grid[2][2] = generatedBaseNumbers[4]; grid[2][4] = generatedBaseNumbers[5];
                grid[4][0] = generatedBaseNumbers[6]; grid[4][2] = generatedBaseNumbers[7]; grid[4][4] = generatedBaseNumbers[8];
            }

            if (cols === 5) {
                grid[0][4] = derivedValues.r0c4;
                grid[2][4] = derivedValues.r2c4;
                grid[4][0] = derivedValues.r4c0;
                grid[4][2] = derivedValues.r4c2;
                grid[4][4] = finalResult;
            } else if (cols === 7) {
                grid[0][6] = derivedValues.r0c6;
                grid[2][6] = derivedValues.r2c6;
                grid[4][6] = derivedValues.r4c6;
                grid[6][0] = derivedValues.r6c0;
                grid[6][2] = derivedValues.r6c2;
                grid[6][4] = derivedValues.r6c4;
                grid[6][6] = finalResult;
            }
            return grid;
        }
    }

    console.warn(`Kon geen consistent ${cols}x${rows} grid genereren voor ${typeTafeloefening} met max. uitkomst ${maxUitkomst}`);
    return Array(rows).fill(null).map(() => Array(cols).fill(""));
}


function tekenSingleGrid(gridData, xOffset, yOffset, vakBreedte, vakHoogte, cols, rows) {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(xOffset + i * vakBreedte, yOffset);
        ctx.lineTo(xOffset + i * vakBreedte, yOffset + rows * vakHoogte);
        ctx.stroke();
    }

    for (let j = 0; j <= rows; j++) {
        ctx.beginPath();
        ctx.moveTo(xOffset, yOffset + j * vakHoogte);
        ctx.lineTo(xOffset + cols * vakBreedte, yOffset + j * vakHoogte);
        ctx.stroke();
    }


    ctx.font = `${Math.min(vakHoogte * 0.5, 30)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (gridData[r][c] === "") {
                ctx.fillStyle = "#000000";
                ctx.fillRect(xOffset + c * vakBreedte, yOffset + r * vakHoogte, vakBreedte, vakHoogte);
            } else {
                ctx.fillStyle = "#000";
                ctx.fillText(gridData[r][c], xOffset + c * vakBreedte + vakBreedte / 2, yOffset + r * vakHoogte + vakHoogte / 2);
            }
        }
    }
}

function vulRekenvierkant() {
    const formaat = document.getElementById("formaat").value;
    let baseCols, baseRows;

    if (formaat === "5x5") {
        baseCols = 5;
        baseRows = 5;
    } else if (formaat === "7x7") {
        baseCols = 7;
        baseRows = 7;
    }

    const numGrids = parseInt(document.querySelector('input[name="numGrids"]:checked').value);
    let totalCanvasWidth, totalCanvasHeight;
    const singleGridDisplayWidth = 256;
    const singleGridDisplayHeight = 256;
    const padding = 20;

    if (numGrids === 1) {
        totalCanvasWidth = singleGridDisplayWidth + 2 * padding;
        totalCanvasHeight = singleGridDisplayHeight + 2 * padding;
    } else if (numGrids === 2) {
        totalCanvasWidth = (singleGridDisplayWidth * 2) + (3 * padding);
        totalCanvasHeight = singleGridDisplayHeight + (2 * padding);
    } else if (numGrids === 3 || numGrids === 4) {
        totalCanvasWidth = (singleGridDisplayWidth * 2) + (3 * padding);
        totalCanvasHeight = (singleGridDisplayHeight * 2) + (3 * padding);
    }

    canvas.width = totalCanvasWidth;
    canvas.height = totalCanvasHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const meldingContainer = document.getElementById("meldingContainer");
    if (meldingContainer) {
        meldingContainer.innerHTML = "";
    }

    // AANGEPAST: Permanente waarschuwing voor 7x7
    if (baseCols === 7) {
        if (meldingContainer) {
            meldingContainer.innerHTML = `
                <p style="color: #994400; margin: 5px 0;"><strong>Let op: 7x7 is een expert-modus!</strong></p>
                <p style="color: #004080; margin: 5px 0; font-weight: normal;">Voor de beste kans op succes:</p>
                <ul style="text-align: left; margin: 0 auto; padding-left: 20px; font-weight: normal; color: #004080; max-width: 250px;">
                    <li>Gebruik een <b>laag niveau</b> (bv. 'Tot 20').</li>
                    <li>Kies 'Type opgave': <b>'Gemengd'</b>.</li>
                    <li>Lukt het niet? Klik nogmaals op 'Genereer'.</li>
                </ul>
            `;
        }
    }


    const soortOefening = document.querySelector('input[name="soort"]:checked').value;
    const typeOpgave = document.getElementById("typeOpgave").value;
    const niveau = document.getElementById("niveau").value;

    const vakBreedte = singleGridDisplayWidth / baseCols;
    const vakHoogte = singleGridDisplayHeight / baseRows;
    let allGridsSuccessfullyGenerated = true;

    for (let i = 0; i < numGrids; i++) {
        let xOffset = padding;
        let yOffset = padding;

        if (numGrids === 2) {
            xOffset = padding + (i * (singleGridDisplayWidth + padding));
        } else if (numGrids === 3 || numGrids === 4) {
            if (i % 2 === 1) {
                xOffset = padding + singleGridDisplayWidth + padding;
            }
            if (i >= 2) {
                yOffset = padding + singleGridDisplayHeight + padding;
            }
        }

        let fullGridData;
        if (soortOefening === "plusmin") {
            fullGridData = generateConsistentGrid(baseCols, baseRows, niveau, typeOpgave);
        } else { // maaldeel
            const typeTafeloefening = document.getElementById("typeTafeloefening").value;
            let selectedTables = Array.from(document.querySelectorAll('#tafelKeuze input[type="checkbox"]:checked'))
                                    .filter(cb => cb.id !== 'selecteerAlles')
                                    .map(cb => parseInt(cb.value));
            const maxUitkomst = parseInt(document.getElementById("maxUitkomst").value);

            if (selectedTables.length === 0) {
                for (let j = 1; j <= 10; j++) {
                    selectedTables.push(j);
                }
            }
            fullGridData = generateConsistentGridMaalDeel(baseCols, baseRows, typeTafeloefening, selectedTables, maxUitkomst);
        }

        if (!fullGridData || fullGridData.length === 0 || fullGridData[0].length === 0 || (typeof fullGridData[0][0] === 'string' && fullGridData[0][0].includes("Kon geen consistent"))) {
            allGridsSuccessfullyGenerated = false;
            // Toon de foutmelding niet als de expert-waarschuwing al zichtbaar is.
            if (meldingContainer && !meldingContainer.innerHTML.includes("expert-modus")) {
                 meldingContainer.innerHTML += `<p style="color: red;">Kon geen geldig rooster ${i+1} genereren. Probeer nog eens.</p>`;
            }
            tekenSingleGrid(Array(baseRows).fill(null).map(() => Array(baseCols).fill("")), xOffset, yOffset, vakBreedte, vakHoogte, baseCols, baseRows);
            continue;
        }

        const displayGridData = JSON.parse(JSON.stringify(fullGridData));
        let numberCellsToHide = [];
        if (baseCols === 5) {
            numberCellsToHide = [
                [0, 0], [0, 2], [0, 4], [2, 0], [2, 2], [2, 4], [4, 0], [4, 2], [4, 4]
            ];
        } else if (baseCols === 7) {
            numberCellsToHide = [
                [0, 0], [0, 2], [0, 4], [0, 6], [2, 0], [2, 2], [2, 4], [2, 6],
                [4, 0], [4, 2], [4, 4], [4, 6], [6, 0], [6, 2], [6, 4], [6, 6]
            ];
        }

        const numToHide = getRandomInt(baseCols === 5 ? 4 : 5, baseCols === 5 ? 5 : 8);
        const shuffledCells = numberCellsToHide.sort(() => 0.5 - Math.random());
        const cellsToHide = shuffledCells.slice(0, numToHide);

        cellsToHide.forEach(coords => {
            const r = coords[0];
            const c = coords[1];
            if (typeof displayGridData[r][c] === 'number') {
                displayGridData[r][c] = "___";
            }
        });

        tekenSingleGrid(displayGridData, xOffset, yOffset, vakBreedte, vakHoogte, baseCols, baseRows);
    }

    if (!allGridsSuccessfullyGenerated && meldingContainer && !meldingContainer.innerHTML.includes("expert-modus")) {
        meldingContainer.innerHTML = `<p style="color: red;">Niet alle roosters konden gegenereerd worden. Probeer nog eens.</p>`;
    }
    document.getElementById("outputJson").value = "";
}

document.addEventListener("DOMContentLoaded", () => {
    const outputJsonTextarea = document.getElementById("outputJson");
    if (outputJsonTextarea) {
        outputJsonTextarea.style.display = 'none';
    }

    vulRekenvierkant();

    const soortRadios = document.querySelectorAll('input[name="soort"]');
    const keuzePlusMin = document.getElementById('keuze-plusmin');
    const keuzeMaalDeel = document.getElementById('keuze-maaldeel');

    function toggleKeuzeSections() {
        if (document.querySelector('input[name="soort"]:checked').value === "plusmin") {
            keuzePlusMin.style.display = 'block';
            keuzeMaalDeel.style.display = 'none';
        } else {
            keuzePlusMin.style.display = 'none';
            keuzeMaalDeel.style.display = 'block';
        }
        vulRekenvierkant();
    }

    soortRadios.forEach(radio => {
        radio.addEventListener('change', toggleKeuzeSections);
    });
    toggleKeuzeSections();

    const selecteerAllesCheckbox = document.getElementById('selecteerAlles');
    const tafelCheckboxes = document.querySelectorAll('#tafelKeuze input[type="checkbox"]:not(#selecteerAlles)');

    selecteerAllesCheckbox.addEventListener('change', () => {
        tafelCheckboxes.forEach(checkbox => {
            checkbox.checked = selecteerAllesCheckbox.checked;
        });
        vulRekenvierkant();
    });

    tafelCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (!checkbox.checked) {
                selecteerAllesCheckbox.checked = false;
            } else {
                const allChecked = Array.from(tafelCheckboxes).every(cb => cb.checked);
                selecteerAllesCheckbox.checked = allChecked;
            }
            vulRekenvierkant();
        });
    });

    document.getElementById("typeOpgave").addEventListener("change", vulRekenvierkant);
    document.getElementById("niveau").addEventListener("change", vulRekenvierkant);
    document.getElementById("formaat").addEventListener("change", vulRekenvierkant);
    document.getElementById("typeTafeloefening").addEventListener("change", vulRekenvierkant);
    document.getElementById("maxUitkomst").addEventListener("change", vulRekenvierkant);
    document.querySelectorAll('input[name="numGrids"]').forEach(radio => {
        radio.addEventListener("change", vulRekenvierkant);
    });
});

document.getElementById("genereerBtn").addEventListener("click", () => {
    vulRekenvierkant();
});

document.getElementById("downloadPngBtn").addEventListener("click", () => {
    const dataURL = canvas.toDataURL("image/png");
    const a = document.createElement("a");
a.href = dataURL;
    a.download = "rekenvierkant.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

document.getElementById("downloadPdfBtn").addEventListener("click", async () => {
    const dataURL = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;

    let pdfImgWidth = pageWidth - 20;
    let pdfImgHeight = pdfImgWidth / ratio;

    if (pdfImgHeight > pageHeight - 40) {
        pdfImgHeight = pageHeight - 40;
        pdfImgWidth = pdfImgHeight * ratio;
    }

    const xPos = (pageWidth - pdfImgWidth) / 2;
    const yPos = (pageHeight - pdfImgHeight) / 2;

    doc.addImage(dataURL, 'PNG', xPos, yPos, pdfImgWidth, pdfImgHeight);
    doc.setFontSize(18);
    doc.text("Rekenvierkant", pageWidth / 2, 20, { align: 'center' });
    doc.save("rekenvierkant.pdf");
});