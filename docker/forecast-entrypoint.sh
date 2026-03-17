#!/bin/sh

# Restore .claude.json from PVC if previously saved
if [ -f /home/pwuser/.claude/.claude.json ]; then
  cp /home/pwuser/.claude/.claude.json /home/pwuser/.claude.json
fi

exec "$@"
