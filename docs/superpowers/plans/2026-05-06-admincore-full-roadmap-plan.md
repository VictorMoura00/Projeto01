# AdminCore Full Roadmap Plan

Data: 2026-05-06

## Fase 0

1. Ler `context/`, README/docs existentes, Makefile, soluções, projetos e scripts.
2. Mapear padrões reais de controllers, handlers, DbContexts, módulos, rotas, services, interceptors, estilos, PrimeNG, migrations e testes.
3. Executar build inicial de backend e frontend para registrar linha de base.

## Wave A

1. Criar contratos e serviços de Auth: JWT, refresh token, login, refresh e register.
2. Registrar Identity, Auth services e JWT em DI.
3. Criar `AuthController`, mantendo login/refresh anônimos e register protegido.
4. Implementar `CurrentTenant`, middleware e extension methods.
5. Remover `DevTenantId` hardcoded dos controllers admin principais.
6. Criar AuthService, guard, login component e interceptors Angular.
7. Adicionar testes reais iniciais para Auth, Entities, Access e Parameters.
8. Rodar `dotnet build`, `dotnet test` e build frontend.

## Wave B

1. Adicionar `CachedParameterService` e invalidar cache nos handlers.
2. Implementar `ThemeService` e consumo de tenant config público.
3. Criar endpoints públicos de config de entities.
4. Criar módulo Form Builder backend com domínio, DbContext, handlers e controller.
5. Criar UI admin de Form Builder com lista, editor de campos e preview.
6. Adicionar testes de cache, parâmetros e forms.
7. Validar backend e frontend.

## Wave C

1. Criar módulo Workflow backend com domínio, DbContext, handlers e controller.
2. Implementar motor de instâncias, transições e histórico.
3. Implementar webhooks por transição com proteção de secrets.
4. Criar Workflow Designer no Angular com canvas simples e formulários PrimeNG.
5. Adicionar testes de CRUD, publicação, execução, bloqueios e webhooks.
6. Validar backend e frontend.

## Wave D

1. Criar módulo Tickets backend com domínio, handlers, controller e integração opcional com workflow.
2. Criar UI de Tickets com listagem, detalhe, criação, comentários e filtros.
3. Criar dashboard backend/frontend de métricas.
4. Adicionar SignalR para notificações se viável sem alto risco.
5. Criar REST connectors com proteção de secrets.
6. Criar audit log backend e tela simples se viável.
7. Adicionar rate limiting por tenant/IP.
8. Adicionar observabilidade inicial.
9. Criar GitHub Actions CI.
10. Criar guia de extração para microsserviços.
11. Adicionar testes de tickets, dashboard, connectors, audit e integração com workflow.
12. Rodar validação final global.

## Critério de Segurança

Se uma wave não couber na sessão, parar apenas depois de build/test do último estado seguro, sem deixar alterações pela metade sem explicação.
