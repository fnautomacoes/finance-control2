# FinanceControl - TODO List

## Fase 1: Autenticação e Estrutura Base
- [x] Configurar autenticação OAuth com Manus
- [x] Criar layout principal com DashboardLayout
- [x] Implementar navegação lateral
- [x] Criar página de login/logout

## Fase 2: Schema do Banco de Dados
- [x] Criar tabela de categorias
- [x] Criar tabela de contas bancárias
- [x] Criar tabela de transações
- [x] Criar tabela de investimentos
- [x] Criar tabela de metas
- [x] Criar tabela de centros de custos
- [x] Criar tabela de projetos
- [x] Criar tabela de contatos
- [x] Executar migrations (pnpm db:push)

## Fase 3: API e Testes
- [x] Implementar query helpers no db.ts
- [x] Criar routers tRPC para todos os módulos
- [x] Implementar validação com Zod
- [x] Escrever testes unitários (39 testes)
- [x] Validar todas as operações CRUD

## Fase 4: Interface do Usuário - Dashboard
- [x] Criar layout responsivo com sidebar
- [x] Implementar dashboard principal
- [x] Criar cards de resumo (patrimônio, fluxo de caixa)
- [x] Implementar gráficos interativos
- [x] Criar navegação entre módulos

## Fase 5: Módulo de Contas e Transações
- [x] Criar página de contas bancárias
- [x] Implementar CRUD de contas na UI
- [ ] Criar página de transações
- [ ] Implementar CRUD de transações na UI
- [ ] Criar filtros de transações (data, categoria, conta)
- [ ] Implementar busca de transações

## Fase 6: Módulo de Categorias e Orçamento
- [ ] Criar página de categorias
- [ ] Implementar CRUD de categorias na UI
- [ ] Criar página de metas de orçamento
- [ ] Implementar CRUD de metas na UI
- [ ] Criar visualização de progresso de metas
- [ ] Implementar cálculo de gastos vs metas

## Fase 7: Módulo de Investimentos
- [ ] Criar página de carteira de investimentos
- [ ] Implementar CRUD de investimentos na UI
- [ ] Implementar cálculo de rentabilidade
- [ ] Criar gráficos de evolução patrimonial
- [ ] Implementar comparação com índices

## Fase 8: Módulos Complementares
- [ ] Criar página de contas a pagar/receber
- [ ] Criar página de ativos e passivos
- [ ] Criar página de contatos
- [ ] Implementar gestão de projetos
- [ ] Implementar centros de custos

## Fase 9: Relatórios e Exportação
- [ ] Criar dashboard de relatórios
- [ ] Implementar exportação em PDF
- [ ] Implementar exportação em Excel
- [ ] Criar relatório de balanço patrimonial
- [ ] Criar relatório de evolução patrimonial

## Fase 10: Polimento e Deploy
- [ ] Refinar design e UX
- [ ] Implementar temas claro/escuro
- [ ] Otimizar responsividade mobile
- [ ] Testes de integração completos
- [ ] Documentação final
- [ ] Preparar para deploy

## Status Geral
- [x] Projeto inicializado com web-db-user
- [x] Banco de dados configurado (15 tabelas)
- [x] API tRPC implementada (10 routers)
- [x] Testes unitários (39 testes aprovados)
- [ ] Interface do usuário
- [ ] Módulos de negócio
- [ ] Relatórios e exportação
- [ ] Deploy final
