##
## AdminCore — Dev Makefile
## Uso: make dev  (sobe tudo)
##

MAKEFLAGS += --no-print-directory
SHELL     := /bin/bash

# Load .env if present (silently ignore if missing)
-include .env
export

ROOT_DIR  := $(shell pwd)
BACK_DIR  := $(ROOT_DIR)/backend
FRONT_DIR := $(ROOT_DIR)/frontend
API_SLN   := $(BACK_DIR)/AdminCore.slnx
API_PROJ  := $(BACK_DIR)/src/AdminCore.API

EF := $(HOME)/.dotnet/tools/dotnet-ef
EF_STARTUP := -s $(API_PROJ)

# Módulos com DbContext (contexto → projeto)
define MODULES
  EntitiesDbContext|$(BACK_DIR)/src/Modules/Entities/AdminCore.Modules.Entities
  TenantsDbContext|$(BACK_DIR)/src/Modules/Tenants/AdminCore.Modules.Tenants
  AccessDbContext|$(BACK_DIR)/src/Modules/Access/AdminCore.Modules.Access
  ParametersDbContext|$(BACK_DIR)/src/Modules/Parameters/AdminCore.Modules.Parameters
  AuthDbContext|$(BACK_DIR)/src/Modules/Auth/AdminCore.Modules.Auth
endef

# Cores para output prefixado
COLOR_API      := \033[34m
COLOR_FRONT    := \033[32m
COLOR_RESET    := \033[0m

.PHONY: help dev up down logs migrate migrate-status build test clean

## help: lista os comandos disponíveis
help:
	@grep -E '^## ' Makefile | sed 's/## //'

## ─── DEV (tudo junto) ────────────────────────────────────────────────────────

## dev: sobe infra, roda migrations e inicia API + frontend
dev: up migrate _start

_start:
	@echo -e "$(COLOR_API)[API]$(COLOR_RESET)      http://localhost:5000"
	@echo -e "$(COLOR_FRONT)[FRONTEND]$(COLOR_RESET) http://localhost:4200"
	@echo "──────────────────────────────────────────"
	@( \
		_prefix() { \
			local color="$$1"; local name="$$2"; shift 2; \
			"$$@" 2>&1 | while IFS= read -r line; do \
				printf "$$color[$$name]$(COLOR_RESET) %s\n" "$$line"; \
			done; \
		}; \
		export -f _prefix; \
		_prefix "$(COLOR_API)" "API     " \
			dotnet run --project $(API_PROJ) --launch-profile http & \
		_prefix "$(COLOR_FRONT)" "FRONTEND" \
			bash -c "cd $(FRONT_DIR) && ng serve" & \
		trap 'kill %1 %2 2>/dev/null' EXIT INT TERM; \
		wait \
	)

## ─── INFRA (PostgreSQL) ──────────────────────────────────────────────────────

## up: sobe o PostgreSQL via Docker
up:
	@echo "▶  Iniciando PostgreSQL..."
	@docker compose -f docker-compose.dev.yml up -d --wait
	@echo "✔  PostgreSQL pronto em localhost:5432"

## down: para e remove os containers de dev
down:
	docker compose -f docker-compose.dev.yml down

## logs: exibe logs do PostgreSQL
logs:
	docker compose -f docker-compose.dev.yml logs -f

## ─── MIGRATIONS ──────────────────────────────────────────────────────────────

## migrate: aplica migrations de todos os módulos
migrate:
	@echo "▶  Aplicando migrations..."
	@export PATH="$$PATH:$(HOME)/.dotnet/tools"; \
	$(MAKE) _migrate_one CTX=EntitiesDbContext   MOD=$(BACK_DIR)/src/Modules/Entities/AdminCore.Modules.Entities; \
	$(MAKE) _migrate_one CTX=TenantsDbContext    MOD=$(BACK_DIR)/src/Modules/Tenants/AdminCore.Modules.Tenants; \
	$(MAKE) _migrate_one CTX=AccessDbContext     MOD=$(BACK_DIR)/src/Modules/Access/AdminCore.Modules.Access; \
	$(MAKE) _migrate_one CTX=ParametersDbContext MOD=$(BACK_DIR)/src/Modules/Parameters/AdminCore.Modules.Parameters; \
	$(MAKE) _migrate_one CTX=AuthDbContext       MOD=$(BACK_DIR)/src/Modules/Auth/AdminCore.Modules.Auth; \
	$(MAKE) _migrate_one CTX=FormBuilderDbContext MOD=$(BACK_DIR)/src/Modules/FormBuilder/AdminCore.Modules.FormBuilder
	@echo "✔  Migrations aplicadas"

_migrate_one:
	@export PATH="$$PATH:$(HOME)/.dotnet/tools"; \
	if ls $(MOD)/Infrastructure/Migrations/*.cs 2>/dev/null | grep -v Designer | grep -q .; then \
		echo "  → $(CTX)"; \
		dotnet-ef database update --context $(CTX) -p $(MOD) -s $(API_PROJ) --no-build 2>&1 \
			| grep -v "^info\|^dbug\|^warn\|Wolverine\|BuildHost\|\.dll\|^To disable"; \
	else \
		echo "  ○ $(CTX) — sem migrations, pulando"; \
	fi

## migrate-status: mostra status das migrations
migrate-status:
	@export PATH="$$PATH:$(HOME)/.dotnet/tools"; \
	for ctx in EntitiesDbContext TenantsDbContext AccessDbContext ParametersDbContext AuthDbContext FormBuilderDbContext; do \
		echo "=== $$ctx ==="; \
	done

## migrate-add NAME=<nome> CTX=<DbContext> MOD=<caminho>: cria uma nova migration
## Exemplo: make migrate-add NAME=AddTenantConfig CTX=TenantsDbContext MOD=backend/src/Modules/Tenants/AdminCore.Modules.Tenants
migrate-add:
	@export PATH="$$PATH:$(HOME)/.dotnet/tools"; \
	dotnet-ef migrations add $(NAME) \
		--context $(CTX) \
		-p $(MOD) \
		-s $(API_PROJ) \
		--output-dir Infrastructure/Migrations

## ─── BUILD / TESTES ──────────────────────────────────────────────────────────

## build: compila backend e frontend
build: build-back build-front

build-back:
	@echo "▶  Build backend..."
	@dotnet build $(API_SLN) -c Release --no-restore 2>&1 | tail -5

build-front:
	@echo "▶  Build frontend..."
	@cd $(FRONT_DIR) && ng build 2>&1 | tail -5

## test: roda todos os testes do backend
test:
	@dotnet test $(API_SLN) --no-build 2>&1 | tail -20

## ─── LIMPEZA ──────────────────────────────────────────────────────────────────

## clean: remove artefatos de build
clean:
	@find $(BACK_DIR) -name "bin" -o -name "obj" | xargs rm -rf
	@rm -rf $(FRONT_DIR)/dist $(FRONT_DIR)/.angular
	@echo "✔  Limpo"

## clean-db: remove volumes do banco (⚠ apaga todos os dados!)
clean-db:
	@read -p "Tem certeza? Isso apaga TODOS os dados dev [y/N]: " confirm; \
	[ "$$confirm" = "y" ] && docker compose -f docker-compose.dev.yml down -v && echo "✔  Volume removido" || echo "Cancelado"
