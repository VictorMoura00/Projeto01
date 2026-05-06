# AdminCore Full Roadmap Design

Data: 2026-05-06

## Objetivo

Evoluir o AdminCore de um configurador low-code com tenant de desenvolvimento fixo para uma plataforma operacional multi-tenant com autenticação, configuração pública segura, form builder, workflow, tickets, integrações, auditoria, observabilidade e CI.

## Restrições

- Manter o monolito modular em .NET 10.
- Preservar controllers MVC usando `IMessageBus`.
- Manter commands/handlers co-localizados no padrão Wolverine.
- Registrar infraestrutura em extension methods, sem inflar `Program.cs`.
- Usar Angular 21 standalone, `inject()`, signals e PrimeNG Aura.
- Resolver autorização e isolamento por JWT claim `tenant_id`, nunca por slug de URL.
- Usar slug público apenas para descoberta visual de tenant e tema.

## Wave A: Fundação

Auth será implementado no módulo Auth com ASP.NET Identity, JWT e refresh tokens persistidos. O login público retorna access token, refresh token e expiração. O refresh token é público, mas exige token válido e faz rotação. O register existe como comando, mas endpoint público de registro livre não será criado; a rota administrativa exige autorização.

Tenant resolution será feita por middleware após autenticação, lendo `tenant_id` do JWT e aceitando `X-Tenant-Id` apenas em ambiente Development. Controllers admin passam a exigir `ICurrentTenant`, removendo `DevTenantId` hardcoded. Endpoints públicos como `/tenants/{slug}/config` continuam anônimos.

No Angular, a rota pública será `/:tenantSlug/login`, com fallback para `/login?tenant=slug` quando necessário. `/admin` ficará protegido por guard funcional. Interceptor adiciona `Authorization: Bearer` e faz uma tentativa de refresh em 401.

## Wave B: Configuração Avançada

Parâmetros ganham cache por tenant com `IMemoryCache`, TTL de 5 minutos e invalidação em create/update/delete. O tema dinâmico usa `/tenants/{slug}/config` e aplica CSS variables no `:root`, preservando Aura como fallback.

Form Builder será um módulo modular próprio com `FormDefinition` e `FormField`, CRUD administrativo, publicação simples, duplicação e preview Angular. O frontend usa PrimeNG e CDK drag-drop já presentes; ngx-formly só será usado se encaixar sem aumentar risco de integração.

## Wave C: Workflow

Workflow será outro módulo modular com definições, estados, transições, instâncias e histórico. Publicação valida estado inicial, estados finais e transições. O motor inicia instâncias no estado inicial e executa transições válidas, registrando histórico.

Webhooks serão configuráveis por transição, com método, URL, headers e template simples. Falhas não derrubam a transição, exceto quando marcadas como obrigatórias. Secrets não são expostos em listagens.

## Wave D: Operação

Tickets serão o primeiro app operacional interno, usando campos dinâmicos e workflow quando configurados, com fallback simples de status/prioridade. O dashboard expõe métricas agregadas por tenant.

Notificações real-time serão implementadas com SignalR se a integração permanecer pequena; caso contrário, a estrutura mínima será preparada sem quebrar build. REST connectors terão GET/POST, headers configuráveis e proteção de secrets. Audit log registrará operações sem dados sensíveis. Rate limiting será aplicado a endpoints sensíveis por tenant ou IP. Observabilidade inicial usa logs estruturados, correlation id e health checks.

## Dados e Isolamento

Cada módulo mantém DbContext e schema próprios. Todas as entidades operacionais carregam `TenantId`. Queries administrativas autenticadas filtram por tenant resolvido. Configurações públicas por slug retornam apenas dados necessários para experiência visual e apps públicos.

## Testes

Testes usam xUnit, FluentAssertions e NSubstitute somente para dependências externas. Handlers com EF usam banco in-memory com nome único quando o comportamento do provider permitir. Cada wave deve deixar build e testes em estado verificável.

## Entrega Incremental

Cada wave deve ser funcional, compilável e commitável. Quando o tamanho do roadmap exceder a sessão, o projeto deve ficar no último ponto seguro, com pendências documentadas.
