const LEAD_STATUSES = [
  'new','contacted','quotation_sent','in_progress',
  'waiting','completed','cancelled'
];

function normalizePublicLead(lead = {}) {
  return {
    p_name: String(lead.name || '').trim(),
    p_phone: String(lead.phone || '').trim(),
    p_email: String(lead.email || '').trim() || null,
    p_business_name: String(lead.business_name || '').trim() || null,
    p_service: String(lead.service || 'website').trim() || 'website',
    p_budget: String(lead.budget || '').trim() || null,
    p_message: String(lead.message || '').trim(),
    p_preferred_contact:
      String(lead.preferred_contact || 'whatsapp').trim() || 'whatsapp',
    p_language: ['lo', 'th', 'en'].includes(lead.language)
      ? lead.language
      : 'lo'
  };
}

async function createLead(lead) {
  if (!window.lwsSupabase) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }

  const payload = normalizePublicLead(lead);
  if (!payload.p_name || !payload.p_phone || !payload.p_message) {
    throw new Error('REQUIRED_FIELDS_MISSING');
  }

  // The public website only calls this restricted RPC.
  // It works with both legacy bigint IDs and newer UUID IDs because the
  // database function returns the inserted ID as text.
  const { data, error } = await window.lwsSupabase.rpc(
    'submit_public_lead',
    payload
  );

  if (error) {
    console.error('[submit_public_lead]', error);
    throw error;
  }

  return data;
}

async function getLeads() {
  if (!window.lwsSupabase) return [];

  const { data, error } = await window.lwsSupabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function updateLeadStatus(id, status) {
  if (!LEAD_STATUSES.includes(status)) {
    throw new Error('INVALID_STATUS');
  }

  const { error } = await window.lwsSupabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

async function deleteLead(id) {
  const { error } = await window.lwsSupabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
