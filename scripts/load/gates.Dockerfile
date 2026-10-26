# Offline implementation gates only; no running app/stores/browser/load.
FROM slp-resume-http-api:latest
USER root
COPY --chown=node:node . /home/node/app/
USER node
RUN pnpm build && pnpm test && pnpm lint && pnpm typecheck
