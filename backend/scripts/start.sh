#!/bin/bash
echo "Using development environment variables"
export $(cat ./env/.env.development | xargs)

echo "Starting ts-node server.ts"
nodemon --watch ./src --exec node -r ts-node/register ./src/server.ts
