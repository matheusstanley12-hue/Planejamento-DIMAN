/* ============================================================
   PLANEJAMENTO DIMAN-BHZ — Module: Ata de Reunião
   ============================================================ */

window.MeetingsModule = (() => {
  let selectedMeetingDate = '';

  function getMeetingDates() {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Up to ~4 weeks ahead
    const dates = [];
    let curr = new Date(2026, 5, 30); // 30/06/2026
    
    while (curr <= endDate) {
      if (curr.getDay() === 2) {
        dates.push(new Date(curr)); // Terças-feiras
      }
      curr.setDate(curr.getDate() + 1);
    }
    return dates.sort((a, b) => b - a); // descending
  }

  function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function formatDisplayDate(dStr) {
    if (!dStr) return '';
    const [y, m, d] = dStr.split('-');
    return `${d}/${m}/${y}`;
  }

  function getInitialMeetingDate() {
    const dates = getMeetingDates();
    const todayStr = formatDate(new Date());
    // Find the closest meeting date that is <= today
    const pastDates = dates.filter(d => formatDate(d) <= todayStr);
    if (pastDates.length > 0) return formatDate(pastDates[0]);
    return formatDate(dates[dates.length - 1]); // fallback to the oldest if all are in future
  }

  function render() {
    if (!selectedMeetingDate) selectedMeetingDate = getInitialMeetingDate();
    const dates = getMeetingDates();
    
    // Workforce for dropdown
    const wf = DB.workforce.list().sort((a,b) => a.nome.localeCompare(b.nome));

    return `
      <div class="page-container">
        <header class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div class="page-title">
            <h2>Ata de Reunião</h2>
            <p>Gerenciamento de Tarefas e Deliberações</p>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <select id="meeting-date-select" class="form-control" style="width:auto; font-weight:bold;" onchange="MeetingsModule.onDateChange()">
              ${dates.map(d => {
                const f = formatDate(d);
                return `<option value="${f}" ${f === selectedMeetingDate ? 'selected' : ''}>Reunião: ${formatDisplayDate(f)}</option>`;
              }).join('')}
            </select>
            <button class="btn btn-secondary" onclick="MeetingsModule.downloadPDF()">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:16px; height:16px; margin-right:6px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Baixar PDF
            </button>
            ${(Auth.getSession() && ['Desenvolvedor', 'Administrador', 'Planejador', 'Gerente', 'Coordenador', 'Encarregado'].includes(Auth.getSession().perfil)) ? `<button class="btn btn-primary" onclick="MeetingsModule.openNewTaskModal()">+ Nova Tarefa</button>` : ''}
          </div>
        </header>

        <div class="content-panel" style="margin-top:20px;">
          <div id="meetings-tbody">
            <!-- Rendered by JS -->
          </div>
        </div>
      </div>

      <!-- Nova Tarefa Modal -->
      <div id="meeting-task-modal" class="modal-overlay">
        <div class="modal" style="max-width: 600px; box-shadow:var(--shadow-lg);">
          <div class="modal-header">
            <div class="modal-title">Nova Tarefa de Reunião</div>
            <button class="modal-close" onclick="MeetingsModule.closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display:flex; gap:15px; margin-bottom:15px;">
              <div class="form-group" style="flex:1; margin-bottom:0;">
                <label>Tag do Equipamento</label>
                <input type="text" id="mt-tag" class="form-control" placeholder="Ex: BBA 303" />
              </div>
              <div class="form-group" style="flex:1; margin-bottom:0;">
                <label>Local de Manutenção</label>
                <select id="mt-local" class="form-control">
                  <option value="">Selecione...</option>
                  <option value="DIMAN-BHZ">DIMAN-BHZ</option>
                  <option value="LAGOA SANTA">LAGOA SANTA</option>
                  <option value="MARIANA">MARIANA</option>
                  <option value="CKS">CKS</option>
                  <option value="CAMPO">CAMPO</option>
                </select>
              </div>
              <div class="form-group" style="flex:1; margin-bottom:0;">
                <label>Cliente</label>
                <input type="text" id="mt-client" class="form-control" placeholder="Ex: Vale" />
              </div>
            </div>
            <div class="form-group">
              <label>Descrição da Tarefa *</label>
              <textarea id="mt-desc" class="form-control" rows="3" required></textarea>
            </div>
            <div style="display:flex; gap:15px;">
              <div class="form-group" style="flex:1;">
                <label>Responsável</label>
                <input type="text" id="mt-resp" class="form-control" placeholder="Ex: Engenharia" />
              </div>
              <div class="form-group" style="flex:1;">
                <label>Data para Concluir</label>
                <input type="date" id="mt-due" class="form-control" />
              </div>
            </div>
            <div style="display:flex; gap:15px;">
              <div class="form-group" style="flex:1;">
                <label>Prioridade</label>
                <select id="mt-prio" class="form-control">
                  <option value="Urgente">Urgente</option>
                  <option value="Alta">Alta</option>
                  <option value="Média" selected>Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;">
                <label>Etapa</label>
                <select id="mt-status" class="form-control">
                  <option value="Não Iniciada" selected>Não Iniciada</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluída">Concluída</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;">
                <label>Data Conclusão Real</label>
                <input type="date" id="mt-real-date" class="form-control" />
              </div>
            </div>
            <div class="form-group">
              <label>Comentários</label>
              <textarea id="mt-comments" class="form-control" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="MeetingsModule.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="MeetingsModule.saveTask()">Salvar Tarefa</button>
          </div>
        </div>
      </div>
    `;
  }

  function getPriorityColor(p) {
    if (p === 'Urgente') return 'var(--danger)';
    if (p === 'Alta') return 'var(--warning)';
    if (p === 'Média') return 'var(--info)';
    if (p === 'Baixa') return 'var(--text-muted)';
    return 'var(--text-primary)';
  }

  function renderTable() {
    const tbody = document.getElementById('meetings-tbody');
    if (!tbody) return;

    let tasks = DB.meetingTasks.list().filter(t => t.meetingDate === selectedMeetingDate);
    // Sort: Pending first, then by urgency
    const prioWeight = { 'Urgente': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
    tasks.sort((a,b) => {
      if (a.status !== b.status) return a.status === 'Pendente' ? -1 : 1;
      return prioWeight[b.priority] - prioWeight[a.priority];
    });

    if (tasks.length === 0) {
      tbody.innerHTML = `
        <div class="empty-state" style="padding:var(--space-8);text-align:center;background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--radius-xl);">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:48px;height:48px;margin:0 auto var(--space-4);color:var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"/></svg>
          <h3 style="font-weight:600;color:var(--text-primary);margin-bottom:var(--space-2);">Nenhuma tarefa registrada</h3>
          <p style="color:var(--text-secondary);font-size:var(--text-sm);">Clique em "Nova Tarefa" para adicionar deliberações desta reunião.</p>
        </div>
      `;
      return;
    }

    const session = Auth.getSession();
    const isManager = session && ['Desenvolvedor', 'Administrador', 'Planejador', 'Gerente', 'Coordenador', 'Encarregado'].includes(session.perfil);

    tbody.innerHTML = `
      <div class="table-responsive" style="background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--radius-lg);overflow-x:auto;">
        <table class="table" style="width:100%; border-collapse:collapse; text-align:left; min-width:800px;">
          <thead style="background:var(--bg-base); border-bottom:1px solid var(--border-card);">
            <tr>
              <th style="padding:var(--space-3); color:var(--text-secondary); font-weight:600; font-size:var(--text-sm); width:15%;">Status / Prioridade</th>
              <th style="padding:var(--space-3); color:var(--text-secondary); font-weight:600; font-size:var(--text-sm); width:40%;">Descrição / Comentários</th>
              <th style="padding:var(--space-3); color:var(--text-secondary); font-weight:600; font-size:var(--text-sm); width:15%;">Responsável</th>
              <th style="padding:var(--space-3); color:var(--text-secondary); font-weight:600; font-size:var(--text-sm); width:15%;">Prazo / Conclusão</th>
              <th style="padding:var(--space-3); color:var(--text-secondary); font-weight:600; font-size:var(--text-sm); width:15%; text-align:center;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => {
              const isDone = t.status === 'Concluída';
              const completedStr = t.completedAt ? formatDisplayDate(t.completedAt.split('T')[0]) : '';
              const overdue = !isDone && window.daysBetween(new Date().toISOString().slice(0,10), t.dueDate) < 0;
              
              let actionsHtml = '';
              if (isManager) {
                actionsHtml += `<button class="btn btn-ghost" style="padding:4px 8px;" onclick="event.stopPropagation(); MeetingsModule.openNewTaskModal('${t.id}')" title="Editar">Editar</button>`;
                actionsHtml += `<button class="btn btn-ghost" style="color:var(--color-danger); padding:4px 8px;" onclick="event.stopPropagation(); MeetingsModule.deleteTask('${t.id}')" title="Excluir">Excluir</button>`;
              }
              if (!isDone) {
                if (t.status === 'Não Iniciada' || t.status === 'Pendente') {
                  actionsHtml += `<button class="btn btn-info" style="padding:4px 8px; font-size:12px;" onclick="event.stopPropagation(); MeetingsModule.acceptTask('${t.id}')">Em Andamento</button>`;
                }
                actionsHtml += `<button class="btn btn-outline" style="padding:4px 8px; font-size:12px;" onclick="event.stopPropagation(); MeetingsModule.changeDateTask('${t.id}')">Data</button>`;
                actionsHtml += `<button class="btn btn-success" style="padding:4px 8px; font-size:12px;" onclick="event.stopPropagation(); MeetingsModule.completeTask('${t.id}')">Concluir</button>`;
              }

              return `
                <tr class="task-row" style="border-bottom:1px solid var(--border-card); cursor:pointer; transition:background 0.2s; ${isDone ? 'opacity:0.7; background:rgba(0,0,0,0.02);' : ''}" onclick="MeetingsModule.openNewTaskModal('${t.id}')" onmouseover="this.style.background='var(--bg-hover, rgba(0,0,0,0.02))'" onmouseout="this.style.background='${isDone ? 'rgba(0,0,0,0.02)' : 'transparent'}'">
                  <td style="padding:var(--space-3); vertical-align:top;">
                    <div style="display:flex; flex-direction:column; gap:var(--space-2); align-items:flex-start;">
                      <span class="badge ${isDone ? 'badge-success' : (t.status === 'Em Andamento' ? 'badge-primary' : 'badge-warning')}">${t.status}</span>
                      <span class="badge" style="background:transparent;border:1px solid ${getPriorityColor(t.priority)};color:${getPriorityColor(t.priority)};">${t.priority}</span>
                    </div>
                  </td>
                  <td style="padding:var(--space-3); vertical-align:top;">
                    ${(t.tag || t.local || t.client) ? `
                      <div style="display:flex; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
                        ${t.tag ? `<span style="font-size:11px; font-weight:700; background:var(--bg-base); padding:2px 6px; border-radius:4px; border:1px solid rgba(0,0,0,0.05); color:var(--text-secondary);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:12px; height:12px; margin-right:2px; display:inline-block; vertical-align:-2px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" /></svg>${t.tag}</span>` : ''}
                        ${t.client ? `<span style="font-size:11px; font-weight:700; background:var(--bg-base); padding:2px 6px; border-radius:4px; border:1px solid rgba(0,0,0,0.05); color:var(--text-secondary);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:12px; height:12px; margin-right:2px; display:inline-block; vertical-align:-2px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>${t.client}</span>` : ''}
                        ${t.local ? `<span style="font-size:11px; font-weight:700; background:var(--bg-base); padding:2px 6px; border-radius:4px; border:1px solid rgba(0,0,0,0.05); color:var(--text-secondary);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:12px; height:12px; margin-right:2px; display:inline-block; vertical-align:-2px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>${t.local}</span>` : ''}
                      </div>
                    ` : ''}
                    <div style="font-weight:600;color:var(--text-primary);font-size:var(--text-base);line-height:1.4;${isDone ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${t.description}</div>
                    ${t.comments ? `
                      <div style="display:flex;align-items:flex-start;gap:var(--space-2);background:rgba(0,0,0,0.03);padding:var(--space-2);border-radius:var(--radius-sm);margin-top:var(--space-2); font-size:var(--text-sm); color:var(--text-secondary);">
                        <span style="font-style:italic;">${t.comments}</span>
                      </div>
                    ` : ''}
                  </td>
                  <td style="padding:var(--space-3); vertical-align:top; font-size:var(--text-sm); color:var(--text-secondary);">
                    <strong>${t.responsible}</strong>
                  </td>
                  <td style="padding:var(--space-3); vertical-align:top; font-size:var(--text-sm); color:var(--text-secondary);">
                    <div style="${overdue ? 'color:var(--color-danger);font-weight:bold;' : ''}">Prazo: ${formatDisplayDate(t.dueDate)}</div>
                    ${isDone ? `<div style="color:var(--success); font-weight:600; margin-top:4px;">Concluída: ${completedStr}</div>` : ''}
                  </td>
                  <td style="padding:var(--space-3); vertical-align:top; text-align:center;">
                    <div style="display:flex; justify-content:center; gap:var(--space-2); flex-wrap:wrap;">
                      ${actionsHtml}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function init() {
    renderTable();
  }

  function onDateChange() {
    selectedMeetingDate = document.getElementById('meeting-date-select').value;
    renderTable();
  }

  let editingTaskId = null;

  function openNewTaskModal(id = null) {
    if (typeof id === 'string') {
      editingTaskId = id;
      const t = DB.meetingTasks.list().find(x => x.id === id);
      if (t) {
        document.getElementById('mt-desc').value = t.description || '';
        document.getElementById('mt-tag').value = t.tag || '';
        document.getElementById('mt-local').value = t.local || '';
        document.getElementById('mt-client').value = t.client || '';
        document.getElementById('mt-resp').value = t.responsible || '';
        document.getElementById('mt-due').value = t.dueDate || '';
        document.getElementById('mt-prio').value = t.priority || 'Média';
        document.getElementById('mt-comments').value = t.comments || '';
        
        let st = t.status || 'Não Iniciada';
        if (st === 'Pendente' || st === 'Aceita') st = 'Não Iniciada'; // mapping old status if needed
        document.getElementById('mt-status').value = st;
        document.getElementById('mt-real-date').value = t.completedAt ? t.completedAt.split('T')[0] : '';
        
        document.querySelector('#meeting-task-modal .modal-title').innerText = 'Editar Tarefa de Reunião';
      }
    } else {
      editingTaskId = null;
      document.getElementById('mt-desc').value = '';
      document.getElementById('mt-tag').value = '';
      document.getElementById('mt-local').value = '';
      document.getElementById('mt-client').value = '';
      document.getElementById('mt-resp').value = '';
      document.getElementById('mt-due').value = '';
      document.getElementById('mt-prio').value = 'Média';
      document.getElementById('mt-comments').value = '';
      document.getElementById('mt-status').value = 'Não Iniciada';
      document.getElementById('mt-real-date').value = '';
      document.querySelector('#meeting-task-modal .modal-title').innerText = 'Nova Tarefa de Reunião';
    }
    document.getElementById('meeting-task-modal').classList.add('open');
  }

  function closeModal() {
    document.getElementById('meeting-task-modal').classList.remove('open');
    editingTaskId = null;
  }

  function saveTask() {
    const desc = document.getElementById('mt-desc').value.trim();
    const tag = document.getElementById('mt-tag').value.trim();
    const local = document.getElementById('mt-local').value.trim();
    const client = document.getElementById('mt-client').value.trim();
    const resp = document.getElementById('mt-resp').value;
    const due = document.getElementById('mt-due').value;
    const prio = document.getElementById('mt-prio').value;
    const statusVal = document.getElementById('mt-status').value;
    const realDate = document.getElementById('mt-real-date').value;
    const comments = document.getElementById('mt-comments').value.trim();

    if (!desc) {
      if (window.Toast) window.Toast.error('Atenção', 'A Descrição da tarefa é obrigatória.');
      else alert('A Descrição da tarefa é obrigatória.');
      return;
    }

    let compAt = realDate ? (realDate + 'T12:00:00Z') : null;
    if (statusVal === 'Concluída' && !compAt) {
      compAt = DB.now(); // se marcou concluida sem data real, assume hoje
    }

    const session = Auth.getSession();
    if (editingTaskId) {
      DB.meetingTasks.update(editingTaskId, {
        description: desc,
        tag: tag,
        local: local,
        client: client,
        responsible: resp,
        dueDate: due,
        priority: prio,
        comments: comments,
        status: statusVal,
        completedAt: compAt
      });
      if (window.Toast) window.Toast.success('Salvo', 'Tarefa editada com sucesso.');
    } else {
      DB.meetingTasks.add({
        id: 'mt-' + Date.now(),
        meetingDate: selectedMeetingDate,
        description: desc,
        tag: tag,
        local: local,
        client: client,
        responsible: resp,
        dueDate: due,
        priority: prio,
        comments: comments,
        status: statusVal,
        completedAt: compAt,
        createdBy: session ? session.nome : 'Desconhecido',
        createdAt: DB.now()
      });
      if (window.Toast) window.Toast.success('Criado', 'Tarefa criada com sucesso.');
    }

    closeModal();
    renderTable();
  }

  function acceptTask(id) {
    DB.meetingTasks.update(id, { status: 'Em Andamento' });
    if (window.Toast) window.Toast.success('Em Andamento', 'Tarefa movida para em andamento.');
    renderTable();
  }

  function changeDateTask(id) {
    const newDate = prompt('Digite a nova data para conclusão (AAAA-MM-DD):');
    if (!newDate) return;
    DB.meetingTasks.update(id, { dueDate: newDate });
    if (window.Toast) window.Toast.success('Data Alterada', 'Nova data salva com sucesso.');
    renderTable();
  }

  function completeTask(id) {
    window.uiConfirm('Marcar esta tarefa como concluída?', (res) => {
      if (!res) return;
      DB.meetingTasks.update(id, { status: 'Concluída', completedAt: DB.now() });
      renderTable();
    });
  }

  function deleteTask(id) {
    window.uiConfirm('Tem certeza que deseja excluir esta tarefa?', (res) => {
      if (!res) return;
      DB.meetingTasks.delete(id);
      renderTable();
    });
  }

  function downloadPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('Biblioteca de PDF não carregada. Verifique sua conexão.');
      return;
    }
    const doc = new window.jspdf.jsPDF();
    const meetingDisplay = formatDisplayDate(selectedMeetingDate);
    
    doc.setFontSize(16);
    doc.text(`Ata de Reunião - ${meetingDisplay}`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${formatDisplayDate(formatDate(new Date()))}`, 14, 28);
    
    const tasks = DB.meetingTasks.list().filter(t => t.meetingDate === selectedMeetingDate);
    const prioWeight = { 'Urgente': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
    tasks.sort((a,b) => {
      if (a.status !== b.status) return a.status === 'Pendente' ? -1 : 1;
      return prioWeight[b.priority] - prioWeight[a.priority];
    });

    const rows = tasks.map(t => [
      t.status,
      t.priority,
      t.description,
      t.responsible,
      formatDisplayDate(t.dueDate),
      t.comments || ''
    ]);

    doc.autoTable({
      startY: 35,
      head: [['Status', 'Prioridade', 'Descrição', 'Responsável', 'Prazo', 'Comentários']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [15, 30, 60] },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 0) {
          if (data.cell.raw === 'Concluída') data.cell.styles.textColor = [0, 128, 0];
          else data.cell.styles.textColor = [200, 100, 0];
        }
        if (data.section === 'body' && data.column.index === 1) {
          if (data.cell.raw === 'Urgente') data.cell.styles.textColor = [220, 53, 69];
          else if (data.cell.raw === 'Alta') data.cell.styles.textColor = [253, 126, 20];
          else if (data.cell.raw === 'Média') data.cell.styles.textColor = [13, 110, 253];
        }
      }
    });

    doc.save(`Ata_Reuniao_${selectedMeetingDate}.pdf`);
  }

  // To be called after Router renders the html
  const originalRender = render;
  function renderWithInit() {
    const html = originalRender();
    setTimeout(init, 50);
    return html;
  }

  return { render: renderWithInit,
    onDateChange,
    openNewTaskModal,
    closeModal,
    saveTask,
    completeTask,
    deleteTask,
    acceptTask,
    changeDateTask,
    downloadPDF
  };
})();
