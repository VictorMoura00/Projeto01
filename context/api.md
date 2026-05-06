# AdminCore — Referência da API

## Base URL
- Dev: `http://localhost:5000`
- Docker: `http://localhost:8080`

## Endpoints Disponíveis

### Health
```
GET /health → { status: "healthy", timestamp: "..." }
```

### Config (público — sem autenticação)
```
GET /tenants/{slug}/config → tema e configurações visuais do tenant
GET /config/entities        → lista entidades do tenant autenticado
GET /config/entities/{id}/schema → schema completo (campos + validações)
GET /config/parameters/{group}  → parâmetros por grupo
```

### Admin (requer autenticação — fase futura)
```
# Entities
GET    /admin/entities
POST   /admin/entities
GET    /admin/entities/{id}
PUT    /admin/entities/{id}
DELETE /admin/entities/{id}

GET    /admin/entities/{id}/fields
POST   /admin/entities/{id}/fields
PUT    /admin/entities/{id}/fields/{fieldId}
DELETE /admin/entities/{id}/fields/{fieldId}

# Parameters
GET    /admin/parameters
GET    /admin/parameters/{group}
PUT    /admin/parameters/{key}

# Access
GET    /admin/roles
POST   /admin/roles
GET    /admin/roles/{id}/permissions
PUT    /admin/roles/{id}/permissions

GET    /admin/users
POST   /admin/users
PUT    /admin/users/{id}/roles

# White Label
GET    /admin/theme
PUT    /admin/theme
```

## Convenção de Resposta
```json
// Lista paginada
{
  "items": [...],
  "totalCount": 50,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}

// Erro de validação (400)
{
  "errors": {
    "name": ["Name is required"],
    "slug": ["Slug must be lowercase"]
  }
}

// Erro de domínio (422)
{ "message": "Entity with slug 'chamado-ti' already exists." }
```

## Segurança (fase futura)
- JWT Bearer em `Authorization: Bearer <token>`
- Claim `tenant_id` usado pelo middleware para resolver ICurrentTenant
- Permissões verificadas por handler antes de executar operação
