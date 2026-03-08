// --- Sticky Note Colors (like your stack images) ---
const STICKY_COLORS = [
  {bg:'#fff768', border:'#e1d800', wall:'#fff768'}, // yellow
  {bg:'#8df39e', border:'#3cab5f', wall:'#c4ffd1'}, // green
  {bg:'#ffb56a', border:'#e17f1b', wall:'#ffe19d'}, // orange
  {bg:'#ff92bc', border:'#dd3980', wall:'#ffd5f7'}, // pink
  {bg:'#91c7fd', border:'#3676cc', wall:'#deebff'}, // blue
];

// --- Pin Colors (like your pushed wall notes) ---
const PIN_COLORS = ['#e03131','#21af56','#3096fa','#f7931e','#864eab','#e85392'];
function randomPinColor() { return PIN_COLORS[Math.floor(Math.random()*PIN_COLORS.length)]; }

// -- Local-storage note model
const STORAGE_KEY = 'my_photodesk_notes_v1';
function loadNotes() { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); }
function saveNotes(notes) { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); }
function createNote(colorIdx) {
  return {
    id: `${Date.now()}${Math.floor(10000*Math.random())}`,
    color: colorIdx,
    text: "",
    onWall: false,
    wallPos: {x: 60+Math.random()*700, y: 25+Math.random()*150}
  };
}

// --- Initialize ---
let notes = loadNotes();
const stickyStack = document.getElementById('stickyStack');
const deskNotes = document.getElementById('deskNotes');
const wallNotes = document.getElementById('wallNotes');
const laptop = document.getElementById('laptop');
const screen = document.getElementById('screen');
const clockTime = document.getElementById('clockTime');
const clockDate = document.getElementById('clockDate');

// ---- Sticky Stack (physical pad, random order) ----
function renderStickyStack() {
  stickyStack.innerHTML = '';
  // Show the pad as a visible stack, top 5 notes w/ 3D offset, random order
  let stackOrder = [];
  // If no notes remaining to be created, show just pad:
  let deskStickyCount = notes.filter(n=>!n.onWall).length;
  let pads = Math.max(3, 5-deskStickyCount);
  for(let i=0; i< pads; i++) stackOrder.push(i%STICKY_COLORS.length);
  if (deskStickyCount<5) {
    for(let i=0;i<5-deskStickyCount;i++) {
      const colorIdx = stackOrder[i%stackOrder.length];
      const div = document.createElement('div');
      div.className = 'stack-note stack-note-'+i;
      div.style.background = STICKY_COLORS[colorIdx].bg;
      div.style.borderColor = STICKY_COLORS[colorIdx].border;
      div.title = "Pull sticky note to desk";
      // Slight z offset and random min-tilt
      div.style.left = '0px';
      div.style.top = (i*3)+'px';
      div.addEventListener('click', function(e) {
        notes.push(createNote(colorIdx));
        saveNotes(notes);
        renderStickyStack();
        renderDeskNotes();
      });
      stickyStack.appendChild(div);
    }
  }
}
renderStickyStack();

// ---- Desk Notes -----
function renderDeskNotes() {
  deskNotes.innerHTML = '';
  notes.filter(n=>!n.onWall).forEach(note=>{
    const div=document.createElement('div');
    div.className="desk-note";
    div.style.background = STICKY_COLORS[note.color].bg;
    div.style.borderColor= STICKY_COLORS[note.color].border;

    const spanText = document.createElement('span');
    spanText.textContent = note.text? note.text: "Click to write...";
    if(!note.text) spanText.style.opacity=".52";
    div.appendChild(spanText);

    let editing = false;
    div.addEventListener('click', function(e){
      if(editing) return;
      editing=true;
      div.classList.add('editing');
      spanText.style.display="none";
      const textarea=document.createElement('textarea');
      textarea.value = note.text;
      textarea.placeholder="Write your note...";
      textarea.maxLength=180;
      div.appendChild(textarea);
      textarea.focus();

      textarea.addEventListener('blur', function() {
        note.text= textarea.value.trim(); saveNotes(notes); renderDeskNotes();
      });
      textarea.addEventListener('keydown', function(e) {
        if(e.key==="Enter" && !e.shiftKey) textarea.blur();
      });
    });

    // Peel button (put to wall)
    const peel=document.createElement('button');
    peel.className="peel-btn";
    peel.title="Peel and pin on wall";
    peel.innerHTML="⤴️";
    peel.addEventListener('click',function(e){
      e.stopPropagation();
      note.onWall=true;
      note.wallPos = { x: Math.random()*window.innerWidth*0.75+21, y: Math.random()*window.innerHeight*0.36+21 };
      saveNotes(notes); renderDeskNotes(); renderWallNotes(); renderStickyStack();
    });
    div.appendChild(peel);

    deskNotes.appendChild(div);
  });
  renderStickyStack();
}
renderDeskNotes();

// ---- Wall Notes -----
function renderWallNotes() {
  wallNotes.innerHTML='';
  notes.filter(n=>n.onWall).forEach(note=>{
    const div = document.createElement('div');
    div.className="wall-note";
    div.style.background = STICKY_COLORS[note.color].wall;
    div.style.borderColor= STICKY_COLORS[note.color].border;
    div.style.left = note.wallPos.x+"px";
    div.style.top = note.wallPos.y+"px";
    // Give each a little random tilt every render
    div.style.transform = `rotate(${(note.id.charCodeAt(0)%17-8)}deg) scale(.98)`;
    div.textContent= note.text;
    // Pin element
    const pin=document.createElement('span');
    pin.className="pin";
    pin.innerHTML=pinSVG(randomPinColor());
    div.appendChild(pin);
    // Drag
    let offset={x:0,y:0}, dragging=false;
    div.addEventListener('mousedown',function(e){
      dragging=true;
      offset.x= e.offsetX; offset.y= e.offsetY;
      wallNotes.style.pointerEvents = "auto";
    });
    window.addEventListener('mousemove',function(e){
      if(!dragging) return;
      note.wallPos.x=Math.min(window.innerWidth-120, Math.max(0,e.pageX-offset.x));
      note.wallPos.y=Math.min(window.innerHeight*0.54, Math.max(0,e.pageY-offset.y));
      div.style.left = note.wallPos.x+'px';
      div.style.top = note.wallPos.y+'px';
    });
    window.addEventListener('mouseup',function(e){
      if (!dragging) return;
      dragging=false;
      wallNotes.style.pointerEvents = "none";
      saveNotes(notes);
    });
    // Remove from wall (double click)
    div.title="Double click to return note to desk";
    div.addEventListener('dblclick', function(e){
      note.onWall=false; saveNotes(notes);
      renderDeskNotes(); renderWallNotes();
      renderStickyStack();
    });
    wallNotes.appendChild(div);
  });
}
renderWallNotes();

// SVG pin for realism
function pinSVG(color) {
  return `<svg width="15" height="16">
    <circle cx="7.5" cy="6" r="5.2" fill="${color}" stroke="#faf9fa" stroke-width="1"/>
    <rect x="6.3" y="11" width="2.5" height="4" rx="1" fill="#c9c8c7"/>
    <ellipse cx="7.7" cy="5" rx="2" ry="1.1" fill="#fff" opacity=".37"/>
  </svg>`;
}

// ---- Laptop open / close ----
laptop.addEventListener('click', function(e){
  if (laptop.classList.contains('closed')) {
    laptop.classList.remove('closed');
    laptop.classList.add('open');
    setTimeout(()=>screen.style.opacity=1,160);
  } else {
    laptop.classList.remove('open');
    laptop.classList.add('closed');
    screen.style.opacity=0;
  }
});

// --- Clock/Date ---
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const s = String(now.getSeconds()).padStart(2,'0');
  // Date in nice style
  const dateStr = now.toLocaleDateString(undefined, { weekday:'short', year:'numeric', month:'short', day:'numeric' });
  clockTime.textContent=`${h}:${m}:${s}`;
  clockDate.textContent=dateStr;
}
setInterval(updateClock, 1000);
updateClock();

// --- Responsive "Wall" on resize: keeps wall-note constraint ---
window.addEventListener('resize', function(){
  notes.filter(n=>n.onWall).forEach(note=>{
    note.wallPos.x=Math.min(note.wallPos.x, window.innerWidth-118);
    note.wallPos.y=Math.min(note.wallPos.y, window.innerHeight*0.55);
  });
  saveNotes(notes); renderWallNotes();
});

// ---- Ensure always have the stack or one note to use
if (!notes.length) {
  notes.push(createNote(0));
  saveNotes(notes);
  renderStickyStack();
  renderDeskNotes();
}
