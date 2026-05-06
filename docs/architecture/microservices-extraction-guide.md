# Guia de Extração para Microsserviços

## Contexto

O AdminCore deve permanecer como monolito modular enquanto os limites de domínio ainda estão evoluindo. A extração para microsserviços só deve acontecer quando um módulo tiver volume, equipe, deploy ou escala próprios.

## Estratégia Recomendada

1. Consolidar contratos internos por módulo com commands, queries e eventos estáveis.
2. Publicar eventos de domínio no Wolverine in-process.
3. Trocar o transporte in-process por RabbitMQ quando houver necessidade real de independência.
4. Extrair primeiro módulos com baixo acoplamento operacional.
5. Separar banco por módulo apenas quando os contratos e fluxos assíncronos estiverem maduros.

## Wolverine In-Process para RabbitMQ

No monolito, handlers continuam co-localizados e descobertos por assembly. Para RabbitMQ, cada módulo extraído deve publicar e consumir mensagens versionadas, com retry, dead-letter e idempotência. Commands síncronos entre módulos devem virar APIs explícitas ou eventos assíncronos.

## Ordem Provável de Extração

1. Notifications: alto uso assíncrono e baixo impacto transacional.
2. Connectors/Webhooks: integração externa, retry e isolamento de falhas.
3. Tickets: domínio operacional com escala e ciclo de vida próprios.
4. Workflow: extrair só depois de estabilizar contratos usados por Tickets e Forms.
5. Auth/Tenants: manter no core por mais tempo, pois impactam isolamento e autorização.

## Dados por Módulo

Cada módulo já tem schema próprio. A extração futura deve transformar schema em banco próprio, mantendo migrações por serviço. Dados compartilhados devem ser replicados por eventos, não por joins remotos.

## Eventos

Eventos devem carregar `tenantId`, `correlationId`, `occurredAt`, `eventId` e versão. Consumidores precisam ser idempotentes por `eventId`. Payloads não devem incluir secrets, tokens ou senhas.

## Riscos

- Extração precoce aumenta complexidade sem ganho real.
- Transações distribuídas podem aparecer se os limites forem extraídos antes de estabilizar.
- Autorização multi-tenant precisa continuar central e auditável.
- Observabilidade deve existir antes da extração, não depois.

## O Que Não Extrair Agora

- Shared.Kernel.
- Auth e Tenants.
- Form Builder antes de validar uso real por apps de negócio.
- Workflow antes de estabilizar integração com Tickets.
- Parameters, enquanto for infraestrutura de configuração do core.
