const DEFAULT_PROJECTS = [{
  id:'tum-pa-guay',
  category:{lo:'ເວັບໄຊຕ໌ຮ້ານອາຫານ',th:'เว็บไซต์ร้านอาหาร',en:'Restaurant Website'},
  name:{lo:'ຮ້ານຕຳຕູບປ່າກ້ວຍ',th:'ร้านตำตูบป่าก้วย',en:'Tum Pa Guay Restaurant'},
  description:{lo:'ເວັບໄຊຕ໌ຮ້ານອາຫານ ພ້ອມເມນູ ແຜນທີ່ ປຸ່ມຕິດຕໍ່ ແລະ ຮອງຮັບຫຼາຍພາສາ',th:'เว็บไซต์ร้านอาหาร พร้อมเมนู แผนที่ ปุ่มติดต่อ และรองรับหลายภาษา',en:'A restaurant website with menu, map, contact actions and multilingual support.'},
  url:'https://nutthaphon5599.github.io/tum-pa-guay-restaurant-6.2/', image:'assets/portfolio.jpg', sort_order:0
}];
async function getProjects(){
  if(!window.lwsSupabase) return DEFAULT_PROJECTS;
  const {data,error}=await window.lwsSupabase.from('projects').select('*').order('sort_order',{ascending:true}).limit(6);
  if(error){console.error(error);return DEFAULT_PROJECTS;}
  return (data||[]).map(p=>({id:p.id,category:p.category,name:p.name,description:p.description,url:p.url,image:p.image_url,sort_order:p.sort_order}));
}
async function saveProject(project){
  if(!window.lwsSupabase) throw new Error('Supabase ยังไม่ได้ตั้งค่า');
  const payload={id:project.id,category:project.category,name:project.name,description:project.description,url:project.url,image_url:project.image,sort_order:project.sort_order||0,updated_at:new Date().toISOString()};
  const {error}=await window.lwsSupabase.from('projects').upsert(payload); if(error) throw error;
}
async function deleteProject(id){
  if(!window.lwsSupabase) throw new Error('Supabase ยังไม่ได้ตั้งค่า');
  const {error}=await window.lwsSupabase.from('projects').delete().eq('id',id); if(error) throw error;
}
