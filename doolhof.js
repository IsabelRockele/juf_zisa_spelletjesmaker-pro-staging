document.addEventListener('DOMContentLoaded', () => {

    const CANVAS_SIZE = 500;
    let wallThickness = 2;
    const MAZE_COLOR = "#333";
    const SOLUTION_COLOR = "#007bff";
    const MAZE_PADDING = 20;

    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    
    const instructieText = document.getElementById('instructieText');
    const solveBtn = document.getElementById('solveMazeBtn');
    const hideBtn = document.getElementById('hideSolutionBtn');
    
    const thicknessSlider = document.getElementById('thicknessSlider');
    const thicknessValue = document.getElementById('thicknessValue');

    let currentGrid = [];
    let activeCells = [];
    let startCell, endCell;
    let solutionPath = [];
    let currentShape = 'worksheet';
    
    const shapes = [
        { id: 'worksheet', name: 'Uitsparing', file: 'uitsparing.png' },
        { id: 'rectangle', name: 'Rechthoek', file: 'rechthoek.png' },
        { id: 'masked_circle', name: 'Vorm', file: 'vorm.png' },
        { id: 'polar_circle', name: 'Cirkel', file: 'cirkel.png' },
        { id: 'polar_large_hole', name: 'Cirkel (groot gat)', file: 'cirkel_groot_gat.png' },
        { id: 'house', name: 'Huis', file: 'huis.png' }
    ];

    function initialize() {
        setupShapePicker();
        addEventListeners();
        
        thicknessSlider.value = wallThickness;
        thicknessValue.textContent = wallThickness;
        
        generateAndDrawMaze();
    }

    function setupShapePicker() {
        const pickerDiv = document.getElementById('vorm-kiezer');
        shapes.forEach(shape => {
            const img = document.createElement('img');
            img.src = `start_afbeeldingen/${shape.file}`;
            img.alt = shape.name;
            img.dataset.shape = shape.id;
            if (shape.id === currentShape) img.classList.add('selected');
            pickerDiv.appendChild(img);
        });
    }

    function addEventListeners() {
        document.getElementById('vorm-kiezer').addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') {
                document.querySelectorAll('#vorm-kiezer img').forEach(img => img.classList.remove('selected'));
                e.target.classList.add('selected');
                currentShape = e.target.dataset.shape;
                generateAndDrawMaze();
            }
        });
        document.querySelectorAll('input[name="difficulty"]').forEach(radio => radio.addEventListener('change', generateAndDrawMaze));
        document.getElementById('generateButton').addEventListener('click', generateAndDrawMaze);
        document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);
        document.getElementById('downloadPngBtn').addEventListener('click', downloadPNG);
        
        canvas.addEventListener('click', handleEraser);
        
        solveBtn.addEventListener('click', solveAndShowSolution);
        hideBtn.addEventListener('click', hideSolution);

        thicknessSlider.addEventListener('input', () => {
            wallThickness = parseInt(thicknessSlider.value, 10);
            thicknessValue.textContent = wallThickness;
            drawAll();
        });
    }
    
    function generateAndDrawMaze() {
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        solutionPath = []; 
        hideSolution(); 
        activeCells = [];

        instructieText.textContent = "Kies een vorm en moeilijkheid.";
        solveBtn.disabled = false;
        canvas.style.cursor = 'default';

        if (currentShape === 'worksheet') {
            generateWorksheetMaze(difficulty);
            canvas.style.cursor = 'crosshair';
        } else if (currentShape === 'rectangle') {
            generateRectangularMaze(difficulty);
        } else if (currentShape === 'masked_circle') {
            generateMaskedMaze(difficulty, 'circle');
        } else if (currentShape === 'house') {
            generateMaskedMaze(difficulty, 'house');
        } else if (currentShape === 'polar_circle' || currentShape === 'polar_large_hole') {
            const isLarge = currentShape === 'polar_large_hole';
            generatePolarMaze(difficulty, { largeHole: isLarge });
        }
    }
    
    function drawAll() {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        
        if (currentShape === 'worksheet') { drawWorksheetMaze(); }
        else if (currentShape === 'rectangle') { drawRectangularMaze(); }
        else if (currentShape === 'masked_circle' || currentShape === 'house') { drawMaskedMaze(); }
        else if (currentShape === 'polar_circle' || currentShape === 'polar_large_hole') { drawPolarMaze(); }
        
        if (solutionPath.length > 0) {
            drawSolution();
        }
    }

    // --- RECTANGULAR/MASKED MAZE LOGIC (ORIGINAL, WORKING CODE) ---

    function generateWorksheetMaze(difficulty) {
        const DIFFICULTY_LEVELS = { easy: 10, medium: 15, hard: 25 };
        const gridSize = DIFFICULTY_LEVELS[difficulty];
        let grid = [];
        const cutoutSize = Math.floor(gridSize * 0.25);

        for (let y = 0; y < gridSize; y++) {
            grid[y] = [];
            for (let x = 0; x < gridSize; x++) {
                const cell = { x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false };
                grid[y][x] = cell;
                const inTopLeft = x < cutoutSize && y < cutoutSize;
                const inBottomRight = x >= gridSize - cutoutSize && y >= gridSize - cutoutSize;
                if (!inTopLeft && !inBottomRight) activeCells.push(cell);
            }
        }
        
        if(activeCells.length === 0) return;
        
        let stack = [activeCells[0]];
        activeCells[0].visited = true;

        while (stack.length > 0) {
            let current = stack.pop();
            const getNeighbors = (cell) => [ grid[cell.y-1]?.[cell.x], grid[cell.y]?.[cell.x+1], grid[cell.y+1]?.[cell.x], grid[cell.y]?.[cell.x-1] ].filter(p => p && !p.visited && activeCells.includes(p));
            const neighbors = getNeighbors(current);
            
            if (neighbors.length > 0) {
                stack.push(current);
                let chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                if (current.x - chosen.x === 1) { current.walls.left = false; chosen.walls.right = false; }
                else if (current.x - chosen.x === -1) { current.walls.right = false; chosen.walls.left = false; }
                if (current.y - chosen.y === 1) { current.walls.top = false; chosen.walls.bottom = false; }
                else if (current.y - chosen.y === -1) { current.walls.bottom = false; chosen.walls.top = false; }
                chosen.visited = true;
                stack.push(chosen);
            }
        }
        currentGrid = grid;
        
        startCell = grid[Math.floor(cutoutSize/2)][cutoutSize];
        endCell = grid[gridSize - Math.floor(cutoutSize/2) -1][gridSize - cutoutSize -1];
        startCell.walls.left = false;
        endCell.walls.right = false;

        drawAll();
    }

    function drawWorksheetMaze() {
        if (!currentGrid.length) return;
        const gridSize = currentGrid.length;
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = wallThickness;
        ctx.lineCap = "square";
        
        ctx.beginPath();
        for (const cell of activeCells) {
            const gx = MAZE_PADDING + cell.x * cellSize;
            const gy = MAZE_PADDING + cell.y * cellSize;
            if (cell.walls.top) { ctx.moveTo(gx, gy); ctx.lineTo(gx + cellSize, gy); }
            if (cell.walls.right) { ctx.moveTo(gx + cellSize, gy); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.bottom) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.left) { ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + cellSize); }
        }
        ctx.stroke();
    }

    function generateRectangularMaze(difficulty) {
        const DIFFICULTY_LEVELS = { easy: 10, medium: 15, hard: 25 };
        const gridSize = DIFFICULTY_LEVELS[difficulty];
        let grid = [];
        for (let y = 0; y < gridSize; y++) {
            grid[y] = [];
            for (let x = 0; x < gridSize; x++) {
                 grid[y][x] = { x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false };
            }
        }
        let stack = [grid[0][0]];
        grid[0][0].visited = true;
        while (stack.length > 0) {
            let current = stack.pop();
            const neighbors = [grid[current.y-1]?.[current.x], grid[current.y]?.[current.x+1], grid[current.y+1]?.[current.x], grid[current.y]?.[current.x-1]].filter(n => n && !n.visited);
            if (neighbors.length > 0) {
                stack.push(current);
                let chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                if (current.x - chosen.x === 1) { current.walls.left = false; chosen.walls.right = false; }
                else if (current.x - chosen.x === -1) { current.walls.right = false; chosen.walls.left = false; }
                if (current.y - chosen.y === 1) { current.walls.top = false; chosen.walls.bottom = false; }
                else if (current.y - chosen.y === -1) { current.walls.bottom = false; chosen.walls.top = false; }
                chosen.visited = true;
                stack.push(chosen);
            }
        }
        startCell = grid[0][0];
        endCell = grid[gridSize-1][gridSize-1];
        startCell.walls.left = false;
        endCell.walls.right = false;
        currentGrid = grid;
        drawAll();
    }

    function drawRectangularMaze() {
        if (!currentGrid.length) return;
        const gridSize = currentGrid.length;
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = wallThickness;
        ctx.lineCap = "square";
        
        ctx.beginPath();
        for (const row of currentGrid) {
            for (const cell of row) {
                const gx = MAZE_PADDING + cell.x * cellSize;
                const gy = MAZE_PADDING + cell.y * cellSize;
                if (cell.walls.top) { ctx.moveTo(gx, gy); ctx.lineTo(gx + cellSize, gy); }
                if (cell.walls.right) { ctx.moveTo(gx + cellSize, gy); ctx.lineTo(gx + cellSize, gy + cellSize); }
                if (cell.walls.bottom) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx + cellSize, gy + cellSize); }
                if (cell.walls.left) { ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + cellSize); }
            }
        }
        ctx.stroke();
    }
    
    function generateMaskedMaze(difficulty, maskType) {
        const DIFFICULTY_LEVELS = { easy: 10, medium: 15, hard: 25 };
        const gridSize = DIFFICULTY_LEVELS[difficulty];
        let grid = [];
        activeCells = [];

        for (let y = 0; y < gridSize; y++) {
            grid[y] = [];
            for (let x = 0; x < gridSize; x++) {
                const cell = { x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false };
                grid[y][x] = cell;

                let isActive = false;
                if (maskType === 'circle') {
                    const radius = gridSize / 2;
                    const dx = x - radius + 0.5;
                    const dy = y - radius + 0.5;
                    if (dx * dx + dy * dy < radius * radius) {
                        isActive = true;
                    }
                } else if (maskType === 'house') {
                    const baseTopY = Math.floor(gridSize / 2);
                    if (y >= baseTopY) {
                        isActive = true;
                    } else {
                        const roofHeight = baseTopY;
                        const center = (gridSize - 1) / 2;
                        const yInRoof = y;
                        const allowedDist = (yInRoof / (roofHeight - 1)) * center;
                        if (Math.abs(x - center) <= allowedDist) {
                            isActive = true;
                        }
                    }
                }

                if (isActive) {
                    activeCells.push(cell);
                }
            }
        }

        if(activeCells.length === 0) return;
        
        let stack = [activeCells[0]];
        activeCells[0].visited = true;
        while (stack.length > 0) {
            let current = stack.pop();
            const getNeighbors = (cell) => [ grid[cell.y-1]?.[cell.x], grid[cell.y]?.[cell.x+1], grid[cell.y+1]?.[cell.x], grid[cell.y]?.[cell.x-1] ].filter(p => p && !p.visited && activeCells.includes(p));
            const neighbors = getNeighbors(current);
            if (neighbors.length > 0) {
                stack.push(current);
                let chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                if (current.x - chosen.x === 1) { current.walls.left = false; chosen.walls.right = false; }
                else if (current.x - chosen.x === -1) { current.walls.right = false; chosen.walls.left = false; }
                if (current.y - chosen.y === 1) { current.walls.top = false; chosen.walls.bottom = false; }
                else if (current.y - chosen.y === -1) { current.walls.bottom = false; chosen.walls.top = false; }
                chosen.visited = true;
                stack.push(chosen);
            }
        }

        const edgeCells = activeCells.filter(c => [ grid[c.y-1]?.[c.x], grid[c.y]?.[c.x+1], grid[c.y+1]?.[c.x], grid[c.y]?.[c.x-1] ].some(n => !n || !activeCells.includes(n)));
        if (edgeCells.length >= 2) {
            startCell = edgeCells[Math.floor(Math.random() * edgeCells.length)];
            endCell = edgeCells.reduce((a, b) => (Math.hypot(startCell.x - a.x, startCell.y - a.y) > Math.hypot(startCell.x - b.x, startCell.y - b.y) ? a : b));

            if (!activeCells.includes(grid[startCell.y-1]?.[startCell.x])) startCell.walls.top = false;
            else if (!activeCells.includes(grid[startCell.y]?.[startCell.x+1])) startCell.walls.right = false;
            else if (!activeCells.includes(grid[startCell.y+1]?.[startCell.x])) startCell.walls.bottom = false;
            else startCell.walls.left = false;
            
            if (!activeCells.includes(grid[endCell.y-1]?.[endCell.x])) endCell.walls.top = false;
            else if (!activeCells.includes(grid[endCell.y]?.[endCell.x+1])) endCell.walls.right = false;
            else if (!activeCells.includes(grid[endCell.y+1]?.[endCell.x])) endCell.walls.bottom = false;
            else endCell.walls.left = false;
        } else {
             solveBtn.disabled = true;
        }

        currentGrid = grid;
        drawAll();
    }

    function drawMaskedMaze() {
        if (!currentGrid.length) return;
        const gridSize = currentGrid.length;
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        
        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = wallThickness;
        ctx.lineCap = "square";
        
        ctx.beginPath();
        for (const cell of activeCells) {
            const gx = MAZE_PADDING + cell.x * cellSize;
            const gy = MAZE_PADDING + cell.y * cellSize;
            if (cell.walls.top) { ctx.moveTo(gx, gy); ctx.lineTo(gx + cellSize, gy); }
            if (cell.walls.right) { ctx.moveTo(gx + cellSize, gy); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.bottom) { ctx.moveTo(gx, gy + cellSize); ctx.lineTo(gx + cellSize, gy + cellSize); }
            if (cell.walls.left) { ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + cellSize); }
        }
        ctx.stroke();
    }

    // --- POLAR MAZE LOGIC (REWRITTEN BASED ON PROEFVERSIE) ---

    function generatePolarMaze(difficulty, options = {}) {
        const { largeHole = false } = options;

        const DIFFICULTY_LEVELS = {
            easy:   { levels: 6,  cellsPerLevel: 24, centerRings: largeHole ? 3 : 1 },
            medium: { levels: 9,  cellsPerLevel: 32, centerRings: largeHole ? 4 : 2 },
            hard:   { levels: 12, cellsPerLevel: 40, centerRings: largeHole ? 5 : 3 }
        };

        const settings = DIFFICULTY_LEVELS[difficulty];
        const numLevels = settings.levels;
        const cellsPerLevel = settings.cellsPerLevel;
        const centerRings = settings.centerRings;

        let grid = [];
        for (let i = 0; i < numLevels; i++) {
            grid.push(Array(cellsPerLevel).fill(null).map(() => ({
                visited: false,
                walls: { top: true, right: true }
            })));
        }
        currentGrid = { type: 'polar', grid, numLevels, cellsPerLevel, centerRings };

        const stack = [];
        const startLevel = numLevels - 1;
        const startCellIdx = Math.floor(Math.random() * cellsPerLevel);
        
        startCell = {level: startLevel, cell: startCellIdx};
        stack.push(startCell);
        grid[startLevel][startCellIdx].visited = true;

        const getNeighbors = (level, cell) => {
            const neighbors = [];
            if (level > 0 && !grid[level - 1][cell].visited) neighbors.push({level: level - 1, cell});
            if (level < numLevels - 1 && !grid[level + 1][cell].visited) neighbors.push({level: level + 1, cell});
            const cwCell = (cell + 1) % cellsPerLevel;
            if (!grid[level][cwCell].visited) neighbors.push({level, cell: cwCell});
            const ccwCell = (cell - 1 + cellsPerLevel) % cellsPerLevel;
            if (!grid[level][ccwCell].visited) neighbors.push({level, cell: ccwCell});
            return neighbors;
        };
        
        const removeWall = (c1, c2) => {
            if (c1.level === c2.level) {
                if ((c1.cell < c2.cell && !(c1.cell === 0 && c2.cell === cellsPerLevel - 1)) || (c1.cell === cellsPerLevel - 1 && c2.cell === 0)) {
                    grid[c1.level][c1.cell].walls.right = false;
                } else {
                    grid[c2.level][c2.cell].walls.right = false;
                }
            } else {
                const outerLevelCell = c1.level > c2.level ? c1 : c2;
                grid[outerLevelCell.level][outerLevelCell.cell].walls.top = false;
            }
        };

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = getNeighbors(current.level, current.cell);

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                removeWall(current, next);
                grid[next.level][next.cell].visited = true;
                stack.push(next);
            } else {
                stack.pop();
            }
        }
        
        const exitCellIndex = Math.floor(Math.random() * cellsPerLevel);
        grid[0][exitCellIndex].walls.top = false;
        endCell = {level: 0, cell: exitCellIndex};
        
        drawAll();
    }

    function drawPolarMaze() {
        if (!currentGrid.grid) return;
        const { grid, numLevels, cellsPerLevel, centerRings } = currentGrid;
        
        const levelHeight = (CANVAS_SIZE/2 - MAZE_PADDING) / (numLevels + centerRings);
        const centerRadius = centerRings * levelHeight;

        ctx.strokeStyle = MAZE_COLOR;
        ctx.lineWidth = wallThickness;
        ctx.lineCap = 'round';

        for (let i = 0; i < numLevels; i++) {
            const innerRadius = centerRadius + i * levelHeight;
            const outerRadius = centerRadius + (i + 1) * levelHeight;
            const angleStep = 2 * Math.PI / cellsPerLevel;

            for (let j = 0; j < cellsPerLevel; j++) {
                if (grid[i][j].walls.top) {
                    ctx.beginPath();
                    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, innerRadius, j * angleStep, (j + 1) * angleStep);
                    ctx.stroke();
                }
                if (grid[i][j].walls.right) {
                    const angle = (j + 1) * angleStep;
                    ctx.beginPath();
                    ctx.moveTo(CANVAS_SIZE / 2 + innerRadius * Math.cos(angle), CANVAS_SIZE / 2 + innerRadius * Math.sin(angle));
                    ctx.lineTo(CANVAS_SIZE / 2 + outerRadius * Math.cos(angle), CANVAS_SIZE / 2 + outerRadius * Math.sin(angle));
                    ctx.stroke();
                }
            }
        }

        const outermostRadius = centerRadius + numLevels * levelHeight;
        const entranceAngleStart = startCell.cell * (2 * Math.PI / cellsPerLevel);
        const entranceAngleEnd = (startCell.cell + 1) * (2 * Math.PI / cellsPerLevel);
        
        ctx.beginPath();
        ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, outermostRadius, entranceAngleEnd, entranceAngleStart + 2 * Math.PI);
        ctx.stroke();
    }


    // --- SOLUTION LOGIC & HELPERS ---
    
    function solveAndShowSolution() {
        solveMaze();
        drawSolution();
        solveBtn.classList.add('hidden');
        hideBtn.classList.remove('hidden');
    }

    function hideSolution() {
        solutionPath = [];
        drawAll();
        hideBtn.classList.add('hidden');
        solveBtn.classList.remove('hidden');
    }

    function solveMaze() {
        if (!startCell || !endCell) return;
        
        let queue;
        let visited;
        
        // Setup initial state based on maze type
        if (currentGrid.type === 'polar') {
            queue = [{ cell: startCell, path: [startCell] }];
            visited = new Set([`${startCell.level}-${startCell.cell}`]);
        } else {
            queue = [{ cell: startCell, path: [startCell] }];
            visited = new Set([startCell]);
        }
       
        while (queue.length > 0) {
            let { cell, path } = queue.shift();

            // Check for goal based on maze type
            let isAtEnd = false;
            if (currentGrid.type === 'polar') {
                if (cell.level === endCell.level && cell.cell === endCell.cell) isAtEnd = true;
            } else {
                if (cell === endCell) isAtEnd = true;
            }

            if (isAtEnd) {
                solutionPath = path;
                return;
            }
            
            // Get neighbors based on maze type
            let neighbors = [];
            if (currentGrid.type === 'polar') {
                const grid = currentGrid.grid;
                // Clockwise
                const cwCellIdx = (cell.cell + 1) % currentGrid.cellsPerLevel;
                if (!grid[cell.level][cell.cell].walls.right) neighbors.push({level: cell.level, cell: cwCellIdx});
                // Counter-clockwise
                const ccwCellIdx = (cell.cell - 1 + currentGrid.cellsPerLevel) % currentGrid.cellsPerLevel;
                if (!grid[cell.level][ccwCellIdx].walls.right) neighbors.push({level: cell.level, cell: ccwCellIdx});
                // Outward
                if (cell.level < currentGrid.numLevels - 1 && !grid[cell.level + 1][cell.cell].walls.top) neighbors.push({level: cell.level + 1, cell: cell.cell});
                // Inward
                if (cell.level > 0 && !grid[cell.level][cell.cell].walls.top) neighbors.push({level: cell.level - 1, cell: cell.cell});
            } else {
                const {x, y} = cell;
                if (!cell.walls.top && y > 0 && currentGrid[y - 1]?.[x]) neighbors.push(currentGrid[y - 1][x]);
                if (!cell.walls.right && x < currentGrid[0].length - 1 && currentGrid[y]?.[x + 1]) neighbors.push(currentGrid[y][x + 1]);
                if (!cell.walls.bottom && y < currentGrid.length - 1 && currentGrid[y + 1]?.[x]) neighbors.push(currentGrid[y + 1][x]);
                if (!cell.walls.left && x > 0 && currentGrid[y]?.[x - 1]) neighbors.push(currentGrid[y][x - 1]);
            }

            for (let neighbor of neighbors) {
                const neighborId = currentGrid.type === 'polar' ? `${neighbor.level}-${neighbor.cell}` : neighbor;

                if (!visited.has(neighborId)) {
                    visited.add(neighborId);
                    let newPath = [...path, neighbor];
                    queue.push({ cell: neighbor, path: newPath });
                }
            }
        }
    }

    function drawSolution() {
        if (solutionPath.length < 2) return;

        ctx.strokeStyle = SOLUTION_COLOR;
        ctx.lineWidth = wallThickness * 1.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        
        if(currentGrid.type === 'polar') {
            const { numLevels, cellsPerLevel, centerRings } = currentGrid;
            const levelHeight = (CANVAS_SIZE/2 - MAZE_PADDING) / (numLevels + centerRings);
            const centerRadius = centerRings * levelHeight;

            solutionPath.forEach((cell, i) => {
                const angleStep = 2 * Math.PI / cellsPerLevel;
                const radius = centerRadius + (cell.level + 0.5) * levelHeight;
                const angle = (cell.cell + 0.5) * angleStep;
                const x = CANVAS_SIZE / 2 + radius * Math.cos(angle);
                const y = CANVAS_SIZE / 2 + radius * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
    
            // Extend line to the center for the exit
            if (solutionPath[solutionPath.length - 1].level === 0) {
                 ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
            }

        } else {
            const gridSize = currentGrid.length;
            const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
            const cellSize = availableSize / gridSize;
            const getCenter = (cell) => ({ 
                x: MAZE_PADDING + (cell.x + 0.5) * cellSize, 
                y: MAZE_PADDING + (cell.y + 0.5) * cellSize 
            });

            let firstPoint = getCenter(solutionPath[0]);
            ctx.moveTo(firstPoint.x, firstPoint.y);

            for (let i = 1; i < solutionPath.length; i++) {
                let nextPoint = getCenter(solutionPath[i]);
                ctx.lineTo(nextPoint.x, nextPoint.y);
            }
        }
        ctx.stroke();
    }
    
    function handleEraser(event) {
        if (currentShape !== 'worksheet' || !currentGrid.length || !Array.isArray(currentGrid)) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left - MAZE_PADDING;
        const mouseY = event.clientY - rect.top - MAZE_PADDING;

        const gridSize = currentGrid.length;
        const availableSize = CANVAS_SIZE - 2 * MAZE_PADDING;
        const cellSize = availableSize / gridSize;
        
        const x = Math.floor(mouseX / cellSize);
        const y = Math.floor(mouseY / cellSize);

        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
        
        if(currentGrid[y][x] === startCell && x === startCell.x && y === startCell.y) return;
        if(currentGrid[y][x] === endCell && x === endCell.x && y === endCell.y) return;

        const dx = mouseX - x * cellSize;
        const dy = mouseY - y * cellSize;
        const tolerance = wallThickness * 3;
        const cell = currentGrid[y][x];
        const dists = { 
            top: dy, 
            right: cellSize - dx, 
            bottom: cellSize - dy, 
            left: dx 
        };
        const closestWall = Object.keys(dists).reduce((a, b) => dists[a] < dists[b] ? a : b);
        
        if (dists[closestWall] > tolerance) return;

        if (closestWall === 'top' && y > 0) { cell.walls.top = false; currentGrid[y - 1][x].walls.bottom = false; }
        else if (closestWall === 'right' && x < gridSize - 1) { cell.walls.right = false; currentGrid[y][x + 1].walls.left = false; }
        else if (closestWall === 'bottom' && y < gridSize - 1) { cell.walls.bottom = false; currentGrid[y + 1][x].walls.top = false; }
        else if (closestWall === 'left' && x > 0) { cell.walls.left = false; currentGrid[y][x - 1].walls.right = false; }
        
        drawAll();
    }

    function downloadPDF() {
        const currentSolution = [...solutionPath];
        solutionPath = [];
        drawAll();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.setFontSize(22);
        doc.text('Mijn Doolhof Werkblad', 105, 20, { align: 'center' });
        const imageData = canvas.toDataURL('image/png');
        const imgWidth = 180;
        const xPos = (210 - imgWidth) / 2;
        doc.addImage(imageData, 'PNG', xPos, 35, imgWidth, imgWidth);
        doc.save('doolhof-werkblad.pdf');
        
        solutionPath = currentSolution;
        drawAll();
    }
    
    function downloadPNG() {
        const link = document.createElement('a');
        link.download = 'doolhof.png';
        link.href = canvas.toDataURL("image/png");
        link.click();
    }

    initialize();
});