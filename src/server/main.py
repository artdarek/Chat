from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.routes import router as api_router
from server.auth.routes import router as auth_router
from server.auth.db import init_db


app = FastAPI(title="Chat API", version="0.1.0")

# Add CORS middleware at import time so preflight OPTIONS are handled
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "http://0.0.0.0:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes only (client is a separate app)
app.include_router(api_router, prefix="/api")
app.include_router(auth_router, prefix="/api")


@app.on_event("startup")
def _startup() -> None:
    init_db()
