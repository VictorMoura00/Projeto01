# Plano: Módulos, Menus e Páginas — Refatoração Fundamental

> Meta: Sistema de módulos registrável, menu dinâmico, dashboard, breadcrumbs e consistência entre páginas.

## Diagnóstico Atual

| Problema | Impacto |
|---|---|
| Menu hardcoded no `admin-layout.component.ts` | Adicionar módulo = editar layout |
| Rotas sem metadata (ícone, grupo, descrição) | Menu não pode ser gerado dinamicamente |
| Sem dashboard/overview | Tela inicial vazia após login |
| Páginas inconsistentes | Entities usa DataTable, outros usam p-table inline |
| Sem breadcrumb | Navegação profunda sem contexto |
| Sem lazy loading real | Todos módulos carregam juntos |
| Sem registro formal de módulos | Não tem como listar/desabilitar módulos dinamicamente |

## Arquitetura Proposta

```
frontend/src/app/
├── core/
│   └── modules/                    ← NOVO: sistema de registro de módulos
│       ├── module-registry.ts      ← registro central
│       ├── module.interface.ts     ← interface IAdminModule
│       └── modules.ts              ← instância global do registry
├── admin/
│   ├── admin-layout.component.ts   ← REFATORADO: menu dinâmico
│   ├── admin.routes.ts             ← REFATORADO: metadata nas rotas
│   ├── dashboard/                  ← NOVO: página inicial
│   │   ├── dashboard.component.ts
│   │   └── dashboard.routes.ts
│   ├── entities/
│   │   └── entities.module.ts      ← NOVO: registro do módulo
│   ├── parameters/
│   │   └── parameters.module.ts
│   ├── access/
│   │   └── access.module.ts
│   ├── forms/
│   │   └── forms.module.ts
│   └── white-label/
│       └── white-label.module.ts
```

## Tarefas (em ordem)

### Fase 1: Infraestrutura de Módulos

**Task 1.1**: Criar `IModuleDefinition` — interface com id, name, icon, description, menuItems, routes
**Task 1.2**: Criar `ModuleRegistry` — registro central com activate/deactivate, listagem
**Task 1.3**: Criar módulos concretos — EntitiesModule, ParametersModule, AccessModule, FormsModule, WhiteLabelModule

### Fase 2: Menu Dinâmico

**Task 2.1**: Refatorar `AdminLayoutComponent` — menu gerado a partir do ModuleRegistry
**Task 2.2**: Adicionar agrupamento de menu (Core, Config, System)
**Task 2.3**: Adicionar colapso/expansão de grupos
**Task 2.4**: Badge de notificação (contadores)

### Fase 3: Dashboard

**Task 3.1**: Criar `DashboardComponent` — cards de métricas, links rápidos, status do sistema
**Task 3.2**: Adicionar rota `/admin` apontando pro dashboard
**Task 3.3**: Cards com: total entities, total forms, total parameters, active tenants

### Fase 4: Consistência Visual

**Task 4.1**: Unificar page-header, metric-strip em todos os módulos
**Task 4.2**: Migrar parâmetros e access para DataTableComponent
**Task 4.3**: Adicionar breadcrumb automático
**Task 4.4**: Garantir responsividade em todas as páginas

### Fase 5: Build + Validação

**Task 5.1**: Build completo (backend + frontend)
**Task 5.2**: Backend tests (51/51)
**Task 5.3**: Verificação visual de todas as páginas
