import { authBindings, getAuth, googleReady } from './auth';

export type StudyUser={userId:string,email:string,displayName:string,provider:'google'};
export async function getStudyUser(headers:Headers):Promise<StudyUser|null>{
  const b=authBindings();
  if(googleReady()){
    const session=await getAuth().api.getSession({headers});
    if(!session?.user.emailVerified)return null;
    const u=session.user,email=u.email.trim().toLowerCase();
    const provider=await b.DB.prepare("SELECT account_id FROM auth_account WHERE user_id=? AND provider_id='google'").bind(u.id).first();
    if(!provider)return null;
    let link=await b.DB.prepare('SELECT app_user_id FROM identity_links WHERE auth_user_id=?').bind(u.id).first<{app_user_id:string}>();
    if(!link){
      let target=u.id;
      // Only Gmail addresses are authoritative for automatic legacy email linking.
      // Other Google-account email domains start separate records unless explicitly migrated.
      if(email.endsWith('@gmail.com')){
        const old=await b.DB.prepare('SELECT user_id FROM legacy_identities WHERE email=? UNION SELECT user_id FROM payments WHERE lower(email)=?').bind(email,email).all<{user_id:string}>();
        if(old.results.length===1)target=old.results[0].user_id;
      }
      await b.DB.prepare('INSERT OR IGNORE INTO identity_links (auth_user_id,app_user_id) VALUES (?,?)').bind(u.id,target).run();
      link=await b.DB.prepare('SELECT app_user_id FROM identity_links WHERE auth_user_id=?').bind(u.id).first<{app_user_id:string}>();
      // An existing link is never reassigned based on a mutable display/email field.
      if(!link)throw new Error('This previous account is already linked. Contact the StudyTrack administrator.');
    }
    return {userId:link.app_user_id,email,displayName:u.name||email,provider:'google'};
  }
  // Hosting identity headers are not authentication on Vercel.
  return null;
}
