// Disposable SQLite database + in-memory private receipts. No production credentials.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHmac } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { register } from 'tsx/esm/api';
register();
const dir=mkdtempSync(join(tmpdir(),'studytrack-test-'));
const origin='http://localhost:3000', secret='LOCAL-TEST-SECRET-ONLY-NEVER-USE-IN-PRODUCTION';
// Explicit values override any deployment environment; remote databases are never touched.
delete process.env.VERCEL; delete process.env.VERCEL_OIDC_TOKEN;
Object.assign(process.env,{NODE_ENV:'test',TURSO_DATABASE_URL:'file:'+join(dir,'database.sqlite').replaceAll('\\','/'),TURSO_AUTH_TOKEN:'',APP_ORIGIN:origin,BETTER_AUTH_SECRET:secret,GOOGLE_CLIENT_ID:'123456789-test.apps.googleusercontent.com',ADMIN_EMAIL:'admin@gmail.com',GCASH_NAME:'LOCAL FIXTURE',GCASH_NUMBER:'09123456789',BLOB_READ_WRITE_TOKEN:'LOCAL-FIXTURE-NOT-A-REAL-TOKEN'});
assert.ok(!process.env.TURSO_DATABASE_URL.includes('libsql://'));
for(let i=0;i<2;i++){
  const migrated=spawnSync(process.execPath,['scripts/migrate.mjs'],{env:process.env,encoding:'utf8'});
  assert.equal(migrated.status,0,migrated.stderr);
}
const {getClient,database}=await import('../db/client.ts');
const {createStudyApi}=await import('../lib/study-api.ts');
const authRoute=await import('../app/api/auth/[...all]/route.ts');
const db=getClient(),now=Date.now();
for(const who of ['alice','bob','admin','unverified','expired','no-provider']){
  const id='fixture-'+who;
  await db.execute({sql:'INSERT INTO auth_user (id,name,email,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)',args:[id,'LOCAL '+who,who+'@gmail.com',who==='unverified'?0:1,now,now]});
  if(who!=='no-provider') await db.execute({sql:'INSERT INTO auth_account (id,account_id,provider_id,user_id,created_at,updated_at) VALUES (?,?,?,?,?,?)',args:['account-'+id,'sub-'+id,'google',id,now,now]});
  await db.execute({sql:'INSERT INTO auth_session (id,expires_at,token,created_at,updated_at,user_id) VALUES (?,?,?,?,?,?)',args:['session-'+id,who==='expired'?now-60000:now+86400000,'LOCAL-SESSION-'+who,now,now,id]});
}
const files=new Map();let reads=0;
const storage={async put(key,bytes){files.set(key,bytes);},async get(key){reads++;return files.has(key)?{body:files.get(key)}:null;},async delete(key){files.delete(key);}};
const api=createStudyApi(storage);
let checks=0;
function check(value,label){assert.ok(value,label);console.log('PASS '+label);checks++;}
function cookie(who){const token='LOCAL-SESSION-'+who;return 'studytrack.session_token='+encodeURIComponent(token+'.'+createHmac('sha256',secret).update(token).digest('base64'));}
async function request(path,{who='alice',method='GET',body,extraHeaders={}}={}){
  const headers={...extraHeaders};if(who)headers.Cookie=cookie(who);if(method!=='GET')headers.Origin=origin;
  if(body&&!(body instanceof FormData)){headers['Content-Type']='application/json';body=JSON.stringify(body);}
  const req=new Request(origin+'/api/'+path,{method,headers,body});
  const response=await (path.startsWith('auth/')?authRoute:api)[method](req);
  const data=response.headers.get('content-type')?.includes('json')?await response.json():new Uint8Array(await response.arrayBuffer());
  return {status:response.status,data};
}
check((await request('me',{who:null})).data.user===null,'Anonymous visitors have no account');
check((await request('me',{who:null,extraHeaders:{'oai-authenticated-user-id':'spoof','oai-authenticated-user-email':'admin@gmail.com'}})).data.user===null,'Spoofed hosting identity headers do not authenticate');
check((await request('me')).data.user.provider==='google','Signed Google database session authenticates');
for(const who of ['unverified','expired','no-provider'])check((await request('me',{who})).data.user===null,who+' cannot authenticate');
check((await request('me',{who:null,extraHeaders:{Cookie:cookie('alice')+'tampered'}})).data.user===null,'Tampered session cookie is rejected');
check((await request('admin/payments')).status===403,'Customer cannot enter the admin panel');
check((await request('admin/payments',{who:'admin'})).status===200,'Verified admin can enter the admin panel');
check((await request('payments',{who:null})).status===401,'Payment history requires a session');
check((await request('premium/insights')).status===403,'Free account cannot use premium API');
const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH1sAAAAASUVORK5CYII=','base64'));
const ref='LOCAL-TEST-'+Date.now();
function receipt(reference=ref){const f=new FormData();f.set('name','LOCAL FIXTURE — NO MONEY SENT');f.set('reference',reference);f.set('paidAt',new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Manila'}));f.set('consent','yes');f.set('amount','1');f.set('duration','9999');f.set('proof',new Blob([png],{type:'image/png'}),'fixture.png');return f;}
const bad=receipt();bad.set('proof',new Blob(['<svg>invalid</svg>'],{type:'image/png'}),'fake.png');
check((await request('payments',{method:'POST',body:bad})).status===400,'Receipt content must be PNG/JPEG');
const cross=new Request(origin+'/api/payments',{method:'POST',headers:{Origin:'https://evil.test'},body:'{}'});
check((await api.POST(cross)).status===403,'Cross-origin writes are rejected');
const created=await request('payments',{method:'POST',body:receipt()});check(created.status===201,'Customer can submit a receipt');const id=created.data.id;
check((await request('payments',{method:'POST',body:receipt(ref+'X')})).status===409,'One pending receipt per customer');
const own=(await request('payments')).data.rows[0];check(own.amount===4900&&own.duration===120,'Server fixes price at PHP49 and duration at 120 days');
check(!('proof_key' in own),'Private storage key is omitted from history');
check((await request('payments',{who:'bob'})).data.rows.length===0,'Customer payment metadata is isolated');
const beforeReads=reads;check((await request('proof/'+id,{who:'bob'})).status===404&&reads===beforeReads,'Unauthorized receipts never reach storage');
check((await request('proof/'+id)).data.length===png.length,'Owner can retrieve receipt bytes');
check((await request('proof/'+id,{who:'admin'})).data.length===png.length,'Admin can retrieve receipt bytes');
check((await request('admin/review/'+id,{method:'POST',body:{status:'approved',note:'test'}})).status===403,'Customer cannot approve a receipt');
check((await request('me')).data.premiumUntil===0,'Pending payment does not grant premium');
const reviews=await Promise.all([1,2].map(()=>request('admin/review/'+id,{who:'admin',method:'POST',body:{status:'approved',note:'LOCAL TEST approval'}})));
check(reviews.map(r=>r.status).sort().join(',')==='200,409','Concurrent approvals grant exactly once');
const until=(await request('me')).data.premiumUntil;
check(until>now+119.99*86400000&&until<now+120.01*86400000,'Approval grants exactly 120 days');
check((await request('premium/insights')).status===200,'Approved customer can use premium API');
check((await request('payments',{who:'bob',method:'POST',body:receipt(ref.toLowerCase())})).status===409,'Duplicate transaction references are rejected');
check(files.size===1,'Failed database insert removes uploaded proof');
const renewal=await request('payments',{method:'POST',body:receipt(ref+'R1')});
check((await request('admin/review/'+renewal.data.id,{who:'admin',method:'POST',body:{status:'rejected',note:'LOCAL TEST rejection'}})).status===200,'Admin can reject a receipt');
check((await request('me')).data.premiumUntil===until,'Rejected receipt grants no access');
const next=await request('payments',{method:'POST',body:receipt(ref+'R2')});
await request('admin/review/'+next.data.id,{who:'admin',method:'POST',body:{status:'approved',note:'LOCAL TEST renewal'}});
check((await request('me')).data.premiumUntil===until+120*86400000,'Renewal extends existing access by 120 days');
const blank={schemaVersion:1,updatedAt:0,mode:'personal',profile:{name:'Local Alice'},subjects:[],tasks:[],sessions:[]};
check((await request('planner',{method:'PUT',body:{state:blank,expected:0}})).status===200,'Cloud planner saves to SQLite');
check((await request('planner',{method:'PUT',body:{state:blank,expected:0}})).status===409,'Stale planner writes are rejected');
check((await request('me')).data.planner.profile.name==='Local Alice','Cloud planner is returned to its owner');
check((await request('me',{who:'bob'})).data.planner===null,'Cloud planners are isolated');
await assert.rejects(database.batch([database.prepare('INSERT INTO planners VALUES (?,?,?)').bind('rollback-test','{}',1),database.prepare('INSERT INTO nonexistent_table VALUES (1)')]));
check(await database.prepare('SELECT * FROM planners WHERE user_id=?').bind('rollback-test').first()===null,'Failed transaction rolls back every statement');
check((await request('auth/one-tap/callback',{method:'POST',body:{idToken:'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIn0.invalid',callbackURL:'/study'}})).status===400,'Forged Google ID token cannot create a session');
check((await request('auth/sign-up/email',{method:'POST',body:{}})).status===404,'Password registration stays disabled');
check((await request('auth/sign-out',{method:'POST',body:{}})).status===200,'Google account can sign out');
check((await request('me')).data.user===null,'Sign-out revokes the database session');
const {Script}=await import('node:vm');
const html=readFileSync('lib/planner.html','utf8');
for(const [,code] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new Script(code);
check(!html.includes('signin-with-chatgpt'),'Planner contains only Google sign-in');
check((await db.execute('SELECT COUNT(*) AS total FROM studytrack_migrations')).rows[0].total===3,'Migrations are idempotent');
db.close();console.log(`Verified ${checks} Vercel migration checks. Real Google login and Blob require owner-configured services.`);
