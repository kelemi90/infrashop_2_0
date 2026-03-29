SHELL := /bin/bash
ROOT := $(shell pwd)

.PHONY: all install-system install-node backend-install frontend-install deps compose-up compose-down setup dry-run-setup backup-images populate-images create-admin

all: deps

## Install system packages on Ubuntu/Debian (requires sudo)
install-system:
	@echo "Installing system packages (Ubuntu/Debian)..."
	@echo "See requirements.txt for the full list."
	# Example command — uncomment to run automatically
	# sudo apt update && sudo apt install -y ca-certificates curl gnupg lsb-release build-essential pkg-config python3 python3-dev libvips-dev libvips-tools
	@echo "Done (manual step)."

## Install nvm and Node.js (recommended)
install-node:
	@echo "Install nvm (if not present), then install Node 18+ and npm"
	@echo "Run these commands manually in your shell:"
	@echo "  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash"
	@echo "  source ~/.nvm/nvm.sh"
	@echo "  nvm install 18 && nvm use 18"

## Install backend npm deps
backend-install:
	@echo "Installing backend npm dependencies..."
	cd backend && npm install

## Install frontend npm deps
frontend-install:
	@echo "Installing frontend npm dependencies..."
	cd frontend && npm install

## Install both backend and frontend deps
deps: backend-install frontend-install

## Bring up docker compose stack (build images)
compose-up:
	@echo "Building and starting docker-compose stack..."
	docker compose up -d --build

compose-down:
	@echo "Stopping and removing containers (keeps volumes)."
	docker compose down

## Run the repository production setup script (with optional env)
setup:
	@echo "Run setup script (creates admin, runs migrations etc). Example:"
	@echo "  ADMIN_EMAIL=you@host ADMIN_PASS=secret bash scripts/setup_prod.sh"

dry-run-setup:
	@echo "Show what setup would do without making changes:"
	@echo "  bash scripts/setup_prod.sh --dry-run"

## Create a timestamped tar backup of the image volume (if named 'infrashop_images' adjust as needed)
backup-images:
	@echo "Backing up image volume to scripts/backup/ (volume name must be provided)"
	@read -p "Volume name: " V && mkdir -p scripts/backup && docker run --rm -v "$$V":/data -v "$(ROOT)/scripts/backup":/backup alpine sh -c "tar czf /backup/$$V_$$(date +%s).tar.gz -C /data . || true" && echo "Backup complete."

## Populate a named image volume from repo folder backend/public/images
populate-images:
	@read -p "Volume name: " V && docker run --rm -v "$(ROOT)/backend/public/images":/src -v "$$V":/dest alpine sh -c "cp -a /src/. /dest/ || true" && echo "Population complete."

## Use the backend create_admin helper inside the backend container (if node exists)
create-admin:
	@read -p "Admin email: " E; read -s -p "Admin pass: " P; echo; \
	  docker compose exec backend node backend/scripts/create_admin.js || echo "create_admin failed inside container — try running on host or use the hash method"
