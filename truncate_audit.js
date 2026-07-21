const SUPABASE_URL = 'https://umsozbjpfmxvhwycjjkr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NGJvPtMUdiDGCnK5qRroYg_7_wPqZiH';

async function truncateAudit() {
  const url = `${SUPABASE_URL}/rest/v1/diman_store?select=*&collection=eq.diman_audit`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await res.json();
  if (data && data.length > 0) {
    const row = data[0];
    let logs = row.data;
    if (Array.isArray(logs) && logs.length > 200) {
      console.log(`Truncating audit from ${logs.length} to 200`);
      logs = logs.slice(0, 200);
      
      const updateUrl = `${SUPABASE_URL}/rest/v1/diman_store?collection=eq.diman_audit&key=eq.all`;
      const updateRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ data: logs, updated_at: new Date().toISOString() })
      });
      console.log('Update status:', updateRes.status);
    } else {
      console.log('Audit log is already small:', logs.length);
    }
  } else {
    console.log('No audit logs found.');
  }
}
truncateAudit();
