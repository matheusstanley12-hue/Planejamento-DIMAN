/* ============================================================
   PLANEJAMENTO DIMAN-BHZ — Module: Gestão de Férias
   ============================================================ */

window.VacationsModule = (() => {

  function render() {
    const session = Auth.getSession();
    
    if (!session || !['Administrador', 'Gerente', 'Desenvolvedor'].includes(session.perfil)) {
      return `
        <div class="page-container" style="display:flex;justify-content:center;align-items:center;height:80vh;">
          <div class="card" style="padding:40px;text-align:center;max-width:400px;border-top:4px solid var(--color-danger);">
            <h2 style="color:var(--text-primary);margin-bottom:10px;">Acesso Negado</h2>
            <p style="color:var(--text-muted);">Apenas Administradores e Gerentes possuem permissão para acessar a Gestão de Férias.</p>
          </div>
        </div>
      `;
    }

    const workers = DB.workforce.list();
    const vList = window.DB && DB.vacations ? DB.vacations.list() : [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayIso = today.toISOString().slice(0, 10);

    const emAndamento = [];
    const programadas = [];

    // Map legacy vacations and DB vacations
    workers.forEach(w => {
      // Find all future and current vacations for this worker
      const workerVacs = vList.filter(v => v.workerId === w.id);
      let legacyIncluded = false;

      workerVacs.forEach(v => {
        if (v.startDate <= todayIso && v.endDate >= todayIso) {
          emAndamento.push({ ...v, workerNome: w.nome, matricula: w.matricula, disciplina: w.disciplina });
        } else if (v.startDate > todayIso) {
          programadas.push({ ...v, workerNome: w.nome, matricula: w.matricula, disciplina: w.disciplina });
        }
        if (w.feriasInicio && v.startDate === w.feriasInicio) legacyIncluded = true;
      });

      // Also include legacy if not already inside DB.vacations
      if (w.feriasInicio && w.feriasFim && !legacyIncluded) {
        if (w.feriasInicio <= todayIso && w.feriasFim >= todayIso) {
          emAndamento.push({ id: 'legacy_'+w.id, workerId: w.id, startDate: w.feriasInicio, endDate: w.feriasFim, workerNome: w.nome, matricula: w.matricula, disciplina: w.disciplina, isLegacy: true });
        } else if (w.feriasInicio > todayIso) {
          programadas.push({ id: 'legacy_'+w.id, workerId: w.id, startDate: w.feriasInicio, endDate: w.feriasFim, workerNome: w.nome, matricula: w.matricula, disciplina: w.disciplina, isLegacy: true });
        }
      }
    });

    // Sort ascending by start date
    emAndamento.sort((a, b) => a.startDate.localeCompare(b.startDate));
    programadas.sort((a, b) => a.startDate.localeCompare(b.startDate));

    const renderTable = (list, isEmAndamento) => {
      if (list.length === 0) {
        return `<div class="empty-state"><p>Nenhum registro encontrado</p></div>`;
      }
      return `
        <div class="table-responsive">
          <table class="table" style="width:100%;border-collapse:collapse;">
            <thead style="background:var(--bg-base);border-bottom:2px solid var(--border-card);">
              <tr>
                <th style="padding:15px;text-align:left;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Funcionário</th>
                <th style="padding:15px;text-align:center;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Setor</th>
                <th style="padding:15px;text-align:center;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Início</th>
                <th style="padding:15px;text-align:center;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Fim</th>
                <th style="padding:15px;text-align:right;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(v => `
                <tr style="border-bottom:1px solid var(--border-card);">
                  <td style="padding:15px;">
                    <div style="font-weight:bold;color:var(--text-primary);">${v.workerNome}</div>
                    <div style="font-size:12px;color:var(--text-muted);">${v.matricula || 'Sem Matrícula'}</div>
                  </td>
                  <td style="padding:15px;text-align:center;color:var(--text-secondary);">${v.disciplina || '—'}</td>
                  <td style="padding:15px;text-align:center;">
                    <span class="badge ${isEmAndamento ? 'badge-warning' : 'badge-ghost'}">${v.startDate.split('-').reverse().join('/')}</span>
                  </td>
                  <td style="padding:15px;text-align:center;">
                    <span class="badge ${isEmAndamento ? 'badge-warning' : 'badge-ghost'}">${v.endDate.split('-').reverse().join('/')}</span>
                  </td>
                  <td style="padding:15px;text-align:right;">
                    <button class="btn btn-outline btn-sm" style="color:var(--color-danger);border-color:var(--color-danger);" onclick="VacationsModule.cancelVacation('${v.id}', '${v.workerId}', ${v.isLegacy || false})">Cancelar Férias</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    return `
      <div class="page-container" style="padding-bottom:100px;">
        <div style="margin-bottom:var(--space-6);">
          <h2 style="margin:0;font-size:1.8rem;font-weight:900;color:var(--text-primary);">Gestão de Férias</h2>
          <p style="margin:0;font-size:var(--text-sm);color:var(--text-secondary);">Acompanhe os funcionários atualmente de férias e os próximos períodos programados.</p>
        </div>

        <div style="display:grid;gap:var(--space-6);">
          <!-- Em Andamento -->
          <div class="card">
            <div style="padding:var(--space-4); border-bottom:1px solid var(--border-card); display:flex; align-items:center; gap:var(--space-2);">
              <div style="width:12px;height:12px;border-radius:50%;background:var(--color-warning);"></div>
              <h3 style="margin:0;font-size:1.1rem;color:var(--text-primary);">Férias em Andamento</h3>
            </div>
            ${renderTable(emAndamento, true)}
          </div>

          <!-- Programadas -->
          <div class="card">
            <div style="padding:var(--space-4); border-bottom:1px solid var(--border-card); display:flex; align-items:center; gap:var(--space-2);">
              <div style="width:12px;height:12px;border-radius:50%;background:var(--text-muted);"></div>
              <h3 style="margin:0;font-size:1.1rem;color:var(--text-primary);">Férias Programadas</h3>
            </div>
            ${renderTable(programadas, false)}
          </div>
        </div>
      </div>
    `;
  }

  function cancelVacation(vacationId, workerId, isLegacy) {
    if (confirm('Deseja realmente cancelar este período de férias? O funcionário ficará disponível imediatamente para o período.')) {
      if (!isLegacy) {
        DB.vacations.delete(vacationId);
      }
      // Sempre limpar o DB.workforce para prevenir legados presos
      DB.workforce.update(workerId, { status: 'Ativo', feriasInicio: null, feriasFim: null });
      
      Toast.success('Férias canceladas com sucesso!');
      Router.navigate('vacations', { force: true });
    }
  }

  return { render, cancelVacation };
})();
