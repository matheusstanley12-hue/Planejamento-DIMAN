window.TasksOngoingModule = (() => {
  let _interval;

  function render() {
    return `
      <div class="page-container">
        <div class="section-header">
          <div class="section-title">
            <div class="section-title-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg>
            </div>
            Tarefas Em andamento / Impedidas
          </div>
          <div style="font-size:var(--text-sm);color:var(--text-muted);">(Atualização automática)</div>
        </div>

        <div id="ongoing-tasks-content">
          ${renderContent()}
        </div>
      </div>
    `;
  }

  function renderContent() {
    const rawTasks = DB.tasks.getAll() || [];
    // Filter tasks that are not concluded and not uninitiated.
    const activeTasks = rawTasks.filter(t => ['Em Andamento', 'Bloqueada', 'Aguardando Peça'].includes(t.status));
    
    const eqs = DB.equipment.list() || [];
    const equipMap = {};
    eqs.forEach(e => { equipMap[e.id] = e; });

    const workers = (DB.workforce ? DB.workforce.list() : []) || [];
    const workerMap = {};
    workers.forEach(w => { workerMap[w.id] = w; });

    const timesheets = (DB.timesheets ? DB.timesheets.list() : []) || [];
    const restrictions = (DB.restrictions ? DB.restrictions.getAll() : []) || [];

    if (activeTasks.length === 0) {
      return '<div class="empty-state"><p>Nenhuma tarefa em andamento ou bloqueada no momento.</p></div>';
    }

    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:var(--space-4);">
        ${activeTasks.map(t => renderCard(t, equipMap, workerMap, timesheets, restrictions)).join('')}
      </div>
    `;
  }

  function formatTimeDiff(startTimeIso) {
    const start = new Date(startTimeIso).getTime();
    const now = new Date().getTime();
    let diffMins = Math.floor((now - start) / 60000);
    if (diffMins < 0) diffMins = 0;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `${h}h ${m}m`;
  }

  function renderCard(t, equipMap, workerMap, timesheets, restrictions) {
    const eq = equipMap[t.equipmentId];
    const eqCode = eq ? eq.codigo : '—';
    const eqSector = eq ? eq.tipo : '—';

    // Execution data
    const taskTimesheets = timesheets.filter(ts => ts.taskId === t.id);
    const activeTs = taskTimesheets.filter(ts => !ts.endTime);

    // Impediment data
    const openRests = restrictions.filter(r => r.equipmentId === t.equipmentId && r.status !== 'Fechada' && (r.tarefaBloqueada === t.descricao || r.tipo === 'Tarefa Bloqueada' || t.status === 'Aguardando Peça'));

    let statusHtml = '';
    let detailsHtml = '';
    let borderColor = 'var(--border-card)';

    if (t.status === 'Em Andamento') {
      if (activeTs.length > 0) {
        borderColor = 'var(--brand-primary)';
        statusHtml = `<span class="badge badge-primary" style="animation: pulse 2s infinite;">Em Execução</span>`;
        detailsHtml = activeTs.map(ts => {
          const wName = workerMap[ts.workerId]?.nome || 'Desconhecido';
          const timeStr = formatTimeDiff(ts.startTime);
          return `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);margin-top:6px;"><svg style="width:12px;height:12px;color:var(--brand-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></svg> <b>${wName}</b> executando há ${timeStr}</div>`;
        }).join('');
      } else {
        borderColor = 'var(--color-warning)';
        statusHtml = `<span class="badge badge-warning">Pausada</span>`;
        detailsHtml = `<div style="font-size:12px;color:var(--color-warning);margin-top:6px;">Nenhum apontamento ativo. Tarefa encontra-se pausada.</div>`;
      }
    } else if (t.status === 'Bloqueada') {
      borderColor = 'var(--color-danger)';
      statusHtml = `<span class="badge badge-danger">Bloqueada</span>`;
      if (openRests.length > 0) {
        detailsHtml = openRests.map(r => `<div style="font-size:12px;color:var(--color-danger);margin-top:6px;background:rgba(244,67,54,0.1);padding:6px;border-radius:4px;"><b>Motivo:</b> ${r.descricao}<br><span style="font-size:10px;opacity:0.8;">Desde: ${new Date(r.createdAt).toLocaleString('pt-BR')}</span></div>`).join('');
      } else {
        detailsHtml = `<div style="font-size:12px;color:var(--color-danger);margin-top:6px;">Bloqueada (Motivo não especificado)</div>`;
      }
    } else if (t.status === 'Aguardando Peça') {
      borderColor = 'var(--color-warning)';
      statusHtml = `<span class="badge badge-warning">Aguardando Peça</span>`;
      if (openRests.length > 0) {
        detailsHtml = openRests.map(r => `<div style="font-size:12px;color:var(--color-warning);margin-top:6px;background:rgba(255,152,0,0.1);padding:6px;border-radius:4px;"><b>Peça/Falta:</b> ${r.descricao}<br><span style="font-size:10px;opacity:0.8;">Desde: ${new Date(r.createdAt).toLocaleString('pt-BR')}</span></div>`).join('');
      } else {
        detailsHtml = `<div style="font-size:12px;color:var(--color-warning);margin-top:6px;">Aguardando Peça para continuar</div>`;
      }
    }

    return `
      <div class="card" style="border-top: 4px solid ${borderColor}; display:flex; flex-direction:column; padding:var(--space-4);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div>
            <div style="font-size:14px; font-weight:800; color:var(--text-primary); margin-bottom:2px;">${t.descricao}</div>
            <div style="font-size:11px; color:var(--text-muted);">${eqCode} &middot; ${eqSector} &middot; ${t.disciplina}</div>
          </div>
          <div>${statusHtml}</div>
        </div>
        
        <div style="flex:1;">
          ${detailsHtml}
        </div>

        <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-card); display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:11px; color:var(--text-muted);">
            Avanço: <span style="font-weight:700; color:var(--text-primary);">${t.pctExecutado || 0}%</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="TasksOngoingModule.goToEq('${t.equipmentId}')">Ver Equipamento</button>
        </div>
      </div>
    `;
  }

  function goToEq(eqId) {
    if(window.TasksModule) {
      Router.navigate('tasks', {force:true});
      setTimeout(() => {
        TasksModule.setEq(eqId);
      }, 100);
    }
  }

  function startAutoRefresh() {
    if (_interval) clearInterval(_interval);
    _interval = setInterval(() => {
      const el = document.getElementById('ongoing-tasks-content');
      if (el) {
        el.innerHTML = renderContent();
      } else {
        clearInterval(_interval);
      }
    }, 30000); // Atualiza a cada 30 segundos
  }

  // Hook into router initialization or call startAutoRefresh directly on render if preferred
  const originalRender = render;
  render = function() {
    startAutoRefresh();
    return originalRender();
  };

  return { render, goToEq };
})();
