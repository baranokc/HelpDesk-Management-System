#!/bin/bash
# Database restore script for HelpDesk PostgreSQL database
# Usage: ./restore.sh [backup_file]

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="helpdesk-postgres"
DB_NAME="HelpDeskDb"
DB_USER="postgres"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Starting database restore from: $BACKUP_FILE"
echo "WARNING: This will overwrite the current database!"
read -p "Continue? (yes/no): " -r
echo

if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    # Drop and recreate database
    docker exec -u postgres $CONTAINER_NAME psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
    docker exec -u postgres $CONTAINER_NAME psql -c "CREATE DATABASE $DB_NAME;"
    
    # Restore from backup
    cat "$BACKUP_FILE" | docker exec -i $CONTAINER_NAME psql -U $DB_USER $DB_NAME
    
    if [ $? -eq 0 ]; then
        echo "Restore completed successfully!"
    else
        echo "Restore failed!"
        exit 1
    fi
else
    echo "Restore cancelled."
    exit 1
fi
