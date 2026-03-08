const STOCK_SIZE = 4; // visible sticky notes as the "stack"
const LOCAL_KEY = 'sticky_notes_real_v2';

// Utilities
function loadNotes() {
  return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
}
function saveNotes(notes) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(notes));
}
function createNote(text = "") {
  return {
    id: Date.now().toString() + Math.floor(Math.random() * 10000),
    text,
    onWall: false,
    wallPos: { x: 130, y: 60 }
  };
}

// Desktop sticky notes state
let notes = loadNotes();

// DOM Elements
const stickyStock = document.getElementById('stickyStock');
const deskNotes = document.getElementById('deskNotes');
const laptop = document.getElementById('laptop');
const laptopScreen = document.getElementById('laptopScreen');
const clockDiv = document.getElementById('clock');

// ---- Sticky Notes Stock Logic ---- //
function rebuildStockStack() {
  // Show up to STOCK_SIZE stuck notes in a stack
  stickyStock.innerHTML = '';
  for (let i = 0; i < STOCK_SIZE; i++) {
    const stackDiv = document.createElement('div');
    stackDiv.className = "stock-sticky";
    stackDiv.title = "Pull sticky note to desk";
    // TODO: Optionally show a number
    stackDiv.style.zIndex = (STOCK_SIZE - i).toString();

    stackDiv.addEventListener('click', () => {
      // Add new note to desk
      notes.push(createNote(""));
      saveNotes(notes);
      renderNotesOnDesk();
    });
    stickyStock.appendChild(stackDiv);
  }
}

// Render all desktop notes (not on wall)
function renderNotesOnDesk() {
  deskNotes.innerHTML = '';
  notes.filter(n => !n.onWall).forEach(note => {
    const div = document.createElement('div');
    div.className = "sticky-note";
    div.tabIndex = 0;

    const spanText = document.createElement('span');
    spanText.textContent = note.text ? note.text : "(click to write)";
    if (!note.text) spanText.style.opacity = "0.4";

    div.appendChild(spanText);

    let editing = false;
    div.addEventListener('click', () => {
      if (editing) return;
      editing = true;
      div.classList.add('editing');
      spanText.style.display = "none";
      const textarea = document.createElement('textarea');
      textarea.value = note.text;
      textarea.placeholder = "Type your to-do...";
      textarea.maxLength = 140;
      textarea.rows = 4;
      div.appendChild(textarea);
      textarea.focus();

      function saveEdit() {
        note.text = textarea.value.trim();
        saveNotes(notes);
        renderNotesOnDesk();
      }
      textarea.addEventListener('blur', saveEdit);
      textarea.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter' && !ev.shiftKey) {
          textarea.blur();
        }
      });
    });

    // Peel button moves to wall (not full implementation, but example UX)
    const peel = document.createElement('span');
    peel.className = "sticky-peel";
    peel.title = "Peel and stick to wall";
    peel.textContent = '⤴';
    peel.addEventListener('click', function(e) {
      e.stopPropagation();
      note.onWall = true;
      note.wallPos = randomWallPos();
      saveNotes(notes);
      renderNotesOnDesk();
      renderWallNotes();
    });
    div.appendChild(peel);

    deskNotes.appendChild(div);
  });
  renderWallNotes();
}

// Wall Notes (realistic feature — could render like notes on the wall with a slight rotate)
function renderWallNotes() {
  // We'll just clear any previous wall notes
  let prevWall = document.getElementById("wallNotesGroup");
  if (prevWall) prevWall.remove();

  const wallNotesGroup = document.createElement("div");
  wallNotesGroup.id = "wallNotesGroup";
  wallNotesGroup.style.position = "fixed";
  wallNotesGroup.style.top = "7vh";
  wallNotesGroup.style.left = "0px";
  wallNotesGroup.style.width = "100vw";
  wallNotesGroup.style.zIndex = "5";
  wallNotesGroup.style.pointerEvents = "none";
  document.body.appendChild(wallNotesGroup);

  notes.filter(n=>n.onWall).forEach(note => {
    const div = document.createElement('div');
    div.className = "sticky-note";
    div.style.position = "absolute";
    div.style.left = `${note.wallPos.x}px`;
    div.style.top = `${note.wallPos.y}px`;
    div.style.transform = `rotate(${Math.random()*8-4}deg) scale(1.05)`;
    div.style.pointerEvents = "auto";
    div.style.zIndex = 6;
    div.textContent = note.text;
    div.title = 'Click to put back on desk';

    // Clicking puts back on desk
    div.addEventListener('click', function() {
      note.onWall = false;
      saveNotes(notes);
      renderWallNotes();
      renderNotesOnDesk();
    });
    wallNotesGroup.appendChild(div);
  });
}

// Helper for random position on wall
function randomWallPos() {
  const minX = 25;
  const maxX = window.innerWidth - 120;
  const minY = 48;
  const maxY = Math.max(98, window.innerHeight * .26);
  const x = Math.round(Math.random()*(maxX-minX) + minX);
  const y = Math.round(Math.random()*(maxY-minY) + minY);
  return {x, y};
}

// ---- LAPTOP OPEN/CLOSE + CLOCK ---- //

laptop.addEventListener('click', function() {
  if (laptop.classList.contains('closed')) {
    laptop.classList.remove('closed');
    laptop.classList.add('open');
    setTimeout(()=>laptopScreen.style.opacity = 1, 180);
  } else {
    laptop.classList.remove('open');
    laptop.classList.add('closed');
    laptopScreen.style.opacity = 0;
  }
});

// Real world clock — show on open
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2,"0");
  const m = String(now.getMinutes()).padStart(2,"0");
  const s = String(now.getSeconds()).padStart(2,"0");
  clockDiv.textContent = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// ---- UI Initialization ---- //
if (!notes.length) {
  notes.push(createNote());
  saveNotes(notes);
}
rebuildStockStack();
renderNotesOnDesk();
renderWallNotes();

window.addEventListener('resize', renderWallNotes);
