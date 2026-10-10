// Run only against the loopback production preview. Uses disposable local data.
import assert from 'node:assert/strict';
const base='http://127.0.0.1:8787';
const identities={admin:['local_seedy','seedy@sites.test'],alice:['test_alice','alice@sites.test'],bob:['test_bob','bob@sites.test']};
let checks=0;
async function request(path,{who='alice',method='GET',body,origin=base}={}){
 const headers={};if(who){const [id,email]=identities[who];headers['oai-authenticated-user-id']=id;headers['oai-authenticated-user-email']=email;}
 if(method!=='GET')headers.Origin=origin;
 if(body&&!(body instanceof FormData)){headers['Content-Type']='application/json';body=JSON.stringify(body);}
 const r=await fetch(base+'/api/'+path,{method,headers,body});let data;
 if(r.headers.get('content-type')?.includes('json'))data=await r.json();else data=new Uint8Array(await r.arrayBuffer());
 return {status:r.status,data};
}
function check(condition,message){assert.ok(condition,message);checks++;console.log('PASS '+message);}
const me=await request('me');check(me.data.user.id==='test_alice','Customer identity is server provided');
check((await request('admin/payments')).status===403,'Customers cannot list all payments');
check((await request('payments',{who:null})).status===401,'Anonymous users cannot view payments');
check((await request('premium/insights')).status===403,'Free accounts cannot call premium endpoints');
const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH1sAAAAASUVORK5CYII=','base64'));
const ref='TEST-'+Date.now();
function receipt(reference=ref){const f=new FormData();f.set('name','LOCAL TEST CUSTOMER — NO MONEY SENT');f.set('reference',reference);f.set('paidAt',new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'}));f.set('consent','yes');f.set('amount','1');f.set('duration','9999');f.set('proof',new Blob([png],{type:'image/png'}),'fixture.png');return f;}
let bad=receipt();bad.set('proof',new Blob(['<svg>invalid</svg>'],{type:'image/png'}),'fake.png');
check((await request('payments',{method:'POST',body:bad})).status===400,'Receipt bytes must be PNG or JPEG');
check((await request('payments',{method:'POST',body:{},origin:'https://evil.test'})).status===403,'Cross-origin writes are denied');
const created=await request('payments',{method:'POST',body:receipt()});check(created.status===201,'Customer can submit a proof: '+JSON.stringify(created));const id=created.data.id;
check((await request('payments',{method:'POST',body:receipt(ref+'X')})).status===409,'Only one pending receipt per customer');
const own=await request('payments');const p=own.data.rows.find(x=>x.id===id);check(p.amount===4900&&p.duration===120,'Price and duration ignore client tampering');
check((await request('payments',{who:'bob'})).data.rows.length===0,'Other customers cannot see payment metadata');
check((await request('proof/'+id,{who:'bob'})).status===404,'Other customers cannot open proof files');
check((await request('proof/'+id)).data.length===png.length,'Submitting customer can open stored proof');
check((await request('admin/review/'+id,{method:'POST',body:{status:'approved',note:'test'}})).status===403,'Customer cannot approve their own receipt');
check((await request('me')).data.premiumUntil===0,'Pending receipts do not unlock premium');
const approved=await request('admin/review/'+id,{who:'admin',method:'POST',body:{status:'approved',note:'LOCAL AUTOMATED TEST ONLY'}});check(approved.status===200,'Admin can approve a pending receipt');
const after=await request('me');const until=after.data.premiumUntil;check(until>Date.now()+119.99*86400000&&until<Date.now()+120.01*86400000,'Approval grants exactly 120 days');
check((await request('premium/insights')).status===200,'Approved customer can use premium endpoint');
check((await request('admin/review/'+id,{who:'admin',method:'POST',body:{status:'approved',note:'Repeat'}})).status===409,'Repeat approval is refused');
check((await request('me')).data.premiumUntil===until,'Repeat approval cannot extend access');
check((await request('payments',{who:'bob',method:'POST',body:receipt(ref.toLowerCase())})).status===409,'References are unique regardless of case');
const renewal=await request('payments',{method:'POST',body:receipt(ref+'RENEW')});check(renewal.status===201,'Active customer can submit a renewal');
check((await request('admin/review/'+renewal.data.id,{who:'admin',method:'POST',body:{status:'rejected',note:'LOCAL TEST rejected'}})).status===200,'Admin can reject a receipt');
check((await request('me')).data.premiumUntil===until,'Rejected receipt adds no premium days');
const renewal2=await request('payments',{method:'POST',body:receipt(ref+'RENEW2')});
await request('admin/review/'+renewal2.data.id,{who:'admin',method:'POST',body:{status:'approved',note:'LOCAL TEST renewal'}});
check((await request('me')).data.premiumUntil===until+120*86400000,'Renewal adds 120 days after current access');
const blank={schemaVersion:1,updatedAt:0,mode:'personal',profile:{name:'Alice local test'},subjects:[],tasks:[],sessions:[]};
const save=await request('planner',{method:'PUT',body:{state:blank,expected:0}});check(save.status===200&&save.data.version===1,'Planner saves to cloud database');
check((await request('me')).data.planner.profile.name==='Alice local test','Cloud planner loads on another request');
check((await request('me',{who:'bob'})).data.planner===null,'Planner records are isolated by account');
check((await request('planner',{method:'PUT',body:{state:blank,expected:0}})).status===409,'Stale planner saves are rejected');
check((await request('admin/payments',{who:'admin'})).data.rows.filter(p=>p.user_id==='test_alice'&&p.status==='approved').length===2,'Admin report source excludes rejected receipts from approved count');
console.log(`Verified ${checks} payment, account, and planner boundaries.`);


