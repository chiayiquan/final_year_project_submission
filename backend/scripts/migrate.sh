#!/bin/bash

echo "Running Knex migration on development..."
export $(cat ./env/.env.development | xargs)
./node_modules/.bin/knex migrate:latest --knexfile=db/knexfile.js

echo "Running Knex migration on test..."
export $(cat ./env/.env.test | xargs)
./node_modules/.bin/knex migrate:latest --knexfile=db/knexfile.js