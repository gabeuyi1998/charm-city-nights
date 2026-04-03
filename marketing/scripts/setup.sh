#!/bin/bash
set -e
echo "🦀 Setting up CCN Marketing System..."

# Install n8n globally
npm install -g n8n@latest

# Install project deps
npm install

# Create required directories
mkdir -p logs n8n/workflows n8n/credentials

# Copy env if not exists
[ ! -f .env ] && cp .env.example .env && echo "📝 Created .env — fill in your API keys"

echo "✅ Setup complete. Run: npm run dev"
echo "   n8n UI: http://localhost:5678"
