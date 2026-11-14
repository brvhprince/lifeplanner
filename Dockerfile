# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Toolchain for native modules (better-sqlite3) when no prebuilt binary matches.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 DATA_DIR=/tmp/build-data
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATA_DIR=/data

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/drizzle ./drizzle
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint
COPY docker/lp /usr/local/bin/lp
RUN chmod 755 /usr/local/bin/docker-entrypoint /usr/local/bin/lp

# Starts as root only to fix ownership of /data, then drops to PUID:PGID
# (default 1000:1000, the image's `node` user). See docker/entrypoint.sh.
ENV PUID=1000 PGID=1000
VOLUME /data
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
    CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/auth/sign-in',{redirect:'manual'}).then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint"]
CMD ["node", "server.js"]
