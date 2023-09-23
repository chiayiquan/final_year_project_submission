#!/bin/bash
echo "Using test environment variables"
export $(cat ./env/.env.test | xargs)

echo "Running test case"
./node_modules/.bin/jest --watch