window.HomeModule = (() => {
  const BUCKETS = [
    { id: 'sondas-pesquisas', name: 'Sondas de Pesquisas', color: 'var(--brand-primary)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><rect x="4" y="16" width="14" height="4" rx="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="18" r="1" /><circle cx="11" cy="18" r="1" /><circle cx="15" cy="18" r="1" /><path stroke-linecap="round" stroke-linejoin="round" d="M5 16v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v4" /><path stroke-linecap="round" stroke-linejoin="round" d="M13 16V3l4 1v12M13 6h4M13 10h4M13 14h4" /></svg>` },
    { id: 'bomba-pesquisa', name: 'Bomba de pesquisa', color: 'var(--color-orange)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 11V6a2 2 0 0 0-2-2h-1M10 4h4" /><circle cx="8" cy="13" r="4" /><circle cx="8" cy="13" r="1.5" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 13h5v4h2M4 17h14" /></svg>` },
    { id: 'sondas-pocos', name: 'Sondas Poços', color: 'var(--color-success)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16h16v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v-3a2 2 0 0 1 2-2h3v5" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="16.5" cy="18" r="1.5" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 11L16.5 2.5l2 1L14 12" /><path stroke-linecap="round" stroke-linejoin="round" d="M11 11v5" /></svg>` },
    { id: 'bombas-pocos', name: 'Bombas de poços', color: 'var(--brand-primary-light)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 11V6a2 2 0 0 0-2-2h-1M10 4h4" /><circle cx="8" cy="13" r="4" /><circle cx="8" cy="13" r="1.5" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 13h5v4h2M4 17h14" /></svg>` },
    { id: 'subconjuntos', name: 'Subconjuntos', color: 'var(--color-purple)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>` },
    { id: 'prog-almoxarifado', name: 'Programação de almox.', color: 'var(--color-info)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 17V8h4v9M8 12h5l2 2v3h1v-1h3" /><circle cx="6" cy="17" r="2" /><circle cx="14" cy="17" r="2" /><path stroke-linecap="round" stroke-linejoin="round" d="M19 16v2h3" /></svg>` },
    { id: 'aguardando-manutencao', name: 'Aguardando Manut.', color: 'var(--color-danger)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>` },
    { id: 'outros', name: 'Outros Equipamentos', color: 'var(--text-muted)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>` }
  ];

  function getBucketId(eq) {
    if (eq.status === 'Aguardando Manutenção' || eq.status === 'Backlog') return 'aguardando-manutencao';
    const tipo = eq.tipo || '';
    if (!tipo) return 'outros';
    const t = tipo.trim().toLowerCase();
    if (t.includes('sonda') && t.includes('pesquisa')) return 'sondas-pesquisas';
    if (t.includes('bomba') && t.includes('pesquisa')) return 'bomba-pesquisa';
    if (t.includes('sonda') && (t.includes('poço') || t.includes('poco') || t.includes('pocos') || t.includes('poços'))) return 'sondas-pocos';
    if (t.includes('bomba') && (t.includes('poço') || t.includes('poco') || t.includes('pocos') || t.includes('poços'))) return 'bombas-pocos';
    if (t.includes('subconjunto')) return 'subconjuntos';
    if (t.includes('almoxarifado') || t.includes('programação') || t.includes('programacao')) return 'prog-almoxarifado';
    return 'outros';
  }

  function render() {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const eqs = [...window.DB.equipment.list()].filter(e => {
      if (e.status === 'Liberado') return false; // always hide released
      return true; // show all active equipment regardless of date
    });
    // Sort equipment by estimated release date ascending (soonest to leave first)
    eqs.sort((a, b) => {
      const dateA = a.dataLiberacaoAtual || a.dataLiberacaoPlanejada || '9999-12-31';
      const dateB = b.dataLiberacaoAtual || b.dataLiberacaoPlanejada || '9999-12-31';
      return dateA.localeCompare(dateB);
    });

    const parts = window.DB.parts.getAll();
    const restrictions = window.DB.restrictions.getAll();
    const today = new Date().toISOString().slice(0,10);
    const session = window.Auth ? window.Auth.getSession() : null;
    const isAdmin = session && (session.perfil === 'Administrador' || session.perfil === 'Desenvolvedor');

    const emManutencao = eqs.filter(e => e.status !== 'Liberado').length;
    let atrasados = 0;
    eqs.forEach(e => {
      let currentPlan = e.dataLiberacaoPlanejada;
      if (e.replanning && e.replanning.length > 0) {
        currentPlan = e.replanning[e.replanning.length - 1].novaData;
      }
      if (e.status !== 'Liberado' && currentPlan) {
        const days = daysBetween(today, currentPlan);
        if (days < 0) atrasados++;
      }
    });
    
    // Liberações da semana (next 7 days)
    const libsThisWeek = eqs.filter(e => e.status !== 'Liberado' && e.dataLiberacaoAtual && daysBetween(today, e.dataLiberacaoAtual) >= 0 && daysBetween(today, e.dataLiberacaoAtual) <= 7).length;
    const restrAbertas = restrictions.filter(r => r.status === 'Aberta').length;
    const partsPendentes = parts.filter(p => ['Solicitada','Comprada','Em Transporte'].includes(p.status)).length;

    // Initialize buckets
    let bucketsData = {
      'sondas-pesquisas': [],
      'bomba-pesquisa': [],
      'sondas-pocos': [],
      'bombas-pocos': [],
      'subconjuntos': [],
      'prog-almoxarifado': [],
      'aguardando-manutencao': [],
      'outros': []
    };

    eqs.forEach(e => {
      const bucketId = getBucketId(e);
      const pct = e.pctAvanco || 0;
      const dtPlan = e.dataLiberacaoPlanejada || '';
      
      let ePlan = e.dataLiberacaoPlanejada;
      if (e.replanning && e.replanning.length > 0) {
        ePlan = e.replanning[e.replanning.length - 1].novaData;
      }

      const dtPrev = ePlan || dtPlan;
      let desvio = 0;
      if (dtPlan && dtPrev) {
        desvio = daysBetween(dtPlan, dtPrev);
      }
      
      const isManutencao = e.status !== 'Liberado' ? '1' : '0';
      const isAtrasado = (e.status !== 'Liberado' && ePlan && daysBetween(today, ePlan) < 0) ? '1' : '0';
      const isLib7 = (e.status !== 'Liberado' && e.dataLiberacaoAtual && daysBetween(today, e.dataLiberacaoAtual) >= 0 && daysBetween(today, e.dataLiberacaoAtual) <= 7) ? '1' : '0';
      const hasRestr = restrictions.some(r => r.equipmentId === e.id && r.status === 'Aberta') ? '1' : '0';
      const hasPecas = parts.some(p => p.equipmentId === e.id && ['Solicitada','Comprada','Em Transporte'].includes(p.status)) ? '1' : '0';
      
      const prioridade = e.prioridade || 'Normal';
      let prioColor = 'transparent';
      let prioDot = '';
      if (prioridade === 'Urgente') { prioColor = 'var(--color-danger)'; prioDot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--color-danger);box-shadow:0 0 0 3px rgba(239,68,68,0.2);"></span>`; }
      else if (prioridade === 'Alta') { prioColor = 'var(--color-orange)'; prioDot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--color-orange);box-shadow:0 0 0 3px rgba(249,115,22,0.2);"></span>`; }

      const iconClient = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:15px;height:15px;flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>`;
      const iconOS = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:15px;height:15px;flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>`;
      const iconDate = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:15px;height:15px;flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>`;
      const iconAlert = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
      const iconBox = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M21 16.811c0 .864-.471 1.623-1.211 2.02l-6.75 3.606a2.25 2.25 0 01-2.078 0l-6.75-3.606A2.25 2.25 0 013 16.811V7.189c0-.864.471-1.623 1.211-2.02l6.75-3.606a2.25 2.25 0 012.078 0l6.75 3.606a2.25 2.25 0 011.211 2.02v9.622z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 22.5V12M12 12l-9.5-5M12 12l9.5-5" /></svg>`;

      let desvioStr = '';
      if (dtPrev && e.status !== 'Liberado') {
        const d = daysBetween(today, dtPrev);
        if (d > 0) desvioStr = `<span style="color:var(--color-success);font-weight:700;display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--color-success);"></span>+${d} dias</span>`;
        else if (d === 0) desvioStr = `<span style="color:var(--color-warning);font-weight:700;display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--color-warning);"></span>Hoje</span>`;
        else desvioStr = `<span style="color:var(--color-danger);font-weight:700;display:flex;align-items:center;gap:4px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--color-danger);"></span>${d} dias</span>`;
      } else if (e.status === 'Liberado') {
        desvioStr = `<span style="color:var(--color-info);font-weight:700;">Finalizado</span>`;
      }

      let statusColor = 'var(--text-secondary)';
      let statusBg = 'var(--bg-base)';
      let statusIcon = '';
      if (e.status === 'Em Manutenção') { statusColor = '#047857'; statusBg = 'rgba(16, 185, 129, 0.1)'; statusIcon = '🟢'; }
      else if (e.status === 'Falta de Peças') { statusColor = '#b45309'; statusBg = 'rgba(245, 158, 11, 0.1)'; statusIcon = '🟡'; }
      else if (e.status === 'Atrasado' || e.status === 'Paralisado' || e.status === 'Falta de Mão de Obra') { statusColor = '#be123c'; statusBg = 'rgba(225, 29, 72, 0.1)'; statusIcon = '🔴'; }
      else if (e.status === 'Liberado') { statusColor = '#1d4ed8'; statusBg = 'rgba(59, 130, 246, 0.1)'; statusIcon = '🔵'; }
      else { statusIcon = '⚪'; }
      
      const badgeStyle = `background:${statusBg};color:${statusColor};border:1px solid rgba(0,0,0,0.03);border-radius:9999px;padding:4px 10px;font-size:12px;font-weight:700;letter-spacing:0.02em;display:inline-flex;align-items:center;gap:4px;`;

      const cardHtml = `
      <div class="premium-kanban-card home-eq-card" 
           draggable="true"
           ondragstart="window.HomeModule.drag(event, '${e.id}')"
           ondragend="window.HomeModule.dragEnd(event)"
           data-search="${(e.codigo||'').toLowerCase()} ${(e.nome||'').toLowerCase()}" 
           data-manutencao="${isManutencao}" 
           data-atrasado="${isAtrasado}" 
           data-lib7="${isLib7}" 
           data-restr="${hasRestr}" 
           data-pecas="${hasPecas}" 
           onclick="window.Router.navigate('equipment-panel', {id: '${e.id}'})">
        <div class="card-prio-bar" style="background:${prioColor}"></div>
        
        <div class="card-inner">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <div style="flex: 1;">
              <div style="display:flex; align-items:center; gap:8px;">
                <h4 style="font-size:20px; font-weight:800; color:var(--text-primary); margin:0; letter-spacing:-0.02em;">${e.codigo}</h4>
                ${prioDot}
              </div>
              <div style="display:flex; align-items:center; flex-wrap:wrap; gap:12px; margin-top:6px; color:var(--text-secondary); font-size:12px; font-weight:500;">
                <span style="display:flex;align-items:center;gap:4px;">${iconClient} <strong style="color:var(--text-primary);">${e.cliente || '—'}</strong></span>
                <span style="display:flex;align-items:center;gap:4px;color:var(--text-muted);">${iconOS} ${e.os || '—'}</span>
              </div>
            </div>
            
              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                <div style="display:flex; gap:6px; color:var(--color-danger);">
                  ${hasPecas === '1' ? `<span title="Aguardando Peças">${iconBox}</span>` : ''}
                  ${hasRestr === '1' || isAtrasado === '1' ? `<span title="${isAtrasado==='1'?'Atrasado':'Restrição Aberta'}">${iconAlert}</span>` : ''}
                </div>
                ${isAdmin ? `
                  <div style="display:flex; gap: 4px;">
                    <button class="btn-premium-edit" 
                            style="background:rgba(16,185,129,0.1); color:#10B981; border:1px solid rgba(16,185,129,0.2);"
                            title="Liberar Equipamento (Remover do Painel)"
                            onclick="event.stopPropagation(); if(confirm('Deseja liberar este equipamento? Ele sairá deste painel.')) window.HomeModule.updateEquipmentStatus('${e.id}', 'Liberado')">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </button>
                    <button class="btn-premium-edit" 
                            title="Editar Equipamento"
                            onclick="event.stopPropagation(); window.EquipmentModule.openEdit('${e.id}')">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 20.04a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                  </div>
                ` : ''}
              </div>
          </div>
          
          <div style="margin-top:12px;">
            <span style="${badgeStyle}">${statusIcon} ${e.status}</span>
          </div>
          
          <div class="premium-progress-container">
            <div class="premium-progress-header">
              <span class="premium-progress-label">Progresso</span>
              <span class="premium-progress-value">${pct}%</span>
            </div>
            <div class="premium-progress-track">
              <div class="premium-progress-fill" style="width:0%; --target-width:${pct}%;" data-pct="${pct}"></div>
            </div>
          </div>
          
          <div class="premium-footer">
            <div style="display:flex;align-items:center;gap:6px;">
              ${iconDate} Prev. ${dtPrev ? formatDate(dtPrev).substring(0,5) : '—'}
            </div>
            <div>
              ${desvioStr}
            </div>
          </div>
        </div>
      </div>
      `;
      bucketsData[bucketId].push(cardHtml);
    });

    const boardHtml = BUCKETS.map(b => {
      const cardsHtml = bucketsData[b.id].join('');
      
      const eqIdsInBucket = eqs.filter(e => getBucketId(e) === b.id).map(e => e.id);
      let sumPct = 0;
      let delayedCount = 0;
      let criticalCount = 0;
      
      eqIdsInBucket.forEach(id => {
         const eq = eqs.find(e => e.id === id);
         sumPct += eq.pctAvanco || 0;
         let dtPlan = eq.dataLiberacaoPlanejada;
         if (eq.replanning && eq.replanning.length > 0) {
           dtPlan = eq.replanning[eq.replanning.length - 1].novaData;
         }
         if (eq.status !== 'Liberado' && dtPlan && daysBetween(today, dtPlan) < 0) {
            delayedCount++;
         }
         const prioridade = eq.prioridade || 'Normal';
         if (prioridade === 'Urgente' || prioridade === 'Alta') {
            criticalCount++;
         }
      });
      
      const avgPct = eqIdsInBucket.length > 0 ? Math.round(sumPct / eqIdsInBucket.length) : 0;

      return `
        <div class="premium-column planner-column" data-bucket="${b.id}" 
             ondragover="window.HomeModule.allowDrop(event)"
             ondragenter="window.HomeModule.dragEnter(event)"
             ondragleave="window.HomeModule.dragLeave(event)"
             ondrop="window.HomeModule.drop(event, '${b.id}')">
          
          <div class="premium-column-header">
            <div class="pch-top">
              <div class="pch-title-group">
                <span class="pch-icon" style="color:${b.color};">${b.icon || ''}</span>
                <h3 class="pch-title">${b.name}</h3>
              </div>
              <span class="pch-count">${eqIdsInBucket.length} Equipamento${eqIdsInBucket.length!==1?'s':''}</span>
            </div>
            
            <div class="pch-stats">
              <span class="pch-stat-item">Avanço Médio: <strong style="color:var(--text-primary);font-size:12px;margin-left:4px;">${avgPct}%</strong></span>
              ${criticalCount > 0 ? `<span class="pch-stat-alert"><span style="color:var(--color-danger)">🔴</span> ${criticalCount} crítico${criticalCount>1?'s':''}</span>` : ''}
              ${delayedCount > 0 ? `<span class="pch-stat-alert"><span style="color:var(--color-warning)">🟡</span> ${delayedCount} atraso${delayedCount>1?'s':''}</span>` : ''}
            </div>
            
            <div class="pch-progress-track">
              <div class="pch-progress-fill" style="width:0%; --target-width:${avgPct}%; background:${b.color};" data-pct="${avgPct}"></div>
            </div>
          </div>
          
          <div class="premium-cards-container planner-cards-container">
            <div class="premium-empty-state no-cards-placeholder" style="${eqIdsInBucket.length===0?'display:flex;':'display:none;'}">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
               <span>Nenhum equipamento neste setor</span>
            </div>
            ${cardsHtml}
          </div>
        </div>
      `;
    }).join('');

    // Wait a tick to re-apply filter if needed
    setTimeout(() => {
      if (activeCategory) {
        filterByCategory(activeCategory, true);
      } else {
        updateColumnCounts();
      }
      // Animate progress bars
      document.querySelectorAll('.premium-progress-fill, .pch-progress-fill').forEach(el => {
        setTimeout(() => {
          el.style.width = el.getAttribute('data-pct') + '%';
        }, 100);
      });
    }, 50);

    return `
      <style>
        .planner-board::-webkit-scrollbar { height: 12px; }
        .planner-board::-webkit-scrollbar-track { background: transparent; }
        .planner-board::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; border: 3px solid var(--bg-base); }
        .planner-board::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .premium-column {
           flex: 0 0 320px; width: 320px; display: flex; flex-direction: column; 
           background: transparent; border: none; padding: 0; max-height: calc(100vh - 220px);
           transition: all 0.2s;
        }
        
        .premium-column-header {
           background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px);
           position: sticky; top: 0; z-index: 10;
           padding: 16px 16px 14px 16px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06);
           box-shadow: 0 4px 15px rgba(15,23,42,0.03); margin-bottom: 16px;
        }
        
        .pch-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .pch-title-group { display: flex; align-items: center; gap: 8px; }
        .pch-icon { display: flex; align-items: center; }
        .pch-icon svg { width: 18px; height: 18px; }
        .pch-title { font-size: 14px; font-weight: 800; color: var(--text-primary); margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
        .pch-count { font-size: 12px; font-weight: 700; color: var(--text-secondary); background: var(--bg-base); padding: 2px 8px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.05); }
        
        .pch-stats { display: flex; gap: 12px; font-size: 12px; color: var(--text-secondary); margin-bottom: 14px; align-items: center; }
        .pch-stat-item { display: flex; align-items: center; gap: 4px; }
        .pch-stat-alert { display: flex; align-items: center; gap: 4px; font-weight: 600; }
        
        .pch-progress-track { width: 100%; height: 4px; background: rgba(0,0,0,0.05); border-radius: 4px; overflow: hidden; }
        .pch-progress-fill { height: 100%; border-radius: 4px; transition: width 1s cubic-bezier(0.25, 1, 0.5, 1); }
        
        .premium-cards-container { 
           display: flex; flex-direction: column; gap: 12px; overflow-y: auto; flex: 1; 
           padding: 4px 8px 24px 8px; min-height: 100px; scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent;
        }
        .premium-cards-container::-webkit-scrollbar { width: 6px; }
        .premium-cards-container::-webkit-scrollbar-track { background: transparent; }
        .premium-cards-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        
        .premium-kanban-card {
           position: relative; background: #fff; border-radius: 12px; 
           border: 1px solid rgba(0,0,0,0.04);
           box-shadow: 0 4px 12px rgba(15,23,42,0.03);
           display: flex; flex-direction: row; overflow: hidden;
           transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
           cursor: pointer; flex-shrink: 0; min-height: fit-content;
        }
        
        .premium-kanban-card:hover {
           transform: translateY(-4px);
           box-shadow: 0 16px 40px rgba(15,23,42,0.08);
           border-color: rgba(59,130,246,0.2);
        }
        
        .card-prio-bar { width: 8px; flex-shrink: 0; background: transparent; }
        
        .card-inner { flex: 1; padding: 16px 16px; display: flex; flex-direction: column; }
        
        .btn-premium-edit {
           background: transparent; border: none; color: var(--text-muted); width: 28px; height: 28px;
           display: flex; align-items: center; justify-content: center; border-radius: 8px; cursor: pointer;
           opacity: 0; transition: all 0.2s;
        }
        .premium-kanban-card:hover .btn-premium-edit { opacity: 1; background: var(--bg-base); border: 1px solid rgba(0,0,0,0.05); }
        .btn-premium-edit:hover { background: rgba(59,130,246,0.1) !important; color: var(--brand-primary) !important; border-color: rgba(59,130,246,0.2) !important; }
        .btn-premium-edit svg { width: 16px; height: 16px; }
        
        .premium-progress-container { margin-top: 16px; margin-bottom: 14px; }
        .premium-progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .premium-progress-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;}
        .premium-progress-value { font-size: 13px; font-weight: 800; color: var(--text-primary); }
        .premium-progress-track { height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden; position: relative; }
        .premium-progress-fill { 
           height: 100%; border-radius: 99px; 
           background: linear-gradient(90deg, var(--brand-primary-light) 0%, var(--brand-primary) 100%);
           transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
           position: relative;
        }
        .premium-progress-fill::after {
           content: ''; position: absolute; top: 0; left: 0; bottom: 0; right: 0;
           background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
           transform: translateX(-100%);
           animation: shimmer 2.5s infinite;
        }
        
        .premium-kanban-card:hover .premium-progress-fill {
           box-shadow: 0 0 12px rgba(59,130,246,0.4);
        }
        
        .premium-footer {
           display: flex; justify-content: space-between; align-items: center;
           padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.04);
           font-size: 12px; color: var(--text-secondary); font-weight: 500;
        }
        
        .premium-empty-state {
           display: flex; flex-direction: column; align-items: center; justify-content: center;
           padding: 40px 20px; color: var(--text-muted); font-size: 14px; font-weight: 500;
           text-align: center; gap: 16px; background: rgba(0,0,0,0.015); border: 2px dashed rgba(0,0,0,0.06);
           border-radius: 20px; height: 180px;
        }
        .premium-empty-state svg { width: 36px; height: 36px; color: #cbd5e1; }
        
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        
        .skeleton-card {
           background: #fff; border-radius: 20px; border: 1px solid rgba(0,0,0,0.04);
           height: 250px; display: flex; flex-direction: column; padding: 28px 24px;
           gap: 20px; position: relative; overflow: hidden;
        }
        .skeleton-card::after {
           content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0;
           transform: translateX(-100%);
           background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%);
           animation: shimmer 1.5s infinite;
        }
        .skel-line { background: #f1f5f9; border-radius: 4px; height: 20px; }

        /* --- Dark Mode Enhancements --- */
        [data-theme="dark"] .premium-column-header {
           background: rgba(13, 27, 42, 0.95);
           border-color: rgba(255, 255, 255, 0.05);
           box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }
        [data-theme="dark"] .pch-progress-track { background: rgba(255, 255, 255, 0.05); }
        [data-theme="dark"] .pch-count { background: var(--bg-card); border-color: rgba(255, 255, 255, 0.05); }
        
        [data-theme="dark"] .premium-kanban-card, 
        [data-theme="dark"] .skeleton-card {
           background: var(--bg-card);
           border-color: rgba(255, 255, 255, 0.05);
           box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        }
        [data-theme="dark"] .premium-kanban-card:hover {
           border-color: rgba(59,130,246,0.3);
           box-shadow: 0 16px 40px rgba(0,0,0,0.4);
        }
        [data-theme="dark"] .premium-progress-track { background: rgba(255, 255, 255, 0.05); }
        [data-theme="dark"] .btn-premium-edit { color: var(--text-secondary); }
        [data-theme="dark"] .premium-kanban-card:hover .btn-premium-edit { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.05); }
        [data-theme="dark"] .premium-footer { border-color: rgba(255, 255, 255, 0.05); }
        
        [data-theme="dark"] .premium-empty-state {
           background: rgba(255,255,255,0.02);
           border-color: rgba(255,255,255,0.05);
        }
        [data-theme="dark"] .skel-line { background: rgba(255, 255, 255, 0.05); }
        [data-theme="dark"] .skeleton-card::after {
           background: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0) 100%);
        }
        
        [data-theme="dark"] #home-search optgroup,
        [data-theme="dark"] #home-search option {
           background: var(--bg-card);
           color: var(--text-primary);
        }

        .planner-column.drag-over {
          border: 1px dashed var(--brand-primary) !important;
          background: rgba(255, 255, 255, 0.05) !important;
          transform: scale(1.01);
        }
        .home-eq-card.dragging {
          opacity: 0.4;
        }
      </style>

      <div style="max-width:100%; padding:var(--space-4); padding-bottom:0; display:flex; flex-direction:column; height: calc(100vh - var(--topbar-height)); overflow:hidden;">
        <!-- Top Indicators -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">
          <div id="summary-card-manutencao" class="card home-summary-card" style="padding:12px;text-align:center;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="window.HomeModule.filterByCategory('manutencao')" title="Clique para filtrar">
            <div style="font-size:24px;font-weight:800;color:var(--brand-primary-light);">${emManutencao}</div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-top:2px;">Em Manutenção</div>
          </div>
          <div id="summary-card-atrasado" class="card home-summary-card" style="padding:12px;text-align:center;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="window.HomeModule.filterByCategory('atrasado')" title="Clique para filtrar">
            <div style="font-size:24px;font-weight:800;color:var(--color-danger);">${atrasados}</div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-top:2px;">Atrasados</div>
          </div>
          <div id="summary-card-lib7" class="card home-summary-card" style="padding:12px;text-align:center;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="window.HomeModule.filterByCategory('lib7')" title="Clique para filtrar">
            <div style="font-size:24px;font-weight:800;color:var(--color-success);">${libsThisWeek}</div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-top:2px;">Liberações (7 dias)</div>
          </div>

          <div id="summary-card-pecas" class="card home-summary-card" style="padding:12px;text-align:center;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="window.HomeModule.filterByCategory('pecas')" title="Clique para filtrar">
            <div style="font-size:24px;font-weight:800;color:var(--color-orange);">${partsPendentes}</div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-top:2px;">Peças Pendentes</div>
          </div>
        </div>

        <!-- Search Bar & Actions -->
        <div style="margin-bottom:16px; display:flex; gap:16px; align-items:center; max-width:450px;">
          <div style="position: relative; width: 100%; background: var(--bg-card, #fff); border-radius: 8px; border: 1px solid var(--border-card, #e2e8f0);">
            <div style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; z-index: 2;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
            </div>
            <select id="home-search" class="input" style="width: 100%; padding-left: 40px; padding-top: 10px; padding-bottom: 10px; font-weight: 500; font-size: 0.95rem; border: none; background-color: transparent; color: var(--text-primary); cursor: pointer; appearance: none; outline: none;" onchange="window.HomeModule.filter(this.value)">
              <option value="">Pesquisar e selecionar equipamento...</option>
              ${(() => {
                const groups = {};
                eqs.forEach(e => {
                  const cod = e.codigo || '';
                  let prefix = cod.split(/[\-\d]/)[0].trim().toUpperCase();
                  if (!prefix) prefix = 'OUTROS';
                  if (!groups[prefix]) groups[prefix] = [];
                  groups[prefix].push(e);
                });
                const sortedGroups = Object.keys(groups).sort();
                return sortedGroups.map(groupName => {
                  const groupOptions = groups[groupName].map(e => {
                    const cod = e.codigo || '';
                    const nom = e.cliente || '';
                    const displayName = (cod.trim() === nom.trim() || nom === '') ? cod : `${cod} - ${nom}`;
                    return `<option value="${cod}">${displayName}</option>`;
                  }).join('');
                  return `<optgroup label="${groupName}">${groupOptions}</optgroup>`;
                }).join('');
              })()}
            </select>
            <div style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--brand-primary);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>
            </div>
          </div>
        </div>

        <!-- Kanban Board Horizontal Container -->
        <div class="planner-board" style="display:flex; gap:var(--space-5); overflow-x:auto; overflow-y:hidden; padding-bottom:var(--space-4); align-items:flex-start; width:100%; flex: 1; min-height: 0;">
          ${boardHtml}
        </div>
      </div>
    `;
  }

  function updateColumnCounts() {
    document.querySelectorAll('.planner-column').forEach(column => {
      const cards = column.querySelectorAll('.home-eq-card');
      let visibleCount = 0;
      cards.forEach(card => {
        if (card.style.display !== 'none') {
          visibleCount++;
        }
      });
      const countEl = column.querySelector('.pch-count');
      if (countEl) {
        countEl.textContent = visibleCount + ' Equipamento' + (visibleCount !== 1 ? 's' : '');
      }
      
      // Toggle visibility of empty columns placeholder
      const placeholder = column.querySelector('.no-cards-placeholder');
      if (placeholder) {
        placeholder.style.display = (visibleCount === 0) ? 'flex' : 'none';
      }
    });
  }

  function filter(term) {
    const termLower = term.toLowerCase();
    document.querySelectorAll('.home-eq-card').forEach(card => {
      const searchData = card.getAttribute('data-search');
      if (searchData.includes(termLower)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
    updateColumnCounts();
  }

  let activeCategory = null;

  function filterByCategory(category, force = false) {
    if (activeCategory === category && !force) {
      // Toggle off
      activeCategory = null;
      document.querySelectorAll('.home-eq-card').forEach(c => c.style.display = 'flex');
      document.querySelectorAll('.home-summary-card').forEach(c => c.style.border = 'none');
    } else {
      activeCategory = category;
      document.querySelectorAll('.home-eq-card').forEach(card => {
        if (card.getAttribute('data-' + category) === '1') {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
      document.querySelectorAll('.home-summary-card').forEach(c => c.style.border = 'none');
      const activeCard = document.getElementById('summary-card-' + category);
      if (activeCard) activeCard.style.border = '2px solid var(--brand-primary)';
    }
    const searchInput = document.getElementById('home-search');
    if (searchInput) searchInput.value = '';
    updateColumnCounts();
  }

  // Drag and Drop implementation
  function drag(ev, eqId) {
    ev.dataTransfer.setData("text/plain", eqId);
    ev.currentTarget.classList.add('dragging');
    ev.dataTransfer.effectAllowed = "move";
  }

  function dragEnd(ev) {
    ev.currentTarget.classList.remove('dragging');
  }

  function allowDrop(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  }

  function dragEnter(ev) {
    ev.preventDefault();
    const col = ev.currentTarget.closest('.planner-column');
    if (col) col.classList.add('drag-over');
  }

  function dragLeave(ev) {
    const col = ev.currentTarget.closest('.planner-column');
    if (col && (!ev.relatedTarget || !col.contains(ev.relatedTarget))) {
      col.classList.remove('drag-over');
    }
  }

  function drop(ev, bucketId) {
    ev.preventDefault();
    
    const col = ev.currentTarget.closest('.planner-column');
    if (col) col.classList.remove('drag-over');

    const eqId = ev.dataTransfer.getData("text/plain");
    if (!eqId) return;

    const bucket = BUCKETS.find(b => b.id === bucketId);
    if (!bucket) return;

    let targetTipo = bucket.name;
    if (bucketId === 'outros') {
      targetTipo = 'Outros Equipamentos';
    }

    const eq = window.DB.equipment.get(eqId);
    if (eq) {
      if (bucketId === 'aguardando-manutencao') {
         if (eq.status === 'Aguardando Manutenção') return;
         window.DB.equipment.update(eqId, { status: 'Aguardando Manutenção' });
      } else {
         if (eq.tipo === targetTipo && eq.status !== 'Aguardando Manutenção' && eq.status !== 'Backlog') return;
         window.DB.equipment.update(eqId, { tipo: targetTipo, status: (eq.status === 'Aguardando Manutenção' || eq.status === 'Backlog') ? 'Em Manutenção' : eq.status });
      }

      // Move element in DOM
      const card = document.querySelector(`.home-eq-card[onclick*="'${eqId}'"]`);
      if (card) {
        const targetContainer = document.querySelector(`.planner-column[data-bucket="${bucketId}"] .planner-cards-container`);
        if (targetContainer) {
          targetContainer.appendChild(card);
        }
      }

      // Recalculate columns
      updateColumnCounts();

      if (window.Toast) {
        window.Toast.success('Equipamento movido', `${eq.codigo} movido para ${targetTipo}`);
      }
    }
  }

  function updateEquipmentStatus(id, newStatus) {
    const eq = window.DB.equipment.get(id);
    if (!eq) return;

    const oldStatus = eq.status;
    if (oldStatus === newStatus) return;

    const updatePayload = { status: newStatus };
    if (newStatus === 'Liberado' && !eq.dataLiberacaoReal) {
      updatePayload.dataLiberacaoReal = new Date().toISOString().slice(0, 10);
    } else if (newStatus !== 'Liberado') {
      updatePayload.dataLiberacaoReal = null;
    }

    window.DB.equipment.update(id, updatePayload);

    // Add timeline event
    window.DB.equipment.addTimeline(id, {
      tipo: newStatus === 'Liberado' ? 'LIBERACAO' : 'STATUS_ALTERADO',
      titulo: `Alteração de Status: ${newStatus}`,
      descricao: `Equipamento alterado de "${oldStatus}" para "${newStatus}"`,
      responsavel: (window.Auth && window.Auth.getSession()?.nome) || 'Sistema'
    });

    if (window.Toast) {
      window.Toast.success('Status Atualizado', `Equipamento ${eq.codigo} alterado para ${newStatus}`);
    }

    // Re-render
    const currentRoute = window.Router ? window.Router.current : 'home';
    window.Router.navigate(currentRoute, { force: true });
  }

  return { 
    render, 
    filter, 
    filterByCategory,
    drag,
    dragEnd,
    allowDrop,
    dragEnter,
    dragLeave,
    drop,
    updateEquipmentStatus
  };
})();
