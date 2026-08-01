
(async function(){
 const sb=window.lwsSupabase,$=s=>document.querySelector(s),I=()=>window.LWS_I18N,tr=k=>I().tr(k);
 const {data:{user}}=await sb.auth.getUser();if(!user)return;
 $('#portal-email').textContent=user.email||'';
 const [inv,up,tasks]=await Promise.all([
  sb.from('invoices').select('*').eq('customer_user_id',user.id).order('created_at',{ascending:false}),
  sb.from('project_updates').select('*').eq('customer_user_id',user.id).eq('is_visible_to_customer',true).order('created_at',{ascending:false}),
  sb.from('tasks').select('*').eq('customer_user_id',user.id).order('created_at',{ascending:false})
 ]);
 $('#portal-invoices').innerHTML=(inv.data||[]).map(x=>`<article><b>${x.invoice_number}</b><span>${x.project_name||''}</span><strong>${I().money(x.total,x.currency)}</strong><em>${tr(x.status)}</em><small>${tr('dueDate')}: ${I().date(x.due_date)}</small></article>`).join('')||`<p>${tr('noInvoices')}</p>`;
 $('#portal-updates').innerHTML=(up.data||[]).map(x=>`<article><b>${x.project_name}</b><span>${x.title}</span><progress max="100" value="${x.progress}"></progress><em>${x.progress}% · ${tr(x.status)}</em><p>${x.message||''}</p></article>`).join('')||`<p>${tr('noUpdates')}</p>`;
 $('#portal-tasks').innerHTML=(tasks.data||[]).map(x=>`<article><b>${x.title}</b><span>${tr(x.status)}</span><progress max="100" value="${x.progress||0}"></progress></article>`).join('')||`<p>${tr('noTasks')}</p>`;
 sb.channel('customer-live').on('postgres_changes',{event:'*',schema:'public',table:'project_updates'},()=>location.reload()).subscribe();
 $('#portal-logout').onclick=()=>window.lwsSignOut();
})();
