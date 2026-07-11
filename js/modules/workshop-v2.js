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
     document.querySelectorAll('.ws-kpi-clickable').forEach(el => {
        el.classList.remove('active-alert');
        if (filterState.alerta && el.getAttribute('data-kpi-alert') === filterState.alerta) {
           el.classList.add('active-alert');
        }
     });
  }

  function clearFilters() {
     filterState = { search: '', cliente: '', categoria: '', modelo: '', status: '', etapa: '', responsavel: '', prioridade: '', alerta: '' };
     const searchInput = document.getElementById('ws-search');
     if (searchInput) searchInput.value = '';
     renderChartsAndTables();
  }

  function exportToExcel() {
     const table = document.querySelector('#ws-table-container table');
     if (!table) return;
     let csv = [];
     const rows = table.querySelectorAll('tr');
     for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll('td, th');
        for (let j = 0; j < cols.length; j++) row.push('"' + cols[j].innerText.replace(/"/g, '""').trim() + '"');
        csv.push(row.join(';'));
     }
     const csvFile = new Blob(["\uFEFF" + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
     const downloadLink = document.createElement('a');
     downloadLink.download = 'Controle_Oficina.csv';
     downloadLink.href = window.URL.createObjectURL(csvFile);
     downloadLink.style.display = 'none';
     document.body.appendChild(downloadLink);
     downloadLink.click();
     document.body.removeChild(downloadLink);
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
    const qtdEmManutencao = currentEqs.filter(e => e.status === 'Em Manutenção').length;
    const qtdEmTeste = currentEqs.filter(e => e.etapa === 'Teste').length;
    const qtdLiberados = completedToday.length;
    const qtdCriticos = currentEqs.filter(e => ['Urgente', 'Alta'].includes(e.prioridade) || e.atrasoSla > 0).length;
    const qtdSlaDentro = currentEqs.filter(e => e.atrasoSla === 0).length;
    const qtdSlaVencido = currentEqs.filter(e => e.atrasoSla > 0).length;
    
    const kpiHTML = `
       <div class="ws-kpi ws-kpi-clickable" onclick="WorkshopModule.clearFilters()">
          <div class="ws-kpi-lbl">Equipamentos na Oficina</div>
          <div class="ws-kpi-val" style="color:#2563EB;">${totalCurrent}</div>
       </div>
       <div class="ws-kpi">
          <div class="ws-kpi-lbl">Tempo Médio (Dias)</div>
          <div class="ws-kpi-val">${avgDays}</div>
       </div>
       <div class="ws-kpi">
          <div class="ws-kpi-lbl">Maior Tempo (Dias)</div>
          <div class="ws-kpi-val" style="color:#EF4444;">${maxDays}</div>
       </div>
       <div class="ws-kpi ws-kpi-clickable" data-kpi-alert="pecas" onclick="WorkshopModule.setFilter('alerta', 'pecas')">
          <div class="ws-kpi-lbl">Aguardando Peças</div>
          <div class="ws-kpi-val" style="color:#F59E0B;">${qtdAguardandoPecas}</div>
       </div>
       <div class="ws-kpi ws-kpi-clickable" onclick="WorkshopModule.setFilter('status', 'Em Manutenção')">
          <div class="ws-kpi-lbl">Em Manutenção</div>
          <div class="ws-kpi-val" style="color:#10B981;">${qtdEmManutencao}</div>
       </div>
       <div class="ws-kpi ws-kpi-clickable" onclick="WorkshopModule.setFilter('etapa', 'Teste')">
          <div class="ws-kpi-lbl">Em Teste</div>
          <div class="ws-kpi-val" style="color:#3B82F6;">${qtdEmTeste}</div>
       </div>
       <div class="ws-kpi ws-kpi-clickable" onclick="WorkshopModule.setFilter('status', 'Liberado')">
          <div class="ws-kpi-lbl">Liberados Hoje</div>
          <div class="ws-kpi-val" style="color:#10B981;">${qtdLiberados}</div>
       </div>
       <div class="ws-kpi ws-kpi-clickable" data-kpi-alert="criticos" onclick="WorkshopModule.setFilter('alerta', 'criticos')">
          <div class="ws-kpi-lbl">Eq. Críticos</div>
          <div class="ws-kpi-val" style="color:#EF4444;">${qtdCriticos}</div>
       </div>
       <div class="ws-kpi ws-kpi-clickable" data-kpi-alert="sla_ok" onclick="WorkshopModule.setFilter('alerta', 'sla_ok')">
          <div class="ws-kpi-lbl">SLA no Prazo</div>
          <div class="ws-kpi-val" style="color:#10B981;">${qtdSlaDentro}</div>
       </div>
       <div class="ws-kpi ws-kpi-clickable" data-kpi-alert="sla_vencido" style="border-bottom:3px solid #EF4444;" onclick="WorkshopModule.setFilter('alerta', 'sla_vencido')">
          <div class="ws-kpi-lbl" style="color:#EF4444;">SLA Vencido</div>
          <div class="ws-kpi-val" style="color:#EF4444;">${qtdSlaVencido}</div>
       </div>
    `;
    const kpisDiv = document.getElementById('ws-kpis');
    if (kpisDiv) kpisDiv.innerHTML = kpiHTML;

    destroyCharts();
    
    // Planejado x Realizado por Setor
    const sectors = [
      { id: 'Sondas_de_Pesquisas', name: 'Sondas de Pesquisas' },
      { id: 'Sondas_Pocos', name: 'Sondas Poços' },
      { id: 'Bombas_de_pocos', name: 'Bombas de poços' },
      { id: 'Bomba_de_pesquisa', name: 'Bomba de pesquisa' },
      { id: 'Subconjuntos', name: 'Subconjuntos' },
      { id: 'Programacao_de_almoxarifado', name: 'Programação de almoxarifado' },
      { id: 'Outros', name: 'Outros' }
    ];

    sectors.forEach(sector => {
      const currentYear = new Date().getFullYear().toString();
      const ctxSector = document.getElementById(`wsChart_${sector.id}`);
      if(ctxSector) {
        const mStr = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const mP = Array(12).fill(0), mR = Array(12).fill(0);
        const eqListP = Array.from({length: 12}, () => []);
        const eqListR = Array.from({length: 12}, () => []);
        
        rawEqs.forEach(e => {
          let tipo = e.tipo || '';
          const tipoLower = tipo.toLowerCase().trim();
          if (tipoLower === 'sonda de poços' || tipoLower === 'sondas de poços' || tipoLower === 'sonda poços' || tipoLower === 'sondas poços') {
              tipo = 'Sondas Poços';
          } else if (tipoLower === 'bomba de poços' || tipoLower === 'bombas de poço' || tipoLower === 'bomba de poço' || tipoLower === 'bomba poços' || tipoLower === 'bombas poços') {
              tipo = 'Bombas de poços';
          } else if (tipoLower === 'sonda de pesquisas' || tipoLower === 'sondas pesquisa' || tipoLower === 'sonda pesquisa' || tipoLower === 'sonda de pesquisa' || tipoLower === 'sondas de pesquisa') {
              tipo = 'Sondas de Pesquisas';
          } else if (tipoLower === 'bomba pesquisa' || tipoLower === 'bombas de pesquisa' || tipoLower === 'bombas pesquisa') {
              tipo = 'Bomba de pesquisa';
          } else if (tipoLower === 'subconjunto') {
              tipo = 'Subconjuntos';
          } else if (tipoLower === 'serviço de almoxarifado' || tipoLower === 'servico de almoxarifado' || tipoLower === 'programação almoxarifado') {
              tipo = 'Programação de almoxarifado';
          }
          
          if (sector.id === 'Outros') {
            if (['Sondas de Pesquisas', 'Sondas Poços', 'Bombas de poços', 'Bomba de pesquisa', 'Subconjuntos', 'Programação de almoxarifado'].includes(tipo)) return;
          } else {
            if (tipo !== sector.name) return;
          }

          if(e.dataLiberacaoPlanejada && e.dataLiberacaoPlanejada.startsWith(currentYear)) { 
              const m = parseInt(e.dataLiberacaoPlanejada.split('-')[1],10); 
              if(m>=1&&m<=12) { mP[m-1]++; eqListP[m-1].push(e); } 
          }
          if(e.status==='Liberado' && (e.dataLiberacaoAtual || e.dataRealLiberacao || e.dataLiberacaoReal || e.dataFim)) {
              const dt = e.dataLiberacaoAtual || e.dataRealLiberacao || e.dataLiberacaoReal || e.dataFim;
              if (dt.startsWith(currentYear)) {
                  const m = parseInt(dt.split('-')[1],10); 
                  if(m>=1&&m<=12) { mR[m-1]++; eqListR[m-1].push(e); } 
              }
          }
        });
        
        const adrArr = mStr.map((_, i) => mP[i] ? Math.round((mR[i]/mP[i])*100) : null);
        
        charts.push(new Chart(ctxSector, {
          type: 'bar',
          data: {
            labels: mStr,
            datasets: [
              { type: 'line', label: 'Ad (%)', data: adrArr, borderColor: '#EF4444', backgroundColor: '#EF4444', borderWidth: 1.5, yAxisID: 'y1' },
              { type: 'bar', label: 'Plan', data: mP, backgroundColor: '#60A5FA', borderRadius: 4 },
              { type: 'bar', label: 'Real', data: mR, backgroundColor: '#1E88E5', borderRadius: 4 }
            ]
          },
          plugins: [{
            id: 'customMixedLabels_' + sector.id,
            afterDatasetsDraw(chart) {
              const ctx = chart.ctx;
              ctx.save();
              ctx.font = 'bold 14px Inter, sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#333';
              
              chart.data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                if (meta.hidden) return;
                meta.data.forEach((element, index) => {
                  let value = dataset.data[index];
                  if (value === 0 || value == null || value === '') return;
                  let valStr = String(value);
                  if (dataset.type === 'line') valStr += '%';
                  const position = element.tooltipPosition();
                  ctx.fillStyle = dataset.type === 'line' ? '#EF4444' : textColor;
                  
                  // Se for linha (aderência), coloca o rótulo um pouco abaixo do ponto para não embolar com o número da barra
                  const yOffset = dataset.type === 'line' ? 16 : -16;
                  
                  ctx.fillText(valStr, position.x, position.y + yOffset);
                });
              });
              ctx.restore();
            }
          }],
          options: {
            responsive: true, maintainAspectRatio: false,
            onHover: (e, elements) => { e.native.target.style.cursor = elements.length ? 'pointer' : 'default'; },
            onClick: (evt, elements, chart) => {
              if (elements.length > 0) {
                const datasetIndex = elements[0].datasetIndex;
                const dataIndex = elements[0].index;
                const datasetLabel = chart.data.datasets[datasetIndex].label;
                
                let eqsToShow = [];
                let titlePrefix = '';
                
                if (datasetLabel === 'Plan') {
                    eqsToShow = eqListP[dataIndex];
                    titlePrefix = 'Equipamentos Planejados';
                } else if (datasetLabel === 'Real') {
                    eqsToShow = eqListR[dataIndex];
                    titlePrefix = 'Equipamentos Liberados (Realizado)';
                } else {
                    return; 
                }
                
                if (eqsToShow.length === 0) return;
                window.showEquipmentsModal(`${titlePrefix} - ${sector.name} (${mStr[dataIndex]})`, eqsToShow);
              }
            },
            plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 14, font: { size: 14 } } }, globalDataLabels: false },
            scales: {
              x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 13 } } },
              y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { font: { size: 13 }, precision: 0 } },
              y1: { type: 'linear', position: 'right', grid: { display: false }, min: 0, suggestedMax: 120, border: { display: false }, ticks: { font: { size: 13 } } }
            }
          }
        }));
      }
    });

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

    // Motivos parada reais (Restrições e Status de Pendência)
    const motivoMap = { 'Aguardando Peças': 0, 'Falta Mão de Obra': 0, 'Aguardando Cliente': 0, 'Outros': 0 };
    
    // 1. Peças (via flag no equipamento)
    motivoMap['Aguardando Peças'] = currentEqs.filter(e => e.aguardandoPecas).length;

    // 2. Restrições ativas
    if (window.DB && window.DB.restrictions) {
       const openRestr = window.DB.restrictions.getAll().filter(r => r.status === 'Aberta' && currentEqs.some(e => e.id === r.equipmentId));
       openRestr.forEach(r => {
          if (r.tipo === 'Falta de Mão de Obra' || (r.descricao && r.descricao.toLowerCase().includes('mão de obra'))) motivoMap['Falta Mão de Obra']++;
          else if (r.tipo === 'Aguardando Aprovação' || (r.descricao && r.descricao.toLowerCase().includes('cliente'))) motivoMap['Aguardando Cliente']++;
          else if (r.tipo !== 'Falta de Peça' && r.tipo !== 'Falta de Peças') motivoMap['Outros']++;
       });
    }

    // 3. Tarefas aguardando
    if (window.DB && window.DB.tasks) {
       const pendingTasks = window.DB.tasks.getAll().filter(t => currentEqs.some(e => e.id === t.equipmentId) && t.status !== 'Concluída');
       pendingTasks.forEach(t => {
          if (t.status === 'Aguardando Recurso') motivoMap['Falta Mão de Obra']++;
          // Aguardando peça normalmente reflete na flag aguardandoPecas do equipamento
       });
    }

    const labelsMotivos = [];
    const dataMotivos = [];
    Object.keys(motivoMap).forEach(k => {
       if (motivoMap[k] > 0) {
          labelsMotivos.push(k);
          dataMotivos.push(motivoMap[k]);
       }
    });

    if (dataMotivos.length === 0) {
       labelsMotivos.push('Fluxo Normal');
       dataMotivos.push(1);
    }
    
    const colorMap = {
       'Aguardando Peças': '#F59E0B',
       'Falta Mão de Obra': '#EF4444',
       'Aguardando Cliente': '#3B82F6',
       'Outros': '#8EACC8',
       'Fluxo Normal': '#10B981'
    };
    const statusColors = labelsMotivos.map(l => colorMap[l] || '#94A3B8');

    const motCtx = document.getElementById('ws-chart-motivo');
    if (motCtx) {
       charts.push(new Chart(motCtx, {
         type: 'doughnut',
         data: {
            labels: labelsMotivos,
            datasets: [{
               data: dataMotivos,
               backgroundColor: statusColors,
               borderWidth: 0
            }]
         },
         options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { 
               legend: { position: 'right', onClick: null, labels: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') || '#718096' } }
            },
            onClick: (event, elements, chart) => {
               if (elements[0]) {
                  const label = chart.data.labels[elements[0].index];
                  WorkshopModule.setFilter('search', label);
               }
            }
         },
         plugins: [{
            id: 'doughnutLabels',
            afterDraw(chart) {
               const { ctx } = chart;
               chart.data.datasets.forEach((dataset, i) => {
                  const meta = chart.getDatasetMeta(i);
                  meta.data.forEach((element, index) => {
                     const value = dataset.data[index];
                     if (value > 0) {
                        ctx.save();
                        ctx.fillStyle = '#FFFFFF';
                        ctx.font = 'bold 14px Inter, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const pos = element.tooltipPosition();
                        ctx.fillText(value, pos.x, pos.y);
                        ctx.restore();
                     }
                  });
               });
            }
         }]
       }));
    }
    
    updateDOMFilterState();
    
    const timeDisplay = document.getElementById('ws-last-update');
    if (timeDisplay) {
       const now = new Date();
       timeDisplay.innerText = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0') + ':' + now.getSeconds().toString().padStart(2, '0');
    }
  }

  function render() {
    
    // Add global modal function if not exists
    if (!window.showEquipmentsModal) {
      window.showEquipmentsModal = function(title, eqs) {
        const d = document.createElement('div');
        d.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);z-index:99999;display:flex;justify-content:center;align-items:center;padding:16px;animation:fadeIn 0.2s;backdrop-filter:blur(3px);';
        
        const box = document.createElement('div');
        box.style.cssText = 'background:var(--bg-base);width:100%;max-width:550px;max-height:85vh;border-radius:12px;box-shadow:0 15px 40px rgba(0,0,0,0.3);display:flex;flex-direction:column;overflow:hidden;animation:slideUp 0.3s ease;';
        
        const header = document.createElement('div');
        header.style.cssText = 'padding:16px 20px;border-bottom:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center;background:var(--bg-card);';
        header.innerHTML = `<h3 style="margin:0;font-size:16px;font-weight:600;color:var(--text-primary);display:flex;align-items:center;gap:12px;">
                              ${title} 
                              <span style="background:var(--brand-primary);color:white;padding:2px 8px;border-radius:12px;font-size:12px;">${eqs.length}</span>
                            </h3>
                            <button style="background:transparent;border:none;font-size:24px;cursor:pointer;color:var(--text-secondary);">&times;</button>`;
        header.querySelector('button').onclick = () => d.remove();
        
        const content = document.createElement('div');
        content.style.cssText = 'padding:16px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:12px;';
        
        eqs.forEach(eq => {
          const card = document.createElement('div');
          card.style.cssText = 'padding:14px;background:var(--bg-elevated);border-radius:8px;border-left:4px solid var(--brand-primary);display:flex;flex-direction:column;gap:8px;cursor:pointer;transition:transform 0.1s, box-shadow 0.1s;border:1px solid var(--border-light);';
          card.onmouseover = () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = 'var(--shadow-sm)'; };
          card.onmouseout = () => { card.style.transform = 'none'; card.style.boxShadow = 'none'; };
          card.onclick = () => { d.remove(); if(window.Router) window.Router.navigate('equipment-panel', {id: eq.id}); };
          
          const dtReal = eq.dataRealLiberacao || eq.dataLiberacaoAtual || eq.dataLiberacaoReal;
          card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:15px;color:var(--text-primary);">${eq.codigo}</strong>
              <span style="font-size:11px;font-weight:600;text-transform:uppercase;padding:3px 8px;border-radius:12px;background:var(--bg-card);color:var(--text-secondary);">${eq.status}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-secondary);background:var(--bg-base);padding:8px;border-radius:6px;margin-top:4px;">
              <div style="display:flex;flex-direction:column;gap:2px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;">Planejado</span>
                <span style="color:var(--text-primary);font-weight:500;">${eq.dataLiberacaoPlanejada ? window.formatDate(eq.dataLiberacaoPlanejada) : '-'}</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:2px;text-align:right;">
                <span style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;">Realizado</span>
                <span style="color:var(--color-success);font-weight:600;">${dtReal ? window.formatDate(dtReal) : '-'}</span>
              </div>
            </div>
          `;
          content.appendChild(card);
        });
        
        box.appendChild(header);
        box.appendChild(content);
        d.appendChild(box);
        d.onclick = (e) => { if(e.target === d) d.remove(); };
        document.body.appendChild(d);
      };
    }

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
        .ws-grid-kpi { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
        .ws-kpi { flex: 1 1 120px; min-width: 120px; background: var(--ws-card); border: 1px solid var(--ws-border); border-radius: 12px; padding: 16px; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .ws-kpi-clickable { cursor:pointer; }
        .ws-kpi-clickable:hover { transform: translateY(-3px); border-color: #64B5F6; box-shadow: 0 8px 15px var(--bg-default, #F9FAFB); }
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
         
         <div class="ws-chart-card" style="height: auto; margin-bottom: 24px;">
            <h3>Planejado x Realizado (Anual) por Setor</h3>
            <div class="ws-sectors-charts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(550px, 1fr)); gap: 48px; margin-top: 32px; padding: 16px 0;">
              <div style="height:450px; position:relative; border: 1px solid var(--ws-border); padding: 24px; border-radius: 12px; background: var(--bg-default, #F9FAFB); box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="font-size:16px;font-weight:800;color:var(--text-secondary);margin-bottom:16px;text-align:center;text-transform:uppercase;">Sondas de Pesquisas</div><canvas id="wsChart_Sondas_de_Pesquisas"></canvas></div>
              <div style="height:450px; position:relative; border: 1px solid var(--ws-border); padding: 24px; border-radius: 12px; background: var(--bg-default, #F9FAFB); box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="font-size:16px;font-weight:800;color:var(--text-secondary);margin-bottom:16px;text-align:center;text-transform:uppercase;">Sondas Poços</div><canvas id="wsChart_Sondas_Pocos"></canvas></div>
              <div style="height:450px; position:relative; border: 1px solid var(--ws-border); padding: 24px; border-radius: 12px; background: var(--bg-default, #F9FAFB); box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="font-size:16px;font-weight:800;color:var(--text-secondary);margin-bottom:16px;text-align:center;text-transform:uppercase;">Bombas de poços</div><canvas id="wsChart_Bombas_de_pocos"></canvas></div>
              <div style="height:450px; position:relative; border: 1px solid var(--ws-border); padding: 24px; border-radius: 12px; background: var(--bg-default, #F9FAFB); box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="font-size:16px;font-weight:800;color:var(--text-secondary);margin-bottom:16px;text-align:center;text-transform:uppercase;">Bomba de pesquisa</div><canvas id="wsChart_Bomba_de_pesquisa"></canvas></div>
              <div style="height:450px; position:relative; border: 1px solid var(--ws-border); padding: 24px; border-radius: 12px; background: var(--bg-default, #F9FAFB); box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="font-size:16px;font-weight:800;color:var(--text-secondary);margin-bottom:16px;text-align:center;text-transform:uppercase;">Subconjuntos</div><canvas id="wsChart_Subconjuntos"></canvas></div>
              <div style="height:450px; position:relative; border: 1px solid var(--ws-border); padding: 24px; border-radius: 12px; background: var(--bg-default, #F9FAFB); box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="font-size:16px;font-weight:800;color:var(--text-secondary);margin-bottom:16px;text-align:center;text-transform:uppercase;">Programação de almoxarifado</div><canvas id="wsChart_Programacao_de_almoxarifado"></canvas></div>
              <div style="height:450px; position:relative; border: 1px solid var(--ws-border); padding: 24px; border-radius: 12px; background: var(--bg-default, #F9FAFB); box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><div style="font-size:16px;font-weight:800;color:var(--text-secondary);margin-bottom:16px;text-align:center;text-transform:uppercase;">Outros</div><canvas id="wsChart_Outros"></canvas></div>
            </div>
         </div>
         
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
      </div>
    `;
  }
  
  function destroy() {
    destroyCharts();
    if (updateInterval) clearInterval(updateInterval);
  }

  return { render, destroy, setFilter, clearFilters, exportToExcel, forceRender: renderChartsAndTables };
})();
