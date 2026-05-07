# Backup & restore runbook

> Operational guide for backing up and restoring an Einaya install. Assumes
> stancl/tenancy multi-database — one central DB plus N tenant DBs (one per
> clinic). Last reviewed 2026-05-07.

## What you must back up

Two layers:

1. **Central DB** — `einaya_central` by default. Owns the clinic registry,
   plans, subscriptions, super-admin users, and the central audit log. Without
   this you cannot route requests to any tenant.
2. **Tenant DBs** — one per active clinic, named `einaya_tenant_<slug>` (the
   slug stored on the `tenants` row). Each holds patients, appointments,
   consultations, prescriptions, payments, audit log, etc.
3. **Tenant file uploads** — `storage/tenant_<id>/app/public/`. Patient files,
   logos, signature blobs, prescription PDFs in v2.

Always back up all three at the same logical point in time. A central DB
that knows about a clinic whose tenant DB has been lost is a worse failure
mode than losing both.

## Identifying tenant DBs

```sh
mysql -u root -p -e "SELECT id, data->>'$.tenancy_db_name' AS db FROM einaya_central.tenants;"
```

Or, from inside the app:

```sh
php artisan tinker --execute="App\\Models\\Central\\Clinic::pluck('id')->each(fn(\$id) => print(\$id.PHP_EOL));"
```

## Logical backup (mysqldump)

The default for any install. Restore granularity is per-row. Slow on
clinics with > 5 GB of data.

```sh
#!/usr/bin/env bash
set -euo pipefail
TS=$(date +%Y%m%d-%H%M%S)
OUT="/var/backups/einaya/$TS"
mkdir -p "$OUT"

# 1. Central
mysqldump --routines --triggers --single-transaction --quick \
  -u root -p"$MYSQL_ROOT_PWD" einaya_central \
  | gzip > "$OUT/central.sql.gz"

# 2. Per-tenant (read tenant_db column from the central DB)
for db in $(mysql -u root -p"$MYSQL_ROOT_PWD" -N -B -e \
  "SELECT data->>'\$.tenancy_db_name' FROM einaya_central.tenants WHERE deleted_at IS NULL"); do
    mysqldump --routines --triggers --single-transaction --quick \
      -u root -p"$MYSQL_ROOT_PWD" "$db" \
      | gzip > "$OUT/$db.sql.gz"
done

# 3. Tenant uploads (rsync with hardlinks for cheap incremental snapshots)
rsync -a --link-dest=/var/backups/einaya/latest /var/www/einaya/storage/ \
  "$OUT/storage/"

ln -snf "$OUT" /var/backups/einaya/latest
```

Run hourly via cron; ship to S3/Backblaze nightly with `aws s3 sync` or
`rclone copy`. Keep 14 days hot, 90 days cold, 1 year glacier.

## Restore

```sh
# Central
zcat /var/backups/einaya/<TS>/central.sql.gz | mysql -u root -p einaya_central

# A single tenant (e.g. the demo clinic)
zcat /var/backups/einaya/<TS>/einaya_tenant_demo.sql.gz | mysql -u root -p einaya_tenant_demo

# All tenants
for f in /var/backups/einaya/<TS>/einaya_tenant_*.sql.gz; do
  db=$(basename "$f" .sql.gz)
  mysql -u root -p -e "DROP DATABASE IF EXISTS \`$db\`; CREATE DATABASE \`$db\`;"
  zcat "$f" | mysql -u root -p "$db"
done

# Storage
rsync -a /var/backups/einaya/<TS>/storage/ /var/www/einaya/storage/
```

After restore: `php artisan optimize:clear` and bounce php-fpm so cached
config and tenant connections drop.

## Verification

A backup that nobody has restored is not a backup. Schedule a quarterly
fire-drill:

1. Spin up a throwaway VM.
2. Pipe last night's backup into a fresh MySQL.
3. Run `php artisan migrate:status` against central + a sample tenant.
4. Log in as super admin on the restored install; confirm the clinic
   list, one patient, and one consultation render.

## What this runbook does NOT cover

- **Encrypted archives.** Pipe through `gpg --symmetric` if you need
  encryption-at-rest beyond your backup target's default.
- **Point-in-time recovery via binlogs.** Out of scope for v1. If you
  need this, switch to `xtrabackup` and turn on `binlog_format=ROW` in
  MySQL.
- **Cross-region failover.** Out of scope for v1.
- **Patient consent / data-deletion requests.** That's a GDPR / process
  problem, not a backup one. Track separately in the legal runbook.
