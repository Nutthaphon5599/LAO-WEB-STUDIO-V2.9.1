const V25_I18N={
 lo:{appointments:'ການນັດໝາຍລູກຄ້າ',addAppointment:'+ ເພີ່ມນັດໝາຍ',team:'ທີມງານ',files:'ໄຟລ໌ລູກຄ້າ',upload:'ອັບໂຫຼດໄຟລ໌',noAppointments:'ຍັງບໍ່ມີການນັດໝາຍ',upcoming:'ນັດໝາຍທີ່ກຳລັງມາ',staff:'ພະນັກງານ'},
 th:{appointments:'นัดหมายลูกค้า',addAppointment:'+ เพิ่มนัดหมาย',team:'ทีมงาน',files:'ไฟล์ลูกค้า',upload:'อัปโหลดไฟล์',noAppointments:'ยังไม่มีนัดหมาย',upcoming:'นัดหมายที่กำลังมาถึง',staff:'พนักงาน'},
 en:{appointments:'Customer appointments',addAppointment:'+ Add appointment',team:'Team',files:'Client files',upload:'Upload file',noAppointments:'No appointments yet',upcoming:'Upcoming appointments',staff:'Employees'}
};
const v25t=k=>(V25_I18N[window.lang||'lo']||V25_I18N.lo)[k]||k;
let v25Appointments=[],v25Files=[],v25Team=[];
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
async function v25Load(){
 const [a,f,e]=await Promise.all([
  lwsSupabase.from('appointments').select('*').order('appointment_at',{ascending:true}),
  lwsSupabase.from('client_files').select('*').order('created_at',{ascending:false}),
  lwsSupabase.from('employees').select('*').order('created_at')
 ]);
 if(a.error)throw a.error;if(f.error)throw f.error;if(e.error)throw e.error;
 v25Appointments=a.data||[];v25Files=f.data||[];v25Team=e.data||[];
 v25PaintAppointments();v25PaintTeam();v25EnhanceCards();v25EnhanceDashboard();
}
function v25PaintAppointments(){
 const el=document.getElementById('v25-appointments');if(!el)return;
 el.innerHTML=v25Appointments.length?v25Appointments.map(a=>`<article><div><b>${esc(a.title)}</b><span>${new Date(a.appointment_at).toLocaleString()}</span></div><div><small>${esc(a.channel)} · ${esc(a.owner_name)}</small><p>${esc(a.note||'')}</p></div><select data-v25-appt-status="${a.id}"><option value="scheduled" ${a.status==='scheduled'?'selected':''}>Scheduled</option><option value="completed" ${a.status==='completed'?'selected':''}>Completed</option><option value="cancelled" ${a.status==='cancelled'?'selected':''}>Cancelled</option></select><button class="text-btn danger" data-v25-appt-delete="${a.id}">×</button></article>`).join(''):`<p class="empty-admin">${v25t('noAppointments')}</p>`;
}
function v25PaintTeam(){const el=document.getElementById('v25-team');if(!el)return;el.innerHTML=v25Team.map(e=>`<article><div><b>${esc(e.name)}</b><span>${esc(e.email||'')}</span></div><span class="status-pill status-contacted">${esc(e.role)}</span>${e.role!=='owner'?`<button class="text-btn danger" data-v25-employee-delete="${e.id}">×</button>`:''}</article>`).join('');}
function v25EnhanceDashboard(){const dash=document.getElementById('v24-dashboard');if(!dash||dash.querySelector('[data-v25-upcoming]'))return;const upcoming=v25Appointments.filter(a=>a.status==='scheduled'&&new Date(a.appointment_at)>=new Date()).length;dash.insertAdjacentHTML('beforeend',`<div data-v25-upcoming><span>${v25t('upcoming')}</span><b>${upcoming}</b></div>`);}
function v25EnhanceCards(){document.querySelectorAll('.lead-item').forEach(card=>{if(card.querySelector('.v25-files'))return;const id=String(card.dataset.id);const files=v25Files.filter(f=>String(f.lead_id)===id);const box=document.createElement('div');box.className='v25-files';box.innerHTML=`<div><b>${v25t('files')}</b><span>${files.length}</span></div><div class="v25-file-list">${files.map(f=>`<button class="text-btn" data-v25-download="${f.id}">${esc(f.file_name)}</button>`).join('')||'—'}</div><label class="btn btn-secondary small">${v25t('upload')}<input type="file" hidden data-v25-file="${id}"></label>`;card.appendChild(box);});}
async function v25AddAppointment(){const leads=window.cachedLeads||[];const name=prompt('Appointment title');if(!name)return;const date=prompt('Date and time (YYYY-MM-DDTHH:MM)',new Date(Date.now()+864e5).toISOString().slice(0,16));if(!date)return;const leadId=prompt('Lead ID (optional)',leads[0]?.id||'')||null;const note=prompt('Note','')||null;const {error}=await lwsSupabase.from('appointments').insert({title:name,appointment_at:new Date(date).toISOString(),lead_id:leadId?String(leadId):null,note});if(error)throw error;await v25Load();}
async function v25Upload(input){const file=input.files?.[0];if(!file)return;const leadId=input.dataset.v25File;const path=`${leadId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;const up=await lwsSupabase.storage.from('client-files').upload(path,file);if(up.error)throw up.error;const {error}=await lwsSupabase.from('client_files').insert({lead_id:String(leadId),file_name:file.name,file_path:path,file_type:file.type,file_size:file.size});if(error)throw error;await v25Load();show('File uploaded ✓');}
async function v25Download(id){const f=v25Files.find(x=>x.id===id);if(!f)return;const {data,error}=await lwsSupabase.storage.from('client-files').createSignedUrl(f.file_path,60);if(error)throw error;window.open(data.signedUrl,'_blank');}
document.getElementById('v25-add-appointment')?.addEventListener('click',()=>v25AddAppointment().catch(e=>show(e.message,'error')));
document.getElementById('v25-team-form')?.addEventListener('submit',async e=>{e.preventDefault();const payload={name:document.getElementById('v25-team-name').value.trim(),email:document.getElementById('v25-team-email').value.trim()||null,role:document.getElementById('v25-team-role').value};const {error}=await lwsSupabase.from('employees').insert(payload);if(error)return show(error.message,'error');e.target.reset();await v25Load();});
document.addEventListener('change',async e=>{try{if(e.target.dataset.v25File)await v25Upload(e.target);const id=e.target.dataset.v25ApptStatus;if(id){const {error}=await lwsSupabase.from('appointments').update({status:e.target.value,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;await v25Load();}}catch(err){show(err.message,'error')}});
document.addEventListener('click',async e=>{try{const d=e.target.dataset.v25Download;if(d)await v25Download(d);const a=e.target.dataset.v25ApptDelete;if(a){await lwsSupabase.from('appointments').delete().eq('id',a);await v25Load();}const emp=e.target.dataset.v25EmployeeDelete;if(emp){await lwsSupabase.from('employees').delete().eq('id',emp);await v25Load();}}catch(err){show(err.message,'error')}});
const v25Observer=new MutationObserver(()=>v25EnhanceCards());
window.addEventListener('load',()=>setTimeout(async()=>{try{document.getElementById('v25-appointments-title').textContent=v25t('appointments');document.getElementById('v25-add-appointment').textContent=v25t('addAppointment');document.getElementById('v25-team-title').textContent=v25t('team');await v25Load();v25Observer.observe(document.getElementById('lead-list'),{childList:true});}catch(e){console.warn('V2.5 migration required:',e.message)}},900));
