/* ================================================================
   PLANEJAMENTO DIMAN-BHZ — Modules Batch 3
   Costs, Planning, KPI, Simulator, AI Assistant
   Meeting Mode, Timeline, Lessons, Reports, Audit, Users, Impacts
   ================================================================ */

// ================================================================
// COSTS MODULE
// ================================================================
window.CostsModule = (() => {
  function render() {
    const costs = DB.costs.list();
    const eqs = DB.equipment.list();
    const equipMap = {};
    eqs.forEach(e => { equipMap[e.id] = e.codigo; });

    const totalPl = costs.reduce((s,c)=>s+(c.valorPlanejado||0),0);
    const totalRl = costs.reduce((s,c)=>s+(c.valorRealizado||0),0);
    const devTotal = totalPl ? Math.round((totalRl-totalPl)/totalPl*100) : 0;

    // Per equipment
    const byEq = {};
    costs.forEach(c => {
      if (!byEq[c.equipmentId]) byEq[c.equipmentId] = { pl:0, rl:0 };
      byEq[c.equipmentId].pl += c.valorPlanejado||0;
      byEq[c.equipmentId].rl += c.valorRealizado||0;
    });

    return `<div class="page-container">
      <div class="section-header">
        <div class="section-title"><div class="section-title-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>Centro de Custos</div>
        <button class="btn btn-primary" onclick="CostsModule.openCreate()">+ Novo Lançamento</button>
      </div>

      <!-- Top KPIs -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-5);margin-bottom:var(--space-5);">
        <div class="card" style="text-align:center;padding:var(--space-6);">
          <div style="font-size:var(--text-xs);font-weight:700;text-transform:uppercase;color:var(--text-muted);letter-spacing:.06em;margin-bottom:var(--space-2)">Custo Total Planejado</div>
          <div style="font-size:var(--text-3xl);font-weight:800;color:var(--brand-primary-light)">${formatCurrency(totalPl)}</div>
        </div>
        <div class="card" style="text-align:center;padding:var(--space-6);">
          <div style="font-size:var(--text-xs);font-weight:700;text-transform:uppercase;color:var(--text-muted);letter-spacing:.06em;margin-bottom:var(--space-2)">Custo Total Realizado</div>
          <div style="font-size:var(--text-3xl);font-weight:800;color:${totalRl>totalPl?'var(--color-danger)':'var(--color-success)'}">${formatCurrency(totalRl)}</div>
        </div>
        <div class="card" style="text-align:center;padding:var(--space-6);border-color:${devTotal>10?'rgba(244,67,54,.3)':devTotal>0?'rgba(255,179,0,.3)':'rgba(0,200,83,.3)'};">
          <div style="font-size:var(--text-xs);font-weight:700;text-transform:uppercase;color:var(--text-muted);letter-spacing:.06em;margin-bottom:var(--space-2)">Desvio Total</div>
          <div style="font-size:var(--text-3xl);font-weight:800;color:${devTotal>10?'var(--color-danger)':devTotal>0?'var(--color-warning)':'var(--color-success)'}">${devTotal > 0 ? '+' : ''}${devTotal}%</div>
        </div>
      </div>

      <!-- Per Equipment Table -->
      <div class="card" style="margin-bottom:var(--space-5);">
        <div class="card-header"><div class="card-title">Custos por Equipamento</div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Equipamento</th><th>Planejado</th><th>Realizado</th><th>Desvio</th><th>Semáforo</th></tr></thead>
          <tbody>
            ${Object.entries(byEq).map(([eqId, v]) => {
              const dev = v.pl ? Math.round((v.rl-v.pl)/v.pl*100) : 0;
              const cls = dev > 10 ? 'danger' : dev > 0 ? 'warning' : 'success';
              const icon = dev > 10 ? '🔴' : dev > 0 ? '🟡' : '🟢';
              return `<tr>
                <td style="font-weight:700">${equipMap[eqId]||eqId}</td>
                <td>${formatCurrency(v.pl)}</td>
                <td style="color:${v.rl>v.pl?'var(--color-danger)':'var(--color-success)'};font-weight:700">${formatCurrency(v.rl)}</td>
                <td><span class="badge badge-${cls}">${dev>0?'+':''}${dev}%</span></td>
                <td style="font-size:1.2rem">${icon}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
      </div>

      <!-- Cost entries -->
      <div class="table-wrap"><table>
        <thead><tr><th>Equipamento</th><th>Categoria</th><th>Descrição</th><th>Planejado</th><th>Realizado</th><th>Data</th><th>Ações</th></tr></thead>
        <tbody>
          ${costs.map(c=>`<tr>
            <td>${equipMap[c.equipmentId]||'—'}</td>
            <td><span class="badge badge-ghost">${c.categoria}</span></td>
            <td style="font-size:var(--text-xs)">${c.descricao}</td>
            <td>${formatCurrency(c.valorPlanejado)}</td>
            <td style="color:${c.valorRealizado>c.valorPlanejado?'var(--color-danger)':'var(--color-success)'};font-weight:700">${formatCurrency(c.valorRealizado)}</td>
            <td>${formatDate(c.data)}</td>
            <td><button class="btn btn-danger btn-sm" onclick="CostsModule.delete('${c.id}')"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:12px;height:12px"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397"/></svg></button></td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" id="modal-cost"><div class="modal"><div class="modal-header"><div class="modal-title">Lançamento de Custo</div><button class="modal-close" onclick="closeModal('modal-cost')"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div>
    <div class="modal-body" id="cost-modal-body"></div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('modal-cost')">Cancelar</button><button class="btn btn-primary" onclick="CostsModule.save()">Salvar</button></div></div></div>`;
  }

  function openCreate() {
    const eqs = DB.equipment.list();
    const cats = ['Mão de Obra','Peças','Serviços Terceiros','Frete','Custos Extras'];
    const today = new Date().toISOString().slice(0,10);
    document.getElementById('cost-modal-body').innerHTML = `<div style="display:flex;flex-direction:column;gap:var(--space-4);">
      <div class="form-row"><div class="form-group"><label>Equipamento *</label><select id="cs-eq">${eqs.map(e=>`<option value="${e.id}">${e.codigo}</option>`).join('')}</select></div>
      <div class="form-group"><label>Categoria *</label><select id="cs-cat">${cats.map(c=>`<option>${c}</option>`).join('')}</select></div></div>
      <div class="form-group"><label>Descrição</label><input id="cs-desc" /></div>
      <div class="form-row"><div class="form-group"><label>Valor Planejado (R$)</label><input type="number" id="cs-pl" min="0" step="0.01" /></div>
      <div class="form-group"><label>Valor Realizado (R$)</label><input type="number" id="cs-rl" min="0" step="0.01" /></div></div>
      <div class="form-group"><label>Data</label><input type="date" id="cs-data" value="${today}" /></div>
    </div>`;
    openModal('modal-cost');
  }

  function save() {
    const data = {
      equipmentId: document.getElementById('cs-eq').value,
      categoria: document.getElementById('cs-cat').value,
      descricao: document.getElementById('cs-desc').value,
      valorPlanejado: parseFloat(document.getElementById('cs-pl').value)||0,
      valorRealizado: parseFloat(document.getElementById('cs-rl').value)||0,
      data: document.getElementById('cs-data').value,
    };
    DB.costs.create(data);
    closeModal('modal-cost');
    Router.navigate('costs', { force: true });
    Toast.success('Custo registrado!');
  }

  function _delete(id) {
    const session = window.Auth ? window.Auth.getSession() : null;
    if (!session || (session.perfil !== 'Administrador' && session.perfil !== 'Desenvolvedor')) {
      Toast && Toast.error('Acesso Negado', 'Apenas administradores podem excluir registros.');
      return;
    }
    confirmDialog('Excluir Lançamento', 'Tem certeza?', () => { DB.costs.delete(id); Router.navigate('costs', { force: true }); });
  }

  return { render, openCreate, save, delete: _delete };
})();

// ================================================================
// PLANNING MODULE (Curva de Avanço)
// ================================================================
window.PlanningModule = (() => {
  let planChart = null;

  function render() {
    const eqs = DB.equipment.list();
    const allTasks = DB.tasks.getAll();
    const totalTasks = allTasks.length;
    const doneTasks = allTasks.filter(t=>t.status==='Concluída').length;
    const realizado = totalTasks ? Math.round(doneTasks/totalTasks*100) : 0;
    const planejado = 78;
    const desvio = realizado - planejado;
    const devCls = desvio >= 0 ? 'success' : desvio >= -10 ? 'warning' : 'danger';

    setTimeout(() => {
      if (planChart) { try { planChart.destroy(); } catch(e){} }
      const canvas = document.getElementById('plan-chart');
      if (!canvas || !window.Chart) return;
      const ctx = canvas.getContext('2d');
      const gradPlan = ctx.createLinearGradient(0, 0, 0, 300);
      gradPlan.addColorStop(0, 'rgba(30,136,229,0.3)');
      gradPlan.addColorStop(1, 'rgba(30,136,229,0.0)');

      const gradReal = ctx.createLinearGradient(0, 0, 0, 300);
      gradReal.addColorStop(0, desvio >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)');
      gradReal.addColorStop(1, desvio >= 0 ? 'rgba(16,185,129,0.0)' : 'rgba(239,68,68,0.0)');

      const labels = [];
      const plData = [];
      const rlData = [];
      for (let i = 20; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(`${d.getDate()}/${d.getMonth()+1}`);
        plData.push(Math.min(100, Math.round((20-i)/20*planejado + Math.random()*3)));
        rlData.push(Math.min(100, Math.round((20-i)/20*realizado + Math.random()*2)));
      }
      planChart = new Chart(canvas, {
        type:'line', data: {
          labels,
          datasets: [
            { label:'Planejado', data:plData, borderColor:'rgba(30,136,229,1)', backgroundColor:gradPlan, fill:true, tension:.4, borderWidth:3, pointRadius:2, pointHoverRadius:6 },
            { label:'Realizado', data:rlData, borderColor: desvio >= 0 ? 'rgba(16,185,129,1)' : 'rgba(239,68,68,1)', backgroundColor:gradReal, fill:true, tension:.4, borderWidth:3, pointRadius:4, pointBackgroundColor: desvio >= 0 ? 'rgba(16,185,129,1)' : 'rgba(239,68,68,1)', pointBorderColor:'#fff', pointHoverRadius:7 }
          ]
        },
        options: { 
          responsive:true, 
          maintainAspectRatio:false, 
          interaction: { mode: 'index', intersect: false },
          plugins:{
            tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', titleFont: { family: 'Inter', size: 13 }, bodyFont: { family: 'Inter', size: 13 }, padding: 12, cornerRadius: 8 },
            legend:{labels:{color:'var(--text-secondary)',font:{family:'Inter',size:12, weight:'600'}, usePointStyle: true, boxWidth: 8}}
          }, 
          scales:{
            x:{ticks:{color:'var(--text-muted)',font:{size:11, family:'Inter'}},grid:{color:'var(--border-default)', drawBorder: false}},
            y:{min:0,max:100,ticks:{color:'var(--text-muted)',font:{size:11, family:'Inter'},callback:v=>v+'%'},grid:{color:'var(--border-default)', drawBorder: false, borderDash: [5, 5]}}
          } 
        }
      });
    }, 100);

    return `<div class="page-container">
      <div class="section-header" style="margin-bottom: 24px;"><div class="section-title"><div class="section-title-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25"/></svg></div>Planejamento & Replanejamento</div></div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <!-- Planejado -->
        <div style="background: var(--bg-card, #fff); border: 1px solid var(--border-card, #e2e8f0); border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden;">
          <div style="position: relative; z-index: 2;">
            <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Planejado</div>
            <div style="font-size: 2.75rem; font-weight: 900; color: var(--brand-primary, #3b82f6); line-height: 1; letter-spacing: -0.03em;">${planejado}%</div>
          </div>
          <div style="width: 56px; height: 56px; border-radius: 14px; background: rgba(59, 130, 246, 0.1); color: var(--brand-primary, #3b82f6); display: flex; align-items: center; justify-content: center; position: relative; z-index: 2;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 28px; height: 28px;"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
          </div>
        </div>
        
        <!-- Realizado -->
        <div style="background: var(--bg-card, #fff); border: 1px solid var(--border-card, #e2e8f0); border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden;">
          <div style="position: relative; z-index: 2;">
            <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Realizado</div>
            <div style="font-size: 2.75rem; font-weight: 900; color: var(--color-${devCls}); line-height: 1; letter-spacing: -0.03em;">${realizado}%</div>
          </div>
          <div style="width: 56px; height: 56px; border-radius: 14px; background: var(--color-${devCls}); opacity: 0.1; position: absolute; right: 24px; z-index: 1;"></div>
          <div style="width: 56px; height: 56px; color: var(--color-${devCls}); display: flex; align-items: center; justify-content: center; position: relative; z-index: 2;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 28px; height: 28px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
        </div>

        <!-- Desvio -->
        <div style="background: var(--bg-card, #fff); border: 1px solid var(--border-card, #e2e8f0); border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden;">
          <div style="position: relative; z-index: 2;">
            <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Desvio</div>
            <div style="font-size: 2.75rem; font-weight: 900; color: var(--color-${devCls}); line-height: 1; letter-spacing: -0.03em;">${desvio > 0 ? '+' : ''}${desvio}%</div>
          </div>
          <div style="width: 56px; height: 56px; border-radius: 14px; background: var(--color-${devCls}); opacity: 0.1; position: absolute; right: 24px; z-index: 1;"></div>
          <div style="width: 56px; height: 56px; color: var(--color-${devCls}); display: flex; align-items: center; justify-content: center; position: relative; z-index: 2;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 28px; height: 28px;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
          </div>
        </div>

        <!-- Legenda Status -->
        <div style="background: var(--bg-card, #fff); border: 1px solid var(--border-card, #e2e8f0); border-radius: 16px; padding: 20px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: center; gap: 10px;">
          <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">Status da Curva</div>
          <div style="opacity:${desvio<-15?1:0.4};font-size:0.9rem;display:flex;align-items:center;gap:10px;">
            <div style="width:10px;height:10px;border-radius:50%;background:var(--color-danger);box-shadow:0 0 10px var(--color-danger);"></div>
            <span style="color:var(--text-primary);font-weight:${desvio<-15?700:500};">Crítico (&lt;-15%)</span>
          </div>
          <div style="opacity:${desvio>=-15&&desvio<-5?1:0.4};font-size:0.9rem;display:flex;align-items:center;gap:10px;">
            <div style="width:10px;height:10px;border-radius:50%;background:var(--color-warning);box-shadow:0 0 10px var(--color-warning);"></div>
            <span style="color:var(--text-primary);font-weight:${desvio>=-15&&desvio<-5?700:500};">Atenção (-5% a -15%)</span>
          </div>
          <div style="opacity:${desvio>=-5?1:0.4};font-size:0.9rem;display:flex;align-items:center;gap:10px;">
            <div style="width:10px;height:10px;border-radius:50%;background:var(--color-success);box-shadow:0 0 10px var(--color-success);"></div>
            <span style="color:var(--text-primary);font-weight:${desvio>=-5?700:500};">OK (&gt;-5%)</span>
          </div>
        </div>
      </div>

      <!-- Curva de Avanço Real -->
      <div class="card" style="margin-bottom: 32px; border-radius: 16px; overflow: hidden; border: 1px solid var(--border-card, #e2e8f0); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02), 0 4px 6px -4px rgba(0,0,0,0.02);">
        <div class="card-header" style="border-bottom: 1px solid var(--border-default); background: transparent; padding: 20px 24px;"><div class="card-title" style="font-size: 1.1rem; font-weight: 800; letter-spacing: -0.02em;">📊 Curva de Avanço Real</div></div>
        <div style="position:relative;height:320px;width:100%;padding: 24px;">
          <canvas id="plan-chart"></canvas>
        </div>
      </div>

      <!-- Replanning by equipment -->
      <div class="card" style="border-radius: 16px; overflow: hidden; border: 1px solid var(--border-card, #e2e8f0); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02), 0 4px 6px -4px rgba(0,0,0,0.02);">
        <div class="card-header" style="border-bottom: 1px solid var(--border-default); background: transparent; padding: 20px 24px;"><div class="card-title" style="font-size: 1.1rem; font-weight: 800; letter-spacing: -0.02em;">Histórico de Replanejamentos</div></div>
        <div class="table-wrap" style="padding: 0;">
          <table style="margin: 0; width: 100%; border-collapse: collapse;">
            <thead style="background: transparent;">
              <tr>
                <th style="padding: 16px 24px; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--border-default);">Equipamento</th>
                <th style="padding: 16px 24px; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--border-default);">Cliente</th>
                <th style="padding: 16px 24px; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--border-default);">Data Original</th>
                <th style="padding: 16px 24px; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--border-default);">Status Replan.</th>
                <th style="padding: 16px 24px; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--border-default);">Dias Acumulados</th>
                <th style="padding: 16px 24px; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--border-default);">Última Causa</th>
              </tr>
            </thead>
            <tbody>
              ${eqs.map((e, idx) => {
                const repls = e.replanning || [];
                const totalDays = repls.reduce((s,r) => s + daysBetween(r.dataAnterior, r.novaData), 0);
                const isLast = idx === eqs.length - 1;
                return `<tr style="${!isLast ? 'border-bottom: 1px solid var(--border-default, #e2e8f0);' : ''} transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover, #f1f5f9)'" onmouseout="this.style.background='transparent'">
                  <td style="padding: 16px 24px;"><strong>${e.codigo}</strong></td>
                  <td style="padding: 16px 24px; color: var(--text-secondary); font-weight: 500;">${e.cliente || '—'}</td>
                  <td style="padding: 16px 24px; font-family: var(--font-mono); font-size: 0.85rem; display: flex; align-items: center; gap: 6px; font-weight: 600;">
                    ${formatDate(e.dataLiberacaoPlanejada)} 
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 14px; height: 14px; color: var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                  </td>
                  <td style="padding: 16px 24px;">${repls.length > 0 ? `<span style="background: rgba(245, 158, 11, 0.15); color: #b45309; padding: 6px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700;">${repls.length}× Replanejado</span>` : '<span style="background: rgba(16, 185, 129, 0.15); color: #047857; padding: 6px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700;">No Prazo</span>'}</td>
                  <td style="padding: 16px 24px;">${totalDays > 0 ? `<span style="color: var(--color-danger); font-weight: 800; display: flex; align-items: center; gap: 6px;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> +${totalDays} dias</span>` : '<span style="color: var(--text-muted); font-weight: 500;">—</span>'}</td>
                  <td style="padding: 16px 24px; font-size: 0.85rem; color: var(--text-secondary); max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">${repls.length>0?repls[repls.length-1].motivo:'—'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  }

  function destroy() { if (planChart) { try { planChart.destroy(); } catch(e){} planChart = null; } }
  return { render, destroy };
})();


// ================================================================
// SIMULATOR MODULE
// ================================================================
window.SimulatorModule = (() => {
  let params = { mechanics: 3, electrics: 2, caldeiraria: 1, usinagem: 1, partsArrivalDays: 7, overtime: 0, weekends: false };

  function calcImpact() {
    const eqId = window.GlobalEqFilter;
    const eq = DB.equipment.get(eqId);
    if (!eq) return null;
    const workDaysRemaining = daysBetween(new Date().toISOString().slice(0,10), eq.dataLiberacaoPlanejada || new Date().toISOString().slice(0,10));

    let gainMechanics = parseFloat(((params.mechanics - 3) * 1.5).toFixed(1));
    let gainElectrics = parseFloat(((params.electrics - 2) * 1.2).toFixed(1));
    let gainCaldeiraria = parseFloat(((params.caldeiraria - 1) * 1.0).toFixed(1));
    let gainUsinagem = parseFloat(((params.usinagem - 1) * 1.0).toFixed(1));

    const critParts = DB.parts.getAll().filter(p => p.equipmentId === eqId && p.critica && ['Solicitada','Comprada','Em Transporte'].includes(p.status));
    let gainParts = 0;
    if (critParts.length > 0) {
      const estimatedArrival = 7;
      const actualArrival = params.partsArrivalDays;
      gainParts = Math.max(0, estimatedArrival - actualArrival);
    }

    let gainOvertime = 0;
    if (params.overtime > 0 && workDaysRemaining > 0) {
      gainOvertime = Math.round(params.overtime / 8 * workDaysRemaining * 0.5);
    }

    let gainWeekends = 0;
    if (params.weekends && workDaysRemaining > 0) {
      gainWeekends = Math.round(workDaysRemaining / 5 * 2 * 0.3);
    }

    let totalGain = gainMechanics + gainElectrics + gainCaldeiraria + gainUsinagem + gainParts + gainOvertime + gainWeekends;
    totalGain = parseFloat(totalGain.toFixed(1));
    
    const today = new Date().toISOString().slice(0,10);
    const newDate = addDays(eq.dataLiberacaoPlanejada || today, -Math.round(totalGain));

    return { gainMechanics, gainElectrics, gainCaldeiraria, gainUsinagem, gainParts, gainOvertime, gainWeekends, totalGain, newDate, workDaysRemaining, eq };
  }

  function render() {
    const eqId = window.GlobalEqFilter;
    const eqs = DB.equipment.list().filter(e => e.status === 'Em Manutenção');
    const impact = eqId ? calcImpact() : null;

    return `<div class="page-container">
      <div class="section-header"><div class="section-title"><div class="section-title-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.255 3A23.933 23.933 0 0121 12c0 3.183-.62 6.22-1.745 9M8.25 8.885l1.444-.89a.75.75 0 011.105.402l2.402 7.214a.75.75 0 001.104.401l1.445-.889m-8.25.75l.213.09a1.687 1.687 0 002.062-.617l4.45-6.676a1.688 1.688 0 012.062-.618l.213.09"/></svg></div>Simulador de Liberação</div></div>
      <div style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--space-5)">Simule o impacto de alterações de recursos na data de liberação do equipamento</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);">
        <!-- Parameters panel -->
        <div class="card">
          <div class="card-header"><div class="card-title">⚙️ Parâmetros da Simulação</div></div>
          <div style="display:flex;flex-direction:column;gap:var(--space-5);">
            <div class="form-group"><label style="margin-bottom: 8px; display: block; font-weight: 600; color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Equipamento *</label>
              ${(() => {
                let groups = {};
                eqs.forEach(e => {
                  let cod = e.codigo || '';
                  let prefix = cod.split(/[\-\d]/)[0].trim().toUpperCase();
                  if (!prefix) prefix = 'OUTROS';
                  if (!groups[prefix]) groups[prefix] = [];
                  groups[prefix].push(e);
                });
                const sortedGroups = Object.keys(groups).sort();
                const options = sortedGroups.map(groupName => {
                  const groupOptions = groups[groupName].map(e => {
                    const cod = e.codigo || '';
                    const nom = e.cliente || '';
                    const displayName = (cod.trim() === nom.trim() || nom === '') ? cod : `${cod} - ${nom}`;
                    return `<option value="${e.id}" ${eqId===e.id?'selected':''}>${displayName}</option>`;
                  }).join('');
                  return `<optgroup label="${groupName}">${groupOptions}</optgroup>`;
                }).join('');

                return `
                <div style="position: relative; width: 100%; background: var(--bg-card, #fff); border-radius: 8px; border: 1px solid var(--border-card, #e2e8f0);">
                  <div style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; z-index: 2;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <select class="input" style="width: 100%; padding-left: 42px; padding-top: 10px; padding-bottom: 10px; font-weight: 600; font-size: 0.95rem; border: none; background-color: transparent; color: var(--text-primary); cursor: pointer; appearance: none;" onchange="SimulatorModule.setEq(this.value)">
                    <option value="">Pesquisar e selecionar equipamento...</option>
                    ${options}
                  </select>
                  <div style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--brand-primary);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>
                  </div>
                </div>`;
              })()}
            </div>
            ${eqId ? `
            <div>
              <label>Mecânicos: <strong id="sim-mech-val">${params.mechanics}</strong></label>
              <input type="range" min="0" max="12" value="${params.mechanics}" oninput="SimulatorModule.setParam('mechanics',+this.value);document.getElementById('sim-mech-val').textContent=this.value" style="width:100%;margin-top:var(--space-2);" />
            </div>
            <div>
              <label>Eletricistas: <strong id="sim-elec-val">${params.electrics}</strong></label>
              <input type="range" min="0" max="8" value="${params.electrics}" oninput="SimulatorModule.setParam('electrics',+this.value);document.getElementById('sim-elec-val').textContent=this.value" style="width:100%;margin-top:var(--space-2);" />
            </div>
            <div>
              <label>Caldeiraria: <strong id="sim-cald-val">${params.caldeiraria}</strong></label>
              <input type="range" min="0" max="8" value="${params.caldeiraria}" oninput="SimulatorModule.setParam('caldeiraria',+this.value);document.getElementById('sim-cald-val').textContent=this.value" style="width:100%;margin-top:var(--space-2);" />
            </div>
            <div>
              <label>Usinagem: <strong id="sim-usin-val">${params.usinagem}</strong></label>
              <input type="range" min="0" max="8" value="${params.usinagem}" oninput="SimulatorModule.setParam('usinagem',+this.value);document.getElementById('sim-usin-val').textContent=this.value" style="width:100%;margin-top:var(--space-2);" />
            </div>
            <div class="form-group"><label>Chegada das Peças Críticas (dias)</label>
              <input type="number" min="1" max="60" value="${params.partsArrivalDays}" onchange="SimulatorModule.setParam('partsArrivalDays',+this.value)" /></div>
            <div>
              <label>Horas Extras por Dia: <strong id="sim-ot-val">${params.overtime}h</strong></label>
              <input type="range" min="0" max="4" value="${params.overtime}" oninput="SimulatorModule.setParam('overtime',+this.value);document.getElementById('sim-ot-val').textContent=this.value+'h'" style="width:100%;margin-top:var(--space-2);" />
            </div>
            <div class="checkbox-wrap"><input type="checkbox" id="sim-wk" ${params.weekends?'checked':''} onchange="SimulatorModule.setParam('weekends',this.checked)" /><label for="sim-wk">Trabalhar nos Fins de Semana</label></div>
            ` : '<div class="empty-state" style="padding:var(--space-8)"><p>Selecione um equipamento para começar</p></div>'}
          </div>
        </div>

        <!-- Results panel -->
        <div id="sim-results-container">
          ${renderResultsPanel(impact)}
        </div>
      </div>
    </div>`;
  }

  function renderResultsPanel(impact) {
    if (!impact) {
      return '<div class="card"><div class="empty-state" style="padding:var(--space-8)"><p>Selecione um equipamento e ajuste os parâmetros para ver a simulação</p></div></div>';
    }
    
    return `
      <div class="card" style="margin-bottom:var(--space-4);">
        <div class="card-header"><div class="card-title">📋 Estado Atual</div></div>
        <div style="display:flex;flex-direction:column;gap:var(--space-2);">
          <div style="display:flex;justify-content:space-between;"><span style="font-size:var(--text-sm);color:var(--text-muted)">Data Original 🔒</span><strong style="color:var(--color-danger)">${formatDate(impact.eq.dataLiberacaoPlanejada)}</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="font-size:var(--text-sm);color:var(--text-muted)">Dias Restantes</span><strong>${impact.workDaysRemaining} dias</strong></div>
          <div style="display:flex;justify-content:space-between;"><span style="font-size:var(--text-sm);color:var(--text-muted)">Avanço Atual</span><strong style="color:var(--brand-primary-light)">${impact.eq.pctAvanco||0}%</strong></div>
        </div>
      </div>

      <div class="card" style="border-color:${impact.totalGain>0?'rgba(0,200,83,.3)':'rgba(244,67,54,.3)'};background:${impact.totalGain>0?'rgba(0,200,83,.05)':'rgba(244,67,54,.05)'};">
        <div class="card-header"><div class="card-title">🎯 Resultado da Simulação</div></div>
        <div style="text-align:center;padding:var(--space-4);">
          <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-2)">Nova Data de Liberação</div>
          <div style="font-size:2.5rem;font-weight:900;color:${impact.totalGain>0?'var(--color-success)':'var(--color-danger)'}">${formatDate(impact.newDate)}</div>
          <div style="font-size:var(--text-xl);font-weight:700;color:${impact.totalGain>0?'var(--color-success)':'var(--color-danger)'};margin-top:var(--space-2);">${impact.totalGain > 0 ? `⬆️ Antecipa ${impact.totalGain} dias` : impact.totalGain < 0 ? `⬇️ Atrasa ${Math.abs(impact.totalGain)} dias` : '= Sem alteração'}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-2);margin-top:var(--space-3);">
          ${[
            {label:'Impacto dos Mecânicos', gain: impact.gainMechanics},
            {label:'Impacto dos Eletricistas', gain: impact.gainElectrics},
            {label:'Impacto da Caldeiraria', gain: impact.gainCaldeiraria},
            {label:'Impacto da Usinagem', gain: impact.gainUsinagem},
            {label:'Impacto das Peças', gain: impact.gainParts},
            {label:'Impacto das Horas Extras', gain: impact.gainOvertime},
            {label:'Impacto dos Fins de Semana', gain: impact.gainWeekends},
          ].map(item=>`<div style="display:flex;justify-content:space-between;font-size:var(--text-sm);">
            <span style="color:var(--text-muted)">${item.label}</span>
            <strong style="color:${item.gain>0?'var(--color-success)':item.gain<0?'var(--color-danger)':'var(--text-muted)'}">${item.gain>0?'-'+item.gain+' dias':item.gain<0?'+'+Math.abs(item.gain)+' dias':'0'}</strong>
          </div>`).join('')}
        </div>
      </div>
      <div style="margin-top:var(--space-3);padding:var(--space-3);background:var(--bg-base);border-radius:var(--radius-md);font-size:var(--text-xs);color:var(--text-muted);">
        ⚠️ NOTA: A Data Planejada Original não pode ser alterada. A simulação mostra apenas uma estimativa.
      </div>
    `;
  }

  function setEq(id) { 
    window.setGlobalEqFilter(id); 
    if (window.Router) window.Router.navigate('simulator', { force: true });
  }

  function setParam(key, val) { 
    params[key] = val; 
    const eqId = window.GlobalEqFilter; 
    if (eqId) { 
      const impact = calcImpact(); 
      if (impact) { 
        const container = document.getElementById('sim-results-container');
        if (container) {
          container.innerHTML = renderResultsPanel(impact);
        }
      } 
    } 
  }
  return { render, setEq, setParam };
})();

// ================================================================
// AI ASSISTANT MODULE
// ================================================================
window.AIAssistant = (() => {
  let userName = 'Usuário';
  if (window.Auth) {
    const session = window.Auth.getSession();
    if (session && session.nome) userName = session.nome.split(' ')[0];
  }

  const messages = [{ role:'ai', content:`Olá ${userName}! Sou o Assistente de IA avançado do **PLANEJAMENTO DIMAN-BHZ**. Posso analisar dados em tempo real e responder perguntas detalhadas sobre equipamentos, tarefas, restrições, peças, produtividade, custos e riscos. **Importante:** Fui programado exclusivamente para tratar de dados operacionais deste sistema. Como posso ajudar na sua gestão hoje?` }];

  function normalize(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  }

  function extractEquipments(query) {
    const eqs = window.DB && DB.equipment ? DB.equipment.list() : [];
    const q = normalize(query);
    return eqs.filter(e => {
      const code = normalize(e.codigo);
      if (q.includes(code)) return true;
      const codeWithoutDash = code.replace(/[-\s]/g, '');
      if (q.includes(codeWithoutDash)) return true;
      
      const numMatch = code.match(/\d+/);
      if (numMatch && numMatch[0].length >= 2) {
        const num = numMatch[0];
        const regex = new RegExp(`\\b${num}\\b`);
        if (regex.test(q)) return true;
      }
      return false;
    });
  }

  function detectIntents(q) {
    q = normalize(q);
    const intents = [];
    if (/atraso|atrazo|atrasad|demora|motivo|por.*que.*atras|replaneja/.test(q)) intents.push('delay');
    if (/libera|entrega|previsa|prazo|quando|termina|conclui/.test(q)) intents.push('liberation');
    if (/risco|perigo|alerta|critico|citico|caminho.*critico|caminho.*citico/.test(q)) intents.push('risk');
    if (/peca|pesa|material|componente|comprad|solicitad|almoxarifado|sensor|motor|bomba|cilindro/.test(q)) intents.push('parts');
    if (/restrica|bloqueio|pendencia|impede|impedimento/.test(q)) intents.push('restrictions');
    if (/produtiv|eficienc|mao.*obra|equipe|mecanic|soldador|ajudante|funcionar/.test(q)) intents.push('productivity');
    if (/feria|atestado|falta.*funcionar|falta.*mecanic|falta.*equipe|falta.*pessoal|ausencia|atraso.*funcionar/.test(q)) intents.push('attendance');
    if (/custo|gasto|financeiro|orcamento|valor|preco|comprar/.test(q)) intents.push('costs');
    if (/resumo|geral|status|panorama|visao.*geral|oficina|como.*esta|tudo/.test(q)) intents.push('summary');
    if (/quant|historico|liberad|mes|junho|julho|agosto/.test(q)) intents.push('history');
    if (/ola|oi|bom.*dia|boa.*tarde|boa.*noite|ola.*assistente/.test(q)) intents.push('greeting');
    if (/internet|web|site|anuncio|manual|esquema|circuito|eletrico|hidraulico|pdf|baixar|download|google|mercado.*livre|procure|pesquise|busque|ache|comprar/.test(q)) intents.push('web_search');
    return intents;
  }

  function processQuery(query) {
    const intents = detectIntents(query);
    let matchedEqs = extractEquipments(query);
    
    // AI Context Memory
    if (matchedEqs.length > 0) {
      lastMentionedEqs = matchedEqs;
    } else if (lastMentionedEqs.length > 0 && /ela|ele|esse|essa|desta|deste|esta|este|atrasad|status|peca|pesa|porque|motivo/.test(normalize(query))) {
      matchedEqs = lastMentionedEqs;
    }
    
    const allTasks = window.DB && DB.tasks ? DB.tasks.getAll() : [];
    const parts = window.DB && DB.parts ? DB.parts.getAll() : [];
    const restrictions = window.DB && DB.restrictions ? DB.restrictions.getAll().filter(r => r.status === 'Aberta') : [];
    const costs = window.DB && DB.costs ? DB.costs.getAll() : [];
    const eqsList = window.DB && DB.equipment ? DB.equipment.list() : [];

    if (matchedEqs.length === 0 && !intents.some(i => ['summary','productivity','costs','attendance','restrictions','history'].includes(i))) {
      return `🤖 **Aviso do Sistema Neural**\n\nDesculpe, não consegui processar essa pergunta específica com os dados locais e a rede neural da nuvem está inacessível no momento.\n\nVocê pode tentar reformular a pergunta ou me consultar sobre o **resumo da oficina**, **peças críticas**, ou o **status de um equipamento** específico (ex: SSM-265).`;
    }

    let resp = '';

    if (matchedEqs.length === 0 && intents.includes('history')) {
      const liberados = eqsList.filter(e => e.status === 'Liberado');
      resp += `🤖 **Análise Histórica**\n\n`;
      resp += `Até o momento, temos um total de **${liberados.length} equipamento(s)** marcados como "Liberado" na base de dados ativa.\n`;
      if (liberados.length > 0) {
        resp += `\nAlguns dos últimos equipamentos liberados:\n`;
        liberados.slice(-5).forEach(e => {
          resp += `• **${e.codigo}** (${e.cliente || 'Sem cliente'})\n`;
        });
      }
      return resp;
    }

    if (matchedEqs.length > 0) {
      matchedEqs.forEach(eq => {
        resp += `📊 **Análise do Equipamento: ${eq.codigo}** (${eq.cliente})\n`;
        resp += `• **Status atual:** ${eq.status} | **Avanço físico:** ${eq.pctAvanco || 0}%\n`;
        
        const eqRestr = restrictions.filter(r => r.equipmentId === eq.id);
        const eqParts = parts.filter(p => p.equipmentId === eq.id && ['Solicitada','Comprada','Em Transporte'].includes(p.status));
        const eqCritParts = eqParts.filter(p => p.critica);
        const repls = eq.replanning || [];
        const eqCosts = costs.filter(c => c.equipmentId === eq.id);
        const totalRealizado = eqCosts.reduce((s,c) => s+c.valorRealizado, 0);

        const totalDelay = repls.reduce((s,r) => s+window.daysBetween(r.dataAnterior,r.novaData),0);
        if (totalDelay > 0) {
          resp += `• **Atraso Acumulado:** ${totalDelay} dias identificados ao longo de ${repls.length} replanejamento(s).\n`;
          resp += `• **Última Causa Registrada:** ${repls[repls.length-1].motivo}\n`;
        } else if (eq.dataLiberacaoPlanejada) {
          const daysToLib = window.daysBetween(new Date().toISOString().slice(0,10), eq.dataLiberacaoPlanejada);
          if (daysToLib < 0) {
            resp += `• **Motivo do Atraso:** O equipamento encontra-se ATRASADO em ${Math.abs(daysToLib)} dias em relação à data planejada, porém **nenhum motivo formal de replanejamento foi registrado no sistema** pela equipe técnica.\n`;
          }
        }
        if (eq.dataLiberacaoAtual || eq.dataLiberacaoPlanejada) {
          const datePrev = eq.dataLiberacaoAtual || eq.dataLiberacaoPlanejada;
          const daysToLib = window.daysBetween(new Date().toISOString().slice(0,10), datePrev);
          if (daysToLib >= 0) {
            resp += `• **Previsão de Liberação:** ${window.formatDate(datePrev)} (em ${daysToLib} dias).\n`;
          }
        }

        if (eqRestr.length > 0) {
          resp += `\n🚫 **Restrições Impeditivas:**\n`;
          eqRestr.forEach(r => resp += `  - [${r.tipo}] ${r.descricao}\n`);
        } else if (intents.includes('restrictions')) {
          resp += `\n✅ Nenhuma restrição aberta no momento para este equipamento.\n`;
        }

        if (eqParts.length > 0) {
          resp += `\n📦 **Lista Detalhada de Peças Pendentes (${eqParts.length}):**\n`;
          eqParts.forEach(p => {
            const crit = p.critica ? '🚨 [CRÍTICA] ' : '';
            resp += `  - ${crit}${p.descricao} (Qtd: ${p.quantidade})\n    Status: ${p.status} | Previsão: ${window.formatDate(p.prazoEntrega)}\n`;
          });
        } else if (intents.includes('parts')) {
          resp += `\n✅ Nenhuma peça pendente aguardando entrega.\n`;
        }

        const eqTasks = allTasks.filter(t => t.equipmentId === eq.id);
        const tasksEmAndamento = eqTasks.filter(t => t.status === 'Em Andamento');
        if (tasksEmAndamento.length > 0) {
          resp += `\n⚙️ **Trabalho em Execução Neste Momento:**\n`;
          tasksEmAndamento.forEach(t => {
            const workers = window.DB && DB.workforce ? DB.workforce.list().filter(w => w.currentTaskId === t.id && (w.currentState === 'Trabalhando' || w.currentState === 'Em Pausa')) : [];
            const workerNames = workers.length > 0 ? workers.map(w => `${w.nome} (${w.currentState})`).join(', ') : (t.responsavel || 'Sem executante logado');
            resp += `  - **${t.descricao}** [${t.disciplina}]\n    Executante(s): ${workerNames}\n`;
          });
        } else {
          resp += `\n⚙️ **Nenhuma tarefa sendo executada ativamente neste momento.**\n`;
        }

        const tasksPausadas = eqTasks.filter(t => t.status === 'Pausada' || t.status === 'Aguardando Peça' || t.status === 'Aguardando Setor');
        if (tasksPausadas.length > 0) {
          resp += `\n⏸️ **Tarefas Pausadas/Aguardando (${tasksPausadas.length}):**\n`;
          tasksPausadas.slice(0, 5).forEach(t => {
            resp += `  - ${t.descricao} - Motivo: ${t.pauseReason || t.status}\n`;
          });
          if (tasksPausadas.length > 5) resp += `  - ... e mais ${tasksPausadas.length - 5} tarefa(s) pausada(s).\n`;
        }

        if (totalRealizado > 0) {
          resp += `\n💰 **Custo Realizado:** R$ ${totalRealizado.toFixed(2)}\n`;
        }

        resp += `\n💡 **Diagnóstico IA:** `;
        if (eq.status === 'Concluído') resp += `Equipamento finalizado sem pendências ativas.`;
        else if (eqRestr.length > 0 || eqCritParts.length > 0) resp += `O equipamento encontra-se em Risco Alto de atraso devido a ${eqRestr.length} restrições e ${eqCritParts.length} peças críticas. Recomenda-se acompanhamento diário com Suprimentos e priorização pela equipe técnica.`;
        else resp += `O andamento está dentro da normalidade operacional, sem bloqueios críticos mapeados.`;
        resp += `\n\n`;
      });
      return resp;
    }

    if (intents.includes('summary')) {
      const stats = DB.kpi.getEquipmentStats();
      const eqs = DB.equipment.list();
      resp += `🏢 **Panorama Operacional DIMAN-BHZ**\n\n`;
      resp += `**Operação:**\n`;
      resp += `• **${stats.emManutencao}** em manutenção ativa.\n`;
      resp += `• **${stats.liberados}** equipamentos liberados.\n`;
      resp += `• **${stats.bloqueados}** paralisados / aguardando peças.\n`;
      resp += `• Avanço Geral da Oficina: **${stats.pctAvancoGeral}%**\n\n`;
      
      const activeRestr = restrictions.length;
      const critParts = parts.filter(p => p.critica && ['Solicitada','Comprada','Em Transporte'].includes(p.status)).length;
      resp += `**Riscos & Bloqueios:**\n`;
      resp += `• **${activeRestr}** restrições ativas no momento.\n`;
      resp += `• **${critParts}** peças críticas atrasando cronogramas.\n\n`;

      const lateEqs = eqs.filter(e => e.status === 'Em Manutenção' && (e.dataLiberacaoAtual || e.dataLiberacaoPlanejada) && window.daysBetween(new Date().toISOString().slice(0,10), e.dataLiberacaoAtual || e.dataLiberacaoPlanejada) < 0);
      if (lateEqs.length > 0) {
        resp += `⚠️ **Equipamentos Atrasados:**\n`;
        lateEqs.forEach(e => resp += `  - ${e.codigo} (Avanço: ${e.pctAvanco||0}%)\n`);
      }
      return resp;
    }

    if (intents.includes('productivity') || intents.includes('attendance')) {
      const wf = window.DB && DB.workforce ? DB.workforce.list() : [];
      const vacs = window.DB && DB.vacations ? DB.vacations.list() : [];
      resp += `👥 **Análise de Mão de Obra e Produtividade**\n\n`;
      resp += `• **Efetivo Total:** ${wf.length} colaboradores cadastrados.\n`;
      
      const onVacation = vacs.filter(v => window.daysBetween(v.dataFim, new Date().toISOString().slice(0,10)) <= 0 && window.daysBetween(new Date().toISOString().slice(0,10), v.dataInicio) <= 0);
      if (onVacation.length > 0) {
        resp += `• **Colaboradores em Férias/Afastamento:** ${onVacation.length}\n`;
        onVacation.forEach(v => {
          const w = wf.find(wk => wk.id === v.workerId);
          if (w) resp += `  - ${w.nome} (Retorno em: ${window.formatDate(v.dataFim)})\n`;
        });
      }
      resp += `\nA alocação de mão de obra afeta diretamente o tempo de execução. Manter as metas do Prêmio Produção atreladas à presença é vital para a produtividade da equipe.`;
      return resp;
    }

    if (intents.includes('restrictions')) {
      if (!restrictions.length) return '✅ O sistema não acusa nenhuma restrição bloqueando as manutenções no momento. Cenário ideal!';
      resp += `🚫 **Mapeamento de Restrições Ativas (${restrictions.length})**\n\n`;
      const byType = {};
      restrictions.forEach(r => { byType[r.tipo] = (byType[r.tipo]||0)+1; });
      Object.entries(byType).forEach(([t,c]) => resp += `• **${t}:** ${c} ocorrência(s)\n`);
      
      resp += `\n**Impacto Crítico:** ${restrictions.filter(r=>r.impactoCaminhosCriticos).length} restrições estão no Caminho Crítico da oficina, atrasando as datas de entrega finais.\n`;
      return resp;
    }

    if (intents.includes('risk') || intents.includes('delay')) {
      const atRisk = DB.equipment.list().filter(e => {
        if (e.status !== 'Em Manutenção') return false;
        const openRestr = restrictions.filter(r => r.equipmentId === e.id);
        const critParts = parts.filter(p => p.equipmentId === e.id && p.critica && ['Solicitada','Comprada','Em Transporte'].includes(p.status));
        return openRestr.length > 0 || critParts.length > 0;
      });
      if (!atRisk.length) return '✅ A IA não detectou equipamentos com alto risco de atraso baseado nas restrições e peças atuais.';
      resp += `⚠️ **Equipamentos com Alto Risco de Atraso (${atRisk.length})**\n\n`;
      atRisk.forEach(e => {
        resp += `🔴 **${e.codigo}**: `;
        const issues = [];
        const restrCount = restrictions.filter(r => r.equipmentId === e.id).length;
        const partCount = parts.filter(p => p.equipmentId === e.id && p.critica && ['Solicitada','Comprada','Em Transporte'].includes(p.status)).length;
        if (restrCount) issues.push(`${restrCount} restrição(ões)`);
        if (partCount) issues.push(`${partCount} peça(s) crítica(s)`);
        resp += issues.join(' e ') + '.\n';
      });
      return resp;
    }
    
    if (intents.includes('costs')) {
      const pendingParts = parts.filter(p => ['Solicitada','Comprada','Em Transporte'].includes(p.status));
      const totalParts = pendingParts.reduce((s,p) => s + (parseFloat(p.custoEstimado) || 0), 0);
      const openServices = window.DB && DB.services ? DB.services.getAll().filter(s=>s.status!=='Concluído') : [];
      const totalServices = openServices.reduce((s,sv) => s + (parseFloat(sv.custo) || 0), 0);
      
      resp += `💰 **Visão Geral de Custos Pendentes**\n\n`;
      resp += `• **Peças Pendentes:** ${pendingParts.length} item(s) aguardando (Aprox. R$ ${Number(totalParts).toFixed(2)})\n`;
      resp += `• **Serviços Terceiros em Aberto:** ${openServices.length} serviço(s) (Aprox. R$ ${Number(totalServices).toFixed(2)})\n`;
      
      resp += `\nLembrete: Esta é uma visão aproximada baseada nos orçamentos atuais. Para cotações externas, por favor consulte a web.`;
      return resp;
    }

    if (intents.includes('parts')) {
      const pendingParts = parts.filter(p => ['Solicitada','Comprada','Em Transporte'].includes(p.status));
      if (!pendingParts.length) return '✅ Nenhuma peça pendente de entrega no momento para a oficina.';
      
      let resp = `📦 **Panorama de Peças Pendentes (${pendingParts.length})**\n\n`;
      const critParts = pendingParts.filter(p => p.critica);
      
      if (critParts.length > 0) {
        resp += `⚠️ **ATENÇÃO - Peças Críticas (${critParts.length}):**\n`;
        critParts.forEach(p => {
          const eq = DB.equipment.list().find(e => e.id === p.equipmentId);
          resp += `• [${eq ? eq.codigo : '?'}] ${p.descricao} (${p.status}) - Chega em: ${window.formatDate(p.prazoEntrega)}\n`;
        });
        resp += `\n`;
      }
      
      const normalParts = pendingParts.filter(p => !p.critica);
      if (normalParts.length > 0) {
        resp += `**Outras Peças Aguardadas:** ${normalParts.length} item(ns).\n`;
      }
      return resp;
    }

    return `🤖 **Processamento Finalizado**\n\nNão consegui cruzar a sua pergunta exata com um de nossos relatórios de prateleira, porém afirmo o seguinte status atual:\nExistem **${DB.equipment.list().filter(e=>e.status==='Em Manutenção').length}** equipamentos em manutenção na oficina.\n\nPara perguntas complexas, experimente incluir o código do equipamento (ex: SSM-288) ou especificar claramente o que busca (Peças, Restrições, Produtividade, etc). Lembrando: atuo estritamente nos dados de Manutenção e Planejamento.`;
  }

  function addMessage(role, content) {
    messages.push({ role, content });
    const container = document.getElementById('ai-chat-messages');
    if (container) {
      const div = document.createElement('div');
      div.className = `ai-message ${role}`;
      div.innerHTML = `
        <div style="font-size:1.3rem;flex-shrink:0">${role === 'ai' ? '🤖' : '👤'}</div>
        <div class="ai-message-content" style="background:${role === 'ai' ? 'var(--bg-base)' : 'rgba(21,101,192,0.2)'};border-radius:var(--radius-md);padding:var(--space-3);font-size:var(--text-sm);color:${role === 'ai' ? 'var(--text-secondary)' : '#ffffff'};line-height:1.6;max-width:90%;overflow-x:auto;">
          ${role === 'user' ? content.replace(/\n/g,'<br>') : (window.marked ? window.marked.parse(content) : content.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/•/g,'&bull;'))}
        </div>
      `;
      div.style.cssText = 'display:flex;gap:var(--space-3);align-items:flex-start;margin-bottom:var(--space-3);animation:fadeInUp .3s ease;';
      
      // Force all links to open in a new tab
      const links = div.querySelectorAll('a');
      links.forEach(l => {
        l.setAttribute('target', '_blank');
        l.setAttribute('rel', 'noopener noreferrer');
      });

      if (role === 'user') {
        div.style.flexDirection = 'row-reverse';
        div.children[1].style.background = 'var(--brand-primary)';
      }
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }
  }

  function buildSystemContext(query) {
    const intentTokens = window.DIMAN_INTENT_PARSER ? window.DIMAN_INTENT_PARSER.parseIntent(query) : [];
    if (intentTokens.length > 0) {
      lastMentionedEqs = DB.equipment.list().filter(e => intentTokens.includes(e.codigo));
    }
    return window.DIMAN_CONTEXT_BUILDER ? window.DIMAN_CONTEXT_BUILDER.buildFullSystemPrompt(query, intentTokens) : 'Sem contexto.';
  }

  async function fetchPollinationsAI(query, contextData, signal) {
    if (window.DIMAN_CONVERSATION_MEMORY) {
       window.DIMAN_CONVERSATION_MEMORY.addMessage('user', query);
    }
    
    const history = window.DIMAN_CONVERSATION_MEMORY ? window.DIMAN_CONVERSATION_MEMORY.getHistory() : [{role:'user', content:query}];
    
    // Convert memory to Pollinations AI format
    const apiMessages = [
      { role: 'system', content: contextData }
    ];
    
    // Limit history to last 4 to avoid token bloat
    const recentHistory = history.slice(-4);
    
    recentHistory.forEach(m => {
       apiMessages.push({ role: m.role==='ai'?'assistant':'user', content: m.content });
    });

    const models = ['openai', 'claude', 'openai-large'];
    let rawText = '';
    
    for (let i = 0; i < models.length; i++) {
        try {
            const res = await fetch('https://text.pollinations.ai/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: apiMessages,
                model: models[i],
                temperature: 0.6,
                seed: Math.floor(Math.random() * 1000000),
                jsonMode: false
              }),
              signal: signal
            });
            
            if (res.ok) {
                rawText = await res.text();
                break;
            }
        } catch(e) {
            if (e.name === 'AbortError' || e === 'TIMEOUT') throw e;
            console.warn(`Model ${models[i]} failed, trying next...`);
        }
    }
    
    if (!rawText) throw new Error("Servidor Neural Indisponível em todos os modelos");

    let aiText = rawText;
    
    // Try to parse if it's JSON (Pollinations sometimes returns JSON containing reasoning and content)
    try {
        const parsed = JSON.parse(rawText);
        if (parsed.content) {
            aiText = parsed.content;
        } else if (parsed.reasoning && !parsed.content) {
            aiText = "❌ O motor neural encontrou um problema ao processar esta requisição específica. Por favor, tente perguntar de uma maneira diferente.";
        } else if (parsed.message && parsed.message.content) {
            aiText = parsed.message.content;
        }
    } catch(e) {
        // Not a JSON, use raw text
    }
    
    // Remove Pollinations ad/watermark
    aiText = aiText.replace(/Support Pollinations\.AI:[\s\S]*?accessible for everyone\./gi, '').trim();

    if (window.DIMAN_CONVERSATION_MEMORY) {
       window.DIMAN_CONVERSATION_MEMORY.addMessage('ai', aiText);
    }
    return aiText;
  }

  async function sendQuery(rawQuery) {
    if (!rawQuery?.trim()) return;
    const input = document.getElementById('ai-input');
    if (input) {
      input.value = '';
      input.style.height = '44px';
    }
    
    // Parse intenções (ex: "Hoje", "Atrasadas")
    const query = window.DIMAN_INTENT_PARSER ? window.DIMAN_INTENT_PARSER.expandShortQuery(rawQuery) : rawQuery;
    
    addMessage('user', rawQuery);

    const container = document.getElementById('ai-chat-messages');
    const typing = document.createElement('div');
    typing.id = 'ai-typing';
    typing.style.cssText = 'display:flex;gap:var(--space-2);align-items:center;padding:var(--space-3);animation:fadeInUp .3s ease;';
    typing.innerHTML = `
      <style>
        @keyframes ai-pulse-dot { 0%, 80%, 100% { transform: scale(0); opacity: 0.3; } 40% { transform: scale(1); opacity: 1; } }
        .ai-dot { width: 6px; height: 6px; background-color: var(--text-secondary); border-radius: 50%; display: inline-block; animation: ai-pulse-dot 1.4s infinite ease-in-out both; margin: 0 2px; }
        .ai-dot:nth-child(1) { animation-delay: -0.32s; }
        .ai-dot:nth-child(2) { animation-delay: -0.16s; }
        .ai-dot:nth-child(3) { animation-delay: 0s; }
      </style>
      <div style="font-size:1.3rem;">🤖</div>
      <div style="display:flex;align-items:center;margin-left:4px;height:24px;">
        <div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div>
      </div>
    `;
    container?.appendChild(typing);
    container.scrollTop = container.scrollHeight;

    const sendBtn = document.getElementById('ai-send-btn');
    const cancelBtn = document.getElementById('ai-cancel-btn');
    if (sendBtn) sendBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'block';

    currentAbortController = new AbortController();
    
    let wasTimeout = false;
    // Auto-timeout after 20s
    const timeoutId = setTimeout(() => {
      if (currentAbortController) {
        wasTimeout = true;
        currentAbortController.abort();
      }
    }, 20000);

    try {
      const dbContext = buildSystemContext(query);
      const responseText = await fetchPollinationsAI(query, dbContext, currentAbortController.signal);
      clearTimeout(timeoutId);
      document.getElementById('ai-typing')?.remove();
      addMessage('ai', responseText);
      restoreSendButton();
    } catch(err) {
      clearTimeout(timeoutId);
      
      if (wasTimeout) {
          document.getElementById('ai-typing')?.remove();
          addMessage('ai', '🤖 **Timeout de Conexão**\n\nA rede neural demorou muito para responder (mais de 20 segundos) e a requisição foi cancelada automaticamente para não travar o sistema. Tente novamente em alguns instantes.');
          restoreSendButton();
          return;
      }
      
      if (err.name === 'AbortError') return; // Cancelado pelo usuário
      
      console.error(err);
      document.getElementById('ai-typing')?.remove();
      
      // Fallback normal
      setTimeout(() => {
        const response = processQuery(query);
        addMessage('ai', response);
        restoreSendButton();
      }, 300);
    }
  }

  function restoreSendButton() {
    const sendBtn = document.getElementById('ai-send-btn');
    const cancelBtn = document.getElementById('ai-cancel-btn');
    if (sendBtn) sendBtn.style.display = 'block';
    if (cancelBtn) cancelBtn.style.display = 'none';
  }

  function cancelQuery() {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    const typing = document.getElementById('ai-typing');
    if (typing) {
      typing.innerHTML = '🤖 <span style="color:var(--text-muted);font-size:var(--text-sm)">Pesquisa cancelada pelo usuário.</span>';
      setTimeout(() => typing.remove(), 2500);
    }
    restoreSendButton();
  }

  const suggestions = [
    'Por que a SSM-288 está atrasada?','Quais equipamentos têm risco de atraso?',
    'Que peças estão bloqueando a liberação?','Restrições abertas no momento?',
    'Quando a SSM-301 será liberada?','Como está o caminho crítico?',
    'Resumo geral da oficina','Quais tarefas são críticas?',
  ];

  function render() {
    setTimeout(() => {
      const container = document.getElementById('ai-chat-messages');
      if (!container) return;
      messages.forEach(m => {
        const div = document.createElement('div');
        div.style.cssText = 'display:flex;gap:var(--space-3);align-items:flex-start;margin-bottom:var(--space-3);';
        
        let contentHtml = m.content.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
        if (m.role === 'ai' && window.marked) {
            contentHtml = window.marked.parse(m.content);
        } else if (m.role === 'user') {
            contentHtml = m.content.replace(/\n/g,'<br>');
        }
        
        div.innerHTML = `<div style="font-size:1.3rem;flex-shrink:0">${m.role==='ai'?'🤖':'👤'}</div>
          <div class="ai-message-content" style="background:${m.role==='ai'?'var(--bg-base)':'var(--brand-primary)'};border-radius:var(--radius-md);padding:var(--space-3);font-size:var(--text-sm);color:${m.role==='ai'?'var(--text-secondary)':'#ffffff'};line-height:1.6;max-width:90%;overflow-x:auto;">${contentHtml}</div>`;
        
        if (m.role === 'user') {
            div.style.flexDirection = 'row-reverse';
        }

        const links = div.querySelectorAll('a');
        links.forEach(l => {
          l.setAttribute('target', '_blank');
          l.setAttribute('rel', 'noopener noreferrer');
        });

        container.appendChild(div);
      });
      container.scrollTop = container.scrollHeight;
    }, 50);

    return `<div class="page-container">
      <div class="section-header"><div class="section-title"><div class="section-title-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg></div>Assistente IA — Análise Inteligente</div></div>
      <div style="display:flex;flex-direction:column;gap:var(--space-5);width:100%;">
        <!-- Chat -->
        <div class="card" style="display:flex;flex-direction:column;height:75vh;width:100%;">
          <div id="ai-chat-messages" style="flex:1;overflow-y:auto;padding:var(--space-4);"></div>
          <div style="border-top:1px solid var(--border-card);padding:var(--space-4);display:flex;gap:var(--space-3);align-items:flex-end;">
            <textarea id="ai-input" placeholder="Digite sua pergunta... (Shift + Enter para quebrar linha)" style="flex:1;resize:none;min-height:44px;max-height:300px;padding:10px var(--space-3);border:1px solid var(--border-input, var(--border-card));border-radius:var(--radius-md);background:var(--bg-base);color:var(--text-primary);font-family:inherit;line-height:1.5;overflow-y:auto;box-sizing:border-box;" rows="1" oninput="this.style.height = ''; this.style.height = Math.min(this.scrollHeight, 300) + 'px'" onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); AIAssistant.sendFromInput(); }"></textarea>
            <button id="ai-send-btn" class="btn btn-primary" style="height:44px;" onclick="AIAssistant.sendFromInput()">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
            </button>
            <button id="ai-cancel-btn" class="btn" style="display:none;background:var(--bg-card);border:1px solid var(--border-card);color:var(--text-secondary);" onclick="AIAssistant.cancelQuery()">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function sendFromInput() {
    const input = document.getElementById('ai-input');
    if (input?.value?.trim()) sendQuery(input.value.trim());
  }

  return { render, sendQuery, sendFromInput, cancelQuery };
})();

// ================================================================
// MEETING MODE MODULE
// ================================================================
window.MeetingMode = (() => {
  let interval = null;
  let countdown = 30;

  let selectedMeetingMonth = null;

  function activate(monthParam) {
    if (document.getElementById('meeting-overlay')) deactivate();

    const overlay = document.createElement('div');
    overlay.id = 'meeting-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:#050D1A;z-index:10000;display:flex;flex-direction:column;overflow:hidden;font-family:var(--font-primary);';

    const eqs = DB.equipment.list();
    const tasks = DB.tasks.getAll();
    
    // Obter mês selecionado
    const df = document.getElementById('date-filter');
    const baseDate = df && df.value ? df.value : new Date().toISOString().slice(0,10);
    
    if (monthParam) selectedMeetingMonth = monthParam;
    else if (!selectedMeetingMonth) selectedMeetingMonth = baseDate.slice(0,7);
    
    const currentMonth = selectedMeetingMonth;
    
    const eqWaiting = eqs.filter(e => {
      if (e.status !== 'Aguardando Manutenção' && e.status !== 'Backlog') return false;
      if (e.tipo === 'Subconjuntos') return false;
      return true; // Aguardando/Backlog não precisa ser filtrado por mês
    });

    function matchesMonth(dStr, yyyy_mm) {
      if (!dStr) return false;
      if (dStr.startsWith(yyyy_mm)) return true;
      // Trata DD/MM/YYYY
      if (dStr.includes('/')) {
        const parts = dStr.split('/');
        if (parts.length === 3) {
          const iso = parts[2] + '-' + parts[1];
          return iso === yyyy_mm;
        }
      }
      return false;
    }

    const eqMaintenance = eqs.filter(e => {
      if (['Liberado', 'Aguardando Manutenção', 'Backlog'].includes(e.status)) return false;
      if (e.tipo === 'Subconjuntos') return false;
      const dataPrazo = e.dataLiberacaoPlanejada || '';
      return matchesMonth(dataPrazo, currentMonth);
    });

    const eqReleased = eqs.filter(e => {
      if (e.status !== 'Liberado') return false;
      if (e.tipo === 'Subconjuntos') return false; // RETIRA SUBCONJUNTO
      const dataReal = e.dataLiberacaoAtual || e.dataLiberacaoPlanejada || '';
      return matchesMonth(dataReal, currentMonth);
    });

    // Helper para Top Executantes (Total geral, sem filtro de mês conforme pedido)
    const perfMap = {};
    
    const timesheets = window.DB.timesheets ? window.DB.timesheets.list() : [];
    const completedTasks = tasks.filter(t => t.status === 'Concluída' && t.disciplina !== 'Subconjunto');

    completedTasks.forEach(t => {
      const taskWorkers = new Set();
      if (t.responsavel && t.responsavel !== 'Não atribuído' && t.responsavel !== 'Sistema') {
        taskWorkers.add(t.responsavel);
      }
      timesheets.forEach(ts => {
        if (ts.taskId === t.id && (!ts.tipo || ts.tipo === 'Trabalho') && ts.workerNome) {
          taskWorkers.add(ts.workerNome);
        }
      });
      taskWorkers.forEach(wName => {
        if (!perfMap[wName]) perfMap[wName] = new Set();
        perfMap[wName].add(t.id);
      });
    });

    const topPerformers = Object.entries(perfMap)
      .map(([nome, taskSet]) => ({nome, count: taskSet.size}))
      .sort((a,b) => b.count - a.count)
      .slice(0, 5);
      
    // Todos executantes para o Ticker
    const allPerformers = Object.entries(perfMap)
      .map(([nome, taskSet]) => ({nome, count: taskSet.size}))
      .sort((a,b) => b.count - a.count);

    overlay.innerHTML = `
      <!-- Header bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:#0A1929;border-bottom:1px solid rgba(30,136,229,.3);">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:36px;height:36px;background:rgba(21,101,192,.8);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;">📺</div>
          <div>
            <div style="font-size:1.1rem;font-weight:900;color:white;letter-spacing:-.02em">Manutenção DIMAN-BHZ</div>
            <div style="font-size:.65rem;color:#8EACC8;text-transform:uppercase;letter-spacing:.1em;display:flex;align-items:center;gap:8px;">
              Acompanhamento Mensal de Equipamentos e Produtividade
              <input type="month" value="${currentMonth}" onchange="MeetingMode.activate(this.value)" style="background:rgba(30,136,229,.2); border:1px solid rgba(30,136,229,.4); color:white; border-radius:4px; padding:2px 6px; font-family:inherit; outline:none; font-weight:700; cursor:pointer; font-size:.7rem;">
            </div>
          </div>
        </div>
        <div id="meeting-datetime" style="font-size:1.4rem;font-weight:800;color:#1E88E5;font-family:monospace;"></div>
        <div style="display:flex; gap:12px; align-items:center;">
          <button onclick="MeetingMode.toggleFullscreen()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:700;display:flex;align-items:center;gap:6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            Tela Cheia
          </button>
          <button onclick="MeetingMode.deactivate()" style="background:rgba(244,67,54,.2);border:1px solid rgba(244,67,54,.4);color:#F44336;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:700;">✕ Sair</button>
        </div>
      </div>

      <!-- 4-panel grid -->
      <div style="flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:16px;overflow:hidden;">
        
        <!-- Column 1: Em Manutenção -->
        <div style="background:#0A1929;border:1px solid rgba(30,136,229,.3);border-radius:12px;display:flex;flex-direction:column;overflow:hidden;">
          <div style="padding:14px;background:rgba(30,136,229,.1);border-bottom:1px solid rgba(30,136,229,.2);">
            <h2 style="margin:0;color:#64B5F6;font-size:1.1rem;font-weight:800;text-transform:uppercase;display:flex;align-items:center;gap:8px;">
              ⚙️ Em Manutenção
            </h2>
          </div>
          <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;">
            ${eqMaintenance.length > 0 ? eqMaintenance.sort((a,b) => (a.dataLiberacaoPlanejada||'').localeCompare(b.dataLiberacaoPlanejada||'')).map(e => {
              const dataStr = (e.dataLiberacaoPlanejada) ? formatDate(e.dataLiberacaoPlanejada) : '—';
              return `
                <div style="background:rgba(255,255,255,0.03);border-left:4px solid #1E88E5;padding:12px;border-radius:8px;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span style="font-weight:800;color:white;font-size:1.1rem;">${e.codigo}</span>
                    <span style="font-weight:700;color:#64B5F6;font-size:0.95rem;">Prazo: <span style="color:white">${dataStr}</span></span>
                  </div>
                  <div style="color:#8EACC8;font-size:0.85rem;">Cliente: <strong style="color:#BBDEFB">${e.cliente || 'Não Informado'}</strong></div>
                </div>
              `;
            }).join('') : '<div style="color:#8EACC8;text-align:center;margin-top:20px;font-size:1rem;">Nenhum equipamento em manutenção</div>'}
          </div>
        </div>

        <!-- Column 2: Liberados -->
        <div style="background:#0A1929;border:1px solid rgba(76,175,80,.3);border-radius:12px;display:flex;flex-direction:column;overflow:hidden;">
          <div style="padding:10px;background:rgba(76,175,80,.1);border-bottom:1px solid rgba(76,175,80,.2);">
            <h2 style="margin:0;color:#81C784;font-size:0.9rem;font-weight:800;text-transform:uppercase;display:flex;align-items:center;gap:8px;">
              ✅ Liberados no Mês
            </h2>
          </div>
          <div style="flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px;">
            ${eqReleased.length > 0 ? eqReleased.sort((a,b) => ((b.dataLiberacaoAtual||b.dataLiberacaoPlanejada||'')).localeCompare(a.dataLiberacaoAtual||a.dataLiberacaoPlanejada||'')).map(e => {
              const d = e.dataLiberacaoAtual || e.dataLiberacaoPlanejada;
              const dataStr = d ? formatDate(d) : '—';
              return `
                <div style="background:rgba(255,255,255,0.03);border-left:4px solid #4CAF50;padding:10px;border-radius:6px;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                    <span style="font-weight:800;color:white;font-size:1rem;">${e.codigo}</span>
                    <span style="font-weight:700;color:#81C784;font-size:0.85rem;">Liberado: <span style="color:white">${dataStr}</span></span>
                  </div>
                  <div style="color:#8EACC8;font-size:0.75rem;">Cliente: <strong style="color:white">${e.cliente || 'Não Informado'}</strong></div>
                </div>
              `;
            }).join('') : '<div style="color:#8EACC8;text-align:center;margin-top:20px;font-size:0.9rem;">Nenhum equipamento liberado</div>'}
          </div>
        </div>

        <!-- Column 3: Top Executantes -->
        <div style="background:#0A1929;border:1px solid rgba(156,39,176,.3);border-radius:12px;display:flex;flex-direction:column;overflow:hidden;">
          <div style="padding:10px;background:rgba(156,39,176,.1);border-bottom:1px solid rgba(156,39,176,.2);">
            <h2 style="margin:0;color:#BA68C8;font-size:0.9rem;font-weight:800;text-transform:uppercase;display:flex;align-items:center;gap:8px;">
              🚀 Top Executantes
            </h2>
          </div>
          <div style="flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px;">
            ${topPerformers.length > 0 ? topPerformers.map((t, idx) => {
              const emojis = ['🏆 1º', '🥈 2º', '🥉 3º', '🏅 4º', '🏅 5º'];
              return `
                <div style="background:rgba(255,255,255,0.03);border-left:4px solid #AB47BC;padding:10px;border-radius:6px;display:flex;align-items:center;gap:12px;">
                  <div style="font-size:1.5rem;">${emojis[idx] || '🏅'}</div>
                  <div style="flex:1;">
                    <div style="font-weight:800;color:white;font-size:1rem;margin-bottom:2px;">${t.nome}</div>
                    <div style="color:#CE93D8;font-weight:700;font-size:0.85rem;"><span style="color:white;font-weight:900;">${t.count}</span> tarefas executadas</div>
                  </div>
                </div>
              `;
            }).join('') : '<div style="color:#8EACC8;text-align:center;margin-top:20px;font-size:0.9rem;">Nenhum dado de execução</div>'}
          </div>
        </div>

        <!-- Column 4: Aguardando Manutenção -->
        <div style="background:#0A1929;border:1px solid rgba(255,152,0,.3);border-radius:12px;display:flex;flex-direction:column;overflow:hidden;">
          <div style="padding:14px;background:rgba(255,152,0,.1);border-bottom:1px solid rgba(255,152,0,.2);">
            <h2 style="margin:0;color:#FFB74D;font-size:1.1rem;font-weight:800;text-transform:uppercase;display:flex;align-items:center;gap:8px;">
              ⏳ Aguardando Manutenção
            </h2>
          </div>
          <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;">
            ${eqWaiting.length > 0 ? eqWaiting.sort((a,b) => (a.dataLiberacaoPlanejada||'').localeCompare(b.dataLiberacaoPlanejada||'')).map(e => {
              const dataStr = (e.dataLiberacaoPlanejada) ? formatDate(e.dataLiberacaoPlanejada) : '—';
              return `
                <div style="background:rgba(255,255,255,0.03);border-left:4px solid #FF9800;padding:12px;border-radius:8px;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span style="font-weight:800;color:white;font-size:1.1rem;">${e.codigo}</span>
                    <span style="font-weight:700;color:#FFB74D;font-size:0.95rem;">Prazo: <span style="color:white">${dataStr}</span></span>
                  </div>
                  <div style="color:#8EACC8;font-size:0.85rem;">Cliente: <strong style="color:#FFE0B2">${e.cliente || 'Não Informado'}</strong></div>
                </div>
              `;
            }).join('') : '<div style="color:#8EACC8;text-align:center;margin-top:20px;font-size:1rem;">Nenhum equipamento aguardando</div>'}
          </div>
        </div>
      </div>

      <!-- Bottom bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 24px;background:#0A1929;border-top:1px solid rgba(30,136,229,.2);font-size:.65rem;color:#546E7A;">
        <span>PLANEJAMENTO DIMAN-BHZ — Gestão Industrial</span>
        <span id="meeting-update-info"></span>
        <span>F11 para tela cheia</span>
      </div>
    `;

    document.body.appendChild(overlay);

    // Tenta entrar em tela cheia (Fullscreen API)
    try {
      if (overlay.requestFullscreen) {
        overlay.requestFullscreen();
      } else if (overlay.webkitRequestFullscreen) { /* Safari */
        overlay.webkitRequestFullscreen();
      } else if (overlay.msRequestFullscreen) { /* IE11 */
        overlay.msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request falhou:", err);
    }

    // Clock
    interval = setInterval(() => {
      const dt = document.getElementById('meeting-datetime');
      if (dt) dt.textContent = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      const info = document.getElementById('meeting-update-info');
      if (info) { countdown--; if (countdown <= 0) { countdown = 30; } info.textContent = `Atualizado · Próxima atualização em ${countdown}s`; }
    }, 1000);
  }

  function deactivate() {
    if (interval) { clearInterval(interval); interval = null; }
    document.getElementById('meeting-overlay')?.remove();
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(()=>{});
    }
    if (window.Router) {
      const session = window.Auth ? window.Auth.getSession() : null;
      window.Router.navigate(session && session.perfil === 'Executante' ? 'worker-panel' : 'home', { force: true });
    } else {
      window.location.hash = '#home';
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  return { activate, deactivate, toggleFullscreen };
})();

// ================================================================
// TIMELINE MODULE
// ================================================================
window.TimelineModule = (() => {
  let selectedEq = '';
  
  function setEquipment(code) {
    selectedEq = code;
    if (window.Router) window.Router.navigate('timeline', { force: true });
  }

  function render() {
    const eqs = DB.equipment.list();
    
    // Sort and Group
    eqs.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''));
    const groups = {};
    eqs.forEach(e => {
      const cod = e.codigo || '';
      let prefix = cod.split(/[\-\d]/)[0].trim().toUpperCase();
      if (!prefix) prefix = 'OUTROS';
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(e);
    });
    const sortedGroups = Object.keys(groups).sort();
    const options = sortedGroups.map(groupName => {
      const groupOptions = groups[groupName].map(e => {
        const cod = e.codigo || '';
        const nom = e.nome || '';
        const displayName = (cod.trim() === nom.trim()) ? cod : `${cod} - ${nom}`;
        return `<option value="${cod}">${displayName}</option>`;
      }).join('');
      return `<optgroup label="${groupName}">${groupOptions}</optgroup>`;
    }).join('');
    
    let allEvents = [];
    if (selectedEq) {
        const e = eqs.find(eq => eq.codigo === selectedEq);
        if (e) {
            allEvents = (e.timeline||[]).map(tl => ({ ...tl, equipCode: e.codigo }));
        }
    }
    
    allEvents.sort((a,b) => b.timestamp.localeCompare(a.timestamp));
    const typeColor = { ENTRADA:'info', INICIO:'success', DEFEITO:'danger', PECA_SOLICITADA:'warning', REPLANEJAMENTO:'warning', LIBERACAO:'success' };

    return `<div class="page-container">
      <div class="section-header">
        <div class="section-title"><div class="section-title-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>Timeline de Eventos</div>
      </div>
      
      <div style="padding: var(--space-4) var(--space-4) 0 var(--space-4);">
        <div style="position: relative; max-width: 450px; background: var(--bg-card, #fff); border-radius: 8px; border: 1px solid var(--border-card, #e2e8f0);">
          <div style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; z-index: 2;">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <select class="input" style="width: 100%; padding-left: 44px; padding-top: 12px; padding-bottom: 12px; font-weight: 600; font-size: 1rem; border: none; background-color: transparent; color: var(--text-primary); cursor: pointer; appearance: none;" onchange="window.TimelineModule.setEquipment(this.value)">
            <option value="">Pesquisar e selecionar equipamento...</option>
            ${options}
          </select>
          <div style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--primary);">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>
          </div>
        </div>
      </div>

      <div class="timeline" style="padding:var(--space-4);">
        ${selectedEq === '' ? '<div class="empty-state"><p>Por favor, pesquise e selecione um equipamento acima para ver a timeline.</p></div>' : ''}
        ${selectedEq !== '' && allEvents.length === 0 ? '<div class="empty-state"><p>Nenhum evento registrado para este equipamento.</p></div>' : ''}
        ${allEvents.map(tl=>`<div class="timeline-item">
          <div class="timeline-icon ${typeColor[tl.tipo]||'primary'}"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
          <div class="timeline-content">
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-1);">
              <div class="timeline-title">${tl.titulo}</div>
              <span class="badge badge-ghost" style="font-size:10px">${tl.equipCode}</span>
            </div>
            <div class="timeline-desc">${tl.descricao}</div>
            <div class="timeline-time">${formatDateTime(tl.timestamp)}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>`;
  }
  return { render, setEquipment };
})();

// ================================================================
// LESSONS MODULE
// ================================================================
window.LessonsModule = (() => {
  function render() {
    const lessons = DB.lessons.list();
    const eqs = DB.equipment.list();
    return `<div class="page-container">
      <div class="section-header"><div class="section-title"><div class="section-title-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/></svg></div>Lições Aprendidas</div>
        <button class="btn btn-primary" onclick="LessonsModule.openCreate()">+ Nova Lição</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:var(--space-4);">
        ${lessons.map(l=>`<div class="card hover-lift" style="border-left:3px solid var(--color-warning);">
          <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3);">
            <span style="font-size:1.5rem">💡</span>
            <div>
              <div style="font-size:var(--text-xs);font-weight:700;color:var(--color-warning)">${l.disciplina}</div>
              <div style="font-size:var(--text-xs);color:var(--text-muted)">${l.equipmentTipo} · ${formatDate(l.createdAt)}</div>
            </div>
          </div>
          <div style="margin-bottom:var(--space-3);">
            <div style="font-size:var(--text-xs);font-weight:700;color:var(--color-danger);margin-bottom:4px">🔴 Problema:</div>
            <div style="font-size:var(--text-sm);color:var(--text-secondary)">${l.problema}</div>
          </div>
          <div style="margin-bottom:var(--space-3);">
            <div style="font-size:var(--text-xs);font-weight:700;color:var(--color-success);margin-bottom:4px">✅ Solução:</div>
            <div style="font-size:var(--text-sm);color:var(--text-secondary)">${l.solucao}</div>
          </div>
          <div style="padding:var(--space-2) var(--space-3);background:var(--color-warning-bg);border-radius:var(--radius-sm);font-size:var(--text-xs);color:var(--color-warning);">
            📝 ${l.recomendacao}
          </div>
          <div style="margin-top:var(--space-2);font-size:var(--text-xs);color:var(--text-muted)">Tempo perdido: <strong>${l.tempoPerdido} dias</strong></div>
        </div>`).join('')}
        ${lessons.length===0?'<div class="empty-state" style="grid-column:1/-1"><p>Nenhuma lição aprendida registrada</p></div>':''}
      </div>
    </div>
    <div class="modal-overlay" id="modal-lesson">
      <div class="modal modal-lg"><div class="modal-header"><div class="modal-title">Nova Lição Aprendida</div><button class="modal-close" onclick="closeModal('modal-lesson')"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div>
      <div class="modal-body" id="lesson-modal-body"></div>
      <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('modal-lesson')">Cancelar</button><button class="btn btn-primary" onclick="LessonsModule.save()">Salvar</button></div></div>
    </div>`;
  }

  function openCreate() {
    const discs = ['Mecânica','Mecânica de poço','Caldeiraria','Elétrica','Usinagem','Pintor','Lavador','Montagem','Subconjunto','Teste','Retrabalho','Liderança'];
    document.getElementById('lesson-modal-body').innerHTML = `<div style="display:flex;flex-direction:column;gap:var(--space-4);">
      <div class="form-row"><div class="form-group"><label>Disciplina</label><select id="ll-disc">${discs.map(d=>`<option value="${d}">${d}</option>`).join('')}</select></div>
      <div class="form-group"><label>Tipo de Equipamento</label><input id="ll-tipo" placeholder="Sonda, Perfuratriz..." /></div></div>
      <div class="form-group"><label>Problema Encontrado *</label><textarea id="ll-prob" rows="3"></textarea></div>
      <div class="form-group"><label>Solução Aplicada *</label><textarea id="ll-sol" rows="3"></textarea></div>
      <div class="form-group"><label>Recomendação Futura *</label><textarea id="ll-rec" rows="3"></textarea></div>
      <div class="form-group"><label>Tempo Perdido (dias)</label><input type="number" id="ll-tempo" min="0" value="0" /></div>
    </div>`;
    openModal('modal-lesson');
  }

  function save() {
    const prob = document.getElementById('ll-prob').value.trim();
    const sol = document.getElementById('ll-sol').value.trim();
    if (!prob || !sol) { Toast.error('Erro', 'Preencha problema e solução'); return; }
    DB.lessons.create({ disciplina: document.getElementById('ll-disc').value, equipmentTipo: document.getElementById('ll-tipo').value, problema: prob, solucao: sol, recomendacao: document.getElementById('ll-rec').value, tempoPerdido: parseInt(document.getElementById('ll-tempo').value)||0 });
    closeModal('modal-lesson');
    Router.navigate('lessons', { force: true });
    Toast.success('Lição registrada!');
  }

  return { render, openCreate, save };
})();

// ================================================================
// STUB MODULES (Placeholders with basic UI)
// ================================================================

window.ImpactsModule = (() => {
  function render() {
    const allTasks = DB.tasks.getAll();
    const criticas = allTasks.filter(t => t.critico && t.status !== 'Concluída');
    const eqs = DB.equipment.list();
    return `<div class="page-container">
      <div class="section-header"><div class="section-title"><div class="section-title-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>Relatório de Impactos</div></div>
      <div class="alert alert-info" style="margin-bottom:var(--space-4);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg><div class="alert-content"><div class="alert-title">Análise de impacto de atrasos na data de liberação dos equipamentos</div></div></div>
      <div class="table-wrap"><table><thead><tr><th>Equipamento</th><th>Cliente</th><th>% Avanço</th><th>Data Liberação</th><th>Tarefas Críticas</th><th>Restrições</th><th>Impacto Estimado</th></tr></thead>
      <tbody>${eqs.map(e=>{const cr=allTasks.filter(t=>t.equipmentId===e.id&&t.critico&&t.status!=='Concluída').length;const rs=DB.restrictions.getAll().filter(r=>r.equipmentId===e.id&&r.status==='Aberta').length;const impact=cr*2+rs*3;return`<tr>
        <td><strong>${e.codigo}</strong></td><td>${e.cliente}</td><td>${e.pctAvanco||0}%</td>
        <td>${formatDate(e.dataLiberacaoPlanejada)}</td>
        <td><span class="badge badge-${cr>0?'danger':'success'}">${cr}</span></td>
        <td><span class="badge badge-${rs>0?'warning':'success'}">${rs}</span></td>
        <td><span class="badge badge-${impact>5?'danger':impact>0?'warning':'success'}">${impact > 0 ? `~${impact} dias de risco` : 'OK'}</span></td>
      </tr>`;}).join('')}</tbody></table></div>
    </div>`;
  }
  return { render };
})();

window.ReportsModule = (() => {
  function render() {
    return `<div class="page-container">
      <div class="section-header"><div class="section-title"><div class="section-title-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg></div>Relatórios</div>
        <button class="btn btn-primary" onclick="window.print()">🖨️ Imprimir</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-4);">
        ${[
          {id:'aderencia', title:'Relatório de Aderência',icon:'📊',desc:'Aderência ao planejamento por período'},
          {id:'equipamentos', title:'Relatório de Equipamentos',icon:'⚙️',desc:'Status e avanço de todos os equipamentos'},
          {id:'pecas', title:'Relatório de Peças',icon:'📦',desc:'Peças pendentes e criticidade'},
          {id:'custos', title:'Relatório de Custos',icon:'💰',desc:'Custos planejados vs realizados'},
          {id:'restricoes', title:'Relatório de Restrições',icon:'🚫',desc:'Restrições abertas e fechadas'},
          {id:'mo', title:'Relatório de MO',icon:'👥',desc:'Horas de mão de obra por período'},
        ].map(r=>`<div class="card card-clickable hover-lift" onclick="ReportsModule.generatePDF('${r.id}')">
          <div style="font-size:2rem;margin-bottom:var(--space-3)">${r.icon}</div>
          <div style="font-weight:700;font-size:var(--text-sm);margin-bottom:var(--space-2)">${r.title}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted)">${r.desc}</div>
          <button class="btn btn-secondary btn-sm" style="margin-top:var(--space-4)">Gerar PDF</button>
        </div>`).join('')}
      </div>
    </div>`;
  }

  function generatePDF(type) {
    if (!window.jspdf) {
      Toast.error('Erro', 'Biblioteca jsPDF não encontrada.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Get current global filter if any
    const globalFilterEqId = window.GlobalEqFilter;
    const globalFilterEq = globalFilterEqId ? DB.equipment.get(globalFilterEqId) : null;
    const today = new Date().toISOString().slice(0, 10);

    // Common PDF styling helper
    const addHeader = (title) => {
      // Background band for header
      doc.setFillColor(13, 27, 42); // Navy
      doc.rect(0, 0, 210, 30, 'F');
      
      // Title text
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("DIMAN | SISTEMA INTELIGENTE DA MANUTENÇÃO", 15, 13);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(180, 200, 220);
      let filterText = globalFilterEq ? ` | Equipamento: ${globalFilterEq.codigo}` : "";
      doc.text(`${title}${filterText}`, 15, 22);

      // Date of generation
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Gerado em: ${formatDateTime(new Date().toISOString())}`, 145, 13);
    };

    const addFooter = (data) => {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${doc.internal.getNumberOfPages()}`, 15, doc.internal.pageSize.height - 10);
      doc.text("CONFIDENCIAL — APENAS PARA USO INTERNO", 120, doc.internal.pageSize.height - 10);
    };

    if (type === 'aderencia') {
      const allTasks = DB.tasks.getAll();
      const filteredTasks = globalFilterEqId ? allTasks.filter(t => t.equipmentId === globalFilterEqId) : allTasks;
      const eqs = DB.equipment.list();
      const equipMap = {};
      eqs.forEach(e => { equipMap[e.id] = e; });

      const total = filteredTasks.length;
      const concluded = filteredTasks.filter(t => t.status === 'Concluída').length;
      const inProgress = filteredTasks.filter(t => t.status === 'Em Andamento').length;
      const delayed = filteredTasks.filter(t => t.dataPlanejadaTermino && t.dataPlanejadaTermino < today && t.status !== 'Concluída').length;
      const adherenceRate = total > 0 ? Math.round((concluded / total) * 100) : 0;

      addHeader("Relatório de Aderência ao Planejamento");

      // Draw KPI boxes
      doc.setFillColor(240, 244, 249);
      doc.roundedRect(15, 35, 180, 25, 3, 3, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text("Total Atividades", 20, 43);
      doc.text("Concluídas", 55, 43);
      doc.text("Em Andamento", 90, 43);
      doc.text("Atrasadas", 125, 43);
      doc.text("Taxa de Aderência", 160, 43);

      doc.setFontSize(14);
      doc.setTextColor(13, 27, 42);
      doc.text(`${total}`, 20, 52);
      doc.setTextColor(40, 167, 69); // Green
      doc.text(`${concluded}`, 55, 52);
      doc.setTextColor(0, 123, 255); // Blue
      doc.text(`${inProgress}`, 90, 52);
      doc.setTextColor(220, 53, 69); // Red
      doc.text(`${delayed}`, 125, 52);
      doc.setTextColor(21, 101, 192); // Brand Blue
      doc.text(`${adherenceRate}%`, 160, 52);

      // Tasks Table
      const columns = ['Equipamento', 'Cód. Tarefa', 'Descrição', 'Disciplina', 'Início Plan.', 'Término Plan.', 'Avanço', 'Status'];
      const rows = filteredTasks.map(t => [
        equipMap[t.equipmentId]?.codigo || '—',
        t.codigo || '—',
        t.critico ? `[CRÍTICA] ${t.descricao}` : t.descricao,
        t.disciplina || '—',
        formatDate(t.dataPlanejadaInicio),
        formatDate(t.dataPlanejadaTermino),
        `${t.pctExecutado || 0}%`,
        t.status
      ]).sort((a, b) => String(a[0]).localeCompare(String(b[0])));

      doc.autoTable({
        startY: 68,
        head: [columns],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [13, 27, 42] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          2: { cellWidth: 50 }, // Description column wider
        },
        didDrawPage: addFooter
      });

      doc.save(`Relatorio_Aderencia_${today}.pdf`);
      Toast.success('PDF Gerado', 'Relatório de Aderência baixado com sucesso!');
    }
    else if (type === 'equipamentos') {
      const eqs = DB.equipment.list();
      const filteredEqs = globalFilterEqId ? eqs.filter(e => e.id === globalFilterEqId) : eqs;
      const allTasks = DB.tasks.getAll();
      const restrictions = DB.restrictions.getAll();
      
      const total = filteredEqs.length;
      const emManutencao = filteredEqs.filter(e => e.status === 'Em Manutenção').length;
      const liberados = filteredEqs.filter(e => e.status === 'Liberado').length;
      const bloqueados = filteredEqs.filter(e => e.status === 'Paralisado' || e.status === 'Falta de Peças' || e.status === 'Falta de Mão de Obra').length;
      const avgProgress = total > 0 ? Math.round(filteredEqs.reduce((s, e) => s + (e.pctAvanco || 0), 0) / total) : 0;

      addHeader("Relatório de Equipamentos em Manutenção");

      // Draw KPI boxes
      doc.setFillColor(240, 244, 249);
      doc.roundedRect(15, 35, 180, 25, 3, 3, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text("Total Equip.", 20, 43);
      doc.text("Em Manutenção", 55, 43);
      doc.text("Liberados", 90, 43);
      doc.text("Paral. / F. Peça", 125, 43);
      doc.text("Média Progresso", 160, 43);

      doc.setFontSize(14);
      doc.setTextColor(13, 27, 42);
      doc.text(`${total}`, 20, 52);
      doc.setTextColor(21, 101, 192); 
      doc.text(`${emManutencao}`, 55, 52);
      doc.setTextColor(40, 167, 69); 
      doc.text(`${liberados}`, 90, 52);
      doc.setTextColor(220, 53, 69); 
      doc.text(`${bloqueados}`, 125, 52);
      doc.setTextColor(13, 27, 42);
      doc.text(`${avgProgress}%`, 160, 52);

      // Equipments Table
      const columns = ['Código', 'Nome / Descrição', 'Cliente', 'Avanço', 'Status', 'Previsão Lib.', 'Atividades', 'Restr. Abertas'];
      const rows = filteredEqs.map(e => {
        const eqTasks = allTasks.filter(t => t.equipmentId === e.id);
        const eqRestr = restrictions.filter(r => r.equipmentId === e.id && r.status === 'Aberta').length;
        return [
          e.codigo,
          e.nome || '—',
          e.cliente || '—',
          `${e.pctAvanco || 0}%`,
          e.status,
          formatDate(e.dataLiberacaoAtual || e.dataLiberacaoPlanejada),
          `${eqTasks.filter(t=>t.status==='Concluída').length}/${eqTasks.length}`,
          `${eqRestr}`
        ];
      }).sort((a, b) => String(a[0]).localeCompare(String(b[0])));

      doc.autoTable({
        startY: 68,
        head: [columns],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [13, 27, 42] },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          1: { cellWidth: 50 }, // Name column wider
        },
        didDrawPage: addFooter
      });

      doc.save(`Relatorio_Equipamentos_${today}.pdf`);
      Toast.success('PDF Gerado', 'Relatório de Equipamentos baixado com sucesso!');
    }
    else if (type === 'pecas') {
      const parts = DB.parts.getAll();
      const filteredParts = globalFilterEqId ? parts.filter(p => p.equipmentId === globalFilterEqId) : parts;
      const eqs = DB.equipment.list();
      const equipMap = {};
      eqs.forEach(e => { equipMap[e.id] = e; });

      const total = filteredParts.length;
      const pendentes = filteredParts.filter(p => ['Solicitada', 'Comprada', 'Em Transporte'].includes(p.status)).length;
      const criticas = filteredParts.filter(p => p.critica).length;
      const recebidas = filteredParts.filter(p => ['Recebida', 'Instalada'].includes(p.status)).length;

      addHeader("Relatório de Peças e Criticidade");

      // Draw KPI boxes
      doc.setFillColor(240, 244, 249);
      doc.roundedRect(15, 35, 180, 25, 3, 3, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text("Total Peças", 25, 43);
      doc.text("Pendentes", 65, 43);
      doc.text("Críticas", 105, 43);
      doc.text("Recebidas / Instaladas", 145, 43);

      doc.setFontSize(14);
      doc.setTextColor(13, 27, 42);
      doc.text(`${total}`, 25, 52);
      doc.setTextColor(255, 107, 0); // Orange
      doc.text(`${pendentes}`, 65, 52);
      doc.setTextColor(220, 53, 69); // Red
      doc.text(`${criticas}`, 105, 52);
      doc.setTextColor(40, 167, 69); // Green
      doc.text(`${recebidas}`, 145, 52);

      // Parts Table
      const columns = ['Código', 'Descrição', 'Equipamento', 'Qtd', 'Status', 'Fornecedor', 'Prazo Entrega', 'Crítica'];
      const rows = filteredParts.map(p => [
        p.codigo || '—',
        p.descricao || '—',
        equipMap[p.equipmentId]?.codigo || '—',
        `${p.qtd || 1}`,
        p.status || '—',
        p.fornecedor || '—',
        formatDate(p.prazoEntrega),
        p.critica ? 'SIM' : 'Não'
      ]).sort((a, b) => String(a[0]).localeCompare(String(b[0])));

      doc.autoTable({
        startY: 68,
        head: [columns],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [13, 27, 42] },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          1: { cellWidth: 50 }, 
        },
        didDrawPage: addFooter
      });

      doc.save(`Relatorio_Pecas_${today}.pdf`);
      Toast.success('PDF Gerado', 'Relatório de Peças baixado com sucesso!');
    }
    else if (type === 'custos') {
      const costs = DB.costs.getAll();
      const filteredCosts = globalFilterEqId ? costs.filter(c => c.equipmentId === globalFilterEqId) : costs;
      const eqs = DB.equipment.list();
      const equipMap = {};
      eqs.forEach(e => { equipMap[e.id] = e; });

      const totalPlanejado = filteredCosts.reduce((s, c) => s + (c.valorPlanejado || 0), 0);
      const totalRealizado = filteredCosts.reduce((s, c) => s + (c.valorRealizado || 0), 0);
      const desvioValor = totalRealizado - totalPlanejado;
      const desvioPct = totalPlanejado > 0 ? Math.round((desvioValor / totalPlanejado) * 100) : 0;

      addHeader("Relatório de Custos de Manutenção");

      // Draw KPI boxes
      doc.setFillColor(240, 244, 249);
      doc.roundedRect(15, 35, 180, 25, 3, 3, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text("Total Custos", 20, 43);
      doc.text("Total Planejado", 55, 43);
      doc.text("Total Realizado", 100, 43);
      doc.text("Desvio (BRL)", 145, 43);
      doc.text("Desvio %", 175, 43);

      doc.setFontSize(14);
      doc.setTextColor(13, 27, 42);
      doc.text(`${filteredCosts.length}`, 20, 52);
      doc.setTextColor(13, 27, 42);
      doc.text(formatCurrency(totalPlanejado), 55, 52);
      doc.text(formatCurrency(totalRealizado), 100, 52);
      doc.setTextColor(desvioValor > 0 ? 220 : 40, desvioValor > 0 ? 53 : 167, desvioValor > 0 ? 69 : 69);
      doc.text(`${desvioValor > 0 ? '+' : ''}${formatCurrency(desvioValor)}`, 145, 52);
      doc.text(`${desvioValor > 0 ? '+' : ''}${desvioPct}%`, 175, 52);

      // Costs Table
      const columns = ['Equipamento', 'Categoria', 'Descrição', 'Valor Planejado', 'Valor Realizado', 'Desvio BRL', 'Data'];
      const rows = filteredCosts.map(c => {
        const diff = (c.valorRealizado || 0) - (c.valorPlanejado || 0);
        return [
          equipMap[c.equipmentId]?.codigo || '—',
          c.categoria || '—',
          c.descricao || '—',
          formatCurrency(c.valorPlanejado),
          formatCurrency(c.valorRealizado),
          `${diff > 0 ? '+' : ''}${formatCurrency(diff)}`,
          formatDate(c.data)
        ];
      }).sort((a, b) => String(a[0]).localeCompare(String(b[0])));

      doc.autoTable({
        startY: 68,
        head: [columns],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [13, 27, 42] },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          2: { cellWidth: 50 },
        },
        didDrawPage: addFooter
      });

      doc.save(`Relatorio_Custos_${today}.pdf`);
      Toast.success('PDF Gerado', 'Relatório de Custos baixado com sucesso!');
    }
    else if (type === 'restricoes') {
      const restrictions = DB.restrictions.getAll();
      const filteredRestr = globalFilterEqId ? restrictions.filter(r => r.equipmentId === globalFilterEqId) : restrictions;
      const eqs = DB.equipment.list();
      const equipMap = {};
      eqs.forEach(e => { equipMap[e.id] = e; });

      const total = filteredRestr.length;
      const abertas = filteredRestr.filter(r => r.status === 'Aberta').length;
      const fechadas = filteredRestr.filter(r => r.status === 'Fechada').length;

      addHeader("Relatório de Restrições Operacionais");

      // Draw KPI boxes
      doc.setFillColor(240, 244, 249);
      doc.roundedRect(15, 35, 180, 25, 3, 3, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text("Total Restrições", 30, 43);
      doc.text("Abertas", 85, 43);
      doc.text("Fechadas", 140, 43);

      doc.setFontSize(14);
      doc.setTextColor(13, 27, 42);
      doc.text(`${total}`, 30, 52);
      doc.setTextColor(220, 53, 69); // Red
      doc.text(`${abertas}`, 85, 52);
      doc.setTextColor(40, 167, 69); // Green
      doc.text(`${fechadas}`, 140, 52);

      // Restrictions Table
      const columns = ['Equipamento', 'Tipo de Restrição', 'Descrição', 'Status', 'Abertura', 'Fechamento / Resolução'];
      const rows = filteredRestr.map(r => [
        equipMap[r.equipmentId]?.codigo || '—',
        r.tipo || '—',
        r.descricao || '—',
        r.status || '—',
        formatDate(r.createdAt),
        r.status === 'Fechada' ? `FECHADA em ${formatDate(r.closedAt || r.updatedAt)}\nResolução: ${r.resolution || '—'}` : 'PENDENTE'
      ]).sort((a, b) => String(a[0]).localeCompare(String(b[0])));

      doc.autoTable({
        startY: 68,
        head: [columns],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [13, 27, 42] },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          2: { cellWidth: 50 },
          5: { cellWidth: 50 }
        },
        didDrawPage: addFooter
      });

      doc.save(`Relatorio_Restricoes_${today}.pdf`);
      Toast.success('PDF Gerado', 'Relatório de Restrições baixado com sucesso!');
    }
    else if (type === 'mo') {
      const workers = DB.workforce.list();
      const timesheets = DB.timesheets.list();
      const filteredTimesheets = globalFilterEqId ? timesheets.filter(t => t.equipmentId === globalFilterEqId) : timesheets;

      const totalWorkers = workers.length;
      const activeWorkers = workers.filter(w => w.status === 'Ativo').length;
      const totalHours = filteredTimesheets.filter(t => !t.tipo || t.tipo === 'Trabalho').reduce((s, t) => s + (parseFloat(t.horasTrabalhadas) || 0), 0);

      addHeader("Relatório de Mão de Obra e Apontamentos");

      // Draw KPI boxes
      doc.setFillColor(240, 244, 249);
      doc.roundedRect(15, 35, 180, 25, 3, 3, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text("Total Colaboradores", 25, 43);
      doc.text("Profissionais Ativos", 85, 43);
      doc.text("Total Horas Apontadas", 145, 43);

      doc.setFontSize(14);
      doc.setTextColor(13, 27, 42);
      doc.text(`${totalWorkers}`, 25, 52);
      doc.setTextColor(40, 167, 69); 
      doc.text(`${activeWorkers}`, 85, 52);
      doc.setTextColor(21, 101, 192); 
      doc.text(`${totalHours.toFixed(1)}h`, 145, 52);

      // Section 1: Workforce summary
      doc.setFontSize(11);
      doc.setTextColor(13, 27, 42);
      doc.text("Quadro de Colaboradores", 15, 68);

      const columnsW = ['Matrícula', 'Colaborador', 'Função', 'Disciplina', 'Status', 'Horas Apontadas'];
      const rowsW = workers.map(w => {
        const wHours = timesheets.filter(t => t.workerId === w.id && (!t.tipo || t.tipo === 'Trabalho')).reduce((s, t) => s + (parseFloat(t.horasTrabalhadas) || 0), 0);
        return [
          w.matricula || '—',
          w.nome,
          w.funcao || '—',
          w.disciplina || '—',
          w.status || 'Ativo',
          `${wHours.toFixed(1)}h`
        ];
      }).sort((a, b) => String(a[1]).localeCompare(String(b[1])));

      doc.autoTable({
        startY: 72,
        head: [columnsW],
        body: rowsW,
        theme: 'striped',
        headStyles: { fillColor: [13, 27, 42] },
        styles: { fontSize: 8, cellPadding: 2 },
        didDrawPage: addFooter
      });

      // Section 2: Recent Timesheets
      const startY2 = doc.lastAutoTable.finalY + 12;
      if (startY2 < doc.internal.pageSize.height - 40) {
        doc.setFontSize(11);
        doc.setTextColor(13, 27, 42);
        doc.text("Histórico Recente de Apontamentos de Horas", 15, startY2);

        const eqs = DB.equipment.list();
        const equipMap = {};
        eqs.forEach(e => { equipMap[e.id] = e; });

        const columnsT = ['Data', 'Colaborador', 'Equipamento', 'Início', 'Término', 'Horas', 'Observação'];
        const rowsT = filteredTimesheets.slice(-40).reverse().map(t => {
          const w = workers.find(w => w.id === t.workerId);
          return [
            formatDate(t.data),
            w?.nome || t.workerNome || '—',
            equipMap[t.equipmentId]?.codigo || '—',
            t.horaInicio || '—',
            t.horaFim || '—',
            `${(t.horasTrabalhadas || 0).toFixed(1)}h`,
            t.observacao || '—'
          ];
        }).sort((a, b) => String(a[1]).localeCompare(String(b[1])));

        doc.autoTable({
          startY: startY2 + 4,
          head: [columnsT],
          body: rowsT,
          theme: 'striped',
          headStyles: { fillColor: [13, 27, 42] },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            6: { cellWidth: 50 }
          },
          didDrawPage: addFooter
        });
      }

      doc.save(`Relatorio_MaoDeObra_${today}.pdf`);
      Toast.success('PDF Gerado', 'Relatório de Mão de Obra baixado com sucesso!');
    }
  }

  return { render, generatePDF };
})();

window.AuditModule = (() => {
  function render() {
    const logs = Auth.getAuditLogs().slice(-100).reverse();
    return `<div class="page-container">
      <div class="section-header"><div class="section-title"><div class="section-title-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg></div>Log de Auditoria</div>
        <span style="font-size:var(--text-sm);color:var(--text-muted)">${logs.length} registros</span>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Entidade</th><th>Detalhes</th></tr></thead>
        <tbody>
          ${logs.map(l=>`<tr>
            <td style="font-family:var(--font-mono);font-size:var(--text-xs)">${formatDateTime(l.timestamp)}</td>
            <td>${l.userNome||l.userId||'Sistema'}</td>
            <td><span class="badge badge-${l.action==='DELETE'?'danger':l.action==='CREATE'?'success':'primary'}">${l.action}</span></td>
            <td><span class="badge badge-ghost">${l.entity}</span></td>
            <td style="font-size:var(--text-xs);color:var(--text-muted)">${JSON.stringify(l.changes||{}).slice(0,60)}...</td>
          </tr>`).join('')}
          ${logs.length===0?'<tr><td colspan="5" style="text-align:center;padding:var(--space-8);color:var(--text-muted)">Nenhum registro de auditoria</td></tr>':''}
        </tbody>
      </table></div>
    </div>`;
  }
  return { render };
})();

window.UsersModule = (() => {
  function render() {
    if (!Auth.hasPermission('users')) return '<div class="page-container"><div class="empty-state"><p>Sem permissão para acessar este módulo</p></div></div>';
    let users = window.Auth ? window.Auth.listUsers() : [];
    users.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    
    setTimeout(() => {
      if(!document.getElementById('modal-user-form')) {
        const perfis = ['Desenvolvedor', 'Administrador', 'Gerente', 'Planejador', 'Coordenador', 'Supervisor', 'Encarregado', 'Executante', 'Cliente'];
        const modalHtml = `
          <div class="modal-overlay" id="modal-user-form">
            <div class="modal">
              <div class="modal-header">
                <div class="modal-title">Novo Usuário</div>
                <button class="modal-close" onclick="closeModal('modal-user-form')"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
              <div class="modal-body">
                <div style="display:flex;flex-direction:column;gap:var(--space-3);">
                  <div class="form-group"><label>Matrícula *</label><input type="text" id="nu-mat" placeholder="Ex: 012345" /></div>
                  <div class="form-group"><label>Nome *</label><input type="text" id="nu-nome" placeholder="Nome Completo" /></div>
                  <div class="form-group"><label>Email</label><input type="email" id="nu-email" placeholder="email@exemplo.com" /></div>
                  <div class="form-group"><label>Perfil de Acesso *</label><select id="nu-perfil">${perfis.map(p=>`<option>${p}</option>`).join('')}</select></div>
                  <div class="form-group"><label>Setor / Disciplina</label><select id="nu-disciplina"><option value="">Nenhum</option><option value="Usinagem">Usinagem</option><option value="Mecânica">Mecânica</option><option value="Mecânica de poço">Mecânica de poço</option><option value="Caldeiraria">Caldeiraria</option><option value="Elétrica">Elétrica</option><option value="Retrabalho">Retrabalho</option><option value="Teste">Teste</option><option value="Subconjunto">Subconjunto</option><option value="Pintura">Pintura</option><option value="Lavador">Lavador</option></select></div>
                  <div class="form-group"><label>Senha Temporária</label><input type="text" id="nu-senha" value="Gerada automaticamente ao salvar" readonly style="background:var(--bg-base);color:var(--text-muted);font-style:italic;" /></div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--space-2);">O sistema gerará uma senha aleatória que deverá ser informada ao funcionário.</div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('modal-user-form')">Cancelar</button>
                <button class="btn btn-primary" onclick="UsersModule.saveUser()">Salvar</button>
              </div>
            </div>
          </div>
          
          <div class="modal-overlay" id="modal-edit-user">
            <div class="modal">
              <div class="modal-header">
                <div class="modal-title">Editar Usuário</div>
                <button class="modal-close" onclick="closeModal('modal-edit-user')"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
              <div class="modal-body">
                <div style="display:flex;flex-direction:column;gap:var(--space-3);">
                  <input type="hidden" id="eu-id" />
                  <div class="form-group"><label>Nome do Usuário *</label><input type="text" id="eu-nome" /></div>
                  <div class="form-group"><label>Nível / Perfil de Acesso *</label><select id="eu-perfil">${perfis.map(p=>`<option>${p}</option>`).join('')}</select></div>
                  <div class="form-group"><label>Setor / Disciplina</label><select id="eu-disciplina"><option value="">Nenhum</option><option value="Usinagem">Usinagem</option><option value="Mecânica">Mecânica</option><option value="Mecânica de poço">Mecânica de poço</option><option value="Caldeiraria">Caldeiraria</option><option value="Elétrica">Elétrica</option><option value="Retrabalho">Retrabalho</option><option value="Teste">Teste</option><option value="Subconjunto">Subconjunto</option><option value="Pintura">Pintura</option><option value="Lavador">Lavador</option></select></div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('modal-edit-user')">Cancelar</button>
                <button class="btn btn-primary" onclick="UsersModule.saveEditUser()">Salvar Alterações</button>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
      }
    }, 100);

    return `<div class="page-container" style="animation: fadeIn 0.3s ease;">
      <div class="section-header">
        <div class="section-title">
          <div class="section-title-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg></div>
          <div>Gestão de Usuários</div>
        </div>
        <div class="section-actions">
          <button class="btn btn-primary" onclick="openModal('modal-user-form')">+ Novo Usuário</button>
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Matrícula</th><th>Nome</th><th>Perfil</th><th>Setor</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>
          ${users.map(u=>`<tr onclick="document.querySelectorAll('.selected-row').forEach(el=>el.classList.remove('selected-row')); this.classList.add('selected-row');">
            <td style="font-family:var(--font-mono)">${u.matricula}</td>
            <td><div style="display:flex;align-items:center;gap:var(--space-2)"><div class="avatar avatar-sm">${avatarInitials(u.nome)}</div>${u.nome}</div></td>
            <td><span class="badge badge-primary">${u.perfil}</span></td>
            <td>${u.disciplina ? `<span class="badge badge-ghost" style="color:var(--text-secondary)">${u.disciplina}</span>` : '—'}</td>
            <td>${statusBadge(u.status||'Ativo')}</td>
            <td>
              <div class="table-actions">
                ${u.id !== 'u-superadmin' ? `
                  <button type="button" class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); UsersModule.openEditUser('${u.id}')">Editar</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); UsersModule.resetPassword('${u.id}')" title="Resetar senha para 123456">Resetar Senha</button>
                  <button type="button" class="btn btn-danger btn-sm" onclick="event.stopPropagation(); UsersModule.deleteUser('${u.id}')">Excluir</button>
                ` : ''}
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
  }
  
  async function saveUser() {
    const session = window.Auth ? window.Auth.getSession() : null;
    if (!session || !['Administrador', 'Desenvolvedor', 'Gerente'].includes(session.perfil)) {
      Toast && Toast.error('Acesso Negado', 'Apenas administradores e gerentes podem criar usuários.');
      return;
    }

    const matricula = document.getElementById('nu-mat').value.trim();
    const nome = document.getElementById('nu-nome').value.trim();
    const email = document.getElementById('nu-email').value.trim();
    const perfil = document.getElementById('nu-perfil').value;
    const disciplina = document.getElementById('nu-disciplina').value;
    
    if(!matricula || !nome || !perfil) {
      Toast && Toast.error('Erro', 'Preencha os campos obrigatórios (*).');
      return;
    }
    
    const users = window.Auth ? window.Auth.listUsers() : JSON.parse(localStorage.getItem('diman_users')||'[]');
    if(users.find(u => u.matricula === matricula)) {
      Toast && Toast.error('Erro', 'Matrícula já existe.');
      return;
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPassword = '123456';

    const senhaHash = await Auth.hashPassword(randomPassword);

    const newUser = {
      id: DB.uid('u'),
      matricula,
      nome,
      email,
      perfil,
      disciplina,
      senhaHash,
      senhaInicial: true,
      status: 'Ativo',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('diman_users', JSON.stringify(users));
    if (window.DB && window.DB.syncToSupabase) window.DB.syncToSupabase('diman_users', users);
    
    closeModal('modal-user-form');
    Router.navigate('users', { force: true });

    // Exibir modal customizado com opção de copiar a senha
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal modal-sm" style="max-width:380px;">
        <div class="modal-body" style="text-align:center;padding:var(--space-6)">
          <div style="width:48px;height:48px;border-radius:50%;background:rgba(99, 102, 241, 0.1);display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4);color:var(--brand-primary-light);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:24px;height:24px">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h3 style="margin-bottom:var(--space-2);font-weight:700;">Usuário Criado!</h3>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--space-4)">Informe a senha temporária abaixo ao funcionário. Ele precisará trocá-la no primeiro acesso.</p>
          
          <div style="display:flex;gap:8px;background:var(--bg-base);padding:10px;border-radius:6px;border:1px solid var(--border-default);align-items:center;margin-bottom:var(--space-4);">
            <input type="text" readonly id="temp-pwd-input" value="${randomPassword}" style="flex:1;background:transparent;border:none;outline:none;color:var(--text-primary);font-family:var(--font-mono);font-size:16px;font-weight:bold;text-align:center;" />
            <button class="btn btn-secondary btn-sm" id="btn-copy-pwd" style="padding:6px 12px;font-size:11px;">Copiar</button>
          </div>
        </div>
        <div class="modal-footer" style="justify-content:center;border-top:none;padding-top:0;">
          <button class="btn btn-primary" id="btn-close-pwd" style="width:100%;">Fechar</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => { requestAnimationFrame(() => overlay.classList.add('open')); });
    
    const copyBtn = overlay.querySelector('#btn-copy-pwd');
    const pwdInput = overlay.querySelector('#temp-pwd-input');
    
    // Tenta copiar automaticamente de início
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(randomPassword).then(() => {
        Toast && Toast.success('Copiado!', 'Senha temporária copiada para a área de transferência.');
      }).catch(() => {});
    }

    copyBtn.onclick = () => {
      pwdInput.select();
      pwdInput.setSelectionRange(0, 99999);
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(randomPassword).then(() => {
          Toast && Toast.success('Copiado!', 'Senha copiada com sucesso.');
        }).catch(err => {
          console.error(err);
          Toast && Toast.error('Erro', 'Use copiar manualmente.');
        });
      } else {
        try {
          document.execCommand('copy');
          Toast && Toast.success('Copiado!', 'Senha copiada com sucesso.');
        } catch(e) {
          Toast && Toast.error('Erro', 'Selecione e copie a senha manualmente.');
        }
      }
    };
    
    overlay.querySelector('#btn-close-pwd').onclick = () => {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    };
  }

  function deleteUser(id) {
    const session = window.Auth ? window.Auth.getSession() : null;
    if (!session || !['Administrador', 'Desenvolvedor', 'Gerente'].includes(session.perfil)) {
      Toast && Toast.error('Acesso Negado', 'Apenas administradores e gerentes podem excluir usuários.');
      return;
    }
    window.uiConfirm('Tem certeza que deseja excluir este usuário?', (res) => {
      if (!res) return;
      
      let users = window.Auth ? window.Auth.listUsers() : JSON.parse(localStorage.getItem('diman_users')||'[]');
      const targetUser = users.find(u => u.id === id);
      const targetMatricula = targetUser ? targetUser.matricula : null;
      
      // Encontra todos com a mesma matrícula para deletar os duplicados
      const idsToDelete = targetMatricula ? users.filter(u => u.matricula === targetMatricula).map(u => u.id) : [id];
      
      idsToDelete.forEach(delId => {
        if (window.Auth && window.Auth.deleteUser) {
          window.Auth.deleteUser(delId);
        }
        if (window.DB && window.DB.deleteFromSupabase) window.DB.deleteFromSupabase('diman_users', delId);
      });

      // Fallback
      users = JSON.parse(localStorage.getItem('diman_users')||'[]');
      users = users.filter(u => !idsToDelete.includes(u.id));
      localStorage.setItem('diman_users', JSON.stringify(users));
      if (window.DB && DB.syncToSupabase) DB.syncToSupabase('diman_users', users);
      
      Toast && Toast.success('Sucesso', 'Usuário excluído.');
      Router.navigate('users', { force: true });
    });
  }

  function openEditUser(id) {
    const session = window.Auth ? window.Auth.getSession() : null;
    if (!session || !['Administrador', 'Desenvolvedor', 'Gerente'].includes(session.perfil)) {
      Toast && Toast.error('Acesso Negado', 'Apenas administradores e gerentes podem editar usuários.');
      return;
    }
    
    let users = window.Auth ? window.Auth.listUsers() : JSON.parse(localStorage.getItem('diman_users')||'[]');
    const user = users.find(u => u.id === id);
    if(!user) return;
    
    document.getElementById('eu-id').value = user.id;
    document.getElementById('eu-nome').value = user.nome;
    document.getElementById('eu-perfil').value = user.perfil;
    document.getElementById('eu-disciplina').value = user.disciplina || '';
    
    openModal('modal-edit-user');
  }

  function saveEditUser() {
    const id = document.getElementById('eu-id').value;
    const newNome = document.getElementById('eu-nome').value.trim();
    const newPerfil = document.getElementById('eu-perfil').value;
    const newDisciplina = document.getElementById('eu-disciplina').value;
    
    if(!id || !newPerfil || !newNome) return;
    
    let users = window.Auth ? window.Auth.listUsers() : JSON.parse(localStorage.getItem('diman_users')||'[]');
    const userIndex = users.findIndex(u => u.id === id);
    if(userIndex === -1) return;
    
    users[userIndex].nome = newNome;
    users[userIndex].perfil = newPerfil;
    users[userIndex].disciplina = newDisciplina;
    users[userIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('diman_users', JSON.stringify(users));
    if (window.DB && DB.syncToSupabase) DB.syncToSupabase('diman_users', users);
    
    Toast && Toast.success('Sucesso', 'Usuário atualizado com sucesso.');
    closeModal('modal-edit-user');
    Router.navigate('users', { force: true });
  }

  function resetPassword(id) {
    const session = window.Auth ? window.Auth.getSession() : null;
    if (!session || !['Administrador', 'Desenvolvedor', 'Gerente'].includes(session.perfil)) {
      Toast && Toast.error('Acesso Negado', 'Apenas administradores e gerentes podem resetar senhas.');
      return;
    }
    window.uiConfirm('Tem certeza que deseja resetar a senha deste usuário para 123456?', (res) => {
      if (!res) return;
      let users = window.Auth ? window.Auth.listUsers() : JSON.parse(localStorage.getItem('diman_users')||'[]');
      const userIndex = users.findIndex(u => u.id === id);
      if(userIndex === -1) return;
      
      Auth.hashPassword('123456').then(hash => {
        users[userIndex].senhaHash = hash;
        users[userIndex].senhaInicial = true;
        localStorage.setItem('diman_users', JSON.stringify(users));
        if (window.DB && DB.syncToSupabase) DB.syncToSupabase('diman_users', users);
        Toast && Toast.success('Sucesso', 'Senha resetada para 123456.');
      });
    });
  }

  return { render, saveUser, deleteUser, openEditUser, saveEditUser, resetPassword };
})();
// ================================================================
// ACTION PLAN MODULE — AI-generated action plans for release blockers
// ================================================================
window.ActionPlanModule = (() => {
  const STORAGE_KEY = 'diman_action_plans';

  function getPlans() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function savePlans(plans) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    if (window.DB && window.DB.syncToSupabase) window.DB.syncToSupabase(STORAGE_KEY, plans);
  }

  function render() {
    const eqs = DB.equipment.list();
    const plans = getPlans();

    const sevColors = { 'Alta': 'danger', 'Média': 'warning', 'Baixa': 'info' };
    const statusColors = { 'Pendente': 'ghost', 'Em Andamento': 'warning', 'Concluído': 'success' };
    const statusIcons = { 'Pendente': '⬜', 'Em Andamento': '🔄', 'Concluído': '✅' };

    return `<div class="page-container">
      <div class="section-header">
        <div class="section-title">
          <div class="section-title-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/>
            </svg>
          </div>
          Planos de Ação
        </div>
        <button class="btn btn-primary" onclick="openModal('modal-create-plan')">
          ➕ Novo Plano de Ação
        </button>
      </div>

      <!-- Existing plans -->
      ${plans.length === 0 ? `
        <div class="empty-state" style="padding:var(--space-10);">
          <div style="font-size:3rem;margin-bottom:var(--space-4);">📋</div>
          <h3>Nenhum Plano de Ação</h3>
          <p style="color:var(--text-muted);">Clique em "Novo Plano de Ação" para criar um e adicionar tarefas manualmente.</p>
        </div>
      ` : plans.map(plan => {
        const totalItems = plan.items ? plan.items.length : 0;
        const done = plan.items ? plan.items.filter(i => i.status === 'Concluído').length : 0;
        const progress = totalItems > 0 ? Math.round(done / totalItems * 100) : 0;
        const statusBg = plan.status === 'Concluído' ? 'success' : plan.status === 'Em Andamento' ? 'warning' : 'ghost';

        return `<div class="card" style="margin-bottom:var(--space-5);">
          <!-- Plan header -->
          <div style="padding:var(--space-5);border-bottom:1px solid var(--border-card);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:var(--space-3);">
              <div>
                <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-2);">
                  <span style="font-weight:800;font-size:var(--text-lg);color:var(--text-primary);">📋 ${plan.title || 'Plano Sem Título'}</span>
                  <span class="badge badge-${statusBg}">${plan.status}</span>
                </div>
                <div style="font-size:var(--text-sm);color:var(--text-primary);margin-bottom:var(--space-2);">
                  ${plan.equipmentCodigo ? `<strong>Equipamento:</strong> ${plan.equipmentCodigo}` : 'Sem equipamento associado'}
                </div>
                <div style="font-size:var(--text-xs);color:var(--text-muted);">
                  Criado em ${formatDateTime(plan.createdAt)} por <strong>${plan.createdBy}</strong>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:var(--space-3);">
                <div style="text-align:center;">
                  <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;font-weight:700;letter-spacing:.05em;">Progresso</div>
                  <div style="font-size:1.5rem;font-weight:800;color:var(--color-${progress === 100 ? 'success' : progress > 0 ? 'warning' : 'danger'});">${progress}%</div>
                </div>
                <button class="btn btn-ghost btn-sm" style="color:var(--color-danger);" onclick="ActionPlanModule.deletePlan('${plan.id}')" title="Excluir Plano">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397" /></svg>
                </button>
              </div>
            </div>

            <!-- Progress bar -->
            <div style="margin-top:var(--space-4);">
              <div class="progress-track"><div class="progress-fill ${progress === 100 ? 'success' : progress > 50 ? '' : 'danger'}" style="width:${progress}%"></div></div>
            </div>
          </div>

          <!-- Action items -->
          <div style="padding:var(--space-4);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);">
              <h4 style="margin:0;">Ações do Plano</h4>
              <button class="btn btn-secondary btn-sm" onclick="ActionPlanModule.openAddActionModal('${plan.id}')">➕ Adicionar Ação</button>
            </div>
            ${!plan.items || plan.items.length === 0 ? `
              <div style="text-align:center;padding:var(--space-6);color:var(--text-muted);border:1px dashed var(--border-card);border-radius:var(--radius-lg);">
                <div style="font-weight:700;">Nenhuma ação cadastrada</div>
                <div style="font-size:var(--text-xs);">Clique em "Adicionar Ação" para listar as tarefas deste plano.</div>
              </div>
            ` : `
              <div style="display:flex;flex-direction:column;gap:var(--space-3);">
                ${plan.items.map((item, idx) => {
                  const itemStatus = item.status || 'Pendente';
                  const isDone = itemStatus === 'Concluído';
                  return `<div style="display:flex;gap:var(--space-4);padding:var(--space-4);background:var(--bg-base);border-radius:var(--radius-lg);border-left:4px solid var(--color-${sevColors[item.prioridade] || 'ghost'});${isDone ? 'opacity:0.6;' : ''}transition:all .2s;">
                    <!-- Toggle -->
                    <div style="flex-shrink:0;padding-top:2px;">
                      <button onclick="ActionPlanModule.toggleItemStatus('${plan.id}', ${idx})" style="background:none;border:none;cursor:pointer;font-size:1.3rem;line-height:1;" title="Alterar status">${statusIcons[itemStatus]}</button>
                    </div>
                    <!-- Content -->
                    <div style="flex:1;min-width:0;">
                      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-2);margin-bottom:var(--space-2);flex-wrap:wrap;">
                        <div style="display:flex;align-items:center;gap:var(--space-2);">
                          <span class="badge badge-${sevColors[item.prioridade] || 'ghost'}" style="font-size:10px;">${item.prioridade}</span>
                          <span class="badge badge-${statusColors[itemStatus]}" style="font-size:10px;">${itemStatus}</span>
                        </div>
                        <button class="btn btn-ghost btn-sm" style="color:var(--color-danger);padding:2px 6px;" onclick="ActionPlanModule.deleteAction('${plan.id}', ${idx})" title="Excluir Ação">🗑️</button>
                      </div>
                      <div style="font-size:var(--text-sm);color:var(--text-primary);margin-bottom:var(--space-2);${isDone ? 'text-decoration:line-through;' : ''}"><strong>O que fazer:</strong> ${item.descricao}</div>
                      <div style="display:flex;gap:var(--space-4);font-size:var(--text-xs);color:var(--text-muted);">
                        <span>👤 <strong>Resp:</strong> ${item.responsavel}</span>
                        <span>⏰ <strong>Prazo:</strong> <strong style="color:var(--color-${new Date(item.prazo) < new Date() && !isDone ? 'danger' : 'success'});">${formatDate(item.prazo)}</strong></span>
                      </div>
                    </div>
                  </div>`;
                }).join('')}
              </div>
            `}
          </div>
        </div>`;
      }).join('')}

      <!-- MODAL: Criar Novo Plano -->
      <div id="modal-create-plan" class="modal">
        <div class="modal-content" style="max-width:500px;">
          <div class="modal-header">
            <h3 class="modal-title">Novo Plano de Ação</h3>
            <button class="modal-close" onclick="closeModal('modal-create-plan')">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Título / Motivo do Plano</label>
              <input type="text" class="form-input" id="new-plan-title" placeholder="Ex: Recuperação de Atraso">
            </div>
            <div class="form-group">
              <label class="form-label">Equipamento Associado (Opcional)</label>
              <select class="form-input" id="new-plan-eq">
                <option value="">Nenhum / Não aplicável</option>
                ${eqs.map(e => `<option value="${e.id}">${e.codigo} — ${e.cliente || 'Sem cliente'}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('modal-create-plan')">Cancelar</button>
            <button class="btn btn-primary" onclick="ActionPlanModule.createPlan()">Criar Plano</button>
          </div>
        </div>
      </div>

      <!-- MODAL: Adicionar Ação ao Plano -->
      <div id="modal-add-plan-action" class="modal">
        <div class="modal-content" style="max-width:500px;">
          <div class="modal-header">
            <h3 class="modal-title">Adicionar Ação</h3>
            <button class="modal-close" onclick="closeModal('modal-add-plan-action')">×</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="add-action-plan-id">
            <div class="form-group">
              <label class="form-label">Descrição da Ação</label>
              <textarea class="form-input" id="add-action-desc" rows="3" placeholder="O que precisa ser feito?"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Responsável</label>
              <input type="text" class="form-input" id="add-action-resp" placeholder="Nome ou cargo">
            </div>
            <div style="display:flex; gap:var(--space-4);">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Prazo</label>
                <input type="date" class="form-input" id="add-action-date">
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Prioridade</label>
                <select class="form-input" id="add-action-prio">
                  <option value="Alta">Alta</option>
                  <option value="Média" selected>Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('modal-add-plan-action')">Cancelar</button>
            <button class="btn btn-primary" onclick="ActionPlanModule.addAction()">Salvar Ação</button>
          </div>
        </div>
      </div>

    </div>`;
  }

  function createPlan() {
    const title = document.getElementById('new-plan-title').value.trim();
    const eqId = document.getElementById('new-plan-eq').value;

    if (!title) {
      Toast.error('Erro', 'Informe o título do plano de ação.');
      return;
    }

    const eq = eqId ? DB.equipment.get(eqId) : null;
    const session = window.Auth ? window.Auth.getSession() : null;

    const plan = {
      id: `ap-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      title,
      equipmentId: eqId || null,
      equipmentCodigo: eq ? eq.codigo : null,
      createdAt: new Date().toISOString(),
      createdBy: session?.nome || 'Sistema',
      status: 'Pendente',
      items: [],
    };

    const plans = getPlans();
    plans.unshift(plan);
    savePlans(plans);

    closeModal('modal-create-plan');
    Toast.success('Plano Criado!', 'Plano de Ação criado com sucesso.');
    Router.navigate('action-plans', { force: true });
  }

  function deletePlan(planId) {
    const session = window.Auth ? window.Auth.getSession() : null;
    if (!session || (session.perfil !== 'Administrador' && session.perfil !== 'Desenvolvedor')) {
      Toast.error('Acesso Negado', 'Apenas administradores podem excluir planos de ação.');
      return;
    }
    window.uiConfirm('Tem certeza que deseja excluir este plano de ação?', (res) => {
      if (!res) return;
      const plans = getPlans().filter(p => p.id !== planId);
      savePlans(plans);
      Toast.success('Plano excluído');
      Router.navigate('action-plans', { force: true });
    });
  }

  function openAddActionModal(planId) {
    document.getElementById('add-action-plan-id').value = planId;
    document.getElementById('add-action-desc').value = '';
    document.getElementById('add-action-resp').value = '';
    document.getElementById('add-action-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('add-action-prio').value = 'Média';
    openModal('modal-add-plan-action');
  }

  function addAction() {
    const planId = document.getElementById('add-action-plan-id').value;
    const descricao = document.getElementById('add-action-desc').value.trim();
    const responsavel = document.getElementById('add-action-resp').value.trim();
    const prazo = document.getElementById('add-action-date').value;
    const prioridade = document.getElementById('add-action-prio').value;

    if (!descricao || !responsavel || !prazo) {
      Toast.error('Erro', 'Preencha todos os campos da ação.');
      return;
    }

    const plans = getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (!plan.items) plan.items = [];

    plan.items.push({
      id: `act-${Date.now()}`,
      descricao,
      responsavel,
      prazo,
      prioridade,
      status: 'Pendente'
    });

    updatePlanStatus(plan);
    savePlans(plans);

    closeModal('modal-add-plan-action');
    Toast.success('Ação Adicionada');
    Router.navigate('action-plans', { force: true });
  }

  function deleteAction(planId, itemIdx) {
    window.uiConfirm('Excluir esta ação?', (res) => {
      if (!res) return;
      const plans = getPlans();
      const plan = plans.find(p => p.id === planId);
      if (!plan || !plan.items) return;

      plan.items.splice(itemIdx, 1);
      updatePlanStatus(plan);
      savePlans(plans);

      Toast.success('Ação Excluída');
      Router.navigate('action-plans', { force: true });
    });
  }

  function toggleItemStatus(planId, itemIdx) {
    const plans = getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan || !plan.items) return;

    const current = plan.items[itemIdx].status;
    plan.items[itemIdx].status = current === 'Pendente' ? 'Em Andamento' : current === 'Em Andamento' ? 'Concluído' : 'Pendente';

    updatePlanStatus(plan);
    savePlans(plans);
    Router.navigate('action-plans', { force: true });
  }

  function updatePlanStatus(plan) {
    if (!plan.items || plan.items.length === 0) {
      plan.status = 'Pendente';
      return;
    }
    const allDone = plan.items.every(i => i.status === 'Concluído');
    const anyStarted = plan.items.some(i => i.status !== 'Pendente');
    plan.status = allDone ? 'Concluído' : anyStarted ? 'Em Andamento' : 'Pendente';
  }

  return { render, createPlan, deletePlan, openAddActionModal, addAction, deleteAction, toggleItemStatus };
})();


function switchTab(btn, panelId) {
  const container = btn.closest('.tabs');
  container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(panelId)?.classList.add('active');
}
