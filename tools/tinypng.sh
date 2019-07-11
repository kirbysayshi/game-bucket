#!/bin/bash

set -x
set -e

APIKEY=$(cat .tinypngapi)

INPUT=$1
OUTPUT=$2

if [ -z "$INPUT" ]; then echo "INPUT was not specified!"; exit 1; fi;
if [ -z "$OUTPUT" ]; then echo "OUTPUT was not specified!"; exit 1; fi;
if [ -z "$APIKEY" ]; then echo ".tinypngapi was not found or did not contain an API key"; exit 0; fi;

curl $(curl https://api.tinify.com/shrink \
     --user api:$APIKEY \
     --data-binary @"$INPUT" | jq -r .output.url) > $OUTPUT