# HelpDesk Management System - Production Deployment Guide

## Table of Contents
1. [GitHub Actions CI/CD](#github-actions-cicd)
2. [SSL/TLS Certificate Setup](#ssltls-certificate-setup)
3. [Nginx Reverse Proxy](#nginx-reverse-proxy)
4. [Production Deployment](#production-deployment)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## GitHub Actions CI/CD

### Workflows Included

#### 1. Build and Push (.github/workflows/build-and-push.yml)
Automatically builds Docker images and pushes to GitHub Container Registry (GHCR).

**Triggers:**
- Push to `main` or `develop` branches
- Push of version tags (`v*`)
- Pull requests to `main` or `develop`

**What it does:**
- Builds Docker images for backend, frontend, and help-desk
- Pushes to GHCR with automatic tagging
- Runs integration tests on built images
- Caches layers for faster builds

**Tags applied:**
- `latest` (for default branch)
- Branch name (e.g., `develop`, `main`)
- Semantic version (e.g., `v1.0.0`)
- Git SHA (e.g., `main-abc123def`)

#### 2. Tests (.github/workflows/tests.yml)
Runs unit tests and code quality checks.

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**What it does:**
- .NET tests (backend)
- Node.js linting and builds (frontend and help-desk)
- Trivy security vulnerability scanning
- Uploads results to GitHub Security tab

#### 3. Deploy (.github/workflows/deploy.yml)
Deploys to production server via SSH.

**Triggers:**
- Pushing a version tag (e.g., `git tag v1.0.0 && git push --tags`)
- Manual trigger via GitHub Actions UI

**Setup required:**
Add these secrets to GitHub repository:
- `DEPLOY_HOST`: Production server IP/hostname
- `DEPLOY_USER`: SSH username
- `DEPLOY_KEY`: SSH private key
- `DEPLOY_PATH`: Deployment directory path
- `SLACK_WEBHOOK` (optional): For deployment notifications

### Setting Up GitHub Actions

1. **Enable GitHub Container Registry:**
   ```bash
   # Login with GitHub CLI
   gh auth login
   
   # Or use Docker CLI with PAT token
   echo $GHCR_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```

2. **Add deployment secrets:**
   ```
   GitHub Repo Settings → Secrets and variables → Actions
   
   Required secrets:
   - DEPLOY_HOST
   - DEPLOY_USER
   - DEPLOY_KEY (SSH private key)
   - DEPLOY_PATH
   - SLACK_WEBHOOK (optional)
   ```

3. **Generate SSH key for deployment:**
   ```bash
   ssh-keygen -t ed25519 -f deploy_key -N ""
   
   # Add public key to server: ~/.ssh/authorized_keys
   cat deploy_key.pub >> ~/.ssh/authorized_keys
   
   # Add private key as DEPLOY_KEY secret (contents of deploy_key)
   ```

4. **Trigger deployment:**
   ```bash
   # Via Git tag
   git tag v1.0.0
   git push origin v1.0.0
   
   # Or manually in GitHub UI: Actions → Deploy to Production → Run workflow
   ```

---

## SSL/TLS Certificate Setup

### Option 1: Let's Encrypt (Recommended)

**Prerequisites:**
- Domain name pointing to your server
- Port 80 accessible for ACME challenge

**Steps:**

1. **Generate temporary self-signed certificate:**
   ```bash
   chmod +x generate-cert.sh
   ./generate-cert.sh helpdesk.example.com admin@example.com
   ```

2. **Start Nginx with temp certificate:**
   ```bash
   docker compose -f docker-compose.nginx.yml up -d nginx
   ```

3. **Generate Let's Encrypt certificate:**
   ```bash
   docker run -it --rm --name certbot \
     -v $(pwd)/certbot/conf:/etc/letsencrypt \
     -v $(pwd)/certbot/www:/var/www/certbot \
     certbot/certbot certonly --webroot \
     -w /var/www/certbot \
     -d helpdesk.example.com \
     --email admin@example.com \
     --agree-tos \
     --no-eff-email
   ```

4. **Copy certificate to Nginx:**
   ```bash
   mkdir -p nginx/ssl
   sudo cp certbot/conf/live/helpdesk.example.com/fullchain.pem nginx/ssl/cert.pem
   sudo cp certbot/conf/live/helpdesk.example.com/privkey.pem nginx/ssl/key.pem
   sudo chown $USER:$USER nginx/ssl/*.pem
   ```

5. **Reload Nginx:**
   ```bash
   docker exec helpdesk-nginx nginx -s reload
   ```

### Option 2: Auto-Renewal

**Create cron job for certificate renewal:**
```bash
# Edit crontab
crontab -e

# Add this line to renew daily at 2 AM
0 2 * * * cd /path/to/project && ./renew-cert.sh >> /var/log/cert-renewal.log 2>&1
```

Or use systemd timer:
```bash
sudo systemctl edit --force --full cert-renewal.service
```

Add:
```ini
[Unit]
Description=Renew HelpDesk SSL Certificate
After=docker.service

[Service]
Type=oneshot
WorkingDirectory=/path/to/project
ExecStart=/bin/bash -c './renew-cert.sh'

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable cert-renewal.service
sudo systemctl start cert-renewal.service
```

### Option 3: Self-Signed (Development Only)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/CN=helpdesk.local"
```

---

## Nginx Reverse Proxy

### Configuration Overview

Nginx serves as a reverse proxy for all services with:
- **SSL/TLS termination** - encrypts traffic
- **Load balancing** - distributes traffic
- **Gzip compression** - reduces bandwidth
- **Security headers** - protects from common attacks
- **Caching** - improves performance

### Key Features

**Backend API (/api/):**
- Routes to backend service on port 8080
- Long timeout for file uploads/downloads
- Buffer optimization for large responses

**Frontend (/):**
- Routes to frontend Next.js app
- Cache busting for static assets
- WebSocket support for real-time features

**Help Desk (/helpdesk/):**
- Routes to help-desk service on port 3001
- Can be deployed on separate domain if needed

### Security Headers

```
Strict-Transport-Security: Forces HTTPS
X-Frame-Options: Prevents clickjacking
X-Content-Type-Options: Prevents MIME-type sniffing
X-XSS-Protection: Enables XSS filter
Referrer-Policy: Controls referrer info
```

### SSL Configuration

```nginx
# TLS 1.2 and 1.3 only
ssl_protocols TLSv1.2 TLSv1.3;

# Strong cipher suites
ssl_ciphers HIGH:!aNULL:!MD5;

# Session caching
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

---

## Production Deployment

### Prerequisites

1. **Server setup:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Add user to docker group
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **Clone repository:**
   ```bash
   git clone https://github.com/your-org/HelpDesk-Management-System.git
   cd HelpDesk-Management-System
   ```

3. **Configure environment:**
   ```bash
   cp .env.production .env
   
   # Edit with your values
   vim .env
   
   # Generate secure secrets
   openssl rand -base64 32  # For JWT_SECRET
   openssl rand -base64 24  # For POSTGRES_PASSWORD
   ```

### Deployment Steps

1. **Generate SSL certificate:**
   ```bash
   ./generate-cert.sh helpdesk.example.com admin@example.com
   ```

2. **Start with Nginx:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.nginx.yml up -d
   ```

3. **Verify services:**
   ```bash
   docker compose ps
   docker compose logs nginx
   curl -k https://helpdesk.example.com/health
   ```

4. **Setup certificate renewal:**
   ```bash
   chmod +x renew-cert.sh
   crontab -e
   # Add: 0 2 * * * cd /path/to/project && ./renew-cert.sh
   ```

### Environment Variables

**Required for all deployments:**
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=HelpDeskDb
JWT_SECRET=<32+ chars>
JWT_ISSUER=HelpDeskApi
JWT_AUDIENCE=HelpDeskClient
ASPNETCORE_ENVIRONMENT=Production
NODE_ENV=production
```

**For Docker registry:**
```bash
REGISTRY=ghcr.io/your-org
TAG=latest
```

**Domain-specific:**
```bash
NEXT_PUBLIC_API_URL=https://helpdesk.example.com/api
```

### Docker Compose Override

Start with production config:
```bash
# Development
docker compose up

# Production with Nginx and SSL
docker compose -f docker-compose.yml -f docker-compose.nginx.yml up -d

# Staging
docker compose -f docker-compose.yml -f docker-compose.nginx.yml --env-file .env.staging up -d
```

---

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f nginx
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend

# With timestamps
docker compose logs -f --timestamps backend
```

### Health Checks

```bash
# Check container status
docker compose ps

# Test endpoints
curl -k https://helpdesk.example.com/health
curl -k https://helpdesk.example.com/api/swagger/index.html

# View health check history
docker inspect helpdesk-nginx --format='{{.State.Health}}'
```

### Backup Database

```bash
# Manual backup
docker exec helpdesk-postgres pg_dump -U postgres HelpDeskDb > backup.sql

# Scheduled backup (cron)
0 2 * * * docker exec helpdesk-postgres pg_dump -U postgres HelpDeskDb > /backups/db-$(date +\%Y\%m\%d).sql

# With compression
docker exec helpdesk-postgres pg_dump -U postgres HelpDeskDb | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
docker exec -i helpdesk-postgres psql -U postgres HelpDeskDb < backup.sql
```

### Update Services

```bash
# Pull latest images
docker compose pull

# Rebuild local images
docker compose build --no-cache

# Restart services
docker compose restart

# Full update
docker compose down
docker compose pull
docker compose up -d
```

### Monitor System Resources

```bash
# View container stats
docker stats

# View disk usage
docker system df

# Prune unused resources
docker system prune -a --volumes

# Check log sizes
du -sh $(docker inspect --format='{{.LogPath}}' $(docker ps -q))
```

### Nginx Management

```bash
# Test configuration
docker exec helpdesk-nginx nginx -t

# Reload without downtime
docker exec helpdesk-nginx nginx -s reload

# View access logs
docker exec helpdesk-nginx tail -f /var/log/nginx/access.log

# View error logs
docker exec helpdesk-nginx tail -f /var/log/nginx/error.log
```

### Certificate Management

```bash
# Check certificate expiry
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# Manual renewal
./renew-cert.sh

# Check renewal logs
tail -f /var/log/cert-renewal.log

# Reload nginx after renewal
docker exec helpdesk-nginx nginx -s reload
```

---

## Troubleshooting

### Common Issues

**1. Certificate not found:**
```bash
# Generate temporary certificate
./generate-cert.sh helpdesk.example.com admin@example.com
```

**2. Nginx won't start:**
```bash
# Test configuration
docker exec helpdesk-nginx nginx -t

# View detailed error
docker logs helpdesk-nginx
```

**3. Backend API unreachable:**
```bash
# Check backend health
docker compose logs backend | tail -20

# Verify network
docker network inspect helpdesk-network
```

**4. SSL handshake failed:**
```bash
# Check certificate dates
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# Renew certificate
./renew-cert.sh
```

### Debug Mode

```bash
# Verbose curl testing
curl -v -k https://helpdesk.example.com

# Show SSL details
openssl s_client -connect helpdesk.example.com:443

# DNS resolution
nslookup helpdesk.example.com

# Port connectivity
nc -zv helpdesk.example.com 443
```

---

## Performance Tuning

### Nginx Caching

Edit `nginx/nginx.conf` to add caching directives:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 1h;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### Database Performance

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

-- Analyze tables
ANALYZE;

-- Vacuum
VACUUM FULL;
```

### Container Resource Limits

Update `docker-compose.nginx.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## Backup and Disaster Recovery

### Full System Backup

```bash
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup database
docker exec helpdesk-postgres pg_dump -U postgres HelpDeskDb | gzip > $BACKUP_DIR/database.sql.gz

# Backup volumes
docker run --rm -v helpdesk-management-system_postgres_data:/data -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/volumes.tar.gz /data

# Backup configurations
tar -czf $BACKUP_DIR/configs.tar.gz .env nginx/ certbot/

echo "Backup completed at $BACKUP_DIR"
```

### Restore from Backup

```bash
BACKUP_DIR="./backups/YYYYMMDD"

# Restore database
zcat $BACKUP_DIR/database.sql.gz | docker exec -i helpdesk-postgres psql -U postgres HelpDeskDb

# Restore volumes
docker run --rm -v helpdesk-management-system_postgres_data:/data -v $BACKUP_DIR:/backup \
  alpine tar xzf /backup/volumes.tar.gz -C /data --strip-components=1

# Restore configs
tar -xzf $BACKUP_DIR/configs.tar.gz
```

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Production Guidelines](https://docs.docker.com/compose/production/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Best Practices](https://nginx.org/en/docs/)
- [PostgreSQL Administration](https://www.postgresql.org/docs/current/admin.html)
