#!/bin/bash

# Check if the parameter has the desired value
if [ "$1" = "development" ]; then
    export $(cat ./env/.env.development | xargs)
    npm run dev
else
    echo "The parameter does not have the desired value."
fi