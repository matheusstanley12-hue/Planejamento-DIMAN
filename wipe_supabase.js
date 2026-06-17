const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://umsozbjpfmxvhwycjjkr.supabase.co';
const supabaseKey = 'sb_publishable_NGJvPtMUdiDGCnK5qRroYg_7_wPqZiH';

async function wipeDatabase() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const collectionsToClear = [
    'diman_tasks',
    'diman_timesheets',
    'diman_replannings',
    'diman_restrictions',
    'diman_costs',
    'diman_lessons',
    'diman_vacations',
    'diman_solicitacoes',
    'diman_kpi_cache'
  ];

  for (const coll of collectionsToClear) {
    console.log(`Clearing ${coll}...`);
    const { error } = await supabase
      .from('diman_store')
      .update({ data: [] })
      .eq('key', 'all')
      .eq('collection', coll);
      
    if (error) console.log("Error clearing", coll, error);
    else console.log("Cleared", coll);
  }

  // Now clear equipment metadata
  console.log('Fetching equipment...');
  const { data: eqData } = await supabase.from('diman_store').select('data').eq('collection', 'diman_equipment').single();
  if (eqData && eqData.data) {
    const eqs = eqData.data.map(e => ({
      ...e,
      timeline: [],
      replanning: [],
      pctGeral: 0,
      pctAvanco: 0,
      status: 'Em Manutenção',
      dataLiberacaoAtual: '',
      dataLiberacaoPlanejada: '',
      dataFim: ''
    }));
    await supabase.from('diman_store').update({ data: eqs }).eq('key', 'all').eq('collection', 'diman_equipment');
    console.log("Equipment metadata reset.");
  }

  // Clear workforce metadata
  console.log('Fetching workforce...');
  const { data: wfData } = await supabase.from('diman_store').select('data').eq('collection', 'diman_workforce').single();
  if (wfData && wfData.data) {
    const wfs = wfData.data.map(w => {
      delete w.feriasInicio;
      delete w.feriasFim;
      if (w.status === 'Férias') w.status = 'Ativo';
      return w;
    });
    await supabase.from('diman_store').update({ data: wfs }).eq('key', 'all').eq('collection', 'diman_workforce');
    console.log("Workforce metadata reset.");
  }
  
  console.log("Database wipe completed!");
}

wipeDatabase();
