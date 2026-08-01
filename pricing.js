const DEFAULT_PRICING={starter:{price:'200.000',currency:'ກີບ'},business:{price:'500.000',currency:'ກີບ'},premium:{price:'800.000',currency:'ກີບ'}};
async function getPricing(){
  if(!window.lwsSupabase) return structuredClone(DEFAULT_PRICING);
  const {data,error}=await window.lwsSupabase.from('pricing').select('package,price,currency');
  if(error){console.error(error);return structuredClone(DEFAULT_PRICING);}
  const out=structuredClone(DEFAULT_PRICING);(data||[]).forEach(r=>{if(out[r.package])out[r.package]={price:r.price,currency:r.currency};});return out;
}
async function savePricing(data){
  if(!window.lwsSupabase) throw new Error('Supabase ยังไม่ได้ตั้งค่า');
  const rows=Object.entries(data).map(([package_name,v])=>({package:package_name,price:v.price,currency:v.currency,updated_at:new Date().toISOString()}));
  const {error}=await window.lwsSupabase.from('pricing').upsert(rows,{onConflict:'package'});if(error)throw error;
}
async function renderPricing(){
  const data=await getPricing();['starter','business','premium'].forEach(key=>{const p=document.querySelector(`[data-price="${key}"]`),c=document.querySelector(`[data-currency="${key}"]`);if(p)p.textContent=data[key]?.price||'';if(c)c.textContent=data[key]?.currency||'ກີບ';});
}
