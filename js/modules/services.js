/* ============================================================
   PLANEJAMENTO DIMAN-BHZ — Module: Services (Solicitações de Serviço)
   ============================================================ */

window.ServicesModule = (() => {
  let activeTab = 'pendentes';

  function render() {
    const session = Auth.getSession();
    const isPCM = ['Desenvolvedor', 'Administrador', 'Planejador', 'Gerente'].includes(session.perfil);
    const isEncarregado = ['Supervisor', 'Encarregado'].includes(session.perfil);
    
    if (!isPCM && !isEncarregado) {
      return `<div class="empty-state"><h3>Acesso Restrito</h3><p>Apenas PCM e Encarregados podem gerenciar solicitações.</p></div>`;
    }

    const solicitacoes = window.DB.solicitacoes ? window.DB.solicitacoes.list() : [];
    
    // Filter logic
    let mySols = [];
    if (isPCM) {
      // PCM sees Usinagem needing approval, plus everything else for oversight
      mySols = solicitacoes;
    } else if (isEncarregado) {
      // Encarregado sees their sector
      mySols = solicitacoes.filter(s => s.setorDestino === session.disciplina);
    }

    const pendentes = mySols.filter(s => s.status === 'Aguardando Aprovação PCM' || s.status === 'Aguardando Encarregado');
    const andamento = mySols.filter(s => s.status === 'Em Execução');
    const concluidas = mySols.filter(s => s.status === 'Concluída' || s.status === 'Rejeitada');

    let currentList = activeTab === 'pendentes' ? pendentes : activeTab === 'andamento' ? andamento : concluidas;

    const html = `
      <div class="page-container">
        <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);">
          <div>
            <h1 class="page-title">Solicitações de Serviço</h1>
            <p class="page-subtitle">Aprovações e Destinação de Mão de Obra</p>
          </div>
        </div>

        <div class="tabs" style="margin-bottom:var(--space-4);">
          <button class="tab ${activeTab === 'pendentes' ? 'active' : ''}" onclick="window.ServicesModule.setTab('pendentes')">
            Pendentes (${pendentes.length})
          </button>
          <button class="tab ${activeTab === 'andamento' ? 'active' : ''}" onclick="window.ServicesModule.setTab('andamento')">
            Em Andamento (${andamento.length})
          </button>
          <button class="tab ${activeTab === 'concluidas' ? 'active' : ''}" onclick="window.ServicesModule.setTab('concluidas')">
            Histórico (${concluidas.length})
          </button>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Equipamento</th>
                <th>Solicitante</th>
                <th>Setor Destino</th>
                <th>Descrição</th>
                <th>Prazo</th>
                <th>Status</th>
                <th style="text-align:right;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${currentList.length === 0 ? `<tr><td colspan="8" class="text-center" style="padding:var(--space-6);color:var(--text-muted);">Nenhuma solicitação encontrada nesta aba.</td></tr>` : ''}
              ${currentList.map(s => {
                const eq = DB.equipment.get(s.equipmentId);
                const isLate = s.prazo < window.DB.now().slice(0, 10) && s.status !== 'Concluída';
                
                let actions = '';
                if (s.status === 'Aguardando Aprovação PCM' && isPCM) {
                  actions = `
                    <button class="btn btn-success btn-xs" onclick="window.ServicesModule.approvePCM('${s.id}')">Aprovar OS</button>
                    <button class="btn btn-danger btn-xs" onclick="window.ServicesModule.reject('${s.id}')">Rejeitar</button>
                  `;
                } else if (s.status === 'Aguardando Encarregado' && (isEncarregado || isPCM)) {
                  actions = `
                    <button class="btn btn-primary btn-xs" onclick="window.ServicesModule.assignWorker('${s.id}')">Destinar Mão de Obra</button>
                  `;
                } else if (s.status === 'Em Execução' && (isEncarregado || isPCM)) {
                   actions = `
                    <button class="btn btn-outline btn-xs" onclick="window.ServicesModule.assignWorker('${s.id}')">Alterar Recurso</button>
                  `;
                }

                return `
                  <tr>
                    <td>${new Date(s.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td><strong>${eq ? eq.codigo : '—'}</strong></td>
                    <td>${s.solicitanteNome}</td>
                    <td><span class="badge badge-ghost">${s.setorDestino}</span></td>
                    <td>
                      ${s.critico ? '<span class="badge badge-danger" style="margin-right:4px;">Crítico</span>' : ''}
                      ${s.descricao}
                    </td>
                    <td class="${isLate ? 'text-danger' : ''}" style="font-weight:600;">${new Date(s.prazo).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <span class="badge ${s.status.includes('Aguardando') ? 'badge-warning' : s.status === 'Em Execução' ? 'badge-primary' : s.status === 'Concluída' ? 'badge-success' : 'badge-danger'}">
                        ${s.status}
                      </span>
                    </td>
                    <td style="text-align:right;display:flex;gap:4px;justify-content:flex-end;">
                      ${actions}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div id="services-modals"></div>
    `;
    return html;
  }

  function setTab(tab) {
    activeTab = tab;
    Router.navigate('services', { force: true });
  }

  function approvePCM(id) {
    if (!confirm('Deseja aprovar esta solicitação de Usinagem e gerar uma ordem de serviço (Tarefa)?')) return;
    
    const s = window.DB.solicitacoes.list().find(x => x.id === id);
    if (!s) return;

    // Create task
    const taskData = {
      equipmentId: s.equipmentId,
      codigo: 'USIN-' + Math.random().toString().slice(2, 6),
      descricao: `[SOLICITAÇÃO] ${s.descricao}`,
      disciplina: s.setorDestino,
      responsavel: '', // Empty until encarregado assigns
      prioridade: s.critico ? 'Crítica' : 'Alta',
      status: 'Aguardando Recurso',
      dataPlanejadaInicio: new Date().toISOString().slice(0, 10),
      dataPlanejadaTermino: s.prazo,
      horasPlanejadas: 0,
      horasRealizadas: 0,
      pctExecutado: 0,
      critico: s.critico,
      observacoes: '',
      predecessoras: [],
      solicitacaoId: s.id,
      createdAt: window.DB.now()
    };
    
    window.DB.tasks.create(taskData);
    
    // After creating task, we need to find its ID (the create function generates one and pushes to syncQueue/localStorage)
    // A quick hack: list tasks, sort by createdAt desc, get first one
    const tasks = window.DB.tasks.getAll();
    const newTask = tasks[tasks.length - 1]; // Assume it's the last added

    window.DB.solicitacoes.update(id, { 
      status: 'Aguardando Encarregado', 
      pcmApprovadoAt: window.DB.now(),
      osId: newTask.id 
    });
    
    Toast.success('Aprovada', 'Ordem de Serviço gerada e enviada para o Encarregado.');
    Router.navigate('services', { force: true });
  }

  function reject(id) {
    const motivo = prompt('Motivo da rejeição:');
    if (motivo === null) return;
    
    window.DB.solicitacoes.update(id, { status: 'Rejeitada', observacoes: motivo });
    Toast.info('Rejeitada', 'Solicitação foi rejeitada.');
    Router.navigate('services', { force: true });
  }

  function assignWorker(id) {
    const s = window.DB.solicitacoes.list().find(x => x.id === id);
    if (!s) return;

    // Check if task exists (for non-Usinagem, it might not exist yet if we don't auto-create it)
    // Actually, let's auto-create it here if osId is missing
    let taskId = s.osId;
    if (!taskId) {
      const taskData = {
        equipmentId: s.equipmentId,
        codigo: s.setorDestino.substring(0,3).toUpperCase() + '-' + Math.random().toString().slice(2, 6),
        descricao: `[SOLICITAÇÃO] ${s.descricao}`,
        disciplina: s.setorDestino,
        responsavel: '',
        prioridade: s.critico ? 'Crítica' : 'Alta',
        status: 'Aguardando Recurso',
        dataPlanejadaInicio: new Date().toISOString().slice(0, 10),
        dataPlanejadaTermino: s.prazo,
        horasPlanejadas: 0,
        horasRealizadas: 0,
        pctExecutado: 0,
        critico: s.critico,
        observacoes: '',
        predecessoras: [],
        solicitacaoId: s.id,
        createdAt: window.DB.now()
      };
      window.DB.tasks.create(taskData);
      const tasks = window.DB.tasks.getAll();
      taskId = tasks[tasks.length - 1].id;
      window.DB.solicitacoes.update(id, { osId: taskId });
    }

    const workers = window.DB.workforce.list().filter(w => w.disciplina === s.setorDestino);
    
    const modalHtml = `
      <div class="modal-overlay" id="modal-assign">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Destinar Mão de Obra</div>
            <button class="modal-close" onclick="closeModal('modal-assign')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom:12px;color:var(--text-secondary);font-size:13px;">Selecione o executante para a atividade: <strong>${s.descricao}</strong></p>
            <div class="form-group">
              <label>Executante (${s.setorDestino})</label>
              <select id="sv-assign-worker">
                <option value="">-- Selecione --</option>
                ${workers.map(w => `<option value="${w.nome}">${w.nome}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('modal-assign')">Cancelar</button>
            <button class="btn btn-primary" onclick="window.ServicesModule.saveAssign('${s.id}', '${taskId}')">Confirmar</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('services-modals').innerHTML = modalHtml;
    openModal('modal-assign');
  }

  function saveAssign(solId, taskId) {
    const workerName = document.getElementById('sv-assign-worker').value;
    if (!workerName) {
      Toast.error('Erro', 'Selecione um executante.');
      return;
    }

    // Update Task
    const task = window.DB.tasks.get(taskId);
    if (task) {
      window.DB.tasks.update(taskId, { responsavel: workerName, status: 'Em Andamento' });
    }

    // Update Solicitacao
    window.DB.solicitacoes.update(solId, { status: 'Em Execução' });

    Toast.success('Mão de Obra Destinada!', workerName + ' agora é o responsável pelo serviço.');
    closeModal('modal-assign');
    Router.navigate('services', { force: true });
  }

  return { render, setTab, approvePCM, reject, assignWorker, saveAssign };
})();
