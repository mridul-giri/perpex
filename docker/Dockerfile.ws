FROM oven/bun:1

WORKDIR /usr/src/app

COPY ./package.json ./package.json
COPY ./bun.lock ./bun.lock

COPY ./packages ./packages

COPY ./apps/ws ./apps/ws

RUN bun install

WORKDIR /usr/src/app/apps/ws

EXPOSE 3002

CMD ["bun", "run", "src/index.ts"]
