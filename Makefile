.PHONY: start run-server start-client run-client install install-dev sync upgrade venv help compose-up compose-down compose-build

# Configurable variables (override like: make start PORT=9000)
PY ?= python3
HOST ?= 0.0.0.0
PORT ?= 8000
APP ?= server.main:app
PYTHONPATH ?= src
UV ?= uv
CLIENT_APP ?= client.main:app
CLIENT_PORT ?= 8001
# Use localhost for browser URLs by default (HOST is for binding)
OPEN_HOST ?= localhost
CLIENT_URL ?= http://$(OPEN_HOST):$(CLIENT_PORT)/
# Server host used by the client to call API/WS (query string)
SERVER_HOST_QS ?= localhost

help:
	@echo "Available targets:"
	@echo "  venv        - Create/manage virtualenv via uv (interactive)"
	@echo "  install     - Install the app in production mode (uv)"
	@echo "  install-dev - Install in editable mode with dev deps (uv)"
	@echo "  sync        - Resolve and sync deps from pyproject (uv)"
	@echo "  upgrade     - Upgrade all deps and sync (uv)"
	@echo "  start       - Start the FastAPI server via Uvicorn"
	@echo "  start-client- Start the client app via Uvicorn"
	@echo "  run-client  - Open the demo client in the browser"
	@echo "  compose-up  - Build and start server+client via docker-compose"
	@echo "  compose-down- Stop and remove compose services"
	@echo "  compose-build- Rebuild compose images"
	@echo "Variables: HOST=$(HOST) PORT=$(PORT) APP=$(APP) PYTHONPATH=$(PYTHONPATH)"

install:
	@command -v $(UV) >/dev/null 2>&1 || { echo "uv not found. Install it: https://docs.astral.sh/uv/"; exit 1; }
	$(UV) pip install .

install-dev:
	@command -v $(UV) >/dev/null 2>&1 || { echo "uv not found. Install it: https://docs.astral.sh/uv/"; exit 1; }
	$(UV) pip install -e '.[dev]'

sync:
	@command -v $(UV) >/dev/null 2>&1 || { echo "uv not found. Install it: https://docs.astral.sh/uv/"; exit 1; }
	$(UV) sync

upgrade:
	@command -v $(UV) >/dev/null 2>&1 || { echo "uv not found. Install it: https://docs.astral.sh/uv/"; exit 1; }
	$(UV) lock --upgrade
	$(UV) sync

start-server:
	PYTHONPATH=$(PYTHONPATH) uvicorn $(APP) --host $(HOST) --port $(PORT) --reload

start-client:
	PYTHONPATH=$(PYTHONPATH) uvicorn $(CLIENT_APP) --host $(HOST) --port $(CLIENT_PORT) --reload

run-client:
	@echo "Opening demo client at $(CLIENT_URL)?server_host=$(SERVER_HOST_QS)&server_port=$(PORT)"
	@echo "(Ensure the server is running: make start and client: make start-client)"
	@$(PY) -c "import sys, webbrowser; webbrowser.open(sys.argv[1])" "$(CLIENT_URL)?server_host=$(SERVER_HOST_QS)&server_port=$(PORT)"

compose-up:
	docker compose up -d --build

compose-down:
	docker compose down -v

compose-build:
	docker compose build --no-cache

venv:  ## Create/manage virtualenv using uv: show activate/deactivate, recreate, or delete options
	@if [ -d .venv ]; then \
		echo ".venv already exists."; \
		echo "What do you want to do?"; \
		echo "  [a] Activate (show instructions)"; \
		echo "  [d] Deactivate (show instructions)"; \
		echo "  [r] Recreate"; \
		echo "  [x] Delete"; \
		echo "  [q] Quit (default q)"; \
		printf "Enter choice: "; read ans; \
		case "$$ans" in \
			[Aa]) \
				if [ -f .venv/bin/activate ]; then \
					echo "To activate the virtual environment in your current shell, run:"; \
					echo ""; \
					echo "  source .venv/bin/activate"; \
					echo ""; \
					echo "(Note: make cannot activate your shell; you must run the command above yourself.)"; \
				else \
					echo "Activation script not found. Consider choosing 'recreate' to rebuild the venv."; \
				fi ;; \
			[Dd]) \
				echo "To deactivate the virtual environment in your current shell, run:"; \
				echo ""; \
				echo "  deactivate"; \
				echo ""; \
				echo "(Run this in the shell where the venv is currently active.)"; \
				;; \
			[Rr]) \
				echo "Recreating virtual environment..."; \
				rm -rf .venv && $(UV) venv && echo "Virtual environment recreated. Activate it with: source .venv/bin/activate"; \
				;; \
			[Xx]) \
				echo "Deleting virtual environment..."; \
				rm -rf .venv && echo "Virtual environment deleted."; \
				;; \
			[Qq]) \
				echo "Quit."; \
				;; \
			*) \
				echo "Quit."; \
				;; \
			esac; \
	else \
		$(UV) venv && echo "Virtual environment created. Activate it with: source .venv/bin/activate"; \
	fi
