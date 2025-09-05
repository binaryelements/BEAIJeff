FROM oven/bun:1.2-debian
WORKDIR /app
COPY package.json bun.lockb* /app/
RUN bun install
COPY . /app/
CMD ["bun", "run", "start"]