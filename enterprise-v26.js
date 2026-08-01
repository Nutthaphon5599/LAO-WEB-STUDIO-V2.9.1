
(() => {
'use strict';
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast = (m, type='') => {
  const el = $('#global-status'); if(!el) return;
  el.textContent=m; el.className='save-status '+type;
  clearTimeout(window.__entToast); window.__entToast=setTimeout(()=>el.textContent='',3500);
};
const db = () => window.lwsSupabase;
const lang = () => localStorage.getItem('lws_admin_lang') || 'lo';
const t = (lo,th,en) => lang()==='th'?th:lang()==='en'?en:lo;
let tasks=[], services=[], notifications=[], activities=[], employees=[], permissions=[], settings=null;

async function logActivity(action, entityType='', entityId='', detail=''){
  try { await db().from('activities').insert({action,entity_type:entityType,entity_id:String(entityId||''),detail,actor_name:'Nutthaphon'}); } catch(_){}
}
async function createNotification(title,message,type='info',relatedType='',relatedId=''){
  await db().from('notifications').insert({title,message,type,related_type:relatedType,related_id:String(relatedId||''),recipient_name:'Nutthaphon'});
}
function fmtDate(v){ if(!v)return '—'; return new Date(v).toLocaleDateString(lang()==='lo'?'lo-LA':lang()==='th'?'th-TH':'en-US'); }
function money(v,c='ກີບ'){ return `${Number(v||0).toLocaleString()} ${c}`; }

async function loadEnterprise(){
  if(!db()) return;
  const queries = await Promise.all([
    db().from('tasks').select('*').order('created_at',{ascending:false}),
    db().from('services').select('*').order('sort_order'),
    db().from('notifications').select('*').order('created_at',{ascending:false}).limit(100),
    db().from('activities').select('*').order('created_at',{ascending:false}).limit(50),
    db().from('employees').select('*').order('created_at'),
    db().from('roles_permissions').select('*').order('role'),
    db().from('company_settings').select('*').eq('id',1).maybeSingle()
  ]);
  const firstErr=queries.find(x=>x.error)?.error; if(firstErr) throw firstErr;
  [tasks,services,notifications,activities,employees,permissions]=queries.slice(0,6).map(x=>x.data||[]);
  settings=queries[6].data||{};
  paintAll();
}
function paintAll(){ paintDashboard(); paintTasks(); paintServices(); paintNotifications(); paintActivities(); paintSettings(); paintPermissions(); }

function paintDashboard(){
  const el=$('#enterprise-dashboard'); if(!el)return;
  const open=tasks.filter(x=>!['completed','cancelled'].includes(x.status)).length;
  const overdue=tasks.filter(x=>x.due_date && new Date(x.due_date)<new Date(new Date().toDateString()) && !['completed','cancelled'].includes(x.status)).length;
  const unread=notifications.filter(x=>!x.is_read).length;
  const activeServices=services.filter(x=>x.is_active).length;
  el.innerHTML=`<div><span>${t('ວຽກທີ່ເປີດ','งานที่เปิด','Open tasks')}</span><b>${open}</b></div>
  <div><span>${t('ວຽກເກີນກຳນົດ','งานเกินกำหนด','Overdue')}</span><b>${overdue}</b></div>
  <div><span>${t('ແຈ້ງເຕືອນໃໝ່','แจ้งเตือนใหม่','Unread alerts')}</span><b>${unread}</b></div>
  <div><span>${t('ບໍລິການທີ່ເປີດ','บริการที่เปิด','Active services')}</span><b>${activeServices}</b></div>`;
}
function paintTasks(){
 const el=$('#enterprise-task-list');if(!el)return;
 const filter=$('#task-status-filter')?.value||'all';
 const rows=tasks.filter(x=>filter==='all'||x.status===filter);
 el.innerHTML=rows.length?rows.map(x=>`<article class="enterprise-row">
 <div class="enterprise-row-main"><b>${esc(x.title)}</b><span>${esc(x.project_name||'')} ${x.due_date?'· '+fmtDate(x.due_date):''}</span><small>${esc(x.assigned_to||'Nutthaphon')} · ${esc(x.priority)}</small></div>
 <div class="progress-wrap"><progress max="100" value="${x.progress||0}"></progress><span>${x.progress||0}%</span></div>
 <select data-task-status="${x.id}"><option value="todo" ${x.status==='todo'?'selected':''}>Todo</option><option value="in_progress" ${x.status==='in_progress'?'selected':''}>In progress</option><option value="review" ${x.status==='review'?'selected':''}>Review</option><option value="completed" ${x.status==='completed'?'selected':''}>Completed</option><option value="cancelled" ${x.status==='cancelled'?'selected':''}>Cancelled</option></select>
 <button class="text-btn" data-task-edit="${x.id}">${t('ແກ້ໄຂ','แก้ไข','Edit')}</button><button class="text-btn danger" data-task-delete="${x.id}">×</button></article>`).join(''):`<p class="empty-admin">${t('ຍັງບໍ່ມີວຽກ','ยังไม่มีงาน','No tasks yet')}</p>`;
}
function openTask(x={}){
 $('#task-id').value=x.id||''; $('#task-title').value=x.title||''; $('#task-project').value=x.project_name||'';
 $('#task-owner').value=x.assigned_to||'Nutthaphon'; $('#task-due').value=x.due_date||''; $('#task-priority').value=x.priority||'medium';
 $('#task-progress').value=x.progress||0; $('#task-description').value=x.description||''; $('#task-modal').hidden=false;
}
function closeTask(){ if($('#task-modal')) $('#task-modal').hidden=true; }
async function saveTask(e){
 e.preventDefault();const id=$('#task-id').value;
 const payload={title:$('#task-title').value.trim(),project_name:$('#task-project').value.trim()||null,assigned_to:$('#task-owner').value.trim()||'Nutthaphon',due_date:$('#task-due').value||null,priority:$('#task-priority').value,progress:Number($('#task-progress').value||0),description:$('#task-description').value.trim()||null,updated_at:new Date().toISOString()};
 const q=id?db().from('tasks').update(payload).eq('id',id):db().from('tasks').insert(payload).select().single();
 const {data,error}=await q;if(error)throw error;
 await logActivity(id?'Updated task':'Created task','task',id||data?.id,payload.title);
 if(!id) await createNotification(t('ສ້າງວຽກໃໝ່','สร้างงานใหม่','New task'),payload.title,'info','task',data?.id);
 closeTask(); await loadEnterprise(); toast(t('ບັນທຶກແລ້ວ','บันทึกแล้ว','Saved'));
}

function paintServices(){
 const el=$('#enterprise-service-list');if(!el)return;
 el.innerHTML=services.length?services.map(s=>`<article class="enterprise-row"><div class="enterprise-row-main"><b>${esc(lang()==='th'?s.name_th:lang()==='en'?s.name_en:s.name_lo)}</b><span>${money(s.base_price,s.currency)}</span></div><span class="status-pill ${s.is_active?'status-contacted':'status-cancelled'}">${s.is_active?'Active':'Hidden'}</span><button class="text-btn" data-service-edit="${s.id}">${t('ແກ້ໄຂ','แก้ไข','Edit')}</button><button class="text-btn danger" data-service-delete="${s.id}">×</button></article>`).join(''):'';
}
function openService(s={}){
 ['id','lo','th','en','price','currency','order'].forEach(k=>{const el=$('#service-'+k);if(el)el.value=''});
 $('#service-id').value=s.id||'';$('#service-lo').value=s.name_lo||'';$('#service-th').value=s.name_th||'';$('#service-en').value=s.name_en||'';$('#service-price').value=s.base_price||0;$('#service-currency').value=s.currency||'ກີບ';$('#service-order').value=s.sort_order||0;$('#service-active').checked=s.is_active!==false;$('#service-modal').hidden=false;
}
function closeService(){if($('#service-modal'))$('#service-modal').hidden=true}
async function saveService(e){
 e.preventDefault();const id=$('#service-id').value,payload={name_lo:$('#service-lo').value.trim(),name_th:$('#service-th').value.trim(),name_en:$('#service-en').value.trim(),base_price:Number($('#service-price').value||0),currency:$('#service-currency').value.trim()||'ກີບ',sort_order:Number($('#service-order').value||0),is_active:$('#service-active').checked,updated_at:new Date().toISOString()};
 const q=id?db().from('services').update(payload).eq('id',id):db().from('services').insert(payload).select().single();const {data,error}=await q;if(error)throw error;
 await logActivity(id?'Updated service':'Created service','service',id||data?.id,payload.name_en||payload.name_lo);closeService();await loadEnterprise();toast('Saved');
}

function paintNotifications(){
 const el=$('#enterprise-notification-list');if(!el)return;
 el.innerHTML=notifications.length?notifications.map(n=>`<article class="enterprise-row ${n.is_read?'':'unread'}"><div class="enterprise-row-main"><b>${esc(n.title)}</b><span>${esc(n.message||'')}</span><small>${new Date(n.created_at).toLocaleString()}</small></div>${n.is_read?'':`<button class="text-btn" data-notification-read="${n.id}">${t('ອ່ານແລ້ວ','อ่านแล้ว','Mark read')}</button>`}<button class="text-btn danger" data-notification-delete="${n.id}">×</button></article>`).join(''):'';
}
function paintActivities(){
 const el=$('#enterprise-activity-list');if(!el)return;
 el.innerHTML=activities.map(a=>`<article class="activity-item"><span>${esc(a.action)}</span><b>${esc(a.detail||'')}</b><small>${esc(a.actor_name)} · ${new Date(a.created_at).toLocaleString()}</small></article>`).join('')||'—';
}
function paintSettings(){
 if(!$('#settings-company'))return;
 $('#settings-company').value=settings.company_name||'Lao Web Studio';$('#settings-phone').value=settings.phone||'';$('#settings-whatsapp').value=settings.whatsapp||'';$('#settings-email').value=settings.email||'';$('#settings-domain').value=settings.domain||'';$('#settings-facebook').value=settings.facebook||'';$('#settings-address').value=settings.address_lo||'';$('#settings-maps').value=settings.google_maps_url||'';$('#settings-currency').value=settings.currency||'ກີບ';
}
async function saveSettings(e){
 e.preventDefault();const payload={id:1,company_name:$('#settings-company').value.trim(),phone:$('#settings-phone').value.trim(),whatsapp:$('#settings-whatsapp').value.trim(),email:$('#settings-email').value.trim(),domain:$('#settings-domain').value.trim(),facebook:$('#settings-facebook').value.trim(),address_lo:$('#settings-address').value.trim(),google_maps_url:$('#settings-maps').value.trim(),currency:$('#settings-currency').value.trim(),updated_at:new Date().toISOString()};
 const {error}=await db().from('company_settings').upsert(payload);if(error)throw error;await logActivity('Updated company settings','settings','1',payload.company_name);settings=payload;toast('Saved');
}
function paintPermissions(){
 const el=$('#enterprise-permissions');if(!el)return;
 const cols=['dashboard','leads','calendar','quotations','files','tasks','projects','pricing','services','team','settings','notifications'];
 el.innerHTML=`<div class="permission-grid permission-head"><b>Role</b>${cols.map(c=>`<b>${c}</b>`).join('')}</div>`+permissions.map(r=>`<div class="permission-grid"><b>${esc(r.role)}</b>${cols.map(c=>`<input type="checkbox" data-permission-role="${r.role}" data-permission-key="${c}" ${r[c]?'checked':''} ${r.role==='owner'?'disabled':''}>`).join('')}</div>`).join('');
}

document.addEventListener('submit',e=>{
 try{
  if(e.target.id==='task-form')saveTask(e).catch(x=>toast(x.message,'error'));
  if(e.target.id==='service-form')saveService(e).catch(x=>toast(x.message,'error'));
  if(e.target.id==='company-settings-form')saveSettings(e).catch(x=>toast(x.message,'error'));
 }catch(x){toast(x.message,'error')}
});
document.addEventListener('change',async e=>{
 try{
  const taskId=e.target.dataset.taskStatus;if(taskId){const {error}=await db().from('tasks').update({status:e.target.value,progress:e.target.value==='completed'?100:undefined,updated_at:new Date().toISOString()}).eq('id',taskId);if(error)throw error;await logActivity('Changed task status','task',taskId,e.target.value);await loadEnterprise();}
  const role=e.target.dataset.permissionRole,key=e.target.dataset.permissionKey;if(role&&key){const {error}=await db().from('roles_permissions').update({[key]:e.target.checked,updated_at:new Date().toISOString()}).eq('role',role);if(error)throw error;toast('Permission updated');}
  if(e.target.id==='task-status-filter')paintTasks();
 }catch(x){toast(x.message,'error')}
});
document.addEventListener('click',async e=>{
 try{
  if(e.target.id==='enterprise-add-task')openTask();
  if(e.target.id==='enterprise-add-service')openService();
  if(e.target.matches('[data-enterprise-close]')){closeTask();closeService();}
  const te=e.target.dataset.taskEdit;if(te)openTask(tasks.find(x=>x.id===te));
  const td=e.target.dataset.taskDelete;if(td&&confirm('Delete task?')){const {error}=await db().from('tasks').delete().eq('id',td);if(error)throw error;await logActivity('Deleted task','task',td,'');await loadEnterprise();}
  const se=e.target.dataset.serviceEdit;if(se)openService(services.find(x=>x.id===se));
  const sd=e.target.dataset.serviceDelete;if(sd&&confirm('Delete service?')){const {error}=await db().from('services').delete().eq('id',sd);if(error)throw error;await loadEnterprise();}
  const nr=e.target.dataset.notificationRead;if(nr){const {error}=await db().from('notifications').update({is_read:true}).eq('id',nr);if(error)throw error;await loadEnterprise();}
  const nd=e.target.dataset.notificationDelete;if(nd){const {error}=await db().from('notifications').delete().eq('id',nd);if(error)throw error;await loadEnterprise();}
  if(e.target.id==='mark-all-read'){const {error}=await db().from('notifications').update({is_read:true}).eq('is_read',false);if(error)throw error;await loadEnterprise();}
 }catch(x){toast(x.message,'error')}
});
window.addEventListener('load',()=>setTimeout(()=>loadEnterprise().catch(e=>{
 console.warn('Run supabase-migration-v2.6.1-enterprise.sql:',e.message);
 const el=$('#enterprise-migration-warning');if(el){el.hidden=false;el.textContent=t('ກະລຸນາ Run supabase-migration-v2.6.1-enterprise.sql ກ່ອນ','กรุณา Run supabase-migration-v2.6.1-enterprise.sql ก่อน','Please run supabase-migration-v2.6.1-enterprise.sql first');}
}),1200));
})();
