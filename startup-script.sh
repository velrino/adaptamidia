#!/bin/bash

# Startup script for Google Compute Engine VM
# This script runs when the VM starts

# Update system packages
apt-get update

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Configure Docker to start on boot
systemctl enable docker
systemctl start docker

# Pull and run the latest container
docker pull us-central1-docker.pkg.dev/${PROJECT_ID}/xmp-media/api:latest

# Stop any existing container
docker stop xmp-media-api 2>/dev/null || true
docker rm xmp-media-api 2>/dev/null || true

# Run the new container
docker run -d \
  --name xmp-media-api \
  --restart=always \
  -p 3000:3000 \
  --env-file /opt/xmp-media/.env.production \
  --log-driver=gcplogs \
  us-central1-docker.pkg.dev/${PROJECT_ID}/xmp-media/api:latest

# Setup auto-update with cron (optional)
cat > /etc/cron.d/docker-update << EOF
0 3 * * * root docker pull us-central1-docker.pkg.dev/${PROJECT_ID}/xmp-media/api:latest && docker stop xmp-media-api && docker rm xmp-media-api && docker run -d --name xmp-media-api --restart=always -p 3000:3000 --env-file /opt/xmp-media/.env.production --log-driver=gcplogs us-central1-docker.pkg.dev/${PROJECT_ID}/xmp-media/api:latest
EOF

# Health check
echo "Waiting for API to start..."
for i in {1..30}; do
  if curl -f http://localhost:3000/health 2>/dev/null; then
    echo "API is running successfully!"
    break
  fi
  echo "Attempt $i/30..."
  sleep 5
done

echo "Startup script completed at $(date)"