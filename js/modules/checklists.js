window.ChecklistsModule = (() => {
  let currentTab = 'desmob';
  
  // Storage para os anexos na sessão atual
  const attachments = {
    'desmob': [],
    'rec': [],
    'teste': [],
    'lib': []
  };

  const tabs = [
    { id: 'desmob', label: 'Desmobilização' },
    { id: 'rec', label: 'Recebimento' },
    { id: 'teste', label: 'Teste' },
    { id: 'lib', label: 'Liberação' }
  ];

  function setTab(tabId) {
    currentTab = tabId;
    Router.navigate('checklists', { force: true });
  }

  function mockUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = e => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      const today = new Date();
      const dateStr = String(today.getDate()).padStart(2, '0') + '/' + 
                      String(today.getMonth() + 1).padStart(2, '0') + '/' + 
                      today.getFullYear();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        attachments[currentTab].push({
          id: Date.now() + i,
          name: file.name,
          date: dateStr,
          size: sizeMb,
          user: window.Auth && Auth.getCurrentUser() ? Auth.getCurrentUser().nome : 'Usuário'
        });
      }
      
      window.Toast && Toast.success(files.length > 1 ? `${files.length} arquivos anexados!` : 'Arquivo anexado com sucesso!');
      Router.navigate('checklists', { force: true });
    };
    input.click();
  }

  function deleteFile(id) {
    if (confirm('Tem certeza que deseja remover este anexo?')) {
      attachments[currentTab] = attachments[currentTab].filter(f => f.id !== id);
      window.Toast && Toast.success('Anexo removido.');
      Router.navigate('checklists', { force: true });
    }
  }

  function render() {
    const currentFiles = attachments[currentTab] || [];
    
    let html = `
      <div class="page-container" style="max-width:1200px;margin:0 auto;padding:var(--space-6);">
        <div class="section-header">
          <div class="section-title">
            <div class="section-title-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px;height:20px;color:white;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            </div>
            <div>
              Check-lists (Anexos)
              <div class="section-subtitle">Gerenciamento de arquivos e check-lists</div>
            </div>
          </div>
        </div>

        <div class="card" style="padding:0;overflow:hidden;">
          <!-- Tabs -->
          <div style="display:flex;border-bottom:1px solid var(--border-card);background:var(--bg-base);overflow-x:auto;">
            ${tabs.map(t => `
              <div onclick="ChecklistsModule.setTab('${t.id}')" style="padding:var(--space-4) var(--space-5);cursor:pointer;font-weight:700;font-size:var(--text-sm);border-bottom:2px solid ${currentTab === t.id ? 'var(--brand-primary)' : 'transparent'};color:${currentTab === t.id ? 'var(--brand-primary-light)' : 'var(--text-muted)'};transition:all 0.2s;white-space:nowrap;">
                ${t.label}
              </div>
            `).join('')}
          </div>

          <!-- Content -->
          <div style="padding:var(--space-5);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);">
              <h3 style="font-size:1.2rem;font-weight:800;color:var(--text-primary);">Anexos - ${tabs.find(t=>t.id===currentTab)?.label}</h3>
              <button class="btn btn-primary" onclick="ChecklistsModule.mockUpload()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;margin-right:8px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Anexar Arquivo
              </button>
            </div>

            ${currentFiles.length === 0 ? `
              <div class="empty-state" style="padding:var(--space-8) var(--space-4);">
                <p>Nenhum anexo encontrado para esta etapa.</p>
              </div>
            ` : `
              <div class="table-wrap">
                <table style="width:100%;text-align:left;">
                  <thead>
                    <tr>
                      <th>Nome do Arquivo</th>
                      <th>Data</th>
                      <th>Tamanho</th>
                      <th>Enviado por</th>
                      <th style="width:50px;">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${currentFiles.map(f => `
                      <tr>
                        <td>
                          <div style="display:flex;align-items:center;gap:var(--space-2);font-weight:600;color:var(--brand-primary-light);">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:16px;height:16px;color:var(--text-muted)"><path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                            ${f.name}
                          </div>
                        </td>
                        <td>${f.date}</td>
                        <td>${f.size}</td>
                        <td>${f.user}</td>
                        <td>
                          <button class="btn btn-ghost btn-sm" onclick="ChecklistsModule.deleteFile(${f.id})" title="Remover Anexo" style="color:var(--color-danger);padding:4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
    return html;
  }

  return { render, setTab, mockUpload, deleteFile };
})();

// Register route
if (typeof Router !== 'undefined') {
  Router.register('checklists', ChecklistsModule.render);
}
