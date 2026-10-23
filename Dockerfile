# syntax=docker/dockerfile:1.7
# One build definition for the full Next.js runtime on Talos; Vercel builds natively.
# Build: docker build --pull -t nabla-site-alban:talos .
ARG NODE_IMAGE=node:24.22.1-alpine3.24
FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# Node's bundled npm may predate the repository's required npm 12.x.
RUN npm install --global npm@12.2.0 \
    && npm ci --no-audit --no-fund

FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NABLA_K8S_BUILD=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# Do not run scripts/run-next-clean.sh: git metadata is excluded from images.
RUN ./node_modules/.bin/next build \
    && test -s .next/standalone/server.js

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 10001 nextjs \
    && adduser -S -D -H -u 10001 -G nextjs nextjs
COPY --from=builder --chown=10001:10001 /app/.next/standalone ./
COPY --from=builder --chown=10001:10001 /app/.next/static ./.next/static
COPY --from=builder --chown=10001:10001 /app/public ./public
RUN mkdir -p /app/.next/cache && chown -R 10001:10001 /app/.next
USER 10001:10001
EXPOSE 3000
CMD ["node", "server.js"]
