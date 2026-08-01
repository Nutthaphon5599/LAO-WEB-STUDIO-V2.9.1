
(function(){
'use strict';
const translations={
 lo:{
  sending:'ກຳລັງສົ່ງຄຳຂໍ...',
  success:'ສົ່ງຄຳຂໍສຳເລັດແລ້ວ ທີມງານຈະຕິດຕໍ່ກັບໄວໆນີ້',
  failed:'ບໍ່ສາມາດສົ່ງຄຳຂໍໄດ້ ກະລຸນາລອງໃໝ່ ຫຼື ຕິດຕໍ່ຜ່ານ WhatsApp',
  config:'ລະບົບກຳລັງປັບປຸງ ກະລຸນາຕິດຕໍ່ຜ່ານ WhatsApp'
 },
 th:{
  sending:'กำลังส่งคำขอ...',
  success:'ส่งคำขอสำเร็จแล้ว ทีมงานจะติดต่อกลับโดยเร็ว',
  failed:'ไม่สามารถส่งคำขอได้ กรุณาลองใหม่หรือติดต่อผ่าน WhatsApp',
  config:'ระบบกำลังปรับปรุง กรุณาติดต่อผ่าน WhatsApp'
 },
 en:{
  sending:'Sending your request...',
  success:'Your request was sent successfully. Our team will contact you soon.',
  failed:'We could not send your request. Please try again or contact us through WhatsApp.',
  config:'The system is being updated. Please contact us through WhatsApp.'
 }
};
function lang(){
 return localStorage.getItem('lws_admin_lang') || localStorage.getItem('lws_lang') || 'lo';
}
function tr(k){ return (translations[lang()]||translations.lo)[k]||k; }
function friendly(error){
 const text=String(error?.message||error||'').toLowerCase();
 if(text.includes('row-level security')||text.includes('permission denied')||text.includes('policy')||text.includes('submit_public_lead')||text.includes('function public.submit_public_lead')) return tr('config');
 return tr('failed');
}
window.LWS_STABILITY={
 tr,
 friendly,
 setStatus(el,message,type=''){
   if(!el)return;
   el.textContent=message;
   el.classList.remove('success','error','loading');
   if(type)el.classList.add(type);
 }
};
window.addEventListener('unhandledrejection',event=>{
 console.error('[LWS V2.9.0.1]',event.reason);
});
window.addEventListener('error',event=>{
 console.error('[LWS V2.9.0.1]',event.error||event.message);
});
})();
