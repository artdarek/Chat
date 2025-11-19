# Chat API (FastAPI + WebSockets)

A minimal chat server and a separate demo client. Uses FastAPI with a WebSocket endpoint for real‑time broadcast to all connected clients.

## Features

- API (served by server app)
  - `GET /api/health` – basic health check
  - `POST /api/send` – broadcast a message to all connected clients
  - `WS /api/ws` – WebSocket endpoint for real‑time chat
- Client (served by client app)
  - `GET /` – demo HTML page, static JS/CSS under `/static`

## Requirements

- Python 3.10+
- Optional: `uv` for fast dependency and venv management

## Setup & Run

With `make` helpers (recommended):

```bash
# Create venv (interactive):
make venv

# Install deps (editable with dev extras):
make install-dev

# Start server and client (two terminals):
make start        # server on :8000
make start-client # client on :8001

# Open client in browser (passes server host/port via query string):
make run-client
```

## Notes

- The server keeps connections in memory. It is single‑process and non‑persistent.
- For production, consider a shared message bus (e.g., Redis pub/sub) and persistent storage.
- No authentication is implemented; all messages are public.
