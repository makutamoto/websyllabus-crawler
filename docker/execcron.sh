#!/bin/bash
printenv | awk '{print "export " $1}' > /usr/src/app/env.sh
cron -f
