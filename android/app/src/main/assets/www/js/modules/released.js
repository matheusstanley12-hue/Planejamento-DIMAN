window.ReleasedModule = (() => {
  let selectedMonth = 'all';

  function filter(val) {
    selectedMonth = val;
    if (window.Router) window.Router.navigate('released', { force: true });
  }

  function render() {
    let eqs = DB.equipment.list().filter(e => e.status === 'Liberado');
    
    // Sort by most recent release date first
    eqs.sort((a,b) => ((b.dataRealLiberacao || b.dataLiberacaoAtual) || '').localeCompare((a.dataRealLiberacao || a.dataLiberacaoAtual) || ''));

    // Extract unique months for the dropdown
    const monthsSet = new Set();
    eqs.forEach(e => {
        if (e.dataRealLiberacao) {
            monthsSet.add(e.dataRealLiberacao.substring(0, 7)); // YYYY-MM
        } else if (e.dataLiberacaoAtual) {
            monthsSet.add(e.dataLiberacaoAtual.substring(0, 7)); // YYYY-MM
        }
    });
    
    // Convert to sorted array (newest first)
    const months = Array.from(monthsSet).sort().reverse();
    
    if (selectedMonth && selectedMonth !== 'all') {
        eqs = eqs.filter(e => {
            const date = e.dataRealLiberacao || e.dataLiberacaoAtual || '';
            return date.startsWith(selectedMonth);
        });
    }

    const monthOptions = months.map(m => {
        const [yy, mm] = m.split('-');
        return `<option value="${m}" ${selectedMonth === m ? 'selected' : ''}>${mm}/${yy}</option>`;
    }).join('');

    return `
      <div class="page-container" style="animation: fadeIn 0.3s ease;">
        <div class="section-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div class="section-title">
            <div class="section-title-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>Equipamentos Liberados<div class="section-subtitle">Histórico de equipamentos com manutenção concluída</div></div>
          </div>
          
          <div style="display:flex; align-items:center; gap:var(--space-2);">
            <div style="position: relative; width: 220px; background: var(--bg-card, #fff); border-radius: 8px; border: 1px solid var(--border-card, #e2e8f0);">
              <select class="input" style="width:100%; padding-left: 36px; padding-top: 8px; padding-bottom: 8px; font-weight: 600; font-size: 0.9rem; border: none; background-color: transparent; color: var(--text-primary); cursor: pointer; appearance: none;" onchange="window.ReleasedModule.filter(this.value)">
                  <option value="all">Todos os meses</option>
                  ${monthOptions}
              </select>
              <div style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--primary); pointer-events: none;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top: 24px;">
          ${(() => {
            if (eqs.length === 0) return '<div style="padding:var(--space-6);color:var(--text-muted);text-align:center;">Nenhum equipamento liberado encontrado para este mês.</div>';
            
            // Group by tipo
            const groups = {};
            eqs.forEach(e => {
                const tipo = e.tipo || 'Outros Equipamentos';
                if (!groups[tipo]) groups[tipo] = [];
                groups[tipo].push(e);
            });
            
            // Render groups
            return Object.keys(groups).sort().map(tipo => `
              <div style="margin-bottom: 32px;">
                <h3 style="font-size: 1.1rem; color: var(--text-secondary); border-bottom: 2px solid var(--border-light, #e2e8f0); padding-bottom: 8px; margin-bottom: 16px; font-weight: 700;">
                  ${tipo} <span style="font-size:0.8rem; font-weight:500; background:var(--bg-card); padding:2px 8px; border-radius:12px; border:1px solid var(--border-card); margin-left:8px;">${groups[tipo].length} equipamento(s)</span>
                </h3>
                <div style="display:grid;gap:var(--space-4);grid-template-columns:repeat(auto-fill,minmax(300px,1fr));">
                  ${groups[tipo].map(e => `
                    <div class="card hover-lift" onclick="Router.navigate('equipment-panel', {id:'${e.id}'})" style="cursor:pointer;padding:var(--space-4);border-left:4px solid var(--color-success);display:flex;flex-direction:column;gap:8px;">
                      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                          <div style="font-size:1.4rem;font-weight:900;">${e.codigo}</div>
                          <div style="color:var(--text-secondary);font-size:var(--text-sm);">${e.nome || 'Sem Nome'}</div>
                        </div>
                        <span class="badge badge-success">Liberado</span>
                      </div>
                      
                      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size:var(--text-xs); color:var(--text-muted); background: var(--bg-body, #f8fafc); padding: 8px; border-radius: 6px; margin-top: 4px;">
                        <div>
                          <strong style="display:block;color:var(--text-primary);margin-bottom:2px;">Cliente</strong>
                          ${e.cliente || '-'}
                        </div>
                        <div>
                          <strong style="display:block;color:var(--text-primary);margin-bottom:2px;">OS</strong>
                          ${e.os || '-'}
                        </div>
                        <div>
                          <strong style="display:block;color:var(--text-primary);margin-bottom:2px;">Data Planejada</strong>
                          ${e.dataLiberacaoPlanejada ? window.formatDate(e.dataLiberacaoPlanejada) : '-'}
                        </div>
                        <div>
                          <strong style="display:block;color:var(--text-primary);margin-bottom:2px;">Data Real</strong>
                          <span style="color:var(--color-success);font-weight:600;">${e.dataRealLiberacao ? window.formatDate(e.dataRealLiberacao) : (e.dataLiberacaoAtual ? window.formatDate(e.dataLiberacaoAtual) : '-')}</span>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('');
          })()}
        </div>
      </div>
    `;
  }
  return { render, filter };
})();
