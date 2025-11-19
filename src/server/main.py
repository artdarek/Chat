from fastapi import FastAPI
from server.routes import router as api_router


app = FastAPI(title="Chat API", version="0.1.0")

# Include API routes only (client is a separate app)
app.include_router(api_router, prefix="/api")
