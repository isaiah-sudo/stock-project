FROM node:20-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    PYTHONUNBUFFERED=1 \
    VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv \
  && rm -rf /var/lib/apt/lists/*

# Create a virtual environment so Python packages do not try to install
# into Debian's system Python.
RUN python3 -m venv /app/.venv \
  && pip install --no-cache-dir --upgrade pip

# Install Node dependencies first for better layer caching.
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY shared/package.json shared/package.json

# Install Python dependencies for the quote service.
COPY python-quote-service/requirements.txt python-quote-service/requirements.txt
RUN npm ci \
  && pip install --no-cache-dir -r python-quote-service/requirements.txt

# Copy the rest of the source.
COPY . .

# Build the TypeScript workspaces and frontend.
RUN npm run build

EXPOSE 8080 4000 8001

CMD ["node", "scripts/start-fly.mjs"]
