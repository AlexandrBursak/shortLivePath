# Offline compile of current dirty backend, including parent-owned T20 metrics.
# Retained production dependencies only; no package download or T20 load.
FROM slp-t20-parent-gates AS build
WORKDIR /home/node/app
COPY . .
RUN pnpm build
FROM slp-t3-test-85230-runtime
COPY --from=build --chown=node:node /home/node/app/build /home/node/app/build
