from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
original=(root/'lib/planner-original.html').read_text(encoding='utf-8')
core=re.findall(r'<script>(.*?)</script>',original,re.S)[0]
body=core.split("function () {",1)[1].rsplit('});',1)[0]
(root/'lib/planner-core.ts').write_text('// @ts-nocheck\nconst Core=(()=>{'+body+'})();\nexport default Core;\n',encoding='utf-8')
html=original
html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>','',html)
html=html.replace('</style>',(root/'lib/premium.css').read_text(encoding='utf-8')+'\n</style>',1)
start=html.index('  try {\n    persistedRaw=localStorage.getItem(KEY);')
end=html.index('  const ui=',start)
html=html[:start]+html[end:]
html=html.replace("['help','settings','Data & help']", "['premium','spark','Premium'],['tools','clock','Study tools'],['payments','shield','Payments'],['help','settings','Data & help']")
html=html.replace("help:'Data & help'", "premium:'Premium',tools:'Focus',payments:'Payments',help:'Settings'")
html=html.replace('<div class="side-note">${icon(\'shield\')}<strong>Your planner, on this device.</strong><p>No account needed. Export a backup to keep your work safe.</p></div>', '<div class="side-note" id="accountSide">Loading account…</div>')
html=html.replace('LOCAL MVP <span style="float:right">v0.1</span>','CLOUD PLANNER <span style="float:right">v0.2</span>')
html=html.replace('<div class="top-actions">','<div class="top-actions"><button id="planBadge" class="plan-pill" data-view="premium">Free plan</button>',1)
html=html.replace('Stored locally · About this MVP','Account & backups')
html=html.replace('<div id="banners"></div>','<div class="cloud-state" id="cloudState" aria-live="polite"></div><div id="banners"></div>')
start=html.index('  function commit(candidate,')
end=html.index('  function setView(',start)
html=html[:start]+'''  async function commit(candidate,{force=false,expected=null}={}){
    if(!account?.user){toast('Sign in before saving.',true);return false;}
    if(cloudSaving){toast('Please wait for your current save to finish.',true);return false;}
    if(expected!==null&&expected!==state.updatedAt){toast('The planner changed. Reopen this form before saving.',true);return false;}
    let next;try{next=C.validateState(candidate);}catch(err){toast(err.message,true);return false;}
    cloudSaving=true;$('#cloudState').textContent='Saving to your account…';
    try{const saved=await api('planner',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:next,expected:cloudVersion})});state=C.validateState(saved.state);cloudVersion=saved.version;cloudSaving=false;if(hasPremium())premiumInsights=await api('premium/insights');render();$('#cloudState').classList.remove('error');$('#cloudState').textContent='Saved to your account';return true;}
    catch(err){cloudSaving=false;$('#cloudState').textContent='Save failed: '+err.message;$('#cloudState').classList.add('error');toast(err.message,true);return false;}
  }
  async function mutate(fn,opts={}){const next=JSON.parse(JSON.stringify(state));fn(next);return commit(next,opts);}
'''+html[end:]
for name in ['saveTask','saveSubject','toggleTask']:
    html=html.replace('  function '+name+'(', '  async function '+name+'(')
html=html.replace('if(mutate(', 'if(await mutate(').replace('if(commit(', 'if(await commit(')
html=html.replace("document.addEventListener('submit',event=>", "document.addEventListener('submit',async event=>")
html=html.replace('help:renderHelp};','help:renderHelp,premium:renderPremium,payments:renderPayments,tools:renderTools};')
html=html.replace("    $('#view').innerHTML=renderers[ui.view]();", "    accountChrome();\n    $('#view').innerHTML=account?.user&&!loadError?renderers[ui.view]():renderAccess();")
html=html.replace("    if(ui.view==='tasks')updateTaskResults();", "    if(account?.user&&!loadError&&ui.view==='tasks')updateTaskResults();")
html=html.replace("    const act=el.dataset.act,id=el.dataset.id;", "    const act=el.dataset.act,id=el.dataset.id;\n    await premiumAction(act,id);\n    if(!account?.user)return;")
html=html.replace("    if(form.id==='taskForm')", "    if(form.id==='paymentForm'){await savePayment(form);return;}\n    if(form.id==='reviewForm'){await saveReview(form,event.submitter?.value);return;}\n    if(form.id==='taskForm')")
html=html.replace("document.addEventListener('input',event=>{", "document.addEventListener('input',event=>{if(event.target.id==='paymentSearch'){billingFilters.query=event.target.value;$('#paymentResults').innerHTML=paymentTable(filteredPayments(),true);}")
html=html.replace("  document.addEventListener('change',event=>{", "  document.addEventListener('change',event=>{\n    const map={paymentStatus:'status',paymentFrom:'from',paymentTo:'to'};if(map[event.target.id]){billingFilters[map[event.target.id]]=event.target.value;render();}\n    if(event.target.id==='focusMinutes'&&!timerEnd){timerMinutes=Number(event.target.value);timerRemaining=timerMinutes*60;if($('#timerDisplay'))$('#timerDisplay').textContent=timerText();}")
html=html.replace("  shell();render();if(firstRun)welcome();", "  shell();render();loadAccount(true);\n  setInterval(()=>{if(account?.user&&!cloudSaving&&!$('dialog[open]')&&!document.activeElement?.matches('input,textarea,select'))loadAccount();},60000);")
html=html.replace("  function renderHelp(){", (root/'lib/premium-ui.js').read_text(encoding='utf-8')+'\n  function renderHelp(){')
html=html.replace('<h3>Make it yours</h3>', '<h3>Your account</h3><p>${E(account.user.email)} · ${signOutButton()}</p><h3>Make it yours</h3>')
html=html.replace('A display name personalizes this browser. It is not a user account.','Your display name personalizes your cloud planner. Your signed-in account keeps records separate.')
html=html.replace('Only use non-sensitive academic information. Anyone with access to this browser profile can open the planner.','Your planner belongs to your signed-in account. Sign out when using a shared device.')
html=html.replace('Save in this browser when storage is available, and export/import backups.','Save to your signed-in cloud account, and export/import backups.')
html=html.replace('No login, cloud sync, team sharing, AI scheduling, school-portal integration, or background/push reminders.','Includes account sign-in, cloud sync, and optional premium tools. No AI scheduling, school-portal integration, or background/push reminders.')
html=html.replace('No account. No uploads. Data stays in this browser when saving is available. Sample tasks are fictional.','Your planner saves to your account. Sample tasks are fictional and do not include payments.')
html=html.replace('single-user prototype','cloud student planner')
html=html.replace('Single-user prototype · v0.1.0<br>Dates and times use the device’s current timezone. There is no server, tracking code, or external request in this app.','Cloud student planner · v0.2.0<br>Planner dates follow your device. Payment dates and reports use Asia/Manila. GCash transfers are manually verified by an administrator.')
html=html.replace('Opened as a local HTML file? Browser saving can vary. Keep the file in the same place and use backups, or run the included local server. Moving the file or switching to a server uses a different storage location.','Backups contain planner data only. Payment records and receipts are stored separately and are never overwritten by planner imports or resets.')
html=html.replace('This removes tasks, subjects, and study blocks from this app’s storage only.','This removes tasks, subjects, and study blocks from your cloud planner. Payment records and premium access remain.')
html=html.replace('a local-first student planner MVP.','a cloud student planner with GCash premium access.')
html=html.replace('No internet connection is needed for the downloaded single-file app.','An internet connection is required for sign-in and cloud saving.')
html=html.replace("  function setView(view){", "  function setView(view){if(view==='payments'&&!account?.isAdmin)return;")
(root/'lib/planner.html').write_text(html,encoding='utf-8')
(root/'app/page.tsx').write_text("import { redirect } from 'next/navigation';\nexport default function Home() { redirect('/study'); }\n",encoding='utf-8')
