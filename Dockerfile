# Base image
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (optional, keep minimal)
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy project metadata and sources
COPY pyproject.toml README.md ./
COPY src ./src

# Install app (wheel build via hatchling)
RUN pip install --upgrade pip \
  && pip install .

# Default env
ENV PYTHONPATH=/app/src

# Default command is overridden by docker-compose per service
CMD ["python", "-c", "print('Specify a command, e.g. uvicorn server.main:app')"]

