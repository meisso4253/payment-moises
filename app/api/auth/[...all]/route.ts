import { getAuth, googleReady } from '../../../../lib/auth';
export const dynamic='force-dynamic';
async function handle(req:Request){
  try{
  const path=new URL(req.url).pathname.replace('/api/auth','');
  if(req.method==='POST'){
    const reader=req.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
    if(reader)while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>16*1024){await reader.cancel();return Response.json({error:'Request too large.'},{status:413});}chunks.push(value);}
    const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}
    if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Request origin is not allowed.'},{status:403});
    req=new Request(req.url,{method:req.method,headers:req.headers,body});
  }
    if(!['/ok','/get-session','/sign-out','/one-tap/callback'].includes(path))return Response.json({error:'Not found.'},{status:404});
    if(!googleReady())return Response.json({error:'Google sign-in is awaiting the owner’s deployment configuration.'},{status:503,headers:{'Cache-Control':'no-store'}});
    const response=await getAuth().handler(req);const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');
    return new Response(response.body,{status:response.status,headers});
  }catch(error){console.error('StudyTrack authentication failed',error instanceof Error?error.name:'unknown');return Response.json({error:'Unable to sign in. Please try again.'},{status:500});}
}
export const GET=handle;export const POST=handle;
