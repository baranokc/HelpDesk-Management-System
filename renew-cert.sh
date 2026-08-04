#!/bin/bash
# Renew SSL certificate (run regularly via cron)
# Usage: ./renew-cert.sh

CERTBOT_DIR="./certbot"
NGINX_SSL_DIR="./nginx/ssl"

echo "Renewing SSL certificate..."

# Run certbot renewal
docker run -it --rm --name certbot \
  -v $CERTBOT_DIR/conf:/etc/letsencrypt \
  -v $CERTBOT_DIR/www:/var/www/certbot \
  certbot/certbot renew \
  --webroot -w /var/www/certbot

if [ $? -eq 0 ]; then
    echo "Certificate renewed successfully"
    
    # Copy new certificate to nginx
    DOMAIN=$(ls $CERTBOT_DIR/conf/live | head -n1)
    if [ -n "$DOMAIN" ]; then
        echo "Copying certificate for domain: $DOMAIN"
        sudo cp $CERTBOT_DIR/conf/live/$DOMAIN/fullchain.pem $NGINX_SSL_DIR/cert.pem
        sudo cp $CERTBOT_DIR/conf/live/$DOMAIN/privkey.pem $NGINX_SSL_DIR/key.pem
        sudo chown $USER:$USER $NGINX_SSL_DIR/*.pem
        
        # Reload nginx
        docker exec helpdesk-nginx nginx -s reload
        echo "Nginx reloaded with new certificate"
    fi
else
    echo "Certificate renewal failed"
    exit 1
fi
