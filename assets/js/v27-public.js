(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
function enrichHarvest(){
 const rain=$('.v21-real-rain');if(!rain)return;
 const src=rain.querySelector('img')?.src;if(!src)return;
 const target=15;
 while(rain.children.length<target){const i=rain.children.length,im=document.createElement('img');im.src=src;im.alt='';im.setAttribute('aria-hidden','true');im.dataset.rain=String(i);im.style.setProperty('--x',(6+((i*17)%91))+'%');im.style.setProperty('--w',(68+((i*23)%72))+'px');im.style.setProperty('--r',((i%2?-1:1)*(4+(i%9)))+'deg');im.style.setProperty('--s',(0.62+(i%6)*0.075).toFixed(2));im.style.setProperty('--a',(0.30+(i%5)*0.105).toFixed(2));rain.appendChild(im);}
 const tones=['v27-tone-yellow','v27-tone-olive','v27-tone-pale','v27-tone-deep',''];
 [...rain.querySelectorAll('img')].forEach((im,i)=>{tones.forEach(t=>t&&im.classList.remove(t));const t=tones[i%tones.length];if(t)im.classList.add(t);im.classList.toggle('v27-near',i%5===1||i%7===0);im.classList.toggle('v27-far',i%4===0);im.style.setProperty('--sx',(0.84+(i%5)*0.08).toFixed(2));});
 const p=$('.v20-story-copy-grove p');if(p)p.textContent='A lively harvest moves through the frame; one coconut stays with us for the cut.';
 const lab=$('#v20-count-label');if(lab)lab.textContent='coconuts in the harvest';
}
function telegramUX(){
 const pref=$('#ePref'),input=$('#eTelegram');if(!pref||!input)return;const field=input.closest('.ef');if(!field)return;field.classList.add('v27-telegram-field');
 const label=field.querySelector('label');if(label)label.innerHTML='Telegram username <span style="color:rgba(255,255,255,.28)">(separate from WhatsApp)</span>';
 let help=field.querySelector('.v27-telegram-help');if(!help){help=document.createElement('small');help.className='v27-telegram-help';field.appendChild(help);}help.textContent='Telegram cannot be contacted reliably from a WhatsApp/mobile number alone. Enter @username when Telegram is your preferred reply.';
 let note=$('.v27-contact-note');if(!note){note=document.createElement('div');note.className='v27-contact-note';const fields=pref.closest('.enquiry-fields');fields?.appendChild(note);}if(note)note.textContent='International customers: keep your WhatsApp/mobile number with country code. If you prefer Telegram, select Telegram and add a separate @username.';
 const phoneLabel=$('label[for="ePhone"]');if(phoneLabel)phoneLabel.textContent='WhatsApp / mobile number';
 function sync(){const isT=pref.value==='telegram';field.hidden=!isT;if(isT)setTimeout(()=>input.focus(),0);}pref.addEventListener('change',sync);sync();
}
function communityTelegram(){const f=$('#v23CommunityForm');if(!f)return;const tg=f.querySelector('input[name=telegram]');if(!tg)return;const l=tg.closest('label');if(l){const span=l.querySelector('span');if(span)span.textContent='(optional · separate @username)';}}
function init(){setTimeout(enrichHarvest,30);telegramUX();communityTelegram();}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
