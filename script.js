// -- Sticky Note Storage Key
const STORAGE_KEY = 'my_stickynotes_v1';

// -- Helper to load or setup notes
function loadNotes() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}
// -- Helper to assign id
function createNote(text = "", onWall = false, wallPos = {x: 150, y: 60}) {
  return {
    id: Date.now().toString() + Math.floor(Math.random()*10000),
    text,
    onWall,
    wallPos
  };
}

// -- Elements
const laptop = document.getElementById('laptop');
const stickies = document.getElementById('stickies');
const stickyWall = document.getElementById('sticky-wall');
const addStickyBtn = document.getElementById('addStickyBtn');

// --- Laptop Lid Animation
laptop.addEventListener('click', function() {
  if (laptop.classList.contains('closed')) {
    laptop.classList.add('open'); 
    laptop.classList.remove('closed');
  } else {
    laptop.classList.add('closed');
    laptop.classList.remove('open');
  }
});

// ---- Sticky Notes
let notes = loadNotes();
renderAll();

function renderAll() {
  stickies.innerHTML = '';
  stickyWall.innerHTML = '';
  renderTableNotes();
  renderWallNotes();
}
function renderTableNotes() {
  notes.filter(n=>!n.onWall).forEach(note => {
    const div = document.createElement('div');
    div.classList.add('sticky-note');
    div.setAttribute('draggable', false);
    div.dataset.id = note.id;

    let editing = false;

    const spanText = document.createElement('span');
    spanText.textContent = note.text ? note.text : "(click to write)";
    if (!note.text) spanText.style.opacity = ".45";
    div.appendChild(spanText);

    // Edit button (full area click triggers edit)
    div.addEventListener('click', function(e) {
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
        renderAll();
      }
      textarea.addEventListener('blur', saveEdit);
      textarea.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter' && !ev.shiftKey) {
          div.focus();
          textarea.blur(); // Save!
        }
      });
    });
    // Peel button
    const peel = document.createElement('span');
    peel.className = 'sticky-peel';
    peel.title = 'Peel and stick on wall';
    peel.textContent = "⤴";
    peel.addEventListener('click', function(e) {
      e.stopPropagation();
      div.classList.add('peeling');
      // move to wall, pick a position
      note.onWall = true;
      // Place randomly, but do not overlap
      note.wallPos = randomWallPos();
      saveNotes(notes);
      renderAll();
    });
    div.appendChild(peel);

    stickies.appendChild(div);
  });
}
function renderWallNotes() {
  // Allow user to move wall notes to random location
  notes.filter(n=>n.onWall).forEach(note => {
    const div = document.createElement('div');
    div.className = 'sticky-on-wall';
    div.textContent = note.text;
    div.style.left = note.wallPos.x + 'px';
    div.style.top = note.wallPos.y + 'px';
    // On click, remove from wall (put back to desk)
    div.title = "Click to return to desk";
    div.addEventListener('click', function() {
      note.onWall = false;
      saveNotes(notes);
      renderAll();
    });
    // Allow dragging
    let offset = {x:0, y:0}, dragging = false;
    div.addEventListener('mousedown', function(e) {
      dragging = true;
      offset.x = e.offsetX;
      offset.y = e.offsetY;
      document.body.style.userSelect = "none";
    });
    window.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      note.wallPos.x = Math.max(5, e.pageX - offset.x);
      note.wallPos.y = Math.max(60, e.pageY - offset.y);
      div.style.left = note.wallPos.x + 'px';
      div.style.top = note.wallPos.y + 'px';
    });
    window.addEventListener('mouseup', function(e){
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = "";
      saveNotes(notes);
    });
    stickyWall.appendChild(div);
  });
}

addStickyBtn.addEventListener('click', function() {
  notes.push(createNote());
  saveNotes(notes);
  renderAll();
});

// If no notes, make a default
if (notes.length === 0) {
  notes.push(createNote("", false));
  saveNotes(notes);
  renderAll();
}

// -- Place wall notes in random positions
function randomWallPos() {
  // Try to distribute on the wall nicely
  const x = 32 + Math.floor(Math.random() * (window.innerWidth - 170));
  const y = 83 + Math.floor(Math.random() * 90);
  return {x, y};
}
