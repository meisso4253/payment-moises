// @ts-nocheck
const Core=(()=>{
  'use strict';
  const SCHEMA = 1;
  const COLORS = ['violet', 'teal', 'amber', 'blue', 'rose', 'slate'];
  const TYPES = ['Assignment', 'Quiz', 'Exam', 'Project', 'Reading', 'Other'];
  const STATUS = ['todo', 'progress', 'done'];
  const PRIORITY = ['high', 'medium', 'low'];
  const pad = n => String(n).padStart(2, '0');
  function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
  function localValue(d) { return `${dateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
  // Parse wall-clock local time explicitly; never interpret date-only strings as UTC.
  function parseLocal(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
    const [y,m,d,h,min] = value.match(/\d+/g).map(Number);
    if (y < 1900 || y > 2200) return null;
    const result = new Date(y,m-1,d,h,min,0,0);
    return result.getFullYear() === y && result.getMonth() === m-1 && result.getDate() === d && result.getHours() === h && result.getMinutes() === min ? result : null;
  }
  function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate()+days); return d; }
  function startDay(date) { const d = new Date(date); d.setHours(0,0,0,0); return d; }
  function weekStart(date) { const d=startDay(date); return addDays(d,-((d.getDay()+6)%7)); }
  function uid(prefix='item') {
    const v = typeof globalThis.crypto?.randomUUID === 'function' ? globalThis.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`;
    return `${prefix}-${v}`;
  }
  function blank(name='') { return {schemaVersion:SCHEMA, updatedAt:0, mode:'personal', profile:{name}, subjects:[], tasks:[], sessions:[], reviewers:[]}; }
  function sample(now=new Date(), name='') {
    const s=blank(name); s.mode='sample';
    s.subjects=[
      {id:'s-mechanics',code:'CE 201',name:'Mechanics of Deformable Bodies',color:'violet'},
      {id:'s-economy',code:'ECON 313',name:'Engineering Economy',color:'teal'},
      {id:'s-techno',code:'TECHNO',name:'Technopreneurship',color:'amber'},
      {id:'s-hydro',code:'CE 203',name:'Hydrology',color:'blue'},
      {id:'s-survey',code:'CE 204',name:'Surveying',color:'rose'}
    ];
    const at=(days,hour=23,minute=59)=>{const d=addDays(now,days);d.setHours(hour,minute,0,0);return localValue(d);};
    const specs=[
      ['Normal stress problem set','s-mechanics',0,'high','progress','Assignment',60],
      ['Annuity practice exercises','s-economy',1,'high','todo','Assignment',45],
      ['Customer persona draft','s-techno',2,'medium','todo','Project',50],
      ['Rainfall data summary','s-hydro',3,'medium','todo','Assignment',45],
      ['Leveling field notes','s-survey',-1,'high','todo','Assignment',30],
      ['Review for mechanics quiz','s-mechanics',5,'medium','todo','Quiz',60],
      ['Value proposition statement','s-techno',7,'low','todo','Project',30],
      ['Simple interest worksheet','s-economy',-2,'medium','done','Assignment',30],
      ['Read hydrology introduction','s-hydro',-1,'low','done','Reading',25]
    ];
    s.tasks=specs.map((t,i)=>({id:`task-sample-${i}`,title:t[0],subjectId:t[1],dueAt:at(t[2]),priority:t[3],status:t[4],type:t[5],effortMinutes:t[6],notes:'Fictional task for the classroom demonstration. Replace this with your own requirement.',createdAt:now.toISOString(),completedAt:t[4]==='done'?now.toISOString():null}));
    s.sessions=[
      {id:'session-sample-1',title:'Practice stress problems',subjectId:'s-mechanics',startAt:at(0,18,0),durationMinutes:45,done:false,notes:'Work through one problem at a time.'},
      {id:'session-sample-2',title:'Annuity review',subjectId:'s-economy',startAt:at(1,17,0),durationMinutes:60,done:false,notes:''},
      {id:'session-sample-3',title:'Organize field notes',subjectId:'s-survey',startAt:at(3,10,0),durationMinutes:30,done:false,notes:''}
    ];
    return s;
  }
  function isOverdue(t,now=new Date()) { return t.status!=='done' && parseLocal(t.dueAt) < now; }
  function stats(state,now=new Date()) {
    const active=state.tasks.filter(t=>t.status!=='done');
    const end=addDays(startDay(now),7);
    return {total:state.tasks.length,completed:state.tasks.length-active.length,open:active.length,
      today:active.filter(t=>t.dueAt.slice(0,10)===dateKey(now)).length,
      overdue:active.filter(t=>isOverdue(t,now)).length,
      upcoming:active.filter(t=>parseLocal(t.dueAt)>=now && parseLocal(t.dueAt)<end).length,
      percent:state.tasks.length?Math.round(100*(state.tasks.length-active.length)/state.tasks.length):0};
  }
  function sortTasks(tasks,sort='deadline') {
    return [...tasks].sort((a,b)=>{
      const done=(a.status==='done')-(b.status==='done'); if(done)return done;
      if(sort==='priority')return PRIORITY.indexOf(a.priority)-PRIORITY.indexOf(b.priority)||a.dueAt.localeCompare(b.dueAt)||a.title.localeCompare(b.title);
      return a.dueAt.localeCompare(b.dueAt)||PRIORITY.indexOf(a.priority)-PRIORITY.indexOf(b.priority)||a.title.localeCompare(b.title);
    });
  }
  function sessionOverlaps(candidate,sessions) {
    const a=parseLocal(candidate.startAt).getTime(), b=a+candidate.durationMinutes*60000;
    return sessions.some(s=>{if(s.id===candidate.id)return false;const c=parseLocal(s.startAt).getTime(),d=c+s.durationMinutes*60000;return a<d&&b>c;});
  }
  // Import only an explicitly recognized schema. Rebuild objects instead of merging unknown input.
  function validateState(raw) {
    const fail=msg=>{throw new Error(msg);};
    if(!raw || typeof raw!=='object' || Array.isArray(raw) || raw.schemaVersion!==SCHEMA)fail('This is not a supported StudyTrack v1 backup.');
    const text=(v,label,max,min=0)=>{if(typeof v!=='string'||v.length>max||v.trim().length<min)fail(`${label} is missing or too long.`);return v;};
    const id=v=>{if(typeof v!=='string'||!/^[A-Za-z0-9_-]{1,90}$/.test(v))fail('Invalid record identifier.');return v;};
    const choice=(v,arr,label)=>{if(!arr.includes(v))fail(`Invalid ${label}.`);return v;};
    const number=(v,min,max,label)=>{if(!Number.isInteger(v)||v<min||v>max)fail(`Invalid ${label}.`);return v;};
    const date=(v,label)=>{if(!parseLocal(v))fail(`Invalid ${label}.`);return v;};
    const iso=v=>{if(typeof v!=='string'||v.length>40||!Number.isFinite(Date.parse(v)))fail('Invalid timestamp.');return v;};
    const arr=(v,max,label)=>{if(!Array.isArray(v)||v.length>max||v.some(r=>!r||typeof r!=='object'||Array.isArray(r)))fail(`Invalid ${label} list.`);return v;};
    const unique=rows=>{if(new Set(rows.map(r=>r.id)).size!==rows.length)fail('Duplicate record identifiers.');};
    const output=blank(text(raw.profile?.name,'Display name',40));
    output.mode=choice(raw.mode,['sample','personal'],'planner mode');
    output.updatedAt=typeof raw.updatedAt==='number'&&Number.isFinite(raw.updatedAt)&&raw.updatedAt>=0?raw.updatedAt:0;
    output.subjects=arr(raw.subjects,100,'subjects').map(s=>({id:id(s.id),name:text(s.name,'Subject name',90,1),code:text(s.code,'Subject code',20),color:choice(s.color,COLORS,'subject color')}));
    unique(output.subjects);
    const subject=v=>{if(v===null)return null;if(!output.subjects.some(s=>s.id===v))fail('A task or session refers to a missing subject.');return v;};
    output.tasks=arr(raw.tasks,5000,'tasks').map(t=>({id:id(t.id),title:text(t.title,'Task title',140,1),subjectId:subject(t.subjectId),type:choice(t.type,TYPES,'task type'),priority:choice(t.priority,PRIORITY,'priority'),status:choice(t.status,STATUS,'status'),dueAt:date(t.dueAt,'deadline'),effortMinutes:number(t.effortMinutes,0,1440,'estimated minutes'),notes:text(t.notes,'Task notes',4000),createdAt:iso(t.createdAt),completedAt:t.completedAt===null?null:iso(t.completedAt)}));
    unique(output.tasks);
    output.sessions=arr(raw.sessions,5000,'sessions').map(s=>{if(typeof s.done!=='boolean')fail('Invalid session status.');return {id:id(s.id),title:text(s.title,'Session title',140,1),subjectId:subject(s.subjectId),startAt:date(s.startAt,'session date'),durationMinutes:number(s.durationMinutes,5,480,'session duration'),notes:text(s.notes,'Session notes',4000),done:s.done};});
    unique(output.sessions);
    const rawReviewers=raw.reviewers===undefined?[]:raw.reviewers;
    output.reviewers=arr(rawReviewers,5000,'reviewers').map(r=>({id:id(r.id),title:text(r.title,'Reviewer title',140,1),subjectId:subject(r.subjectId),color:choice(r.color||'violet',COLORS,'reviewer color'),status:choice(r.status||'todo',STATUS,'reviewer status'),examAt:r.examAt===null||r.examAt===undefined?null:date(r.examAt,'exam date and time'),notes:text(r.notes||'','Reviewer notes',4000),createdAt:iso(r.createdAt||new Date(0).toISOString())}));
    unique(output.reviewers);
    return output;
  }
  function escapeHTML(v) {return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  return Object.freeze({SCHEMA,COLORS,TYPES,STATUS,PRIORITY,dateKey,localValue,parseLocal,addDays,startDay,weekStart,uid,blank,sample,isOverdue,stats,sortTasks,sessionOverlaps,validateState,escapeHTML});
})();
export default Core;
