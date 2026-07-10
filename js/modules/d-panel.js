/* ================================================================
   PLANEJAMENTO DIMAN-BHZ
   D-1 | D | D+1 — Painel Operacional Diário (MÓDULO PRINCIPAL)
   ================================================================ */

window.DPanel = (() => {
  let refreshInterval = null;

  function today() { return new Date().toISOString().slice(0, 10); }
  function dateOf(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  function getTasksForDate(date) {
    return DB.tasks.getAll().filter(t => {
      const start = t.dataPlanejadaInicio;
      const end   = t.dataPlanejadaTermino;
      if (!start || !end) return false;
      return start <= date && end >= date;
    });
  }

  function calcAdherence(planned, done) {
    if (!planned) return 0;
    return Math.round((done / planned) * 100);
  }

  function semaphoreClass(pct) {
    if (pct >= 90) return 'success';
    if (pct >= 70) return 'warning';
    return 'danger';
  }

  function semaphoreEmoji(pct) {
    if (pct >= 90) return '🟢';
    if (pct >= 70) return '🟡';
    return '🔴';
  }

  function getPendingReasons(tasks) {
    const reasons = { 'Falta de Peça': 0, 'Falta de Mão de Obra': 0, 'Falta de Ferramenta': 0,
      'Chuva': 0, 'Prioridade Alterada': 0, 'Falha Operacional': 0, 'Outros': 0 };
    const restrictions = DB.restrictions.getAll().filter(r => r.status === 'Aberta');
    tasks.forEach(t => {
      if (t.status === 'Aguardando Peça') reasons['Falta de Peça']++;
      else if (t.status === 'Aguardando Recurso') reasons['Falta de Mão de Obra']++;
      else if (t.status === 'Bloqueada') {
        const r = restrictions.find(r => r.tarefaBloqueada === t.descricao || r.equipmentId === t.equipmentId);
        if (r?.tipo === 'Falta de Ferramenta') reasons['Falta de Ferramenta']++;
        else if (r?.tipo === 'Aguardando Aprovação') reasons['Prioridade Alterada']++;
        else reasons['Outros']++;
      } else if (t.status === 'Não Iniciada' && t.dataPlanejadaTermino < today()) {
        reasons['Falha Operacional']++;
      }
    });
    return reasons;
  }

  function getTomorrowAlerts(tomorrowTasks) {
    const alerts = [];
    const parts = DB.parts.getAll();
    const restrictions = DB.restrictions.getAll().filter(r => r.status === 'Aberta');
    const workforce = DB.workforce.list();

    tomorrowTasks.forEach(t => {
      // Check parts
      const taskParts = parts.filter(p => p.equipmentId === t.equipmentId && ['Solicitada','Comprada','Em Transporte'].includes(p.status));
      if (taskParts.length > 0) {
        alerts.push({ type: 'danger', msg: `ATENÇÃO: A atividade "${t.descricao}" está programada para amanhã, porém ${taskParts.map(p => `a peça "${p.descricao}"`).join(' e ')} ainda não ${taskParts.length > 1 ? 'foram recebidas' : 'foi recebida'}.` });
      }
      // Check restrictions
      const blocked = restrictions.filter(r => r.equipmentId === t.equipmentId && (r.tarefaBloqueada === t.descricao || r.tipo === 'Falta de Mão de Obra'));
      if (blocked.length > 0) {
        blocked.forEach(r => {
          if (r.tipo === 'Falta de Mão de Obra') {
            const disc = r.disciplina;
            alerts.push({ type: 'warning', msg: `ATENÇÃO: A equipe de ${disc.toLowerCase()} está com sobrecarga para amanhã.` });
          }
        });
      }
    });

    // Check critical tasks
    const criticalTomorrow = tomorrowTasks.filter(t => (window.CriticalPath && window.CriticalPath.isTaskCritical ? window.CriticalPath.isTaskCritical(t) : t.critico) && t.status !== 'Concluída');
    if (criticalTomorrow.length > 0) {
      alerts.push({ type: 'danger', msg: `ATENÇÃO: ${criticalTomorrow.length} atividade${criticalTomorrow.length > 1 ? 's' : ''} do caminho crítico ${criticalTomorrow.length > 1 ? 'estão programadas' : 'está programada'} para amanhã. Verificar disponibilidade de recursos.` });
    }

    return [...new Map(alerts.map(a => [a.msg, a])).values()]; // deduplicate
  }

  function getAIAlerts() {
    const allTasks = DB.tasks.getAll();
    const todayTasks = getTasksForDate(today());
    const tomorrowTasks = getTasksForDate(dateOf(1));
    const parts = DB.parts.getAll();
    const restrictions = DB.restrictions.getAll().filter(r => r.status === 'Aberta');

    const alerts = [];

    // Tasks not likely to finish today
    const inProgress = todayTasks.filter(t => t.status === 'Em Andamento' && t.pctExecutado < 80);
    if (inProgress.length > 0) {
      alerts.push(`Existem ${inProgress.length} atividade${inProgress.length>1?'s':''} em andamento hoje com menos de 80% de conclusão — risco de não finalização no dia.`);
    }

    // Critical pending from yesterday
    const yesterdayPending = getTasksForDate(dateOf(-1)).filter(t => t.status !== 'Concluída' && (window.CriticalPath && window.CriticalPath.isTaskCritical ? window.CriticalPath.isTaskCritical(t) : t.critico));
    if (yesterdayPending.length > 0) {
      alerts.push(`Se as ${yesterdayPending.length} atividade${yesterdayPending.length>1?'s':''} pendente${yesterdayPending.length>1?'s':''} de ontem não forem concluídas hoje, a liberação da sonda será impactada.`);
    }

    // Critical parts blocking tomorrow
    const critParts = parts.filter(p => p.critica && ['Solicitada','Comprada','Em Transporte'].includes(p.status));
    if (critParts.length > 0) {
      alerts.push(`Existem ${critParts.length} peça${critParts.length>1?'s':''} crítica${critParts.length>1?'s':''} pendente${critParts.length>1?'s':''} que podem impactar atividades de amanhã.`);
    }

    // Overloaded disciplines
    const disciplines = {};
    tomorrowTasks.forEach(t => { disciplines[t.disciplina] = (disciplines[t.disciplina] || 0) + 1; });
    Object.entries(disciplines).forEach(([d, count]) => {
      if (count >= 4) alerts.push(`Possível sobrecarga na disciplina de ${d} amanhã: ${count} atividades programadas para a mesma equipe.`);
    });

    return alerts.slice(0, 4);
  }

  function getTopPerformers() {
    const today = new Date();
    const currentMonthPrefix = today.toISOString().slice(0, 7); // "YYYY-MM"
    
    const tasks = window.DB.tasks ? window.DB.tasks.getAll() : [];
    
    // Filtra tarefas concluídas no mês atual
    const concludedTasks = tasks.filter(t => {
      // Se não tiver dataRealTermino preenchida, usa a data de atualização ou de criação do registro
      const dataTermino = t.dataRealTermino || t.updatedAt || t.createdAt || today.toISOString();
      return t.status === 'Concluída' && dataTermino.startsWith(currentMonthPrefix);
    });
    
    const workerCounts = {};
    const timesheets = window.DB.timesheets ? window.DB.timesheets.list() : [];

    concludedTasks.forEach(t => {
      const taskWorkers = new Set();
      if (t.responsavel && t.responsavel !== 'Não atribuído' && t.responsavel !== 'Sistema') {
        const wfList = window.DB.workforce ? window.DB.workforce.list() : [];
        t.responsavel.split(',').forEach(respName => {
           const trimmedName = respName.trim();
           if (trimmedName) {
             const w = wfList.find(wf => wf.nome === trimmedName);
             taskWorkers.add(w ? w.id : `name:${trimmedName}`);
           }
        });
      }
      timesheets.forEach(ts => {
        if (ts.taskId === t.id && (!ts.tipo || ts.tipo === 'Trabalho')) {
          taskWorkers.add(ts.workerId || `name:${ts.workerNome}`);
        }
      });
      taskWorkers.forEach(wId => {
        if (!workerCounts[wId]) workerCounts[wId] = new Set();
        workerCounts[wId].add(t.id);
      });
    });

    const ranking = [];
    Object.keys(workerCounts).forEach(wId => {
      const count = workerCounts[wId].size;
      if (wId.startsWith('name:')) {
        ranking.push({ id: wId, nome: wId.replace('name:', ''), count });
      } else {
        const w = window.DB.workforce.get(wId);
        if (w) ranking.push({ id: wId, nome: w.nome, count });
      }
    });

    ranking.sort((a, b) => b.count - a.count);
    return ranking.slice(0, 5); // Top 5
  }

  function renderTopPerformersTicker() {
    const top = getTopPerformers();
    if (top.length === 0) return '';
    
    const emojis = ['🏆 1º', '🥈 2º', '🥉 3º', '🏅 4º', '🏅 5º'];
    const items = top.map((t, idx) => `<span style="margin: 0 40px;">${emojis[idx] || '🏅'} <strong>${t.nome}</strong> (${t.count} tarefas executadas)</span>`).join('');

    return `
      <div style="position: sticky; bottom: 0; z-index: 50; background: linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(16, 185, 129, 0.1) 100%); border-top: 2px solid var(--brand-primary-light); border-bottom: 2px solid var(--brand-primary-light); margin-left: calc(var(--space-6) * -1); margin-right: calc(var(--space-6) * -1); margin-bottom: calc(var(--space-6) * -1); margin-top: var(--space-6); width: calc(100% + var(--space-6) * 2); box-shadow: 0 -4px 12px rgba(0,0,0,0.15); display: block; overflow: hidden;">
        <marquee scrollamount="6" behavior="scroll" direction="left" onmouseover="this.stop();" onmouseout="this.start();" style="padding: 10px 0; font-size: 1.1rem; color: var(--text-primary); white-space: nowrap; line-height: 24px;">
          <span style="font-weight: 800; color: var(--brand-primary-light); margin-right: 40px; text-transform: uppercase; vertical-align: middle;">🚀 TOP EXECUTANTES DO MÊS:</span>
          <span style="vertical-align: middle;">${items}</span>
          <span style="font-weight: 800; color: var(--brand-primary-light); margin-left: 40px; margin-right: 15px; text-transform: uppercase; vertical-align: middle;">🚀 PARABÉNS PELO EMPENHO!</span>
        </marquee>
      </div>
    `;
  }

  function renderD1Section(tasks) {
    const d1 = dateOf(-1);
    const planned = tasks.length;
    const done = tasks.filter(t => t.status === 'Concluída').length;
    const notDone = tasks.filter(t => t.status !== 'Concluída');
    const adherence = calcAdherence(planned, done);
    const hPlanned = tasks.reduce((s, t) => s + (parseFloat(t.horasPlanejadas) || 0), 0);
    const hDone = tasks.reduce((s, t) => s + (parseFloat(t.horasRealizadas) || 0), 0);
    const reasons = getPendingReasons(notDone);
    const semClass = semaphoreClass(adherence);

    return `
      <div class="card" style="height:100%; display:flex; flex-direction:column; border-radius:12px; box-shadow:0 2px 4px rgba(0,0,0,0.02); background:var(--bg-base); font-family:'Inter', sans-serif; padding:var(--space-4);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);padding-bottom:var(--space-3);border-bottom:1px solid var(--border-default);">
          <div>
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:4px;">
              <div style="width:8px;height:8px;border-radius:50%;background:var(--color-${semClass});"></div>
              <div style="font-size:16px;font-weight:700;color:var(--text-muted)">D-1 · Ontem</div>
            </div>
            <div style="font-size:30px;font-weight:800;color:var(--text-primary);letter-spacing:-1px;">${formatDate(d1)}</div>
          </div>
        </div>

        <!-- KPI row -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-2);margin-bottom:var(--space-4);">
          <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-4);text-align:center;border:1px solid var(--border-default);box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;color:var(--text-muted);margin-bottom:4px;"><svg style="width:14px;height:14px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/></svg></div>
            <div style="font-size:36px;font-weight:800;color:var(--text-primary);line-height:1;">${planned}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-weight:500;">Planejadas</div>
          </div>
          <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-4);text-align:center;border:1px solid var(--border-default);box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;color:var(--color-success);margin-bottom:4px;"><svg style="width:14px;height:14px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
            <div style="font-size:36px;font-weight:800;color:var(--color-success);line-height:1;">${done}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-weight:500;">Executadas</div>
          </div>
          <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-4);text-align:center;border:1px solid var(--border-default);box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;color:var(--color-danger);margin-bottom:4px;"><svg style="width:14px;height:14px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
            <div style="font-size:36px;font-weight:800;color:var(--color-danger);line-height:1;">${notDone.length}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-weight:500;">Pendentes</div>
          </div>
          <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-4);text-align:center;border:1px solid var(--border-default);box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;color:var(--color-${semClass});margin-bottom:4px;"><svg style="width:14px;height:14px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg></div>
            <div style="font-size:36px;font-weight:800;color:var(--color-${semClass});line-height:1;">${adherence}%</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-weight:500;">Aderência</div>
          </div>
        </div>

        <!-- Horas -->
        <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-4);">
          <div style="flex:1;background:var(--bg-card);border-radius:12px;padding:var(--space-3);display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border-default);box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="font-size:12px;color:var(--text-muted)">Hrs Plan.</div>
            <div style="font-size:20px;font-weight:800;color:var(--text-primary);font-family:var(--font-mono)">${hPlanned.toFixed(0)}h</div>
          </div>
          <div style="flex:1;background:var(--bg-card);border-radius:12px;padding:var(--space-3);display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border-default);box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="font-size:12px;color:var(--text-muted)">Hrs Real.</div>
            <div style="font-size:20px;font-weight:800;color:var(--brand-primary-light);font-family:var(--font-mono)">${hDone.toFixed(0)}h</div>
          </div>
        </div>

        <!-- Adherence bar -->
        <div style="margin-bottom:var(--space-4);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:12px;font-weight:600;color:var(--text-muted);">Progresso D-1</span>
            <span style="font-size:12px;font-weight:800;color:var(--color-${semClass});">${adherence}%</span>
          </div>
          <div style="height:4px;background:var(--border-default);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${adherence}%;background:var(--color-${semClass});border-radius:4px;"></div></div>
        </div>

        <div style="flex:1;"></div>

        <!-- Motivos de não execução -->
        ${notDone.length > 0 ? `
        <div style="margin-top:auto;padding-top:var(--space-3);border-top:1px dashed var(--border-default);">
          <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:var(--space-2);">Motivos de Não Execução</div>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-2);">
            ${Object.entries(reasons).filter(([,v])=>v>0).map(([k,v]) => `
              <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:var(--bg-card);border-radius:var(--radius-sm);border:1px solid var(--border-default);">
                <span style="font-size:12px;font-weight:800;color:var(--color-warning);">${v}</span>
                <span style="font-size:12px;color:var(--text-secondary)">${k}</span>
              </div>
            `).join('')}
          </div>
        </div>` : `<div style="margin-top:auto;display:flex;align-items:center;gap:8px;padding:var(--space-3);background:var(--bg-card);border:1px solid var(--border-default);border-radius:12px;color:var(--color-success);font-size:12px;font-weight:600;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>Todas concluídas!</div>`}
      </div>
    `;
  }

  function renderDSection(tasks) {
    const todayStr = today();
    const total = tasks.length;
    const iniciadas = tasks.filter(t => t.status !== 'Não Iniciada').length;
    const emAndamento = tasks.filter(t => t.status === 'Em Andamento').length;
    const concluidas = tasks.filter(t => t.status === 'Concluída').length;
    const criticas = tasks.filter(t => window.CriticalPath && window.CriticalPath.isTaskCritical ? window.CriticalPath.isTaskCritical(t) : t.critico).length;
    const equipMap = {};
    DB.equipment.list().forEach(e => { equipMap[e.id] = e; });

    return `
      <div class="card" style="height:100%; display:flex; flex-direction:column; border-radius:12px; box-shadow:0 4px 12px rgba(30,136,229,0.1); border:1px solid var(--brand-primary-light); background:var(--bg-base); font-family:'Inter', sans-serif; padding:var(--space-4);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);padding-bottom:var(--space-3);border-bottom:1px solid var(--border-default);">
          <div>
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:4px;">
              <div style="width:8px;height:8px;border-radius:50%;background:var(--brand-primary-light);box-shadow:0 0 8px var(--brand-primary-light);"></div>
              <div style="font-size:16px;font-weight:700;color:var(--brand-primary-light)">D — HOJE</div>
            </div>
            <div style="font-size:30px;font-weight:800;color:var(--text-primary);letter-spacing:-1px;">${formatDate(todayStr)}</div>
          </div>
          <div id="live-clock" style="font-size:24px;font-weight:800;color:var(--text-primary);font-family:var(--font-mono);background:var(--bg-card);padding:6px 16px;border-radius:24px;border:1px solid var(--border-default);box-shadow:0 1px 3px rgba(0,0,0,0.05);"></div>
        </div>

        <!-- KPI row -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-2);margin-bottom:var(--space-4);">
          <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-4);text-align:center;border:1px solid var(--border-default);box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;color:var(--text-muted);margin-bottom:4px;"><svg style="width:14px;height:14px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg></div>
            <div style="font-size:36px;font-weight:800;color:var(--text-primary);line-height:1;">${total}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-weight:500;">Total</div>
          </div>
          <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-4);text-align:center;border:1px solid var(--border-default);box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;color:var(--color-info);margin-bottom:4px;"><svg style="width:14px;height:14px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
            <div style="font-size:36px;font-weight:800;color:var(--color-info);line-height:1;">${emAndamento}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-weight:500;">Em Andam.</div>
          </div>
          <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-4);text-align:center;border:1px solid var(--border-default);box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;color:var(--color-success);margin-bottom:4px;"><svg style="width:14px;height:14px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
            <div style="font-size:36px;font-weight:800;color:var(--color-success);line-height:1;">${concluidas}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-weight:500;">Concluídas</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-2);margin-bottom:var(--space-4);">
          <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-3) var(--space-4);display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border-default);box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="font-size:12px;color:var(--text-muted);font-weight:500;">Iniciadas</div>
            <div style="font-size:24px;font-weight:800;color:var(--text-primary)">${iniciadas}<span style="color:var(--text-muted);font-weight:500;font-size:14px;">/${total}</span></div>
          </div>
          <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-3) var(--space-4);display:flex;align-items:center;justify-content:space-between;border:1px solid ${criticas > 0 ? 'var(--color-danger)' : 'var(--border-default)'};box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="font-size:12px;color:${criticas > 0 ? 'var(--color-danger)' : 'var(--text-muted)'};font-weight:500;">Críticas</div>
            <div style="font-size:24px;font-weight:800;color:${criticas > 0 ? 'var(--color-danger)' : 'var(--text-primary)'}">${criticas}</div>
          </div>
        </div>

        <!-- Progress bar -->
        ${total > 0 ? `
        <div style="margin-bottom:var(--space-4);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:12px;font-weight:600;color:var(--text-muted);">Progresso de Hoje</span>
            <span style="font-size:12px;font-weight:800;color:var(--color-success);">${Math.round((concluidas/total)*100)}%</span>
          </div>
          <div style="height:4px;background:var(--border-default);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${(concluidas/total)*100}%;background:var(--color-success);border-radius:4px;"></div></div>
        </div>` : ''}

        <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:var(--space-2);">Em Andamento</div>
        
        <!-- Active tasks list -->
        ${emAndamento > 0 ? `
        <div style="display:flex;flex-direction:column;gap:var(--space-2);max-height:220px;overflow-y:auto;padding-right:4px;">
          ${tasks.filter(t => t.status === 'Em Andamento').map(t => {
            const perc = t.percentual || 0;
            return `
              <div style="padding:var(--space-3);background:var(--bg-card);border-radius:8px;border:1px solid var(--border-default);cursor:default;transition:all 0.2s ease;" onmouseover="this.style.borderColor='var(--brand-primary-light)';this.style.backgroundColor='var(--bg-card-hover)';" onmouseout="this.style.borderColor='var(--border-default)';this.style.backgroundColor='var(--bg-card)';">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <div style="display:flex;align-items:center;gap:8px;overflow:hidden;">
                    <div style="width:8px;height:8px;border-radius:50%;background:var(--color-${t.critico ? 'danger' : 'info'});flex-shrink:0;"></div>
                    <span style="font-weight:600;color:var(--text-primary);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.descricao}</span>
                  </div>
                  <span style="font-size:12px;font-weight:800;color:var(--text-primary);">${perc}%</span>
                </div>
                <div style="font-size:12px;color:var(--text-muted);display:flex;justify-content:space-between;align-items:center;padding-left:16px;">
                  <span>${equipMap[t.equipmentId]?.codigo || ''} · ${t.disciplina}</span>
                  <span style="color:var(--text-secondary)">${t.responsavel || 'Não atr.'}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>` : `<div style="text-align:center;color:var(--text-muted);font-size:12px;padding:var(--space-4) 0;background:var(--bg-card);border:1px solid var(--border-default);border-radius:12px;">Nenhuma atividade em andamento</div>`}

        <div style="flex:1;"></div>

        ${criticas > 0 ? `<div style="margin-top:var(--space-3);padding:10px;background:var(--bg-card);border:1px solid var(--color-danger);color:var(--color-danger);font-size:12px;border-radius:8px;font-weight:600;display:flex;align-items:center;gap:8px;"><svg style="width:16px;height:16px;flex-shrink:0;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>${criticas} crítica${criticas>1?'s':''} pendente${criticas>1?'s':''} — Monitorar de perto</div>` : ''}
      </div>
    `;
  }

  function renderD1Section_Tomorrow(tasks) {
    const d1 = dateOf(1);
    const alerts = getTomorrowAlerts(tasks);
    const restrictions = DB.restrictions.getAll().filter(r => r.status === 'Aberta');
    const equipNames = {};
    DB.equipment.list().forEach(e => { equipNames[e.id] = e.codigo; });

    const partsOk = tasks.filter(t => {
      const taskParts = DB.parts.getAll().filter(p => p.equipmentId === t.equipmentId && ['Solicitada','Comprada','Em Transporte'].includes(p.status));
      return taskParts.length === 0;
    }).length;
    const partsNotOk = tasks.length - partsOk;
    const restricted = tasks.filter(t => restrictions.some(r => r.equipmentId === t.equipmentId)).length;
    const criticas = tasks.filter(t=>window.CriticalPath && window.CriticalPath.isTaskCritical ? window.CriticalPath.isTaskCritical(t) : t.critico).length;

    return `
      <div class="card" style="height:100%; display:flex; flex-direction:column; border-radius:12px; box-shadow:0 2px 4px rgba(0,0,0,0.02); background:var(--bg-base); font-family:'Inter', sans-serif; padding:var(--space-4);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);padding-bottom:var(--space-3);border-bottom:1px solid var(--border-default);">
          <div>
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:4px;">
              <div style="width:8px;height:8px;border-radius:50%;background:var(--color-purple);"></div>
              <div style="font-size:16px;font-weight:700;color:var(--text-muted)">D+1 · Amanhã</div>
            </div>
            <div style="font-size:30px;font-weight:800;color:var(--text-primary);letter-spacing:-1px;">${formatDate(d1)}</div>
          </div>
        </div>

        <!-- Validation summary -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-2);margin-bottom:var(--space-4);">
          <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-4);text-align:center;border:1px solid var(--border-default);box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;color:var(--text-muted);margin-bottom:4px;"><svg style="width:14px;height:14px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg></div>
            <div style="font-size:36px;font-weight:800;color:var(--text-primary);line-height:1;">${tasks.length}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-weight:500;">Programadas</div>
          </div>
          <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-4);text-align:center;border:1px solid ${partsNotOk > 0 ? 'var(--color-danger)' : 'var(--border-default)'};box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;color:${partsNotOk > 0 ? 'var(--color-danger)' : 'var(--color-success)'};margin-bottom:4px;"><svg style="width:14px;height:14px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014-8.81c-2.288-1.093-4.81-1.685-7.465-1.685H7.5A4.5 4.5 0 003 7.5v9a4.5 4.5 0 004.5 4.5h3.08a23.87 23.87 0 007.465-1.685"/></svg></div>
            <div style="font-size:36px;font-weight:800;color:${partsNotOk > 0 ? 'var(--color-danger)' : 'var(--color-success)'};line-height:1;">${partsOk}<span style="color:var(--text-muted);font-weight:500;font-size:16px;">/${tasks.length}</span></div>
            <div style="font-size:12px;color:${partsNotOk > 0 ? 'var(--color-danger)' : 'var(--text-muted)'};margin-top:6px;font-weight:500;">Peças OK</div>
          </div>
          <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-4);text-align:center;border:1px solid ${restricted > 0 ? 'var(--color-warning)' : 'var(--border-default)'};box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;color:${restricted > 0 ? 'var(--color-warning)' : 'var(--color-success)'};margin-bottom:4px;"><svg style="width:14px;height:14px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
            <div style="font-size:36px;font-weight:800;color:${restricted > 0 ? 'var(--color-warning)' : 'var(--color-success)'};line-height:1;">${restricted}</div>
            <div style="font-size:12px;color:${restricted > 0 ? 'var(--color-warning)' : 'var(--text-muted)'};margin-top:6px;font-weight:500;">Restrições</div>
          </div>
          <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-4);text-align:center;border:1px solid var(--border-default);box-shadow:0 1px 2px rgba(0,0,0,0.02);">
            <div style="display:flex;align-items:center;justify-content:center;gap:4px;color:var(--color-info);margin-bottom:4px;"><svg style="width:14px;height:14px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
            <div style="font-size:36px;font-weight:800;color:var(--color-info);line-height:1;">${criticas}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-weight:500;">Críticas</div>
          </div>
        </div>

        <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:var(--space-2);">Programação</div>

        <!-- Task list -->
        ${tasks.length > 0 ? `
        <div style="display:flex;flex-direction:column;gap:var(--space-2);max-height:180px;overflow-y:auto;padding-right:4px;">
          ${tasks.map(t => {
            const hasIssue = DB.parts.getAll().some(p => p.equipmentId === t.equipmentId && ['Solicitada','Comprada','Em Transporte'].includes(p.status));
            return `
              <div style="padding:var(--space-3);background:var(--bg-card);border-radius:8px;border:1px solid var(--border-default);cursor:default;transition:all 0.2s ease;" onmouseover="this.style.borderColor='var(--brand-primary-light)';this.style.backgroundColor='var(--bg-card-hover)';" onmouseout="this.style.borderColor='var(--border-default)';this.style.backgroundColor='var(--bg-card)';">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <div style="width:8px;height:8px;border-radius:50%;background:${hasIssue ? 'var(--color-danger)' : 'var(--color-success)'};flex-shrink:0;"></div>
                  <div style="font-size:14px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.descricao}</div>
                </div>
                <div style="font-size:12px;color:var(--text-muted);padding-left:16px;">
                  ${equipNames[t.equipmentId] || ''} · ${t.disciplina}
                </div>
              </div>`;
          }).join('')}
        </div>` : `<div style="text-align:center;color:var(--text-muted);font-size:12px;padding:var(--space-4) 0;background:var(--bg-card);border:1px solid var(--border-default);border-radius:12px;">Nenhuma programada</div>`}

        <div style="flex:1;"></div>

        <!-- Alerts -->
        <div style="margin-top:var(--space-4);">
          ${alerts.length > 0 ? `
          <div style="display:flex;flex-direction:column;gap:var(--space-2);">
            ${alerts.map(a => `
              <div style="display:flex;gap:12px;padding:12px;background:var(--bg-card);border-radius:8px;border:1px solid var(--border-default);border-left:3px solid ${a.type === 'danger' ? 'var(--color-danger)' : 'var(--color-warning)'};">
                <span style="font-size:16px;display:flex;align-items:center;">${a.type === 'danger' ? '🔴' : '🟡'}</span>
                <div>
                  <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:2px;">Atenção</div>
                  <div style="font-size:12px;color:var(--text-secondary);line-height:1.4;">${a.msg}</div>
                </div>
              </div>
            `).join('')}
          </div>` : `<div style="display:flex;align-items:center;gap:8px;padding:var(--space-3);background:var(--bg-card);border:1px solid var(--border-default);border-radius:12px;color:var(--color-success);font-size:12px;font-weight:600;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Sem restrições para amanhã</div>`}
        </div>

      </div>
    `
  }

  function renderTVPresentation() {
    setTimeout(() => {
      if (window.MeetingMode) window.MeetingMode.activate();
      window.location.hash = '#d-panel';
    }, 50);
    return `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;">
        <div style="font-size:2rem;">📺</div>
        <div style="font-size:1.5rem;color:white;font-weight:800;">Iniciando Apresentação TV...</div>
      </div>
    `;
  }



  function renderIndicators() {
    const allTasks = DB.tasks.getAll();
    const t7 = [], t30 = [];
    for (let i = 7; i >= 0; i--) {
      const dt = dateOf(-i);
      const dayTasks = allTasks.filter(t => t.dataPlanejadaTermino === dt);
      t7.push({ date: dt, planned: dayTasks.length, done: dayTasks.filter(t => t.status === 'Concluída').length });
    }
    for (let i = 30; i >= 0; i--) {
      const dt = dateOf(-i);
      const dayTasks = allTasks.filter(t => t.dataPlanejadaTermino === dt);
      t30.push({ date: dt, planned: dayTasks.length, done: dayTasks.filter(t => t.status === 'Concluída').length });
    }
    const daily = t7[t7.length - 1];
    const dailyAdh = calcAdherence(daily.planned, daily.done);

    const weekly7planned = t7.reduce((s,d) => s + d.planned, 0);
    const weekly7done = t7.reduce((s,d) => s + d.done, 0);
    const weeklyAdh = calcAdherence(weekly7planned, weekly7done);

    const monthly30planned = t30.reduce((s,d) => s + d.planned, 0);
    const monthly30done = t30.reduce((s,d) => s + d.done, 0);
    const monthlyAdh = calcAdherence(monthly30planned, monthly30done);

    const openRestr = DB.restrictions.getAll().filter(r => r.status === 'Aberta').length;
    const allTs = DB.timesheets.list();
    const todayTs = allTs.filter(t => t.data === today() && (!t.tipo || t.tipo === 'Trabalho'));
    const hProd = todayTs.reduce((s,t) => s + (parseFloat(t.horasTrabalhadas) || 0), 0);

    return `
      <div class="card" style="margin-top:var(--space-4); border-radius:12px; background:var(--bg-base); border:1px solid var(--border-default); box-shadow:0 2px 4px rgba(0,0,0,0.02); font-family:'Inter', sans-serif;">
        <div class="card-header" style="border-bottom:1px solid var(--border-default); padding-bottom:var(--space-3); margin-bottom:var(--space-4);">
          <div class="card-title" style="font-size:16px; font-weight:700;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
            Indicadores Automáticos
          </div>
          <span style="font-size:12px;color:var(--text-muted)">Calculados em tempo real</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--space-3);">
          ${[
            { label: 'Aderência Diária', value: `${dailyAdh}%`, cls: semaphoreClass(dailyAdh), icon: '📅' },
            { label: 'Aderência Semanal (7d)', value: `${weeklyAdh}%`, cls: semaphoreClass(weeklyAdh), icon: '📊' },
            { label: 'Aderência Mensal (30d)', value: `${monthlyAdh}%`, cls: semaphoreClass(monthlyAdh), icon: '📈' },
            { label: 'Índice de Restrições', value: openRestr, cls: openRestr > 5 ? 'danger' : openRestr > 2 ? 'warning' : 'success', icon: '🚧' },
            { label: 'Horas Produtivas Hoje', value: `${hProd.toFixed(0)}h`, cls: 'info', icon: '⏱️' },
            { label: 'Tarefas Críticas Abertas', value: DB.tasks.getAll().filter(t=>(window.CriticalPath && window.CriticalPath.isTaskCritical ? window.CriticalPath.isTaskCritical(t) : t.critico)&&t.status!=='Concluída').length, cls: 'danger', icon: '⚠️' },
          ].map(item => `
            <div style="background:var(--bg-card);border-radius:12px;padding:var(--space-4);border:1px solid var(--border-default);box-shadow:0 1px 2px rgba(0,0,0,0.02);display:flex;flex-direction:column;align-items:center;text-align:center;height:120px;justify-content:center;">
              <div style="display:flex;align-items:center;gap:6px;color:var(--color-${item.cls});margin-bottom:8px;">
                <span style="font-size:16px;">${item.icon}</span>
              </div>
              <div style="font-size:36px;font-weight:800;color:var(--color-${item.cls});line-height:1;">${item.value}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:8px;font-weight:500;">${item.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderAIAlerts() {
    const alerts = getAIAlerts();
    if (!alerts.length) return '';
    return `
      <div class="card" style="margin-top:var(--space-5);border:1px solid rgba(206,147,216,0.3);background:linear-gradient(135deg,rgba(206,147,216,0.05) 0%,transparent 100%);">
        <div class="card-header">
          <div class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="color:var(--color-purple)"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
            <span style="color:var(--color-purple)">Alertas Inteligentes — IA</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);">
          ${alerts.map((a, i) => `
            <div style="display:flex;gap:var(--space-3);padding:var(--space-3) var(--space-4);background:var(--bg-base);border-radius:var(--radius-md);border-left:3px solid var(--color-purple);">
              <span style="font-size:1.2rem;flex-shrink:0;">🤖</span>
              <div>
                <div style="font-size:var(--text-xs);font-weight:700;color:var(--color-purple);margin-bottom:2px;">Alerta ${i+1}</div>
                <div style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.5">${a}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderTop5Card() {
    const top = getTopPerformers();
    if (top.length === 0) {
      return `
        <div class="card" style="margin-top:var(--space-5);">
          <div class="card-header">
            <div class="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="color:var(--brand-primary)"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
              Top 5 Executantes
            </div>
            <span style="font-size:var(--text-xs);color:var(--text-muted)">Ranking do Mês (Tarefas Concluídas)</span>
          </div>
          <div style="padding: 30px 20px; text-align: center; color: var(--text-muted); font-size: 0.9rem; background: var(--bg-body); border-radius: 8px;">
            Nenhuma tarefa concluída neste mês ainda.
          </div>
        </div>
      `;
    }
    
    const emojis = ['🥇', '🥈', '🥉', '🏅', '🏅'];
    const colors = ['#eab308', '#94a3b8', '#b45309', '#64748b', '#64748b'];

    return `
      <div class="card" style="margin-top:var(--space-5);">
        <div class="card-header">
          <div class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="color:var(--brand-primary)"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
            Top 5 Executantes
          </div>
          <span style="font-size:var(--text-xs);color:var(--text-muted)">Ranking do Mês (Tarefas Concluídas)</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:var(--space-2);">
          ${top.map((t, idx) => `
            <div style="display:flex; align-items:center; gap:var(--space-3); background:var(--bg-base); border-radius:var(--radius-md); padding:var(--space-2) var(--space-4); border-left:3px solid ${colors[idx]};">
              <div style="font-size:1.5rem; line-height:1; width: 30px; text-align: center;">${emojis[idx]}</div>
              <div style="flex:1;">
                <div style="font-size:var(--text-sm); font-weight:700; color:var(--text-primary); margin-bottom:2px;">${t.nome}</div>
              </div>
              <div style="font-size:var(--text-xs); font-weight:600; color:var(--text-secondary); background:rgba(0,0,0,0.05); padding:2px 8px; border-radius:12px;">
                ${t.count} tarefas
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function render() {
    const isPresentation = (window.Router && window.Router.currentRoute === 'presentation') || window.location.hash === '#presentation';
    if (isPresentation) {
      const html = renderTVPresentation();
      
      // Clock logic for TV mode
      setTimeout(() => {
        const clockEl = document.getElementById('live-clock');
        if (clockEl) {
          const tick = () => { clockEl.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); };
          tick();
          if (!window._dpClockInterval) window._dpClockInterval = setInterval(tick, 1000);
        }
      }, 50);
      
      return html;
    }

    const d1Tasks = getTasksForDate(dateOf(-1));
    const dTasks  = getTasksForDate(today());
    const d1pTasks = getTasksForDate(dateOf(1));

    const html = `
      <div style="padding:var(--space-5);max-width:1600px;margin:0 auto;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:var(--space-6);">
          <div>
            <div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-2xl);font-weight:800;color:var(--text-primary);letter-spacing:-.02em;">
              <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:var(--brand-primary);display:flex;align-items:center;justify-content:center;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
              </div>
              ${isPresentation ? 'Apresentação (TV)' : 'Painel Operacional D-1 | D | D+1'}
            </div>
            <div class="section-subtitle">Acompanhamento diário da execução · Atualização automática a cada 60 segundos</div>
          </div>
          <div style="display:flex;gap:var(--space-3);align-items:center;">
            <select id="dpanel-eq-select" onchange="window.setGlobalEqFilter(this.value)" class="form-control" style="width:200px;height:32px;font-size:var(--text-xs);padding:0 var(--space-2);background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--radius-md);color:var(--text-primary);">
              <option value="">Todos Equipamentos</option>
              ${DB.equipment.list().filter(e => e.status !== 'Liberado').map(e => `<option value="${e.id}" ${window.GlobalEqFilter === e.id ? 'selected' : ''}>${e.codigo}</option>`).join('')}
            </select>
            <button class="btn btn-secondary btn-sm" onclick="DPanel.refresh()">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
              Atualizar
            </button>
            <button class="btn btn-primary btn-sm" onclick="MeetingMode.activate()">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5m-7.5-5.625c0-.621.504-1.125 1.125-1.125h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m0-5.625c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125"/></svg>
              Modo Reunião
            </button>
          </div>
        </div>

        <!-- Three columns -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-5);align-items:start;">
          ${renderD1Section(d1Tasks)}
          ${renderDSection(dTasks)}
          ${renderD1Section_Tomorrow(d1pTasks)}
        </div>

        <!-- Indicators -->
        ${renderIndicators()}

        <!-- Top 5 Performers -->
        ${renderTop5Card()}

        <!-- AI Alerts -->
        ${renderAIAlerts()}
      </div>

      <!-- Meeting mode overlay (rendered separately by MeetingMode module) -->
    `;

    // Start live clock after render
    setTimeout(() => {
      const clockEl = document.getElementById('live-clock');
      if (clockEl) {
        const tick = () => {
          const now = new Date();
          clockEl.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        };
        tick();
        if (!window._dpClockInterval) window._dpClockInterval = setInterval(tick, 1000);
      }
    }, 50);

    return html;
  }

  function refresh() {
    Router.navigate('d-panel', { force: true });
  }

  function destroy() {
    if (window._dpClockInterval) { clearInterval(window._dpClockInterval); window._dpClockInterval = null; }
    if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null; }
  }

  return { render, refresh, destroy };
})();
