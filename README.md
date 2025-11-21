# Chat API (FastAPI + WebSockets)

A real-time chat application with authentication, built using FastAPI with WebSocket support. Features a separate server and client application architecture with persistent user accounts and session management.

## Features

### Server API (`/api`)
- **Authentication System**
  - User registration with email/username
  - Secure login with session tokens (7-day TTL)
  - Password hashing using PBKDF2-SHA256
  - HttpOnly cookies for session management
  - `POST /api/auth/signup` – register new user
  - `POST /api/auth/login` – authenticate user
  - `POST /api/auth/logout` – end session
  - `GET /api/auth/me` – get current user info
- **Chat Endpoints**
  - `GET /api/health` – health check
  - `POST /api/send` – broadcast message to all connected clients
  - `WS /api/ws` – WebSocket endpoint for real-time chat (authentication required for messaging)

### Client Application
- **Modern UI**
  - Responsive Bootstrap 5 interface
  - Dark/light theme toggle with persistence
  - User presence list (online users)
  - Color-coded message avatars
- **Chat Features**
  - Real-time messaging via WebSocket
  - Display name customization
  - Message history display
  - Connection status indicator
- **Authentication UI**
  - Sign up/sign in modals
  - Persistent sessions
  - Logout functionality

## Tech Stack

**Backend:**
- FastAPI >= 0.115.0 – web framework
- Uvicorn >= 0.30.0 – ASGI server
- Pydantic >= 2.0.0 – data validation
- SQLite – persistent storage for users and sessions

**Frontend:**
- Vanilla JavaScript (ES6 modules)
- Bootstrap 5.3.3 – UI framework
- LocalStorage – theme and name persistence

**Security:**
- PBKDF2-SHA256 password hashing (260,000 iterations)
- Secure session tokens (32-byte random)
- HttpOnly cookies with SameSite=Lax

## Requirements

- Python 3.9+
- Optional: `uv` for fast dependency and venv management

## Setup & Run

### Using Makefile (Recommended)

```bash
# Create virtual environment:
make venv

# Install dependencies (editable with dev extras):
make install-dev

# Start server and client (in separate terminals):
make start        # server on :8000
make start-client # client on :8001

# Open client in browser:
make run-client   # opens http://localhost:8001
```

### Using Docker Compose

```bash
docker compose up -d --build
```

The server will be available at http://localhost:8000 and the client at http://localhost:8001.

### Manual Setup

```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Set Python path
export PYTHONPATH=src

# Run server (terminal 1)
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload

# Run client (terminal 2)
uvicorn client.main:app --host 0.0.0.0 --port 8001 --reload
```

## Project Structure

```
├── src/
│   ├── server/              # FastAPI backend
│   │   ├── auth/           # Authentication module
│   │   │   ├── db.py       # User/session database
│   │   │   ├── security.py # Password hashing
│   │   │   ├── routes.py   # Auth endpoints
│   │   │   └── schemas.py  # Pydantic models
│   │   ├── handlers/       # Request handlers
│   │   ├── connection.py   # WebSocket manager
│   │   ├── main.py         # App initialization
│   │   ├── routes.py       # Route definitions
│   │   └── schemas.py      # Request/response models
│   └── client/             # Client application
│       ├── main.py         # Client app
│       ├── templates/      # HTML templates
│       └── static/         # JS/CSS assets
├── data/                   # SQLite database
├── Dockerfile              # Docker image config
├── docker-compose.yml      # Multi-service orchestration
├── Makefile               # Development automation
└── pyproject.toml         # Python package config
```

## Configuration

### Environment Variables

- `CHATAPI_DB_DIR` – database directory (default: `data/`)
- `PYTHONPATH` – Python path (set to `src/` for local dev)

### Makefile Variables

Customize by setting environment variables or editing the Makefile:

```makefile
PY ?= python3              # Python interpreter
HOST ?= 0.0.0.0           # Server bind address
PORT ?= 8000              # Server port
CLIENT_PORT ?= 8001       # Client port
```

## Database Schema

The application uses SQLite with the following schema:

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Sessions table
CREATE TABLE sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

Database location: `data/chatapi.sqlite3` (created automatically on first run)

## Authentication Flow

1. **Sign Up**: User registers with email/username and password
2. **Login**: User authenticates and receives a session token (stored in HttpOnly cookie)
3. **WebSocket Connection**: Client connects and receives a temporary user ID
4. **Send Messages**: Messages are only broadcast if the user is authenticated (valid session)
5. **Logout**: Session token is deleted from database and cookie is cleared

## Development

### Available Make Commands

```bash
make venv          # Create virtual environment
make install       # Install production dependencies
make install-dev   # Install with dev dependencies
make start         # Start server
make start-client  # Start client
make run-client    # Open client in browser
make clean         # Remove Python cache files
make docker-up     # Start with Docker Compose
make docker-down   # Stop Docker services
```

### Testing

```bash
# Install dev dependencies (includes pytest, httpx, mypy, ruff)
make install-dev

# Run tests (when implemented)
pytest

# Type checking
mypy src/

# Linting
ruff check src/
```

## Production Considerations

- **Connections**: Currently stored in-memory and lost on server restart
  - Consider Redis pub/sub for distributed deployments
- **Database**: SQLite is suitable for small to medium deployments
  - For high traffic, migrate to PostgreSQL
- **Sessions**: 7-day TTL by default
  - Adjust in `src/server/auth/db.py` if needed
- **CORS**: Currently allows localhost origins
  - Update in `src/server/main.py` for production domains
- **HTTPS**: Use a reverse proxy (nginx, Caddy) with SSL/TLS certificates
- **Rate Limiting**: Consider adding rate limiting for auth endpoints

## Security Notes

- Passwords are hashed using PBKDF2-SHA256 with 260,000 iterations
- Session tokens are 32-byte cryptographically random values
- Constant-time comparison prevents timing attacks
- HttpOnly cookies prevent XSS attacks on session tokens
- Authentication required for sending chat messages
- Expired sessions are automatically cleaned up

## License

This project is available for use under standard open source terms.
