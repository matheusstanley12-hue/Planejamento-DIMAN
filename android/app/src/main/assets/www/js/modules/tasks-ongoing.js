window.TasksOngoingModule = (() => {
  let _interval;
  let _liveInterval;
  let _eqFilter = '';
  let _statusFilter = '';

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
          <div style="font-size:var(--text-sm);color:var(--text-muted);">(Tempo real)</div>
        </div>

        <div style="margin-bottom:var(--space-4); display:flex; align-items:center; gap:16px; background:var(--bg-card); padding:12px 16px; border-radius:var(--radius-md); border:1px solid var(--border-card); flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-weight:600; color:var(--text-secondary); margin:0;">Equipamento:</label>
            <select class="form-control" style="max-width:300px; padding:6px 12px;" onchange="TasksOngoingModule.setEqFilter(this.value)">
              <option value="">Todos os Equipamentos</option>
              ${renderEqOptions()}
            </select>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-weight:600; color:var(--text-secondary); margin:0;">Status:</label>
            <select class="form-control" style="max-width:200px; padding:6px 12px;" onchange="TasksOngoingModule.setStatusFilter(this.value)">
              <option value="" ${_statusFilter === '' ? 'selected' : ''}>Todos os Status</option>
              <option value="Em Execução" ${_statusFilter === 'Em Execução' ? 'selected' : ''}>Em Execução</option>
              <option value="Pausada" ${_statusFilter === 'Pausada' ? 'selected' : ''}>Pausada</option>
              <option value="Aguardando Peça" ${_statusFilter === 'Aguardando Peça' ? 'selected' : ''}>Aguardando Peça</option>
              <option value="Bloqueada" ${_statusFilter === 'Bloqueada' ? 'selected' : ''}>Bloqueada</option>
            </select>
          </div>
        </div>

        <div id="ongoing-tasks-content">
          ${renderContent()}
        </div>
      </div>
    `;
  }

  function renderEqOptions() {
    const eqs = DB.equipment.list() || [];
    return eqs.map(e => `<option value="${e.id}" ${_eqFilter === e.id ? 'selected' : ''}>${e.codigo} - ${e.tipo || ''}</option>`).join('');
  }

  function setEqFilter(val) {
    _eqFilter = val;
    const el = document.getElementById('ongoing-tasks-content');
    if (el) el.innerHTML = renderContent();
    updateLiveTimers();
  }

  function setStatusFilter(val) {
    _statusFilter = val;
    const el = document.getElementById('ongoing-tasks-content');
    if (el) el.innerHTML = renderContent();
    updateLiveTimers();
  }

  function renderContent() {
    const rawTasks = DB.tasks.getAll() || [];
    let activeTasks = rawTasks.filter(t => ['Em Andamento', 'Bloqueada', 'Aguardando Peça'].includes(t.status));
    
    if (_eqFilter) {
      activeTasks = activeTasks.filter(t => t.equipmentId === _eqFilter);
    }

    const timesheets = (DB.timesheets ? DB.timesheets.list() : []) || [];
    const restrictions = (DB.restrictions ? DB.restrictions.getAll() : []) || [];
    const workers = (DB.workforce ? DB.workforce.list() : []) || [];
    const workerMap = {};
    workers.forEach(w => { workerMap[w.id] = w; });
    
    if (_statusFilter) {
      activeTasks = activeTasks.filter(t => {
        if (_statusFilter === 'Aguardando Peça') return t.status === 'Aguardando Peça';
        if (_statusFilter === 'Bloqueada') return t.status === 'Bloqueada';
        if (_statusFilter === 'Pausada' || _statusFilter === 'Em Execução') {
          if (t.status !== 'Em Andamento') return false;
          const activeW = workers.filter(w => w.currentState === 'Trabalhando' && w.currentTaskId === t.id);
          if (_statusFilter === 'Em Execução') return activeW.length > 0;
          if (_statusFilter === 'Pausada') return activeW.length === 0;
        }
        return true;
      });
    }

    activeTasks.sort((a, b) => {
      if (a.status === 'Em Andamento' && b.status !== 'Em Andamento') return -1;
      if (b.status === 'Em Andamento' && a.status !== 'Em Andamento') return 1;
      
      if (a.status === 'Em Andamento' && b.status === 'Em Andamento') {
        const aActive = workers.some(w => w.currentState === 'Trabalhando' && w.currentTaskId === a.id);
        const bActive = workers.some(w => w.currentState === 'Trabalhando' && w.currentTaskId === b.id);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
      }
      return 0;
    });
    
    const eqs = DB.equipment.list() || [];
    const equipMap = {};
    eqs.forEach(e => { equipMap[e.id] = e; });

    if (activeTasks.length === 0) {
      return '<div class="empty-state"><p>Nenhuma tarefa em andamento ou bloqueada no momento.</p></div>';
    }

    return `
      <div style="display:flex;flex-direction:column;gap:var(--space-2);" class="stagger">
        ${activeTasks.map(t => renderCard(t, equipMap, workerMap, workers, timesheets, restrictions)).join('')}
      </div>
    `;
  }

  function renderCard(t, equipMap, workerMap, workers, timesheets, restrictions) {
    const eq = equipMap[t.equipmentId];
    const eqCode = eq ? eq.codigo : '—';

    const taskTimesheets = timesheets.filter(ts => ts.taskId === t.id);
    const activeWorkers = workers.filter(w => w.currentState === 'Trabalhando' && w.currentTaskId === t.id);
    const openRests = restrictions.filter(r => r.equipmentId === t.equipmentId && r.status !== 'Fechada' && (r.tarefaBloqueada === t.descricao || r.tipo === 'Tarefa Bloqueada' || t.status === 'Aguardando Peça'));

    let statusHtml = '';
    let detailsHtml = '';
    let borderColor = 'var(--border-card)';

    if (t.status === 'Em Andamento') {
      if (activeWorkers.length > 0) {
        borderColor = 'var(--brand-primary)';
        statusHtml = `<span class="badge badge-primary" style="animation: pulse 2s infinite; font-size:11px;">Em Execução</span>`;
        detailsHtml = activeWorkers.map(w => {
          return `<span style="font-size:11px;color:var(--brand-primary);font-weight:600;display:inline-flex;align-items:center;gap:4px;background:rgba(59,130,246,0.1);padding:4px 8px;border-radius:12px;">🏃 ${w.nome} (<span class="live-timer" data-start="${w.currentActionStartTime}"></span>)</span>`;
        }).join(' ');
      } else {
        borderColor = 'var(--color-warning)';
        statusHtml = `<span class="badge badge-warning" style="font-size:11px;">Pausada</span>`;
        
        let pauseStartIso = '';
        if (taskTimesheets.length > 0) {
          const closedTs = taskTimesheets.filter(ts => ts.horaFim).sort((a,b) => new Date(b.horaFim).getTime() - new Date(a.horaFim).getTime());
          if (closedTs.length > 0) {
            pauseStartIso = closedTs[0].horaFim;
          }
        } else if (t.dataReplanejada || t.dataPlanejadaInicio) {
           pauseStartIso = t.dataReplanejada || t.dataPlanejadaInicio;
        }

        if (pauseStartIso) {
           detailsHtml = `<span style="font-size:11px;color:var(--color-warning);font-weight:600;background:rgba(245,158,11,0.1);padding:4px 8px;border-radius:12px;">⏸️ Pausada há <span class="live-timer" data-start="${pauseStartIso}"></span></span>`;
        } else {
           detailsHtml = `<span style="font-size:11px;color:var(--color-warning);font-weight:600;background:rgba(245,158,11,0.1);padding:4px 8px;border-radius:12px;">⏸️ Pausada há Desconhecido</span>`;
        }
      }
    } else if (t.status === 'Bloqueada') {
      borderColor = 'var(--color-danger)';
      statusHtml = `<span class="badge badge-danger" style="font-size:11px;">Bloqueada</span>`;
      if (openRests.length > 0) {
        detailsHtml = openRests.map(r => `<span style="font-size:11px;color:var(--color-danger);font-weight:600;display:inline-flex;align-items:center;gap:4px;background:rgba(239,68,68,0.1);padding:4px 8px;border-radius:12px;">🔒 Há <span class="live-timer" data-start="${r.createdAt}"></span> - Motivo: ${r.descricao}</span>`).join(' ');
      } else {
        detailsHtml = `<span style="font-size:11px;color:var(--color-danger);font-weight:600;background:rgba(239,68,68,0.1);padding:4px 8px;border-radius:12px;">🔒 Motivo não especificado</span>`;
      }
    } else if (t.status === 'Aguardando Peça') {
      borderColor = 'var(--color-warning)';
      statusHtml = `<span class="badge badge-warning" style="font-size:11px;">Aguardando Peça</span>`;
      if (openRests.length > 0) {
        detailsHtml = openRests.map(r => `<span style="font-size:11px;color:var(--color-warning);font-weight:600;display:inline-flex;align-items:center;gap:4px;background:rgba(245,158,11,0.1);padding:4px 8px;border-radius:12px;">📦 Há <span class="live-timer" data-start="${r.createdAt}"></span> - Falta: ${r.descricao}</span>`).join(' ');
      } else {
        detailsHtml = `<span style="font-size:11px;color:var(--color-warning);font-weight:600;background:rgba(245,158,11,0.1);padding:4px 8px;border-radius:12px;">📦 Aguardando Peça</span>`;
      }
    }

    const today = new Date().toISOString().slice(0,10);
    function formatDateBr(iso) { if(!iso)return ''; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; }
    const plannedStr = t.dataPlanejadaInicio ? `Plan: ${formatDateBr(t.dataPlanejadaInicio)} &rarr; ${formatDateBr(t.dataPlanejadaTermino)}` : '';

    return `<div style="display:flex;align-items:center;gap:var(--space-4);padding:var(--space-4);background:var(--bg-card);border:1px solid ${borderColor};border-radius:var(--radius-md);transition:all .2s;" class="hover-lift">
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-1);flex-wrap:wrap;">
          ${t.critico ? '<span style="font-size:.7rem;background:var(--color-danger);color:white;padding:2px 6px;border-radius:3px;font-weight:700;">CRÍTICO</span>' : ''}
          <span style="font-size:var(--text-sm);font-weight:700;color:var(--text-primary);text-transform:uppercase;">${t.descricao}</span>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;margin-bottom:6px;">
          <span style="font-size:var(--text-xs);color:var(--text-muted);font-weight:600;">${eqCode}</span>
          <span class="badge badge-ghost" style="font-size:10px">${t.disciplina}</span>
          <span style="font-size:var(--text-xs);color:var(--text-muted)">👤 ${t.responsavel||'—'}</span>
          ${plannedStr ? `<span style="font-size:var(--text-xs);color:var(--text-muted)">📅 ${plannedStr}</span>` : ''}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${detailsHtml}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:var(--space-4);flex-shrink:0;">
        <div style="width:100px;">
          <div class="progress-track" style="margin-bottom:4px;"><div class="progress-fill ${t.pctExecutado>=80?'success':t.pctExecutado>=50?'':'warning'}" style="width:${t.pctExecutado}%"></div></div>
          <div style="font-size:11px;text-align:right;color:var(--text-muted);font-weight:600;">${t.pctExecutado}%</div>
        </div>
        <div style="min-width: 100px; text-align:center;">
          ${statusHtml}
        </div>
        <div style="display:flex;gap:var(--space-1);">
          <button class="btn btn-secondary btn-sm" onclick="TasksOngoingModule.goToEq('${t.equipmentId}')">Ir p/ Equipamento</button>
        </div>
      </div>
    </div>`;
  }

  function goToEq(eqId) {
    if(window.TasksModule) {
      Router.navigate('tasks', {force:true});
      setTimeout(() => {
        TasksModule.setEq(eqId);
      }, 100);
    }
  }

  function updateLiveTimers() {
    const els = document.querySelectorAll('.live-timer');
    const now = new Date().getTime();
    els.forEach(el => {
      const startStr = el.getAttribute('data-start');
      if (!startStr) return;
      const start = new Date(startStr).getTime();
      let diffSecs = Math.floor((now - start) / 1000);
      if (diffSecs < 0) diffSecs = 0;
      
      const days = Math.floor(diffSecs / 86400);
      const hours = Math.floor((diffSecs % 86400) / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      const secs = diffSecs % 60;
      
      let str = '';
      if (days > 0) str += `${days}d `;
      if (hours > 0 || days > 0) {
        str += `${hours.toString().padStart(2, '0')}:`;
      }
      str += `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      el.innerText = str;
    });
  }

  function startAutoRefresh() {
    if (_interval) clearInterval(_interval);
    if (_liveInterval) clearInterval(_liveInterval);
    
    // Auto refresh data
    _interval = setInterval(() => {
      const el = document.getElementById('ongoing-tasks-content');
      if (el) {
        el.innerHTML = renderContent();
        updateLiveTimers();
      } else {
        clearInterval(_interval);
        clearInterval(_liveInterval);
      }
    }, 1800000); 

    // Live update DOM timers
    _liveInterval = setInterval(() => {
      if (!document.getElementById('ongoing-tasks-content')) {
        clearInterval(_interval);
        clearInterval(_liveInterval);
        return;
      }
      updateLiveTimers();
    }, 1000);
  }

  const originalRender = render;
  render = function() {
    startAutoRefresh();
    // setTimeout to ensure elements are in DOM before updating the very first time
    setTimeout(updateLiveTimers, 50);
    return originalRender();
  };

  return { render, goToEq, setEqFilter, setStatusFilter };
})();
