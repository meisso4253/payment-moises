import { database } from '../db/client';
import { getDb } from '../db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { oneTap } from 'better-auth/plugins';
import * as schema from '../db/schema';

export type AuthBindings={DB:typeof database,GOOGLE_CLIENT_ID?:string,BETTER_AUTH_SECRET?:string,APP_ORIGIN?:string};
export const authBindings=():AuthBindings=>({DB:database,GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID,BETTER_AUTH_SECRET:process.env.BETTER_AUTH_SECRET,APP_ORIGIN:process.env.APP_ORIGIN});
export function googleReady(){const b=authBindings();return !!process.env.TURSO_DATABASE_URL && !!b.APP_ORIGIN && !!b.BETTER_AUTH_SECRET && /^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(b.GOOGLE_CLIENT_ID||'');}
export function getAuth(){
  const b=authBindings();if(!b.BETTER_AUTH_SECRET)throw new Error('Authentication is not configured.');
  if(!b.APP_ORIGIN)throw new Error('Authentication origin is not configured.');
  const origin=new URL(b.APP_ORIGIN).origin;
  return betterAuth({
    appName:'StudyTrack',baseURL:origin,basePath:'/api/auth',secret:b.BETTER_AUTH_SECRET,
    database:drizzleAdapter(getDb(),{provider:'sqlite',schema,transaction:true}),
    trustedOrigins:[origin],
    emailAndPassword:{enabled:false},
    plugins:googleReady()?[oneTap({clientId:b.GOOGLE_CLIENT_ID})]:[],
    session:{expiresIn:7*86400,updateAge:86400,cookieCache:{enabled:false}},
    account:{accountLinking:{enabled:false}},
    rateLimit:{enabled:true,storage:'database',window:60,max:30,customRules:{'/one-tap/callback':{window:60,max:10}}},
    advanced:{cookiePrefix:'studytrack',useSecureCookies:origin.startsWith('https:'),defaultCookieAttributes:{httpOnly:true,sameSite:'lax',path:'/'},ipAddress:{ipAddressHeaders:['x-forwarded-for']}},
    user:{deleteUser:{enabled:false}},
  });
}
