# carlet-interview-20260119

## Install

To install bun (macOS):

```sh
# install bun macOS
brew tap oven-sh/bun
brew install bun

# check version
bun --version
```

To install Docker:

To install dependencies:

```sh
bun install
```

To copy and configure .env

```
cp .env.example .env
```

## Run server

```sh
docker compose up -d
bun run dev
```

open http://localhost:3000

## drizzle-kit migration

edit `./src/postgres/schema.ts` to add new schema, and run:

```sh
bun run drizzle-kit push
```