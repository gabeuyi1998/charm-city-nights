#!/bin/bash
set -e

: "${SSH_KEY_PATH:?SSH_KEY_PATH is required}"
: "${EC2_IP:?EC2_IP is required}"

echo "Deploying to $EC2_IP..."

ssh -i "$SSH_KEY_PATH" \
  -o StrictHostKeyChecking=no \
  -o ServerAliveInterval=60 \
  -o ServerAliveCountMax=10 \
  ec2-user@"$EC2_IP" "
  set -e
  cd /app/charm-city-nights
  git pull origin main
  DOCKERHUB_USERNAME=${DOCKERHUB_USERNAME} docker compose -f docker-compose.prod.yml pull api
  DOCKERHUB_USERNAME=${DOCKERHUB_USERNAME} docker compose -f docker-compose.prod.yml up -d --no-build
  docker compose -f docker-compose.prod.yml restart caddy
  docker system prune -f
"

echo "Deploy complete."
