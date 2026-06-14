/* ============================================================
   PLANEJAMENTO DIMAN-BHZ — Module: Prêmio Produção
   ============================================================ */

window.BonusModule = (() => {
  let dateFilter = 'current_month'; // current_month | last_month | all

  function render() {
    const session = Auth.getSession();
    
    // Strict permission check: only Admin, Gerente, Desenvolvedor
    if (!session || !['Administrador', 'Gerente', 'Desenvolvedor'].includes(session.perfil)) {
      return `
        <div class="page-container" style="display:flex;justify-content:center;align-items:center;height:80vh;">
          <div class="card" style="padding:40px;text-align:center;max-width:400px;border-top:4px solid var(--color-danger);">
            <svg xmlns="http://www.w3.org/2000/svg" style="width:64px;height:64px;color:var(--color-danger);margin:0 auto 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 style="color:var(--text-primary);margin-bottom:10px;">Acesso Negado</h2>
            <p style="color:var(--text-muted);">Apenas Administradores e Gerentes possuem permissão para visualizar o Prêmio de Produção.</p>
          </div>
        </div>
      `;
    }

    const timesheets = DB.timesheets ? DB.timesheets.list() : [];
    
    // Determine date range boundaries based on filter
    const now = new Date();
    let startDate = new Date('2000-01-01');
    let endDate = new Date('2100-01-01');

    if (dateFilter === 'current_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (dateFilter === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    // Filter timesheets by date
    const filteredTimesheets = timesheets.filter(t => {
      const tDate = new Date(t.data);
      return tDate >= startDate && tDate <= endDate;
    });

    // Aggregate by worker
    const workerStats = {};

    filteredTimesheets.forEach(t => {
      if (!t.workerId) return;
      if (!workerStats[t.workerId]) {
        workerStats[t.workerId] = {
          nome: t.workerNome || 'Desconhecido',
          horasTrabalho: 0,
          horasPausa: 0
        };
      }
      
      const hs = parseFloat(t.horasTrabalhadas || 0);
      if (t.tipo === 'Trabalho') {
        workerStats[t.workerId].horasTrabalho += hs;
      } else if (t.tipo === 'Pausa') {
        workerStats[t.workerId].horasPausa += hs;
      }
    });

    // Generate table rows
    let tableHtml = '';
    const statsArray = Object.values(workerStats).sort((a,b) => a.nome.localeCompare(b.nome));

    statsArray.forEach(w => {
      const totalHours = w.horasTrabalho + w.horasPausa;
      let premioPercent = 0;
      if (totalHours > 0) {
        premioPercent = (w.horasTrabalho / totalHours) * 100;
      }

      let badgeColor = 'var(--text-muted)';
      if (premioPercent >= 90) badgeColor = 'var(--color-success)';
      else if (premioPercent >= 70) badgeColor = 'var(--brand-primary)';
      else if (premioPercent >= 50) badgeColor = 'var(--color-warning)';
      else if (premioPercent > 0) badgeColor = 'var(--color-danger)';

      tableHtml += `
        <tr style="border-bottom:1px solid var(--border-card); transition:background 0.2s;">
          <td style="padding:15px;font-weight:bold;color:var(--text-primary);">${w.nome}</td>
          <td style="padding:15px;color:var(--text-secondary);text-align:center;">${w.horasTrabalho.toFixed(2)}h</td>
          <td style="padding:15px;color:var(--text-secondary);text-align:center;">${w.horasPausa.toFixed(2)}h</td>
          <td style="padding:15px;color:var(--text-secondary);text-align:center;">${totalHours.toFixed(2)}h</td>
          <td style="padding:15px;text-align:center;">
            <div style="display:inline-block;padding:6px 12px;border-radius:20px;font-weight:900;font-size:14px;background:rgba(0,0,0,0.03);color:${badgeColor};border:1px solid ${badgeColor};">
              ${premioPercent.toFixed(1)}%
            </div>
          </td>
        </tr>
      `;
    });

    if (statsArray.length === 0) {
      tableHtml = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-muted);">Nenhum apontamento encontrado para este período.</td></tr>`;
    }

    return `
      <div class="page-container" style="padding-bottom:100px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);flex-wrap:wrap;gap:var(--space-4);">
          <div>
            <h2 style="margin:0;font-size:1.8rem;font-weight:900;color:var(--text-primary);">Prêmio Produção</h2>
            <p style="margin:0;font-size:var(--text-sm);color:var(--text-secondary);">Cálculo automático de rendimento e horas (Exclusivo Gerência).</p>
          </div>
          
          <div style="display:flex;gap:var(--space-2);">
            <select class="form-control" style="width:200px;" onchange="BonusModule.setFilter(this.value)">
              <option value="current_month" ${dateFilter === 'current_month' ? 'selected' : ''}>Mês Atual</option>
              <option value="last_month" ${dateFilter === 'last_month' ? 'selected' : ''}>Mês Anterior</option>
              <option value="all" ${dateFilter === 'all' ? 'selected' : ''}>Todo o Período</option>
            </select>
          </div>
        </div>

        <div class="card" style="overflow:hidden;">
          <div class="table-responsive">
            <table class="table" style="width:100%;border-collapse:collapse;">
              <thead style="background:var(--bg-base);border-bottom:2px solid var(--border-card);">
                <tr>
                  <th style="padding:15px;text-align:left;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Executante</th>
                  <th style="padding:15px;text-align:center;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Trabalho (H)</th>
                  <th style="padding:15px;text-align:center;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Ocioso/Pausa (H)</th>
                  <th style="padding:15px;text-align:center;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Total Registrado (H)</th>
                  <th style="padding:15px;text-align:center;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Prêmio Produção (%)</th>
                </tr>
              </thead>
              <tbody>
                ${tableHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function setFilter(val) {
    dateFilter = val;
    Router.navigate('bonus', { force: true });
  }

  return {
    render,
    setFilter
  };
})();
