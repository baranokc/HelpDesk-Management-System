#!/bin/bash
# Database backup script for HelpDesk PostgreSQL database
# Usage: ./backup.sh or ./backup.sh [backup_dir]

BACKUP_DIR="${1:-.}"
CONTAINER_NAME="helpdesk-postgres"
DB_NAME="HelpDeskDb"
DB_USER="postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/helpdesk-db-backup-$TIMESTAMP.sql"

echo "Starting database backup..."

# Create backup
docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"
    ls -lh "$BACKUP_FILE"
else
    echo "Backup failed!"
    exit 1
fi
