#!/bin/bash

echo -n "Input file name:"
read name

./node_modules/.bin/knex migrate:make ${name} --knexfile=db/knexfile.js -x js