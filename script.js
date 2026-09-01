const board = document.getElementById('board');
const canvas = document.getElementById('doodleCanvas');
const ctx = canvas.getContext('2d');
const quickInput = document.getElementById('quickInput');
const colorPicker = document.getElementById('colorPicker');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toastText');
const noteSearch = document.getElementById('noteSearch');
const searchResults = document.getElementById('searchResults');
const colors = ['yellow','blue','pink','green','orange','cream'];
let colorIndex = 0, activeTool = 'select', drawing = false;
let selectedForGroup = new Set();
let groupNumber = 0;

const groupComposer = document.getElementById('groupComposer');
const groupSelectionCount = document.getElementById('groupSelectionCount');
const groupNameInput = document.getElementById('groupNameInput');

function updateGroupSelection(){
  groupSelectionCount.textContent = selectedForGroup.size ? `${selectedForGroup.size} selected` : 'Choose 2+ notes';
  document.getElementById('createGroupBtn').disabled = selectedForGroup.size < 2;
}

function toggleNoteForGroup(note){
  if(note.dataset.group){ showToast('That note already belongs to a group.'); return; }
  if(selectedForGroup.has(note)){
    selectedForGroup.delete(note);
    note.classList.remove('group-selected');
  }else{
    selectedForGroup.add(note);
    note.classList.add('group-selected');
  }
  updateGroupSelection();
}

function createGroup(){
  const notes = [...selectedForGroup];
  if(notes.length < 2){ showToast('Pick at least two notes first.'); return; }
  const name = groupNameInput.value.trim() || `Idea group ${++groupNumber}`;
  const groupId = `group-${Date.now()}`;
  const existingBottom = [...document.querySelectorAll('.idea-group')].reduce((max, group) => Math.max(max, group.offsetTop + group.offsetHeight), 0);
  const top = Math.max(70, existingBottom ? existingBottom + 80 : Math.min(...notes.map(note => note.offsetTop)));
  const columns = Math.min(3, notes.length);
  const width = Math.min(board.clientWidth - 70, columns * 235 + 45);
  const rows = Math.ceil(notes.length / columns);
  const height = rows * 220 + 55;
  const group = document.createElement('section');
  group.className = 'idea-group';
  group.dataset.groupId = groupId;
  group.style.left = '25px'; group.style.top = `${top}px`; group.style.width = `${width}px`; group.style.height = `${height}px`;
  group.innerHTML = `<div class="group-heading"><span>✦</span><input aria-label="Group name" value="${name.replace(/["<>&]/g,'')}"><small class="group-count">${notes.length} NOTES</small></div>`;
  board.insertBefore(group, board.querySelector('.note'));
  notes.forEach((note, index) => {
    note.dataset.group = groupId;
    note.style.left = `${50 + (index % columns) * 230}px`;
    note.style.top = `${top + 35 + Math.floor(index / columns) * 215}px`;
    note.style.setProperty('--r', `${(index % 2 ? 1.4 : -1.4)}deg`);
    note.classList.remove('group-selected');
  });
  selectedForGroup.clear(); groupNameInput.value = ''; updateGroupSelection();
  expandBoard(top + height + 150);
  showToast(`“${name}” grouped together.`);
}

function expandBoard(minimumBottom = 0){
  const notes = [...document.querySelectorAll('.note')];
  const lowestNote = notes.reduce((lowest, note) => Math.max(lowest, note.offsetTop + note.offsetHeight), 0);
  const neededHeight = Math.max(window.innerHeight - 70, lowestNote + 180, minimumBottom);
  board.style.height = `${neededHeight}px`;
  document.querySelector('main').style.height = `${neededHeight}px`;
  document.body.style.minHeight = `${neededHeight + 70}px`;
}

function resizeCanvas(){ canvas.width = board.clientWidth * devicePixelRatio; canvas.height = board.clientHeight * devicePixelRatio; ctx.scale(devicePixelRatio,devicePixelRatio); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#32312b'; ctx.lineWidth=2.3; }
resizeCanvas(); window.addEventListener('resize',resizeCanvas);

function showToast(message){ toastText.textContent=message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove('show'),2200); }

function noteSearchText(note){
  const group = note.dataset.group ? document.querySelector(`[data-group-id="${note.dataset.group}"] .group-heading input`) : null;
  return `${note.querySelector('.note-name')?.value || ''} ${note.querySelector('.note-tag')?.textContent || ''} ${note.querySelector('textarea')?.value || ''} ${group?.value || ''}`.trim();
}

function openSearchResult(note){
  searchResults.classList.remove('show');
  noteSearch.blur();
  note.scrollIntoView({behavior:'smooth', block:'center'});
  note.classList.remove('search-focus');
  requestAnimationFrame(()=>note.classList.add('search-focus'));
  setTimeout(()=>note.classList.remove('search-focus'),1500);
}

function renderSearchResults(){
  const query = noteSearch.value.trim().toLowerCase();
  if(!query){ searchResults.classList.remove('show'); searchResults.innerHTML=''; return; }
  const matches = [...document.querySelectorAll('.note')].filter(note=>noteSearchText(note).toLowerCase().includes(query));
  searchResults.innerHTML='';
  if(!matches.length){ searchResults.innerHTML='<div class="search-empty">No ideas found yet.</div>'; }
  matches.slice(0,20).forEach(note=>{
    const button=document.createElement('button');
    const title=note.querySelector('.note-name')?.value.trim() || 'Untitled note';
    const text=note.querySelector('textarea')?.value.trim() || '';
    const group=note.dataset.group ? document.querySelector(`[data-group-id="${note.dataset.group}"] .group-heading input`)?.value : '';
    const safeGroup=(group || '').replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
    const safeSnippet=text.slice(0,42).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
    button.className='search-result'; button.type='button'; button.setAttribute('role','option');
    button.innerHTML=`<strong>${title.replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</strong><small>${group ? `GROUP · ${safeGroup}` : safeSnippet || note.querySelector('.note-tag')?.textContent || 'NOTE'}</small>`;
    button.addEventListener('click',()=>openSearchResult(note));
    searchResults.appendChild(button);
  });
  searchResults.classList.add('show');
}

noteSearch.addEventListener('input',renderSearchResults);
noteSearch.addEventListener('focus',()=>{ if(noteSearch.value.trim()) renderSearchResults(); });
noteSearch.addEventListener('keydown',e=>{
  if(e.key==='Enter') searchResults.querySelector('.search-result')?.click();
  if(e.key==='Escape'){ noteSearch.value=''; searchResults.classList.remove('show'); noteSearch.blur(); }
});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.note-search')) searchResults.classList.remove('show')});

function enableDrag(note){
  note.addEventListener('pointerdown',e=>{
    if(activeTool==='group' && e.target.tagName!=='BUTTON'){
      e.preventDefault(); toggleNoteForGroup(note); return;
    }
    if(activeTool!=='select'||['INPUT','TEXTAREA','BUTTON'].includes(e.target.tagName)) return;
    note.classList.add('dragging'); note.setPointerCapture(e.pointerId);
    const rect=note.getBoundingClientRect(), b=board.getBoundingClientRect();
    const ox=e.clientX-rect.left, oy=e.clientY-rect.top;
    const move=ev=>{ note.style.left=Math.max(0,Math.min(b.width-rect.width,ev.clientX-b.left-ox))+'px'; note.style.top=Math.max(0,Math.min(b.height-rect.height,ev.clientY-b.top-oy))+'px'; };
    const up=()=>{note.classList.remove('dragging');expandBoard(note.offsetTop + note.offsetHeight + 150);note.removeEventListener('pointermove',move);note.removeEventListener('pointerup',up)};
    note.addEventListener('pointermove',move);note.addEventListener('pointerup',up);
  });
}
document.querySelectorAll('.note').forEach(note=>{
  note.style.left = `${note.offsetLeft}px`;
  note.style.top = `${note.offsetTop}px`;
  enableDrag(note);
});
expandBoard();

function createNote(text){
  if(!text.trim()) return;
  const noteIndex = document.querySelectorAll('.note').length;
  const note=document.createElement('article');
  note.className=`note ${colors[colorIndex]} small`;
  const columnWidth = Math.max(230, (board.clientWidth - 90) / 3);
  note.style.left = `${35 + (noteIndex % 3) * columnWidth + Math.random() * 24}px`;
  note.style.top = `${55 + Math.floor(noteIndex / 3) * 235 + Math.random() * 22}px`;
  note.style.setProperty('--r',(Math.random()*8-4)+'deg');
  const now=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  note.innerHTML=`<button class="note-menu" aria-label="Note options">•••</button><span class="note-tag">FRESH THOUGHT</span><input class="note-name" aria-label="Note name" placeholder="Name this note..."><textarea>${text.replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</textarea><div class="note-footer"><span>✦</span><time>${now}</time></div>`;
  board.insertBefore(note,canvas); enableDrag(note); expandBoard(note.offsetTop + note.offsetHeight + 150); quickInput.value='';
  const count=document.querySelectorAll('.note').length; document.getElementById('ideaCount').textContent=count;
  showToast('New thought planted!');
}
document.getElementById('sendBtn').addEventListener('click',()=>createNote(quickInput.value));
quickInput.addEventListener('keydown',e=>{if(e.key==='Enter') createNote(quickInput.value)});
colorPicker.addEventListener('click',()=>{colorIndex=(colorIndex+1)%colors.length;colorPicker.style.background=`var(--${colors[colorIndex]})`});

document.querySelectorAll('.tool[data-tool]').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.tool').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); activeTool=btn.dataset.tool;
  board.classList.toggle('drawing',activeTool==='draw'); document.getElementById('sparkMenu').classList.toggle('show',activeTool==='spark');
  groupComposer.classList.toggle('show',activeTool==='group');
  if(activeTool!=='group'){
    selectedForGroup.forEach(note=>note.classList.remove('group-selected'));
    selectedForGroup.clear(); updateGroupSelection();
  }
  if(activeTool==='note') quickInput.focus();
}));

document.getElementById('createGroupBtn').addEventListener('click', createGroup);
groupNameInput.addEventListener('keydown', e=>{ if(e.key==='Enter') createGroup(); });
updateGroupSelection();

document.getElementById('organizeBtn').addEventListener('click',()=>{
  const groups = [...document.querySelectorAll('.idea-group')];
  let nextTop = 65;
  groups.forEach(group=>{
    const notes = [...document.querySelectorAll(`[data-group="${group.dataset.groupId}"]`)];
    const columns = Math.min(3, notes.length);
    const rows = Math.ceil(notes.length / columns);
    const width = Math.min(board.clientWidth - 70, columns * 235 + 45);
    const height = rows * 220 + 55;
    group.style.left='25px'; group.style.top=`${nextTop}px`; group.style.width=`${width}px`; group.style.height=`${height}px`;
    notes.forEach((note,i)=>{note.style.left=(50+(i%columns)*230)+'px';note.style.top=(nextTop+35+Math.floor(i/columns)*215)+'px';note.style.setProperty('--r','0deg')});
    nextTop += height + 65;
  });
  const looseNotes=[...document.querySelectorAll('.note:not([data-group])')], cols=3;
  const columnWidth = Math.max(230, (board.clientWidth - 90) / cols);
  looseNotes.forEach((note,i)=>{note.style.left=(35+(i%cols)*columnWidth)+'px';note.style.top=(nextTop+Math.floor(i/cols)*235)+'px';note.style.setProperty('--r','0deg')});
  expandBoard(nextTop + Math.ceil(looseNotes.length / cols) * 235 + 120);
  showToast('Board tidied — still wonderfully yours.');
});

document.querySelectorAll('.spark-menu button').forEach(btn=>btn.addEventListener('click',()=>{quickInput.value=btn.textContent;quickInput.focus();document.getElementById('sparkMenu').classList.remove('show')}));

canvas.addEventListener('pointerdown',e=>{drawing=true;ctx.beginPath();const r=canvas.getBoundingClientRect();ctx.moveTo(e.clientX-r.left,e.clientY-r.top)});
canvas.addEventListener('pointermove',e=>{if(!drawing)return;const r=canvas.getBoundingClientRect();ctx.lineTo(e.clientX-r.left,e.clientY-r.top);ctx.stroke()});
canvas.addEventListener('pointerup',()=>{drawing=false;showToast('Doodle added to the mix.')}); canvas.addEventListener('pointerleave',()=>drawing=false);

let soundOn=true;document.getElementById('soundBtn').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.textContent=soundOn?'♪':'×';showToast(soundOn?'Tiny sounds on.':'Quiet mode on.')});
