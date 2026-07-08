window.DIMAN_INTENT_PARSER = (function() {
  function parseIntent(query) {
    const tokens = [];
    const lowerQuery = query.toLowerCase().trim();
    
    if (!window.DB || !window.DB.equipment) return tokens;

    // Se o usuário digitou apenas palavras muito curtas, inferimos a intenção.
    const isShort = lowerQuery.split(' ').length <= 3;
    
    if (isShort) {
       const eqs = DB.equipment.list();
       // Checa se mencionou algum equipamento ou cliente
       eqs.forEach(e => {
         if ((e.codigo && lowerQuery.includes(e.codigo.toLowerCase())) || 
             (e.cliente && lowerQuery.includes(e.cliente.toLowerCase()))) {
           tokens.push(e.codigo);
         }
       });
    }

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
