
(function(){
'use strict';
const STORE='lws_admin_lang';
const supported=['lo','th','en'];
const dictionary={
 lo:{
  dashboard:'ພາບລວມ',customers:'ລູກຄ້າ',calendar:'ນັດໝາຍ',quotations:'ໃບສະເໜີລາຄາ',
  files:'ໄຟລ໌ລູກຄ້າ',portfolio:'ຜົນງານ',pricing:'ລາຄາ',kanban:'ກະດານວຽກ',
  invoices:'ໃບແຈ້ງໜີ້',reports:'ລາຍງານ',portalUpdates:'ອັບເດດລູກຄ້າ',
  tasks:'ວຽກ',services:'ບໍລິການ',alerts:'ແຈ້ງເຕືອນ',settings:'ຕັ້ງຄ່າ',team:'ທີມງານ',
  invoicePayment:'ໃບແຈ້ງໜີ້ ແລະ ການຊຳລະເງິນ',
  invoiceNo:'ເລກທີໃບແຈ້ງໜີ້',customer:'ລູກຄ້າ',email:'ອີເມວ',project:'ໂຄງການ',
  subtotal:'ລວມຍ່ອຍ',discount:'ສ່ວນຫຼຸດ',tax:'ພາສີ',currency:'ສະກຸນເງິນ',
  dueDate:'ວັນຄົບກຳນົດ',createInvoice:'ສ້າງໃບແຈ້ງໜີ້',noInvoices:'ຍັງບໍ່ມີໃບແຈ້ງໜີ້',
  payment:'ການຊຳລະເງິນ',addPayment:'ເພີ່ມການຊຳລະ',paid:'ຊຳລະແລ້ວ',
  draft:'ຮ່າງ',sent:'ສົ່ງແລ້ວ',partially_paid:'ຊຳລະບາງສ່ວນ',overdue:'ເກີນກຳນົດ',cancelled:'ຍົກເລີກ',
  todo:'ລໍຖ້າເຮັດ',in_progress:'ກຳລັງເຮັດ',review:'ກວດສອບ',completed:'ສຳເລັດ',
  businessReport:'ລາຍງານທຸລະກິດ',recordedRevenue:'ລາຍຮັບທີ່ບັນທຶກ',
  outstanding:'ຍອດຄ້າງຮັບ',paidInvoices:'ໃບແຈ້ງໜີ້ທີ່ຊຳລະແລ້ວ',activeTasks:'ວຽກທີ່ກຳລັງເຮັດ',
  customerPortal:'ພື້ນທີ່ລູກຄ້າ',publishUpdate:'ເຜີຍແຜ່ອັບເດດ',progress:'ຄວາມຄືບໜ້າ',
  title:'ຫົວຂໍ້',message:'ຂໍ້ຄວາມ',status:'ສະຖານະ',planning:'ວາງແຜນ',on_hold:'ພັກໄວ້',
  adminLogin:'ເຂົ້າລະບົບຜູ້ດູແລ',customerLogin:'ເຂົ້າລະບົບລູກຄ້າ',
  login:'ເຂົ້າລະບົບ',password:'ລະຫັດຜ່ານ',createAccount:'ສ້າງບັນຊີລູກຄ້າ',
  fullName:'ຊື່-ນາມສະກຸນ',logout:'ອອກຈາກລະບົບ',
  trackProject:'ຕິດຕາມໂຄງການຂອງທ່ານ',projectUpdates:'ອັບເດດໂຄງການ',
  noUpdates:'ຍັງບໍ່ມີການອັບເດດ',noTasks:'ຍັງບໍ່ມີວຽກ',
  createCustomerAccount:'ສ້າງບັນຊີລູກຄ້າ',language:'ພາສາ'
 },
 th:{
  dashboard:'ภาพรวม',customers:'ลูกค้า',calendar:'นัดหมาย',quotations:'ใบเสนอราคา',files:'ไฟล์ลูกค้า',
  portfolio:'ผลงาน',pricing:'ราคา',kanban:'กระดานงาน',invoices:'ใบแจ้งหนี้',reports:'รายงาน',
  portalUpdates:'อัปเดตลูกค้า',tasks:'งาน',services:'บริการ',alerts:'แจ้งเตือน',settings:'ตั้งค่า',team:'ทีมงาน',
  invoicePayment:'ใบแจ้งหนี้และการชำระเงิน',invoiceNo:'เลขที่ใบแจ้งหนี้',customer:'ลูกค้า',email:'อีเมล',
  project:'โครงการ',subtotal:'ยอดรวมย่อย',discount:'ส่วนลด',tax:'ภาษี',currency:'สกุลเงิน',
  dueDate:'วันครบกำหนด',createInvoice:'สร้างใบแจ้งหนี้',noInvoices:'ยังไม่มีใบแจ้งหนี้',
  payment:'การชำระเงิน',addPayment:'เพิ่มการชำระ',paid:'ชำระแล้ว',draft:'ฉบับร่าง',sent:'ส่งแล้ว',
  partially_paid:'ชำระบางส่วน',overdue:'เกินกำหนด',cancelled:'ยกเลิก',todo:'รอดำเนินการ',
  in_progress:'กำลังดำเนินการ',review:'ตรวจสอบ',completed:'เสร็จแล้ว',businessReport:'รายงานธุรกิจ',
  recordedRevenue:'รายรับที่บันทึก',outstanding:'ยอดค้างรับ',paidInvoices:'ใบแจ้งหนี้ที่ชำระแล้ว',
  activeTasks:'งานที่กำลังทำ',customerPortal:'พื้นที่ลูกค้า',publishUpdate:'เผยแพร่อัปเดต',
  progress:'ความคืบหน้า',title:'หัวข้อ',message:'ข้อความ',status:'สถานะ',planning:'วางแผน',on_hold:'พักงาน',
  adminLogin:'เข้าสู่ระบบผู้ดูแล',customerLogin:'เข้าสู่ระบบลูกค้า',login:'เข้าสู่ระบบ',
  password:'รหัสผ่าน',createAccount:'สร้างบัญชีลูกค้า',fullName:'ชื่อ-นามสกุล',logout:'ออกจากระบบ',
  trackProject:'ติดตามโครงการของคุณ',projectUpdates:'อัปเดตโครงการ',noUpdates:'ยังไม่มีการอัปเดต',
  noTasks:'ยังไม่มีงาน',createCustomerAccount:'สร้างบัญชีลูกค้า',language:'ภาษา'
 },
 en:{
  dashboard:'Dashboard',customers:'Customers',calendar:'Calendar',quotations:'Quotations',files:'Client files',
  portfolio:'Portfolio',pricing:'Pricing',kanban:'Kanban',invoices:'Invoices',reports:'Reports',
  portalUpdates:'Customer updates',tasks:'Tasks',services:'Services',alerts:'Notifications',
  settings:'Settings',team:'Team',invoicePayment:'Invoices and payments',invoiceNo:'Invoice number',
  customer:'Customer',email:'Email',project:'Project',subtotal:'Subtotal',discount:'Discount',tax:'Tax',
  currency:'Currency',dueDate:'Due date',createInvoice:'Create invoice',noInvoices:'No invoices yet',
  payment:'Payment',addPayment:'Add payment',paid:'Paid',draft:'Draft',sent:'Sent',
  partially_paid:'Partially paid',overdue:'Overdue',cancelled:'Cancelled',todo:'To do',
  in_progress:'In progress',review:'Review',completed:'Completed',businessReport:'Business report',
  recordedRevenue:'Recorded revenue',outstanding:'Outstanding amount',paidInvoices:'Paid invoices',
  activeTasks:'Active tasks',customerPortal:'Customer portal',publishUpdate:'Publish update',
  progress:'Progress',title:'Title',message:'Message',status:'Status',planning:'Planning',on_hold:'On hold',
  adminLogin:'Admin login',customerLogin:'Customer login',login:'Login',password:'Password',
  createAccount:'Create customer account',fullName:'Full name',logout:'Logout',
  trackProject:'Track your project',projectUpdates:'Project updates',noUpdates:'No updates yet',
  noTasks:'No tasks yet',createCustomerAccount:'Create customer account',language:'Language'
 }
};
function getLang(){const v=localStorage.getItem(STORE);return supported.includes(v)?v:'lo'}
function tr(key){return dictionary[getLang()]?.[key]||dictionary.en[key]||key}
function locale(){return getLang()==='lo'?'lo-LA':getLang()==='th'?'th-TH':'en-US'}
function money(value,currency='ກີບ'){
 const n=Number(value||0);
 return `${new Intl.NumberFormat(locale(),{maximumFractionDigits:2}).format(n)} ${currency}`;
}
function date(value){
 if(!value)return '—';
 const d=new Date(value+'T00:00:00');
 return new Intl.DateTimeFormat(locale(),{day:'2-digit',month:'2-digit',year:'numeric'}).format(d);
}
function ensureSelector(){
 if(document.querySelector('#global-language-select'))return;
 const host=document.querySelector('.admin-top-actions,.portal-header,.auth-card');
 if(!host)return;
 const wrap=document.createElement('label');
 wrap.className='language-control';
 wrap.innerHTML=`<span>${tr('language')}</span><select id="global-language-select" aria-label="${tr('language')}">
 <option value="lo">ລາວ</option><option value="th">ไทย</option><option value="en">English</option></select>`;
 host.prepend(wrap);
 const sel=wrap.querySelector('select');sel.value=getLang();
 sel.addEventListener('change',()=>{localStorage.setItem(STORE,sel.value);location.reload()});
}
function applyStatic(){
 document.documentElement.lang=getLang();
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=tr(el.dataset.i18n));
 document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.placeholder=tr(el.dataset.i18nPlaceholder));
 ensureSelector();
}
window.LWS_I18N={tr,getLang,locale,money,date,dictionary,applyStatic};
document.addEventListener('DOMContentLoaded',applyStatic);
})();
