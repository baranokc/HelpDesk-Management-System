# Production Deployment Checklist

## Pre-Deployment (1-2 weeks before)

- [ ] Review all code changes
- [ ] Run tests locally: `docker compose up`
- [ ] Test all API endpoints
- [ ] Test frontend UI
- [ ] Check database migrations
- [ ] Update CHANGELOG.md
- [ ] Create release notes
- [ ] Notify team of deployment date/time

## Infrastructure Setup (Once)

- [ ] Provision production server (VPS/Cloud)
- [ ] Install Docker and Docker Compose
- [ ] Configure firewall (allow ports 80, 443)
- [ ] Set up SSH access
- [ ] Configure domain DNS
- [ ] Generate SSH keys for deployment
- [ ] Set up monitoring/logging
- [ ] Configure backups

## Pre-Deployment Day (Night before)

- [ ] Take full database backup
- [ ] Test backup restoration
- [ ] Verify all secrets are secure
- [ ] Create git tag: `git tag -a v1.0.0 -m "Release 1.0.0"`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] Schedule maintenance window
- [ ] Notify users of maintenance

## Deployment Day

### Morning (Preparation)

- [ ] Review deployment procedure
- [ ] Have rollback plan ready
- [ ] Verify GitHub Actions workflow passes
- [ ] Verify all images built successfully
- [ ] Check server connectivity
- [ ] Monitor server resources

### Pre-Deployment (30 min before)

- [ ] Post maintenance notice to users
- [ ] Take final backup
- [ ] Stop accepting new requests (optional)
- [ ] Verify backup completion
- [ ] Prepare rollback commands

### Deployment (Start)

```bash
# SSH into server
ssh deploy@your.server.com

# Navigate to deployment directory
cd /home/deploy/helpdesk

# Pull latest code
git fetch origin
git checkout v1.0.0

# Update environment file if needed
# nano .env

# Pull latest Docker images
docker compose pull

# Stop running services
docker compose down

# Start with Nginx and SSL
docker compose -f docker-compose.yml -f docker-compose.nginx.yml up -d

# Wait for services to be healthy
sleep 30
docker compose ps

# Verify deployment
curl -k https://helpdesk.example.com/health
curl -k https://helpdesk.example.com/api/swagger
```

### Post-Deployment Verification

- [ ] All containers running: `docker compose ps`
- [ ] Database migrations completed: Check backend logs
- [ ] API responding: `curl https://helpdesk.example.com/api/swagger`
- [ ] Frontend loads: Open in browser
- [ ] Help Desk app loads: Open in browser
- [ ] Test user login
- [ ] Test core functionality
- [ ] Check error logs: `docker compose logs --tail=50`
- [ ] Verify SSL certificate valid
- [ ] Performance acceptable: `docker stats`

### Deployment Completion

- [ ] Remove maintenance notice
- [ ] Notify users deployment complete
- [ ] Document any issues
- [ ] Monitor for errors in logs
- [ ] Keep team on standby for 1 hour

## Post-Deployment (After 24 hours)

- [ ] Monitor application for errors
- [ ] Review logs for warnings
- [ ] Verify database integrity
- [ ] Check certificate renewal status
- [ ] Verify backups running
- [ ] Performance benchmarks normal
- [ ] All features working correctly

## If Something Goes Wrong

### Immediate Actions

1. **Stop new traffic** (if severe)
   ```bash
   docker compose down
   ```

2. **Check what went wrong**
   ```bash
   docker compose logs backend
   docker compose logs nginx
   docker compose ps
   ```

3. **Verify database is intact**
   ```bash
   docker exec helpdesk-postgres psql -U postgres -c "SELECT count(*) FROM pg_tables;"
   ```

### Rollback Procedure

```bash
# Go back to previous version
git checkout v0.9.0
docker compose pull
docker compose -f docker-compose.yml -f docker-compose.nginx.yml up -d

# If database schema changed, restore backup
docker exec -i helpdesk-postgres psql -U postgres < backup-previous.sql
```

### Escalation

- [ ] Document the issue
- [ ] Notify team leads
- [ ] Contact affected users
- [ ] Check if external service dependency issue
- [ ] Review metrics/logs

## Post-Deployment Checklist

### Day 1 After Deployment

- [ ] No critical errors in logs
- [ ] All API endpoints responding
- [ ] Database performing well
- [ ] Users report no major issues
- [ ] Performance metrics stable

### Day 7 After Deployment

- [ ] No recurring issues
- [ ] Error rates normal
- [ ] Database growth normal
- [ ] Backup completion confirmed
- [ ] SSL certificate dates valid

### Month 1 After Deployment

- [ ] Zero production incidents
- [ ] Performance metrics trending well
- [ ] User feedback positive
- [ ] Documentation updated
- [ ] Lessons learned documented

## Emergency Contacts

- **On-Call Engineer:** _______________
- **Team Lead:** _______________
- **DevOps Lead:** _______________
- **Slack Channel:** #helpdesk-deployment
- **Status Page:** status.example.com

## Deployment Timeline Example

```
T-24 hours: Team notification
T-2 hours: Maintenance window start, final backup
T-0 hours: Begin deployment
T+15 min: Docker images pulled, services starting
T+30 min: Verify all services healthy
T+45 min: Run smoke tests
T+60 min: Enable traffic, monitor
T+2 hours: Confirm stable, remove maintenance notice
```

## Success Criteria

✓ All services running and healthy
✓ API responding to requests
✓ Frontend and Help Desk loading
✓ No spike in error rates
✓ Response times within acceptable range
✓ Database performing well
✓ Users report no issues
✓ SSL certificate valid and auto-renewal working

## Notes

Use this section to document deployment notes:

```
Date: _______________
Version: v_______________
Deployed by: _______________
Issues encountered: _______________
Resolution: _______________
Rollback needed: Yes / No
Lessons learned: _______________
```

---

**Last Updated:** [Date]
**Next Review Date:** [Date]
