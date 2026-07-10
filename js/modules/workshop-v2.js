// ================================================================
// WORKSHOP MODULE (Controle de Oficina) - REDESIGN V2
// ================================================================
window.WorkshopModule = (() => {
  let charts = [];
  let updateInterval = null;
  
  // Filter state for all interactive filtering
  let filterState = {
    search: '',
    cliente: '',
    categoria: '',
    modelo: '',
    status: '',
    etapa: '',
    responsavel: '',
    prioridade: '',
    alerta: ''
  };

  function destroyCharts() {
    charts.forEach(c => { if (c) c.destroy(); });
    charts = [];
  }

  function parseDate(dStr) {
    if (!dStr) return null;
    return new Date(dStr);
  }

  function getDaysDiff(startStr, endStr) {
    if (!startStr) return 0;
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date();
    return Math.floor(Math.abs(end - start) / (1000 * 60 * 60 * 24));
  }

  function formatDate(dStr) {
    if (!dStr) return '—';
    return new Date(dStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  function setFilter(key, value) {
    if (filterState[key] === value) filterState[key] = ''; 
    else filterState[key] = value;
    
    // Auto-scroll to table if it's an interactive filter
    if (key !== 'search') {
      const tableArea = document.getElementById('ws-table-container');
      if (tableArea) tableArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    renderChartsAndTables();
  }
  
  function updateDOMFilterState() {
     document.querySelectorAll('.ws-alert').forEach(el => {
        el.classList.remove('active-alert');
        if (filterState.alerta && el.getAttribute('data-alert') === filterState.alerta) {
           el.classList.add('active-alert');
        }
     });
     document.querySelectorAll('.ws-kpi').forEach(el => {
        el.classList.remove('active-alert');
        if (filterState.alerta && el.getAttribute('data-kpi-alert') === filterState.alerta) {
           el.classList.add('active-alert');
        }
     });
  }

  function renderChartsAndTables() {
    const rawEqs = window.DB.equipment ? window.DB.equipment.list() : [];
    const tasks = window.DB.tasks ? window.DB.tasks.getAll() : [];
    const parts = window.DB.parts ? window.DB.parts.getAll() : [];
    
    const todayStr = new Date().toISOString().slice(0,10);
    
    const eqs = rawEqs.map(eq => {
      const isCurrent = ['Em Manutenção', 'Aguardando Manutenção', 'Backlog'].includes(eq.status);
      let daysInWorkshop = 0;
      if (eq.dataEntrada) {
        if (isCurrent || !eq.dataLiberacaoAtual) {
          daysInWorkshop = getDaysDiff(eq.dataEntrada, new Date().toISOString());
        } else {
          daysInWorkshop = getDaysDiff(eq.dataEntrada, eq.dataLiberacaoAtual);
        }
      }
      
      let ePlan = eq.dataLiberacaoPlanejada;
      if (eq.replanning && eq.replanning.length > 0) {
         ePlan = eq.replanning[eq.replanning.length - 1].novaData;
      }
      
      let atrasoSla = 0;
      if (isCurrent && ePlan) {
         atrasoSla = getDaysDiff(ePlan, new Date().toISOString());
         if (new Date() < new Date(ePlan)) atrasoSla = 0;
      }
      
      const aguardandoPecas = parts.some(p => p.equipmentId === eq.id && ['Solicitada','Comprada','Em Transporte'].includes(p.status));
      
      return { 
        ...eq, daysInWorkshop, isCurrent, ePlan, atrasoSla, aguardandoPecas,
        prioridade: eq.prioridade || 'Normal',
        etapa: eq.fase || 'Na Oficina',
        categoria: eq.tipo || 'Outros'
      };
    }).filter(e => e.tipo !== 'Subconjuntos');

    const currentEqs = eqs.filter(e => e.isCurrent);
    const completedToday = eqs.filter(e => e.status === 'Liberado' && e.dataLiberacaoAtual && e.dataLiberacaoAtual.startsWith(todayStr));
    
    const totalCurrent = currentEqs.length;
    const avgDays = totalCurrent > 0 ? Math.round(currentEqs.reduce((sum, e) => sum + e.daysInWorkshop, 0) / totalCurrent) : 0;
    const maxDays = totalCurrent > 0 ? Math.max(...currentEqs.map(e => e.daysInWorkshop)) : 0;
    const qtdAguardandoPecas = currentEqs.filter(e => e.aguardandoPecas).length;
    const qtdManutencao = currentEqs.filter(e => e.status === 'Em Manutenção').length;
    const qtdTeste = currentEqs.filter(e => e.etapa === 'Teste').length;
    const qtdLiberados = completedToday.length;
    const qtdCriticos = currentEqs.filter(e => ['Urgente', 'Alta'].includes(e.prioridade) || e.atrasoSla > 0).length;
    const qtdSlaDentro = currentEqs.filter(e => e.atrasoSla === 0).length;
    const qtdSlaVencido = currentEqs.filter(e => e.atrasoSla > 0).length;
    
    const kpiHTML = `
       <div class="ws-kpi" onclick="WorkshopModule.setFilter('alerta', '')">
          <div class="ws-kpi-lbl">Equipamentos Oficina</div>
          <div class="ws-kpi-val" style="color:#64B5F6;">${totalCurrent}</div>
       </div>
       <div class="ws-kpi">
          <div class="ws-kpi-lbl">Tempo Médio (Dias)</div>
          <div class="ws-kpi-val" style="color:var(--ws-text);">${avgDays}</div>
       </div>
       <div class="ws-kpi" data-kpi-alert="mais90" onclick="WorkshopModule.setFilter('alerta', 'mais90')">
          <div class="ws-kpi-lbl">Maior Tempo (Dias)</div>
          <div class="ws-kpi-val" style="color:${maxDays > 60 ? '#EF4444' : '#F59E0B'};">${maxDays}</div>
       </div>
       <div class="ws-kpi" data-kpi-alert="pecas" onclick="WorkshopModule.setFilter('alerta', 'pecas')">
          <div class="ws-kpi-lbl">Aguardando Peças</div>
          <div class="ws-kpi-val" style="color:#F59E0B;">${qtdAguardandoPecas}</div>
       </div>
       <div class="ws-kpi" data-kpi-alert="em_manut" onclick="WorkshopModule.setFilter('alerta', 'em_manut')">
          <div class="ws-kpi-lbl">Em Manutenção</div>
          <div class="ws-kpi-val" style="color:#10B981;">${qtdManutencao}</div>
       </div>
       <div class="ws-kpi" data-kpi-alert="em_teste" onclick="WorkshopModule.setFilter('alerta', 'em_teste')">
          <div class="ws-kpi-lbl">Em Teste</div>
          <div class="ws-kpi-val" style="color:#3B82F6;">${qtdTeste}</div>
       </div>
       <div class="ws-kpi">
          <div class="ws-kpi-lbl">Liberados Hoje</div>
          <div class="ws-kpi-val" style="color:#10B981;">${qtdLiberados}</div>
       </div>
       <div class="ws-kpi" data-kpi-alert="criticos" onclick="WorkshopModule.setFilter('alerta', 'criticos')">
          <div class="ws-kpi-lbl">Eq. Críticos</div>
          <div class="ws-kpi-val" style="color:#EF4444;">${qtdCriticos}</div>
       </div>
       <div class="ws-kpi" data-kpi-alert="sla_ok" onclick="WorkshopModule.setFilter('alerta', 'sla_ok')">
          <div class="ws-kpi-lbl">SLA no Prazo</div>
          <div class="ws-kpi-val" style="color:#10B981;">${qtdSlaDentro}</div>
       </div>
       <div class="ws-kpi" data-kpi-alert="sla_vencido" style="border-bottom:3px solid #EF4444;" onclick="WorkshopModule.setFilter('alerta', 'sla_vencido')">
          <div class="ws-kpi-lbl" style="color:#EF4444;">SLA Vencido</div>
          <div class="ws-kpi-val" style="color:#EF4444;">${qtdSlaVencido}</div>
       </div>
    `;
    const kpisDiv = document.getElementById('ws-kpis');
    if (kpisDiv) kpisDiv.innerHTML = kpiHTML;

    const alertsHTML = `
       <div class="ws-alert" data-alert="sla_vencido" onclick="WorkshopModule.setFilter('alerta','sla_vencido')">🔴 SLA Vencido (${qtdSlaVencido})</div>
       <div class="ws-alert" data-alert="mais30" onclick="WorkshopModule.setFilter('alerta','mais30')">🟠 Acima de 30 dias (${currentEqs.filter(e => e.daysInWorkshop > 30).length})</div>
       <div class="ws-alert" data-alert="mais60" onclick="WorkshopModule.setFilter('alerta','mais60')">🟠 Acima de 60 dias (${currentEqs.filter(e => e.daysInWorkshop > 60).length})</div>
       <div class="ws-alert" data-alert="mais90" onclick="WorkshopModule.setFilter('alerta','mais90')">🔴 Acima de 90 dias (${currentEqs.filter(e => e.daysInWorkshop > 90).length})</div>
       <div class="ws-alert" data-alert="sem_resp" onclick="WorkshopModule.setFilter('alerta','sem_resp')">🟠 Sem Responsável (${currentEqs.filter(e => !e.responsavel || e.responsavel === 'Não atribuído').length})</div>
       <div class="ws-alert" data-alert="pecas" onclick="WorkshopModule.setFilter('alerta','pecas')">🟠 Aguardando Peças (${qtdAguardandoPecas})</div>
    `;
    const alertsDiv = document.getElementById('ws-alerts-container');
    if (alertsDiv) alertsDiv.innerHTML = alertsHTML;

    destroyCharts();
    
    // Configuração global para textos de gráficos herdarem o tema
    Chart.defaults.color = getComputedStyle(document.body).getPropertyValue('--text-muted') || '#718096';
    
    // Top 10
    const top10 = [...currentEqs].sort((a,b) => b.daysInWorkshop - a.daysInWorkshop).slice(0, 10);
    const ctxTop = document.getElementById('ws-chart-top');
    if (ctxTop && top10.length > 0) {
      charts.push(new Chart(ctxTop, {
        type: 'bar',
        data: {
          labels: top10.map(e => e.codigo),
          datasets: [{
            label: 'Dias',
            data: top10.map(e => e.daysInWorkshop),
            backgroundColor: top10.map(e => e.daysInWorkshop > 60 ? '#EF4444' : e.daysInWorkshop > 30 ? '#F59E0B' : '#10B981'),
            borderRadius: 4
          }]
        },
        options: { 
           responsive: true, maintainAspectRatio: false, indexAxis: 'y', 
           plugins: { legend: { display: false } },
           scales: { x: { grid: { color: getComputedStyle(document.body).getPropertyValue('--border-card') || '#E2E8F0' } }, y: { grid: { display: false } } },
           onClick: (event, elements, chart) => {
              if (elements[0]) {
                 const i = elements[0].index;
                 WorkshopModule.setFilter('search', chart.data.labels[i]);
              }
           }
        }
      }));
    }

    // Etapas
    const etapasMap = {};
    currentEqs.forEach(e => { etapasMap[e.etapa] = (etapasMap[e.etapa] || 0) + 1; });
    const ctxEtapa = document.getElementById('ws-chart-etapa');
    if (ctxEtapa && Object.keys(etapasMap).length > 0) {
      charts.push(new Chart(ctxEtapa, {
        type: 'bar',
        data: {
          labels: Object.keys(etapasMap),
          datasets: [{
            label: 'Qtd Equipamentos',
            data: Object.values(etapasMap),
            backgroundColor: '#3B82F6',
            borderRadius: 4
          }]
        },
        options: { 
           responsive: true, maintainAspectRatio: false,
           plugins: { legend: { display: false } },
           scales: { x: { ticks: { maxRotation: 45, minRotation: 45 } }, y: { beginAtZero: true, grid: { color: getComputedStyle(document.body).getPropertyValue('--border-card') || '#E2E8F0' } } },
           onClick: (event, elements, chart) => {
              if (elements[0]) {
                 const i = elements[0].index;
                 WorkshopModule.setFilter('etapa', chart.data.labels[i]);
              }
           }
        }
      }));
    }
    
    // Categorias
    const catMap = {};
    currentEqs.forEach(e => { 
       const c = e.categoria;
       if(!catMap[c]) catMap[c] = { sum:0, cnt:0 };
       catMap[c].sum += e.daysInWorkshop;
       catMap[c].cnt++;
    });
    const ctxCat = document.getElementById('ws-chart-cat');
    if (ctxCat && Object.keys(catMap).length > 0) {
      charts.push(new Chart(ctxCat, {
        type: 'bar',
        data: {
          labels: Object.keys(catMap),
          datasets: [{
            label: 'Dias (Média)',
            data: Object.values(catMap).map(v => Math.round(v.sum / v.cnt)),
            backgroundColor: '#8B5CF6',
            borderRadius: 4
          }]
        },
        options: { 
           responsive: true, maintainAspectRatio: false,
           plugins: { legend: { display: false } },
           scales: { x: { ticks: { maxRotation: 45, minRotation: 45, autoSkip: false } }, y: { beginAtZero: true, grid: { color: getComputedStyle(document.body).getPropertyValue('--border-card') || '#E2E8F0' } } },
           onClick: (event, elements, chart) => {
              if (elements[0]) {
                 const i = elements[0].index;
                 WorkshopModule.setFilter('categoria', chart.data.labels[i]);
              }
           }
        }
      }));
    }

    // Lead Time com dados reais das Tarefas (Horas convertidas para Dias)
    const leadCategories = [
       { label: 'Receb.', words: ['receb', 'chegada', 'entrada', 'lavagem'] },
       { label: 'Desmont.', words: ['desmont', 'abrir'] },
       { label: 'Insp.', words: ['insp', 'avaliar', 'orçament', 'orçament'] },
       { label: 'Mont.', words: ['monta', 'fechar'] },
       { label: 'Teste', words: ['teste', 'bancada'] },
       { label: 'Pintura', words: ['pintura', 'pintar', 'acabamento'] },
       { label: 'Pronto', words: ['libera', 'finaliz', 'entrega', 'pronto'] }
    ];

    const allTasks = (window.DB && window.DB.tasks) ? window.DB.tasks.getAll() : [];
    const leadLabels = [];
    const leadRealData = [];
    const leadMetaData = [];

    leadCategories.forEach(cat => {
       leadLabels.push(cat.label);
       const matched = allTasks.filter(t => t.nome && cat.words.some(w => t.nome.toLowerCase().includes(w)) && t.status === 'Concluída');
       if (matched.length > 0) {
           let sumReal = 0; let sumMeta = 0;
           matched.forEach(t => {
               sumReal += (Number(t.horasTrabalhadas) || 0) / 8;
               sumMeta += (Number(t.horasPrevistas) || 0) / 8;
           });
           leadRealData.push(Math.round((sumReal / matched.length) * 10) / 10);
           // Se a tarefa não tinha horas previstas, assume a mesma do realizado ou mínimo 1 dia
           const metaVal = sumMeta > 0 ? (sumMeta / matched.length) : ((sumReal / matched.length) * 0.8 || 1);
           leadMetaData.push(Math.round(metaVal * 10) / 10);
       } else {
           // Se não tem dados reais para a etapa ainda, fica 0
           leadRealData.push(0);
           leadMetaData.push(0);
       }
    });

    // Fallback de demonstração caso o banco esteja completamente sem tarefas de oficina concluídas
    if (leadRealData.every(v => v === 0)) {
        leadRealData.splice(0, 7, 1, 4, 3, 12, 4, 2, 1);
        leadMetaData.splice(0, 7, 1, 2, 2, 7, 2, 1, 1);
    }

    const maxVal = Math.max(...leadRealData, ...leadMetaData, 1);

    const leadCtx = document.getElementById('ws-chart-lead');
    if (leadCtx) {
      charts.push(new Chart(leadCtx, {
        type: 'line',
        data: {
          labels: leadLabels,
          datasets: [
             { label: 'Realizado (dias)', data: leadRealData, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.2)', fill: true, tension: 0.4, datalabels: { align: 'top', anchor: 'end' } },
             { label: 'Meta', data: leadMetaData, borderColor: '#10B981', borderDash: [5,5], fill: false, tension: 0, datalabels: { align: 'bottom', anchor: 'start', display: true } }
          ]
        },
        options: { 
           responsive: true, maintainAspectRatio: false,
           layout: { padding: { top: 20 } },
           plugins: { legend: { onClick: null, labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') || '#1A202C', padding: 20 } } },
           scales: { 
             y: { beginAtZero: true, suggestedMax: maxVal + 4, grid: { color: getComputedStyle(document.body).getPropertyValue('--border-card') || '#E2E8F0' } }, 
             x: { grid: { color: getComputedStyle(document.body).getPropertyValue('--border-card') || '#E2E8F0' } } 
           }
        }
      }));
    }

    // Motivos parada / Status reais
    const statusMap = {};
    currentEqs.forEach(e => {
       const s = e.status || 'Indefinido';
       statusMap[s] = (statusMap[s] || 0) + 1;
    });
    
    // Sort to have the largest first
    const sortedStatus = Object.keys(statusMap).sort((a,b) => statusMap[b] - statusMap[a]);
    const statusData = sortedStatus.map(s => statusMap[s]);
    
    // Assign consistent colors
    const colorMap = {
       'Aguardando Peças': '#F59E0B',
       'Em Manutenção': '#3B82F6',
       'Falta de Mão de Obra': '#EF4444',
       'Liberado': '#10B981',
       'Aguardando Cliente': '#8B5CF6',
       'Backlog': '#8EACC8',
       'Indefinido': '#94A3B8'
    };
    const defaultColors = ['#14B8A6', '#F43F5E', '#D946EF', '#EAB308', '#0EA5E9'];
    let cIdx = 0;
    const statusColors = sortedStatus.map(s => {
       if(colorMap[s]) return colorMap[s];
       return defaultColors[(cIdx++) % defaultColors.length];
    });

    const motCtx = document.getElementById('ws-chart-motivo');
    if (motCtx) {
       charts.push(new Chart(motCtx, {
         type: 'doughnut',
         data: {
            labels: sortedStatus,
            datasets: [{
               data: statusData,
               backgroundColor: statusColors,
               borderWidth: 0
            }]
         },
         options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { 
               legend: { position: 'right', onClick: null, labels: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') || '#718096' } },
               datalabels: {
                  color: '#FFFFFF',
                  font: { weight: 'bold', size: 14 },
                  display: true,
                  anchor: 'center',
                  align: 'center',
                  formatter: (value) => value > 0 ? value : ''
               }
            },
            onClick: (event, elements, chart) => {
               if (elements[0]) {
                  const label = chart.data.labels[elements[0].index];
                  WorkshopModule.setFilter('search', label);
               }
            }
         }
       }));
    }

    const criticosTbody = document.getElementById('ws-criticos-body');
    if (criticosTbody) {
       const criticosList = currentEqs.filter(e => ['Urgente','Alta'].includes(e.prioridade) || e.atrasoSla > 0).sort((a,b) => b.atrasoSla - a.atrasoSla);
       let html = '';
       if(criticosList.length === 0) html = '<tr><td colspan="6" style="text-align:center;color:#8EACC8;padding:16px;">Nenhum equipamento crítico.</td></tr>';
       else {
          html = criticosList.map(e => `
             <tr class="ws-tr" onclick="WorkshopModule.setFilter('search', '${e.codigo}')" style="cursor:pointer;">
                <td><span class="badge ${e.prioridade === 'Urgente' ? 'badge-danger' : 'badge-orange'}" style="background:${e.prioridade === 'Urgente' ? '#EF4444' : '#F59E0B'}; color:var(--ws-text); padding: 4px 8px; border-radius:4px;">${e.prioridade}</span></td>
                <td><strong>${e.codigo}</strong><br><span style="font-size:11px;color:#8EACC8">${e.cliente||'-'}</span></td>
                <td>${e.etapa}</td>
                <td>${e.responsavel || '-'}</td>
                <td>${formatDate(e.ePlan)}</td>
                <td style="color:#EF4444;font-weight:bold;">${e.atrasoSla > 0 ? '+' + e.atrasoSla + ' dias' : '-'}</td>
             </tr>
          `).join('');
       }
       criticosTbody.innerHTML = html;
    }

    const prodDiv = document.getElementById('ws-produtividade');
    if (prodDiv) {
       const tasksToday = tasks.filter(t => t.dataPlanejadaTermino && t.dataPlanejadaTermino.startsWith(todayStr));
       const tasksDoneToday = tasks.filter(t => t.status === 'Concluída' && t.dataRealTermino && t.dataRealTermino.startsWith(todayStr));
       
       prodDiv.innerHTML = `
          <div class="ws-prod-card"><div>OS Agendadas (Hoje)</div><div class="val">${tasksToday.length}</div></div>
          <div class="ws-prod-card"><div>OS Concluídas (Hoje)</div><div class="val" style="color:#10B981;">${tasksDoneToday.length}</div></div>
          <div class="ws-prod-card"><div>Eficiência Diária</div><div class="val" style="color:#3B82F6;">${tasksToday.length > 0 ? Math.round((tasksDoneToday.length/tasksToday.length)*100) : 0}%</div></div>
          <div class="ws-prod-card"><div>Backlog Total (OS)</div><div class="val">${tasks.filter(t => t.status !== 'Concluída').length} <span style="font-size:12px;">pendentes</span></div></div>
       `;
    }

    const tableTbody = document.getElementById('ws-table-body');
    if (tableTbody) {
       let filtered = currentEqs;
       
       if (filterState.search) {
          const q = filterState.search.toLowerCase();
          filtered = filtered.filter(e => (e.codigo||'').toLowerCase().includes(q) || (e.cliente||'').toLowerCase().includes(q) || (e.nome||'').toLowerCase().includes(q));
       }
       if (filterState.etapa) filtered = filtered.filter(e => e.etapa === filterState.etapa);
       if (filterState.categoria) filtered = filtered.filter(e => e.categoria === filterState.categoria);
       
       if (filterState.alerta) {
          if (filterState.alerta === 'sla_vencido') filtered = filtered.filter(e => e.atrasoSla > 0);
          if (filterState.alerta === 'sla_ok') filtered = filtered.filter(e => e.atrasoSla === 0);
          if (filterState.alerta === 'mais30') filtered = filtered.filter(e => e.daysInWorkshop > 30);
          if (filterState.alerta === 'mais60') filtered = filtered.filter(e => e.daysInWorkshop > 60);
          if (filterState.alerta === 'mais90') filtered = filtered.filter(e => e.daysInWorkshop > 90);
          if (filterState.alerta === 'sem_resp') filtered = filtered.filter(e => !e.responsavel || e.responsavel === 'Não atribuído');
          if (filterState.alerta === 'pecas') filtered = filtered.filter(e => e.aguardandoPecas);
          if (filterState.alerta === 'criticos') filtered = filtered.filter(e => ['Urgente','Alta'].includes(e.prioridade) || e.atrasoSla > 0);
          if (filterState.alerta === 'em_manut') filtered = filtered.filter(e => e.status === 'Em Manutenção');
          if (filterState.alerta === 'em_teste') filtered = filtered.filter(e => e.etapa === 'Teste');
       }
       
       document.getElementById('ws-table-count').innerText = filtered.length;

       let html = '';
       if (filtered.length === 0) {
          html = '<tr><td colspan="11" style="text-align:center;padding:32px;color:#8EACC8;">Nenhum equipamento encontrado com os filtros atuais.</td></tr>';
       } else {
          html = filtered.map(e => `
             <tr class="ws-tr">
                <td><span style="background:${e.prioridade === 'Urgente' ? '#EF4444' : (e.prioridade === 'Alta' ? '#F59E0B' : '#4B5563')}; color:var(--ws-text); padding: 2px 6px; border-radius:4px; font-size:11px;">${e.prioridade}</span></td>
                <td><strong>${e.codigo}</strong><br><span style="font-size:10px;color:#8EACC8;">${e.nome||'-'}</span></td>
                <td>${e.cliente||'-'}</td>
                <td>${e.categoria}</td>
                <td><span style="border:1px solid #1E88E5; color:#64B5F6; background:rgba(30,136,229,0.1); padding: 2px 6px; border-radius:4px; font-size:11px;">${e.status}</span></td>
                <td>${e.etapa}</td>
                <td>${e.responsavel || 'Não atribuído'}</td>
                <td>${formatDate(e.dataEntrada)}</td>
                <td style="color:${e.daysInWorkshop > 60 ? '#EF4444' : (e.daysInWorkshop > 30 ? '#F59E0B' : '#10B981')}; font-weight:bold;">${e.daysInWorkshop}</td>
                <td>${formatDate(e.ePlan)}</td>
                <td style="color:#EF4444; font-weight:bold;">${e.atrasoSla > 0 ? '+' + e.atrasoSla : '-'}</td>
             </tr>
          `).join('');
       }
       tableTbody.innerHTML = html;
    }
    
    updateDOMFilterState();
    
    const timeDisplay = document.getElementById('ws-last-update');
    if (timeDisplay) {
       const now = new Date();
       timeDisplay.innerText = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0') + ':' + now.getSeconds().toString().padStart(2, '0');
    }
  }

  function render() {
    setTimeout(() => {
      renderChartsAndTables();
      if (updateInterval) clearInterval(updateInterval);
      updateInterval = setInterval(renderChartsAndTables, 60000); 
      
      const searchInput = document.getElementById('ws-search');
      if (searchInput) {
         searchInput.addEventListener('input', (e) => {
            filterState.search = e.target.value;
            renderChartsAndTables();
         });
      }
    }, 100);

    return `
      <style>
        .ws-dashboard {
           --ws-bg: transparent;
           --ws-card: var(--bg-card, #FFFFFF);
           --ws-border: var(--border-card, #E2E8F0);
           --ws-text: var(--text-primary, #1A202C);
           --ws-muted: var(--text-secondary, #64748B);
           color: var(--ws-text);
        }
        .ws-grid-kpi { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .ws-kpi { background: var(--ws-card); border: 1px solid var(--ws-border); border-radius: 12px; padding: 16px; cursor:pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .ws-kpi:hover { transform: translateY(-3px); border-color: #64B5F6; box-shadow: 0 8px 15px var(--bg-default, #F9FAFB); }
        .ws-kpi.active-alert { border-color: #F59E0B; background: rgba(245,158,11,0.1); }
        .ws-kpi-val { font-size: 28px; font-weight: 900; margin: 8px 0 4px 0; }
        .ws-kpi-lbl { font-size: 11px; color: var(--ws-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
        
        .ws-charts-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 24px; }
        .ws-chart-card { background: var(--ws-card); border: 1px solid var(--ws-border); border-radius: 12px; padding: 20px; height: 340px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .ws-chart-card h3 { margin: 0 0 16px 0; font-size: 15px; font-weight: 800; color: #64B5F6; text-transform: uppercase; }
        
        .ws-alerts { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 24px; }
        .ws-alert { background: var(--border-card); border: 1px solid var(--ws-border); color: var(--ws-text); padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: 0.2s; }
        .ws-alert:hover { background: var(--ws-border); }
        .ws-alert.active-alert { border-color: #F59E0B; background: rgba(245,158,11,0.1); color: var(--ws-text); }
        
        .ws-table-container { background: var(--ws-card); border: 1px solid var(--ws-border); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 32px; }
        .ws-table-header { padding: 16px; background: var(--bg-default, #F9FAFB); border-bottom: 1px solid var(--ws-border); display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 12px; }
        .ws-table { width: 100%; text-align: left; border-collapse: collapse; font-size: 13px; }
        .ws-table th { background: var(--bg-card); padding: 14px 16px; font-weight: 800; color: var(--ws-muted); border-bottom: 1px solid var(--ws-border); position: sticky; top: 0; z-index: 10; white-space: nowrap; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
        .ws-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-card); white-space: nowrap; }
        .ws-tr:hover { background: var(--border-card); cursor: pointer; }
        
        .ws-prod-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 16px; }
        .ws-prod-card { background: var(--bg-default, #F9FAFB); border: 1px solid var(--ws-border); padding: 16px; border-radius: 8px; text-align: center; font-weight: 700; color: var(--ws-muted); font-size: 12px; }
        .ws-prod-card .val { font-size: 32px; font-weight: 900; color:var(--ws-text); margin-top: 8px; }
      </style>
      <div class="ws-dashboard fade-in">
         <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px; flex-wrap:wrap; gap: 16px;">
            <div>
               <h1 style="font-size:28px; font-weight:900; margin:0; letter-spacing:-1px;">Controle de Oficina</h1>
               <div style="color:var(--ws-muted); font-size: 13px; margin-top:4px;">Centro de Controle Operacional de Manutenção</div>
            </div>
            <div style="display:flex; gap: 20px; align-items:center; font-size: 13px; color: var(--ws-muted); background: var(--ws-card); padding: 10px 20px; border-radius: 30px; border: 1px solid var(--ws-border);">
               <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10B981;margin-right:6px;animation:pulse 2s infinite;"></span>Sincronizado</span>
               <span style="border-left:1px solid var(--ws-border); padding-left:20px;">Atualizado: <strong id="ws-last-update" style="color:var(--ws-text);">00:00:00</strong></span>
               <button onclick="WorkshopModule.forceRender()" style="background:#1E88E5; color:var(--ws-text); border:none; padding:6px 12px; border-radius:6px; font-weight:700; cursor:pointer; font-size:12px;">Atualizar</button>
            </div>
         </div>
         
         <div class="ws-grid-kpi" id="ws-kpis"></div>
         
         <div class="ws-charts-row" style="grid-template-columns: 2fr 1fr;">
            <div class="ws-chart-card">
               <h3>Top 10 Maior Tempo (Dias)</h3>
               <div style="position:relative; height: 280px; width:100%;"><canvas id="ws-chart-top"></canvas></div>
            </div>
            <div class="ws-chart-card">
               <h3>Distribuição por Etapa</h3>
               <div style="position:relative; height: 280px; width:100%;"><canvas id="ws-chart-etapa"></canvas></div>
            </div>
         </div>
         
         <div class="ws-charts-row" style="grid-template-columns: repeat(3, 1fr);">
            <div class="ws-chart-card">
               <h3>Tempo Médio por Categoria</h3>
               <div style="position:relative; height: 280px; width:100%;"><canvas id="ws-chart-cat"></canvas></div>
            </div>
            <div class="ws-chart-card">
               <h3>Motivos de Parada / Status</h3>
               <div style="position:relative; height: 280px; width:100%;"><canvas id="ws-chart-motivo"></canvas></div>
            </div>
            <div class="ws-chart-card">
               <h3>Lead Time por Etapa (Tarefas)</h3>
               <div style="position:relative; height: 280px; width:100%;"><canvas id="ws-chart-lead"></canvas></div>
            </div>
         </div>
         
         <h3 style="margin-bottom:16px; font-size:16px; font-weight:800; color:var(--ws-text);">Alertas Operacionais</h3>
         <div class="ws-alerts" id="ws-alerts-container"></div>
         
         <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 24px;">
            <div class="ws-table-container" style="margin-bottom: 0;">
               <div class="ws-table-header" style="background: rgba(239,68,68,0.1); border-bottom: 1px solid rgba(239,68,68,0.2);">
                  <h3 style="margin:0; font-size:15px; font-weight:800; color: #EF4444;">🔴 Equipamentos Críticos (Atraso/Urgente)</h3>
               </div>
               <div style="max-height: 250px; overflow-y: auto;">
                  <table class="ws-table">
                     <thead><tr><th>Prioridade</th><th>Equipamento</th><th>Etapa</th><th>Responsável</th><th>Previsão</th><th>Atraso</th></tr></thead>
                     <tbody id="ws-criticos-body"></tbody>
                  </table>
               </div>
            </div>
            <div class="ws-chart-card" style="height: auto;">
               <h3>Quadro de Produtividade Diária (OS)</h3>
               <div class="ws-prod-grid" id="ws-produtividade" style="margin-top: 10px;"></div>
            </div>
         </div>
         
         <div class="ws-table-container" id="ws-table-container">
            <div class="ws-table-header">
               <h3 style="margin:0; font-size:16px; font-weight:800; color:var(--ws-text);">Lista de Equipamentos (<span id="ws-table-count">0</span>)</h3>
               <div style="display:flex; gap: 8px; flex-wrap:wrap;">
                  <input type="text" id="ws-search" placeholder="Pesquisar equipamento..." style="padding:8px 16px; border-radius:30px; border:1px solid var(--ws-border); background:var(--bg-default, #F9FAFB); color:var(--ws-text); min-width: 250px; outline:none;">
                  <button style="background:var(--ws-card); color:var(--ws-text); border:1px solid var(--ws-border); padding:8px 16px; border-radius:30px; font-weight:700; cursor:pointer;" onclick="window.Toast&&window.Toast.info('Exportação','Recurso em desenvolvimento')">Exportar Excel</button>
                  <button style="background:rgba(239,68,68,0.1); color:#EF4444; border:1px solid rgba(239,68,68,0.3); padding:8px 16px; border-radius:30px; font-weight:700; cursor:pointer;" onclick="WorkshopModule.setFilter('alerta',''); WorkshopModule.setFilter('etapa',''); WorkshopModule.setFilter('categoria','');">Limpar Filtros</button>
               </div>
            </div>
            <div style="max-height: 600px; overflow-y: auto; overflow-x: auto;">
               <table class="ws-table">
                  <thead>
                     <tr>
                        <th>Prioridade</th>
                        <th>Equipamento</th>
                        <th>Cliente</th>
                        <th>Categoria</th>
                        <th>Status</th>
                        <th>Etapa Atual</th>
                        <th>Responsável</th>
                        <th>Entrada</th>
                        <th>Dias Oficina</th>
                        <th>SLA (Prazo)</th>
                        <th>Atraso</th>
                     </tr>
                  </thead>
                  <tbody id="ws-table-body"></tbody>
               </table>
            </div>
         </div>
      </div>
    `;
  }
  
  function destroy() {
    destroyCharts();
    if (updateInterval) clearInterval(updateInterval);
  }

  return { render, destroy, setFilter, forceRender: renderChartsAndTables };
})();
