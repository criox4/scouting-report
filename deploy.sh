#!/usr/bin/env bash
# Build and (re)start the container on a remote Docker host: ./deploy.sh [ssh-host] [public-port]
set -euo pipefail
HOST=${1:-zd-server}
PORT=${2:-80}
DIR=pnl-tracker

rsync -az --delete --exclude node_modules --exclude .next --exclude .cache --exclude .git --exclude .impeccable --exclude .env ./ "$HOST:$DIR/"
scp -q .env "$HOST:$DIR/.env"
ssh "$HOST" "chmod 600 $DIR/.env && cd $DIR && sudo docker build -q -t pnl-tracker . \
  && (sudo docker rm -f pnl-tracker >/dev/null 2>&1 || true) \
  && sudo docker run -d --name pnl-tracker --restart unless-stopped --env-file .env -v pnl-data:/data -p $PORT:3000 pnl-tracker \
  && sudo docker image prune -f >/dev/null && sudo docker builder prune -f >/dev/null"
echo "deployed to $HOST on port $PORT"
