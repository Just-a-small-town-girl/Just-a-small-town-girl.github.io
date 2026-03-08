// ---- Pomodoro ----
let pomTime = 25 * 60, pomInterval = null, pomActive = false;
const pomStartBtn = document.getElementById('pomStart');
const pomPauseBtn = document.getElementById('pomPause');
const pomResetBtn = document.getElementById('pomReset');
const pomMinutes = document.getElementById('pomMinutes');
const pomSeconds = document.getElementById('pomSeconds');
const ringSound = document.getElementById('ringSound');
function updatePomodoro() {
  let min = Math.floor(pomTime/60);
  let sec = pomTime%60;
  pomMinutes.textContent = String(min).padStart(2,'0');
  pomSeconds.textContent = String(sec).padStart(2,'0');
}
function tickPomodoro() {
  if(pomActive && pomTime>0) { pomTime--; updatePomodoro();}
  if(pomTime<=0) {
    pomActive=false; clearInterval(pomInterval); pomInterval=null; updatePomodoro();
    ringSound.play(); setTimeout(()=>{pomTime=25*60;updatePomodoro();},1200);
  }
}
pomStartBtn.onclick = ()=>{ if(!pomActive){pomActive=true;pomInterval=setInterval(tickPomodoro,1000);} };
pomPauseBtn.onclick = ()=>{pomActive=false;clearInterval(pomInterval);pomInterval=null;};
pomResetBtn.onclick = ()=>{pomActive=false;clearInterval(pomInterval);pomInterval=null;pomTime=25*60;updatePomodoro();};
updatePomodoro();

// ---- Laptop open/close with scale ----
const laptopClosed = document.getElementById('laptopClosed');
const laptopOpen = document.getElementById('laptopOpen');
const laptopWrap = document.getElementById('laptopWrap');
const pomodoroWrap = document.getElementById('pomodoroWrap');

laptopClosed.addEventListener('click', ()=>{
  laptopClosed.classList.add('inactive');
  laptopOpen.classList.add('active');
  laptopWrap.classList.add('zoomed');
});
laptopOpen.addEventListener('click', (e)=>{
  if(e.target!==laptopOpen) return;
  laptopClosed.classList.remove('inactive');
  laptopOpen.classList.remove('active');
  laptopWrap.classList.remove('zoomed');
});

// ---- Journal ----
const openJournalBtn = document.getElementById('openJournalBtn');
const journalOverlay = document.getElementById('journalOverlay');
const closeJournal = document.getElementById('closeJournal');
const journalTitle = document.getElementById('journalTitle');
const journalText = document.getElementById('journalText');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const pageNum = document.getElementById('pageNum');
const JOURNAL_KEY = "my_cozy_journal_pages";
let journalPages = JSON.parse(localStorage.getItem(JOURNAL_KEY)||"[]");
if (!journalPages.length) journalPages.push({title:"",text:""});
let currentPage = 0;

function saveJournal() {
  journalPages[currentPage] = {title:journalTitle.value,text:journalText.value};
  localStorage.setItem(JOURNAL_KEY,JSON.stringify(journalPages));
}
function showPage(idx) {
  saveJournal();
  if (idx<0||idx>=journalPages.length) return;
  currentPage=idx;
  journalTitle.value = journalPages[currentPage].title;
  journalText.value = journalPages[currentPage].text;
  pageNum.textContent = `Page ${currentPage+1} / ${journalPages.length}`;
}
journalTitle.onblur = journalText.onblur = saveJournal;
prevPage.onclick = ()=> {
  showPage(currentPage-1>=0?currentPage-1:0);
};
nextPage.onclick = ()=> {
  saveJournal();
  if (currentPage === journalPages.length-1) {
    journalPages.push({title:"",text:""});
    localStorage.setItem(JOURNAL_KEY,JSON.stringify(journalPages));
  }
  showPage(currentPage+1);
};
openJournalBtn.onclick = ()=>{
  showPage(currentPage);
  journalOverlay.classList.add('active');
  setTimeout(()=>journalTitle.focus(),190);
};
closeJournal.onclick = ()=>{
  saveJournal(); journalOverlay.classList.remove('active');
};
showPage(currentPage);

// ---- Note logic (unchanged from previous, summarized for brevity) ----

const pullNoteBtn = document.getElementById('pullNoteBtn');
const noteEditor = document.getElementById('noteEditor');
const editorInput = document.getElementById('editorInput');
const stickBtn = document.getElementById('stickBtn');
const cancelBtn = document.getElementById('cancelBtn');
const wallNotes = document.getElementById('wallNotes');
const NOTES_KEY = 'realpic_desk_notes_v2';
function loadNotes() {return JSON.parse(localStorage.getItem(NOTES_KEY)||'[]');}
function saveNotes(n){localStorage.setItem(NOTES_KEY,JSON.stringify(n));}
let notes = loadNotes();
let editing = false;
pullNoteBtn.addEventListener('click', ()=>{
  if(editing) return;
  editing=true;
  noteEditor.classList.add('active');
  editorInput.value = '';
  editorInput.focus();
});

stickBtn.addEventListener('click', ()=>{
  let text = editorInput.value.trim();
  if (text) {
    let note = {
      id: String(Date.now())+Math.random().toString().slice(2, 4),
      text,
      x: 170+Math.random()*420,
      y: 48+Math.random()*110
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

function renderWallNotes() {
  wallNotes.innerHTML = '';
  notes.forEach(note=>{
    const ndiv=document.createElement('div');
    ndiv.className="wall-note";
    ndiv.textContent = note.text;
    ndiv.style.left=note.x+'px';
    ndiv.style.top=note.y+'px';
    const remBtn=document.createElement('button');
    remBtn.className='remove-btn';
    remBtn.textContent='Remove';
    remBtn.onclick=function(e){
      e.stopPropagation();
      notes=notes.filter(n=>n.id!==note.id);
      saveNotes(notes); renderWallNotes();
    };
    ndiv.appendChild(remBtn);
    let dragging=false, offs={x:0,y:0};
    ndiv.addEventListener('mousedown',function(e){
      dragging=true;
      offs.x=e.offsetX; offs.y=e.offsetY;
      ndiv.style.transition='none';
    });
    window.addEventListener('mousemove',function(e){
      if(!dragging)return;
      note.x = Math.max(0, Math.min(e.pageX-offs.x, window.innerWidth-110));
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
