import { env } from 'cloudflare:workers';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { oneTap } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

export type AuthBindings={DB:D1Database,GOOGLE_CLIENT_ID?:string,BETTER_AUTH_SECRET?:string,APP_ORIGIN?:string};
export const authBindings=()=>env as unknown as AuthBindings;
export function googleReady(){const b=authBindings();return !!b.BETTER_AUTH_SECRET && /^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(b.GOOGLE_CLIENT_ID||'');}
export function getAuth(){
  const b=authBindings();if(!b.BETTER_AUTH_SECRET)throw new Error('Authentication is not configured.');
  if(!b.APP_ORIGIN)throw new Error('Authentication origin is not configured.');
  const origin=new URL(b.APP_ORIGIN).origin;
  return betterAuth({
    appName:'StudyTrack',baseURL:origin,basePath:'/api/auth',secret:b.BETTER_AUTH_SECRET,
    database:drizzleAdapter(drizzle(b.DB,{schema}),{provider:'sqlite',schema,transaction:false}),
    trustedOrigins:[origin],
    emailAndPassword:{enabled:false},
    plugins:googleReady()?[oneTap({clientId:b.GOOGLE_CLIENT_ID})]:[],
    session:{expiresIn:7*86400,updateAge:86400,cookieCache:{enabled:false}},
    account:{accountLinking:{enabled:false}},
    rateLimit:{enabled:true,storage:'database',window:60,max:30,customRules:{'/one-tap/callback':{window:60,max:10}}},
    advanced:{cookiePrefix:'studytrack',useSecureCookies:origin.startsWith('https:'),defaultCookieAttributes:{httpOnly:true,sameSite:'lax',path:'/'},ipAddress:{ipAddressHeaders:['cf-connecting-ip']}},
    user:{deleteUser:{enabled:false}},
  });
}
