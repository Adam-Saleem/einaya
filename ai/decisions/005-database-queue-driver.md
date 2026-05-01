# ADR-005 — Database Queue Driver in v1

**Status:** Accepted
**Date:** 2026-05-01

## Context

Laravel queues need a driver. Options range from sync (no queue) to fully managed (SQS, Redis + Horizon).

In v1, what's the right choice for Einaya?

## Options considered

### Option A: sync (no queue)

Jobs run inline.

**Why we rejected:** stancl/tenancy provisions tenant DBs in a job pipeline. Sync would block the request thread for 10-30 seconds during clinic creation. Unacceptable UX.

### Option B: database driver

Jobs stored in a `jobs` table. Worker process polls the table.

**Pros:**
- No additional infrastructure (no Redis to install)
- Works on shared hosting and basic VPS
- Easy to inspect (`SELECT * FROM jobs`)
- stancl/tenancy `QueueTenancyBootstrapper` works fine with it
- Failed jobs visible in `failed_jobs` table

**Cons:**
- Slower than Redis (~10x for high throughput)
- Polling generates DB load (mitigated by `--sleep` flag)
- No first-class Horizon UI

### Option C: Redis + Horizon

Jobs in Redis. Horizon provides a beautiful dashboard, auto-scaling workers, metrics.

**Pros:**
- Fast
- Great observability
- Industry standard for serious Laravel apps

**Cons:**
- Requires Redis infrastructure
- One more service to monitor and back up
- Adds setup complexity for solo deployer
- Overkill for v1 throughput (a few hundred jobs/day at most)

### Option D: SQS or other managed queue

**Why we rejected:** Cloud lock-in early in product life. Adds complexity without v1 benefit.

## Decision

**We chose Option B: database queue driver.**

### Configuration

```php
// config/queue.php
'default' => env('QUEUE_CONNECTION', 'database'),

// .env
QUEUE_CONNECTION=database
```

A `queue:work` worker runs as a long-lived process (managed by Supervisor or systemd).

### Use cases for jobs in v1

- Tenant DB provisioning (auto-create database, run migrations, seed)
- Cross-tenant stats aggregation (super admin dashboard, hourly schedule)
- File processing (e.g. profile photo resize) — minor

That's it. No high-throughput email, no SMS in v1.

## Consequences

**Positive:**
- One less service to install and maintain
- Easier deployment for solo operator
- DB-based queue makes debugging simpler (just query the table)
- Sufficient performance for v1 workload

**Tradeoffs we accept:**
- DB-as-queue scales to hundreds of jobs/minute, not thousands. We're well below that.
- No Horizon dashboard. We compensate with a simple admin page in v2 if needed.
- Failed jobs visible only in the DB or via `php artisan queue:failed`

### When to switch to Redis + Horizon

- Tenant count > 100 and stats aggregation jobs become bottlenecks
- Email/SMS volumes (when those features land in v2/v3) push throughput past database driver capacity
- You want operational dashboards

The migration is straightforward: install Redis, change `QUEUE_CONNECTION`, install Horizon. **Job classes themselves don't change.** That's the whole point of Laravel's queue abstraction — drivers are interchangeable.

### Worker management

In production, run via Supervisor:

```ini
[program:einaya-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/einaya/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
numprocs=2
```

In local dev, `composer dev` (Laravel Pulse-style script) runs it concurrently with `serve` and `vite`.
