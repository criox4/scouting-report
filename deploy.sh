#!/usr/bin/env bash
# Build and (re)start the app on a remote Docker host.
#   ./deploy.sh [ssh-host] [local-port]            app on 127.0.0.1:<port>, behind the host's own nginx (deploy/nginx.conf)
#   CADDY_DOMAIN=x.sslip.io ./deploy.sh host       also run a Caddy container for HTTPS on 80/443 (hosts without nginx)
set -euo pipefail
HOST=${1:-zd-instance}
PORT=${2:-3100}
DIR=pnl-tracker

rsync -az --delete --exclude node_modules --exclude .next --exclude .cache --exclude .git --exclude .impeccable --exclude .env ./ "$HOST:$DIR/"
scp -q .env "$HOST:$DIR/.env"
ssh "$HOST" "set -e; chmod 600 $DIR/.env; cd $DIR
  sudo docker network inspect pnl >/dev/null 2>&1 || sudo docker network create pnl >/dev/null
  sudo docker build -q -t pnl-tracker . >/dev/null
  sudo docker rm -f pnl-tracker >/dev/null 2>&1 || true
  sudo docker run -d --name pnl-tracker --network pnl --restart unless-stopped --env-file .env -v pnl-data:/data -p 127.0.0.1:$PORT:3000 pnl-tracker >/dev/null
  if [ -n '${CADDY_DOMAIN:-}' ]; then
    sudo docker rm -f caddy >/dev/null 2>&1 || true
    sudo docker run -d --name caddy --network pnl --restart unless-stopped -e DOMAIN=${CADDY_DOMAIN:-} -p 80:80 -p 443:443 \
      -v \$PWD/deploy/Caddyfile:/etc/caddy/Caddyfile:ro -v caddy-data:/data caddy:2-alpine >/dev/null
  fi
  sudo docker image prune -f >/dev/null; sudo docker builder prune -f >/dev/null"
echo "deployed to $HOST (app on 127.0.0.1:$PORT${CADDY_DOMAIN:+, https://$CADDY_DOMAIN})"
