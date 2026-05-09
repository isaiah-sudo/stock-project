FROM node:20-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies before copying the full source to keep rebuilds fast.
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY shared/package.json shared/package.json
COPY python-quote-service/requirements.txt python-quote-service/requirements.txt

RUN npm ci \
  && pip3 install --no-cache-dir -r python-quote-service/requirements.txt

COPY . .

RUN npm run build

EXPOSE 3000 4000 8001

CMD ["node", "scripts/start-fly.mjs"]
