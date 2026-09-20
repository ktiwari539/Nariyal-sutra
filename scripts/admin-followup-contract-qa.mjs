import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const must=(c,m)=>{if(!c)throw new Error(m)};
const has=(src,parts,label)=>parts.forEach(p=>must(src.includes(p),`${label}: missing ${p}`));

const html=read('admin-preview.html');
has(html,['id="apFollowupAdd"','id="apFollowupRows"','id="apFollowupSearch"','id="apFollowupStatusFilter"','id="apFollowupAssigneeFilter"'],'Follow-up Admin surface');

const loader=read('assets/js/admin-v30.js');
has(loader,["assets/js/admin-followups.js","window.NSV421Followups?.ready===true"],'Follow-up runtime loader');

const local=read('assets/js/v421-local-store.js');
has(local,["const SCHEMA=28","'followups','followupEvents'",'FU-DEMO-1','FUE-DEMO-1'],'Local Follow-up migration');

const module=read('assets/js/admin-followups.js');
has(module,[
  "const WRITE_ROLES=new Set(['Owner','Admin','Manager','Support','Sales'])",
  "const READ_ROLES=new Set([...WRITE_ROLES,'Operations'])",
  'bridge().saveFollowup',
  'data-fu-history',
  'data-fu-communication',
  'completedAt',
  'followupEvents',
  'Operations can review follow-ups but cannot change them.'
],'Follow-up Admin runtime');

const bridge=read('assets/js/v421-production-bridge.js');
has(bridge,[
  "fsMod.collection(db,'followups')",
  "fsMod.collection(db,'followupEvents')",
  'async function saveFollowup',
  'async function refreshFollowups',
  'function watchFollowups',
  'FOLLOWUP_WRITE_ROLES',
  'fsMod.writeBatch(db)',
  'await batch.commit();await refreshFollowups()',
  'saveFollowup,uploadMedia'
],'Production Follow-up bridge');

const rules=read('firestore.rules');
has(rules,[
  'function canFollowupsRead()',
  'function canFollowupsWrite()',
  'function validFollowupCreate(followupId)',
  'function validFollowupUpdate(followupId)',
  'function validFollowupEventCreate(eventId)',
  'match /followups/{followupId}',
  'match /followupEvents/{eventId}',
  'allow delete: if false;',
  'existsAfter(followupPath(d.followupId))'
],'Firestore Follow-up rules');

const communication=read('assets/js/admin-communication.js');
has(communication,['function composer(id,prefill={})','Object.assign(c,prefill'],'Follow-up communication draft handoff');

console.log('ADMIN FOLLOW-UP CONTRACT QA: PASS');
