#!/bin/bash
# Run once on a fresh Amazon Linux 2023 EC2 instance
set -e

# Install dependencies
sudo dnf update -y
sudo dnf install -y docker git

# Install Caddy
sudo dnf install -y 'dnf-command(copr)'
sudo dnf copr enable -y @caddy/caddy
sudo dnf install -y caddy

# Install docker compose plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Start docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# Clone repo
sudo mkdir -p /app
sudo chown ec2-user:ec2-user /app
cd /app
git clone https://github.com/gabeuyi1998/charm-city-nights.git
cd charm-city-nights

echo "Bootstrap complete. Log out and back in for docker group to take effect."
echo "Then: cp .env.production.example .env.production && nano .env.production"
echo "Then: docker compose -f docker-compose.prod.yml up -d"
