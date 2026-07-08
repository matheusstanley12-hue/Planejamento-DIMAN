window.DIMAN_KNOWLEDGE_BASE = `
# DIMAN - Base de Conhecimento e Manual do Sistema

O DIMAN (Sistema Inteligente da Manutenção) é uma plataforma integrada de gestão de manutenção, PCM (Planejamento e Controle da Manutenção), engenharia e operação.
Abaixo está o detalhamento de todos os módulos, processos e telas do sistema.

## 1. MÓDULOS PRINCIPAIS E NAVEGAÇÃO

### Dashboard (Página Inicial)
- **Acesso:** Menu lateral -> Dashboard
- **Objetivo:** Fornecer uma visão macro do status da oficina.
- **Gráficos e Indicadores:**
  - Status dos Equipamentos (pizza): Liberação Concluída, Em Manutenção, Aguardando Peças, etc.
  - OEE / Produtividade (velocímetro): Eficiência Global.
  - Principais gargalos e alertas (Atrasos).
  - Tarefas pendentes vs concluídas.

### Painel Executivo (Executive Dashboard)
- **Acesso:** Menu lateral -> Painel Executivo
- **Objetivo:** Visão financeira e gerencial para diretores/gerentes.
- **Informações:**
  - Custo total de manutenção (Mão de Obra + Peças + Terceiros).
  - MTBF (Tempo Médio Entre Falhas) e MTTR (Tempo Médio para Reparo).
  - Custos por Disciplina (Mecânica, Elétrica, etc.).

### Planejamento (Equipamentos)
- **Acesso:** Menu lateral -> Equipamentos
- **Objetivo:** Gestão completa do ciclo de vida da OS/Equipamento na oficina.
- **Funcionalidades:**
  - Listagem em cards com status colorido.
  - **Status possíveis:** Backlog, Aguardando Manutenção, Em Manutenção, Pausado, Aguardando Peças, Aguardando Inspeção, Liberado.
  - Ao clicar em um equipamento, abre-se o **Painel do Equipamento (Equipment Panel)** com as abas:
    - **Detalhes:** Informações gerais, OS, cliente.
    - **Tarefas (Cronograma):** Atividades previstas (Gráfico de Gantt, dependências, responsáveis). Apenas "Planejadores" podem editar estrutura.
    - **Custos:** Lançamento de notas fiscais, peças, serviços.
    - **Mão de Obra:** Alocação de executantes.
    - **Checklists:** Formulários de qualidade e liberação.
    - **Timeline:** Histórico de eventos e auditoria.
    - **Restrições:** Problemas que impedem o avanço (Falta de peça, clima, aguardando aprovação).
    - **Documentos:** Anexos em PDF e fotos (Cloud Storage).

### Meu Painel (Painel do Executante)
- **Acesso:** Menu lateral -> Meu Painel (Worker Panel)
- **Objetivo:** Tela focada no técnico/mecânico/eletricista de campo.
- **Funcionalidades:**
  - O técnico vê as tarefas atribuídas a ele.
  - Botão "INICIAR TAREFA": Inicia o timer de horas trabalhadas.
  - Botão "PAUSAR TAREFA": Pausa com justificativa (Almoço, Fim de turno, Falta de peça, Chuva).
  - Botão "CONCLUIR TAREFA": Marca 100%, finaliza o apontamento e adiciona a foto comprobatória.
  - Regra: O executante só vê os equipamentos com tarefas atribuídas a ele ou abertas para sua disciplina.
  - Visualização de manuais em PDF diretamente da tarefa.

### D-1 | D | D+1 (Gestão Diária)
- **Acesso:** Menu lateral -> D-1 | D | D+1
- **Objetivo:** Reunião diária de alinhamento de rotina.
- **Funcionalidades:**
  - **D-1:** O que foi feito ontem, desvios e justificativas.
  - **D:** O que está programado para hoje.
  - **D+1:** O que será programado para amanhã.
  - Permite apontar rapidamente o status diário.

### Gestão de Almoxarifado / Peças
- **Acesso:** Menu lateral -> Compras & Estoque (Parts/Storage)
- **Objetivo:** Controle de suprimentos.
- **Funcionalidades:**
  - Solicitação de peças vinculadas a um equipamento.
  - Status da peça: Solicitada, Aprovada, Comprada, Em Transporte, Entregue, Cancelada.
  - Fluxo: Mecânico solicita no painel do equipamento -> Planejador aprova -> Compras compra -> Almoxarifado recebe e marca "Entregue".

### Prêmio Produção e Apontamento (Frequência)
- **Acesso:** Menu lateral -> Controle de Frequência / Prêmio Produção
- **Objetivo:** Calcular bônus e produtividade da equipe técnica.
- **Regras:**
  - Apontamento diário (Trabalho, Atestado, Falta, Férias, Atraso).
  - Faltas e Atrasos reduzem o bônus.
  - Executantes podem solicitar "Folga/Férias", e o Gestor aprova.

### QR Code
- **Acesso:** Menu lateral -> QR Code
- **Objetivo:** Gerar etiquetas com QR para colar na máquina. Ao ler o código com o celular, o DIMAN abre o histórico, manuais e status instantâneo do equipamento.

## 2. REGRAS DE NEGÓCIO E PERMISSÕES
- **Administrador / Gerente:** Acesso total a tudo, incluindo exclusão de dados e configurações globais.
- **Planejador / Engenharia:** Pode criar tarefas, aprovar peças, alterar cronogramas (Gantt), gerenciar custos e cadastrar restrições.
- **Executante / Mecânico / Eletricista:** Visão restrita. Acessa apenas o "Meu Painel". Só pode iniciar, pausar e concluir tarefas, além de solicitar peças. NÃO pode alterar prazos nem aprovar custos.
- **Supervisor / Encarregado:** Vê todos os equipamentos (como o Administrador), mas pode ter limitações em edições globais e aprovações financeiras pesadas.

## 3. FLUXOS COMUNS (COMO FAZER)

- **Como cadastrar uma nova OS / Equipamento?**
  Acesse Menu -> Planejamento -> Equipamentos. Clique no botão azul "+ Novo Equipamento" (canto superior direito). Preencha Código, OS, Cliente, Responsável Técnico e salve.

- **Como lançar horas trabalhadas?**
  As horas são calculadas automaticamente quando o executante usa "INICIAR" e "CONCLUIR" no "Meu Painel". Se precisar lançar manualmente (retrospectivo), acesse o Painel do Equipamento -> Aba Mão de Obra -> Adicionar Apontamento.

- **Como alterar a data de entrega (Previsão)?**
  Acesse Equipamentos -> Clique no Equipamento -> Aba Cronograma. Opcionalmente, pode ser necessário criar um "Replanejamento" clicando em "Replanejar Data" para justificar o motivo do atraso e registrar na Timeline.

- **Como resolver uma Peça Pendente?**
  Acesse Equipamentos -> Aba Peças ou Módulo de Compras. Clique em "Editar" na peça desejada e mude o status para "Entregue". Isso atualizará o custo e liberará a restrição se houver.

## 4. BASE TÉCNICA E DIAGNÓSTICOS DE MANUTENÇÃO (PCM)
O DIMAN foi desenhado com foco no PDCA, RCM e TPM.
- **Se um equipamento está parado aguardando peça:** Isso gera uma "Restrição" que trava o cronograma. Atrasos aqui impactam o Caminho Crítico.
- **Boas práticas sugeridas pela IA:** Sempre solicitar a abertura de um RDO (Relatório Diário de Obra) ou Lição Aprendida quando houver anomalias não mapeadas (ex: falhas crônicas de bomba, motor aquecendo, inversor com falha F022).
`;
