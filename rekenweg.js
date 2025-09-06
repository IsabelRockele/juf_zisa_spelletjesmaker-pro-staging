// DEFINITIEVE VERSIE - 3 september 2025
// Fix: typvakje correct in vak (schaal + scroll) en behoud van alle bestaande functionaliteit

// Globale variabelen
const CELL_SIZE = 40; // Grootte van een cel in pixels
const GRID_COLS = 20; // Aantal kolommen
const GRID_ROWS = 15; // Aantal rijen

let canvas; // Canvas element
let ctx; // 2D rendering context

let isDrawing = false; // Vlag voor tekenen
let currentDrawnPath = []; // [{row, col, branchLetter}, ...]
let lastDrawnCell = null; // Laatste cel voor adjacency-check
let currentViewMode = 'drawing'; // 'drawing' | 'template-canvas'
let currentTemplateGrid = null; // Grid met lege/vulling-vakjes
let currentTemplateData = []; // Tekstuele data van slots

// Variabelen voor toetsenbordnavigatie
let editedCell = null;

// Regels voor takken
const branchRules = {
  'A': { count: 5, next: 'B' }, 'B': { count: 4, next: 'C' }, 'C': { count: 4, next: 'D' },
  'D': { count: 4, next: 'E' }, 'E': { count: 4, next: 'F' }, 'F': { count: 4, next: 'G' },
  'G': { count: 4, next: 'H' }, 'H': { count: 4, next: 'I' }, 'I': { count: 4, next: 'J' },
  'J': { count: 4, next: 'K' }, 'K': { count: 4, next: 'L' }, 'L': { count: 4, next: 'M' },
  'M': { count: 4, next: 'N' }, 'N': { count: 4, next: 'O' }, 'O': { count: 4, next: 'P' },
  'P': { count: 4, next: 'Q' }, 'Q': { count: 4, next: 'R' }, 'R': { count: 4, next: 'S' },
  'S': { count: 4, next: 'T' }, 'T': { count: 4, next: 'U' }, 'U': { count: 4, next: 'V' },
  'V': { count: 4, next: 'W' }, 'W': { count: 4, next: 'X' }, 'X': { count: 4, next: 'Y' },
  'Y': { count: 4, next: 'Z' }, 'Z': { count: 4, next: null }
};

const branchLettersOrder = Object.keys(branchRules);
let activeBranchIndex = 0;
let activeBranchLetter = branchLettersOrder[activeBranchIndex];

// --- HELPER FUNCTIES ---
function getBranchColor(letter) {
  const colors = {
    'A': '#FF6347','B': '#4682B4','C': '#32CD32','D': '#FFD700','E': '#9370DB','F': '#FFA500',
    'G': '#FF69B4','H': '#8A2BE2','I': '#00CED1','J': '#A0522D','K': '#48D1CC','L': '#7FFF00',
    'M': '#DA70D6','N': '#FF4500','O': '#20B2AA','P': '#B22222','Q': '#DDA0DD','R': '#4169E1',
    'S': '#BDB76B','T': '#008080','U': '#CD5C5C','V': '#F08080','W': '#40E0D0','X': '#9ACD32',
    'Y': '#8B008B','Z': '#8FBC8F'
  };
  return colors[letter] || '#808080';
}

function orderBranchCells(cellsInBranch) {
  if (cellsInBranch.length === 0) return [];
  if (cellsInBranch.length === 1) return [cellsInBranch[0]];
  const cellSet = new Set(cellsInBranch.map(c => `${c.row},${c.col}`));
  const map = new Map(cellsInBranch.map(c => [`${c.row},${c.col}`, c]));
  let starts = [];
  for (const cell of cellsInBranch) {
    let n = 0;
    const neigh = [
      {r: cell.row - 1, c: cell.col}, {r: cell.row + 1, c: cell.col},
      {r: cell.row, c: cell.col - 1}, {r: cell.row, c: cell.col + 1}
    ];
    for (const nb of neigh) if (cellSet.has(`${nb.r},${nb.c}`)) n++;
    if (n <= 1) starts.push(cell);
  }
  if (starts.length === 0 && cellsInBranch.length > 1) {
    starts.push(cellsInBranch.sort((a,b)=>a.row-b.row || a.col-b.col)[0]);
  } else if (starts.length > 2) {
    return null;
  }
  const ordered = [];
  const visited = new Set();
  let cur = starts[0];
  while (cur && !visited.has(`${cur.row},${cur.col}`)) {
    ordered.push(cur);
    visited.add(`${cur.row},${cur.col}`);
    let next = null;
    const neigh = [
      {r: cur.row - 1, c: cur.col}, {r: cur.row + 1, c: cur.col},
      {r: cur.row, c: cur.col - 1}, {r: cur.row, c: cur.col + 1}
    ];
    for (const nb of neigh) {
      const key = `${nb.r},${nb.c}`;
      if (cellSet.has(key) && !visited.has(key)) { next = map.get(key); break; }
    }
    cur = next;
  }
  if (ordered.length !== cellsInBranch.length) return null;
  return ordered;
}

function createPathTemplateGrid(pathsByBranch) {
  let grid = Array(GRID_ROWS).fill(null).map(()=>Array(GRID_COLS).fill(null));
  currentTemplateData = [];
  const letters = Object.keys(pathsByBranch)
    .sort((a,b)=>branchLettersOrder.indexOf(a)-branchLettersOrder.indexOf(b));
  let slot = 0;
  for (const L of letters) {
    const path = pathsByBranch[L];
    if (!path || path.length < 1) continue;
    currentTemplateData.push({ type:'header', branchLetter:L, count:path.length });
    for (const cell of path) {
      if (grid[cell.row][cell.col] !== null) continue;
      slot++;
      grid[cell.row][cell.col] = { type:'empty_slot', value:'', row:cell.row, col:cell.col, branchLetter:L, slotNumber:slot };
      currentTemplateData.push(grid[cell.row][cell.col]);
    }
  }
  if (slot === 0) return null;
  return grid;
}

function drawGrid() {
  ctx.strokeStyle = "#DDD"; ctx.lineWidth = 1;
  for (let i=0;i<=GRID_COLS;i++){ ctx.beginPath(); ctx.moveTo(i*CELL_SIZE,0); ctx.lineTo(i*CELL_SIZE,canvas.height); ctx.stroke(); }
  for (let i=0;i<=GRID_ROWS;i++){ ctx.beginPath(); ctx.moveTo(0,i*CELL_SIZE); ctx.lineTo(canvas.width,i*CELL_SIZE); ctx.stroke(); }
}

function drawDrawnPath() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid();
  currentDrawnPath.forEach(cell=>{
    ctx.fillStyle=getBranchColor(cell.branchLetter);
    ctx.fillRect(cell.col*CELL_SIZE,cell.row*CELL_SIZE,CELL_SIZE,CELL_SIZE);
    ctx.strokeStyle="#000"; ctx.lineWidth=1;
    ctx.strokeRect(cell.col*CELL_SIZE,cell.row*CELL_SIZE,CELL_SIZE,CELL_SIZE);
    ctx.fillStyle="#FFF"; ctx.font=`bold ${CELL_SIZE*0.6}px Arial`;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(cell.branchLetter,cell.col*CELL_SIZE+CELL_SIZE/2,cell.row*CELL_SIZE+CELL_SIZE/2);
  });
}

function drawPathTemplateOnCanvas(grid) {
  if (!ctx || !grid) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for (let r=0;r<GRID_ROWS;r++){
    for (let c=0;c<GRID_COLS;c++){
      const cell=grid[r][c];
      if (cell!==null){
        const x=cell.col*CELL_SIZE, y=cell.row*CELL_SIZE;
        ctx.fillStyle="#FFF"; ctx.fillRect(x,y,CELL_SIZE,CELL_SIZE);
        ctx.strokeStyle="#000"; ctx.lineWidth=1; ctx.strokeRect(x,y,CELL_SIZE,CELL_SIZE);
        if (cell.value){
          ctx.fillStyle="#000"; ctx.font=`bold ${CELL_SIZE*0.5}px Arial`;
          ctx.textAlign="center"; ctx.textBaseline="middle";
          ctx.fillText(cell.value,x+CELL_SIZE/2,y+CELL_SIZE/2);
        }
      }
    }
  }
}

function saveCellValue(cellData, value) {
  if (!cellData) return;
  if (currentTemplateGrid[cellData.row][cellData.col]) {
    currentTemplateGrid[cellData.row][cellData.col].value = value;
  }
  const item = currentTemplateData.find(i=>i.type==='empty_slot' && i.row===cellData.row && i.col===cellData.col);
  if (item) item.value=value;
  drawPathTemplateOnCanvas(currentTemplateGrid);
}

function removeCurrentInput() {
  if (editedCell && editedCell.inputElement) {
    try {
      document.body.removeChild(editedCell.inputElement);
    } catch (e) {
      if (e.name !== 'NotFoundError') {
        throw e;
      }
    }
    editedCell = null;
  }
}

// --------- BELANGRIJKE FIX: typvakje correct positioneren (schaal + scroll) ---------
function createInputForCell(cellData) {
  removeCurrentInput();
  if (!cellData || cellData.type !== 'empty_slot') return;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = cellData.value || '';

  // Basisstijl – exacte grootte/positie zetten we in reposition()
  input.style.position = 'absolute';
  input.style.border = '2px solid blue';
  input.style.textAlign = 'center';
  input.style.boxSizing = 'border-box';
  input.style.fontWeight = 'bold';
  input.style.background = 'white';
  input.style.zIndex = '9999';

  // Navigatie tussen lege vakjes met pijltjes/space
  input.addEventListener('keydown', (e) => {
    const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
    if (!navKeys.includes(e.key)) return;
    e.preventDefault();
    const { row, col } = editedCell.cellData;
    let targetRow = row, targetCol = col;
    if (e.key === 'ArrowUp') targetRow--;
    else if (e.key === 'ArrowDown') targetRow++;
    else if (e.key === 'ArrowLeft') targetCol--;
    else if (e.key === 'ArrowRight' || e.key === ' ') targetCol++;
    const targetCell = currentTemplateData.find(cell =>
      cell.type === 'empty_slot' && cell.row === targetRow && cell.col === targetCol
    );
    if (targetCell) {
      saveCellValue(editedCell.cellData, input.value);
      createInputForCell(targetCell);
    }
  });

  input.addEventListener('blur', () => { saveCellValue(cellData, input.value); removeCurrentInput(); });
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') { saveCellValue(cellData, input.value); removeCurrentInput(); }
  });

  // Positie & grootte corrigeren voor responsieve schaal + scroll
  const reposition = () => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width  / canvas.width;
    const scaleY = rect.height / canvas.height;

    input.style.left   = (rect.left + window.scrollX + cellData.col * CELL_SIZE * scaleX) + 'px';
    input.style.top    = (rect.top  + window.scrollY + cellData.row * CELL_SIZE * scaleY) + 'px';
    input.style.width  = (CELL_SIZE * scaleX) + 'px';
    input.style.height = (CELL_SIZE * scaleY) + 'px';

    // Lettergrootte: halve celhoogte; schaalt mee. Vaste waarde? Gebruik CELL_SIZE*0.5.
    input.style.font = `bold ${Math.max(12, CELL_SIZE * 0.5 * scaleY)}px Arial`;
    input.style.lineHeight = (CELL_SIZE * scaleY) + 'px';
  };

  editedCell = { cellData, inputElement: input, reposition };

  // Eerst toevoegen en dan positioneren (zeker dat rect klopt)
  requestAnimationFrame(() => {
    if (editedCell && editedCell.inputElement === input) {
      document.body.appendChild(input);
      reposition();
      input.focus();
    }
  });
}

function resetAndStartOver() {
  removeCurrentInput();
  currentDrawnPath = [];
  currentTemplateGrid = null;
  currentTemplateData = [];
  startDrawingMode();
}

function startDrawingMode() {
  document.body.classList.remove('template-view-active');
  currentViewMode = 'drawing';
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid(); drawDrawnPath(); removeCurrentInput();
  document.getElementById("left-panel").style.display='flex';
  document.getElementById("showMyPathBtn").style.display='block';
  document.getElementById("downloadPngBtn").style.display='none';
  document.getElementById("downloadPdfBtn").style.display='none';
  document.getElementById("edit-instructions").style.display='none';
  document.getElementById('drawing-example-img').style.display='block';
  document.getElementById('template-example-img').style.display='none';
  activeBranchIndex = 0;
  activeBranchLetter = branchLettersOrder[activeBranchIndex];
  if (document.getElementById("branchLetter")) {
    document.getElementById("branchLetter").value = activeBranchLetter;
  }
  const menuBtn = document.getElementById("menuBtn");
  const newPathBtn = document.getElementById("newPathBtn");
  if (menuBtn) {
    menuBtn.style.display = 'inline-block';
    const proHeaderLink = document.querySelector('.pro-header .back-link');
    if (proHeaderLink) {
         menuBtn.onclick = () => { window.location.href = proHeaderLink.href; };
    } else {
         menuBtn.onclick = () => { window.location.href = 'index.html'; };
    }
  }
  if (newPathBtn) {
    newPathBtn.style.display = 'none';
    newPathBtn.onclick = resetAndStartOver;
  }
}

function showMyPathTemplate() {
  removeCurrentInput();
  const melding = document.getElementById("meldingContainer");
  melding.innerHTML='';
  if (currentDrawnPath.length < 1) {
    melding.innerHTML = '<p style="color:red;">Teken minimaal één vakje voor de template.</p>';
    return;
  }
  const byBranch = {};
  currentDrawnPath.forEach(c=>{
    if(!byBranch[c.branchLetter]) byBranch[c.branchLetter]=[];
    byBranch[c.branchLetter].push(c);
  });
  const orderedByBranch = {};
  let invalid=false;
  Object.keys(byBranch).forEach(L=>{
    const ord = orderBranchCells(byBranch[L]);
    if (!ord) { invalid=true; melding.innerHTML += `<p style="color:red;">Tak '${L}' is niet aaneengesloten. Probeer opnieuw.</p>`; }
    orderedByBranch[L]=ord;
  });
  if (invalid) return;
  const grid = createPathTemplateGrid(orderedByBranch);
  if (!grid) { melding.innerHTML = '<p style="color:red;">Kon geen template aanmaken.</p>'; return; }
  document.body.classList.add('template-view-active');
  currentTemplateGrid = grid;
  currentViewMode = 'template-canvas';
  document.getElementById("left-panel").style.display='none';
  document.getElementById("downloadPngBtn").style.display='block';
  document.getElementById("downloadPdfBtn").style.display='block';
  document.getElementById("edit-instructions").style.display='block';
  document.getElementById('drawing-example-img').style.display='none';
  document.getElementById('template-example-img').style.display='block';
  const menuBtn = document.getElementById("menuBtn");
  const newPathBtn = document.getElementById("newPathBtn");
  if (menuBtn) menuBtn.style.display = 'none';
  if (newPathBtn) {
    newPathBtn.style.display = 'inline-block';
    newPathBtn.textContent = 'Nieuwe Rekenweg';
    newPathBtn.onclick = resetAndStartOver;
  }
  drawPathTemplateOnCanvas(currentTemplateGrid);
}

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("mainCanvas");
  ctx = canvas.getContext("2d");
  canvas.width = GRID_COLS * CELL_SIZE;
  canvas.height = GRID_ROWS * CELL_SIZE;
  startDrawingMode();

  canvas.addEventListener('mousedown',(e)=>{
    if (currentViewMode!=='drawing') return;
    isDrawing = true;
    const rect=canvas.getBoundingClientRect();
    const x=e.clientX-rect.left, y=e.clientY-rect.top;
    const col=Math.floor(x/CELL_SIZE), row=Math.floor(y/CELL_SIZE);
    addCellToPath(row,col,activeBranchLetter);
  });
  
  canvas.addEventListener('mousemove',(e)=>{
    if (!isDrawing || currentViewMode!=='drawing') return;
    const rect=canvas.getBoundingClientRect();
    const x=e.clientX-rect.left, y=e.clientY-rect.top;
    const col=Math.floor(x/CELL_SIZE), row=Math.floor(y/CELL_SIZE);
    addCellToPath(row,col,activeBranchLetter);
  });

  canvas.addEventListener('mouseup',()=>{ isDrawing=false; lastDrawnCell=null; });
  canvas.addEventListener('mouseleave',()=>{ isDrawing=false; lastDrawnCell=null; });

  canvas.addEventListener('click',(e)=>{
    if (currentViewMode==='template-canvas') {
      const rect=canvas.getBoundingClientRect();
      const x=e.clientX-rect.left, y=e.clientY-rect.top;
      const col=Math.floor(x/CELL_SIZE), row=Math.floor(y/CELL_SIZE);
      if (currentTemplateGrid && currentTemplateGrid[row] && currentTemplateGrid[row][col]) {
        const cellData = currentTemplateGrid[row][col];
        createInputForCell(cellData);
      } else {
        removeCurrentInput();
      }
    }
  });

  document.getElementById("clearPathBtn").addEventListener("click", ()=>{
    removeCurrentInput();
    currentDrawnPath=[];
    lastDrawnCell=null;
    drawDrawnPath();
  });

  document.getElementById("undoLastCellBtn").addEventListener("click", ()=>{
    if (currentDrawnPath.length>0){
      const removed=currentDrawnPath.pop();
      drawDrawnPath();
      lastDrawnCell = currentDrawnPath.length>0 ? currentDrawnPath[currentDrawnPath.length-1] : null;
      const inRemovedBranch = currentDrawnPath.filter(c=>c.branchLetter===removed.branchLetter).length;
      const rule = branchRules[removed.branchLetter];
      if (rule && inRemovedBranch < rule.count) {
        activeBranchLetter = removed.branchLetter;
        activeBranchIndex = branchLettersOrder.indexOf(activeBranchLetter);
        document.getElementById("branchLetter").value = activeBranchLetter;
      }
      if (currentDrawnPath.length<1) startDrawingMode();
    }
  });

  document.getElementById("showMyPathBtn").addEventListener("click", showMyPathTemplate);

  document.getElementById("downloadPngBtn").addEventListener("click", ()=>{
    if (currentViewMode!=='template-canvas' || !currentTemplateGrid) { alert("Er is geen template om te downloaden."); return; }
    removeCurrentInput();
    drawPathTemplateOnCanvas(currentTemplateGrid);
    const dataURL=canvas.toDataURL("image/png");
    const a=document.createElement("a");
    a.href=dataURL; a.download="rekenweg_template.png";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });

  document.getElementById("downloadPdfBtn").addEventListener("click", async ()=>{
    if (currentViewMode!=='template-canvas' || !currentTemplateGrid) { alert("Er is geen template om te downloaden."); return; }
    removeCurrentInput();
    drawPathTemplateOnCanvas(currentTemplateGrid);
    const dataURL = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const doc=new jsPDF('p','mm','a4');
    const pageWidth=doc.internal.pageSize.getWidth();
    const pageHeight=doc.internal.pageSize.getHeight();
    const imgWidth=canvas.width, imgHeight=canvas.height, ratio=imgWidth/imgHeight;
    let pdfImgWidth=pageWidth-20, pdfImgHeight=pdfImgWidth/ratio;
    if (pdfImgHeight>pageHeight-40){ pdfImgHeight=pageHeight-40; pdfImgWidth=pdfImgHeight*ratio; }
    const xPos=(pageWidth-pdfImgWidth)/2, yPos=(pageHeight-pdfImgHeight)/2;
    doc.addImage(dataURL,'PNG',xPos,yPos,pdfImgWidth,pdfImgHeight);
    doc.setFontSize(18);
    doc.text("Rekenweg Template", pageWidth/2, 20, { align:'center' });
    doc.save("rekenweg_template.pdf");
  });
}); // ← Einde DOMContentLoaded

// Zorg dat het typvakje correct blijft bij resizen/scrollen (PRO-header, body-padding, etc.)
window.addEventListener('resize', () => {
  if (editedCell && editedCell.reposition) editedCell.reposition();
});
window.addEventListener('scroll', () => {
  if (editedCell && editedCell.reposition) editedCell.reposition();
}, true);

function addCellToPath(row,col,branchLetter){
  if (row<0||row>=GRID_ROWS||col<0||col>=GRID_COLS) return;
  const newCell={row,col,branchLetter};
  const idx=currentDrawnPath.findIndex(c=>c.row===row&&c.col===col);
  if (idx>-1) return;
  if (currentDrawnPath.length>0 && lastDrawnCell){
    const prev=lastDrawnCell;
    const rd=Math.abs(newCell.row-prev.row), cd=Math.abs(newCell.col-prev.col);
    if (rd>1 || cd>1 || (rd>0 && cd>0)) return;
  }
  currentDrawnPath.push(newCell);
  drawDrawnPath();
  lastDrawnCell=newCell;
  const countInBranch=currentDrawnPath.filter(c=>c.branchLetter===activeBranchLetter).length;
  const rule=branchRules[activeBranchLetter];
  if (rule && countInBranch>=rule.count){
    if (rule.next){
      activeBranchIndex = branchLettersOrder.indexOf(rule.next);
      activeBranchLetter = branchLettersOrder[activeBranchIndex];
      document.getElementById("branchLetter").value = activeBranchLetter;
    } else {
      isDrawing=false;
    }
  }
}
