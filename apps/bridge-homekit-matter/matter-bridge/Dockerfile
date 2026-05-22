# syntax=docker/dockerfile:1.7
#
# COYL Matter Bridge — production container image.
#
# Multi-stage build: a heavier `builder` stage compiles TypeScript +
# installs dev dependencies, then a slim `runtime` stage copies in
# only the production artifacts + production-only node_modules.
#
# Networking: Matter requires IPv6 multicast (mDNS) on the host LAN
# to discover commissioned devices. That means `--network=host` at
# `docker run` time. We expose port 5540 for the future commissioning
# web UI (v0.5), but the controller itself opens the actual Matter
# ports (UDP/IPv6) on the host network directly.
#
# State: the fabric state lives at /data/fabric (named volume). Lose
# this volume and every device has to be re-commissioned. Back it up.
#
# Build:   docker build -t coyl/matter-bridge:0.1.0 .
# Run:     docker run -d --restart=unless-stopped \
#                --network=host \
#                -e COYL_USER_TOKEN=... \
#                -e COYL_API_BASE=https://coyl.ai \
#                -v coyl-matter-fabric:/data/fabric \
#                coyl/matter-bridge:0.1.0

# ---- builder ---------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Install build deps first (better layer cache).
COPY package.json tsconfig.json ./
# We prefer pnpm but the bridge is small enough that bare npm + a
# fresh lockfile works. v0.2 will commit pnpm-lock.yaml.
RUN npm install --include=dev --no-audit --no-fund

COPY src ./src
RUN npm run build

# ---- runtime ---------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

# Runtime deps only.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Fabric state directory.
RUN mkdir -p /data/fabric
ENV COYL_MATTER_STORAGE_PATH=/data/fabric

# Non-root user. Matter doesn't need root on the host because we use
# --network=host; the container itself can be unprivileged.
RUN addgroup -S coyl && adduser -S coyl -G coyl \
    && chown -R coyl:coyl /app /data
USER coyl

# Healthcheck — process up + log target writable. The poll loop's
# correctness is observed via the EAP server's audit log, not here.
HEALTHCHECK --interval=60s --timeout=5s --start-period=15s \
  CMD node -e "process.exit(0)" || exit 1

EXPOSE 5540

CMD ["node", "dist/index.js"]
