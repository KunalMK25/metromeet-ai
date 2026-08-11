import { ST } from '../data/stations.js';
import { AM } from '../data/sequences.js';
import { friends, COLORS, setLastResult } from '../rendering/state.js';
import { draw } from '../rendering/renderer.js';
import { closeDrawer } from './Drawer.js';

export function addFriend(){
  const nm=document.getElementById('frName').value.trim();
  const ar=document.getElementById('frArea').value;
  if(!nm||!ar){alert('Enter a name and select an area!');return;}
  if(friends.length>=6){alert('Max 6 friends!');return;}
  const stKey=AM[ar];
  if(!stKey||!ST[stKey]){alert('Station not mapped yet!');return;}
  const st=ST[stKey];
  const color=COLORS[friends.length%COLORS.length];
  friends.push({name:nm,area:ar,stKey,st,color});
  document.getElementById('frName').value='';
  document.getElementById('frArea').value='';
  document.getElementById('frAreaSearch').value='';
  renderFriends();
  draw();
}

export function removeFriend(i){
  friends.splice(i,1);
  renderFriends();
  if(friends.length<2){
    setLastResult(null);
    closeDrawer();
  }
  draw();
}

export function renderFriends(){
  const el=document.getElementById('frList');
  document.getElementById('findBtn').disabled=friends.length<2;
  el.innerHTML=friends.map((f,i)=>`
    <div class="fc">
      <div class="fc-av" style="background:${f.color}22;color:${f.color}">${f.name[0].toUpperCase()}</div>
      <div class="fc-inf">
        <div class="fc-nm">${f.name}</div>
        <div class="fc-loc">📍 ${f.area}</div>
      </div>
      <div class="fc-stn" style="background:${f.st.co}18;color:${f.st.co};border:1px solid ${f.st.co}35">${f.stKey.split(' ')[0]}</div>
      <button class="fc-rm" onclick="removeFriend(${i})">×</button>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
//  FIND MEET POINT
