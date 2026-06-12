window.ManualsAdmin = (() => {
  function render() {
    const session = window.Auth.getSession();
    if (!session || (!window.Auth.hasPermission('equipment') && !window.Auth.hasPermission('admin'))) {
      return `<div class="page-container"><div class="empty-state">Acesso negado.</div></div>`;
    }

    const manuals = window.DB.manuals.list() || [];
    const equipments = window.DB.equipment.list() || [];

    setTimeout(() => {
      document.getElementById('btn-add-manual').addEventListener('click', () => showAddManualModal(equipments));
    }, 100);

    return `
      <div class="page-container" style="animation:fadeIn 0.3s ease;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);">
          <div>
            <h1 style="font-size:var(--text-2xl);font-weight:800;color:var(--text-primary);letter-spacing:-0.02em;">Gestão de Manuais</h1>
            <p style="color:var(--text-secondary);margin-top:var(--space-1);">Cadastre links de manuais e procedimentos (PDF no Drive/SharePoint) para acesso dos executantes.</p>
          </div>
          <button id="btn-add-manual" class="btn btn-primary" style="display:flex;align-items:center;gap:var(--space-2);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Novo Manual
          </button>
        </div>

        <div class="card" style="padding:0;overflow:hidden;background:var(--bg-card);border:1px solid var(--border-card);">
          ${manuals.length === 0 ? `
            <div class="empty-state" style="padding:var(--space-8);text-align:center;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:48px;height:48px;margin:0 auto var(--space-4);color:var(--border-hover);"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
              <h3 style="font-weight:600;color:var(--text-primary);margin-bottom:var(--space-2);">Nenhum manual cadastrado</h3>
              <p style="color:var(--text-secondary);font-size:var(--text-sm);">Adicione o primeiro manual clicando no botão acima.</p>
            </div>
          ` : `
            <table style="width:100%;border-collapse:collapse;text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid var(--border-hover);background:rgba(255,255,255,0.02);">
                  <th style="padding:var(--space-3) var(--space-4);color:var(--text-secondary);font-size:var(--text-xs);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Título / Descrição</th>
                  <th style="padding:var(--space-3) var(--space-4);color:var(--text-secondary);font-size:var(--text-xs);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Equipamento</th>
                  <th style="padding:var(--space-3) var(--space-4);color:var(--text-secondary);font-size:var(--text-xs);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;text-align:right;">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${manuals.map(m => {
                  const eq = equipments.find(e => e.id === m.equipmentId);
                  return `
                    <tr style="border-bottom:1px solid var(--border-card);">
                      <td style="padding:var(--space-3) var(--space-4);">
                        <div style="font-weight:600;color:var(--text-primary);">${m.title}</div>
                        <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px;">${m.description || 'Sem descrição'}</div>
                      </td>
                      <td style="padding:var(--space-3) var(--space-4);">
                        <div style="display:inline-flex;align-items:center;background:var(--bg-base);padding:2px 8px;border-radius:12px;font-size:var(--text-xs);font-weight:500;color:var(--brand-primary-light);">
                          ${eq ? eq.name : 'Equipamento Inválido'}
                        </div>
                      </td>
                      <td style="padding:var(--space-3) var(--space-4);text-align:right;">
                        <a href="${m.link}" target="_blank" class="btn btn-ghost btn-sm" style="color:var(--brand-primary-light);" title="Testar Link">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
                        </a>
                        <button onclick="ManualsAdmin.deleteManual('${m.id}')" class="btn btn-ghost btn-sm" style="color:var(--color-danger);" title="Excluir">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  }

  function showAddManualModal(equipments) {
    const modalId = `modal-${Date.now()}`;
    const modalHTML = `
      <div id="${modalId}" class="modal-overlay" style="display:flex;animation:fadeIn 0.2s ease;">
        <div class="modal" style="width:100%;max-width:500px;animation:slideUp 0.3s ease;">
          <div class="modal-header" style="border-bottom:1px solid var(--border-hover);">
            <h3 style="font-weight:700;color:var(--text-primary);">Adicionar Manual</h3>
            <button class="modal-close" onclick="document.getElementById('${modalId}').remove()"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <div class="modal-body" style="display:flex;flex-direction:column;gap:var(--space-4);">
            <div class="form-group">
              <label>Equipamento Vinculado</label>
              <select id="man-equipment" class="form-control" required>
                ${equipments.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Título do Manual</label>
              <input type="text" id="man-title" class="form-control" placeholder="Ex: Manual de Manutenção Hidráulica" required />
            </div>
            <div class="form-group">
              <label>Descrição (Opcional)</label>
              <textarea id="man-desc" class="form-control" rows="2" placeholder="Ex: Vista explodida e tabela de torques..."></textarea>
            </div>
            <div class="form-group">
              <label>Link do Arquivo (URL Pública)</label>
              <input type="url" id="man-link" class="form-control" placeholder="https://drive.google.com/..." required />
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
                * Cole o link compartilhável do Google Drive, OneDrive ou Dropbox com o PDF.
              </div>
            </div>
          </div>
          <div class="modal-footer" style="justify-content:flex-end;">
            <button class="btn btn-ghost" onclick="document.getElementById('${modalId}').remove()">Cancelar</button>
            <button class="btn btn-primary" id="btn-save-man">Salvar Manual</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('btn-save-man').addEventListener('click', () => {
      const eqId = document.getElementById('man-equipment').value;
      const title = document.getElementById('man-title').value.trim();
      const desc = document.getElementById('man-desc').value.trim();
      const link = document.getElementById('man-link').value.trim();

      if (!title || !link) {
        if (window.Toast) window.Toast.error('Erro', 'Preencha o título e o link.');
        return;
      }

      window.DB.manuals.add({
        id: window.DB.uid('man'),
        equipmentId: eqId,
        title: title,
        description: desc,
        link: link
      });

      if (window.Toast) window.Toast.success('Sucesso', 'Manual cadastrado.');
      document.getElementById(modalId).remove();
      window.Router.navigate('manuals', { force: true });
    });
  }

  function deleteManual(id) {
    if (confirm('Tem certeza que deseja excluir este manual? Ele deixará de ser visível para os executantes.')) {
      window.DB.manuals.delete(id);
      if (window.Toast) window.Toast.success('Excluído', 'Manual excluído com sucesso.');
      window.Router.navigate('manuals', { force: true });
    }
  }

  return { render, deleteManual };
})();

window.WorkerManuals = (() => {
  function render() {
    const session = window.Auth.getSession();
    if (!session || session.perfil !== 'Executante') return `<div class="page-container">Acesso restrito.</div>`;

    const allEquipments = window.DB.equipment.list() || [];
    const allManuals = window.DB.manuals.list() || [];

    // Worker's allocated equipment
    const workerEquipments = [];
    allEquipments.forEach(eq => {
      if (eq.workers && eq.workers.includes(session.matricula)) {
        workerEquipments.push(eq);
      }
    });

    if (workerEquipments.length === 0) {
      return `
        <div class="page-container" style="animation:fadeIn 0.3s ease;">
          <h1 style="font-size:var(--text-xl);font-weight:800;color:var(--text-primary);margin-bottom:var(--space-6);">Meus Manuais</h1>
          <div class="empty-state" style="padding:var(--space-8);text-align:center;background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--radius-xl);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:48px;height:48px;margin:0 auto var(--space-4);color:var(--text-muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <h3 style="color:var(--text-primary);font-weight:600;">Sem Equipamento Alocado</h3>
            <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-top:8px;">Você não possui equipamentos vinculados. Logo, não há manuais disponíveis.</p>
          </div>
        </div>
      `;
    }

    const eqIds = workerEquipments.map(e => e.id);
    const workerManuals = allManuals.filter(m => eqIds.includes(m.equipmentId));

    return `
      <div class="page-container" style="animation:fadeIn 0.3s ease;">
        <h1 style="font-size:var(--text-xl);font-weight:800;color:var(--text-primary);margin-bottom:var(--space-2);">Meus Manuais</h1>
        <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-6);">Acesse a documentação técnica dos equipamentos em que você trabalha.</p>
        
        ${workerManuals.length === 0 ? `
          <div class="empty-state" style="padding:var(--space-6);text-align:center;background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--radius-lg);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:48px;height:48px;margin:0 auto var(--space-4);color:var(--border-hover);"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            <h3 style="font-weight:600;color:var(--text-primary);margin-bottom:var(--space-2);">Nenhum manual encontrado</h3>
            <p style="color:var(--text-secondary);font-size:var(--text-sm);">Não há manuais cadastrados para os seus equipamentos atuais.</p>
          </div>
        ` : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:var(--space-4);">
            ${workerManuals.map(m => {
              const eq = workerEquipments.find(e => e.id === m.equipmentId);
              return `
                <div class="card" style="padding:var(--space-4);display:flex;flex-direction:column;background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--radius-lg);transition:transform 0.2s;box-shadow:var(--shadow-sm);">
                  <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);">
                      <div style="width:28px;height:28px;background:rgba(59,130,246,0.1);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--brand-primary-light);">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                      </div>
                      <span style="font-size:var(--text-xs);font-weight:600;color:var(--brand-primary-light);text-transform:uppercase;">${eq ? eq.name : 'Equipamento'}</span>
                    </div>
                    <h3 style="font-weight:700;color:var(--text-primary);font-size:var(--text-base);line-height:1.3;margin-bottom:var(--space-2);">${m.title}</h3>
                    ${m.description ? `<p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4);line-height:1.4;">${m.description}</p>` : '<div style="margin-bottom:var(--space-4);"></div>'}
                  </div>
                  <a href="${m.link}" target="_blank" class="btn btn-primary" style="width:100%;display:flex;justify-content:center;gap:8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
                    Acessar Manual
                  </a>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  return { render };
})();
