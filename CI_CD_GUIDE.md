# CI/CD, SSL, and Production Deployment Guide

## Quick Reference

| Component | File | Purpose |
|-----------|------|---------|
| **CI/CD Workflows** | `.github/workflows/` | Automated testing, building, and deployment |
| **Nginx Config** | `nginx/nginx.conf` | Reverse proxy with SSL, security headers |
| **Production Compose** | `docker-compose.nginx.yml` | Production stack with Nginx and logging |
| **Cert Scripts** | `generate-cert.sh`, `renew-cert.sh` | SSL certificate management |
| **Environments** | `.env.staging`, `.env.production` | Environment-specific configs |

---

## 1. GitHub Actions CI/CD Pipeline

### Workflows Overview

#### Build and Push (`build-and-push.yml`)
- **When**: Push to main/develop, create version tag, PR
- **What**: Build Docker images, test, push to GHCR
- **Result**: Images available at `ghcr.io/your-org/helpdesk-*:latest`

#### Tests (`tests.yml`)
- **When**: Push to main/develop, PR
- **What**: Run .NET tests, Node linting, security scan
- **Result**: Failing tests block merges to main

#### Deploy (`deploy.yml`)
- **When**: Push version tag (v1.0.0), manual trigger
- **What**: Deploy to production server via SSH
- **Result**: Updated production environment

### Getting Started with CI/CD

1. **Enable GitHub Actions:**
   - GitHub Repo → Settings → Actions → Allow all actions

2. **Set up container registry:**
   ```bash
   # Create PAT token
   # GitHub → Settings → Developer settings → Personal access tokens
   # Scopes: write:packages, read:packages
   
   echo $GHCR_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```

3. **Add deployment secrets:**
   See [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)

4. **Trigger deployment:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

### Monitoring CI/CD

- **GitHub Actions tab**: View workflow runs, logs
- **GHCR packages**: View published images
- **Deployment logs**: SSH to server, check `docker compose logs`

---

## 2. SSL/TLS Certificate Management

### Certificate Setup

**Option A: Let's Encrypt (Recommended)**
```bash
./generate-cert.sh helpdesk.example.com admin@example.com
```

**Option B: Self-signed (Dev only)**
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

### Certificate Renewal

**Manual renewal:**
```bash
./renew-cert.sh
```

**Automatic renewal (cron):**
```bash
# Edit crontab
crontab -e

# Add this line (renew daily at 2 AM)
0 2 * * * cd /path/to/project && ./renew-cert.sh
```

### Certificate Verification

```bash
# Check expiry date
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# Check certificate details
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect helpdesk.example.com:443

# Verify with curl
curl -I https://helpdesk.example.com
```

---

## 3. Nginx Reverse Proxy

### Key Features

- **SSL/TLS termination**: Decrypts HTTPS, forwards HTTP
- **Load balancing**: Distributes requests
- **Caching**: Improves performance
- **Compression**: Reduces bandwidth
- **Security headers**: Protects users
- **Logging**: Tracks requests

### Configuration Sections

**Upstream backends:**
```nginx
upstream backend { server backend:8080; }
upstream frontend { server frontend:3000; }
upstream helpdesk { server help-desk:3001; }
```

**HTTP → HTTPS redirect:**
```nginx
server {
  listen 80;
  location / { return 301 https://$host$request_uri; }
}
```

**HTTPS server:**
```nginx
server {
  listen 443 ssl http2;
  ssl_certificate /etc/nginx/ssl/cert.pem;
  ssl_certificate_key /etc/nginx/ssl/key.pem;
}
```

**Proxying rules:**
- `/api/*` → backend:8080
- `/swagger/*` → backend:8080
- `/helpdesk/*` → help-desk:3001
- `/` → frontend:3000

### Customizing Nginx

Edit `nginx/nginx.conf`:
- Change upstream addresses
- Add authentication (Basic Auth)
- Add rate limiting
- Add custom headers
- Configure caching

Reload without downtime:
```bash
docker exec helpdesk-nginx nginx -s reload
```

---

## 4. Production Deployment

### Architecture

```
Internet
   ↓ :443 (HTTPS)
┌──────────────────────┐
│   Nginx (Reverse     │
│   Proxy + SSL)       │
└──────────────────────┘
   ↓ :8080 (HTTP)
┌──────────────────────┐
│   Backend (.NET)     │
└──────────────────────┘
   ↓ :5432 (TCP)
┌──────────────────────┐
│   PostgreSQL         │
└──────────────────────┘

Nginx also routes to:
- Frontend :3000 (for /)
- Help Desk :3001 (for /helpdesk/)
```

### Deployment Command

```bash
# With Nginx and SSL
docker compose -f docker-compose.yml -f docker-compose.nginx.yml up -d

# With staging environment
docker compose -f docker-compose.yml -f docker-compose.nginx.yml \
  --env-file .env.staging up -d

# With production environment
docker compose -f docker-compose.yml -f docker-compose.nginx.yml \
  --env-file .env.production up -d
```

### Environment Configuration

**Required variables:**
```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<secure>
POSTGRES_DB=HelpDeskDb

# JWT
JWT_SECRET=<secure, 32+ chars>
JWT_ISSUER=HelpDeskApi
JWT_AUDIENCE=HelpDeskClient

# URLs
NEXT_PUBLIC_API_URL=https://helpdesk.example.com/api

# Environment
ASPNETCORE_ENVIRONMENT=Production
NODE_ENV=production
```

See `.env.example`, `.env.staging`, `.env.production`

### First-Time Deployment

1. **Prepare server:**
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker $USER
   ```

2. **Clone repository:**
   ```bash
   git clone <repo> helpdesk
   cd helpdesk
   ```

3. **Configure environment:**
   ```bash
   cp .env.production .env
   # Edit .env with production values
   ```

4. **Generate certificate:**
   ```bash
   ./generate-cert.sh helpdesk.example.com admin@example.com
   ```

5. **Start services:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.nginx.yml up -d
   ```

6. **Verify:**
   ```bash
   docker compose ps
   curl -k https://helpdesk.example.com/health
   ```

---

## 5. Operations & Maintenance

### Daily Tasks

**View logs:**
```bash
docker compose logs -f --tail=100
```

**Check health:**
```bash
docker compose ps
curl -k https://helpdesk.example.com/health
```

**Monitor resources:**
```bash
docker stats
```

### Weekly Tasks

**Verify backups:**
```bash
ls -lh backups/
```

**Check certificate expiry:**
```bash
openssl x509 -in nginx/ssl/cert.pem -noout -days
```

**Review error logs:**
```bash
docker compose logs --since 7d | grep ERROR
```

### Monthly Tasks

**Update images:**
```bash
docker compose pull
docker compose up -d
```

**Run security scan:**
```bash
trivy image ghcr.io/your-org/helpdesk-backend:latest
```

**Database maintenance:**
```bash
docker exec helpdesk-postgres vacuumdb -U postgres -d HelpDeskDb
```

### Emergency Recovery

**Database restore:**
```bash
docker exec -i helpdesk-postgres psql -U postgres < backup.sql
```

**Full rollback:**
```bash
git checkout v0.9.0
docker compose pull
docker compose -f docker-compose.yml -f docker-compose.nginx.yml up -d
```

**View detailed logs:**
```bash
docker compose logs backend --follow
docker logs -f helpdesk-nginx
```

---

## 6. Performance Optimization

### Nginx Caching

Add to `nginx/nginx.conf`:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:10m;

location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    proxy_cache static_cache;
    proxy_cache_valid 200 7d;
}
```

### Database Performance

```bash
# Connect to database
docker exec -it helpdesk-postgres psql -U postgres -d HelpDeskDb

# Show slow queries
SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# Vacuum and analyze
VACUUM ANALYZE;
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
```

---

## 7. Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT secret (32+ chars)
- [ ] SSL certificate valid and current
- [ ] Nginx security headers enabled
- [ ] Database backups encrypted
- [ ] SSH keys configured (no passwords)
- [ ] Firewall allows only necessary ports
- [ ] Regular security updates applied
- [ ] Logs monitored for suspicious activity
- [ ] Secrets not committed to git

---

## 8. Troubleshooting

See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for detailed troubleshooting.

**Quick fixes:**

```bash
# Services won't start
docker compose logs

# Certificate error
./generate-cert.sh domain.com admin@domain.com

# Nginx not forwarding
docker exec helpdesk-nginx nginx -t

# Database connection error
docker compose logs backend | grep -i postgres

# High memory usage
docker stats
docker compose down -v && docker compose up -d
```

---

## 9. Documentation Index

| Document | Purpose |
|----------|---------|
| [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) | Complete deployment guide |
| [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) | CI/CD secrets and setup |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Pre/post deployment checklist |
| [DOCKER_README.md](DOCKER_README.md) | Docker and Compose basics |
| [.github/workflows/](../github/workflows) | GitHub Actions workflow files |
| [nginx/nginx.conf](../nginx/nginx.conf) | Nginx configuration |

---

## Key Files

```
.
├── .github/workflows/              # CI/CD workflows
│   ├── build-and-push.yml         # Build Docker images
│   ├── tests.yml                  # Run tests
│   └── deploy.yml                 # Deploy to production
├── nginx/
│   ├── nginx.conf                 # Reverse proxy config
│   └── ssl/                       # SSL certificates (generated)
├── docker-compose.yml             # Development stack
├── docker-compose.nginx.yml       # Production with Nginx
├── .env.example                   # Template for environment
├── .env.staging                   # Staging environment
├── .env.production                # Production environment
├── generate-cert.sh               # Generate SSL certificate
├── renew-cert.sh                  # Renew SSL certificate
└── Documentation files
    ├── PRODUCTION_DEPLOYMENT.md   # Full deployment guide
    ├── GITHUB_ACTIONS_SETUP.md    # CI/CD setup
    └── DEPLOYMENT_CHECKLIST.md    # Pre/post checklist
```

---

## Next Steps

1. **Set up GitHub Actions:**
   - Follow [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)
   - Add deployment secrets to GitHub

2. **Configure SSL:**
   - Run `./generate-cert.sh domain.com admin@domain.com`
   - Set up certificate renewal cron job

3. **Deploy to production:**
   - Follow [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
   - Use [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

4. **Set up monitoring:**
   - Configure log aggregation
   - Set up alerts for errors
   - Monitor resource usage

---

## Support

- **GitHub Issues**: Report bugs
- **Discussions**: Ask questions
- **Pull Requests**: Contribute improvements
- **Documentation**: Check docs for answers
