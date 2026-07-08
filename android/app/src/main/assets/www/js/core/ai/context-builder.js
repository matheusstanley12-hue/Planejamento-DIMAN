window.DIMAN_CONTEXT_BUILDER = (function() {

  function getCurrentScreenContext() {
    const hash = window.location.hash || '#home';
    let moduleName = 'Dashboard';
    if (hash.includes('equipment')) moduleName = 'Equipamentos (Planejamento)';
    if (hash.includes('checklists')) moduleName = 'Checklists';
    if (hash.includes('parts') || hash.includes('storage')) moduleName = 'Compras & Almoxarifado';
    if (hash.includes('worker-panel')) moduleName = 'Meu Painel (Executante)';
    if (hash.includes('bonus')) moduleName = 'Prêmio Produção / Frequência';
    if (hash.includes('ai')) moduleName = 'Assistente IA';
    if (hash.includes('timeline')) moduleName = 'Timeline';

    return `\nO usuário está acessando no momento a tela: **${moduleName}** (${hash}). Leve este contexto em consideração se a pergunta for genérica (ex: "como uso esta tela?", "o que fazer aqui?").`;
  }

  function getSystemDataOverview(intentTokens) {
    let dataStr = "\n=== DADOS REAIS DO SISTEMA ===\n";
    if (!window.DB) return dataStr + "Nenhum dado carregado.\n";

    const eqs = DB.equipment ? DB.equipment.list() : [];
    const tasks = DB.tasks ? DB.tasks.getAll() : [];
    const parts = DB.parts ? DB.parts.getAll() : [];
    const restr = DB.restrictions ? DB.restrictions.getAll() : [];

    let filterEqs = eqs;
    let isTargeted = false;
    
    if (intentTokens && intentTokens.length > 0) {
       const matched = eqs.filter(e => intentTokens.some(tok => (e.codigo||'').toLowerCase().includes(tok.toLowerCase()) || (e.cliente||'').toLowerCase().includes(tok.toLowerCase())));
       if (matched.length > 0) {
           filterEqs = matched;
           isTargeted = true;
       }
    }

    // Limit to prevent Payload Too Large errors on Pollinations API
    if (!isTargeted) {
        const liberados = eqs.filter(e => e.status === 'Liberado');
        const totalReplannings = eqs.reduce((acc, e) => acc + (e.replanning ? e.replanning.length : 0), 0);
        dataStr += `Resumo Geral: ${eqs.length} equipamentos, ${tasks.length} tarefas abertas, ${parts.length} peças pendentes, ${totalReplannings} replanejamentos históricos globais.\n`;
        dataStr += `Dica: Equipamentos com códigos que começam com SS (SSM, SSR, SSP, etc) são Sondas. Preste muita atenção ao 'Tipo' do equipamento (ex: Sondas de Pesquisas vs Sondas Poços).\n`;
        dataStr += `Equipamentos Liberados (${liberados.length}):\n`;
        liberados.forEach(e => {
            const desc = [e.tipo, e.modelo, e.nome, e.cliente].filter(Boolean).join(' | ');
            dataStr += `- ${e.codigo} (${desc}) - Liberado em: ${e.dataLiberacaoAtual || e.dataLiberacaoPlanejada || 'N/A'}\n`;
        });
        dataStr += `\n`;
        
        // Só injeta o json minificado dos 5 primeiros em manutenção para dar uma ideia à IA.
        filterEqs = eqs.filter(e => e.status === 'Em Manutenção').slice(0, 5);
    }

    const eqMin = filterEqs.map(e => ({
       codigo: e.codigo, os: e.os, cliente: e.cliente, modelo: e.modelo, 
       status: e.status, avanco: e.pctAvanco, custo: e.custoAtual,
       replanejamentos: e.replanning ? e.replanning.length : 0,
       motivos_replan: e.replanning ? e.replanning.map(r => r.motivo).join(' | ') : ''
    }));

    const taskMin = tasks.filter(t => filterEqs.some(e => e.id === t.equipmentId)).map(t => ({
       eq: eqs.find(x => x.id === t.equipmentId)?.codigo, desc: t.descricao, status: t.status
    }));

    const partsMin = parts.filter(p => filterEqs.some(e => e.id === p.equipmentId)).map(p => ({
       eq: eqs.find(x => x.id === p.equipmentId)?.codigo, desc: p.descricao, status: p.status, critica: p.critica
    }));

    dataStr += "Equipamentos Relevantes (Top 5): " + JSON.stringify(eqMin) + "\n";
    if (isTargeted) {
        dataStr += "Tarefas: " + JSON.stringify(taskMin) + "\n";
        dataStr += "Peças: " + JSON.stringify(partsMin) + "\n";
    } else {
        dataStr += "INSTRUÇÃO DIRETA: Formate os números acima como um Relatório Executivo de alto nível para a Diretoria, usando formatação elegante.\n";
    }
    return dataStr;
  }

  function buildFullSystemPrompt(userQuery, parsedIntentTokens) {
    const prompt = window.DIMAN_AI_PROMPT || '';
    let kb = '';
    
    // Inject knowledge base ONLY if user is asking for help/tutorials to save tokens
    const queryLower = (userQuery || '').toLowerCase();
    const needsTutorial = queryLower.includes('como') || queryLower.includes('ajuda') || queryLower.includes('manual') || queryLower.includes('módulo') || queryLower.includes('sistema') || queryLower.includes('cadastrar') || queryLower.includes('onde fica');
    if (needsTutorial) {
        kb = "\n=== BASE DE CONHECIMENTO (LEGADO) ===\n" + (window.DIMAN_KNOWLEDGE_BASE || '');
    }
    
    // Inject agents
    let agentsStr = "";
    if (window.DIMAN_AGENTS) {
        agentsStr = "\n=== AGENTES ESPECIALISTAS ATIVOS ===\n" + Object.keys(window.DIMAN_AGENTS).join(", ") + "\n";
    }

    const screenCtx = getCurrentScreenContext();
    const dataCtx = getSystemDataOverview(parsedIntentTokens);

    const session = window.Auth ? window.Auth.getSession() : null;
    const userName = session && session.nome ? session.nome.split(' ')[0] : 'Usuário';

    return `${prompt}\n${agentsStr}${kb}\n\n=== CONTEXTO DO USUÁRIO ===\nVocê está conversando com: **${userName}**.\n${screenCtx}\n${dataCtx}`;
  }

  return {
    buildFullSystemPrompt
  };

})();
