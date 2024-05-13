#!/bin/bash

set -x
set -e

yarn types --watch &
yarn build --watch &
yarn build:demos --watch &
yarn http-server -c-1 . &

wait