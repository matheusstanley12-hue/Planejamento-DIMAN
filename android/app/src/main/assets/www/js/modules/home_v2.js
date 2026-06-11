window.HomeModule = (() => {
  function render() {
    const eqs = window.DB.equipment.list();
    const parts = window.DB.parts.getAll();
    const restrictions = window.DB.restrictions.getAll();
    const today = new Date().toISOString().slice(0,10);

    const emManutencao = eqs.filter(e => e.status !== 'Liberado').length;
    let atrasados = 0;
    eqs.forEach(e => {
      if (e.status !== 'Liberado' && e.dataLiberacaoAtual) {
        const days = daysBetween(today, e.dataLiberacaoAtual);
        if (days < 0) atrasados++;
      }
    });
    
    // Liberações da semana (next 7 days)
    const libsThisWeek = eqs.filter(e => e.status !== 'Liberado' && e.dataLiberacaoAtual && daysBetween(today, e.dataLiberacaoAtual) >= 0 && daysBetween(today, e.dataLiberacaoAtual) <= 7).length;
    const restrAbertas = restrictions.filter(r => r.status === 'Aberta').length;
    const partsPendentes = parts.filter(p => ['Solicitada','Comprada','Em Transporte'].includes(p.status)).length;

    // Wait a tick to re-apply filter if needed
    setTimeout(() => {
      if (activeCategory) {
        filterByCategory(activeCategory, true);
      }
    }, 50);

    return `
      <div style="max-width:1200px;margin:0 auto;padding:var(--space-6);">
        <!-- Top Indicators -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:var(--space-4);margin-bottom:var(--space-6);">
          <div id="summary-card-manutencao" class="card home-summary-card" style="padding:var(--space-4);text-align:center;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="window.HomeModule.filterByCategory('manutencao')" title="Clique para filtrar">
            <div style="font-size:var(--text-3xl);font-weight:800;color:var(--brand-primary-light);">${emManutencao}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;">Em Manutenção</div>
          </div>
          <div id="summary-card-atrasado" class="card home-summary-card" style="padding:var(--space-4);text-align:center;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="window.HomeModule.filterByCategory('atrasado')" title="Clique para filtrar">
            <div style="font-size:var(--text-3xl);font-weight:800;color:var(--color-danger);">${atrasados}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;">Atrasados</div>
          </div>
          <div id="summary-card-lib7" class="card home-summary-card" style="padding:var(--space-4);text-align:center;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="window.HomeModule.filterByCategory('lib7')" title="Clique para filtrar">
            <div style="font-size:var(--text-3xl);font-weight:800;color:var(--color-success);">${libsThisWeek}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;">Liberações (7 dias)</div>
          </div>
          <div id="summary-card-restr" class="card home-summary-card" style="padding:var(--space-4);text-align:center;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="window.HomeModule.filterByCategory('restr')" title="Clique para filtrar">
            <div style="font-size:var(--text-3xl);font-weight:800;color:var(--color-warning);">${restrAbertas}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;">Restrições Abertas</div>
          </div>
          <div id="summary-card-pecas" class="card home-summary-card" style="padding:var(--space-4);text-align:center;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="window.HomeModule.filterByCategory('pecas')" title="Clique para filtrar">
            <div style="font-size:var(--text-3xl);font-weight:800;color:var(--color-orange);">${partsPendentes}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;">Peças Pendentes</div>
          </div>
        </div>

        <!-- Search Bar & Actions -->
        <div style="margin-bottom:var(--space-6); display:flex; gap:var(--space-4); align-items:center; max-width:800px; margin-left:auto; margin-right:auto;">
          <div class="input-group" style="flex:1;">
            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input type="text" id="home-search" placeholder="Pesquisar equipamento (Ex: SSM-288)..." style="font-size:1.2rem;padding:var(--space-4) var(--space-4) var(--space-4) 40px;" oninput="window.HomeModule.filter(this.value)" />
          </div>
          <button class="btn btn-primary" style="padding:var(--space-4) var(--space-6);font-size:1.1rem;" onclick="window.HomeModule.openCreateModal()">+ Novo Equipamento</button>
        </div>

        <!-- Equipment List -->
        <div id="home-eq-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:var(--space-5);">
          ${eqs.map(e => {
            const pct = e.pctAvanco || 0;
            const dtPlan = e.dataLiberacaoPlanejada || '';
            const dtPrev = e.dataLiberacaoAtual || dtPlan;
            let desvio = 0;
            if (dtPlan && dtPrev) {
              desvio = daysBetween(dtPlan, dtPrev);
            }
            
            const isManutencao = e.status !== 'Liberado' ? '1' : '0';
            const isAtrasado = (e.status !== 'Liberado' && e.dataLiberacaoAtual && daysBetween(today, e.dataLiberacaoAtual) < 0) ? '1' : '0';
            const isLib7 = (e.status !== 'Liberado' && e.dataLiberacaoAtual && daysBetween(today, e.dataLiberacaoAtual) >= 0 && daysBetween(today, e.dataLiberacaoAtual) <= 7) ? '1' : '0';
            const hasRestr = restrictions.some(r => r.equipmentId === e.id && r.status === 'Aberta') ? '1' : '0';
            const hasPecas = parts.some(p => p.equipmentId === e.id && ['Solicitada','Comprada','Em Transporte'].includes(p.status)) ? '1' : '0';
            
            return `
            <div class="card hover-lift home-eq-card" data-search="${e.codigo.toLowerCase()} ${e.nome.toLowerCase()}" data-manutencao="${isManutencao}" data-atrasado="${isAtrasado}" data-lib7="${isLib7}" data-restr="${hasRestr}" data-pecas="${hasPecas}" onclick="window.Router.navigate('equipment-panel', {id: '${e.id}'})" style="cursor:pointer;display:flex;flex-direction:column;padding:var(--space-5);border-top:4px solid ${pct>=100?'var(--color-success)':pct>0?'var(--brand-primary-light)':'var(--text-muted)'};">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-3);">
                <div>
                  <div style="font-size:1.4rem;font-weight:900;color:var(--text-primary);letter-spacing:-0.02em;">${e.codigo}</div>
                  <div style="font-size:var(--text-xs);font-weight:600;color:var(--text-secondary);margin-top:2px;">Cliente: ${e.cliente || '—'}</div>
                </div>
                <div>
                  ${statusBadge(e.status)}
                </div>
              </div>
              
              <div style="margin-bottom:var(--space-4);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <span style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;">Avanço Físico</span>
                  <span style="font-size:1rem;font-weight:800;color:var(--text-primary);">${pct}%</span>
                </div>
                <div class="progress-track" style="height:8px;"><div class="progress-fill ${pct>=80?'success':pct>=50?'':'warning'}" style="width:${pct}%"></div></div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-4);background:var(--bg-base);padding:var(--space-3);border-radius:var(--radius-md);">
                <div>
                  <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;">Planejado</div>
                  <div style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);">${dtPlan ? formatDate(dtPlan) : '—'}</div>
                </div>
                <div>
                  <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;">Previsto Atual</div>
                  <div style="font-size:var(--text-sm);font-weight:700;color:var(--brand-primary-light);">${dtPrev ? formatDate(dtPrev) : '—'}</div>
                </div>
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:var(--space-3);border-top:1px solid var(--border-card);">
                <div style="font-size:var(--text-xs);color:var(--text-muted);">Desvio no Prazo:</div>
                <div style="font-size:1.1rem;font-weight:800;color:var(--color-${desvio>0?'danger':desvio<0?'success':'text-secondary'});">${desvio>0?'+':''}${desvio} dias</div>
              </div>
            </div>
            `;
          }).join('')}
        </div>

        <!-- Create Equipment Modal -->
        <div id="home-create-modal" class="modal-overlay">
          <div class="card" style="width:100%;max-width:500px;padding:var(--space-6);">
            <h3 style="margin-bottom:var(--space-4);font-size:1.5rem;font-weight:800;">Novo Equipamento</h3>
            <div class="form-group" style="margin-bottom:var(--space-3);">
              <label>Código do Equipamento</label>
              <input type="text" id="new-eq-codigo" placeholder="Ex: SSM-500" />
            </div>
            <div class="form-group" style="margin-bottom:var(--space-3);">
              <label>Nome / Descrição</label>
              <input type="text" id="new-eq-nome" placeholder="Ex: Sonda de Perfuração" />
            </div>
            <div class="form-group" style="margin-bottom:var(--space-3);">
              <label>Cliente</label>
              <input type="text" id="new-eq-cliente" placeholder="Ex: VALE" />
            </div>
            <div class="form-group" style="margin-bottom:var(--space-4);">
              <label>Data Planejada de Liberação</label>
              <input type="date" id="new-eq-data" />
            </div>
            <div style="display:flex;gap:var(--space-3);justify-content:flex-end;">
              <button class="btn btn-ghost" onclick="document.getElementById('home-create-modal').classList.remove('open')">Cancelar</button>
              <button class="btn btn-primary" onclick="window.HomeModule.saveEquipment()">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function openCreateModal() {
    const modal = document.getElementById('home-create-modal');
    if (!modal) return;
    modal.classList.add('open');
    document.getElementById('new-eq-codigo').value = '';
    document.getElementById('new-eq-nome').value = '';
    document.getElementById('new-eq-cliente').value = '';
    document.getElementById('new-eq-data').value = '';
  }

  function saveEquipment() {
    try {
      const codigo = document.getElementById('new-eq-codigo').value.trim();
      const nome = document.getElementById('new-eq-nome').value.trim();
      const cliente = document.getElementById('new-eq-cliente').value.trim();
      const dataPlanejada = document.getElementById('new-eq-data').value;

      if (!codigo || !nome) {
        window.Toast.error('Erro', 'Código e Nome são obrigatórios.');
        return;
      }

      const newEq = {
        codigo,
        nome,
        cliente,
        status: 'Em Manutenção',
        pctAvanco: 0,
        dataPlanejadaInicio: new Date().toISOString().slice(0,10),
        dataLiberacaoPlanejada: dataPlanejada,
        dataLiberacaoAtual: dataPlanejada,
        disciplinas: ['Mecânica', 'Elétrica', 'Caldeiraria', 'Usinagem', 'Pintura', 'Hidráulica'],
        observacoes: '',
        responsavel: window.Auth.getSession()?.nome || ''
      };

      const created = window.DB.equipment.create(newEq);
      document.getElementById('home-create-modal').classList.remove('open');
      window.Toast.success('Equipamento cadastrado com sucesso!');
      window.Router.navigate('home', {force:true});
    } catch (e) {
      alert('Erro ao salvar: ' + e.message + '\n\n' + e.stack);
    }
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
  }

  return { render, filter, filterByCategory, openCreateModal, saveEquipment };
})();
