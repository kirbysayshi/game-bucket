#!/bin/bash

if ! [ -x "$(command -v advzip)" ]; then 
  echo 'Error: advancecomp is not installed. Try Homebrew.';
  exit 1;
fi; 