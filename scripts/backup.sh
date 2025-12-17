#!/bin/bash
# Database and Media Backup Script

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ecommerce_db"
DB_USER="postgres"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
echo "Backing up database..."
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup media files
echo "Backing up media files..."
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz /app/media

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
