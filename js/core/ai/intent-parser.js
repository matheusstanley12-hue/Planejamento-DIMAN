window.DIMAN_INTENT_PARSER = (function() {
  function parseIntent(query) {
    const tokens = [];
    const lowerQuery = query.toLowerCase().trim();
    
    if (!window.DB || !window.DB.equipment) return tokens;

    const eqs = DB.equipment.list();
    const queryClean = lowerQuery.replace(/[- ]/g, '');
    
    // Checa se mencionou algum equipamento ou cliente independentemente do tamanho da query
    eqs.forEach(e => {
      const codClean = (e.codigo||'').toLowerCase().replace(/[- ]/g, '');
      const clientClean = (e.cliente||'').toLowerCase().replace(/[- ]/g, '');
      
      let matched = false;
      if ((codClean && codClean.length >= 3 && queryClean.includes(codClean)) || 
          (clientClean && clientClean.length >= 3 && queryClean.includes(clientClean))) {
        matched = true;
      } else {
        // Tenta achar apenas pelos números (ex: "265" bater com "SSM 265")
        const numMatch = codClean.match(/\d+/);
        if (numMatch && numMatch[0].length >= 2) {
          const num = numMatch[0];
          // Usamos lowerQuery original para não juntar as palavras ao testar \b
          const regex = new RegExp(`\\b${num}\\b`);
          if (regex.test(lowerQuery)) matched = true;
        }
      }
      
      if (matched) tokens.push(e.codigo);
    });

    // Retorna tokens relevantes extraídos da intenção (ex: ['SSH530'])
    return [...new Set(tokens)];
  }

  function expandShortQuery(query) {
     const lower = query.toLowerCase().trim();
     if (lower.length > 20) return query; // Já é uma pergunta elaborada

     if (lower === 'hoje') return 'Resuma o que está acontecendo hoje na manutenção (atrasos, entregas, pendências).';
     if (lower === 'atrasadas' || lower === 'atrasados') return 'Liste e analise os equipamentos e tarefas que estão atrasados.';
     if (lower === 'produção' || lower === 'producao') return 'Mostre os dados de apontamento e produtividade.';
     if (lower === 'compras' || lower === 'peças' || lower === 'pecas') return 'Quais são as peças pendentes ou atrasadas no momento?';

     return query; // Retorna normal se não bater com macros curtas
  }

  return {
    parseIntent,
    expandShortQuery
  };
})();
