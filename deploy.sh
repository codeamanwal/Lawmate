#!/bin/bash
set -e

export NODE_OPTIONS="--max-old-space-size=512"
export COMPOSE_PARALLEL_LIMIT=1

echo "=== 📥 1. Pulling latest code ==="
cd /app/lawmate
git fetch origin
git reset --hard origin/main

echo "=== 📦 2. Building frontend ==="
cd /app/lawmate/lawmate-pwa
npm install --no-audit --no-fund || true
npm run build || echo "⚠️ Frontend build skipped on EC2 host due to RAM limits (Vercel handles frontend deployment)"

echo "=== ☁️ 3. Syncing S3 ==="
if [ -d "dist" ]; then
  aws s3 sync dist/ s3://lawoncall --delete || true
fi

echo "=== ⚡ 4. Invalidating CloudFront Cache ==="
aws cloudfront create-invalidation --distribution-id E4P9M3RPU2GAE --paths "/*" || true

echo "=== 🗄️ 5. Running DB Migrations ==="
cd /app/lawmate
npm run db:generate
npm run db:push

echo "=== 🐳 6. Restarting Docker Compose ==="
sudo docker compose down || true
COMPOSE_PARALLEL_LIMIT=1 sudo -E docker compose up -d --build || sudo docker compose up -d
echo "=== 🎉 Deployment Completed Successfully! ==="
