# GitHub Actions Secrets Setup

## Overview
This guide explains how to set up secrets for GitHub Actions workflows.

## Required Secrets

### For Build and Push Workflow
No additional secrets needed - uses built-in `GITHUB_TOKEN`

### For Deployment Workflow

1. **DEPLOY_HOST**
   - Value: Your production server IP or hostname
   - Example: `192.168.1.100` or `deploy.example.com`

2. **DEPLOY_USER**
   - Value: SSH username for deployment server
   - Example: `deploy` or `ubuntu`

3. **DEPLOY_KEY**
   - Value: SSH private key for authentication
   - Generate: `ssh-keygen -t ed25519 -f deploy_key -N ""`
   - Use: Contents of `deploy_key` (private key file)

4. **DEPLOY_PATH**
   - Value: Directory path where code will be deployed
   - Example: `/home/deploy/helpdesk` or `/opt/helpdesk`

5. **SLACK_WEBHOOK** (Optional)
   - Value: Slack webhook URL for deployment notifications
   - Generate: Slack App → Incoming Webhooks → Create New Webhook

## Setup Instructions

### Step 1: Generate SSH Key
```bash
# Generate new SSH key pair
ssh-keygen -t ed25519 -f deploy_key -N ""

# This creates:
# - deploy_key (private key - keep secret!)
# - deploy_key.pub (public key - share with server)

# Display private key content for GitHub
cat deploy_key
```

### Step 2: Configure Server
```bash
# On your production server as the deploy user
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add public key to authorized_keys
cat deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Verify SSH works from your machine
ssh -i deploy_key deploy@your.server.com
```

### Step 3: Add Secrets to GitHub

1. Go to GitHub Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret:

```
Name: DEPLOY_HOST
Value: your.server.com
```

```
Name: DEPLOY_USER
Value: deploy
```

```
Name: DEPLOY_KEY
Value: (contents of deploy_key file)
```

```
Name: DEPLOY_PATH
Value: /home/deploy/helpdesk
```

Optional:
```
Name: SLACK_WEBHOOK
Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Testing the Setup

### Test SSH Connection
```bash
# Manually test SSH connection
ssh -i deploy_key deploy@your.server.com "echo 'SSH works!'"

# If this works, GitHub Actions will too
```

### Trigger Deploy Workflow
1. Create a version tag: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. Go to GitHub Actions and watch the deployment
4. Check server for updated code

### Verify Deployment
```bash
ssh deploy@your.server.com
cd /path/to/deploy/location
docker compose ps
```

## Troubleshooting

### "Permission denied (publickey)"
- Verify public key is in `~/.ssh/authorized_keys`
- Check permissions: `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`
- Test with: `ssh -i deploy_key -vvv deploy@server`

### "Command not found: docker"
- Install Docker on server
- Add deploy user to docker group: `sudo usermod -aG docker deploy`

### GitHub Actions can't find secrets
- Verify secrets are set in repository settings
- Check secret names match exactly in workflow files
- Redeploy workflow after adding secrets

## Security Best Practices

✓ **DO:**
- Use SSH keys instead of passwords
- Regenerate keys if compromised
- Use separate keys for each environment
- Store private keys securely
- Rotate secrets regularly
- Use fine-grained access tokens for GHCR

✗ **DON'T:**
- Commit private keys to repository
- Share secrets via email or chat
- Use same credentials for multiple environments
- Store secrets in `.env` files in repo
- Use weak or default passwords

## Advanced: Environment-Specific Secrets

For staging and production:

### Staging Secrets
```
DEPLOY_HOST_STAGING
DEPLOY_USER_STAGING
DEPLOY_KEY_STAGING
DEPLOY_PATH_STAGING
```

### Production Secrets
```
DEPLOY_HOST_PROD
DEPLOY_USER_PROD
DEPLOY_KEY_PROD
DEPLOY_PATH_PROD
```

Then use in workflow:
```yaml
- uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets[format('DEPLOY_HOST_{0}', env.ENVIRONMENT)] }}
    username: ${{ secrets[format('DEPLOY_USER_{0}', env.ENVIRONMENT)] }}
    key: ${{ secrets[format('DEPLOY_KEY_{0}', env.ENVIRONMENT)] }}
```

## References

- [GitHub Actions: Using secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [SSH Key Generation](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- [appleboy/ssh-action Documentation](https://github.com/appleboy/ssh-action)
