window.animateQrProgress = function(id, target) {
  if (target === 0) return;
  setTimeout(() => {
    const bar = document.getElementById('anim-bar-' + id);
    const txt = document.getElementById('anim-txt-' + id);
    if (!bar || !txt) return;
    
    // Smooth CSS transition for width
    bar.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1), background-color 1.5s ease';
    
    let current = 0;
    const duration = 1500; // 1.5s matches CSS transition
    const interval = 20;
    const steps = duration / interval;
    const stepValue = target / steps;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      txt.innerText = Math.floor(current) + '%';
      
      let color = '#ef4444'; // Red
      if(current >= 90) color = '#10b981'; // Green
      else if(current >= 70) color = '#f97316'; // Orange
      else if(current >= 50) color = '#f59e0b'; // Yellow
      
      txt.style.color = color;
    }, interval);
    
    // Set final width and color immediately to trigger CSS transition
    setTimeout(() => {
      let finalColor = '#ef4444';
      if(target >= 90) finalColor = '#10b981';
      else if(target >= 70) finalColor = '#f97316';
      else if(target >= 50) finalColor = '#f59e0b';
      
      bar.style.width = target + '%';
      bar.style.backgroundColor = finalColor;
    }, 50);

  }, 150); // delay to ensure DOM is fully ready
};

window.QrViewModule = (() => {
  function render(params) {
    const id = typeof params === 'object' ? params.id : params;
    const eq = window.DB.equipment.get(id);
    if (!eq) return `<div style="text-align:center;padding:50px;color:#333;">Equipamento não encontrado.</div>`;

    const pct = eq.pctAvanco || 0;
    
    // Progress Color - Using Geosol Red for danger, Gray for neutral, Green for good
    const progressColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
    
    // Corporate Geosol Red
    const brandRed = '#dc2626';

    // Gather data
    const allTasks = window.DB.tasks.getAll().filter(t => t.equipmentId === id);
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysTasks = allTasks.filter(t => {
      if(t.status === 'Concluída') return false;
      if(t.dataPlanejadaInicio <= todayStr && t.dataPlanejadaTermino >= todayStr) return true;
      if(t.dataRealInicio && !t.dataRealTermino) return true;
      return false;
    });

    const workforce = [];
    todaysTasks.forEach(t => {
       if (t.responsavel) {
          if (!workforce.find(w => w.nome === t.responsavel)) {
             workforce.push({ nome: t.responsavel, disciplina: t.disciplina || 'Geral' });
          }
       }
    });

    const checklists = JSON.parse(localStorage.getItem('diman_checklists')||'[]').filter(c => c.equipmentId === id);
    const recebimento = checklists.find(c => c.tipo === 'Recebimento');
    const devolucao = checklists.find(c => c.tipo === 'Devolução');
    const restrictions = window.DB.restrictions.getAll().filter(r => r.equipmentId === id && r.status === 'Aberta');

    // Calculate KPIs
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'Concluída').length;
    const pendingTasks = totalTasks - completedTasks;
    const criticalTasks = allTasks.filter(t => t.critico).length;
    
    let totalHhEst = 0;
    let totalHhReal = 0;
    allTasks.forEach(t => {
      totalHhEst += Number(t.horasEstimadas) || 0;
      totalHhReal += Number(t.hh) || 0;
    });

    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .qr-layout-v4 { 
          min-height: 100vh; 
          background-color: #f1f5f9; 
          color: #0f172a; 
          padding: 40px 20px; 
          font-family: 'Inter', sans-serif; 
        }
        
        .qr-container-v4 { 
          max-width: 900px; 
          margin: 0 auto; 
          animation: fadeSlideUp 0.5s ease-out;
        }
        
        /* HEADER */
        .qr-header-v4 { 
          background: #ffffff;
          border-top: 6px solid ${brandRed};
          border-radius: 12px;
          padding: 30px;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .qr-header-titles { flex: 1; }
        .qr-eq-code { font-size: 3rem; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.1; letter-spacing: -1px; }
        .qr-eq-name { font-size: 1.25rem; color: #64748b; font-weight: 500; margin-top: 8px; }
        .qr-status-badge {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;
          background: #f8fafc; color: #334155; border: 1px solid #e2e8f0;
        }
        .qr-status-badge.status-liberado { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }
        .qr-status-badge.status-manutencao { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
        
        /* CARD BASE */
        .qr-card-v4 {
          background: #ffffff;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border: 1px solid #e2e8f0;
        }
        
        .qr-card-title {
          font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }
        .qr-card-title::before {
          content: ''; display: block; width: 4px; height: 16px; background: ${brandRed}; border-radius: 2px;
        }

        /* GRID INFO */
        .qr-info-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;
        }
        .info-label-v4 { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-value-v4 { font-size: 1.15rem; font-weight: 700; color: #0f172a; }

        /* PROGRESS BAR */
        .qr-progress-section { margin-top: 30px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
        .progress-header-v4 { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; }
        .progress-title-v4 { font-size: 0.85rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
        .progress-pct-v4 { font-size: 2.5rem; font-weight: 800; color: ${progressColor}; line-height: 1; }
        
        .progress-track-v4 { height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; }
        .progress-fill-v4 { height: 100%; background: ${progressColor}; border-radius: 6px; transition: width 1s ease-out; }

        /* LISTS */
        .exec-list { list-style: none; padding: 0; margin: 0; }
        .exec-list-item { 
          padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; 
          display: flex; justify-content: space-between; align-items: center;
        }
        .exec-list-item:last-child { margin-bottom: 0; }
        .task-name { font-weight: 600; color: #0f172a; font-size: 1rem; margin-bottom: 4px; }
        .task-meta { font-size: 0.85rem; color: #64748b; }
        .tag-critica { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }

        /* CHECKLISTS */
        .chk-grid-v4 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .chk-box-v4 { padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 12px; background: #f8fafc; }
        .chk-icon-v4 { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; }
        .chk-ok-v4 { background: #d1fae5; color: #059669; }
        .chk-pend-v4 { background: #f1f5f9; color: #94a3b8; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media(max-width: 600px) {
          .qr-header-v4 { flex-direction: column; gap: 16px; }
          .chk-grid-v4 { grid-template-columns: 1fr; }
          .qr-eq-code { font-size: 2.25rem; }
        }
      </style>

      <div class="qr-layout-v4">
        <div class="qr-container-v4">
          
          <div class="qr-header-v4">
            <div class="qr-header-titles">
              <div style="font-size: 0.75rem; font-weight: 700; color: ${brandRed}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Ficha de Equipamento</div>
              <h1 class="qr-eq-code">${eq.codigo}</h1>
              <div class="qr-eq-name">${eq.nome}</div>
            </div>
            <div class="qr-status-badge ${eq.status === 'Liberado' ? 'status-liberado' : (eq.status === 'Em Manutenção' ? 'status-manutencao' : '')}">
              ${eq.status}
            </div>
          </div>

          <div class="qr-card-v4">
            <div class="qr-info-grid">
              <div>
                <div class="info-label-v4">Cliente Final</div>
                <div class="info-value-v4">${eq.cliente || 'Não informado'}</div>
              </div>
              <div>
                <div class="info-label-v4">Modelo</div>
                <div class="info-value-v4">${eq.modelo || 'Não informado'}</div>
              </div>
              <div>
                <div class="info-label-v4">Ordem de Serviço (O.S.)</div>
                <div class="info-value-v4" style="font-family: monospace;">${eq.os || '—'}</div>
              </div>
            </div>

            <div class="qr-info-grid" style="margin-top: 24px; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 16px;">
              <div>
                <div class="info-label-v4">Chegada na Oficina</div>
                <div class="info-value-v4" style="color: #475569;">${eq.dataEntrada ? formatDate(eq.dataEntrada) : '—'}</div>
              </div>
              <div>
                <div class="info-label-v4">Liberação Planejada</div>
                <div class="info-value-v4" style="color: #475569;">${eq.dataLiberacaoPlanejada ? formatDate(eq.dataLiberacaoPlanejada) : '—'}</div>
              </div>
              <div>
                <div class="info-label-v4">Previsão Atual</div>
                <div class="info-value-v4" style="color: ${brandRed};">${eq.dataLiberacaoAtual ? formatDate(eq.dataLiberacaoAtual) : (eq.dataLiberacaoPlanejada ? formatDate(eq.dataLiberacaoPlanejada) : '—')}</div>
              </div>
              <div>
                <div class="info-label-v4">Equipe Alocada (Hoje)</div>
                <div class="info-value-v4" style="color: #0f172a; font-size: 0.9rem; margin-top: 2px;">
                  ${workforce.length > 0 ? workforce.map(w => `<span style="display:inline-block; background:#e2e8f0; padding:2px 8px; border-radius:4px; margin:0 4px 4px 0;">${w.nome}</span>`).join('') : '<span style="color:#94a3b8;font-style:italic;">Nenhum executante no momento</span>'}
                </div>
              </div>
            </div>

            <div class="qr-progress-section">
              <div class="progress-header-v4">
                <div class="progress-title-v4">Avanço Físico Geral</div>
                <div class="progress-pct-v4" id="anim-txt-${id}">0%</div>
              </div>
              <style>
                @keyframes progress-stripes-v4 {
                  from { background-position: 1rem 0; }
                  to { background-position: 0 0; }
                }
              </style>
              <div class="progress-track-v4">
                <div class="progress-fill-v4" id="anim-bar-${id}" style="width: 0%; background-color: #ef4444; background-image: linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent); background-size: 1rem 1rem; animation: progress-stripes-v4 1s linear infinite;"></div>
              </div>
              <img src="x" onerror="if(window.animateQrProgress) window.animateQrProgress('${id}', ${pct}); this.remove();" style="display:none;">
            </div>
          </div>

          <!-- NOVO: Indicadores de Desempenho (Diretoria) -->
          <div class="qr-card-v4" style="background: #f8fafc;">
            <div class="qr-card-title">Indicadores de Manutenção (KPIs)</div>
            <div class="qr-info-grid" style="grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));">
              <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <div class="info-label-v4" style="margin-bottom: 8px;">Total de Tarefas</div>
                <div style="font-size: 1.8rem; font-weight: 800; color: #0f172a; line-height: 1;">${totalTasks}</div>
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Atividades Programadas</div>
              </div>
              <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; border-bottom: 4px solid #f59e0b;">
                <div class="info-label-v4" style="margin-bottom: 8px;">Pendentes</div>
                <div style="font-size: 1.8rem; font-weight: 800; color: #f59e0b; line-height: 1;">${pendingTasks}</div>
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Aguardando Execução</div>
              </div>
              <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; border-bottom: 4px solid #10b981;">
                <div class="info-label-v4" style="margin-bottom: 8px;">Executadas</div>
                <div style="font-size: 1.8rem; font-weight: 800; color: #10b981; line-height: 1;">${completedTasks}</div>
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Tarefas Concluídas</div>
              </div>
            </div>
          </div>

          <div class="qr-card-v4">
            <div class="qr-card-title">Inspeções e Checklists</div>
            <div class="chk-grid-v4">
              <div class="chk-box-v4">
                <div class="chk-icon-v4 ${devolucao?.status === 'Concluído' ? 'chk-ok-v4' : 'chk-pend-v4'}">
                  ${devolucao?.status === 'Concluído' ? '✓' : '-'}
                </div>
                <div>
                  <div style="font-weight: 700; color: #0f172a;">Devolução</div>
                  <div style="font-size: 0.85rem; color: #64748b;">${devolucao ? devolucao.status : 'Pendente'}</div>
                </div>
              </div>
              <div class="chk-box-v4">
                <div class="chk-icon-v4 ${recebimento?.status === 'Concluído' ? 'chk-ok-v4' : 'chk-pend-v4'}">
                  ${recebimento?.status === 'Concluído' ? '✓' : '-'}
                </div>
                <div>
                  <div style="font-weight: 700; color: #0f172a;">Recebimento</div>
                  <div style="font-size: 0.85rem; color: #64748b;">${recebimento ? recebimento.status : 'Pendente'}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="qr-card-v4">
            <div class="qr-card-title">Tarefas em Execução Hoje (${todaysTasks.length})</div>
            ${todaysTasks.length > 0 ? `
              <ul class="exec-list">
                ${todaysTasks.map(t => `
                  <li class="exec-list-item" style="${t.critico ? 'border-left: 4px solid ' + brandRed : ''}">
                    <div>
                      <div class="task-name">${t.descricao}</div>
                      <div class="task-meta">Resp: <strong>${t.responsavel || 'N/A'}</strong> &bull; Setor: ${t.disciplina || 'Geral'}</div>
                    </div>
                    ${t.critico ? `<div class="tag-critica">Crítica</div>` : ''}
                  </li>
                `).join('')}
              </ul>
            ` : `<div style="text-align:center; padding: 20px; color: #94a3b8; font-size: 0.9rem;">Nenhuma atividade programada para a data de hoje.</div>`}
          </div>

          ${restrictions.length > 0 ? `
            <div class="qr-card-v4" style="border: 1px solid #fecaca; background: #fff1f2;">
              <div class="qr-card-title" style="color: ${brandRed};">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Restrições Ativas (${restrictions.length})
              </div>
              <ul class="exec-list">
                ${restrictions.map(r => `
                  <li class="exec-list-item" style="background: white; border-color: #fecaca;">
                    <div>
                      <div class="task-name">${r.tipo}</div>
                      <div class="task-meta">${r.descricao}</div>
                    </div>
                    <div style="font-size: 0.75rem; color: #64748b;">${formatDate(r.dataIdentificacao)}</div>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div style="text-align: center; color: #94a3b8; font-size: 0.75rem; margin-top: 20px;">
            DIMAN-BHZ • Relatório de Situação de Equipamento
          </div>

        </div>
      </div>
    `;
  }
  return { render };
})();
