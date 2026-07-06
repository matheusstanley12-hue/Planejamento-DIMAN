// dashboard-data.js – Helper functions to aggregate data for the new dashboard charts
// All functions receive the current month prefix (YYYY-MM) and return objects ready for Chart.js

const getSixMonths = (baseMonth) => {
  const base = new Date(baseMonth + '-01');
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7)); // "YYYY-MM"
  }
  return months;
};

// Generic aggregator for a given equipment category field
const aggregateCategory = (categoryKey, monthPrefix) => {
  const equipment = DB.equipment.list();
  const months = getSixMonths(monthPrefix);
  const planned = Array(6).fill(0);
  const realized = Array(6).fill(0);
  equipment.forEach(eq => {
    const cat = eq[categoryKey];
    if (!cat) return;
    if (eq.dataLiberacaoPlanejada) {
      const m = eq.dataLiberacaoPlanejada.slice(0, 7);
      const idx = months.indexOf(m);
      if (idx !== -1) planned[idx]++;
    }
    if (eq.status === 'Liberado' && (eq.dataLiberacaoAtual || eq.dataFim)) {
      const m = (eq.dataLiberacaoAtual || eq.dataFim).slice(0, 7);
      const idx = months.indexOf(m);
      if (idx !== -1) realized[idx]++;
    }
  });
  return { months, planned, realized };
};

const getPriorityStats = (monthPrefix) => {
  const tasks = DB.tasks.getAll();
  const priorities = { Urgente: 0, Alta: 0, Media: 0, Baixa: 0 };
  tasks.forEach(t => {
    const dt = t.dataRealInicio || t.dataPlanejadaInicio || '';
    if (!dt.startsWith(monthPrefix)) return;
    const p = t.priority || 'Media';
    if (priorities[p] !== undefined) priorities[p]++;
  });
  return priorities;
};

const getAnnualStats = (yearPrefix) => {
  const equipment = DB.equipment.list();
  let planned = 0, realized = 0;
  equipment.forEach(eq => {
    if (eq.dataLiberacaoPlanejada && eq.dataLiberacaoPlanejada.slice(0, 4) === yearPrefix.slice(0,4)) planned++;
    if (eq.status === 'Liberado' && (eq.dataLiberacaoAtual || eq.dataFim) && (eq.dataLiberacaoAtual || eq.dataFim).slice(0,4) === yearPrefix.slice(0,4)) realized++;
  });
  return { planned, realized };
};

// Expose to global window for other modules
window.DashboardData = {
  getSixMonths,
  aggregateCategory,
  getPriorityStats,
  getAnnualStats
};
