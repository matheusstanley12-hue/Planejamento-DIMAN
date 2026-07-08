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

    // Se o intentToken mencionar uma sonda específica (ex: SSH530), filtra para evitar overload.
    let filterEqs = eqs;
    if (intentTokens && intentTokens.length > 0) {
       const matched = eqs.filter(e => intentTokens.some(tok => (e.codigo||'').toLowerCase().includes(tok.toLowerCase()) || (e.cliente||'').toLowerCase().includes(tok.toLowerCase())));
       if (matched.length > 0) filterEqs = matched;
    }

    // Minificando os equipamentos retornados
    const eqMin = filterEqs.map(e => ({
       codigo: e.codigo, cliente: e.cliente, status: e.status, avanco: e.pctAvanco,
       custo: e.custoAtual, previsao: e.dataLiberacaoAtual || 'Sem previsão'
    }));

    const taskMin = tasks.filter(t => filterEqs.some(e => e.id === t.equipmentId)).map(t => ({
       eq: eqs.find(x => x.id === t.equipmentId)?.codigo, desc: t.descricao, status: t.status, responsavel: t.responsavel
    }));

    const partsMin = parts.filter(p => filterEqs.some(e => e.id === p.equipmentId)).map(p => ({
       eq: eqs.find(x => x.id === p.equipmentId)?.codigo, desc: p.descricao, status: p.status, critica: p.critica
    }));

    dataStr += "Equipamentos Relevantes: " + JSON.stringify(eqMin) + "\n";
    dataStr += "Tarefas Relacionadas: " + JSON.stringify(taskMin) + "\n";
    dataStr += "Peças Relacionadas: " + JSON.stringify(partsMin) + "\n";
    return dataStr;
  }

  function buildFullSystemPrompt(userQuery, parsedIntentTokens) {
    const prompt = window.DIMAN_AI_PROMPT || '';
    const kb = window.DIMAN_KNOWLEDGE_BASE || '';
    
    // Inject agents
    let agentsStr = "";
    if (window.DIMAN_AGENTS) {
        agentsStr = "\n=== AGENTES ESPECIALISTAS ATIVOS ===\n" + Object.keys(window.DIMAN_AGENTS).join(", ") + "\n";
    }

    const screenCtx = getCurrentScreenContext();
    const dataCtx = getSystemDataOverview(parsedIntentTokens);

    return `${prompt}\n${agentsStr}\n=== BASE DE CONHECIMENTO (LEGADO) ===\n${kb}\n\n=== CONTEXTO DO USUÁRIO ===\n${screenCtx}\n${dataCtx}`;
  }

  return {
    buildFullSystemPrompt
  };

})();
