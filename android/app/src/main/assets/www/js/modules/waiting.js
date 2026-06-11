window.WaitingModule = (() => {
  function render() {
    const eqs = DB.equipment.list().filter(e => e.status === 'Aguardando Manutenção');
    return `
      <div class="page-container" style="animation: fadeIn 0.3s ease;">
        <div class="section-header">
          <div class="section-title">
            <div class="section-title-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>Aguardando Manutenção<div class="section-subtitle">Equipamentos programados ou aguardando atividades</div></div>
          </div>
        </div>
        <div style="display:grid;gap:var(--space-4);grid-template-columns:repeat(auto-fill,minmax(300px,1fr));">
          ${eqs.length > 0 ? eqs.map(e => `
            <div class="card hover-lift" onclick="Router.navigate('equipment-panel', {id:'${e.id}'})" style="cursor:pointer;padding:var(--space-4);border-left:4px solid var(--color-warning);">
              <div style="font-size:1.4rem;font-weight:900;">${e.codigo}</div>
              <div style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-2);">${e.nome}</div>
              <div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);color:var(--text-muted);">
                <span class="badge badge-warning">Aguardando Manutenção</span>
                ${e.cliente ? `<span>Cliente: ${e.cliente}</span>` : ''}
              </div>
            </div>
          `).join('') : '<div style="grid-column:1/-1;padding:var(--space-6);color:var(--text-muted);text-align:center;">Nenhum equipamento aguardando manutenção.</div>'}
        </div>
      </div>
    `;
  }
  return { render };
})();
