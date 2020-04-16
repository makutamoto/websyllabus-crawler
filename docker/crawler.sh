#!/bin/bash
. /usr/src/app/env.sh
node /usr/src/app/dist/index.js &> /usr/src/app/crawler.log
