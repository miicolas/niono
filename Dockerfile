FROM oven/bun:1.3-slim AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build && bun run build:migrate

FROM oven/bun:1.3-slim AS app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0 ASSET_DIR=/data/assets
WORKDIR /app
COPY --from=build /app/.output ./.output
COPY --from=build /app/migrations ./migrations
RUN mkdir -p /data/assets && chown -R bun:bun /app /data
USER bun
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD bun -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "bun .output/migrate.mjs && exec bun .output/server/index.mjs"]
