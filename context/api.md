# AdminCore — Referência da API

## Base URL
- Dev: `http://localhost:5000`
- Produção Docker: `http://localhost:8080`

## Auth Endpoints
Autenticação JWT com Identity Core. Seed automático em Development: `admin@admincore.local / Admin123!`.

```
POST /auth/login     → { accessToken, refreshToken, expiresIn, user }
    body: { email, password }
    AllowAnonymous

POST /auth/refresh   → { accessToken, refreshToken, expiresIn, user }
    body: { refreshToken }
    AllowAnonymous

POST /auth/register  → { id, tenantId, email, name }
    body: { email, password, firstName, lastName, tenantSlug }
    Requer role Admin
```

Todos os endpoints admin (entities, parameters, roles, tenants, forms, white-label) exigem Bearer token
com claims: `sub`, `user_id`, `tenant_id`, `email`, `name`, `roles`.

---

## Endpoints Implementados

### Health
```
GET /health → { status: "healthy", timestamp: "..." }
```

### Entities
```
GET    /admin/entities?page=1&pageSize=20&search=
POST   /admin/entities                        body: { name, slug, description?, icon? }
GET    /admin/entities/{id}
PUT    /admin/entities/{id}                   body: { name, description?, icon?, isActive }
DELETE /admin/entities/{id}

GET    /admin/entities/{id}/fields            → retorna entidade com campos
POST   /admin/entities/{id}/fields            body: { name, slug, fieldType, isRequired, isSearchable, isFilterable }
PUT    /admin/entities/{id}/fields/{fieldId}  body: { name, fieldType, isRequired, isSearchable, isFilterable }
DELETE /admin/entities/{id}/fields/{fieldId}
PUT    /admin/entities/{id}/fields/reorder    body: [guid, guid, ...]
```

### Parameters
```
GET    /admin/parameters?group=&page=1&pageSize=50
GET    /admin/parameters/{key}
POST   /admin/parameters                      body: { key, value, type, group?, description?, scope, isReadOnly? }
PUT    /admin/parameters/{id}                 body: { value, description? }
DELETE /admin/parameters/{id}
```

### Access (Roles)
```
GET    /admin/roles?page=1&pageSize=20
GET    /admin/roles/{id}
POST   /admin/roles                           body: { name, description? }
PUT    /admin/roles/{id}                      body: { name, description?, isActive }
DELETE /admin/roles/{id}
PUT    /admin/roles/{id}/permissions          body: { permissions: [{ entitySlug, operations }] }
```

### Tenants / White Label
```
GET    /admin/tenants?page=1&pageSize=20
GET    /admin/tenants/{id}
POST   /admin/tenants                         body: { name, slug }
PUT    /admin/tenants/{id}                    body: { name, logoUrl?, faviconUrl?, isActive }
PUT    /admin/tenants/{id}/theme              body: { primaryColor, secondaryColor, accentColor, surfaceColor, fontFamily }

GET    /tenants/{slug}/config                 → público, sem auth → { slug, name, logoUrl?, faviconUrl?, theme }
```

---

## Convenção de Resposta
```json
// Lista paginada (PagedList<T>)
{
  "items": [...],
  "totalCount": 50,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3,
  "hasNextPage": true,
  "hasPreviousPage": false
}

// Erro 404 (NotFoundException)
{ "message": "Entity with key '...' was not found." }

// Erro 409 (ConflictException)
{ "message": "Entity with slug 'chamado-ti' already exists." }

// Erro 403 (ForbiddenException)
{ "message": "You do not have permission to perform this action." }
```

## Enums

### FieldType
```
Text=0, Textarea=1, Number=2, Decimal=3, Date=4, DateTime=5,
Boolean=6, Select=7, MultiSelect=8, File=9, Relation=10
```

### ParameterType / ParameterScope
```
Type:  String=0, Number=1, Boolean=2, Json=3
Scope: Global=0, Tenant=1
```

### PermissionOperation (flags)
```
None=0, Create=1, Read=2, Update=4, Delete=8, All=15
```

---

## Pendente (não implementado)
- `GET /config/entities` — API pública para apps de negócio consumirem
- Endpoints de usuários (`/admin/users`)
