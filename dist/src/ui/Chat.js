import { FEATURE_FLAGS } from '../config/FeatureFlags.js';
import { Logger } from '../diagnostics/Logger.js';
import { PerfMonitor } from '../diagnostics/PerformanceMonitor.js';
import { buildAppContext } from '../ai/ContextBuilder.js';
import { contextAwareAnswer } from '../ai/DirectAnswers.js';
import { askClaudeWithContext } from '../ai/ClaudeProvider.js';
import { offlineBotReply } from '../ai/OfflineBot.js';

export function qa(q){document.getElementById('cIn').value=q;sendMsg();}
export function ck(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}
export function ar(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,86)+'px';}
export function fmtT(){return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}

export function addMsg(role,txt){
  const box=document.getElementById('msgs');
  const d=document.createElement('div');
  d.className=`msg ${role}`;
  d.innerHTML=`<div class="bubble">${txt.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</div><div class="msg-t">${role==='user'?'You':'MetroBot'} · ${fmtT()}</div>`;
  box.appendChild(d);box.scrollTop=box.scrollHeight;
}
export function addTyping(){
  const box=document.getElementById('msgs');
  const d=document.createElement('div');d.className='msg ai';d.id='typing';
  d.innerHTML=`<div class="typing-b"><div class="td"></div><div class="td"></div><div class="td"></div></div>`;
  box.appendChild(d);box.scrollTop=box.scrollHeight;
}
export function rmTyping(){const t=document.getElementById('typing');if(t)t.remove();}

export async function sendMsg(){
  const inp=document.getElementById('cIn');
  const msg=inp.value.trim();if(!msg)return;
  inp.value='';inp.style.height='auto';
  addMsg('user',msg);
  addTyping();

  // FEATURE_FLAGS.AI_ASSISTANT gates the whole context-aware/Claude
  // pipeline — when off, behave like the original baseline bot.
  if (!FEATURE_FLAGS.AI_ASSISTANT){
    setTimeout(()=>{ rmTyping(); addMsg('ai', offlineBotReply(msg)); }, 400 + Math.random()*300);
    return;
  }

  const ctx = buildAppContext();
  const q = msg.toLowerCase();

  // 1) Precise, data-grounded answers first — instant, always reuses
  //    the routes/optimizer output already sitting in memory, never
  //    recomputes Dijkstra.
  const direct = contextAwareAnswer(q, ctx);
  if (direct){
    setTimeout(()=>{ rmTyping(); addMsg('ai', direct); }, 300 + Math.random()*200);
    return;
  }

  // 2) Otherwise hand off to the real Claude integration with the same
  //    structured context, so app-related follow-ups stay grounded and
  //    general questions still get answered normally. Any failure
  //    (offline, running outside the artifact sandbox, etc.) falls
  //    back to the offline keyword bot so the assistant never breaks.
  try {
    const reply = await PerfMonitor.time('aiResponseLatency', ()=>askClaudeWithContext(msg, ctx));
    rmTyping();
    addMsg('ai', reply);
  } catch(err){
    Logger.warn('AI', 'Claude API unavailable, using offline fallback', {error: err.message});
    setTimeout(()=>{
      rmTyping();
      addMsg('ai', offlineBotReply(msg));
    }, 400 + Math.random()*300);
  }
}
