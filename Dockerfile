# Railway / any Docker host: explicit install + native build deps for better-sqlite3.
FROM node:20-bookworm-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./

RUN node -v && npm -v && \
    if [ ! -s package-lock.json ]; then \
      echo "ERROR: package-lock.json is missing or empty. Commit it from the lucky-games-ai folder and set Railway Root Directory to lucky-games-ai."; \
      exit 1; \
    fi && \
    npm ci --foreground-scripts --loglevel=warn

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

EXPOSE 3000

ENV HOSTNAME=0.0.0.0

CMD ["sh", "-c", "exec npx next start -p ${PORT:-3000}"]
