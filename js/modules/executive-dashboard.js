window.ExecutiveDashboard = (() => {
  let charts = {};
  let selectedMonth = new Date().toISOString().slice(0, 7);

  function init() {
    console.log("Executive Dashboard Initialized (Native Theme)");
  }

  function destroyCharts() {
    Object.values(charts).forEach(c => {
      if(c) c.destroy();
    });
    charts = {};
  }

  function isMonth(dStr, mPrefix) {
    if(!dStr) return false;
    if(String(dStr).startsWith(mPrefix)) return true;
    if(String(dStr).includes('/')) {
      const p = String(dStr).split('/');
      if(p.length===3 && p[2]+'-'+p[1].padStart(2,'0') === mPrefix) return true;
    }
    try {
      const d = new Date(dStr);
      if(!isNaN(d) && d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0') === mPrefix) return true;
    }catch(e){}
    return false;
  }

  function render() {
    const currentMonthPrefix = selectedMonth;
    // Data Fetching
    const eqs = DB.equipment ? DB.equipment.list() : [];
    const tasks = DB.tasks ? DB.tasks.getAll().filter(t => {
      const dt = t.dataRealInicio || t.dataPlanejadaInicio || t.dataRealTermino || '';
      return isMonth(dt, currentMonthPrefix);
    }) : [];
    const stats = DB.kpi ? DB.kpi.getEquipmentStats(currentMonthPrefix) : { pctAvancoGeral: 0 };
    
    // KPI Math
    const totalEqs = eqs.length;
    const emManutencao = eqs.filter(e => e.status === 'Em Manutenção').length;
    
    // Planejado vs Realizado (Current Month)
    const libPlanejadasMes = eqs.filter(e => isMonth(e.dataLiberacaoPlanejada, currentMonthPrefix)).length;
    const libRealizadasMes = eqs.filter(e => e.status === 'Liberado' && isMonth(e.dataLiberacaoAtual || e.dataLiberacaoPlanejada || e.updatedAt, currentMonthPrefix)).length;
    
    const aderencia = libPlanejadasMes > 0 ? Math.round((libRealizadasMes / libPlanejadasMes) * 100) : 0;
    const avancoGeral = Math.round(stats.pctAvancoGeral || 0);

    // Score Geral (Approximation based on weights)
    // Aderencia(30) + Libs(20) + Avanco(15) + Backlog(10) + TempoMedio(10) + Criticos(5) + Prod(5) + Disp(5)
    let score = (aderencia * 0.30) + (Math.min((libRealizadasMes/(libPlanejadasMes||1))*100, 100) * 0.20) + (avancoGeral * 0.15) + (80 * 0.35); // 80 is a placeholder for the rest
    score = Math.round(Math.min(score, 100));

    // Alerts
    const aguardandoPeca = eqs.filter(e => e.status === 'Aguardando Peça').length;
    const atrasados = eqs.filter(e => {
       if(!e.dataLiberacaoPlanejada || e.status === 'Liberado') return false;
       return new Date(e.dataLiberacaoPlanejada) < new Date();
    });
    
    const criticalHtml = atrasados.slice(0, 3).map(e => `<li><span style="color:var(--color-danger); margin-right:8px;">●</span> ${e.codigo} (${e.cliente || 'Sem Cliente'}) atrasado</li>`).join('');

    // Generate months from 2026-06 onwards for select
    const monthOptions = [];
    const now = new Date();
    for(let i=0; i<12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      // Limit to 2026-06 onwards
      if (d.getFullYear() < 2026 || (d.getFullYear() === 2026 && d.getMonth() < 5)) break;
      const mStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2, '0');
      monthOptions.push(`<option value="${mStr}" ${mStr === selectedMonth ? 'selected' : ''}>${mStr}</option>`);
    }

    setTimeout(() => {
      renderCharts(eqs, tasks, aderencia, currentMonthPrefix);
    }, 100);

    return `
      <div class="exec-dashboard" id="exec-dashboard-main">
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:48px;">
          <div>
            <h1 class="exec-title">Dashboard Executivo</h1>
            <div class="exec-subtitle">Visão Estratégica da Manutenção</div>
          </div>
          <div style="display:flex; gap:16px;">
            <select class="exec-filter-select" id="exec-month-select" onchange="window.ExecutiveDashboard.changeMonth(this.value)" style="background:var(--bg-input); border:1px solid var(--border-default); color:var(--text-primary); padding:10px 16px; border-radius:8px; outline:none; font-weight: 600;">
              ${monthOptions.join('')}
            </select>
            <button onclick="window.ExecutiveDashboard.refresh()" style="background:var(--brand-primary); color:#fff; border:none; padding:10px 24px; border-radius:8px; font-weight:600; cursor:pointer;">Atualizar</button>
          </div>
        </div>

        <h2 class="exec-title" style="font-size:18px; margin-bottom:24px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:1px;">Timeline de Fluxo</h2>
        <div class="exec-card" style="margin-bottom:48px;">
          <div class="exec-timeline">
             ${renderTimelineStep('Planejados', eqs.filter(e => e.dataLiberacaoPlanejada).length, true)}
             ${renderTimelineStep('Atrasados', atrasados.length, atrasados.length > 0)}
             ${renderTimelineStep('Manutenção', emManutencao, emManutencao > 0)}
             ${renderTimelineStep('Aguardando Peça', aguardandoPeca, aguardandoPeca > 0)}
             ${renderTimelineStep('Liberados', eqs.filter(e => e.status === 'Liberado').length, false)}
          </div>
        </div>

        <div class="exec-grid-kpis">
          <div class="exec-card"><div class="exec-card-title">Total Equipamentos</div><div class="exec-kpi-value">${totalEqs}</div></div>
          <div class="exec-card"><div class="exec-card-title">Em Manutenção</div><div class="exec-kpi-value" style="color:var(--color-warning);">${emManutencao}</div></div>
          <div class="exec-card"><div class="exec-card-title">Liberações (Mês)</div><div class="exec-kpi-value" style="color:var(--color-success);">${libRealizadasMes} <span style="font-size:14px; color:var(--text-secondary);">/ ${libPlanejadasMes}</span></div></div>
          <div class="exec-card"><div class="exec-card-title">Aderência</div><div class="exec-kpi-value">${aderencia}%</div></div>
          <div class="exec-card"><div class="exec-card-title">Avanço Geral</div><div class="exec-kpi-value">${avancoGeral}%</div></div>
          <div class="exec-card"><div class="exec-card-title">Aguardando Peça</div><div class="exec-kpi-value" style="color:var(--color-danger);">${aguardandoPeca}</div></div>
        </div>

        <h2 class="exec-title" style="font-size:18px; margin-bottom:24px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:1px;">Desempenho por Setor (Mês Atual)</h2>
        <div class="exec-grid-sectors" id="exec-sectors-container" style="margin-bottom: 48px;">
          <!-- Rendered via JS -->
          ${renderSectors(eqs, currentMonthPrefix)}
        </div>

        <div class="exec-grid-main">
          <div class="exec-card" style="flex:2;">
            <div class="exec-card-title">Planejado x Realizado (Anual) por Setor</div>
            <div class="exec-sectors-charts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 16px;">
              <div class="exec-chart-wrapper" style="height:220px;"><div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;text-align:center;">Sondas de Pesquisas</div><canvas id="execChart_Sondas_de_Pesquisas"></canvas></div>
              <div class="exec-chart-wrapper" style="height:220px;"><div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;text-align:center;">Sondas Poços</div><canvas id="execChart_Sondas_Pocos"></canvas></div>
              <div class="exec-chart-wrapper" style="height:220px;"><div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;text-align:center;">Bombas de poços</div><canvas id="execChart_Bombas_de_pocos"></canvas></div>
              <div class="exec-chart-wrapper" style="height:220px;"><div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;text-align:center;">Bomba de pesquisa</div><canvas id="execChart_Bomba_de_pesquisa"></canvas></div>
              <div class="exec-chart-wrapper" style="height:220px;"><div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;text-align:center;">Subconjuntos</div><canvas id="execChart_Subconjuntos"></canvas></div>
              <div class="exec-chart-wrapper" style="height:220px;"><div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;text-align:center;">Programação de almoxarifado</div><canvas id="execChart_Programacao_de_almoxarifado"></canvas></div>
              <div class="exec-chart-wrapper" style="height:220px;"><div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;text-align:center;">Outros</div><canvas id="execChart_Outros"></canvas></div>
            </div>
          </div>
          
          <div class="exec-panel-right">
            <div class="exec-card" style="flex:1;">
              <div class="exec-card-title">Score Geral</div>
              <div class="exec-score-circle" style="border-color:${score>=85 ? 'var(--color-success)' : score>=70 ? 'var(--color-warning)' : 'var(--color-danger)'}; box-shadow: 0 0 20px ${score>=85 ? 'var(--color-success-bg)' : score>=70 ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)'}; color:${score>=85 ? 'var(--color-success)' : score>=70 ? 'var(--color-warning)' : 'var(--color-danger)'};">
                ${score}
              </div>
              
              <div class="exec-card-title" style="margin-top:24px; color:var(--color-danger);">Alertas Críticos</div>
              <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; font-size:14px; font-weight:500;">
                ${criticalHtml || '<li>Nenhum alerta crítico ativo</li>'}
              </ul>
              
              <div class="exec-card-title" style="margin-top:24px; color:var(--color-info);">Insights IA</div>
              <p style="font-size:14px; color:var(--text-secondary); line-height:1.6; margin:0;">
                O score da manutenção é ${score}. Aderência de ${aderencia}% neste mês demonstra ${aderencia>=90 ? 'alta' : 'baixa'} previsibilidade. Existem ${atrasados.length} equipamentos atrasados no momento.
              </p>
            </div>
          </div>
        </div>

        <div class="exec-grid-thirds">
          <div class="exec-card"><div class="exec-card-title">Status dos Equipamentos</div><div class="exec-chart-wrapper medium"><canvas id="execChartStatus"></canvas></div></div>
          <div class="exec-card"><div class="exec-card-title">Top 5 Avanço Equipamentos</div><div class="exec-chart-wrapper medium"><canvas id="execChartAvanco"></canvas></div></div>
          <div class="exec-card"><div class="exec-card-title">Pipeline / Etapa da Manutenção</div><div class="exec-chart-wrapper medium"><canvas id="execChartPipeline"></canvas></div></div>
        </div>

        <h2 class="exec-title" style="font-size:18px; margin-bottom:24px; color:var(--text-secondary); text-transform:uppercase; letter-spacing:1px;">Top Equipamentos Críticos (Atrasados)</h2>
        <div class="exec-card" style="margin-bottom:48px; padding:0; overflow:hidden; overflow-x:auto;">
          <table class="exec-table">
            <thead>
              <tr>
                <th>Equipamento</th>
                <th>Cliente</th>
                <th>Responsável</th>
                <th>Plan. Inicial</th>
                <th>Status</th>
                <th>Prioridade</th>
              </tr>
            </thead>
            <tbody>
              ${renderCriticalEquipments(atrasados)}
            </tbody>
          </table>
        </div>

      </div>
    `;
  }

  function renderSectors(eqs, currentMonthPrefix) {
    const catsFull = ['Sondas de Pesquisas', 'Bomba de pesquisa', 'Sondas Poços', 'Bombas de poços', 'Subconjuntos', 'Programação de almoxarifado'];
    return catsFull.map(cat => {
      const p = eqs.filter(e => (e.tipo||'') === cat && isMonth(e.dataLiberacaoPlanejada, currentMonthPrefix)).length;
      const r = eqs.filter(e => (e.tipo||'') === cat && e.status === 'Liberado' && isMonth(e.dataLiberacaoAtual || e.dataLiberacaoPlanejada || e.updatedAt, currentMonthPrefix)).length;
      const pct = p > 0 ? Math.round((r/p)*100) : 0;
      return renderSectorCard(cat, p, r, pct);
    }).join('');
  }

  function renderSectorCard(name, plan, real, pct) {
    const isCritical = pct < 70;
    return `
      <div class="exec-card" style="padding:24px;">
        <div style="font-size:16px; font-weight:700; color:var(--text-primary); margin-bottom:16px;">${name}</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; color:var(--text-secondary);">
          <span>Plan: ${plan}</span>
          <span>Real: ${real}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:24px; font-weight:800; color:${isCritical ? 'var(--color-danger)' : 'var(--color-success)'};">${pct}%</span>
        </div>
        <div class="exec-progress-track">
          <div class="exec-progress-fill" style="width:${Math.min(pct, 100)}%; background:${isCritical ? 'var(--color-danger)' : 'var(--color-success)'};"></div>
        </div>
      </div>
    `;
  }

  function renderCriticalEquipments(atrasados) {
    if(atrasados.length === 0) return `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">Nenhum equipamento atrasado.</td></tr>`;
    return atrasados.slice(0, 5).map(e => `
      <tr>
        <td style="font-weight:700; color:var(--brand-primary-light);">${e.codigo}</td>
        <td>${e.cliente || '-'}</td>
        <td>${e.responsavel || '-'}</td>
        <td>${e.dataLiberacaoPlanejada}</td>
        <td>${e.status}</td>
        <td><span style="background:var(--color-danger-bg); color:var(--color-danger); padding:4px 8px; border-radius:4px; font-size:11px; font-weight:700;">ALTA</span></td>
      </tr>
    `).join('');
  }

  function renderTimelineStep(label, val, isAlert) {
    return `
      <div class="exec-timeline-step">
        <div class="exec-timeline-dot ${isAlert ? 'active' : ''}" style="${isAlert ? 'border-color:var(--color-danger); box-shadow: 0 0 12px var(--color-danger-bg);' : ''}"></div>
        <div class="exec-timeline-label">${label}</div>
        <div class="exec-timeline-val">${val}</div>
      </div>
    `;
  }

  function renderCharts(eqs, tasks, aderenciaAtual, currentMonthPrefix) {
    destroyCharts();
    Chart.defaults.color = '#8EACC8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    // 1. Chart Main (Anual) - Dividido por setor
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
      const ctxMain = document.getElementById(`execChart_${sector.id}`);
      if(ctxMain) {
        const mStr = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const mP = Array(12).fill(0), mR = Array(12).fill(0);
        
        eqs.forEach(e => {
          let tipo = e.tipo || '';
          if (sector.id === 'Outros') {
            if (['Sondas de Pesquisas', 'Sondas Poços', 'Bombas de poços', 'Bomba de pesquisa', 'Subconjuntos', 'Programação de almoxarifado'].includes(tipo)) return;
          } else {
            if (tipo !== sector.name) return;
          }

          if(e.dataLiberacaoPlanejada) { const m = parseInt(e.dataLiberacaoPlanejada.split('-')[1],10); if(m>=1&&m<=12) mP[m-1]++; }
          if(e.status==='Liberado' && (e.dataLiberacaoAtual || e.dataFim)) { const m = parseInt((e.dataLiberacaoAtual||e.dataFim).split('-')[1],10); if(m>=1&&m<=12) mR[m-1]++; }
        });
        
        const adrArr = mStr.map((_, i) => mP[i] ? Math.round((mR[i]/mP[i])*100) : null);
        
        charts[`main_${sector.id}`] = new Chart(ctxMain, {
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
              ctx.font = 'bold 9px Inter, sans-serif';
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
                  ctx.fillText(valStr, position.x, position.y - 8);
                });
              });
              ctx.restore();
            }
          }],
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 10, font: { size: 9 } } }, globalDataLabels: false },
            scales: {
              x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 9 } } },
              y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { font: { size: 9 }, precision: 0 } },
              y1: { type: 'linear', position: 'right', grid: { display: false }, min: 0, max: 120, border: { display: false }, ticks: { font: { size: 9 } } }
            }
          }
        });
      }
    });

    // 2. Status Chart
    const ctxStatus = document.getElementById('execChartStatus');
    if(ctxStatus) {
      const sts = ['Operando', 'Em Manutenção', 'Liberado', 'Paralisado', 'Falta de Peças', 'Backlog', 'Falta de Mão de Obra'];
      const counts = sts.map(s => eqs.filter(e => e.status === s).length);
      charts.status = new Chart(ctxStatus, {
        type: 'doughnut',
        data: { labels: sts, datasets: [{ data: counts, backgroundColor: ['#4CAF50', '#1E88E5', '#00C853', '#F44336', '#FF9800', '#9C27B0', '#795548'], borderWidth: 0 }] },
        plugins: [{
          id: 'customDoughnutLabels',
          afterDraw(chart) {
            const ctx = chart.ctx;
            ctx.save();
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const meta = chart.getDatasetMeta(0);
            meta.data.forEach((element, index) => {
              const val = chart.data.datasets[0].data[index];
              if (val > 0) {
                const pos = element.tooltipPosition();
                ctx.fillText(val, pos.x, pos.y);
              }
            });
            ctx.restore();
          }
        }],
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          cutout: '75%', 
          plugins: { 
            legend: { position: 'right' }
          } 
        }
      });
    }

    // 3. Avanço Chart
    const ctxAvanco = document.getElementById('execChartAvanco');
    if(ctxAvanco) {
      const eqAvancoInProcess = eqs.filter(e => e.status !== 'Liberado' && e.status !== 'Liberada');
      const eqSort = [...eqAvancoInProcess].sort((a,b) => (b.pctAvanco||0) - (a.pctAvanco||0)).slice(0, 5);
      charts.avanco = new Chart(ctxAvanco, {
        type: 'bar',
        data: { labels: eqSort.map(e => e.codigo), datasets: [{ label: 'Avanço (%)', data: eqSort.map(e => e.pctAvanco||0), backgroundColor: '#CE93D8', borderRadius: 8 }] },
        plugins: [{
          id: 'customAvancoLabels',
          afterDraw(chart) {
            const ctx = chart.ctx;
            ctx.save();
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textBaseline = 'middle';
            const meta = chart.getDatasetMeta(0);
            meta.data.forEach((element, index) => {
              const val = chart.data.datasets[0].data[index];
              if (val > 0) {
                if (element.width < 35) {
                  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#333';
                  ctx.textAlign = 'left';
                  ctx.fillText(val + '%', element.x + 6, element.y);
                } else {
                  ctx.fillStyle = '#ffffff';
                  ctx.textAlign = 'right';
                  ctx.fillText(val + '%', element.x - 6, element.y);
                }
              }
            });
            ctx.restore();
          }
        }],
        options: { 
          indexAxis: 'y', 
          responsive: true, 
          maintainAspectRatio: false, 
          plugins: { 
            legend: { display: false },
            globalDataLabels: false
          }, 
          scales: { 
            x: { max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } }, 
            y: { grid: { display: false }, border: { display: false } } 
          } 
        }
      });
    }

    // 4. Pipeline (Etapas Reais do Equipamento)
    const ctxPipe = document.getElementById('execChartPipeline');
    if(ctxPipe) {
      const realStages = ['Check-list de recebimento', 'Em manutenção', 'Teste', 'Lavador', 'Pintura', 'Check-list de liberação', 'Falta de mão de obra', 'Falta de peças', 'Paralisada', 'Backlog', 'Liberada'];
      
      // Contar equipamentos por etapa (apenas aqueles que estão em manutenção ou aguardando)
      const eqsInProcess = eqs.filter(e => e.status !== 'Liberado' && e.status !== 'Operando');
      const pdata = realStages.map(stage => eqsInProcess.filter(e => e.etapaAtual === stage).length);
      
      // Mapear etapas (mostrar todas para visualizar o pipeline completo)
      const stageObjects = realStages.map((s, i) => ({ label: s, count: pdata[i] }));

      charts.pipe = new Chart(ctxPipe, {
        type: 'bar',
        data: { 
          labels: stageObjects.map(o => o.label), 
          datasets: [{ 
            label: 'Equipamentos', 
            data: stageObjects.map(o => o.count), 
            backgroundColor: '#1E88E5', 
            borderRadius: 8,
            barThickness: 24
          }] 
        },
        plugins: [{
          id: 'customBarLabels',
          afterDraw(chart) {
            const ctx = chart.ctx;
            ctx.save();
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            const meta = chart.getDatasetMeta(0);
            meta.data.forEach((element, index) => {
              const val = chart.data.datasets[0].data[index];
              if (val > 0) {
                // position inside the right edge of the bar
                const x = element.x - 6;
                // If bar is too small, move text outside
                if (element.width < 20) {
                  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#333';
                  ctx.textAlign = 'left';
                  ctx.fillText(val, element.x + 6, element.y);
                } else {
                  ctx.fillStyle = '#ffffff';
                  ctx.textAlign = 'right';
                  ctx.fillText(val, x, element.y);
                }
              }
            });
            ctx.restore();
          }
        }],
        options: { 
          indexAxis: 'y', 
          responsive: true, 
          maintainAspectRatio: false, 
          plugins: { 
            legend: { display: false },
            globalDataLabels: false, // Disable the global plugin for this chart
            tooltip: {
              backgroundColor: 'rgba(13, 27, 42, 0.9)',
              titleFont: { family: 'Inter', size: 14, weight: '700' },
              padding: 12,
              cornerRadius: 8
            }
          }, 
          scales: { 
            x: { grid: { display: false }, border: { display: false }, ticks: { display: false } }, 
            y: { grid: { display: false }, border: { display: false }, ticks: { color: '#8EACC8', font: { size: 12, weight: '600' } } } 
          },
          animation: { duration: 1500, easing: 'easeOutQuart' }
        }
      });
    }
  }

  function changeMonth(val) {
    selectedMonth = val;
    render();
    Router.navigate('dashboard', { force: true });
  }
  
  function refresh() {
    render();
    Router.navigate('dashboard', { force: true });
  }

  return { init, render, changeMonth, refresh };
})();
