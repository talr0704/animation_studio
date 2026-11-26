import {mountLayeredCharacter} from '../../shared/layered-character.js?v=momo-motion1';
import {createMomoPlayer} from '../../shared/momo-motion.js?v=game1';
import {mountMomoExpressions} from '../../shared/momo-expressions.js?v=larger-eyes2';
import {progressStore} from '../progress/store.js?v=2';

export function conversationEntry(state) {
 const quest = state.story.firstCake;
 if (quest.status === 'completed') return 'completed';
 if (quest.status === 'active' && quest.step !== 'meet-milli') return quest.step === 'grow-strawberries' ? 'growing' : 'later';
 return state.story.npcs.milli.met ? 'returning' : 'greeting';
}

export function acceptInvitation(store = progressStore) {
 const state = store.read();
 if (state.story.firstCake.status === 'completed' || (state.story.firstCake.status === 'active' && state.story.firstCake.step !== 'meet-milli')) return {applied: false, state};
 return store.commit('quest:first-cake:invitation', {
  npc: {id: 'milli', dialogue: 'first-meeting'},
  quest: {action: 'accept-invitation'},
 });
}

export async function mountFirstMeeting({world, onApproach, onStart, onClose, onProgress}) {
 const response = await fetch(new URL('../../assets/story/first-cake.json', import.meta.url), {cache: 'no-cache'});
 if (!response.ok) throw Error('לא ניתן לטעון את השיחה עם מומו');
 const data = await response.json();
 const npc = document.createElement('button'); npc.type = 'button'; npc.id = 'milli-npc'; npc.className = 'story-npc'; npc.setAttribute('aria-pressed', 'false');
 const title = document.createElement('span'); title.className='story-npc-label'; title.textContent = 'לדבר עם מומו';
 let characterView, avatar, player, restTimer;
 function scheduleRest() { clearTimeout(restTimer); restTimer=setTimeout(()=>{if(panel.hidden&&!npc.hidden)player?.play('rest');},24000); }
 if(data.npc.assembly){
  avatar=document.createElement('span');avatar.className='story-npc-avatar';
  const load=async path=>{const response=await fetch(new URL('../../'+path,import.meta.url),{cache:'no-cache'});if(!response.ok)throw Error('לא ניתן לטעון אנימציות של מומו');return response.json();};
  const review=await load(data.npc.animationReview);
  const animated=review.status==='approved'&&review.gameEnabled;
  characterView=await mountLayeredCharacter(avatar,{assemblyUrl:new URL('../../'+data.npc.assembly,import.meta.url),expectedId:data.npc.character,motionRig:animated,headFollowers:review.headFollowers});
  if(animated){
   const source=await load(data.npc.animations);
   const clips=Object.fromEntries(review.approvedClips.map(id=>[id,source[id]]));
   const face=await mountMomoExpressions({images:new Map([...characterView.nodes].map(([name,node])=>[name,node.img])),groups:new Map([...characterView.nodes].map(([name,node])=>[name,node.group])),getScaleY:name=>player?.poses[name]?.scaleY??1});
   player=createMomoPlayer(characterView,{clips,face});player.play('idle');player.setVisible(true);
  }
  npc.classList.add('story-npc-assembled');npc.append(avatar);
 } else if (data.npc.portrait) { const image = new Image(); image.src = new URL('../../' + data.npc.portrait, import.meta.url).href; image.alt = ''; npc.append(image); }
 npc.append(title); world.append(npc);
 const questButton = document.createElement('button'); questButton.type = 'button'; questButton.id = 'first-quest'; questButton.className = 'first-quest'; world.append(questButton);
 const panel = document.createElement('div'); panel.id = 'story-dialog'; panel.className = 'overlay story-overlay'; panel.hidden = true;
 panel.innerHTML = '<section class="story-conversation" role="dialog" aria-modal="true" aria-labelledby="story-speaker"><header><h2 id="story-speaker"></h2><button id="story-close" type="button" aria-label="סגירת השיחה">סגירה ×</button></header><div id="story-avatar" class="story-live-avatar" hidden></div><p id="story-text" aria-live="polite"></p><div id="story-choices"></div><p id="story-save" role="status"></p></section>';
 world.append(panel);
 const $ = id => panel.querySelector('#story-' + id);
 $('speaker').textContent = data.npc.name;
 let returnFocus = npc, inertNodes = [];
 function refresh() {
  const state = progressStore.read(), quest = state.story.firstCake;
  questButton.replaceChildren();
  const heading = document.createElement('strong'), step = document.createElement('span');
  heading.textContent = quest.status === 'not-started' ? 'ההרפתקה הראשונה שלך' : data.title;
  step.textContent = quest.status === 'not-started' ? 'הכירי את מומו' : data.steps[quest.step];
  questButton.append(heading, step);
  questButton.setAttribute('aria-label', `${heading.textContent} · ${step.textContent} · לדבר עם מומו`);
 }
 function close() {
  if (panel.hidden) return;
  if(avatar){npc.prepend(avatar);$('avatar').hidden=true;}
  player?.play('idle');scheduleRest();
  panel.hidden = true; npc.setAttribute('aria-pressed', 'false'); inertNodes.forEach(([node, wasInert]) => { node.inert = wasInert; }); inertNodes = [];
  onClose(); if (returnFocus?.isConnected && !returnFocus.hidden) returnFocus.focus({preventScroll: true});
 }
 function render(id, initial=false) {
  const node = data.nodes[id]; if (!node) throw Error('שיחה לא מוכרת');
  clearTimeout(restTimer);
  player?.play(initial?'wave':id==='accepted'||id==='completed'?'happy':id==='plan'||id==='reminder'?'curious':'talk',{next:'talk'});
  panel.dataset.node = id; $('text').textContent = node.text; $('choices').replaceChildren();
  for (const choice of node.choices) {
   const button = document.createElement('button'); button.type = 'button'; button.textContent = choice.label;
   button.onclick = () => {
    if (choice.close) { close(); return; }
    if (choice.action === 'accept') {
     try { const result = acceptInvitation(); refresh(); onProgress(); $('save').textContent = result.applied === false ? 'המשימה כבר התחילה' : result.persisted === false ? 'המשימה התחילה, אך השמירה אינה זמינה. ההתקדמות כרגע זמנית.' : 'המשימה נשמרה'; render('accepted'); }
     catch { $('save').textContent = 'לא הצלחנו להתחיל את המשימה. אפשר לנסות שוב.'; }
    } else render(choice.next);
   };
   $('choices').append(button);
  }
  $('choices').querySelector('button')?.focus({preventScroll: true});
 }
 function beginConversation() {
  if (!panel.hidden) return;
  const entry = conversationEntry(progressStore.read());
  onStart();
  const met = progressStore.commit('npc:milli:met', {npc: {id: 'milli'}});
  $('save').textContent = met.persisted === false ? 'השמירה אינה זמינה כרגע — הביקור הזה זמני.' : '';
  panel.hidden = false;
  if(avatar){$('avatar').append(avatar);$('avatar').hidden=false;}
  inertNodes = [];
  for (let current = panel; current.parentElement && current !== document.body; current = current.parentElement) {
   for (const sibling of current.parentElement.children) if (sibling !== current) inertNodes.push([sibling, sibling.inert]);
  }
  inertNodes.forEach(([node]) => { node.inert = true; });
  render(entry,true); refresh();
 }
 function approach() { returnFocus = document.activeElement; onApproach({id: 'milli', label: 'מומו', npc: 'milli'}, npc); }
 npc.onclick = approach; questButton.onclick = approach; $('close').onclick = close;
 panel.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
  if (event.key === 'Tab') {
   const buttons = [...panel.querySelectorAll('button:not(:disabled)')], first = buttons[0], last = buttons.at(-1);
   if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
   else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
 });
 const unsubscribe = progressStore.subscribe(refresh); refresh();scheduleRest();
 return {
  beginConversation, get isOpen() { return !panel.hidden; },
  setVisible(visible) { if (!visible) close(); npc.hidden = questButton.hidden = !visible; player?.setVisible(visible); clearTimeout(restTimer); if(visible){player?.play('idle');scheduleRest();} },
  destroy() { close(); clearTimeout(restTimer); unsubscribe(); player?.destroy(); characterView?.destroy(); npc.remove(); questButton.remove(); panel.remove(); },
 };
}
