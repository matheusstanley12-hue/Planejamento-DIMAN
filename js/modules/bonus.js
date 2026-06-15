/* ============================================================
   PLANEJAMENTO DIMAN-BHZ — Module: Prêmio Produção
   ============================================================ */

window.BonusModule = (() => {
  let dateFilter = 'current_month';

  function getDates() {
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
    return { startDate, endDate };
  }

  function getPeriodKey() {
    const { startDate } = getDates();
    return dateFilter === 'all' ? 'all' : startDate.toISOString().slice(0, 7);
  }

  function getMetrics() {
    try {
      return JSON.parse(localStorage.getItem('diman_bonus_metrics') || '{}');
    } catch(e) { return {}; }
  }

  function saveMetrics(metrics) {
    localStorage.setItem('diman_bonus_metrics', JSON.stringify(metrics));
    Router.navigate('bonus', { force: true });
  }

  window.toggleAFT = function() {
    const period = getPeriodKey();
    const metrics = getMetrics();
    if (!metrics[period]) metrics[period] = { aft: false, fiveS: {} };
    metrics[period].aft = !metrics[period].aft;
    saveMetrics(metrics);
  };

  window.updateFiveS = function(workerId, val) {
    const period = getPeriodKey();
    const metrics = getMetrics();
    if (!metrics[period]) metrics[period] = { aft: false, fiveS: {} };
    let num = parseFloat(val);
    if (isNaN(num)) num = 0;
    if (num > 10) num = 10;
    if (num < 0) num = 0;
    metrics[period].fiveS[workerId] = num;
    saveMetrics(metrics);
  };

  function render() {
    const session = Auth.getSession();
    if (!session || !['Administrador', 'Gerente', 'Desenvolvedor', 'Encarregado', 'Supervisor'].includes(session.perfil)) {
      return `
        <div class="page-container" style="display:flex;justify-content:center;align-items:center;height:80vh;">
          <div class="card" style="padding:40px;text-align:center;max-width:400px;border-top:4px solid var(--color-danger);">
            <h2 style="color:var(--text-primary);margin-bottom:10px;">Acesso Negado</h2>
            <p style="color:var(--text-muted);">Apenas Administradores, Gerentes e Encarregados possuem permissão para visualizar o Prêmio de Produção.</p>
          </div>
        </div>
      `;
    }

    const { startDate, endDate } = getDates();
    const periodKey = getPeriodKey();
    const metrics = getMetrics();
    const periodMetrics = metrics[periodKey] || { aft: false, fiveS: {} };
    const aftAtivo = periodMetrics.aft;
    const isGerente = ['Administrador', 'Gerente', 'Desenvolvedor'].includes(session.perfil);

    // --- COLETIVO: Liberação de Equipamentos (50%) ---
    const allEqs = DB.equipment.list();
    const plannedEqs = allEqs.filter(e => {
       if (!e.liberacaoPlanejada) return false;
       const d = new Date(e.liberacaoPlanejada + 'T00:00:00');
       return d >= startDate && d <= endDate;
    });
    const releasedEqs = plannedEqs.filter(e => e.status === 'Liberado');
    let percLiberacao = 0;
    if (plannedEqs.length > 0) {
      percLiberacao = (releasedEqs.length / plannedEqs.length) * 50;
    } else {
      percLiberacao = 50; // Se não tem planejamento, ganha por default
    }

    // --- COLETIVO: Índice de Retrabalho (15%) ---
    const allTasks = DB.tasks.list();
    const tasksInPeriod = allTasks.filter(t => {
       const d = new Date(t.createdAt);
       return d >= startDate && d <= endDate;
    });
    const retrabalhoTasks = tasksInPeriod.filter(t => t.disciplina === 'Retrabalho').length;
    // Punição de 1% por cada tarefa de retrabalho na oficina (até zerar os 15%)
    let percRetrabalho = Math.max(0, 15 - (retrabalhoTasks * 1));

    // Base Coletiva Adquirida
    const coletivoBase = percLiberacao + percRetrabalho + (aftAtivo ? 5 : 0);

    // Preparar Dados por Trabalhador
    const workerStats = {};
    const wfList = DB.workforce.list();
    const vList = window.DB && DB.vacations ? DB.vacations.list() : [];

    wfList.forEach(w => {
      let isFerias = false;
      if (w.feriasInicio && w.feriasFim) {
        if (new Date(w.feriasInicio + 'T00:00:00') <= endDate && new Date(w.feriasFim + 'T23:59:59') >= startDate) isFerias = true;
      }
      if (vList.some(v => v.workerId === w.id && new Date(v.startDate + 'T00:00:00') <= endDate && new Date(v.endDate + 'T23:59:59') >= startDate)) isFerias = true;
      if (w.status === 'Férias') isFerias = true;
      if (w.status !== 'Ativo' && !isFerias) return;

      workerStats[w.nome] = {
        id: w.id,
        nome: w.nome,
        isFerias: isFerias,
        qtdFaltas: 0,
        horasAtestado: 0,
        horasAtraso: 0,
        eqsParticipou: new Set()
      };
    });

    const timesheets = DB.timesheets ? DB.timesheets.list() : [];
    timesheets.filter(t => new Date(t.data) >= startDate && new Date(t.data) <= endDate).forEach(t => {
      // Usar t.workerName se t.workerId não resolver, porque timesheet legado usa ID
      let w = wfList.find(x => x.id === t.workerId || x.nome === t.workerName);
      if (w && workerStats[w.nome]) {
        if (t.tipo === 'Falta') workerStats[w.nome].qtdFaltas += 1;
        if (t.tipo === 'Atestado') workerStats[w.nome].horasAtestado += parseFloat(t.horasTrabalhadas||0);
        if (t.tipo === 'Atraso') workerStats[w.nome].horasAtraso += parseFloat(t.horasTrabalhadas||0);
      }
    });

    // Mapear Equipamentos -> Participação
    tasksInPeriod.forEach(t => {
      if (t.responsavel && workerStats[t.responsavel]) {
        workerStats[t.responsavel].eqsParticipou.add(t.equipmentId);
      }
    });

    // Gerar Tabela HTML
    let tableHtml = '';
    const statsArray = Object.values(workerStats).sort((a,b) => a.nome.localeCompare(b.nome));

    statsArray.forEach(w => {
      let trStyle = '';
      if (w.isFerias) {
        tableHtml += `
          <tr style="border-bottom:1px solid var(--border-card); opacity:0.6;">
            <td style="padding:15px;font-weight:bold;">${w.nome}</td>
            <td colspan="5" style="text-align:center;padding:15px;color:var(--color-info);">Férias - Não contabilizado no Prêmio</td>
          </tr>`;
        return;
      }

      // --- INDIVIDUAL: OS no Prazo (10%) ---
      let osNoPrazoCount = 0;
      let osTotalCount = 0;
      w.eqsParticipou.forEach(eqId => {
        const eq = allEqs.find(e => e.id === eqId);
        if (eq && eq.status === 'Liberado') {
          osTotalCount++;
          if (eq.dataFim && eq.liberacaoPlanejada && eq.dataFim <= eq.liberacaoPlanejada) {
            osNoPrazoCount++;
          }
        }
      });
      let percOsPrazo = 10;
      if (osTotalCount > 0 && osNoPrazoCount < osTotalCount) {
        percOsPrazo = (osNoPrazoCount / osTotalCount) * 10;
      } else if (osTotalCount === 0) {
        percOsPrazo = 10; // Defaults to 10 if no completed OS yet
      }

      // --- INDIVIDUAL: Absenteísmo (10%) ---
      // 0 faltas/atestados/atrasos = 10%, senão 0%
      let percAbsenteismo = (w.qtdFaltas === 0 && w.horasAtestado === 0 && w.horasAtraso === 0) ? 10 : 0;

      // --- INDIVIDUAL: 5S / Organização (10%) ---
      let perc5S = periodMetrics.fiveS[w.id];
      if (perc5S === undefined) perc5S = 10; // default 10%

      // TOTAL
      const totalPremio = coletivoBase + percOsPrazo + percAbsenteismo + perc5S;

      let badgeColor = totalPremio >= 90 ? 'var(--color-success)' : (totalPremio >= 70 ? 'var(--brand-primary)' : 'var(--color-danger)');

      tableHtml += `
        <tr style="border-bottom:1px solid var(--border-card); transition:background 0.2s;">
          <td style="padding:15px;font-weight:bold;color:var(--text-primary);">${w.nome}</td>
          <td style="padding:15px;text-align:center;">
            <span style="display:block;font-size:16px;font-weight:bold;color:var(--text-primary);">${coletivoBase.toFixed(1)}%</span>
            <span style="font-size:10px;color:var(--text-muted);">de 70% Base</span>
          </td>
          <td style="padding:15px;text-align:center;">
            <span style="display:block;font-size:14px;color:${percOsPrazo===10?'var(--color-success)':'var(--color-warning)'}">${percOsPrazo.toFixed(1)}%</span>
            <span style="font-size:10px;color:var(--text-muted);">${osNoPrazoCount}/${osTotalCount} OS no Prazo</span>
          </td>
          <td style="padding:15px;text-align:center;">
            <span style="display:block;font-size:14px;color:${percAbsenteismo===10?'var(--color-success)':'var(--color-danger)'}">${percAbsenteismo.toFixed(1)}%</span>
            <span style="font-size:10px;color:var(--text-muted);">Faltas: ${w.qtdFaltas} | Ats/Atr: ${w.horasAtestado + w.horasAtraso}h</span>
          </td>
          <td style="padding:15px;text-align:center;">
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
              <input type="number" min="0" max="10" step="1" class="form-control" style="width:60px;text-align:center;padding:4px;font-size:14px;" value="${perc5S}" onblur="window.updateFiveS('${w.id}', this.value)"> <span style="font-size:12px;color:var(--text-muted);">%</span>
            </div>
          </td>
          <td style="padding:15px;text-align:center;">
            <div style="display:inline-block;padding:6px 12px;border-radius:20px;font-weight:900;font-size:14px;background:rgba(0,0,0,0.03);color:${badgeColor};border:1px solid ${badgeColor};">
              ${totalPremio.toFixed(1)}%
            </div>
          </td>
        </tr>
      `;
    });

    if (statsArray.length === 0) {
      tableHtml = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">Nenhum funcionário ativo.</td></tr>`;
    }

    return `
      <div class="page-container" style="padding-bottom:100px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);flex-wrap:wrap;gap:var(--space-4);">
          <div>
            <h2 style="margin:0;font-size:1.8rem;font-weight:900;color:var(--text-primary);">Prêmio Produção</h2>
            <p style="margin:0;font-size:var(--text-sm);color:var(--text-secondary);">Métricas Coletivas (80%) e Individuais (20%).</p>
          </div>
          <div style="display:flex;gap:var(--space-2);">
            <select class="form-control" style="width:200px;" onchange="BonusModule.setFilter(this.value)">
              <option value="current_month" ${dateFilter === 'current_month' ? 'selected' : ''}>Mês Atual</option>
              <option value="last_month" ${dateFilter === 'last_month' ? 'selected' : ''}>Mês Anterior</option>
              <option value="all" ${dateFilter === 'all' ? 'selected' : ''}>Todo o Período</option>
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:var(--space-4);margin-bottom:var(--space-6);">
          <div class="card" style="padding:var(--space-4);text-align:center;">
            <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:bold;margin-bottom:4px;">Liberação de Equip. (50%)</div>
            <div style="font-size:24px;font-weight:900;color:var(--brand-primary);">${percLiberacao.toFixed(1)}%</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">${releasedEqs.length} de ${plannedEqs.length} liberados no prazo planejado.</div>
          </div>
          <div class="card" style="padding:var(--space-4);text-align:center;">
            <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:bold;margin-bottom:4px;">Índice de Retrabalho (15%)</div>
            <div style="font-size:24px;font-weight:900;color:${percRetrabalho<15?'var(--color-danger)':'var(--color-success)'};">${percRetrabalho.toFixed(1)}%</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">${retrabalhoTasks} tarefas de retrabalho registradas.</div>
          </div>
          <div class="card" style="padding:var(--space-4);text-align:center;">
            <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:bold;margin-bottom:4px;">Segurança AFT (5%)</div>
            <div style="font-size:24px;font-weight:900;color:${aftAtivo?'var(--color-success)':'var(--color-danger)'};">${aftAtivo ? '5.0%' : '0.0%'}</div>
            <div style="margin-top:8px;">
              <button onclick="window.toggleAFT()" class="btn ${aftAtivo?'btn-primary':'btn-secondary'}" style="font-size:11px;padding:4px 8px;" ${!isGerente?'disabled':''}>
                ${aftAtivo ? 'Mês Seguro (Ativo)' : 'Registrar Mês Seguro'}
              </button>
            </div>
            ${!isGerente ? '<div style="font-size:10px;color:var(--color-danger);margin-top:4px;">*Apenas Gerente</div>' : ''}
          </div>
        </div>

        <div class="card" style="overflow:hidden;">
          <div class="table-responsive">
            <table class="table" style="width:100%;border-collapse:collapse;">
              <thead style="background:var(--bg-base);border-bottom:2px solid var(--border-card);">
                <tr>
                  <th style="padding:15px;text-align:left;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Executante</th>
                  <th style="padding:15px;text-align:center;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Base Coletiva</th>
                  <th style="padding:15px;text-align:center;color:var(--text-muted);font-size:12px;text-transform:uppercase;" title="Participação em OS no prazo">OS no Prazo (10%)</th>
                  <th style="padding:15px;text-align:center;color:var(--text-muted);font-size:12px;text-transform:uppercase;" title="0 faltas/atestados = 10%">Assiduidade (10%)</th>
                  <th style="padding:15px;text-align:center;color:var(--text-muted);font-size:12px;text-transform:uppercase;">5S (10%)</th>
                  <th style="padding:15px;text-align:center;color:var(--text-primary);font-size:12px;text-transform:uppercase;">Total Prêmio</th>
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

  return { render, setFilter };
})();
