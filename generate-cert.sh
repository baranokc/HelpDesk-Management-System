#!/bin/bash
# Generate SSL certificate using Let's Encrypt with Certbot
# Usage: ./generate-cert.sh domain.com admin@domain.com
# Example: ./generate-cert.sh helpdesk.example.com admin@example.com

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <domain> <email>"
    echo "Example: $0 helpdesk.example.com admin@example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=$2
CERT_DIR="./nginx/ssl"
CERTBOT_DIR="./certbot"

echo "Generating SSL certificate for domain: $DOMAIN"
echo "Email: $EMAIL"

# Create directories
mkdir -p $CERT_DIR
mkdir -p $CERTBOT_DIR/conf
mkdir -p $CERTBOT_DIR/www

# Generate self-signed certificate for initial setup
echo "Generating temporary self-signed certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout $CERT_DIR/key.pem \
    -out $CERT_DIR/cert.pem \
    -subj "/CN=$DOMAIN"

echo "Temporary certificate created at:"
echo "  Key: $CERT_DIR/key.pem"
echo "  Cert: $CERT_DIR/cert.pem"

echo ""
echo "After starting the server, run this command to generate a Let's Encrypt certificate:"
echo ""
echo "docker run -it --rm --name certbot \\"
echo "  -v $CERTBOT_DIR/conf:/etc/letsencrypt \\"
echo "  -v $CERTBOT_DIR/www:/var/www/certbot \\"
echo "  certbot/certbot certonly --webroot \\"
echo "  -w /var/www/certbot \\"
echo "  -d $DOMAIN \\"
echo "  --email $EMAIL \\"
echo "  --agree-tos \\"
echo "  --no-eff-email"
echo ""
echo "Then copy the certificate to nginx/ssl/:"
echo "  sudo cp $CERTBOT_DIR/conf/live/$DOMAIN/fullchain.pem $CERT_DIR/cert.pem"
echo "  sudo cp $CERTBOT_DIR/conf/live/$DOMAIN/privkey.pem $CERT_DIR/key.pem"
echo "  sudo chown $USER:$USER $CERT_DIR/*.pem"
