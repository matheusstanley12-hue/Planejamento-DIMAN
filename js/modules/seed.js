/* ================================================================
   PLANEJAMENTO DIMAN-BHZ
   Seed Data — Dados de demonstração realistas
   ================================================================ */

window.SeedData = (() => {
  const VERSION = 'v6';

  function isSeeded() {
    return localStorage.getItem('diman_seeded') === VERSION;
  }

  function today(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  function seed() {
    if (isSeeded()) return;
    seedUsers();
    seedEquipment();
    seedWorkforce();
    seedTasks();
    seedParts();
    seedTimesheets();
    seedRestrictions();
    seedCosts();
    seedLessons();
    seedNotifications();
    localStorage.setItem('diman_seeded', VERSION);
    console.log('[DIMAN-BHZ] Dados de demonstração carregados com sucesso.');
  }

  function reset() {
    const keys = ['diman_equipment','diman_tasks','diman_parts','diman_workforce',
      'diman_timesheets','diman_restrictions','diman_costs','diman_lessons',
      'diman_notifications','diman_users','diman_audit'];
    keys.forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('diman_seeded');
  }

  /* ---- USUÁRIOS ---- */
  function seedUsers() {
    const existing = JSON.parse(localStorage.getItem('diman_users') || '[]');
    if (existing.length > 1) return;
    // Senha padrão: 123456 — SHA-256
    const defaultHash = 'bef57ec7f53a6d40beb640a780a639c83bc29ac8a9816f1fc6c5c6dcd93c4721';
    const users = [
      { id:'u-carlos', matricula:'001234', nome:'Carlos Eduardo Mendes', email:'carlos@diman.com', telefone:'(31)99001-0001', cargo:'Planejador Sênior', disciplina:'Mecânica', perfil:'Planejador', senhaHash: defaultHash, senhaInicial:false, status:'Ativo', createdAt: today(-30), permissions: Auth.getPermissionsForProfile('Planejador') },
      { id:'u-ana', matricula:'002345', nome:'Ana Paula Rodrigues', email:'ana@diman.com', telefone:'(31)99001-0002', cargo:'Supervisora de Manutenção', disciplina:'Elétrica', perfil:'Supervisor', senhaHash: defaultHash, senhaInicial:false, status:'Ativo', createdAt: today(-30), permissions: Auth.getPermissionsForProfile('Supervisor') },
      { id:'u-roberto', matricula:'003456', nome:'Roberto Alves Santos', email:'roberto@diman.com', telefone:'(31)99001-0003', cargo:'Gerente de Manutenção', disciplina:'Geral', perfil:'Gerente', senhaHash: defaultHash, senhaInicial:false, status:'Ativo', createdAt: today(-30), permissions: Auth.getPermissionsForProfile('Gerente') },
      { id:'u-mario', matricula:'004567', nome:'Mário Ferreira Lima', email:'mario@diman.com', telefone:'(31)99001-0004', cargo:'Supervisor de Campo', disciplina:'Mecânica', perfil:'Supervisor', senhaHash: defaultHash, senhaInicial:false, status:'Ativo', createdAt: today(-30), permissions: Auth.getPermissionsForProfile('Supervisor') },
    ];
    const all = [...existing, ...users];
    localStorage.setItem('diman_users', JSON.stringify(all));
  }

  /* ---- WORKFORCE ---- */
  function seedWorkforce() {
    const workers = [
      { id:'wf-01', nome:'João Carlos Silva', matricula:'W001', funcao:'Mecânico', disciplina:'Mecânica', telefone:'(31)98001-0001', status:'Ativo' },
      { id:'wf-02', nome:'Pedro Henrique Costa', matricula:'W002', funcao:'Mecânico', disciplina:'Mecânica', telefone:'(31)98001-0002', status:'Ativo' },
      { id:'wf-03', nome:'Lucas Oliveira Neto', matricula:'W003', funcao:'Mecânico', disciplina:'Mecânica', telefone:'(31)98001-0003', status:'Ativo' },
      { id:'wf-04', nome:'Rafael Souza Pereira', matricula:'W004', funcao:'Caldeireiro', disciplina:'Caldeiraria', telefone:'(31)98001-0004', status:'Ativo' },
      { id:'wf-05', nome:'Marcos Antônio Rocha', matricula:'W005', funcao:'Caldeireiro', disciplina:'Caldeiraria', telefone:'(31)98001-0005', status:'Ativo' },
      { id:'wf-06', nome:'Fernando Barbosa', matricula:'W006', funcao:'Eletricista', disciplina:'Elétrica', telefone:'(31)98001-0006', status:'Ativo' },
      { id:'wf-07', nome:'Diego Martins Cruz', matricula:'W007', funcao:'Eletricista', disciplina:'Elétrica', telefone:'(31)98001-0007', status:'Ativo' },
      { id:'wf-08', nome:'Guilherme Alves', matricula:'W008', funcao:'Operador de Torno', disciplina:'Usinagem', telefone:'(31)98001-0008', status:'Ativo' },
      { id:'wf-09', nome:'Tiago Ribeiro Santos', matricula:'W009', funcao:'Operador de Torno', disciplina:'Usinagem', telefone:'(31)98001-0009', status:'Ativo' },
      { id:'wf-10', nome:'André Luiz Mendes', matricula:'W010', funcao:'Pintor', disciplina:'Pintura', telefone:'(31)98001-0010', status:'Ativo' },
      { id:'wf-11', nome:'Bruno Ferreira', matricula:'W011', funcao:'Soldador', disciplina:'Caldeiraria', telefone:'(31)98001-0011', status:'Ativo' },
      { id:'wf-12', nome:'Leandro Carvalho', matricula:'W012', funcao:'Hidráulico', disciplina:'Hidráulica', telefone:'(31)98001-0012', status:'Ativo' },
      { id:'wf-13', nome:'Rodrigo Pinto Lima', matricula:'W013', funcao:'Instrumentista', disciplina:'Instrumentação', telefone:'(31)98001-0013', status:'Ativo' },
      { id:'wf-14', nome:'Felipe Nascimento', matricula:'W014', funcao:'Mecânico', disciplina:'Mecânica', telefone:'(31)98001-0014', status:'Ativo' },
      { id:'wf-15', nome:'Caio Rezende', matricula:'W015', funcao:'Lavador', disciplina:'Lavagem', telefone:'(31)98001-0015', status:'Ativo' },
    ];
    localStorage.setItem('diman_workforce', JSON.stringify(workers));
  }

  /* ---- EQUIPAMENTOS ---- */
  function seedEquipment() {
    const equipments = [
      {
        id:'eq-ssm288', codigo:'SSM-288', nome:'Sonda de Percussão SSM-288', cliente:'COMISA',
        contrato:'CONT-2026-001', localizacao:'Oficina Principal - Baia 3', tipo:'Sonda de Percussão',
        fabricante:'Atlas Copco', modelo:'Diamec U8', numeroSerie:'AC-2015-0288',
        dataEntrada: today(-25), dataLiberacaoPlanejada: today(9), dataRealLiberacao: null,
        responsavel:'Carlos Eduardo Mendes', status:'Em Manutenção', pctAvanco:72,
        observacoes:'Manutenção preventiva geral. Atenção ao cilindro hidráulico.',
        replanning:[
          { id:'rp-1', numero:1, label:'R1', dataAnterior: today(4), novaData: today(7), motivo:'Falta do cilindro hidráulico - prazo de entrega adiado pelo fornecedor', responsavel:'Carlos Eduardo Mendes', createdAt: today(-5) },
          { id:'rp-2', numero:2, label:'R2', dataAnterior: today(7), novaData: today(9), motivo:'Retrabalho na usinagem do eixo principal - necessidade de nova inspeção dimensional', responsavel:'Carlos Eduardo Mendes', createdAt: today(-2) }
        ],
        timeline:[
          { id:'tl-1', tipo:'ENTRADA', titulo:'Entrada na Oficina', descricao:'Equipamento SSM-288 recebido para manutenção preventiva geral', timestamp: today(-25)+'T08:00:00' },
          { id:'tl-2', tipo:'INICIO', titulo:'Início da Manutenção', descricao:'Início das atividades de desmontagem', timestamp: today(-24)+'T07:30:00' },
          { id:'tl-3', tipo:'DEFEITO', titulo:'Defeito Identificado', descricao:'Identificado desgaste excessivo no cilindro hidráulico principal', timestamp: today(-20)+'T14:00:00' },
          { id:'tl-4', tipo:'PECA_SOLICITADA', titulo:'Peça Solicitada', descricao:'Solicitado cilindro hidráulico ao fornecedor Atlas Copco', timestamp: today(-19)+'T09:00:00' },
          { id:'tl-5', tipo:'REPLANEJAMENTO', titulo:'Replanejamento R1', descricao:'Data adiada devido ao prazo de entrega do cilindro hidráulico', timestamp: today(-5)+'T10:00:00' },
          { id:'tl-6', tipo:'REPLANEJAMENTO', titulo:'Replanejamento R2', descricao:'Nova data definida após retrabalho na usinagem', timestamp: today(-2)+'T15:30:00' },
        ]
      },
      {
        id:'eq-ssm301', codigo:'SSM-301', nome:'Sonda de Rotativa SSM-301', cliente:'VALE',
        contrato:'CONT-2026-002', localizacao:'Oficina Principal - Baia 5', tipo:'Sonda Rotativa',
        fabricante:'Boart Longyear', modelo:'LF-230', numeroSerie:'BL-2018-0301',
        dataEntrada: today(-18), dataLiberacaoPlanejada: today(16), dataRealLiberacao: null,
        responsavel:'Ana Paula Rodrigues', status:'Em Manutenção', pctAvanco:54,
        observacoes:'Revisão do sistema de rotação e troca de rolamentos.',
        replanning:[
          { id:'rp-3', numero:1, label:'R1', dataAnterior: today(9), novaData: today(16), motivo:'Cilindro hidráulico de troca do sistema de giro não disponível no Brasil - importação necessária', responsavel:'Ana Paula Rodrigues', createdAt: today(-7) }
        ],
        timeline:[
          { id:'tl-7', tipo:'ENTRADA', titulo:'Entrada na Oficina', descricao:'Equipamento SSM-301 recebido para revisão geral', timestamp: today(-18)+'T09:00:00' },
          { id:'tl-8', tipo:'INICIO', titulo:'Início da Manutenção', descricao:'Início das atividades de inspeção', timestamp: today(-17)+'T07:00:00' },
          { id:'tl-9', tipo:'PECA_SOLICITADA', titulo:'Peça Importada Solicitada', descricao:'Cilindro hidráulico importado - prazo 15 dias úteis', timestamp: today(-14)+'T11:00:00' },
          { id:'tl-10', tipo:'REPLANEJAMENTO', titulo:'Replanejamento R1', descricao:'Adiamento de 7 dias por conta da importação da peça', timestamp: today(-7)+'T16:00:00' },
        ]
      },
      {
        id:'eq-ssm115', codigo:'SSM-115', nome:'Sonda Hidráulica SSM-115', cliente:'PETROBRAS',
        contrato:'CONT-2025-015', localizacao:'Oficina Principal - Baia 1', tipo:'Sonda Hidráulica',
        fabricante:'Sandvik', modelo:'DE-710', numeroSerie:'SV-2012-0115',
        dataEntrada: today(-30), dataLiberacaoPlanejada: today(3), dataRealLiberacao: null,
        responsavel:'Carlos Eduardo Mendes', status:'Em Manutenção', pctAvanco:88,
        observacoes:'Na reta final. Aguardando apenas pintura e comissionamento.',
        replanning:[],
        timeline:[
          { id:'tl-11', tipo:'ENTRADA', titulo:'Entrada na Oficina', descricao:'Equipamento SSM-115 recebido', timestamp: today(-30)+'T08:00:00' },
          { id:'tl-12', tipo:'INICIO', titulo:'Início da Manutenção', descricao:'Início das atividades', timestamp: today(-29)+'T07:30:00' },
        ]
      },
      {
        id:'eq-bhz001', codigo:'BHZ-001', nome:'Sonda Multipropósito BHZ-001', cliente:'GEOSOL',
        contrato:'CONT-2025-008', localizacao:'Cliente - Liberado', tipo:'Sonda Multipropósito',
        fabricante:'Drillco', modelo:'DC-500', numeroSerie:'DC-2010-0001',
        dataEntrada: today(-60), dataLiberacaoPlanejada: today(-5), dataRealLiberacao: today(-4),
        responsavel:'Roberto Alves Santos', status:'Liberado', pctAvanco:100,
        observacoes:'Manutenção concluída com sucesso. Equipamento entregue ao cliente.',
        replanning:[],
        timeline:[
          { id:'tl-13', tipo:'ENTRADA', titulo:'Entrada na Oficina', descricao:'Equipamento BHZ-001 recebido', timestamp: today(-60)+'T08:00:00' },
          { id:'tl-14', tipo:'LIBERACAO', titulo:'Liberação do Equipamento', descricao:'Equipamento liberado e entregue ao cliente GEOSOL', timestamp: today(-4)+'T16:00:00' },
        ]
      },
      {
        id:'eq-bhz002', codigo:'BHZ-002', nome:'Sonda de Produção BHZ-002', cliente:'GEOSOL',
        contrato:'CONT-2026-005', localizacao:'Oficina Auxiliar - Baia 2', tipo:'Sonda de Produção',
        fabricante:'Boart Longyear', modelo:'LF-90D', numeroSerie:'BL-2019-0002',
        dataEntrada: today(-10), dataLiberacaoPlanejada: today(21), dataRealLiberacao: null,
        responsavel:'Mário Ferreira Lima', status:'Em Manutenção', pctAvanco:35,
        observacoes:'Revisão completa do sistema de bombeamento.',
        replanning:[],
        timeline:[
          { id:'tl-15', tipo:'ENTRADA', titulo:'Entrada na Oficina', descricao:'Equipamento BHZ-002 recebido', timestamp: today(-10)+'T09:30:00' },
          { id:'tl-16', tipo:'INICIO', titulo:'Início da Manutenção', descricao:'Início das atividades de desmontagem geral', timestamp: today(-9)+'T07:00:00' },
        ]
      },
      {
        id:'eq-bhz010', codigo:'BHZ-010', nome:'Sonda BHZ-010 Compacta', cliente:'VALE',
        contrato:'CONT-2026-003', localizacao:'Oficina Auxiliar - Baia 4', tipo:'Sonda Compacta',
        fabricante:'Atlas Copco', modelo:'CS-14', numeroSerie:'AC-2017-0010',
        dataEntrada: today(-15), dataLiberacaoPlanejada: today(30), dataRealLiberacao: null,
        responsavel:'Ana Paula Rodrigues', status:'Bloqueado', pctAvanco:20,
        observacoes:'Bloqueado aguardando aprovação técnica do cliente VALE.',
        replanning:[],
        timeline:[
          { id:'tl-17', tipo:'ENTRADA', titulo:'Entrada na Oficina', descricao:'Equipamento BHZ-010 recebido', timestamp: today(-15)+'T08:00:00' },
        ]
      },
      {
        id:'eq-geo301', codigo:'GEO-301', nome:'Perfuratriz GEO-301', cliente:'GEOSOL',
        contrato:'CONT-2026-006', localizacao:'Oficina Principal - Baia 6', tipo:'Perfuratriz',
        fabricante:'Sandvik', modelo:'DR-410', numeroSerie:'SV-2016-0301',
        dataEntrada: today(-20), dataLiberacaoPlanejada: today(13), dataRealLiberacao: null,
        responsavel:'Carlos Eduardo Mendes', status:'Em Manutenção', pctAvanco:61,
        observacoes:'Revisão do sistema de perfuração e troca de bits.',
        replanning:[],
        timeline:[
          { id:'tl-18', tipo:'ENTRADA', titulo:'Entrada na Oficina', descricao:'Equipamento GEO-301 recebido', timestamp: today(-20)+'T10:00:00' },
          { id:'tl-19', tipo:'INICIO', titulo:'Início da Manutenção', descricao:'Início das atividades', timestamp: today(-19)+'T07:30:00' },
        ]
      },
      {
        id:'eq-ssm420', codigo:'SSM-420', nome:'Sonda Direcional SSM-420', cliente:'COMISA',
        contrato:'CONT-2026-007', localizacao:'Pátio Externo - Box 2', tipo:'Sonda Direcional',
        fabricante:'Boart Longyear', modelo:'LM-75', numeroSerie:'BL-2021-0420',
        dataEntrada: today(-5), dataLiberacaoPlanejada: today(26), dataRealLiberacao: null,
        responsavel:'Mário Ferreira Lima', status:'Em Manutenção', pctAvanco:15,
        observacoes:'Manutenção corretiva - falha no sistema de direcionamento.',
        replanning:[],
        timeline:[
          { id:'tl-20', tipo:'ENTRADA', titulo:'Entrada na Oficina', descricao:'Equipamento SSM-420 recebido com falha reportada', timestamp: today(-5)+'T11:00:00' },
        ]
      },
    ];
    localStorage.setItem('diman_equipment', JSON.stringify(equipments));
  }

  /* ---- TAREFAS ---- */
  function seedTasks() {
    const tasks = [];
    let seq = 1;

    function mkTask(equipId, eqCode, data) {
      return {
        id: `tk-${equipId.split('-')[1]}-${String(seq++).padStart(3,'0')}`,
        equipmentId: equipId,
        codigo: `${eqCode}-T${String(seq-1).padStart(3,'0')}`,
        ...data,
        critico: data.critico || false,
        predecessoras: data.predecessoras || [],
        createdAt: today(-30),
        updatedAt: today(-1)
      };
    }

    // SSM-288 (72% avançado, em manutenção)
    const t288 = [
      mkTask('eq-ssm288','SSM288',{descricao:'Desmontagem Geral',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-01',responsavel:'João Carlos Silva',dataPlanejadaInicio:today(-24),dataPlanejadaTermino:today(-21),dataRealInicio:today(-24),dataRealTermino:today(-21),horasPlanejadas:32,horasRealizadas:34,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-ssm288','SSM288',{descricao:'Limpeza e Inspeção Visual',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-02',responsavel:'Pedro Henrique Costa',dataPlanejadaInicio:today(-21),dataPlanejadaTermino:today(-19),dataRealInicio:today(-21),dataRealTermino:today(-19),horasPlanejadas:16,horasRealizadas:16,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-ssm288','SSM288',{descricao:'Inspeção Dimensional do Eixo',disciplina:'Usinagem',prioridade:'Alta',responsavelId:'wf-08',responsavel:'Guilherme Alves',dataPlanejadaInicio:today(-19),dataPlanejadaTermino:today(-17),dataRealInicio:today(-19),dataRealTermino:today(-14),horasPlanejadas:24,horasRealizadas:32,pctExecutado:100,status:'Concluída',critico:true}),
      mkTask('eq-ssm288','SSM288',{descricao:'Usinagem do Eixo Principal',disciplina:'Usinagem',prioridade:'Crítica',responsavelId:'wf-09',responsavel:'Tiago Ribeiro Santos',dataPlanejadaInicio:today(-17),dataPlanejadaTermino:today(-13),dataRealInicio:today(-14),dataRealTermino:today(-8),horasPlanejadas:40,horasRealizadas:52,pctExecutado:100,status:'Concluída',critico:true}),
      mkTask('eq-ssm288','SSM288',{descricao:'Troca de Rolamentos da Cabeça',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-01',responsavel:'João Carlos Silva',dataPlanejadaInicio:today(-13),dataPlanejadaTermino:today(-10),dataRealInicio:today(-8),dataRealTermino:today(-5),horasPlanejadas:24,horasRealizadas:24,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-ssm288','SSM288',{descricao:'Revisão Sistema Elétrico',disciplina:'Elétrica',prioridade:'Média',responsavelId:'wf-06',responsavel:'Fernando Barbosa',dataPlanejadaInicio:today(-10),dataPlanejadaTermino:today(-7),dataRealInicio:today(-5),dataRealTermino:today(-3),horasPlanejadas:20,horasRealizadas:20,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-ssm288','SSM288',{descricao:'Substituição Cilindro Hidráulico',disciplina:'Hidráulica',prioridade:'Crítica',responsavelId:'wf-12',responsavel:'Leandro Carvalho',dataPlanejadaInicio:today(-7),dataPlanejadaTermino:today(1),horasPlanejadas:32,horasRealizadas:0,pctExecutado:0,status:'Aguardando Peça',critico:true}),
      mkTask('eq-ssm288','SSM288',{descricao:'Caldeiraria e Reparos Estruturais',disciplina:'Caldeiraria',prioridade:'Média',responsavelId:'wf-04',responsavel:'Rafael Souza Pereira',dataPlanejadaInicio:today(-5),dataPlanejadaTermino:today(-2),dataRealInicio:today(-5),dataRealTermino:today(-2),horasPlanejadas:24,horasRealizadas:24,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-ssm288','SSM288',{descricao:'Montagem Geral',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-03',responsavel:'Lucas Oliveira Neto',dataPlanejadaInicio:today(1),dataPlanejadaTermino:today(5),horasPlanejadas:40,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada',critico:true}),
      mkTask('eq-ssm288','SSM288',{descricao:'Pintura Geral',disciplina:'Pintura',prioridade:'Baixa',responsavelId:'wf-10',responsavel:'André Luiz Mendes',dataPlanejadaInicio:today(5),dataPlanejadaTermino:today(7),horasPlanejadas:16,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada'}),
      mkTask('eq-ssm288','SSM288',{descricao:'Comissionamento e Testes Finais',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-01',responsavel:'João Carlos Silva',dataPlanejadaInicio:today(7),dataPlanejadaTermino:today(9),horasPlanejadas:16,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada',critico:true}),
    ];

    // SSM-301 (54% avançado)
    const t301 = [
      mkTask('eq-ssm301','SSM301',{descricao:'Desmontagem do Sistema de Rotação',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-02',responsavel:'Pedro Henrique Costa',dataPlanejadaInicio:today(-17),dataPlanejadaTermino:today(-14),dataRealInicio:today(-17),dataRealTermino:today(-14),horasPlanejadas:32,horasRealizadas:30,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-ssm301','SSM301',{descricao:'Inspeção e Laudo Técnico',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-14',responsavel:'Felipe Nascimento',dataPlanejadaInicio:today(-14),dataPlanejadaTermino:today(-12),dataRealInicio:today(-14),dataRealTermino:today(-12),horasPlanejadas:16,horasRealizadas:18,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-ssm301','SSM301',{descricao:'Troca de Rolamentos',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-01',responsavel:'João Carlos Silva',dataPlanejadaInicio:today(-12),dataPlanejadaTermino:today(-9),dataRealInicio:today(-12),dataRealTermino:today(-9),horasPlanejadas:24,horasRealizadas:24,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-ssm301','SSM301',{descricao:'Revisão Sistema Hidráulico',disciplina:'Hidráulica',prioridade:'Crítica',responsavelId:'wf-12',responsavel:'Leandro Carvalho',dataPlanejadaInicio:today(-9),dataPlanejadaTermino:today(-5),dataRealInicio:today(-9),dataRealTermino:today(-3),horasPlanejadas:32,horasRealizadas:38,pctExecutado:100,status:'Concluída',critico:true}),
      mkTask('eq-ssm301','SSM301',{descricao:'Substituição do Cilindro de Giro',disciplina:'Hidráulica',prioridade:'Crítica',responsavelId:'wf-12',responsavel:'Leandro Carvalho',dataPlanejadaInicio:today(-3),dataPlanejadaTermino:today(4),horasPlanejadas:40,horasRealizadas:0,pctExecutado:0,status:'Aguardando Peça',critico:true}),
      mkTask('eq-ssm301','SSM301',{descricao:'Revisão Elétrica Geral',disciplina:'Elétrica',prioridade:'Média',responsavelId:'wf-07',responsavel:'Diego Martins Cruz',dataPlanejadaInicio:today(-3),dataPlanejadaTermino:today(-1),dataRealInicio:today(-3),dataRealTermino:null,horasPlanejadas:20,horasRealizadas:12,pctExecutado:60,status:'Em Andamento'}),
      mkTask('eq-ssm301','SSM301',{descricao:'Caldeiraria - Reparo do Chassi',disciplina:'Caldeiraria',prioridade:'Média',responsavelId:'wf-04',responsavel:'Rafael Souza Pereira',dataPlanejadaInicio:today(0),dataPlanejadaTermino:today(3),horasPlanejadas:24,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada'}),
      mkTask('eq-ssm301','SSM301',{descricao:'Montagem Final',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-03',responsavel:'Lucas Oliveira Neto',dataPlanejadaInicio:today(4),dataPlanejadaTermino:today(10),horasPlanejadas:48,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada',critico:true}),
      mkTask('eq-ssm301','SSM301',{descricao:'Pintura',disciplina:'Pintura',prioridade:'Baixa',responsavelId:'wf-10',responsavel:'André Luiz Mendes',dataPlanejadaInicio:today(10),dataPlanejadaTermino:today(12),horasPlanejadas:16,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada'}),
      mkTask('eq-ssm301','SSM301',{descricao:'Testes e Comissionamento',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-01',responsavel:'João Carlos Silva',dataPlanejadaInicio:today(12),dataPlanejadaTermino:today(16),horasPlanejadas:24,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada',critico:true}),
    ];

    // SSM-115 (88% avançado)
    const t115 = [
      mkTask('eq-ssm115','SSM115',{descricao:'Desmontagem Geral',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-03',responsavel:'Lucas Oliveira Neto',dataPlanejadaInicio:today(-29),dataPlanejadaTermino:today(-26),dataRealInicio:today(-29),dataRealTermino:today(-26),horasPlanejadas:32,horasRealizadas:32,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-ssm115','SSM115',{descricao:'Inspeção e Laudo',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-14',responsavel:'Felipe Nascimento',dataPlanejadaInicio:today(-26),dataPlanejadaTermino:today(-23),dataRealInicio:today(-26),dataRealTermino:today(-23),horasPlanejadas:24,horasRealizadas:24,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-ssm115','SSM115',{descricao:'Usinagem de Componentes',disciplina:'Usinagem',prioridade:'Alta',responsavelId:'wf-08',responsavel:'Guilherme Alves',dataPlanejadaInicio:today(-23),dataPlanejadaTermino:today(-17),dataRealInicio:today(-23),dataRealTermino:today(-17),horasPlanejadas:48,horasRealizadas:48,pctExecutado:100,status:'Concluída',critico:true}),
      mkTask('eq-ssm115','SSM115',{descricao:'Caldeiraria e Estrutura',disciplina:'Caldeiraria',prioridade:'Média',responsavelId:'wf-05',responsavel:'Marcos Antônio Rocha',dataPlanejadaInicio:today(-17),dataPlanejadaTermino:today(-12),dataRealInicio:today(-17),dataRealTermino:today(-12),horasPlanejadas:40,horasRealizadas:40,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-ssm115','SSM115',{descricao:'Revisão Sistema Hidráulico',disciplina:'Hidráulica',prioridade:'Alta',responsavelId:'wf-12',responsavel:'Leandro Carvalho',dataPlanejadaInicio:today(-12),dataPlanejadaTermino:today(-8),dataRealInicio:today(-12),dataRealTermino:today(-8),horasPlanejadas:32,horasRealizadas:32,pctExecutado:100,status:'Concluída',critico:true}),
      mkTask('eq-ssm115','SSM115',{descricao:'Revisão Elétrica',disciplina:'Elétrica',prioridade:'Média',responsavelId:'wf-06',responsavel:'Fernando Barbosa',dataPlanejadaInicio:today(-8),dataPlanejadaTermino:today(-5),dataRealInicio:today(-8),dataRealTermino:today(-5),horasPlanejadas:20,horasRealizadas:20,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-ssm115','SSM115',{descricao:'Montagem Final',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-01',responsavel:'João Carlos Silva',dataPlanejadaInicio:today(-5),dataPlanejadaTermino:today(-1),dataRealInicio:today(-5),dataRealTermino:null,horasPlanejadas:32,horasRealizadas:28,pctExecutado:90,status:'Em Andamento',critico:true}),
      mkTask('eq-ssm115','SSM115',{descricao:'Pintura Final',disciplina:'Pintura',prioridade:'Baixa',responsavelId:'wf-10',responsavel:'André Luiz Mendes',dataPlanejadaInicio:today(0),dataPlanejadaTermino:today(1),horasPlanejadas:8,horasRealizadas:4,pctExecutado:50,status:'Em Andamento'}),
      mkTask('eq-ssm115','SSM115',{descricao:'Testes Finais e Comissionamento',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-03',responsavel:'Lucas Oliveira Neto',dataPlanejadaInicio:today(1),dataPlanejadaTermino:today(3),horasPlanejadas:16,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada',critico:true}),
    ];

    // GEO-301 (61%)
    const tgeo = [
      mkTask('eq-geo301','GEO301',{descricao:'Desmontagem do Sistema de Perfuração',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-02',responsavel:'Pedro Henrique Costa',dataPlanejadaInicio:today(-19),dataPlanejadaTermino:today(-16),dataRealInicio:today(-19),dataRealTermino:today(-16),horasPlanejadas:32,horasRealizadas:32,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-geo301','GEO301',{descricao:'Inspeção e Laudo',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-14',responsavel:'Felipe Nascimento',dataPlanejadaInicio:today(-16),dataPlanejadaTermino:today(-13),dataRealInicio:today(-16),dataRealTermino:today(-13),horasPlanejadas:24,horasRealizadas:24,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-geo301','GEO301',{descricao:'Troca de Bits e Ferramentas',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-01',responsavel:'João Carlos Silva',dataPlanejadaInicio:today(-13),dataPlanejadaTermino:today(-9),dataRealInicio:today(-13),dataRealTermino:today(-9),horasPlanejadas:32,horasRealizadas:30,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-geo301','GEO301',{descricao:'Revisão Sistema Elétrico',disciplina:'Elétrica',prioridade:'Média',responsavelId:'wf-07',responsavel:'Diego Martins Cruz',dataPlanejadaInicio:today(-9),dataPlanejadaTermino:today(-6),dataRealInicio:today(-9),dataRealTermino:today(-6),horasPlanejadas:20,horasRealizadas:22,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-geo301','GEO301',{descricao:'Revisão Hidráulica',disciplina:'Hidráulica',prioridade:'Alta',responsavelId:'wf-12',responsavel:'Leandro Carvalho',dataPlanejadaInicio:today(-6),dataPlanejadaTermino:today(-3),dataRealInicio:today(-6),dataRealTermino:null,horasPlanejadas:24,horasRealizadas:16,pctExecutado:70,status:'Em Andamento',critico:true}),
      mkTask('eq-geo301','GEO301',{descricao:'Instrumentação e Sensores',disciplina:'Instrumentação',prioridade:'Média',responsavelId:'wf-13',responsavel:'Rodrigo Pinto Lima',dataPlanejadaInicio:today(-2),dataPlanejadaTermino:today(2),horasPlanejadas:16,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada'}),
      mkTask('eq-geo301','GEO301',{descricao:'Montagem Geral',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-03',responsavel:'Lucas Oliveira Neto',dataPlanejadaInicio:today(2),dataPlanejadaTermino:today(8),horasPlanejadas:48,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada',critico:true}),
      mkTask('eq-geo301','GEO301',{descricao:'Pintura',disciplina:'Pintura',prioridade:'Baixa',responsavelId:'wf-10',responsavel:'André Luiz Mendes',dataPlanejadaInicio:today(8),dataPlanejadaTermino:today(10),horasPlanejadas:16,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada'}),
      mkTask('eq-geo301','GEO301',{descricao:'Testes Finais',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-02',responsavel:'Pedro Henrique Costa',dataPlanejadaInicio:today(10),dataPlanejadaTermino:today(13),horasPlanejadas:24,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada',critico:true}),
    ];

    // BHZ-002 (35%)
    const tbhz2 = [
      mkTask('eq-bhz002','BHZ002',{descricao:'Desmontagem Bomba',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-01',responsavel:'João Carlos Silva',dataPlanejadaInicio:today(-9),dataPlanejadaTermino:today(-7),dataRealInicio:today(-9),dataRealTermino:today(-7),horasPlanejadas:24,horasRealizadas:24,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-bhz002','BHZ002',{descricao:'Inspeção da Bomba',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-14',responsavel:'Felipe Nascimento',dataPlanejadaInicio:today(-7),dataPlanejadaTermino:today(-5),dataRealInicio:today(-7),dataRealTermino:today(-4),horasPlanejadas:16,horasRealizadas:20,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-bhz002','BHZ002',{descricao:'Revisão Hidráulica',disciplina:'Hidráulica',prioridade:'Alta',responsavelId:'wf-12',responsavel:'Leandro Carvalho',dataPlanejadaInicio:today(-4),dataPlanejadaTermino:today(-1),dataRealInicio:today(-4),dataRealTermino:null,horasPlanejadas:32,horasRealizadas:18,pctExecutado:55,status:'Em Andamento'}),
      mkTask('eq-bhz002','BHZ002',{descricao:'Troca de Vedações',disciplina:'Hidráulica',prioridade:'Média',responsavelId:'wf-12',responsavel:'Leandro Carvalho',dataPlanejadaInicio:today(0),dataPlanejadaTermino:today(3),horasPlanejadas:20,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada'}),
      mkTask('eq-bhz002','BHZ002',{descricao:'Montagem e Testes',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-03',responsavel:'Lucas Oliveira Neto',dataPlanejadaInicio:today(14),dataPlanejadaTermino:today(20),horasPlanejadas:40,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada',critico:true}),
    ];

    // BHZ-010 (20%, Bloqueado)
    const tbhz10 = [
      mkTask('eq-bhz010','BHZ010',{descricao:'Diagnóstico Inicial',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-02',responsavel:'Pedro Henrique Costa',dataPlanejadaInicio:today(-14),dataPlanejadaTermino:today(-12),dataRealInicio:today(-14),dataRealTermino:today(-12),horasPlanejadas:16,horasRealizadas:16,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-bhz010','BHZ010',{descricao:'Desmontagem Parcial',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-03',responsavel:'Lucas Oliveira Neto',dataPlanejadaInicio:today(-12),dataPlanejadaTermino:today(-8),dataRealInicio:today(-12),dataRealTermino:null,horasPlanejadas:32,horasRealizadas:8,pctExecutado:25,status:'Bloqueada'}),
      mkTask('eq-bhz010','BHZ010',{descricao:'Aguardando Aprovação Técnica',disciplina:'Mecânica',prioridade:'Crítica',responsavelId:'wf-14',responsavel:'Felipe Nascimento',dataPlanejadaInicio:today(-8),dataPlanejadaTermino:today(2),horasPlanejadas:8,horasRealizadas:0,pctExecutado:0,status:'Bloqueada',critico:true}),
    ];

    // SSM-420 (15%)
    const t420 = [
      mkTask('eq-ssm420','SSM420',{descricao:'Diagnóstico Sistema de Direcionamento',disciplina:'Mecânica',prioridade:'Crítica',responsavelId:'wf-01',responsavel:'João Carlos Silva',dataPlanejadaInicio:today(-4),dataPlanejadaTermino:today(-2),dataRealInicio:today(-4),dataRealTermino:today(-2),horasPlanejadas:16,horasRealizadas:18,pctExecutado:100,status:'Concluída'}),
      mkTask('eq-ssm420','SSM420',{descricao:'Desmontagem Sistema Direcional',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-02',responsavel:'Pedro Henrique Costa',dataPlanejadaInicio:today(-2),dataPlanejadaTermino:today(2),dataRealInicio:today(-2),dataRealTermino:null,horasPlanejadas:32,horasRealizadas:8,pctExecutado:25,status:'Em Andamento'}),
      mkTask('eq-ssm420','SSM420',{descricao:'Usinagem Componentes Direcionais',disciplina:'Usinagem',prioridade:'Alta',responsavelId:'wf-08',responsavel:'Guilherme Alves',dataPlanejadaInicio:today(2),dataPlanejadaTermino:today(8),horasPlanejadas:48,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada',critico:true}),
      mkTask('eq-ssm420','SSM420',{descricao:'Revisão Sistema Hidráulico',disciplina:'Hidráulica',prioridade:'Alta',responsavelId:'wf-12',responsavel:'Leandro Carvalho',dataPlanejadaInicio:today(8),dataPlanejadaTermino:today(14),horasPlanejadas:40,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada',critico:true}),
      mkTask('eq-ssm420','SSM420',{descricao:'Montagem e Testes',disciplina:'Mecânica',prioridade:'Alta',responsavelId:'wf-03',responsavel:'Lucas Oliveira Neto',dataPlanejadaInicio:today(18),dataPlanejadaTermino:today(25),horasPlanejadas:40,horasRealizadas:0,pctExecutado:0,status:'Não Iniciada',critico:true}),
    ];

    const allTasks = [...t288, ...t301, ...t115, ...tgeo, ...tbhz2, ...tbhz10, ...t420];
    localStorage.setItem('diman_tasks', JSON.stringify(allTasks));
  }

  /* ---- PEÇAS ---- */
  function seedParts() {
    const parts = [
      { id:'pt-001', equipmentId:'eq-ssm288', codigo:'CIL-HID-288', descricao:'Cilindro Hidráulico Principal', quantidade:1, estoque:0, fornecedor:'Atlas Copco Brasil', fabricante:'Parker Hannifin', prazoEntrega: today(3), status:'Em Transporte', critica:true, pedido:'PED-2026-0145', createdAt: today(-19) },
      { id:'pt-002', equipmentId:'eq-ssm288', codigo:'ROL-6308-2RS', descricao:'Rolamento 6308-2RS (Kit 4 un)', quantidade:4, estoque:0, fornecedor:'SKF Brasil', fabricante:'SKF', prazoEntrega: today(-2), status:'Recebida', critica:false, pedido:'PED-2026-0132', createdAt: today(-20) },
      { id:'pt-003', equipmentId:'eq-ssm288', codigo:'JUNTA-KIT-88', descricao:'Kit de Juntas e Vedações', quantidade:1, estoque:2, fornecedor:'Nacional', fabricante:'Viton', prazoEntrega: today(-5), status:'Instalada', critica:false, pedido:'PED-2026-0118', createdAt: today(-22) },
      { id:'pt-004', equipmentId:'eq-ssm301', codigo:'CIL-GIRO-301', descricao:'Cilindro de Giro - Sistema Hidráulico', quantidade:1, estoque:0, fornecedor:'Boart Longyear Internacional', fabricante:'Boart Longyear', prazoEntrega: today(5), status:'Em Transporte', critica:true, pedido:'PED-2026-0156', createdAt: today(-14) },
      { id:'pt-005', equipmentId:'eq-ssm301', codigo:'ROL-7308-BEP', descricao:'Rolamento 7308 BEP (Kit 2 un)', quantidade:2, estoque:2, fornecedor:'NSK Brasil', fabricante:'NSK', prazoEntrega: today(-3), status:'Recebida', critica:false, pedido:'PED-2026-0140', createdAt: today(-15) },
      { id:'pt-006', equipmentId:'eq-geo301', codigo:'BIT-HQ-76', descricao:'Conjunto de Bits HQ-76 (caixa 10 un)', quantidade:10, estoque:5, fornecedor:'Sandvik Brasil', fabricante:'Sandvik', prazoEntrega: today(-10), status:'Instalada', critica:false, pedido:'PED-2026-0108', createdAt: today(-18) },
      { id:'pt-007', equipmentId:'eq-geo301', codigo:'SEN-PRESS-301', descricao:'Sensor de Pressão 4-20mA', quantidade:2, estoque:0, fornecedor:'Endress+Hauser', fabricante:'Endress+Hauser', prazoEntrega: today(2), status:'Comprada', critica:false, pedido:'PED-2026-0162', createdAt: today(-5) },
      { id:'pt-008', equipmentId:'eq-bhz002', codigo:'BOMBA-P300', descricao:'Bomba de Lama P-300', quantidade:1, estoque:0, fornecedor:'BHZ Peças Ltda', fabricante:'Grundfos', prazoEntrega: today(12), status:'Solicitada', critica:true, pedido:'', createdAt: today(-8) },
      { id:'pt-009', equipmentId:'eq-ssm115', codigo:'VEDA-KIT-115', descricao:'Kit de Vedações do Sistema Hidráulico', quantidade:1, estoque:1, fornecedor:'Nacional', fabricante:'Parker', prazoEntrega: today(-8), status:'Instalada', critica:false, pedido:'PED-2026-0095', createdAt: today(-25) },
      { id:'pt-010', equipmentId:'eq-ssm420', codigo:'DIRECIONAL-KIT', descricao:'Kit Sistema Direcional Completo', quantidade:1, estoque:0, fornecedor:'Boart Longyear Internacional', fabricante:'Boart Longyear', prazoEntrega: today(6), status:'Comprada', critica:true, pedido:'PED-2026-0168', createdAt: today(-4) },
    ];
    localStorage.setItem('diman_parts', JSON.stringify(parts));
  }

  /* ---- APONTAMENTOS ---- */
  function seedTimesheets() {
    const ts = [];
    const workers = [
      {id:'wf-01',nome:'João Carlos Silva',eqId:'eq-ssm288'},
      {id:'wf-02',nome:'Pedro Henrique Costa',eqId:'eq-ssm301'},
      {id:'wf-03',nome:'Lucas Oliveira Neto',eqId:'eq-ssm115'},
      {id:'wf-08',nome:'Guilherme Alves',eqId:'eq-ssm288'},
      {id:'wf-06',nome:'Fernando Barbosa',eqId:'eq-ssm288'},
      {id:'wf-12',nome:'Leandro Carvalho',eqId:'eq-geo301'},
    ];
    for (let d = 14; d >= 0; d--) {
      workers.forEach(w => {
        if (d % 7 < 5) { // weekdays only
          ts.push({
            id: `ts-${d}-${w.id}`,
            workerId: w.id,
            workerNome: w.nome,
            equipmentId: w.eqId,
            taskId: '',
            data: today(-d),
            horaInicio: '07:00',
            horaFim: '17:00',
            horasTrabalhadas: 8 + (Math.random() > 0.7 ? 2 : 0),
            observacao: '',
            createdAt: today(-d)
          });
        }
      });
    }
    localStorage.setItem('diman_timesheets', JSON.stringify(ts));
  }

  /* ---- RESTRIÇÕES ---- */
  function seedRestrictions() {
    const restr = [
      { id:'rs-001', equipmentId:'eq-ssm288', tipo:'Falta de Peça', descricao:'Cilindro hidráulico principal ainda não recebido - peça crítica para montagem final', disciplina:'Hidráulica', tarefaBloqueada:'Substituição Cilindro Hidráulico', responsavel:'Carlos Eduardo Mendes', impactoCaminhosCriticos:true, status:'Aberta', createdAt: today(-19) },
      { id:'rs-002', equipmentId:'eq-ssm301', tipo:'Falta de Peça', descricao:'Cilindro de giro importado - aguardando liberação na alfândega', disciplina:'Hidráulica', tarefaBloqueada:'Substituição do Cilindro de Giro', responsavel:'Ana Paula Rodrigues', impactoCaminhosCriticos:true, status:'Aberta', createdAt: today(-14) },
      { id:'rs-003', equipmentId:'eq-bhz010', tipo:'Aguardando Aprovação', descricao:'Aguardando aprovação técnica do cliente VALE para prosseguir com a desmontagem completa', disciplina:'Mecânica', tarefaBloqueada:'Desmontagem Parcial', responsavel:'Ana Paula Rodrigues', impactoCaminhosCriticos:true, status:'Aberta', createdAt: today(-12) },
      { id:'rs-004', equipmentId:'eq-geo301', tipo:'Falta de Mão de Obra', descricao:'Equipe de instrumentação com sobrecarga - apenas 1 técnico disponível para 2 equipamentos simultâneos', disciplina:'Instrumentação', tarefaBloqueada:'Instrumentação e Sensores', responsavel:'Carlos Eduardo Mendes', impactoCaminhosCriticos:false, status:'Aberta', createdAt: today(-3) },
      { id:'rs-005', equipmentId:'eq-ssm420', tipo:'Falta de Peça', descricao:'Kit sistema direcional - item de importação aguardando desembaraço', disciplina:'Mecânica', tarefaBloqueada:'Usinagem Componentes Direcionais', responsavel:'Mário Ferreira Lima', impactoCaminhosCriticos:true, status:'Aberta', createdAt: today(-4) },
      { id:'rs-006', equipmentId:'eq-bhz002', tipo:'Falta de Peça', descricao:'Bomba de lama P-300 - fornecedor confirmou prazo de 12 dias úteis', disciplina:'Hidráulica', tarefaBloqueada:'Montagem e Testes', responsavel:'Mário Ferreira Lima', impactoCaminhosCriticos:true, status:'Aberta', createdAt: today(-8) },
      { id:'rs-007', equipmentId:'eq-ssm288', tipo:'Falta de Ferramenta', descricao:'Equipamento de alinhamento a laser em manutenção no setor de ferramentas', disciplina:'Mecânica', tarefaBloqueada:'Montagem Geral', responsavel:'João Carlos Silva', impactoCaminhosCriticos:false, status:'Aberta', createdAt: today(-1) },
      { id:'rs-008', equipmentId:'eq-ssm115', tipo:'Falta de Mão de Obra', descricao:'Mecânico responsável afastado por atestado médico', disciplina:'Mecânica', tarefaBloqueada:'Montagem Final', responsavel:'Carlos Eduardo Mendes', impactoCaminhosCriticos:false, status:'Fechada', resolution:'Mecânico substituto alocado para a tarefa', closedAt: today(-1), createdAt: today(-3) },
    ];
    localStorage.setItem('diman_restrictions', JSON.stringify(restr));
  }

  /* ---- CUSTOS ---- */
  function seedCosts() {
    const costs = [
      // SSM-288 (Planejado R$120k, Realizado R$137k)
      { id:'cs-001', equipmentId:'eq-ssm288', categoria:'Mão de Obra', descricao:'Horas de mão de obra direta', valorPlanejado:45000, valorRealizado:52000, data: today(-25), createdAt: today(-25) },
      { id:'cs-002', equipmentId:'eq-ssm288', categoria:'Peças', descricao:'Peças e componentes de reposição', valorPlanejado:55000, valorRealizado:62000, data: today(-20), createdAt: today(-20) },
      { id:'cs-003', equipmentId:'eq-ssm288', categoria:'Serviços Terceiros', descricao:'Usinagem externa', valorPlanejado:12000, valorRealizado:14000, data: today(-15), createdAt: today(-15) },
      { id:'cs-004', equipmentId:'eq-ssm288', categoria:'Frete', descricao:'Frete das peças importadas', valorPlanejado:5000, valorRealizado:6500, data: today(-10), createdAt: today(-10) },
      { id:'cs-005', equipmentId:'eq-ssm288', categoria:'Custos Extras', descricao:'Horas extras não planejadas', valorPlanejado:3000, valorRealizado:2500, data: today(-5), createdAt: today(-5) },
      // SSM-301
      { id:'cs-006', equipmentId:'eq-ssm301', categoria:'Mão de Obra', descricao:'Mão de obra direta', valorPlanejado:38000, valorRealizado:35000, data: today(-18), createdAt: today(-18) },
      { id:'cs-007', equipmentId:'eq-ssm301', categoria:'Peças', descricao:'Rolamentos e componentes', valorPlanejado:42000, valorRealizado:48000, data: today(-14), createdAt: today(-14) },
      { id:'cs-008', equipmentId:'eq-ssm301', categoria:'Frete', descricao:'Frete internacional cilindro', valorPlanejado:3000, valorRealizado:4800, data: today(-7), createdAt: today(-7) },
      // SSM-115
      { id:'cs-009', equipmentId:'eq-ssm115', categoria:'Mão de Obra', descricao:'Mão de obra direta', valorPlanejado:55000, valorRealizado:54000, data: today(-30), createdAt: today(-30) },
      { id:'cs-010', equipmentId:'eq-ssm115', categoria:'Peças', descricao:'Componentes gerais', valorPlanejado:35000, valorRealizado:33000, data: today(-25), createdAt: today(-25) },
      // GEO-301
      { id:'cs-011', equipmentId:'eq-geo301', categoria:'Mão de Obra', descricao:'Mão de obra', valorPlanejado:40000, valorRealizado:38000, data: today(-20), createdAt: today(-20) },
      { id:'cs-012', equipmentId:'eq-geo301', categoria:'Peças', descricao:'Bits e ferramentas', valorPlanejado:28000, valorRealizado:25000, data: today(-18), createdAt: today(-18) },
    ];
    localStorage.setItem('diman_costs', JSON.stringify(costs));
  }

  /* ---- LIÇÕES APRENDIDAS ---- */
  function seedLessons() {
    const lessons = [
      { id:'ll-001', equipmentId:'eq-bhz001', equipmentTipo:'Sonda Multipropósito', disciplina:'Hidráulica', problema:'Cilindro hidráulico não estava disponível no estoque local, causando atraso de 8 dias no cronograma', solucao:'Estabelecer estoque mínimo de 1 cilindro sobressalente para cada modelo de sonda em operação', tempoPerdido:8, recomendacao:'Manter estoque estratégico de cilindros hidráulicos Atlas Copco e Boart Longyear. Realizar pedido de reposição imediato após instalação.', createdAt: today(-10) },
      { id:'ll-002', equipmentId:'eq-bhz001', equipmentTipo:'Sonda Multipropósito', disciplina:'Usinagem', problema:'Retrabalho no eixo principal por falha no processo de medição dimensional inicial', solucao:'Implementar protocolo de inspeção dimensional com duas medições independentes antes de iniciar usinagem', tempoPerdido:3, recomendacao:'Usar micrômetro digital calibrado e registrar todas as medições em formulário específico. Revisão obrigatória pelo supervisor antes de autorizar usinagem.', createdAt: today(-8) },
      { id:'ll-003', equipmentId:'eq-ssm115', equipmentTipo:'Sonda Hidráulica', disciplina:'Mecânica', problema:'Ferramentas de alinhamento indisponíveis durante montagem, causando retrabalho posterior', solucao:'Reservar ferramentas especiais (alinhamento a laser, régua de precisão) com 3 dias de antecedência', tempoPerdido:2, recomendacao:'Criar checklist de ferramentas especiais no planejamento de cada montagem. Verificar disponibilidade na abertura do serviço.', createdAt: today(-15) },
      { id:'ll-004', equipmentId:'eq-ssm288', equipmentTipo:'Sonda de Percussão', disciplina:'Elétrica', problema:'Falta de documentação elétrica atualizada gerou demora no diagnóstico e planejamento da revisão elétrica', solucao:'Solicitar esquema elétrico atualizado ao cliente antes da entrada do equipamento na oficina', tempoPerdido:1, recomendacao:'Incluir na lista de documentos obrigatórios: esquema elétrico, manual de manutenção e histórico de intervenções anteriores.', createdAt: today(-20) },
      { id:'ll-005', equipmentId:'eq-geo301', equipmentTipo:'Perfuratriz', disciplina:'Instrumentação', problema:'Sensor de pressão importado sem similar nacional, causando dependência de prazo de importação', solucao:'Mapear componentes críticos sem similar nacional e manter estoque de 1 unidade para cada modelo', tempoPerdido:5, recomendacao:'Criar lista de materiais críticos importados e estabelecer nível de estoque mínimo para garantir continuidade das manutenções.', createdAt: today(-12) },
    ];
    localStorage.setItem('diman_lessons', JSON.stringify(lessons));
  }

  /* ---- NOTIFICAÇÕES ---- */
  function seedNotifications() {
    const notifs = [
      { id:'nt-001', type:'danger', title:'Restrição Crítica — SSM-288', message:'Cilindro hidráulico bloqueando caminho crítico. Previsão de chegada: ' + today(3), read:false, equipmentId:'eq-ssm288', createdAt: today(-1)+'T08:00:00' },
      { id:'nt-002', type:'warning', title:'Risco de Atraso — SSM-301', message:'Cilindro de giro importado ainda em trânsito. Montar plano de contingência.', read:false, equipmentId:'eq-ssm301', createdAt: today(-1)+'T09:30:00' },
      { id:'nt-003', type:'danger', title:'Equipamento Bloqueado — BHZ-010', message:'Aguardando aprovação técnica da VALE há 12 dias. Acionar gerência.', read:false, equipmentId:'eq-bhz010', createdAt: today(-1)+'T10:00:00' },
      { id:'nt-004', type:'info', title:'SSM-115 — Quase Concluída', message:'88% de avanço. Previsão de liberação em 3 dias. Notificar PETROBRAS.', read:true, equipmentId:'eq-ssm115', createdAt: today(-2)+'T14:00:00' },
      { id:'nt-005', type:'warning', title:'Sobrecarga de MO — Usinagem', message:'Guilherme Alves e Tiago Santos com 120% de ocupação esta semana.', read:false, createdAt: today(0)+'T07:00:00' },
      { id:'nt-006', type:'success', title:'BHZ-001 Liberada com Sucesso', message:'Equipamento entregue ao cliente GEOSOL. Manutenção concluída no prazo.', read:true, equipmentId:'eq-bhz001', createdAt: today(-4)+'T16:00:00' },
      { id:'nt-007', type:'danger', title:'3 Peças Críticas Pendentes', message:'CIL-HID-288, CIL-GIRO-301 e KIT-DIRECIONAL bloqueando o caminho crítico.', read:false, createdAt: today(0)+'T07:30:00' },
      { id:'nt-008', type:'warning', title:'Replanejamento SSM-288 — R2', message:'Segunda reprogramação criada. Data final agora em ' + formatDate(today(9)), read:true, equipmentId:'eq-ssm288', createdAt: today(-2)+'T15:30:00' },
    ];
    localStorage.setItem('diman_notifications', JSON.stringify(notifs));
  }

  return { seed, reset, isSeeded };
})();
