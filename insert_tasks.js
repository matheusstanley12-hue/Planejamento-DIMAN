const SUPABASE_URL = 'https://umsozbjpfmxvhwycjjkr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NGJvPtMUdiDGCnK5qRroYg_7_wPqZiH';

async function run() {
  // Fetch equipments
  const res = await fetch(`${SUPABASE_URL}/rest/v1/diman_store?collection=eq.diman_equipment`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  
  const data = await res.json();
  let equipment = null;
  
  // Since we migrated to row-based, data could be individual rows or 'all'
  for (const row of data) {
    if (row.key === 'all') {
      const eq = row.data.find(e => e.nome === 'SSH 909' || e.tag === 'SSH 909');
      if (eq) equipment = eq;
    } else {
      if (row.data.nome === 'SSH 909' || row.data.tag === 'SSH 909') equipment = row.data;
    }
  }

  if (!equipment) {
    console.error('Equipment SSH 909 not found!');
    process.exit(1);
  }
  
  console.log('Found equipment:', equipment.id, equipment.nome);

  const tasksList = [
    "Instalar mangote de sucção da bomba auxiliar",
    "Colocar óleo",
    "Passar flowmeter nas bombas",
    "Passar flowmeter no comando",
    "Instalar motor do guincho wireline",
    "Montar bomba de lama",
    "Testar bomba de lama",
    "Instalação das mangueiras hidráulicas da bomba de lama",
    "Fabricar e instalar mangueiras do conjunto de rotação",
    "Instalar motor hidráulico",
    "Fabricar e instalar mangueiras do cilindro de avanço",
    "Fabricar e instalar mangueira da morsa",
    "Instalar manômetro da morsa",
    "Parametrizar sonda",
    "Instalar adaptador da patola",
    "Instalar proteçõe"
  ];

  const upsertPayload = tasksList.map(desc => {
    const id = `tk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const task = {
      id,
      equipmentId: equipment.id,
      disciplina: 'Mecânica',
      descricao: desc,
      status: 'Não Iniciada',
      pctExecutado: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { collection: 'diman_tasks', key: id, data: task, updated_at: new Date().toISOString() };
  });

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/diman_store`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(upsertPayload)
  });

  if (!insertRes.ok) {
    console.error('Failed to insert tasks:', await insertRes.text());
    process.exit(1);
  }

  console.log(`Successfully inserted ${tasksList.length} tasks!`);
}

run();
