# T19 offline quality gates; intentionally reuse the verified installed dependency image.
FROM slp-resume-ui-browser
WORKDIR /home/node/app
COPY . .
RUN pnpm test && pnpm lint && pnpm typecheck && pnpm build
