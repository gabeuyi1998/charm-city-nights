#!/bin/bash
set -e

: "${SSH_KEY_PATH:?SSH_KEY_PATH is required}"
: "${EC2_IP:?EC2_IP is required}"

echo "Deploying to $EC2_IP..."

ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ec2-user@"$EC2_IP" "
  set -e
  cd /app/charm-city-nights
  git pull origin main
  docker compose -f docker-compose.prod.yml up -d --build
  docker system prune -f
"

echo "Deploy complete."
