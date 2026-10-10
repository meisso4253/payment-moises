import { env } from 'cloudflare:workers';
import { getStudyUser } from '../../../lib/study-user';
import { googleReady,authBindings } from '../../../lib/auth';
import { PRICE, DAYS, checkedText, referenceKey, proofType, paidDate } from '../../../lib/payments';
import Core from '../../../lib/planner-core';

export const dynamic='force-dynamic';
const bindings=()=>env as unknown as {DB:D1Database,BUCKET:R2Bucket,ADMIN_EMAIL?:string,GCASH_NAME?:string,GCASH_NUMBER?:string};
function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
const fail=(message:string,status=400)=>json({error:message},status);
async function handler(req:Request){
  const path=new URL(req.url).pathname.replace('/api/','');
  const b=bindings(), user=await getStudyUser(req.headers);
  const isAdmin=!!user && !!b.ADMIN_EMAIL && user.email.toLowerCase()===b.ADMIN_EMAIL.trim().toLowerCase();
  const configured=!!b.ADMIN_EMAIL && !!b.GCASH_NAME && /^09\d{9}$/.test(b.GCASH_NUMBER||'');
  if(req.method!=='GET'){
    const origin=req.headers.get('origin');
    if(!origin || origin!==new URL(req.url).origin) return fail('Request origin is not allowed.',403);
  }
  if(path==='me' && req.method==='GET'){
    const authentication={googleReady:googleReady(),googleClientId:googleReady()?authBindings().GOOGLE_CLIENT_ID:null,authProvider:googleReady()?'google':'chatgpt'};
    if(!user)return json({user:null,configured,price:PRICE,days:DAYS,...authentication});
    const g=await b.DB.prepare('SELECT MAX(ends_at) AS until FROM grants WHERE user_id=?').bind(user.userId).first<{until:number|null}>();
    const planner=await b.DB.prepare('SELECT data,version FROM planners WHERE user_id=?').bind(user.userId).first<{data:string,version:number}>();
    return json({user:{id:user.userId,email:user.email,name:user.displayName,provider:user.provider},isAdmin,configured,recipient:configured?{name:b.GCASH_NAME,number:b.GCASH_NUMBER}:null,price:PRICE,days:DAYS,premiumUntil:g?.until||0,planner:planner?JSON.parse(planner.data):null,version:planner?.version||0,...authentication});
  }
  if(!user)return fail('Sign in to continue.',401);
  if(path.startsWith('admin/')&&!isAdmin)return fail('Administrator access required.',403);
  if((path==='payments'||path==='admin/payments')&&req.method==='GET'){
    const list=path==='admin/payments'?await b.DB.prepare('SELECT * FROM payments ORDER BY created_at DESC').all():await b.DB.prepare('SELECT * FROM payments WHERE user_id=? ORDER BY created_at DESC').bind(user.userId).all();
    return json({rows:list.results.map(({proof_key,...row})=>row)});
  }
  if(path==='payments' && req.method==='POST'){
    if(!configured)return fail('GCash collection has not been configured. Please check back later.',503);
    if(Number(req.headers.get('content-length'))>3*1024*1024)return fail('Receipt is too large.',413);
    const recent=await b.DB.prepare('SELECT COUNT(*) AS count FROM payments WHERE user_id=? AND created_at>?').bind(user.userId,Date.now()-86400000).first<{count:number}>();
    if(recent && recent.count>=5)return fail('You have reached the daily receipt submission limit. Contact the StudyTrack team.',429);
    const pending=await b.DB.prepare("SELECT id FROM payments WHERE user_id=? AND status='pending'").bind(user.userId).first();
    if(pending)return fail('You already have a payment awaiting review.',409);
    const f=await req.formData(),name=checkedText(f.get('name'),100,'customer name'),reference=referenceKey(f.get('reference')),paidAt=paidDate(f.get('paidAt'));
    if(f.get('consent')!=='yes')return fail('Please agree to receipt review and semester reporting.');
    const proof=f.get('proof');
    if(!(proof instanceof File)||proof.size<8||proof.size>2*1024*1024)return fail('Upload a PNG or JPEG receipt up to 2 MB.');
    const bytes=new Uint8Array(await proof.arrayBuffer()),type=proofType(bytes);
    if(!type)return fail('Only PNG and JPEG receipts are accepted.');
    const id=crypto.randomUUID(),key='receipts/'+id,filename='proof-'+id+(type==='image/png'?'.png':'.jpg');
    await b.BUCKET.put(key,bytes,{httpMetadata:{contentType:type}});
    try{
      await b.DB.prepare(`INSERT INTO payments (id,user_id,name,email,reference,amount,duration,paid_at,created_at,status,proof_key,proof_type,proof_name,recipient_name,recipient_number) VALUES (?,?,?,?,?,?,?,?,?,'pending',?,?,?,?,?)`).bind(id,user.userId,name,user.email,reference,PRICE,DAYS,paidAt,Date.now(),key,type,filename,b.GCASH_NAME,b.GCASH_NUMBER).run();
    }catch(err){await b.BUCKET.delete(key);if(String(err).includes('UNIQUE'))return fail('This reference has already been submitted, or your account has a pending receipt.',409);throw err;}
    return json({id},201);
  }
  if(path.startsWith('proof/') && req.method==='GET'){
    const id=path.slice(6),p=await b.DB.prepare('SELECT * FROM payments WHERE id=?').bind(id).first<Record<string,any>>();
    if(!p||(!isAdmin&&p.user_id!==user.userId))return fail('Receipt not found.',404);
    const proof=await b.BUCKET.get(p.proof_key);if(!proof)return fail('Receipt file is unavailable.',404);
    return new Response(proof.body as BodyInit,{headers:{'Content-Type':p.proof_type,'Content-Disposition':`inline; filename="${p.proof_name}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
  }
  if(path.startsWith('admin/review/') && req.method==='POST'){
    const id=path.slice('admin/review/'.length),f=await req.json() as {status?:string,note?:string};
    if(!['approved','rejected'].includes(f.status||''))return fail('Select approve or reject.');
    const note=checkedText(f.note,500,'review note'),now=Date.now();
    const p=await b.DB.prepare('SELECT status FROM payments WHERE id=?').bind(id).first<{status:string}>();
    if(!p)return fail('Payment not found.',404);if(p.status!=='pending')return fail('This payment has already been reviewed.',409);
    if(f.status==='approved'){
      await b.DB.batch([
        b.DB.prepare(`INSERT OR IGNORE INTO grants (payment_id,user_id,starts_at,ends_at) SELECT p.id,p.user_id,MAX(?,COALESCE((SELECT MAX(ends_at) FROM grants WHERE user_id=p.user_id),0)),MAX(?,COALESCE((SELECT MAX(ends_at) FROM grants WHERE user_id=p.user_id),0))+p.duration*86400000 FROM payments p WHERE p.id=? AND p.status='pending'`).bind(now,now,id),
        b.DB.prepare("UPDATE payments SET status='approved',reviewed_at=?,reviewed_by=?,review_note=? WHERE id=? AND status='pending' AND EXISTS (SELECT 1 FROM grants WHERE payment_id=?)").bind(now,user.email,note,id,id),
      ]);
    }else await b.DB.prepare("UPDATE payments SET status='rejected',reviewed_at=?,reviewed_by=?,review_note=? WHERE id=? AND status='pending'").bind(now,user.email,note,id).run();
    const final=await b.DB.prepare('SELECT status FROM payments WHERE id=?').bind(id).first<{status:string}>();
    if(final?.status!==f.status)return fail('Another administrator already reviewed this receipt. Refresh to see the current decision.',409);
    return json({ok:true});
  }
  if(path==='planner' && req.method==='PUT'){
    if(Number(req.headers.get('content-length'))>4*1024*1024)return fail('Planner is too large.',413);
    const body=await req.json() as {state:unknown,expected:number};
    const data=Core.validateState(body.state);data.updatedAt=Date.now();
    const expected=body.expected;if(!Number.isInteger(expected)||expected<0)return fail('Invalid planner version.');
    const version=expected+1;
    const result=expected===0?await b.DB.prepare('INSERT OR IGNORE INTO planners (user_id,data,version) VALUES (?,?,?)').bind(user.userId,JSON.stringify(data),version).run():await b.DB.prepare('UPDATE planners SET data=?,version=? WHERE user_id=? AND version=?').bind(JSON.stringify(data),version,user.userId,expected).run();
    if(result.meta.changes!==1)return fail('Your planner changed in another window. Refresh before saving.',409);
    return json({state:data,version});
  }
  if(path==='premium/insights' && req.method==='GET'){
    const g=await b.DB.prepare('SELECT MAX(ends_at) AS until FROM grants WHERE user_id=?').bind(user.userId).first<{until:number}>();
    if(!g||g.until<=Date.now())return fail('Active premium access required.',403);
    const p=await b.DB.prepare('SELECT data FROM planners WHERE user_id=?').bind(user.userId).first<{data:string}>();
    const s=p?Core.validateState(JSON.parse(p.data)):Core.blank();
    const rows=s.subjects.map((subject:any)=>{const tasks=s.tasks.filter((t:any)=>t.subjectId===subject.id);return {name:subject.name,total:tasks.length,done:tasks.filter((t:any)=>t.status==='done').length,minutes:tasks.filter((t:any)=>t.status!=='done').reduce((n:number,t:any)=>n+t.effortMinutes,0)};});
    return json({rows,stats:Core.stats(s)});
  }
  return fail('Endpoint not found.',404);
}
async function safe(req:Request){try{
  // Consume bounded request bodies before any early response. This also avoids
  // local Worker proxy stream failures following rejected multipart requests.
  if(req.method!=='GET'&&req.body){
    const reader=req.body.getReader(),chunks:Uint8Array[]=[];let size=0;
    while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>4*1024*1024){await reader.cancel();return fail('Upload is too large.',413);}chunks.push(value);}
    const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}
    req=new Request(req.url,{method:req.method,headers:req.headers,body});
  }
  return await handler(req);
}catch(error){console.error('StudyTrack API failure',error instanceof Error?error.message:'unknown');if(error instanceof Error&&/^(Enter |Use |Only |Please |The payment date)/.test(error.message))return fail(error.message);return fail('The server could not complete this request. Please try again.',500);}}
export const GET=safe;export const POST=safe;export const PUT=safe;
