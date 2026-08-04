# HelpDesk Management System - Docker Setup

## Quick Start

### Prerequisites
- Docker Desktop or Docker Engine
- Docker Compose

### Initial Setup

1. **Clone the repository and navigate to the project:**
   ```bash
   cd HelpDesk-Management-System
   ```

2. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Start the stack:**
   ```bash
   docker compose up --pull always
   ```

4. **Access the services:**
   - Backend API: http://localhost:8080
   - Backend Swagger UI: http://localhost:8080/swagger
   - Frontend: http://localhost:3000
   - Help Desk App: http://localhost:3001
   - PostgreSQL: localhost:5432

## Environment Configuration

Edit `.env` file to customize:
- Database credentials (`POSTGRES_*`)
- JWT settings (`JWT_*`)
- API URL (`NEXT_PUBLIC_API_URL`)
- ASP.NET environment (`ASPNETCORE_ENVIRONMENT`)

**For production, update sensitive values:**
- Generate a new `JWT_SECRET`
- Use a strong `POSTGRES_PASSWORD`
- Set `NEXT_PUBLIC_API_URL` to your domain

## Database Management

### Backup Database
```bash
./backup.sh                    # Create backup in current directory
./backup.sh ./backups          # Create backup in ./backups directory
```

### Restore Database
```bash
./restore.sh ./backups/helpdesk-db-backup-20260729_100000.sql
```

## Docker Operations

### View Logs
```bash
docker compose logs                # All services
docker compose logs backend        # Specific service
docker compose logs -f backend     # Follow logs
```

### Stop Services
```bash
docker compose down               # Stop all services
docker compose down -v            # Stop and remove volumes
```

### Rebuild Images
```bash
docker compose build              # Rebuild all images
docker compose build --no-cache   # Force rebuild from scratch
docker compose up --build         # Rebuild and start
```

### Check Service Status
```bash
docker compose ps                 # List all containers
docker compose logs --tail=50     # Last 50 lines of logs
```

## Production Deployment

### Using production compose file
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

### Push Images to Registry

**Docker Hub:**
```bash
./push-registry.sh docker.io/your-username
```

**GitHub Container Registry:**
```bash
./push-registry.sh ghcr.io/your-org/helpdesk
```

**Private Registry:**
```bash
./push-registry.sh registry.example.com:5000
```

### Pull from Registry
```bash
docker pull docker.io/your-username/helpdesk-backend:latest
docker pull docker.io/your-username/helpdesk-frontend:latest
docker pull docker.io/your-username/helpdesk-app:latest
```

## Architecture

- **Backend**: .NET 10 Web API with PostgreSQL
- **Frontend**: Next.js (React 19) with TypeScript
- **Help Desk App**: Next.js standalone app
- **Database**: PostgreSQL 16-Alpine with persistent volumes
- **Network**: Custom Docker bridge network

## Services

| Service | Port | Health Check |
|---------|------|--------------|
| PostgreSQL | 5432 | pg_isready |
| Backend API | 8080 | dotnet --version |
| Backend HTTPS | 8443 | - |
| Frontend | 3000 | HTTP GET / |
| Help Desk | 3001 | HTTP GET / |

## Troubleshooting

### Container fails to start
```bash
docker compose logs [service_name]
docker compose restart [service_name]
```

### Database connection issues
```bash
docker compose exec postgres psql -U postgres -d HelpDeskDb
```

### Clear all data
```bash
docker compose down -v
docker system prune -a
```

### Memory issues
Increase Docker's memory limit in Docker Desktop settings.

## Security Notes

- **Never commit `.env` file** — it contains sensitive credentials
- Use `.env.example` as a template
- For production: Generate secure JWT secrets and DB passwords
- Update `NEXT_PUBLIC_API_URL` to your production domain
- Configure CORS in backend for production URLs
- Use HTTPS in production deployments

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [.NET 10 Documentation](https://learn.microsoft.com/dotnet/)
- [Next.js Documentation](https://nextjs.org/docs)
