FROM node:24.17.0-bookworm-slim AS tooling
RUN npm install --global pnpm@11.5.2
WORKDIR /home/node/app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
FROM tooling AS build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build
FROM node:24.17.0-bookworm-slim AS runtime
WORKDIR /home/node/app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /home/node/app/.next/standalone ./
COPY --from=build --chown=node:node /home/node/app/.next/static ./.next/static
USER node
CMD ["node", "server.js"]
FROM tooling AS browser
RUN pnpm exec playwright install --with-deps chromium
ENV NEXT_TELEMETRY_DISABLED=1
FROM runtime AS production
