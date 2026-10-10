// Disposable loopback fixtures test database sessions and authorization.
// They do not emulate a successful Google OAuth response or run on production.
import { DatabaseSync } from 'node:sqlite';
import { globSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:8787';
const secret='LOCAL-GOOGLE-AUTH-FIXTURE-SECRET-ONLY-DO-NOT-USE-IN-PRODUCTION';
const ids={alice:['google-test-alice','alice@gmail.com',true],bob:['google-test-bob','bob@gmail.com',true],admin:['google-test-admin','seedy@sites.test',true],unverified:['google-test-unverified','unverified@gmail.com',false],expired:['google-test-expired','expired@gmail.com',true]};
function cookie(who){const token='LOCAL-SESSION-'+who;return 'studytrack.session_token='+encodeURIComponent(token+'.'+createHmac('sha256',secret).update(token).digest('base64'));}
if(process.argv.includes('--seed')){
  const file=globSync('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite').find(x=>!x.endsWith('metadata.sqlite'));
  if(!file)throw new Error('Apply local migrations first.');const db=new DatabaseSync(file),now=Date.now();
  for(const [who,[id,email,verified]] of Object.entries(ids)){
    db.prepare('INSERT OR IGNORE INTO auth_user (id,name,email,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)').run(id,'LOCAL TEST '+who,email,verified?1:0,now,now);
    db.prepare('INSERT OR IGNORE INTO auth_account (id,account_id,provider_id,user_id,created_at,updated_at) VALUES (?,?,?,?,?,?)').run('account-'+id,'fixture-sub-'+who,'google',id,now,now);
    db.prepare('INSERT OR REPLACE INTO auth_session (id,expires_at,token,created_at,updated_at,user_id) VALUES (?,?,?,?,?,?)').run('session-'+id,who==='expired'?now-60000:now+86400000,'LOCAL-SESSION-'+who,now,now,id);
  }
  db.prepare('INSERT OR REPLACE INTO legacy_identities (user_id,email) VALUES (?,?)').run('test_alice','alice@gmail.com');
  db.close();console.log('Local Google-session fixtures seeded.');process.exit();
}
let checks=0;function check(c,label){assert.ok(c,label);checks++;console.log('PASS '+label);}
async function request(path,{who,method='GET',body,extraHeaders={}}={}){
  const headers={...extraHeaders};if(who)headers.Cookie=cookie(who);if(method==='POST'){headers.Origin=origin;headers['Content-Type']='application/json';}
  const r=await fetch(origin+path,{method,headers,body:body?JSON.stringify(body):undefined});let data;try{data=await r.json();}catch{data=null;}return {status:r.status,data,headers:r.headers};
}
check((await request('/api/auth/ok')).data.ok===true,'Auth handler runs on the Worker');
const anonymous=await request('/api/me');check(anonymous.data.user===null&&anonymous.data.googleReady,'Google is configured and anonymous visitors have no account');
check((await request('/api/me',{extraHeaders:{'oai-authenticated-user-id':'spoof','oai-authenticated-user-email':'seedy@sites.test'}})).data.user===null,'ChatGPT identity headers cannot authenticate in Google mode');
const alice=await request('/api/me',{who:'alice'});check(alice.data.user.provider==='google','Signed database session authenticates Google account');
check(alice.data.user.id==='test_alice','Verified Gmail links to the unique previous account key');
check(alice.data.planner.profile.name==='Alice local test','Previous cloud planner survives identity transition');
check(alice.data.premiumUntil>Date.now(),'Previously approved premium access survives identity transition');
const own=await request('/api/payments',{who:'alice'});check(own.data.rows.length>=3,'Previous receipt history survives identity transition');
check((await request('/api/payments',{who:'bob'})).data.rows.length===0,'Google customers cannot list another account’s receipts');
check((await request('/api/proof/'+own.data.rows[0].id,{who:'bob'})).status===404,'Google sessions preserve receipt file isolation');
check((await request('/api/admin/payments',{who:'alice'})).status===403,'Google customer cannot open admin endpoint');
check((await request('/api/admin/payments',{who:'admin'})).status===200,'Verified configured admin retains admin access');
check((await request('/api/me',{who:'unverified'})).data.user===null,'Unverified Google email cannot authenticate the app');
check((await request('/api/me',{who:'expired'})).data.user===null,'Expired database session cannot authenticate');
check((await request('/api/me',{extraHeaders:{Cookie:cookie('alice')+'tampered'}})).data.user===null,'Tampered cookie signatures are refused');
const invalid='eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIiwiZW1haWwiOiJzZWVkeUBzaXRlcy50ZXN0In0.invalid';
check((await request('/api/auth/one-tap/callback',{method:'POST',body:{idToken:invalid,callbackURL:'/study'}})).status===400,'Forged Google identity token cannot create a session');
const cross=await fetch(origin+'/api/auth/one-tap/callback',{method:'POST',headers:{Origin:'https://evil.test','Content-Type':'application/json'},body:JSON.stringify({idToken:invalid})});check(cross.status===403,'Cross-origin Google login requests are denied');
check((await request('/api/auth/sign-up/email',{method:'POST',body:{email:'fake@gmail.com',password:'FakePassword123',name:'Fake'}})).status===404,'Password signup remains disabled');
const logout=await request('/api/auth/sign-out',{who:'alice',method:'POST',body:{}});check(logout.status===200,'Google account can sign out');
check((await request('/api/me',{who:'alice'})).data.user===null,'Sign-out invalidates the database session');
console.log(`Verified ${checks} Google session, identity migration, and authorization checks. Actual Google login awaits an owner-issued client ID.`);
