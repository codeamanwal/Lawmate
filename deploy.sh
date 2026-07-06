#!/bin/bash
set -e

echo "=== 📥 1. Pulling latest code from origin/main ==="
cd /app/lawmate
git fetch origin
git reset --hard origin/main

echo "=== 📦 2. Building frontend & deploying static files ==="
cd /app/lawmate/lawmate-pwa
npm install
npm run build

echo "=== ☁️ 3. Syncing assets with S3 bucket ==="
aws s3 sync dist/ s3://lawoncall --delete

echo "=== ⚡ 4. Invalidating CloudFront cache ==="
aws cloudfront create-invalidation --distribution-id E4P9M3RPU2GAE --paths "/*"

echo "=== 🗄️ 5. Running database migrations ==="
cd /app/lawmate
npm run db:generate
npm run db:push

echo "=== 🐳 6. Restarting backend microservices (Docker) ==="
sudo docker compose down
sudo docker compose up -d

echo "=== 🎉 Deployment Completed Successfully! ==="
