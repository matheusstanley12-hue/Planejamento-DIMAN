/* ============================================================
   PLANEJAMENTO DIMAN-BHZ — Module: Worker Panel (Executante)
   ============================================================ */

window.WorkerPanel = (() => {
  let activeTab = 'hoje'; // 'atrasadas' | 'hoje' | 'futuras' | 'concluidas'
  let eqFilter = '';
  
  function getMyWorker(session) {
    const workers = window.DB.workforce.list();
    return workers.find(w => (w.matricula && session.matricula && w.matricula === session.matricula) || w.nome === session.nome);
  }

  function getMyEquipments(session) {
    const eqs = window.DB.equipment.list();
    const myWorker = getMyWorker(session);
    const myDirectEqId = myWorker ? myWorker.equipmentId : null;
    const myWorkerName = myWorker ? myWorker.nome : session.nome;
    
    return eqs.filter(e => {
      const map = e.workforceMap || {};
      return Object.values(map).includes(myWorkerName) || Object.values(map).includes(session.nome) || e.id === myDirectEqId;
    });
  }

  function checkPredecessors(task, allTasks) {
    const preds = task.predecessoras || [];
    const blockedBy = [];
    preds.forEach(pid => {
      const pTask = allTasks.find(t => t.id === pid);
      if (pTask && pTask.status !== 'Concluída') {
        blockedBy.push(pTask.codigo || pTask.descricao);
      }
    });
    return blockedBy;
  }

  // --- TIME TRACKING (NEW) ---
  function startTask(taskId) {
    const session = Auth.getSession();
    const myWorker = getMyWorker(session);
    if (!myWorker) return Toast.error('Erro', 'Cadastro não encontrado no sistema.');
    if (myWorker.currentState && myWorker.currentState !== 'Ocioso') {
      return Toast.error('Atenção', 'Você já tem uma tarefa ou pausa em andamento. Finalize primeiro.');
    }

    const t = DB.tasks.get(taskId);
    if (!t) return;

    DB.workforce.update(myWorker.id, {
      currentState: 'Trabalhando',
      currentTaskId: taskId,
      currentActionStartTime: new Date().toISOString(),
      currentPauseReason: ''
    });

    if (t.status !== 'Em Andamento') {
      DB.tasks.update(taskId, { status: 'Em Andamento' });
    }

    Toast.success('Iniciado!', `Você começou a tarefa: "${t.descricao}"`);
    Router.navigate('worker-panel', { force: true });
  }

  function promptPause() {
    const modalHtml = `
      <div class="modal-overlay" id="modal-worker-pause">
        <div class="modal" style="box-shadow:var(--shadow-lg);">
          <div class="modal-header">
            <div class="modal-title">Motivo da Pausa</div>
            <button class="modal-close" onclick="closeModal('modal-worker-pause')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body" style="padding-top:10px;">
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:15px;">Selecione abaixo por que você está parando a tarefa atual:</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <button class="btn btn-outline" style="height:60px;flex-direction:column;gap:5px;border-color:var(--border-card);" onclick="WorkerPanel.pauseWork('Almoço')">🍽️ Almoço</button>
              <button class="btn btn-outline" style="height:60px;flex-direction:column;gap:5px;border-color:var(--border-card);" onclick="WorkerPanel.pauseWork('Banheiro')">🚻 Banheiro</button>
              <button class="btn btn-outline" style="height:60px;flex-direction:column;gap:5px;border-color:var(--border-card);" onclick="WorkerPanel.pauseWork('Falta de Peças')">⚙️ Falta de Peças</button>
              <button class="btn btn-outline" style="height:60px;flex-direction:column;gap:5px;border-color:var(--border-card);" onclick="WorkerPanel.pauseWork('DSS')">🛡️ DSS</button>
              <button class="btn btn-outline" style="height:60px;flex-direction:column;gap:5px;border-color:var(--border-card);" onclick="WorkerPanel.pauseWork('Fim Expediente')">🏠 Fim Expediente</button>
              <button class="btn btn-outline" style="height:60px;flex-direction:column;gap:5px;border-color:var(--border-card);" onclick="WorkerPanel.pauseWork('Outros')">Outros</button>
            </div>
          </div>
        </div>
      </div>
    `;
    const container = document.getElementById('worker-panel-modals') || document.createElement('div');
    if (!container.id) { container.id = 'worker-panel-modals'; document.body.appendChild(container); }
    container.innerHTML = modalHtml;
    openModal('modal-worker-pause');
  }

  function pauseWork(reason) {
    closeModal('modal-worker-pause');
    const session = Auth.getSession();
    const myWorker = getMyWorker(session);
    if (!myWorker || myWorker.currentState !== 'Trabalhando') return;

    const t = DB.tasks.get(myWorker.currentTaskId);
    const startTime = new Date(myWorker.currentActionStartTime);
    const now = new Date();
    const elapsedHrs = (now - startTime) / (1000 * 60 * 60);

    // Save Timesheet (Work)
    DB.timesheets.create({
      workerId: myWorker.id,
      workerNome: session.nome,
      equipmentId: t ? t.equipmentId : null,
      taskId: t ? t.id : null,
      data: now.toISOString().slice(0, 10),
      horaInicio: startTime.toISOString(),
      horaFim: now.toISOString(),
      horasTrabalhadas: Math.max(0.01, Math.round(elapsedHrs * 100) / 100),
      tipo: 'Trabalho',
      observacao: `Timer (Automático)`
    });

    if (t) {
      DB.tasks.update(t.id, { horasRealizadas: (t.horasRealizadas || 0) + Math.max(0, Math.round(elapsedHrs * 100) / 100) });
    }

    DB.workforce.update(myWorker.id, {
      currentState: 'Em Pausa',
      currentPauseReason: reason,
      currentActionStartTime: now.toISOString()
    });

    Toast.info('Pausado', `Motivo: ${reason}`);
    Router.navigate('worker-panel', { force: true });
  }

  function resumeWork() {
    const session = Auth.getSession();
    const myWorker = getMyWorker(session);
    if (!myWorker || myWorker.currentState !== 'Em Pausa') return;

    const t = DB.tasks.get(myWorker.currentTaskId);
    const startTime = new Date(myWorker.currentActionStartTime);
    const now = new Date();
    const elapsedHrs = (now - startTime) / (1000 * 60 * 60);

    // Save Timesheet (Pause)
    DB.timesheets.create({
      workerId: myWorker.id,
      workerNome: session.nome,
      equipmentId: t ? t.equipmentId : null,
      taskId: t ? t.id : null,
      data: now.toISOString().slice(0, 10),
      horaInicio: startTime.toISOString(),
      horaFim: now.toISOString(),
      horasTrabalhadas: Math.max(0.01, Math.round(elapsedHrs * 100) / 100),
      tipo: 'Pausa',
      motivoPausa: myWorker.currentPauseReason,
      observacao: `Pausa (${myWorker.currentPauseReason})`
    });

    DB.workforce.update(myWorker.id, {
      currentState: 'Trabalhando',
      currentPauseReason: '',
      currentActionStartTime: now.toISOString()
    });

    Toast.success('Retomado!', 'O cronômetro de trabalho voltou a rodar.');
    Router.navigate('worker-panel', { force: true });
  }

  function promptComplete() {
    const session = Auth.getSession();
    const myWorker = getMyWorker(session);
    if (!myWorker || !myWorker.currentTaskId) return;

    const t = DB.tasks.get(myWorker.currentTaskId);

    const modalHtml = `
      <div class="modal-overlay" id="modal-worker-complete">
        <div class="modal" style="box-shadow:var(--shadow-lg);">
          <div class="modal-header">
            <div class="modal-title">Concluir Tarefa</div>
            <button class="modal-close" onclick="closeModal('modal-worker-complete')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p style="font-size:14px;color:var(--text-primary);font-weight:bold;margin-bottom:10px;">${t.descricao}</p>
            <p style="font-size:12px;color:var(--text-muted);margin-bottom:20px;">Tire uma foto para comprovar a execução do serviço e finalizar a tarefa.</p>
            
            <div style="text-align:center;margin-bottom:20px;">
              <label for="task-photo-upload" class="btn btn-outline" style="width:100%;height:100px;display:flex;flex-direction:column;justify-content:center;align-items:center;border:2px dashed var(--brand-primary);color:var(--brand-primary);cursor:pointer;background:var(--bg-base);">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:32px;height:32px;margin-bottom:8px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/></svg>
                Tirar Foto / Anexar
              </label>
              <input type="file" id="task-photo-upload" accept="image/*" capture="environment" style="display:none;" onchange="WorkerPanel.previewPhoto(event)" />
              <div id="photo-preview-container" style="display:none;margin-top:15px;position:relative;">
                <img id="photo-preview" src="" style="max-width:100%;border-radius:8px;max-height:200px;object-fit:cover;" />
                <button class="btn btn-danger btn-xs" style="position:absolute;top:5px;right:5px;border-radius:50%;width:24px;height:24px;padding:0;justify-content:center;" onclick="document.getElementById('task-photo-upload').value='';document.getElementById('photo-preview-container').style.display='none';">✕</button>
              </div>
            </div>

            <div class="form-group">
              <label>Observações (Opcional)</label>
              <textarea id="task-complete-obs" rows="2" placeholder="Algo a reportar?"></textarea>
            </div>
            
            <button class="btn btn-primary" style="width:100%;margin-top:10px;height:45px;" onclick="WorkerPanel.finalizeTask()">Confirmar Conclusão</button>
          </div>
        </div>
      </div>
    `;
    const container = document.getElementById('worker-panel-modals') || document.createElement('div');
    if (!container.id) { container.id = 'worker-panel-modals'; document.body.appendChild(container); }
    container.innerHTML = modalHtml;
    openModal('modal-worker-complete');
  }

  function previewPhoto(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('photo-preview').src = e.target.result;
        document.getElementById('photo-preview-container').style.display = 'block';
      }
      reader.readAsDataURL(file);
    }
  }

  function finalizeTask() {
    const session = Auth.getSession();
    const myWorker = getMyWorker(session);
    if (!myWorker || !myWorker.currentTaskId) return;

    const fileInput = document.getElementById('task-photo-upload');
    const hasFile = fileInput.files && fileInput.files.length > 0;
    
    // Require photo!
    if (!hasFile) {
      Toast.error('Atenção', 'É obrigatório anexar uma foto para comprovar a conclusão da tarefa.');
      return;
    }

    const obsText = document.getElementById('task-complete-obs').value.trim();
    const t = DB.tasks.get(myWorker.currentTaskId);
    
    // Process photo as base64
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Img = e.target.result;
      
      // If working, stop and save time
      if (myWorker.currentState === 'Trabalhando') {
        const startTime = new Date(myWorker.currentActionStartTime);
        const now = new Date();
        const elapsedHrs = (now - startTime) / (1000 * 60 * 60);

        DB.timesheets.create({
          workerId: myWorker.id,
          workerNome: session.nome,
          equipmentId: t ? t.equipmentId : null,
          taskId: t ? t.id : null,
          data: now.toISOString().slice(0, 10),
          horaInicio: startTime.toISOString(),
          horaFim: now.toISOString(),
          horasTrabalhadas: Math.max(0.01, Math.round(elapsedHrs * 100) / 100),
          tipo: 'Trabalho',
          observacao: 'Timer (Automático - Conclusão)'
        });

        if (t) {
          DB.tasks.update(t.id, { 
            horasRealizadas: (t.horasRealizadas || 0) + Math.max(0, Math.round(elapsedHrs * 100) / 100)
          });
        }
      } else if (myWorker.currentState === 'Em Pausa') {
         // Just close the pause
         const startTime = new Date(myWorker.currentActionStartTime);
         const now = new Date();
         const elapsedHrs = (now - startTime) / (1000 * 60 * 60);
         DB.timesheets.create({
          workerId: myWorker.id,
          workerNome: session.nome,
          equipmentId: t ? t.equipmentId : null,
          taskId: t ? t.id : null,
          data: now.toISOString().slice(0, 10),
          horaInicio: startTime.toISOString(),
          horaFim: now.toISOString(),
          horasTrabalhadas: Math.max(0.01, Math.round(elapsedHrs * 100) / 100),
          tipo: 'Pausa',
          motivoPausa: myWorker.currentPauseReason,
          observacao: 'Pausa'
        });
      }

      if (t) {
        // Add attachment and observation
        let newObs = t.observacoes || '';
        if (obsText) {
          const dateStr = new Date().toLocaleString('pt-BR');
          newObs += `\n[Atualizado em ${dateStr} por ${session.nome}]: ${obsText}`;
        }

        const attachments = t.anexos ? [...t.anexos] : [];
        attachments.push({
          url: base64Img,
          nome: `Foto_${Date.now()}.jpg`,
          tipo: 'image/jpeg',
          enviadoPor: session.nome,
          dataEnvio: new Date().toISOString()
        });

        DB.tasks.update(t.id, {
          status: 'Concluída',
          pctExecutado: 100,
          dataRealTermino: new Date().toISOString().slice(0,10),
          observacoes: newObs,
          anexos: attachments
        });
      }

      // Set to Ocioso
      DB.workforce.update(myWorker.id, {
        currentState: 'Ocioso',
        currentTaskId: null,
        currentActionStartTime: null,
        currentPauseReason: ''
      });

      closeModal('modal-worker-complete');
      Toast.success('Sucesso', 'Tarefa concluída e foto anexada!');
      Router.navigate('worker-panel', { force: true });
    };
    reader.readAsDataURL(file);
  }

  function formatTimeDiff(isoStart) {
    if (!isoStart) return '00:00:00';
    const s = new Date(isoStart);
    const n = new Date();
    const diff = Math.floor((n - s) / 1000); // seconds
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  }

  function render() {
    const session = Auth.getSession();
    if (!session || session.perfil !== 'Executante') return `<div class="page-container">Acesso Restrito</div>`;

    window.GlobalEqFilter = '';
    const myWorker = getMyWorker(session);
    if (!myWorker) return `<div class="page-container"><h3>Erro</h3><p>Seu cadastro não foi encontrado na base de mão de obra. Avise o planejador.</p></div>`;

    const eqs = DB.equipment.list();
    const tasks = DB.tasks.getAll();
    const myEqs = getMyEquipments(session);
    const myEqIds = myEqs.map(e => e.id);
    let myTasks = tasks.filter(t => myEqIds.includes(t.equipmentId));

    if (eqFilter) myTasks = myTasks.filter(t => t.equipmentId === eqFilter);

    // Live Status Panel
    let statusPanelHtml = '';
    const state = myWorker.currentState || 'Ocioso';
    
    // Auto-update timer display
    if (!window.workerTimerInterval && state !== 'Ocioso') {
      window.workerTimerInterval = setInterval(() => {
        const el = document.getElementById('live-timer');
        if (el && myWorker.currentActionStartTime) {
          el.innerText = formatTimeDiff(myWorker.currentActionStartTime);
        }
      }, 1000);
    } else if (state === 'Ocioso' && window.workerTimerInterval) {
      clearInterval(window.workerTimerInterval);
      window.workerTimerInterval = null;
    }

    if (state === 'Trabalhando') {
      const currentT = tasks.find(t => t.id === myWorker.currentTaskId);
      statusPanelHtml = `
        <div style="background:var(--color-success-bg);border:2px solid var(--color-success);border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
          <h2 style="color:var(--color-success);margin:0;font-size:24px;font-weight:900;">EM EXECUÇÃO</h2>
          <div style="margin:10px 0;font-size:16px;color:var(--text-primary);">${currentT ? currentT.descricao : 'Tarefa desconhecida'}</div>
          <div id="live-timer" style="font-size:36px;font-family:monospace;font-weight:bold;color:var(--color-success);margin:15px 0;">${formatTimeDiff(myWorker.currentActionStartTime)}</div>
          
          <div style="display:flex;gap:10px;justify-content:center;">
            <button class="btn btn-warning btn-xl" onclick="WorkerPanel.promptPause()" style="flex:1;max-width:200px;font-weight:bold;">⏸ PAUSAR</button>
            <button class="btn btn-primary btn-xl" onclick="WorkerPanel.promptComplete()" style="flex:1;max-width:200px;font-weight:bold;">✔ CONCLUIR</button>
          </div>
        </div>
      `;
    } else if (state === 'Em Pausa') {
      const currentT = tasks.find(t => t.id === myWorker.currentTaskId);
      statusPanelHtml = `
        <div style="background:var(--color-warning-bg);border:2px solid var(--color-warning);border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
          <h2 style="color:var(--color-warning);margin:0;font-size:24px;font-weight:900;">EM PAUSA</h2>
          <div style="margin:5px 0;font-weight:bold;color:var(--text-primary);">Motivo: ${myWorker.currentPauseReason}</div>
          <div style="margin:5px 0;font-size:14px;color:var(--text-muted);">Tarefa pausada: ${currentT ? currentT.descricao : ''}</div>
          <div id="live-timer" style="font-size:36px;font-family:monospace;font-weight:bold;color:var(--color-warning);margin:15px 0;">${formatTimeDiff(myWorker.currentActionStartTime)}</div>
          
          <div style="display:flex;gap:10px;justify-content:center;">
            <button class="btn btn-success btn-xl" onclick="WorkerPanel.resumeWork()" style="flex:1;max-width:300px;font-weight:bold;height:60px;font-size:18px;">▶ RETOMAR TRABALHO</button>
          </div>
        </div>
      `;
    } else {
      statusPanelHtml = `
        <div style="background:var(--bg-card);border:2px dashed var(--border-card);border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
          <h2 style="color:var(--text-muted);margin:0;font-size:20px;font-weight:900;">OCIOSO</h2>
          <p style="color:var(--text-secondary);font-size:14px;">Você não possui tarefas em andamento. Inicie uma atividade abaixo.</p>
        </div>
      `;
    }

    // Horizontal Machines List
    const machinesHtml = `
      <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:10px;margin-bottom:20px;">
        ${myEqs.map(e => `
          <div class="card hover-lift" style="min-width:280px;background:var(--bg-card);border:1px solid var(--border-card);padding:15px;border-radius:12px;cursor:pointer;" onclick="WorkerPanel.setEqFilter('${e.id}')">
            <div style="display:flex;justify-content:space-between;">
              <strong style="font-size:16px;color:${eqFilter===e.id ? 'var(--brand-primary)' : 'var(--text-primary)'}">${e.codigo}</strong>
              <span class="badge badge-ghost">${e.pctAvanco || 0}%</span>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${e.nome || ''}</div>
          </div>
        `).join('')}
        <div class="card hover-lift" style="min-width:150px;background:${!eqFilter ? 'var(--brand-primary-light)' : 'var(--bg-card)'};border:1px solid var(--border-card);padding:15px;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:${!eqFilter ? '#000' : 'var(--text-primary)'};font-weight:bold;" onclick="WorkerPanel.setEqFilter('')">
          VER TODAS
        </div>
      </div>
    `;

    // Tasks List
    let listTasks = myTasks.filter(t => t.status !== 'Concluída' && t.id !== myWorker.currentTaskId);

    const tasksHtml = listTasks.map(t => {
      const eq = eqs.find(e => e.id === t.equipmentId);
      const blockedBy = checkPredecessors(t, tasks);
      const isBlocked = blockedBy.length > 0;
      
      let actionBtn = '';
      if (state === 'Ocioso') {
        if (isBlocked) {
          actionBtn = `<span style="color:var(--color-danger);font-size:11px;font-weight:bold;"> BLOQUEADA POR: ${blockedBy.join(', ')}</span>`;
        } else {
          actionBtn = `<button class="btn btn-outline btn-sm" onclick="WorkerPanel.startTask('${t.id}')" style="font-weight:bold;color:var(--brand-primary);border-color:var(--brand-primary);">▶ INICIAR</button>`;
        }
      }

      return `
        <div class="card hover-lift" style="padding:15px;background:var(--bg-card);border:1px solid var(--border-card);border-radius:12px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <div style="flex:1;">
              <div style="font-weight:bold;font-size:15px;color:var(--text-primary);margin-bottom:4px;">${t.descricao}</div>
              <div style="font-size:12px;color:var(--text-muted);">
                Máquina: ${eq ? eq.codigo : '—'} &nbsp;|&nbsp; ${t.disciplina}
              </div>
            </div>
            <div style="margin-left:10px;">${actionBtn}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="page-container" style="padding-bottom:100px;">
        ${statusPanelHtml}

        <h3 style="font-size:14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Suas Máquinas</h3>
        ${machinesHtml}

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
          <h3 style="font-size:14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:0;">Fila de Tarefas</h3>
          <button class="btn btn-ghost btn-sm" onclick="WorkerPanel.openCreateTask()">+ Nova Tarefa</button>
        </div>
        
        ${listTasks.length > 0 ? tasksHtml : `
          <div style="text-align:center;padding:30px;color:var(--text-muted);background:rgba(255,255,255,0.02);border-radius:12px;">
            Nenhuma tarefa pendente encontrada.
          </div>
        `}
      </div>
      <div id="worker-panel-modals"></div>
    `;
  }

  function setEqFilter(id) {
    eqFilter = id;
    render();
    Router.navigate('worker-panel', { force: true });
  }

  // --- TASK MODALS (CREATE & EDIT) ---

  function openCreateTask() {
    const session = Auth.getSession();
    const myEqs = getMyEquipments();

    const modalHtml = `
      <div class="modal-overlay" id="modal-worker-new-task">
        <div class="modal modal-lg" style="box-shadow:var(--shadow-lg);">
          <div class="modal-header">
            <div class="modal-title">Nova Atividade</div>
            <button class="modal-close" onclick="closeModal('modal-worker-new-task')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div style="display:flex;flex-direction:column;gap:var(--space-4);">
              <div class="form-row">
                <div class="form-group">
                  <label>Equipamento *</label>
                  <select id="w-new-eq" style="background:var(--bg-base);border:1px solid var(--border-card);color:var(--text-primary);">
                    ${myEqs.map(e => `<option value="${e.id}">${e.codigo} - ${e.nome}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Código (Opcional)</label>
                  <input id="w-new-cod" placeholder="Ex: MEC-01" />
                </div>
              </div>
              <div class="form-group">
                <label>Descrição da Atividade *</label>
                <input id="w-new-desc" placeholder="Descreva a tarefa..." required />
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Disciplina</label>
                  <input value="${session.disciplina}" disabled style="opacity:0.6;cursor:not-allowed;background:var(--bg-base);" />
                </div>
                <div class="form-group">
                  <label>Responsável</label>
                  <input value="${session.nome}" disabled style="opacity:0.6;cursor:not-allowed;background:var(--bg-base);" />
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Prioridade</label>
                  <select id="w-new-prio">
                    <option>Média</option>
                    <option>Alta</option>
                    <option>Crítica</option>
                    <option>Baixa</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Status Inicial</label>
                  <select id="w-new-status">
                    <option>Não Iniciada</option>
                    <option>Em Andamento</option>
                    <option>Aguardando Peça</option>
                    <option>Bloqueada</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Início Planejado</label>
                  <input type="date" id="w-new-ip" value="${new Date().toISOString().slice(0,10)}" />
                </div>
                <div class="form-group">
                  <label>Término Planejado</label>
                  <input type="date" id="w-new-tp" value="${new Date().toISOString().slice(0,10)}" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Horas Planejadas</label>
                  <input type="number" id="w-new-hp" value="0" min="0" />
                </div>
                <div class="form-group">
                  <label>Horas Realizadas</label>
                  <input type="number" id="w-new-hr" value="0" min="0" />
                </div>
              </div>

              <div class="form-group">
                <label>% Executado: <span id="w-new-pct-val">0</span>%</label>
                <input type="range" id="w-new-pct" min="0" max="100" value="0" oninput="document.getElementById('w-new-pct-val').textContent=this.value" />
              </div>

              <div class="checkbox-wrap">
                <input type="checkbox" id="w-new-critico" />
                <label for="w-new-critico" style="cursor:pointer;">Marcar como Atividade Crítica</label>
              </div>

              <div class="form-group">
                <label>Observações</label>
                <textarea id="w-new-obs" rows="3" placeholder="Insira observações relevantes..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('modal-worker-new-task')">Cancelar</button>
            <button class="btn btn-primary" onclick="WorkerPanel.saveNewTask()">Criar Tarefa</button>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('worker-panel-modals');
    if (container) {
      container.innerHTML = modalHtml;
      openModal('modal-worker-new-task');
    }
  }

  function openCreateTask(equipmentId) {
    const eqs = DB.equipment.list();
    const session = Auth.getSession();
    
    // Get only allocated machines
    const myEqs = getMyEquipments(session);

    const modalHtml = `
      <div class="modal-overlay" id="modal-worker-new-task">
        <div class="modal" style="box-shadow:var(--shadow-lg);">
          <div class="modal-header">
            <div class="modal-title">Nova Tarefa</div>
            <button class="modal-close" onclick="closeModal('modal-worker-new-task')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div style="display:flex;flex-direction:column;gap:var(--space-4);">
              
              <div class="form-group">
                <label>Equipamento *</label>
                <select id="w-new-eq">
                  ${myEqs.map(e => `<option value="${e.id}" ${e.id === equipmentId ? 'selected' : ''}>${e.codigo} - ${e.nome}</option>`).join('')}
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Código da Tarefa</label>
                  <input id="w-new-cod" placeholder="Opcional" />
                </div>
              </div>

              <div class="form-group">
                <label>Descrição *</label>
                <input id="w-new-desc" placeholder="Descreva a atividade..." required />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Disciplina</label>
                  <input value="${session.disciplina}" disabled style="opacity:0.6;cursor:not-allowed;background:var(--bg-base);" />
                </div>
                <div class="form-group">
                  <label>Responsável</label>
                  <input value="${session.nome}" disabled style="opacity:0.6;cursor:not-allowed;background:var(--bg-base);" />
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Prioridade</label>
                  <select id="w-new-prio">
                    <option>Média</option>
                    <option>Alta</option>
                    <option>Crítica</option>
                    <option>Baixa</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Status Inicial</label>
                  <select id="w-new-status">
                    <option>Não Iniciada</option>
                    <option>Em Andamento</option>
                    <option>Aguardando Peça</option>
                    <option>Bloqueada</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Início Planejado</label>
                  <input type="date" id="w-new-ip" value="${new Date().toISOString().slice(0,10)}" />
                </div>
                <div class="form-group">
                  <label>Término Planejado</label>
                  <input type="date" id="w-new-tp" value="${new Date().toISOString().slice(0,10)}" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Horas Planejadas</label>
                  <input type="number" id="w-new-hp" value="0" min="0" />
                </div>
                <div class="form-group">
                  <label>Horas Realizadas</label>
                  <input type="number" id="w-new-hr" value="0" min="0" />
                </div>
              </div>

              <div class="checkbox-wrap" style="margin-top:var(--space-2)">
                <input type="checkbox" id="w-new-critico" />
                <label for="w-new-critico" style="cursor:pointer;color:var(--color-danger);font-weight:600;">Atividade no Caminho Crítico</label>
              </div>

              <div class="form-group" style="margin-top:var(--space-2)">
                <label>Observações Adicionais</label>
                <textarea id="w-new-obs" rows="2" placeholder="Detalhes da execução..."></textarea>
              </div>

            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('modal-worker-new-task')">Cancelar</button>
            <button class="btn btn-primary" onclick="WorkerPanel.saveNewTask()">Criar Tarefa</button>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('worker-panel-modals');
    if (container) {
      container.innerHTML = modalHtml;
      openModal('modal-worker-new-task');
    }
  }

  function saveNewTask() {
    const session = Auth.getSession();
    const desc = document.getElementById('w-new-desc').value.trim();
    if (!desc) {
      Toast.error('Erro', 'Descrição da atividade é obrigatória.');
      return;
    }

    const eqId = document.getElementById('w-new-eq').value;
    if (!eqId) {
      Toast.error('Erro', 'Selecione um equipamento.');
      return;
    }

    const status = document.getElementById('w-new-status').value;
    const data = {
      equipmentId: eqId,
      codigo: document.getElementById('w-new-cod').value.trim(),
      descricao: desc,
      disciplina: session.disciplina,
      responsavel: session.nome,
      prioridade: document.getElementById('w-new-prio').value,
      status,
      dataPlanejadaInicio: document.getElementById('w-new-ip').value,
      dataPlanejadaTermino: document.getElementById('w-new-tp').value,
      horasPlanejadas: parseFloat(document.getElementById('w-new-hp').value) || 0,
      horasRealizadas: parseFloat(document.getElementById('w-new-hr').value) || 0,
      pctExecutado: parseInt(document.getElementById('w-new-pct').value) || 0,
      critico: document.getElementById('w-new-critico').checked,
      observacoes: document.getElementById('w-new-obs').value.trim() ? JSON.stringify([{
        id: 'c-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        text: document.getElementById('w-new-obs').value.trim(),
        user: session.nome,
        userId: session.userId,
        createdAt: new Date().toISOString()
      }]) : '[]',
      predecessoras: [],
      createdAt: DB.now()
    };

    if (status === 'Concluída') {
      data.pctExecutado = 100;
      data.dataRealTermino = new Date().toISOString().slice(0, 10);
    }

    DB.tasks.create(data);
    Toast.success('Sucesso', 'Nova tarefa criada e vinculada a você.');
    closeModal('modal-worker-new-task');
    Router.navigate('worker-panel', { force: true });
  }

  function openEditTask(id) {
    const t = DB.tasks.get(id);
    if (!t) return;

    let obsHistoryHtml = '';
    let obsTextValue = '';
    if (t.observacoes) {
      let isJson = false;
      try {
        const comments = JSON.parse(t.observacoes);
        if (Array.isArray(comments)) {
          isJson = true;
          obsHistoryHtml = `<div style="max-height: 80px; overflow-y: auto; font-size: 11px; margin-bottom: 8px; border: 1px solid var(--border-default); padding: 4px; border-radius: 4px; background: var(--bg-base);">
            ${comments.map(c => `
              <div style="margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.02);">
                <span style="font-weight:bold;color:var(--brand-primary-light);">${c.user}:</span> ${c.text}
                <span style="font-size:9px;color:var(--text-muted);display:block;">${new Date(c.createdAt).toLocaleString('pt-BR')}</span>
              </div>
            `).join('')}
          </div>`;
        }
      } catch (e) {}
      
      if (!isJson) {
        obsTextValue = t.observacoes;
      }
    }

    const modalHtml = `
      <div class="modal-overlay" id="modal-worker-task">
        <div class="modal modal-lg" style="box-shadow:var(--shadow-lg);">
          <div class="modal-header">
            <div class="modal-title">Apontar Atividade</div>
            <button class="modal-close" onclick="closeModal('modal-worker-task')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div style="display:flex;flex-direction:column;gap:var(--space-4);">
              <div class="form-group">
                <label>Atividade (Descrição)</label>
                <input value="${t.descricao}" disabled style="opacity:0.6;background:var(--bg-base);cursor:not-allowed;" />
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Status</label>
                  <select id="w-tk-status" onchange="const p=document.getElementById('w-tk-photo-group'); if(this.value==='Concluída'){p.style.display='block';}else{p.style.display='none';}">
                    ${['Não Iniciada','Em Andamento','Aguardando Peça','Aguardando Recurso','Aguardando Aprovação','Bloqueada','Concluída'].map(s => 
                      `<option ${t.status === s ? 'selected' : ''}>${s}</option>`
                    ).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Horas Realizadas</label>
                  <input type="number" id="w-tk-hr" value="${t.horasRealizadas||0}" min="0" step="0.5" />
                </div>
              </div>

              <div class="form-group">
                <label>% Executado: <span id="w-tk-pct-val">${t.pctExecutado||0}</span>%</label>
                <input type="range" id="w-tk-pct" min="0" max="100" value="${t.pctExecutado||0}" oninput="document.getElementById('w-tk-pct-val').textContent=this.value" />
              </div>

              <div style="border-top:1px solid var(--border-card);padding-top:var(--space-3);margin-top:var(--space-1);">
                <div style="font-size:var(--text-xs);color:var(--color-warning);margin-bottom:var(--space-2);font-weight:700;">
                  ⚠️ Alteração de datas planejadas exige justificativa de reprogramação obrigatória.
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Início Planejado</label>
                    <input type="date" id="w-tk-ip" value="${toDateInput(t.dataPlanejadaInicio)}" />
                  </div>
                  <div class="form-group">
                    <label>Término Planejado</label>
                    <input type="date" id="w-tk-tp" value="${toDateInput(t.dataPlanejadaTermino)}" />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Observações</label>
                ${obsHistoryHtml}
                <textarea id="w-tk-obs" rows="2" placeholder="${obsHistoryHtml ? 'Adicionar nova observação...' : 'Observações...'}">${obsTextValue}</textarea>
              </div>

              <div class="form-group" id="w-tk-photo-group" style="display:${t.status === 'Concluída' ? 'block' : 'none'}; background:rgba(59,130,246,0.05); padding:var(--space-3); border-radius:var(--radius-md); border:1px solid rgba(59,130,246,0.2);">
                <label style="color:var(--brand-primary-light);font-weight:700;">📸 Foto de Comprovação (Obrigatória)</label>
                <input type="file" id="w-tk-photo" accept="image/*" capture="environment" class="form-control" style="margin-top:4px;" />
                <input type="hidden" id="w-tk-photo-b64" value="${t.fotoComprovacao || ''}" />
                <div id="w-tk-photo-preview" style="margin-top:8px; width:100%; border-radius:8px; overflow:hidden; display:${t.fotoComprovacao ? 'block' : 'none'};">
                  <img id="w-tk-photo-img" src="${t.fotoComprovacao || ''}" style="width:100%; max-height:250px; object-fit:contain; background:#000;" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('modal-worker-task')">Cancelar</button>
            <button class="btn btn-primary" onclick="WorkerPanel.saveEditedTask('${t.id}')">Salvar</button>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('worker-panel-modals');
    if (container) {
      container.innerHTML = modalHtml;
      openModal('modal-worker-task');

      // Add listener for file input to convert to base64
      const fileInput = document.getElementById('w-tk-photo');
      fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
          const b64 = evt.target.result;
          document.getElementById('w-tk-photo-b64').value = b64;
          document.getElementById('w-tk-photo-img').src = b64;
          document.getElementById('w-tk-photo-preview').style.display = 'block';
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function saveEditedTask(id) {
    const t = DB.tasks.get(id);
    if (!t) return;

    const status = document.getElementById('w-tk-status').value;
    const pct = parseInt(document.getElementById('w-tk-pct').value) || 0;
    const hr = parseFloat(document.getElementById('w-tk-hr').value) || 0;
    const ip = document.getElementById('w-tk-ip').value;
    const tp = document.getElementById('w-tk-tp').value;
    const obs = document.getElementById('w-tk-obs').value.trim();
    const photoB64 = document.getElementById('w-tk-photo-b64').value;

    if (status === 'Concluída' && !photoB64) {
      window.Toast.error('Foto Obrigatória', 'Para concluir a atividade, é obrigatório tirar uma foto para comprovação.');
      return;
    }

    const dateChanged = (t.dataPlanejadaInicio !== ip || t.dataPlanejadaTermino !== tp);
    const statusChanged = (t.status !== status);
    const pctChanged = (t.pctExecutado !== pct);
    const hrChanged = (t.horasRealizadas !== hr);
    let justification = '';

    if (dateChanged) {
      const promptJust = prompt(
        `Justificativa de Reprogramação Obrigatória:\nModificando data de início/término da atividade:\nAnterior: ${formatDate(t.dataPlanejadaInicio)} a ${formatDate(t.dataPlanejadaTermino)}\nNova: ${formatDate(ip)} a ${formatDate(tp)}\n\nPor favor, digite o motivo:`
      );
      if (promptJust === null) return; // user cancelled saving task

      justification = promptJust.trim();
      if (!justification) {
        Toast.error('Erro', 'A justificativa de reprogramação é obrigatória para salvar as novas datas.');
        return;
      }
    }

    const session = Auth.getSession();
    const today = new Date().toISOString().slice(0, 10);
    const dateStr = new Date().toLocaleString('pt-BR');

    // Build changes log
    let changesLog = [];
    if (statusChanged) changesLog.push(`Status: "${t.status}" -> "${status}"`);
    if (pctChanged) changesLog.push(`Progresso: ${t.pctExecutado}% -> ${pct}%`);
    if (hrChanged) changesLog.push(`Horas Trab: ${t.horasRealizadas}h -> ${hr}h`);
    if (dateChanged) changesLog.push(`Reprogramado para: ${formatDate(ip)} a ${formatDate(tp)}`);

    let finalObs = '';
    let comments = [];
    let isJson = false;
    if (t.observacoes) {
      try {
        comments = JSON.parse(t.observacoes);
        if (Array.isArray(comments)) isJson = true;
      } catch (e) {}
    }

    if (isJson) {
      if (obs) {
        comments.push({
          id: 'c-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
          text: obs,
          user: session.nome,
          userId: session.userId,
          createdAt: new Date().toISOString()
        });
      }
      if (changesLog.length > 0) {
        let logMsg = `[Mapeamento Atualizado]: ${changesLog.join(' | ')}`;
        if (dateChanged && justification) {
          logMsg += ` (Motivo: ${justification})`;
        }
        comments.push({
          id: 'c-sys-' + Date.now(),
          text: logMsg,
          user: 'Sistema',
          userId: 'system',
          createdAt: new Date().toISOString()
        });
      }
      finalObs = JSON.stringify(comments);
    } else {
      let logText = '';
      if (changesLog.length > 0) {
        logText = `\n[Atualizado em ${dateStr} por ${session.nome}]: ${changesLog.join(' | ')}`;
        if (dateChanged && justification) {
          logText += ` (Motivo: ${justification})`;
        }
      }
      finalObs = (obs || t.observacoes || '') + logText;
    }

    const data = {
      status,
      pctExecutado: (status === 'Concluída') ? 100 : pct,
      horasRealizadas: hr,
      dataPlanejadaInicio: ip,
      dataPlanejadaTermino: tp,
      observacoes: finalObs,
      fotoComprovacao: photoB64 || t.fotoComprovacao
    };

    if (status === 'Concluída') {
      data.pctExecutado = 100;
      data.dataRealTermino = t.dataRealTermino || today;
      if (activeTimer && activeTimer.taskId === id) {
        saveTimer(null);
      }
      if (t.solicitacaoId && DB.solicitacoes) {
        DB.solicitacoes.update(t.solicitacaoId, { status: 'Concluída', finalizadoAt: DB.now() });
        const sol = DB.solicitacoes.list().find(s => s.id === t.solicitacaoId);
        if (sol && DB.notifications) {
          DB.notifications.add({
            userId: sol.solicitanteId,
            title: 'Serviço Concluído',
            message: `O serviço '${sol.descricao}' foi finalizado pelo setor ${sol.setorDestino}.`,
            type: 'info',
            read: false,
            createdAt: DB.now()
          });
        }
      }
    }

    DB.tasks.update(id, data);
    Toast.success('Tarefa Atualizada!', 'As alterações foram registradas com sucesso.');
    closeModal('modal-worker-task');
    Router.navigate('worker-panel', { force: true });
  }

  // --- PARTS REQUESTS ---

  function openRequestPart(equipmentId) {
    const eqs = DB.equipment.list();
    const session = Auth.getSession();
    
    // Get only alocated machines
    const myEqs = getMyEquipments(session);

    const modalHtml = `
      <div class="modal-overlay" id="modal-worker-part">
        <div class="modal" style="box-shadow:var(--shadow-lg);">
          <div class="modal-header">
            <div class="modal-title">Solicitar Peça</div>
            <button class="modal-close" onclick="closeModal('modal-worker-part')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div style="display:flex;flex-direction:column;gap:var(--space-4);">
              <div class="form-group">
                <label>Equipamento *</label>
                <select id="w-pt-eq">
                  ${myEqs.map(e => `<option value="${e.id}" ${e.id === equipmentId ? 'selected' : ''}>${e.codigo} - ${e.nome}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Descrição da Peça *</label>
                <input id="w-pt-desc" placeholder="Ex: Filtro de ar primário" required />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Part Number / Código</label>
                  <input id="w-pt-pn" placeholder="Ex: PN-98765" />
                </div>
                <div class="form-group">
                  <label>Quantidade *</label>
                  <input type="number" id="w-pt-qty" value="1" min="1" required />
                </div>
              </div>
              
              <div class="checkbox-wrap">
                <input type="checkbox" id="w-pt-critica" />
                <label for="w-pt-critica" style="cursor:pointer;">Peça Crítica (Bloqueia o equipamento)</label>
              </div>

              <div class="form-group">
                <label>Observações / Justificativa</label>
                <textarea id="w-pt-obs" rows="3" placeholder="Informações adicionais para o PCM..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('modal-worker-part')">Cancelar</button>
            <button class="btn btn-primary" onclick="WorkerPanel.savePartRequest()">Enviar Solicitação</button>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('worker-panel-modals');
    if (container) {
      container.innerHTML = modalHtml;
      openModal('modal-worker-part');
    }
  }

  function savePartRequest() {
    const desc = document.getElementById('w-pt-desc').value.trim();
    if (!desc) {
      Toast.error('Erro', 'Descrição da peça é obrigatória.');
      return;
    }

    const eqId = document.getElementById('w-pt-eq').value;
    const pn = document.getElementById('w-pt-pn').value.trim();
    const qty = parseInt(document.getElementById('w-pt-qty').value) || 1;
    const obs = document.getElementById('w-pt-obs').value.trim();

    const data = {
      equipmentId: eqId,
      descricao: `Qtd: ${qty}x — ${desc}`,
      codigo: pn,
      status: 'Solicitada',
      critica: document.getElementById('w-pt-critica').checked,
      fornecedor: 'Solicitado pelo Executante',
      fabricante: '',
      prazoEntrega: '',
      pedido: '',
      observacoes: obs,
      createdAt: DB.now()
    };

    DB.parts.create(data);
    Toast.success('Solicitação Enviada!', `Peça "${desc}" cadastrada com status Solicitada.`);
    closeModal('modal-worker-part');
    Router.navigate('worker-panel', { force: true });
  }

  // --- SERVICE REQUESTS ---

  function openRequestService(equipmentId) {
    const eqs = DB.equipment.list();
    const session = Auth.getSession();
    
    // Get only allocated machines
    const myEqs = getMyEquipments(session);

    const modalHtml = `
      <div class="modal-overlay" id="modal-worker-service">
        <div class="modal" style="box-shadow:var(--shadow-lg);">
          <div class="modal-header">
            <div class="modal-title">Solicitar Serviço</div>
            <button class="modal-close" onclick="closeModal('modal-worker-service')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div style="display:flex;flex-direction:column;gap:var(--space-4);">
              <div class="form-group">
                <label>Equipamento *</label>
                <select id="w-sv-eq">
                  ${myEqs.map(e => `<option value="${e.id}" ${e.id === equipmentId ? 'selected' : ''}>${e.codigo} - ${e.nome}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Setor Destino *</label>
                <select id="w-sv-setor">
                  <option value="Usinagem">Usinagem</option>
                  <option value="Mecânica">Mecânica</option>
                  <option value="Caldeiraria">Caldeiraria</option>
                  <option value="Elétrica">Elétrica</option>
                </select>
              </div>
              <div class="form-group">
                <label>Descrição do Serviço / Peça *</label>
                <input id="w-sv-desc" placeholder="Descreva com detalhes o serviço..." required />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Prazo / Data Desejada *</label>
                  <input type="date" id="w-sv-prazo" required value="${new Date().toISOString().slice(0, 10)}" />
                </div>
              </div>
              <div class="checkbox-wrap">
                <input type="checkbox" id="w-sv-critica" />
                <label for="w-sv-critica" style="cursor:pointer;color:var(--color-danger);font-weight:600;">Serviço Crítico (Bloqueia o andamento)</label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('modal-worker-service')">Cancelar</button>
            <button class="btn btn-primary" onclick="WorkerPanel.saveRequestService()">Enviar Solicitação</button>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('worker-panel-modals');
    if (container) {
      container.innerHTML = modalHtml;
      openModal('modal-worker-service');
    }
  }

  function saveRequestService() {
    const session = Auth.getSession();
    const desc = document.getElementById('w-sv-desc').value.trim();
    if (!desc) {
      Toast.error('Erro', 'Descrição do serviço é obrigatória.');
      return;
    }

    const eqId = document.getElementById('w-sv-eq').value;
    const setor = document.getElementById('w-sv-setor').value;
    const prazo = document.getElementById('w-sv-prazo').value;
    const critica = document.getElementById('w-sv-critica').checked;

    const data = {
      id: 'sol-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      equipmentId: eqId,
      solicitanteId: session.userId,
      solicitanteNome: session.nome,
      descricao: desc,
      setorDestino: setor,
      prazo: prazo,
      critico: critica,
      status: setor === 'Usinagem' ? 'Aguardando Aprovação PCM' : 'Aguardando Encarregado',
      createdAt: DB.now()
    };

    if (DB.solicitacoes) {
      DB.solicitacoes.add(data);
    }

    Toast.success('Serviço Solicitado!', 'A solicitação foi enviada com sucesso para o setor.');
    closeModal('modal-worker-service');
    Router.navigate('worker-panel', { force: true });
  }

  // --- IMPEDIMENT RESTRICTIONS ---

  function openReportRestriction(equipmentId) {
    const eqs = DB.equipment.list();
    const session = Auth.getSession();
    const myEqs = getMyEquipments(session);

    const activeEqId = equipmentId || (myEqs.length > 0 ? myEqs[0].id : '');
    const tasks = DB.tasks.getAll().filter(t => t.equipmentId === activeEqId);
    
    const tipos = ['Falta de Peça','Falta de Mão de Obra','Falta de Ferramenta','Aguardando Aprovação','Equipamento Não Liberado','Dependência Não Concluída','Outra'];

    const modalHtml = `
      <div class="modal-overlay" id="modal-worker-restriction">
        <div class="modal modal-lg" style="box-shadow:var(--shadow-lg);">
          <div class="modal-header">
            <div class="modal-title">Registrar Impedimento (Restrição)</div>
            <button class="modal-close" onclick="closeModal('modal-worker-restriction')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div style="display:flex;flex-direction:column;gap:var(--space-4);">
              <div class="form-row">
                <div class="form-group">
                  <label>Equipamento *</label>
                  <select id="w-rs-eq" onchange="WorkerPanel.updateRestrictionTasks(this.value)">
                    ${myEqs.map(e => `<option value="${e.id}" ${e.id === activeEqId ? 'selected' : ''}>${e.codigo} - ${e.nome}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Tipo de Impedimento *</label>
                  <select id="w-rs-tipo">
                    ${tipos.map(t => `<option>${t}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Tarefa Bloqueada por este Impedimento</label>
                <select id="w-rs-task">
                  <option value="">Nenhuma tarefa específica</option>
                  ${tasks.map(t => `<option value="${t.id}">${t.codigo ? t.codigo + ' - ' : ''}${t.descricao}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label>Descrição do Impedimento / Detalhes *</label>
                <textarea id="w-rs-desc" rows="4" placeholder="Descreva o que está impedindo a execução do serviço (ex: aguardando junta de vedação, sem guindaste alocado)..." required></textarea>
              </div>

              <div class="checkbox-wrap">
                <input type="checkbox" id="w-rs-critico" />
                <label for="w-rs-critico" style="cursor:pointer;">Esta restrição impacta o caminho crítico (atrasa a liberação)</label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('modal-worker-restriction')">Cancelar</button>
            <button class="btn btn-primary" onclick="WorkerPanel.saveRestriction()">Registrar</button>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('worker-panel-modals');
    if (container) {
      container.innerHTML = modalHtml;
      openModal('modal-worker-restriction');
    }
  }

  function updateRestrictionTasks(eqId) {
    const select = document.getElementById('w-rs-task');
    if (!select) return;
    const tasks = DB.tasks.getAll().filter(t => t.equipmentId === eqId);
    select.innerHTML = '<option value="">Nenhuma tarefa específica</option>' +
      tasks.map(t => `<option value="${t.id}">${t.codigo ? t.codigo + ' - ' : ''}${t.descricao}</option>`).join('');
  }

  function saveRestriction() {
    const desc = document.getElementById('w-rs-desc').value.trim();
    if (!desc) {
      Toast.error('Erro', 'Descrição do impedimento é obrigatória.');
      return;
    }

    const eqId = document.getElementById('w-rs-eq').value;
    const tipo = document.getElementById('w-rs-tipo').value;
    const taskId = document.getElementById('w-rs-task').value;
    const critico = document.getElementById('w-rs-critico').checked;
    const session = Auth.getSession();

    const task = DB.tasks.get(taskId);
    const taskDesc = task ? (task.codigo ? task.codigo + ' - ' : '') + task.descricao : '';

    const data = {
      tipo,
      descricao: desc,
      equipmentId: eqId,
      disciplina: session.disciplina,
      tarefaBloqueada: taskDesc,
      impactoCaminhosCriticos: critico,
      status: 'Aberta'
    };

    DB.restrictions.create(data);
    Toast.success('Impedimento Registrado!', 'O PCM e Supervisão foram alertados sobre a restrição.');
    closeModal('modal-worker-restriction');
    Router.navigate('worker-panel', { force: true });
  }

  return {
    render,
    setEqFilter,
    openCreateTask,
    saveNewTask,
    openEditTask,
    saveEditedTask,
    openRequestPart,
    savePartRequest,
    openRequestService,
    saveRequestService,
    openReportRestriction,
    updateRestrictionTasks,
    saveRestriction
  };
})();

// ================================================================
// NEW MODULES FOR WORKER PARTS & SERVICES PAGES
// ================================================================

window.WorkerParts = (() => {
  function render() {
    const session = window.Auth.getSession();
    if (!session || session.perfil !== 'Executante') return `<div class="page-container">Acesso restrito.</div>`;

    const eqs = window.DB.equipment.list() || [];
    const myEqs = getMyEquipments(session);

    if (myEqs.length === 0) {
      return `
        <div class="page-container" style="animation:fadeIn 0.3s ease;">
          <h1 style="font-size:var(--text-xl);font-weight:800;color:var(--text-primary);margin-bottom:var(--space-6);">Solicitar Peças</h1>
          <div class="empty-state" style="padding:var(--space-8);text-align:center;background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--radius-xl);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:48px;height:48px;margin:0 auto var(--space-4);color:var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <h3 style="color:var(--text-primary);font-weight:600;">Sem Equipamento Alocado</h3>
            <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-top:8px;">Você precisa estar alocado em um equipamento para solicitar peças.</p>
          </div>
        </div>
      `;
    }

    setTimeout(() => {
      document.getElementById('btn-w-pt-save').addEventListener('click', () => {
        const desc = document.getElementById('w-pt-desc').value.trim();
        if (!desc) {
          window.Toast.error('Erro', 'Descrição da peça é obrigatória.');
          return;
        }

        const eqId = document.getElementById('w-pt-eq').value;
        const pn = document.getElementById('w-pt-pn').value.trim();
        const qty = parseInt(document.getElementById('w-pt-qty').value) || 1;
        const obs = document.getElementById('w-pt-obs').value.trim();

        const data = {
          equipmentId: eqId,
          descricao: `Qtd: ${qty}x — ${desc}`,
          codigo: pn,
          status: 'Solicitada',
          critica: document.getElementById('w-pt-critica').checked,
          fornecedor: 'Solicitado pelo Executante',
          fabricante: '',
          prazoEntrega: '',
          pedido: '',
          observacoes: obs,
          createdAt: window.DB.now()
        };

        window.DB.parts.create(data);
        window.Toast.success('Solicitação Enviada!', `Peça "${desc}" cadastrada com status Solicitada.`);
        document.getElementById('w-pt-desc').value = '';
        document.getElementById('w-pt-pn').value = '';
        document.getElementById('w-pt-qty').value = '1';
        document.getElementById('w-pt-obs').value = '';
      });
    }, 100);

    return `
      <div class="page-container" style="animation:fadeIn 0.3s ease;">
        <h1 style="font-size:var(--text-xl);font-weight:800;color:var(--text-primary);margin-bottom:var(--space-2);">Solicitar Falta de Peça</h1>
        <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-6);">Informe as peças necessárias para o andamento do seu serviço.</p>
        
        <div class="card" style="max-width:600px;background:var(--bg-card);border:1px solid var(--border-card);">
          <div style="display:flex;flex-direction:column;gap:var(--space-4);">
            <div class="form-group">
              <label>Equipamento *</label>
              <select id="w-pt-eq" class="form-control">
                ${myEqs.map(e => `<option value="${e.id}">${e.codigo} - ${e.nome}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Descrição da Peça *</label>
              <input id="w-pt-desc" class="form-control" placeholder="Ex: Filtro de ar primário" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Part Number / Código</label>
                <input id="w-pt-pn" class="form-control" placeholder="Ex: PN-98765" />
              </div>
              <div class="form-group">
                <label>Quantidade *</label>
                <input type="number" id="w-pt-qty" class="form-control" value="1" min="1" required />
              </div>
            </div>
            
            <div class="checkbox-wrap" style="background:rgba(255,179,0,0.1);border:1px solid rgba(255,179,0,0.3);padding:var(--space-3);border-radius:var(--radius-md);">
              <input type="checkbox" id="w-pt-critica" />
              <label for="w-pt-critica" style="cursor:pointer;color:var(--color-warning);font-weight:600;">Peça Crítica (Bloqueia o equipamento)</label>
            </div>

            <div class="form-group">
              <label>Observações / Justificativa</label>
              <textarea id="w-pt-obs" class="form-control" rows="3" placeholder="Informações adicionais para o PCM..."></textarea>
            </div>
            
            <div style="margin-top:var(--space-4);text-align:right;">
              <button class="btn btn-primary" id="btn-w-pt-save" style="width:100%;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px;margin-right:8px;display:inline-block;vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
                Enviar Solicitação de Peça
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  return { render };
})();

window.WorkerServices = (() => {
  function render() {
    const session = window.Auth.getSession();
    if (!session || session.perfil !== 'Executante') return `<div class="page-container">Acesso restrito.</div>`;

    const eqs = window.DB.equipment.list() || [];
    const myEqs = getMyEquipments(session);

    if (myEqs.length === 0) {
      return `
        <div class="page-container" style="animation:fadeIn 0.3s ease;">
          <h1 style="font-size:var(--text-xl);font-weight:800;color:var(--text-primary);margin-bottom:var(--space-6);">Solicitar Serviço de Terceiro</h1>
          <div class="empty-state" style="padding:var(--space-8);text-align:center;background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--radius-xl);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:48px;height:48px;margin:0 auto var(--space-4);color:var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <h3 style="color:var(--text-primary);font-weight:600;">Sem Equipamento Alocado</h3>
            <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-top:8px;">Você precisa estar alocado em um equipamento para solicitar serviços.</p>
          </div>
        </div>
      `;
    }

    setTimeout(() => {
      document.getElementById('btn-w-sv-save').addEventListener('click', () => {
        const desc = document.getElementById('w-sv-desc').value.trim();
        const dest = document.getElementById('w-sv-dest').value;

        if (!desc) {
          window.Toast.error('Erro', 'Descrição do serviço é obrigatória.');
          return;
        }
        if (!dest) {
          window.Toast.error('Erro', 'Setor de destino é obrigatório.');
          return;
        }

        const eqId = document.getElementById('w-sv-eq').value;
        const eq = window.DB.equipment.get(eqId);
        
        const payload = {
          id: window.DB.uid('sol'),
          origem: 'Executante (' + session.nome + ')',
          destino: dest,
          equipmentId: eqId,
          descricao: desc,
          status: 'Aguardando',
          createdAt: window.DB.now(),
          updatedAt: window.DB.now()
        };

        window.DB.solicitacoes.add(payload);
        window.Toast.success('Enviado!', `Solicitação para ${dest} enviada ao PCM.`);
        document.getElementById('w-sv-desc').value = '';
      });
    }, 100);

    return `
      <div class="page-container" style="animation:fadeIn 0.3s ease;">
        <h1 style="font-size:var(--text-xl);font-weight:800;color:var(--text-primary);margin-bottom:var(--space-2);">Solicitar Serviço Externo</h1>
        <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-6);">Abra uma requisição para outros setores de manutenção (Usinagem, Elétrica, etc).</p>

        <div class="card" style="max-width:600px;background:var(--bg-card);border:1px solid var(--border-card);">
          <div style="display:flex;flex-direction:column;gap:var(--space-4);">
            <div class="form-group">
              <label>Equipamento *</label>
              <select id="w-sv-eq" class="form-control">
                ${myEqs.map(e => `<option value="${e.id}">${e.codigo} - ${e.nome}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Setor de Destino *</label>
              <select id="w-sv-dest" class="form-control">
                <option value="">Selecione o setor...</option>
                <option value="Usinagem">Usinagem</option>
                <option value="Caldeiraria">Caldeiraria</option>
                <option value="Mecânica">Mecânica</option>
                <option value="Elétrica">Elétrica</option>
                <option value="Lubrificação">Lubrificação</option>
              </select>
            </div>
            <div class="form-group">
              <label>Descrição do Serviço *</label>
              <textarea id="w-sv-desc" class="form-control" rows="4" placeholder="Detalhe o serviço que precisa ser realizado..." required></textarea>
            </div>
            
            <div style="margin-top:var(--space-4);text-align:right;">
              <button class="btn btn-primary" id="btn-w-sv-save" style="width:100%;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px;margin-right:8px;display:inline-block;vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
                Enviar Solicitação
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  return { render };
})();
