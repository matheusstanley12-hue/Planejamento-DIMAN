/* ============================================================
   PLANEJAMENTO DIMAN-BHZ — Module: Controle de Frequência
   ============================================================ */

window.AttendanceModule = (() => {

  function isEmFerias(w, dateToCheck) {
    if (!w) return false;
    if (w.status === 'Férias') return true;
    const vList = window.DB && DB.vacations ? DB.vacations.list().filter(v => v.workerId === w.id) : [];
    if (vList.length === 0) return false;
    
    const d = dateToCheck ? new Date(dateToCheck) : new Date();
    d.setHours(0,0,0,0);
    const dateIso = d.toISOString().slice(0, 10);
    
    return vList.some(v => dateIso >= v.startDate && dateIso <= v.endDate);
  }

  function render() {
    const session = Auth.getSession();
    
    if (!session || !['Administrador', 'Gerente', 'Desenvolvedor'].includes(session.perfil)) {
      return `
        <div class="page-container" style="display:flex;justify-content:center;align-items:center;height:80vh;">
          <div class="card" style="padding:40px;text-align:center;max-width:400px;border-top:4px solid var(--color-danger);">
            <h2 style="color:var(--text-primary);margin-bottom:10px;">Acesso Negado</h2>
            <p style="color:var(--text-muted);">Apenas Administradores e Gerentes possuem permissão para lançar ocorrências.</p>
          </div>
        </div>
      `;
    }

    const workers = DB.workforce.list().sort((a,b) => a.nome.localeCompare(b.nome));
    const vList = window.DB && DB.vacations ? DB.vacations.list() : [];
    const tIso = new Date().toISOString().slice(0, 10);

    let rowsHtml = '';
    workers.forEach(w => {
      const workerVacations = vList.filter(v => v.workerId === w.id);
      const activeVacation = workerVacations.find(v => tIso >= v.startDate && tIso <= v.endDate);
      const scheduledVacation = workerVacations.find(v => v.startDate > tIso);

      const isFerias = !!activeVacation || isEmFerias(w);
      const feriasStyle = isFerias ? 'background:var(--color-warning-bg);opacity:0.8;' : '';
      
      let feriasBadge = '';
      if (isFerias) {
        const endDate = activeVacation ? activeVacation.endDate : (w.feriasFim || '');
        feriasBadge = `<span class="badge badge-warning" style="margin-left:10px;">Férias (Até ${endDate.split('-').reverse().join('/')})</span>`;
      } else if (scheduledVacation) {
        feriasBadge = `<span class="badge" style="margin-left:10px;background:rgba(0,0,0,0.05);color:var(--text-muted);">Agendado: ${scheduledVacation.startDate.split('-').reverse().join('/')}</span>`;
      } else if (w.feriasInicio && w.feriasInicio > tIso) {
        feriasBadge = `<span class="badge" style="margin-left:10px;background:rgba(0,0,0,0.05);color:var(--text-muted);">Agendado: ${w.feriasInicio.split('-').reverse().join('/')}</span>`;
      }

      rowsHtml += `
        <tr style="border-bottom:1px solid var(--border-card); ${feriasStyle}">
          <td style="padding:15px;">
            <div style="font-weight:bold;color:var(--text-primary);">${w.nome}</div>
            <div style="font-size:12px;color:var(--text-muted);">${w.matricula || 'Sem Matrícula'} | ${w.disciplina || 'Sem Setor'} ${feriasBadge}</div>
          </td>
          <td style="padding:15px;text-align:right;">
            <div style="display:flex;gap:5px;justify-content:flex-end;">
              <button class="btn btn-outline btn-sm" onclick="AttendanceModule.promptLancamento('${w.id}', 'Falta')" style="color:var(--color-danger);border-color:var(--color-danger);">+ Falta</button>
              <button class="btn btn-outline btn-sm" onclick="AttendanceModule.promptLancamento('${w.id}', 'Atraso')" style="color:var(--color-warning);border-color:var(--color-warning);">+ Atraso</button>
              <button class="btn btn-outline btn-sm" onclick="AttendanceModule.promptLancamento('${w.id}', 'Atestado')" style="color:var(--brand-primary);border-color:var(--brand-primary);">+ Atestado</button>
              ${isFerias || scheduledVacation || w.feriasInicio ? 
                `<button class="btn btn-primary btn-sm" onclick="AttendanceModule.cancelFerias('${w.id}')">Cancelar Férias</button>` : 
                `<button class="btn btn-outline btn-sm" onclick="AttendanceModule.promptFerias('${w.id}')">Programar Férias</button>`
              }
            </div>
          </td>
        </tr>
      `;
    });

    return `
      <div class="page-container" style="padding-bottom:100px;">
        <div style="margin-bottom:var(--space-6);">
          <h2 style="margin:0;font-size:1.8rem;font-weight:900;color:var(--text-primary);">Controle de Frequência</h2>
          <p style="margin:0;font-size:var(--text-sm);color:var(--text-secondary);">Gerencie as ausências, atestados e férias programadas da equipe de execução.</p>
        </div>

        <div class="card" style="overflow:hidden;">
          <div class="table-responsive">
            <table class="table" style="width:100%;border-collapse:collapse;">
              <thead style="background:var(--bg-base);border-bottom:2px solid var(--border-card);">
                <tr>
                  <th style="padding:15px;text-align:left;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Funcionário</th>
                  <th style="padding:15px;text-align:right;color:var(--text-muted);font-size:12px;text-transform:uppercase;">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div id="attendance-modals"></div>
    `;
  }

  function promptFerias(workerId) {
    const w = DB.workforce.get(workerId);
    if (!w) return;

    const modalHtml = `
      <div class="modal-overlay" id="modal-ferias">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Programar Férias</div>
            <button class="modal-close" onclick="closeModal('modal-ferias')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p><strong>Funcionário:</strong> ${w.nome}</p>
            <div style="display:flex;gap:10px;">
              <div class="form-group" style="flex:1;">
                <label>Data de Início</label>
                <input type="date" id="ferias-inicio" class="form-control" required />
              </div>
              <div class="form-group" style="flex:1;">
                <label>Data de Fim</label>
                <input type="date" id="ferias-fim" class="form-control" required />
              </div>
            </div>
            <button class="btn btn-primary" style="width:100%;margin-top:10px;" onclick="AttendanceModule.saveFerias('${workerId}')">Salvar Férias</button>
          </div>
        </div>
      </div>
    `;
    const container = document.getElementById('attendance-modals') || document.createElement('div');
    if (!container.id) { container.id = 'attendance-modals'; document.body.appendChild(container); }
    container.innerHTML = modalHtml;
    openModal('modal-ferias');
  }

  function saveFerias(workerId) {
    const ini = document.getElementById('ferias-inicio').value;
    const fim = document.getElementById('ferias-fim').value;

    if (!ini || !fim) {
      return Toast.error('Atenção', 'Data de Início e Fim são obrigatórias.');
    }

    if (new Date(ini) > new Date(fim)) {
      return Toast.error('Atenção', 'A data de fim deve ser depois da data de início.');
    }

    const vList = window.DB && DB.vacations ? DB.vacations.list().filter(v => v.workerId === workerId) : [];
    const activeV = vList.find(v => v.startDate === ini || v.endDate === fim); // simplest way to prevent duplicates, or just add new
    if (activeV) {
      DB.vacations.update(activeV.id, { startDate: ini, endDate: fim });
    } else {
      DB.vacations.add({ id: window.DB.uid('vac'), workerId, startDate: ini, endDate: fim });
    }

    closeModal('modal-ferias');
    Toast.success('Salvo', 'Férias agendadas com sucesso!');
    Router.navigate('attendance', { force: true });
  }

  function cancelFerias(workerId) {
    window.uiConfirm('Deseja cancelar o período de férias agendado/ativo para este funcionário?', (res) => {
      if (!res) return;
      const vList = window.DB && DB.vacations ? DB.vacations.list().filter(v => v.workerId === workerId) : [];
      const tIso = new Date().toISOString().slice(0, 10);
      const toDelete = vList.find(v => tIso <= v.endDate); // Delete current or future vacation
      if (toDelete) {
        DB.vacations.delete(toDelete.id);
      }
      
      // Clear legacy just in case
      DB.workforce.update(workerId, { status: 'Ativo', feriasInicio: null, feriasFim: null });
      
      Toast.success('Cancelado', 'As férias foram removidas.');
      Router.navigate('attendance', { force: true });
    });
  }

  function promptLancamento(workerId, tipo) {
    const w = DB.workforce.get(workerId);
    if (!w) return;

    let extraFields = '';
    if (tipo === 'Atraso') {
      extraFields = `
        <div class="form-group">
          <label>Horas de Atraso (H)</label>
          <input type="number" step="0.5" id="att-horas" class="form-control" placeholder="Ex: 2" required />
        </div>
      `;
    } else if (tipo === 'Atestado' || tipo === 'Falta') {
      extraFields = `
        <div class="form-group">
          <label>Horas Ausentes (H) no Dia</label>
          <input type="number" step="0.5" id="att-horas" class="form-control" value="8" required />
          <small class="form-hint">Quantas horas o funcionário deixou de trabalhar.</small>
        </div>
      `;
    }

    const modalHtml = `
      <div class="modal-overlay" id="modal-attendance">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Lançar ${tipo}</div>
            <button class="modal-close" onclick="closeModal('modal-attendance')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p><strong>Funcionário:</strong> ${w.nome}</p>
            ${extraFields}
            <div class="form-group">
              <label>Data</label>
              <input type="date" id="att-data" class="form-control" value="${new Date().toISOString().slice(0,10)}" required />
            </div>
            <div class="form-group">
              <label>Observação (Motivo/Detalhes)</label>
              <textarea id="att-obs" class="form-control" rows="2"></textarea>
            </div>
            <button class="btn btn-primary" style="width:100%" onclick="AttendanceModule.saveLancamento('${workerId}', '${tipo}')">Confirmar Lançamento</button>
          </div>
        </div>
      </div>
    `;
    const container = document.getElementById('attendance-modals') || document.createElement('div');
    if (!container.id) { container.id = 'attendance-modals'; document.body.appendChild(container); }
    container.innerHTML = modalHtml;
    openModal('modal-attendance');
  }

  function saveLancamento(workerId, tipo) {
    const session = Auth.getSession();
    const w = DB.workforce.get(workerId);
    
    const horasEl = document.getElementById('att-horas');
    const horas = horasEl ? parseFloat(horasEl.value) : 8;
    const data = document.getElementById('att-data').value;
    const obs = document.getElementById('att-obs').value;

    if (!data) {
      Toast.error('Atenção', 'Data é obrigatória');
      return;
    }

    DB.timesheets.create({
      workerId: w.id,
      workerNome: w.nome,
      equipmentId: null,
      taskId: null,
      data: data,
      horaInicio: new Date().toISOString(),
      horaFim: new Date().toISOString(),
      horasTrabalhadas: horas,
      tipo: tipo, // 'Falta', 'Atraso', 'Atestado'
      observacao: obs,
      motivoPausa: obs,
      lancadoPor: session.nome
    });

    closeModal('modal-attendance');
    Toast.success('Salvo', `${tipo} lançado com sucesso para ${w.nome}`);
    Router.navigate('attendance', { force: true });
  }

  return { render, promptLancamento, saveLancamento, promptFerias, saveFerias, cancelFerias, isEmFerias };
})();
