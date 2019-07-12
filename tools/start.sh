#!/bin/bash

set -x
set -e

yarn types --watch &
yarn build --watch &
yarn http-server dist/ &

wait