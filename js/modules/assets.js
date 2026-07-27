window.AssetsModule = (() => {
  function render() {
    const assets = window.DB && window.DB.assets ? window.DB.assets.list() : [];
    
    return `
      <div class="page-container" style="animation: fadeIn 0.3s ease;">
        <div class="section-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div class="section-title">
            <div class="section-title-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.99l1.003.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
            </div>
            <h2>Bens</h2>
          </div>
          <button class="btn btn-primary" onclick="window.AssetsModule.openCreate()">+ Novo Bem</button>
        </div>
        
        <div class="table-container" style="margin-top:20px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código do Bem</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Criado Em</th>
                <th style="text-align:right">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${assets.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px;">Nenhum bem cadastrado.</td></tr>' : 
                assets.map(a => `
                  <tr>
                    <td style="font-weight:700;color:var(--text-primary);">${a.codigo || '-'}</td>
                    <td>${a.nome || '-'}</td>
                    <td>${a.tipo ? `<span style="background:var(--bg-elevated);padding:2px 8px;border-radius:12px;font-size:11px;color:var(--text-secondary);border:1px solid var(--border-card);">${a.tipo}</span>` : '-'}</td>
                    <td style="color:var(--text-secondary);font-size:12px;">${a.createdAt ? new Date(a.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                    <td style="text-align:right;">
                       <button class="btn btn-ghost btn-sm" onclick="window.AssetsModule.openEdit('${a.id}')" title="Editar">✏️</button>
                       <button class="btn btn-ghost btn-sm" style="color:var(--color-danger);" onclick="window.AssetsModule.deleteAsset('${a.id}')" title="Excluir">🗑️</button>
                    </td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function getAssetForm(a = null) {
    return `
      <input type="hidden" id="asset-id" value="${a ? a.id : ''}">
      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        <div class="form-row cols-2">
          <div class="form-group"><label>Código do Bem *</label><input type="text" id="asset-codigo" class="input" placeholder="Ex: BEM-01" value="${a ? (a.codigo||'') : ''}" required></div>
          <div class="form-group"><label>Tipo</label><select id="asset-tipo" class="form-control" style="width:100%;height:38px;background:var(--bg-base);border:1px solid var(--border-card);border-radius:var(--radius-md);padding:0 var(--space-3);color:var(--text-primary);">
              ${['Equipamento Móvel', 'Ferramenta', 'Veículo', 'Equipamento Fixo', 'Outros'].map(t => `<option value="${t}" ${a && a.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select></div>
        </div>
        <div class="form-group"><label>Descrição / Nome</label><input type="text" id="asset-nome" class="input" placeholder="Nome do bem" value="${a ? (a.nome||'') : ''}"></div>
        <div class="form-row cols-3">
          <div class="form-group"><label>Fabricante</label><input type="text" id="asset-fabricante" class="input" value="${a ? (a.fabricante||'') : ''}"></div>
          <div class="form-group"><label>Modelo</label><input type="text" id="asset-modelo" class="input" value="${a ? (a.modelo||'') : ''}"></div>
          <div class="form-group"><label>Série / Placa</label><input type="text" id="asset-serial" class="input" value="${a ? (a.serial||'') : ''}"></div>
        </div>
        <div class="form-group"><label>Observações</label><textarea id="asset-obs" class="input" style="min-height:60px;">${a ? (a.observacoes||'') : ''}</textarea></div>
      </div>
    `;
  }

  function ensureModalExists(html, title) {
    let el = document.getElementById('modal-asset');
    if (el) el.remove();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal-overlay" id="modal-asset">
        <div class="modal modal-md">
          <div class="modal-header">
            <div class="modal-title">${title}</div>
            <button class="modal-close" onclick="closeModal('modal-asset')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">${html}</div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('modal-asset')">Cancelar</button>
            <button class="btn btn-primary" onclick="window.AssetsModule.save()">Salvar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
  }

  function openCreate() {
    ensureModalExists(getAssetForm(), 'Novo Bem');
    if (window.openModal) window.openModal('modal-asset');
    setTimeout(() => document.getElementById('asset-codigo')?.focus(), 100);
  }

  function openEdit(id) {
    const a = window.DB.assets.list().find(x => x.id === id);
    if (!a) return;
    ensureModalExists(getAssetForm(a), `Editar Bem — ${a.codigo}`);
    if (window.openModal) window.openModal('modal-asset');
    setTimeout(() => document.getElementById('asset-codigo')?.focus(), 100);
  }

  function save() {
    const idEl = document.getElementById('asset-id');
    const id = idEl ? idEl.value : null;
    const codigo = document.getElementById('asset-codigo').value.trim().toUpperCase();
    
    if (!codigo) {
      if (window.Toast) window.Toast.error('Erro', 'Código do bem é obrigatório.');
      return;
    }
    
    const data = {
      codigo,
      tipo: document.getElementById('asset-tipo') ? document.getElementById('asset-tipo').value : '',
      nome: document.getElementById('asset-nome') ? document.getElementById('asset-nome').value : '',
      fabricante: document.getElementById('asset-fabricante') ? document.getElementById('asset-fabricante').value : '',
      modelo: document.getElementById('asset-modelo') ? document.getElementById('asset-modelo').value : '',
      serial: document.getElementById('asset-serial') ? document.getElementById('asset-serial').value : '',
      observacoes: document.getElementById('asset-obs') ? document.getElementById('asset-obs').value : ''
    };
    
    if (id) {
      window.DB.assets.update(id, data);
      if (window.Toast) window.Toast.success('Bem atualizado!', codigo);
    } else {
      window.DB.assets.add({ id: window.DB.uid ? window.DB.uid('ast') : 'ast-'+Date.now(), ...data });
      if (window.Toast) window.Toast.success('Bem criado!', codigo);
    }
    if (window.closeModal) window.closeModal('modal-asset');
    if (window.Router) window.Router.navigate('assets', { force: true });
  }

  function deleteAsset(id) {
    if (confirm('Tem certeza que deseja excluir este Bem?')) {
      window.DB.assets.delete(id);
      if (window.Toast) window.Toast.info('Bem excluído', '');
      if (window.Router) window.Router.navigate('assets', { force: true });
    }
  }

  return { render, openCreate, openEdit, save, deleteAsset };
})();
