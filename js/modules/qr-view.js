window.QrViewModule = (() => {
  function render(id) {
    const eq = DB.equipment.get(id);
    if (!eq) {
      return `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;">
          <div style="background:#1e293b;padding:40px;border-radius:12px;text-align:center;border:1px solid #334155;color:white;">
            <h2 style="margin-bottom:10px;">Equipamento não encontrado</h2>
            <p style="color:#94a3b8;">O equipamento solicitado não existe ou foi removido.</p>
          </div>
        </div>
      `;
    }

    const pct = eq.pctAvanco || 0;
    const progressColor = pct >= 80 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
    
    const statusColors = {
      'Em Manutenção': 'var(--brand-primary-light)',
      'Aguardando Manutenção': 'var(--color-warning)',
      'Liberado': 'var(--color-success)',
      'Bloqueado': 'var(--color-danger)',
    };
    const sColor = statusColors[eq.status] || 'var(--text-secondary)';

    return `
      <div style="min-height:100vh;background:var(--bg-body);color:white;padding:20px;font-family:var(--font-sans);">
        <div style="max-width:600px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:30px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;background:var(--bg-card);border-radius:16px;margin-bottom:15px;border:1px solid var(--border-card);">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:30px;height:30px;color:var(--brand-primary);"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
            </div>
            <h1 style="font-size:2rem;font-weight:900;margin:0;letter-spacing:-0.03em;">${eq.codigo}</h1>
            <div style="color:var(--text-secondary);font-size:1.1rem;margin-top:5px;">${eq.nome}</div>
          </div>

          <div style="background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--radius-lg);padding:var(--space-6);margin-bottom:var(--space-4);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);">
              <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">Status Atual</div>
              <div style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:0.85rem;font-weight:700;background:${sColor}20;color:${sColor};border:1px solid ${sColor}40;">
                ${eq.status}
              </div>
            </div>

            <div style="margin-bottom:var(--space-5);">
              <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);">
                <span style="font-size:var(--text-sm);font-weight:600;">Progresso da Manutenção</span>
                <span style="font-size:var(--text-sm);font-weight:700;color:${progressColor};">${pct}%</span>
              </div>
              <div class="progress-track" style="height:12px;background:var(--bg-base);border-radius:6px;overflow:hidden;">
                <div class="progress-fill" style="width:${pct}%;background:${progressColor};height:100%;border-radius:6px;transition:width 0.5s ease;"></div>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
              <div style="background:var(--bg-base);padding:var(--space-3);border-radius:var(--radius-md);">
                <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Início</div>
                <div style="font-weight:600;font-size:var(--text-sm);">${eq.dataChegada ? formatDate(eq.dataChegada) : '—'}</div>
              </div>
              <div style="background:var(--bg-base);padding:var(--space-3);border-radius:var(--radius-md);">
                <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Previsão de Saída</div>
                <div style="font-weight:600;font-size:var(--text-sm);color:var(--text-primary);">${eq.dataLiberacaoAtual ? formatDate(eq.dataLiberacaoAtual) : '—'}</div>
              </div>
            </div>
            
            <div style="margin-top:var(--space-4);padding-top:var(--space-4);border-top:1px solid var(--border-card);">
              <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);">
                <span style="color:var(--text-muted);">Cliente:</span>
                <span style="font-weight:600;">${eq.cliente || '—'}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);margin-top:var(--space-2);">
                <span style="color:var(--text-muted);">OS:</span>
                <span style="font-weight:600;">${eq.os || '—'}</span>
              </div>
            </div>
          </div>
          
          <div style="text-align:center;color:var(--text-muted);font-size:0.8rem;margin-top:40px;">
            DIMAN-BHZ &copy; ${new Date().getFullYear()}. Informações atualizadas em tempo real.
          </div>
        </div>
      </div>
    `;
  }
  return { render };
})();
