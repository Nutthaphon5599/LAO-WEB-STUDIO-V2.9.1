
(function(){
'use strict';
const $=s=>document.querySelector(s),sb=()=>window.lwsSupabase;
let tasks=[],invoices=[],payments=[],updates=[];
const I=()=>window.LWS_I18N; const money=(n,c='ກີບ')=>I().money(n,c); const tr=k=>I().tr(k);
async function load(){
 if(!sb())return;
 const [t,i,p,u]=await Promise.all([
  sb().from('tasks').select('*').order('sort_order'),
  sb().from('invoices').select('*').order('created_at',{ascending:false}),
  sb().from('payments').select('*').order('payment_date',{ascending:false}),
  sb().from('project_updates').select('*').order('created_at',{ascending:false})
 ]);
 if(t.error||i.error||p.error||u.error){const w=$('#v27-warning');if(w){w.hidden=false;w.textContent='กรุณา Run supabase-migration-v2.7-company-management.sql';}return}
 tasks=t.data||[];invoices=i.data||[];payments=p.data||[];updates=u.data||[];
 paintKanban();paintInvoices();paintReports();paintUpdates();
}
function paintKanban(){
 const root=$('#v27-kanban');if(!root)return;
 const columns=[['todo',tr('todo')],['in_progress',tr('in_progress')],['review',tr('review')],['completed',tr('completed')]];
 root.innerHTML=columns.map(([status,label])=>`<section class="kanban-col" data-drop-status="${status}"><header><b>${label}</b><span>${tasks.filter(x=>x.status===status).length}</span></header><div class="kanban-cards">${tasks.filter(x=>x.status===status).map(x=>`<article draggable="true" data-task-id="${x.id}" class="kanban-card"><b>${x.title}</b><small>${x.project_name||''}</small><progress max="100" value="${x.progress||0}"></progress><span>${x.progress||0}% · ${x.priority}</span></article>`).join('')}</div></section>`).join('');
 root.querySelectorAll('[draggable]').forEach(c=>c.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',c.dataset.taskId)));
 root.querySelectorAll('[data-drop-status]').forEach(col=>{
  col.addEventListener('dragover',e=>e.preventDefault());
  col.addEventListener('drop',async e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain'),status=col.dataset.dropStatus;
   await sb().from('tasks').update({status,progress:status==='completed'?100:undefined,updated_at:new Date().toISOString()}).eq('id',id);load();
  });
 });
}
function paintInvoices(){
 const root=$('#v27-invoice-list');if(!root)return;
 root.innerHTML=invoices.map(i=>{const paid=payments.filter(p=>p.invoice_id===i.id).reduce((a,b)=>a+Number(b.amount),0);
 return `<article class="v27-row"><div><b>${i.invoice_number}</b><span>${i.customer_name} · ${i.project_name||''}</span></div><strong>${money(i.total,i.currency)}</strong><span class="status-pill status-${i.status}">${tr(i.status)}</span><small>Paid ${money(paid,i.currency)}</small><button data-pay="${i.id}">+ ${tr('payment')}</button></article>`}).join('')||`<p>${tr('noInvoices')}</p>`;
}
function paintReports(){
 const root=$('#v27-report');if(!root)return;
 const revenue=payments.reduce((a,b)=>a+Number(b.amount),0),outstanding=invoices.reduce((a,i)=>a+Number(i.total),0)-revenue;
 const paid=invoices.filter(x=>x.status==='paid').length,active=tasks.filter(x=>!['completed','cancelled'].includes(x.status)).length;
 root.innerHTML=`<div><span>${tr('recordedRevenue')}</span><b>${money(revenue)}</b></div><div><span>${tr('outstanding')}</span><b>${money(Math.max(0,outstanding))}</b></div><div><span>${tr('paidInvoices')}</span><b>${paid}</b></div><div><span>${tr('activeTasks')}</span><b>${active}</b></div>`;
}
function paintUpdates(){
 const root=$('#v27-update-list');if(!root)return;
 root.innerHTML=updates.map(u=>`<article class="v27-row"><div><b>${u.project_name}</b><span>${u.title}</span></div><progress max="100" value="${u.progress}"></progress><span>${tr(u.status)}</span></article>`).join('')||`<p>${tr('noUpdates')}</p>`;
}
document.addEventListener('submit',async e=>{
 if(e.target.id==='v27-invoice-form'){
  e.preventDefault();const total=Number($('#inv-subtotal').value||0)-Number($('#inv-discount').value||0)+Number($('#inv-tax').value||0);
  const payload={invoice_number:$('#inv-number').value.trim(),customer_name:$('#inv-customer').value.trim(),customer_email:$('#inv-email').value.trim()||null,project_name:$('#inv-project').value.trim()||null,subtotal:Number($('#inv-subtotal').value||0),discount:Number($('#inv-discount').value||0),tax:Number($('#inv-tax').value||0),total,currency:$('#inv-currency').value||'ກີບ',due_date:$('#inv-due').value||null,status:'sent'};
  const {error}=await sb().from('invoices').insert(payload);if(error)return alert(error.message);e.target.reset();load();
 }
 if(e.target.id==='v27-update-form'){
  e.preventDefault();const payload={project_name:$('#up-project').value.trim(),title:$('#up-title').value.trim(),message:$('#up-message').value.trim(),progress:Number($('#up-progress').value||0),status:$('#up-status').value,is_visible_to_customer:true};
  const {error}=await sb().from('project_updates').insert(payload);if(error)return alert(error.message);e.target.reset();load();
 }
});
document.addEventListener('click',async e=>{
 if(e.target.dataset.pay){const amount=prompt(`${tr('payment')} (ກີບ)`);if(!amount)return;const {error}=await sb().from('payments').insert({invoice_id:e.target.dataset.pay,amount:Number(amount),currency:'ກີບ'});if(error)alert(error.message);else load();}
 if(e.target.id==='v27-logout')window.lwsSignOut();
});
window.addEventListener('load',()=>setTimeout(load,900));
})();
