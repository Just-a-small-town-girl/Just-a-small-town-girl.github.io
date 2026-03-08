// Notes are stored here
const STORAGE_KEY = 'realpic_desk_notes_v1';
function loadNotes() {return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');}
function saveNotes(n){localStorage.setItem(STORAGE_KEY,JSON.stringify(n));}
let notes = loadNotes();

// DOM
const laptopClosed = document.getElementById('laptopClosed');
const laptopOpen = document.getElementById('laptopOpen');
const pullNoteBtn = document.getElementById('pullNoteBtn');
const noteEditor = document.getElementById('noteEditor');
const editorInput = document.getElementById('editorInput');
const stickBtn = document.getElementById('stickBtn');
const cancelBtn = document.getElementById('cancelBtn');
const wallNotes = document.getElementById('wallNotes');

// Laptop open/close behavior
laptopClosed.addEventListener('click', ()=>{
  laptopClosed.classList.add('inactive');
  laptopOpen.classList.add('active');
});
laptopOpen.addEventListener('click', ()=>{
  laptopOpen.classList.remove('active');
  laptopClosed.classList.remove('inactive');
});

// Sticky stack: only one editor at a time
let editing = false;
pullNoteBtn.addEventListener('click', ()=>{
  if(editing) return;
  editing=true;
  noteEditor.classList.add('active');
  editorInput.value = '';
  editorInput.focus();
});

// Editor actions
stickBtn.addEventListener('click', ()=>{
  let text = editorInput.value.trim();
  if (text) {
    let color = 'yellow'; // Always yellow for now. Easy to expand!
    let note = {
      id: String(Date.now())+Math.random().toString().slice(2, 4),
      text,
      color,
      x: 170+Math.random()*500,
      y: 38+Math.random()*100
    };
    notes.push(note);
    saveNotes(notes);
    renderWallNotes();
    editing=false;
    noteEditor.classList.remove('active');
    editorInput.value='';
  }
});
cancelBtn.addEventListener('click', ()=>{
  editing=false;
  noteEditor.classList.remove('active');
  editorInput.value='';
});

// Wall notes rendering
function renderWallNotes() {
  wallNotes.innerHTML = '';
  notes.forEach(note=>{
    const ndiv=document.createElement('div');
    ndiv.className="wall-note";
    if (note.color === 'yellow') {
      ndiv.style.backgroundImage = "url('images/sticky-yellow.png')";
    }
    // future: else if (note.color)...
    ndiv.textContent = note.text;
    ndiv.style.left=note.x+'px';
    ndiv.style.top=note.y+'px';
    // Remove btn
    const remBtn=document.createElement('button');
    remBtn.className='remove-btn';
    remBtn.textContent='Remove';
    remBtn.onclick=function(e){
      e.stopPropagation();
      notes=notes.filter(n=>n.id!==note.id);
      saveNotes(notes); renderWallNotes();
    };
    ndiv.appendChild(remBtn);
    // Drag logic
    let dragging=false, offs={x:0,y:0};
    ndiv.addEventListener('mousedown',function(e){
      dragging=true;
      offs.x=e.offsetX; offs.y=e.offsetY;
      ndiv.style.transition='none';
    });
    window.addEventListener('mousemove',function(e){
      if(!dragging)return;
      note.x = Math.max(0, Math.min(e.pageX-offs.x, window.innerWidth-120));
      note.y = Math.max(0, Math.min(e.pageY-offs.y, window.innerHeight*0.54));
      ndiv.style.left=note.x+'px'; ndiv.style.top=note.y+'px';
    });
    window.addEventListener('mouseup',function(){
      if(!dragging) return;
      dragging=false;
      saveNotes(notes);
      renderWallNotes();
    });
    wallNotes.appendChild(ndiv);
  });
}
renderWallNotes();

window.addEventListener('resize', renderWallNotes);
