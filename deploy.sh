#!/usr/bin/env bash
# Build and (re)start on a remote Docker host: ./deploy.sh [ssh-host] [domain]
# Runs two containers on a private network: pnl-tracker (app + SQLite) and caddy (HTTPS on 80/443).
# The default domain is the host's free sslip.io name, which resolves to its public IP.
set -euo pipefail
HOST=${1:-zd-server}
DIR=pnl-tracker
IP=$(ssh "$HOST" 'curl -s https://checkip.amazonaws.com')
DOMAIN=${2:-${IP//./-}.sslip.io}

rsync -az --delete --exclude node_modules --exclude .next --exclude .cache --exclude .git --exclude .impeccable --exclude .env ./ "$HOST:$DIR/"
scp -q .env "$HOST:$DIR/.env"
ssh "$HOST" "set -e; chmod 600 $DIR/.env; cd $DIR
  sudo docker network inspect pnl >/dev/null 2>&1 || sudo docker network create pnl >/dev/null
  sudo docker build -q -t pnl-tracker . >/dev/null
  sudo docker rm -f pnl-tracker caddy >/dev/null 2>&1 || true
  sudo docker run -d --name pnl-tracker --network pnl --restart unless-stopped --env-file .env -v pnl-data:/data -p 127.0.0.1:3000:3000 pnl-tracker >/dev/null
  sudo docker run -d --name caddy --network pnl --restart unless-stopped -e DOMAIN=$DOMAIN -p 80:80 -p 443:443 \
    -v \$PWD/deploy/Caddyfile:/etc/caddy/Caddyfile:ro -v caddy-data:/data caddy:2-alpine >/dev/null
  sudo docker image prune -f >/dev/null; sudo docker builder prune -f >/dev/null"
echo "deployed: https://$DOMAIN"
