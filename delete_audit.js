const SUPABASE_URL = 'https://umsozbjpfmxvhwycjjkr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NGJvPtMUdiDGCnK5qRroYg_7_wPqZiH';

async function deleteAudit() {
  const url = `${SUPABASE_URL}/rest/v1/diman_store?collection=eq.diman_audit`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  console.log('Delete status:', res.status);
}
deleteAudit();
