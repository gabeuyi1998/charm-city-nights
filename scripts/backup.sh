#!/bin/bash
# Nightly database backup to S3 — run via cron: 0 3 * * * /app/charm-city-nights/scripts/backup.sh
set -e

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_BUCKET:=ccn-backups-prod}"

DATE=$(date +%Y%m%d)
FILE="/tmp/ccn_backup_${DATE}.sql.gz"

pg_dump "$DATABASE_URL" | gzip > "$FILE"
aws s3 cp "$FILE" "s3://${BACKUP_BUCKET}/daily/"
rm -f "$FILE"

echo "Backup for $DATE uploaded to s3://${BACKUP_BUCKET}/daily/"
