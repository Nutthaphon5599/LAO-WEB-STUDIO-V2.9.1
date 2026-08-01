-- Lao Web Studio V2.9.0 verification
select public.lws_public_health_check() as health;

select public.submit_public_lead(
  'V2.9 TEST CUSTOMER',
  '02000000000',
  'test@example.com',
  'Test Hotel',
  'hotel-website',
  '500000',
  'This row verifies the complete V2.9 installation.',
  'whatsapp',
  'lo'
) as test_lead_id;

select id,name,phone,business_name,status,source,created_at
from public.leads
where name='V2.9 TEST CUSTOMER'
order by created_at desc
limit 1;
