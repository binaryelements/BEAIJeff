#!/bin/bash

if [ "$ENV" = "production" ] || [ "$ENV" = "staging" ]; then
    echo "Running in production/staging mode..."
    bun start
else
    echo "Running in development mode..."
    bun dev
fi