// ---- Helpers
const $ = (s) => document.querySelector(s);
const ALPHABETS = {
  std: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  fr: "ABCDEFGHIJKLMNOPQRSTUVWXYZÀÂÆÇÉÈÊËÎÏÔŒÙÛÜŸ".split(""),
};
let LETTERS = ALPHABETS.std; // Standaard
const strip = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const onlyLetters = (ch) => /[A-Z]/.test(ch);

// ---- Setup UI refs
const listEl = $("#sentencesList");
const addBtn = $("#addSentenceBtn");
const startBtn = $("#startBtn");
const clearAllBtn = $("#clearAllBtn");
const balloonInput = $("#balloonCount"); // select met 8/10/12
const alphabetSelect = $("#alphabetSelect"); // NIEUW

const game = $("#game");
const wordEl = $("#word");
const feedbackEl = $("#feedback");
const kb = $("#keyboard");
const nextInlineBtn = $("#nextInlineBtn");

const progressEl = $("#progress");
const resetBtn = $("#resetBtn");

const zisaG = $("#zisa"); // <g> container in SVG (galgje.html)

const modal = $("#modal");
const modalTitle = $("#modalTitle");
const modalText = $("#modalText");
const nextBtn = $("#nextBtn");
const closeBtn = $("#closeBtn");

// ---- State
let queue = [];
let solutionRaw = "";
let solution = "";
let guessed = new Set();
let wrong = 0;
let maxWrong = 12; // default = 12 (komt overeen met HTML-select)
let gameActive = false;

// ====== Zisa-frames (PNG's in map 'galgje_afbeeldingen')
// Frames lopen van het gekozen max aantal fouten (bv. 12) terug naar 0
const ZISA_MIN = 0;

// VASTE BOX om schokken te vermijden (alles even groot kadreren)
const ZISA_BOX_W = 600;
const ZISA_BOX_H = 800;

// Centreer box rond (0,0) van <g transform="translate(400,240)">
const ZISA_X = -ZISA_BOX_W / 2;
const ZISA_Y = -ZISA_BOX_H / 2;

let zisaImg = null;

// ====== Setup: zinnenvelden ======
function addSentenceField(value = "", index = null) {
  const i = index ?? listEl.children.length + 1;
  const row = document.createElement("div");
  row.className = "s-row";
  row.innerHTML = `
    <label>Zin ${i}:</label>
    <input type="text" value="${value.replace(/"/g, "&quot;")}" />
    <button class="del" title="Verwijderen" aria-label="Verwijderen" type="button">×</button>
  `;
  row.querySelector(".del").addEventListener("click", () => {
    row.remove();
    renumberLabels();
  });
  listEl.appendChild(row);
}
function renumberLabels() {
  [...listEl.querySelectorAll(".s-row label")].forEach(
    (lab, idx) => (lab.textContent = `Zin ${idx + 1}:`)
  );
}
function getSentencesFromFields() {
  return [...listEl.querySelectorAll("input[type='text']")]
    .map((i) => i.value.trim())
    .filter(Boolean);
}
// standaard 2 velden
addSentenceField("");
addSentenceField("");

addBtn.addEventListener("click", () => addSentenceField(""));
clearAllBtn.addEventListener("click", () => {
  listEl.innerHTML = "";
  addSentenceField("");
  addSentenceField("");
});

// ====== Zisa (PNG-frames) ======
function zisaPath(frame) {
  // GEWIJZIGD: Zorg ervoor dat het frame nooit onder 0 gaat.
  const n = Math.max(ZISA_MIN, frame);
  return `galgje_afbeeldingen/zisa_${String(n).padStart(2, "0")}.png`;
}

function setZisaFrame(frame) {
  if (!zisaImg) return;
  const p = zisaPath(frame);
  zisaImg.setAttribute("href", p);
  zisaImg.setAttributeNS("http://www.w3.org/1999/xlink", "href", p);

  // toggle fall-animatie op laatste frame (0)
  if (frame === 0) {
    zisaImg.classList.add("fall");
  } else {
    zisaImg.classList.remove("fall");
  }
}

function createZisa() {
  // Verwijder oude <image> indien aanwezig
  zisaG.querySelector("#zisaImg")?.remove();

  const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
  img.setAttribute("id", "zisaImg");

  // VASTE box → geen verschuiven tussen frames
  img.setAttribute("x", ZISA_X);
  img.setAttribute("y", ZISA_Y);
  img.setAttribute("width", ZISA_BOX_W);
  img.setAttribute("height", ZISA_BOX_H);

  // Proportioneel schalen, centreren
  img.setAttribute("preserveAspectRatio", "xMidYMid meet");

  zisaG.appendChild(img);
  zisaImg = img;
  
  // GEWIJZIGD: De start-frame wordt nu ingesteld in nextRound() via updateZisaImage()
}

function updateZisaImage() {
  if (!zisaImg) return;
  // GEWIJZIGD: De logica is nu direct gekoppeld aan het aantal fouten.
  // Als maxWrong 8 is, start de frame op 8 en telt af naar 0.
  const frame = Math.max(ZISA_MIN, maxWrong - wrong);
  setZisaFrame(frame);
}

// ====== Spel-UI ======
function buildKeyboard() {
  kb.innerHTML = "";
  LETTERS.forEach((L) => {
    const b = document.createElement("button");
    b.className = "key";
    b.type = "button";
    b.textContent = L;
    b.addEventListener("click", () => guess(L, b));
    kb.appendChild(b);
  });
}

function renderWord() {
  wordEl.innerHTML = "";

  // zin splitsen in woorden (spaties behouden voor scheiding)
  const words = solutionRaw.split(" ");

  words.forEach((word, wIndex) => {
    const wDiv = document.createElement("div");
    wDiv.className = "word-block"; // container voor één woord

    for (let i = 0; i < word.length; i++) {
      const chRaw = word[i];
      const ch = strip(chRaw.toUpperCase());
      const slot = document.createElement("div");

      if (!onlyLetters(ch)) {
        slot.className = "slot punct";
        slot.textContent = chRaw;
      } else {
        slot.className = "slot";
        slot.textContent = guessed.has(ch) ? chRaw.toUpperCase() : "";
      }
      wDiv.appendChild(slot);
    }

    wordEl.appendChild(wDiv);

    // spatie toevoegen tussen woorden (geen slot)
    if (wIndex < words.length - 1) {
      const space = document.createElement("div");
      space.className = "space-block";
      wordEl.appendChild(space);
    }
  });
}

function setProgress() {
  progressEl.textContent = `Fouten: ${wrong}/${maxWrong}`;
}

function guess(letter, btn) {
  if (!gameActive) return;
  
  // GEWIJZIGD: We strippen de letter om accenten te negeren voor de logica
  const strippedLetter = strip(letter);
  if (guessed.has(strippedLetter)) return;
  guessed.add(strippedLetter);

  if (btn) btn.classList.add("used");

  if (solution.includes(strippedLetter)) {
    renderWord();
    feedbackEl.textContent = "Goed!";
    feedbackEl.className = "status win";
    if (isSolved()) endGame(true);
  } else {
    wrong++;
    feedbackEl.textContent = "Helaas…";
    feedbackEl.className = "status lose";

    updateZisaImage();
    setProgress();

    if (wrong >= maxWrong) {
      setZisaFrame(0); // forceer eindbeeld
      endGame(false);
    }
  }
}

function isSolved() {
  for (let i = 0; i < solution.length; i++) {
    const ch = solution[i];
    if (onlyLetters(ch) && !guessed.has(ch)) return false;
  }
  return true;
}

function nextRound() {
  feedbackEl.textContent = "";
  guessed.clear();
  wrong = 0;

  // Enkel 8/10/12 uit de select (12 is default)
  maxWrong = parseInt(balloonInput.value, 10) || 12;
  setProgress();

  buildKeyboard();
  createZisa();
  
  // GEWIJZIGD: Zet de initiële afbeelding op basis van maxWrong
  updateZisaImage(); 
  
  nextInlineBtn.classList.add("hidden");

  if (queue.length === 0) {
    wordEl.textContent = "Klaar!";
    gameActive = false;
    return;
  }
  solutionRaw = queue.shift().trim();
  solution = strip(solutionRaw.toUpperCase());
  renderWord();
  gameActive = true;
}

function startGame() {
  modal.style.display = "none";
  wrong = 0;
  guessed.clear();
  gameActive = false;

  // NIEUW: Stel het gekozen alfabet in
  LETTERS = ALPHABETS[alphabetSelect.value] || ALPHABETS.std;

  const lines = getSentencesFromFields();
  if (lines.length === 0) {
    alert("Vul minstens één zin in.");
    return;
  }
  queue = [...lines];

  document.querySelector(".setup").style.display = "none";
  game.style.display = "block";
  nextRound();
}

function endGame(won) {
  gameActive = false;
  modalTitle.textContent = won ? "🎉 Goed gedaan!" : "😅 Volgende keer beter!";
  modalText.textContent = `De zin was: “${solutionRaw}”`;
  modal.style.display = "grid";

  if (queue.length > 0) nextInlineBtn.classList.remove("hidden");
  else nextInlineBtn.classList.add("hidden");

  setTimeout(() => {
    const b = document.getElementById("nextBtn");
    b && b.focus();
  }, 0);
}

// ---- Events
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", () => location.reload());

nextBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  modal.style.display = "none";
  nextRound();
});
closeBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  modal.style.display = "none";
});
nextInlineBtn.addEventListener("click", () => {
  modal.style.display = "none";
  nextRound();
});

// Toetsenbord via fysieke toets
window.addEventListener("keydown", (e) => {
  if (!gameActive || modal.style.display === "grid") return;
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
  if (tag === "input" || tag === "textarea" || tag === "button") return;
  
  const L = e.key.toUpperCase();
  const strippedL = strip(L);

  // GEWIJZIGD: Check of de (gestripte) letter in het alfabet voorkomt.
  // Dit zorgt ervoor dat ook Franse tekens via het toetsenbord werken.
  if (LETTERS.map(strip).includes(strippedL)) {
      // Zoek de knop die overeenkomt met de ingedrukte toets
      const btn = [...kb.querySelectorAll(".key")].find(
        (b) => strip(b.textContent) === strippedL && !b.classList.contains("used")
      );
      // We gebruiken de originele letter (L) voor de guess-functie,
      // zodat de juiste knop (met accent) de 'used' class krijgt.
      if (btn) {
        guess(btn.textContent, btn);
      }
  }
});