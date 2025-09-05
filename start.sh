#!/bin/bash

if [ "$ENV" = "production" ] || [ "$ENV" = "staging" ]; then
    echo "Running in production/staging mode..."
    bun install --production
    bun run build
    bun run start
else
    echo "Running in development mode..."
    bun install
    bun run dev
fi