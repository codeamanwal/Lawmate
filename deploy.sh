#!/bin/bash
set -e
echo "=== 📥 1. Pulling latest code ==="
cd /app/lawmate
git fetch origin
git reset --hard origin/main

echo "=== 📦 2. Building frontend ==="
cd /app/lawmate/lawmate-pwa
npm install
export NODE_OPTIONS="--max-old-space-size=512"
npm run build

echo "=== ☁️ 3. Syncing S3 ==="
aws s3 sync dist/ s3://lawoncall --delete || true

echo "=== ⚡ 4. Invalidating CloudFront Cache ==="
aws cloudfront create-invalidation --distribution-id E4P9M3RPU2GAE --paths "/*" || true

echo "=== 🗄️ 5. Running DB Migrations ==="
cd /app/lawmate
npm run db:generate
npm run db:push

echo "=== 🐳 6. Restarting Docker Compose ==="
sudo docker compose down
sudo docker compose up -d --build
echo "=== 🎉 Deployment Completed Successfully! ==="
