FROM node:24-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e AS build
RUN npm install --global pnpm@10.30.1
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:24-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e AS app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0 ASSET_DIR=/data/assets
WORKDIR /app/migrate
COPY packages/db/migrate.mjs ./
COPY packages/db/migrations ./migrations
RUN npm install --omit=dev --no-package-lock --no-audit --no-fund drizzle-orm@0.45.2 pg@8.23.0
WORKDIR /app
COPY --from=build /app/apps/web/.output ./.output
RUN mkdir -p /data/assets && chown -R node:node /app /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "node migrate/migrate.mjs && exec node .output/server/index.mjs"]
