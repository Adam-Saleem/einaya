# ADR-001 — Multi-Database Tenancy

**Status:** Accepted
**Date:** 2026-05-01

## Context

Einaya is a multi-tenant SaaS where each clinic stores patient medical records, prescriptions, files, and audit logs. We need to choose a tenant data isolation model.

The three common options:

1. **Single DB, tenant_id column** — every row carries a `tenant_id`. Application-level scoping enforces isolation.
2. **Single DB, schema-per-tenant** — PostgreSQL-style separate schemas. Not idiomatic for MySQL.
3. **Multi-database** — each tenant has its own database.

## Options considered

### Option 1: Single DB with tenant_id

**Pros:**
- Simplest to implement initially
- One DB to back up, monitor, migrate
- Cross-tenant queries are easy (super admin reports)

**Cons:**
- A bug in scoping = catastrophic medical data leak
- A single bad query can lock tables for all clinics
- Backups can't be per-tenant
- Compliance reviews (any local equivalent of HIPAA/GDPR) harder to argue
- Restoring one clinic's data without affecting others is non-trivial

### Option 2: Schema-per-tenant

**Pros:**
- Strong logical isolation
- Per-schema permissions

**Cons:**
- MySQL doesn't really have schemas distinct from databases
- Tooling support weaker than multi-database
- stancl/tenancy doesn't natively support this for MySQL

### Option 3: Multi-database

**Pros:**
- **Strong isolation** — a query in clinic A's connection physically cannot see clinic B's data
- **Per-tenant backups** are trivial (`mysqldump einaya_tenant_X`)
- **Per-tenant restoration** doesn't risk other tenants
- **Clear compliance story** — "your clinic's data is in its own database"
- **Performance isolation** — one heavy clinic doesn't slow others
- stancl/tenancy v3 has first-class support
- Per-tenant cache, queue, filesystem isolation come "free" via bootstrappers

**Cons:**
- More databases to manage (one per clinic)
- Cross-tenant aggregation requires loops (slower for super admin reports)
- Schema migrations must run per-tenant
- Connection pool size grows with tenants

## Decision

**We chose Option 3: Multi-database tenancy via stancl/tenancy v3.**

The decisive factor was **medical data isolation as a non-negotiable**. With patient records, the cost of a tenancy scoping bug isn't an inconvenience — it's a serious privacy breach. We want the database engine itself to enforce the boundary, not application code.

Specific implementation:
- Central DB: `einaya_central`
- Tenant DBs: `einaya_tenant_{uuid}`
- Auto-provisioning via stancl lifecycle hooks
- Tenant migrations in `database/migrations/tenant/`
- Bootstrappers enabled: Database, Cache, Filesystem, Queue

## Consequences

**Positive:**
- Catastrophic data leak between tenants is essentially impossible (would require explicit cross-connection queries, which we forbid)
- Per-tenant backups, restores, deletions are clean
- Performance issues stay tenant-scoped
- Clear story for clinics asking "where is my data?"

**Tradeoffs we accept:**
- Super admin reports that aggregate across tenants need scheduled jobs that loop tenant DBs and cache results (we plan this in Phase 7)
- Schema changes require running migrations per tenant (`php artisan tenants:migrate`) — operationally we automate via deploy scripts
- Connection pooling must scale with tenant count — at hundreds of tenants we'll revisit (likely with proxysql or pooled PHP-FPM workers)

**Future revision triggers:**
- If we hit thousands of tenants and connection management becomes painful, we can shard tenants across multiple MySQL servers (stancl supports this)
- We do NOT plan to revert to single-DB tenancy — once medical data is isolated, going back would be a privacy regression
