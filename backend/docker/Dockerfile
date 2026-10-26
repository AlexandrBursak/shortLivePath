FROM node:24.17.0-bookworm-slim AS toolchain
RUN npm install --global pnpm@11.5.2
WORKDIR /home/node/app

FROM toolchain AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY --chown=node:node . .
RUN chown -R node:node /home/node/app
USER node
RUN pnpm build
CMD ["pnpm", "start"]

# Fresh install: pruning the build tree could leave optional peer tooling behind.
FROM toolchain AS runtime-dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --no-optional --frozen-lockfile

# Independent base: no pnpm, source, tests or build tools copied from toolchain.
FROM node:24.17.0-bookworm-slim AS runtime
WORKDIR /home/node/app
ENV NODE_ENV=production
COPY --from=runtime-dependencies --chown=node:node /home/node/app/node_modules ./node_modules
COPY --from=runtime-dependencies --chown=node:node /home/node/app/package.json ./package.json
COPY --from=build --chown=node:node /home/node/app/build ./build
COPY --chown=node:node docker/process-fence.sh ./process-fence.sh
RUN mkdir -p /run/slp-owner && chown node:node /run/slp-owner && command -v flock
USER node
ENTRYPOINT ["sh", "/home/node/app/process-fence.sh"]
CMD ["node", "build/bin/server.js"]
