const SUPABASE_URL = 'https://umsozbjpfmxvhwycjjkr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NGJvPtMUdiDGCnK5qRroYg_7_wPqZiH';

async function check() {
  const url = `${SUPABASE_URL}/rest/v1/diman_store?select=collection,key`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await res.json();
  const sizes = {};
  for (const row of data) {
    if (!sizes[row.collection]) sizes[row.collection] = 0;
    sizes[row.collection]++;
  }
  console.log("Row counts per collection:");
  console.log(sizes);

  const url2 = `${SUPABASE_URL}/rest/v1/diman_store?select=*&collection=not.ilike.photo_%25`;
  const res2 = await fetch(url2, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const allData = await res2.json();
  const bytesPerCol = {};
  for (const row of allData) {
    const size = Buffer.byteLength(JSON.stringify(row));
    if (!bytesPerCol[row.collection]) bytesPerCol[row.collection] = 0;
    bytesPerCol[row.collection] += size;
  }
  
  console.log("\nSizes in bytes per collection (excluding photos):");
  const sorted = Object.entries(bytesPerCol).sort((a, b) => b[1] - a[1]);
  for (const [col, size] of sorted) {
    console.log(`${col}: ${(size / 1024).toFixed(2)} KB`);
  }
}
check();
