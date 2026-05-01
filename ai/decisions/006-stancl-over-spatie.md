# ADR-006 — stancl/tenancy over spatie/laravel-multitenancy

**Status:** Accepted
**Date:** 2026-05-01

## Context

Two well-maintained Laravel multi-tenancy packages exist:
- `stancl/tenancy` v3
- `spatie/laravel-multitenancy`

Both are mature and production-tested. Both support multi-database mode. Choosing the wrong one means significant rework later.

## Comparison

### stancl/tenancy

- **Philosophy:** opinionated, full-featured, "batteries included"
- **Subdomain identification:** built-in middleware
- **Auto-provisioning:** built-in lifecycle hooks (`TenantCreated` → create DB → run migrations → seed)
- **Bootstrappers:** built-in for Database, Cache, Filesystem, Queue
- **Tenant-aware artisan:** `php artisan tenants:migrate`, `tenants:seed`, etc.
- **Documentation:** comprehensive, with extensive examples
- **Community:** very active, lots of SaaS examples online

### spatie/laravel-multitenancy

- **Philosophy:** unopinionated, "build your own"
- **Tenant identification:** you write a `TenantFinder`
- **Auto-provisioning:** you write the task pipeline
- **Switching tasks:** you write the connection switching, cache switching, etc.
- **Documentation:** clean but slim
- **Community:** smaller (despite the Spatie name)

## Options considered

### Option A: spatie/laravel-multitenancy

**Pros:**
- Spatie's reputation for quality
- Less magic, more explicit code
- Easier to understand exactly what's happening
- Familiar if you've used other Spatie packages

**Cons:**
- "Less magic" means **you write the magic yourself**
- For a solo/small-team build, every task pipeline is a day of dev + a week of edge case bugs
- Subdomain identification requires custom `TenantFinder`
- Per-tenant cache, queue, filesystem isolation requires custom code
- Less first-class help with auto-provisioning a fresh DB on signup

### Option B: stancl/tenancy

**Pros:**
- All the "you write it" items above are already implemented and tested
- Subdomain → tenant resolution is one middleware
- Creating a tenant auto-creates the DB, runs migrations — out of the box
- Cache, queue, filesystem isolation just by enabling bootstrappers
- More online examples for SaaS patterns we'll hit (signup flow, plan changes, deletion)
- Faster time-to-shipping

**Cons:**
- More opinionated (less escape hatch if their abstractions don't fit your edge case)
- "Magic" can be opaque when debugging (mitigated by good docs)

## Decision

**We chose stancl/tenancy v3.**

### Reasoning

The user (solo developer, small team) had some experience with the Spatie *family* of packages — Permission, MediaLibrary, Backup. They considered this transferable to spatie/laravel-multitenancy.

It isn't. The multitenancy package shares the namespace but not the API or the design philosophy of those other packages. Choosing it for "I know Spatie" reasons would mean learning it almost from scratch anyway.

Given that:
- Both are quality packages
- Both have multi-database support
- stancl ships ~80% of what we need built-in vs. ~30% for spatie
- Our priority is shipping the medical product, not infrastructure tinkering

stancl is the better fit.

### Specific stancl features we rely on

1. **`InitializeTenancyByDomain` middleware** — subdomain → tenant resolution
2. **`PreventAccessFromCentralDomains` middleware** — guards against accidental tenant routes on central domain
3. **Job pipeline on `TenantCreated`** — `CreateDatabase`, `MigrateDatabase`, `SeedDatabase` chained
4. **`DatabaseTenancyBootstrapper`** — auto-switches `default` connection to tenant's
5. **`CacheTenancyBootstrapper`** — prefixes cache keys per tenant
6. **`FilesystemTenancyBootstrapper`** — separate filesystem path per tenant
7. **`QueueTenancyBootstrapper`** — jobs serialize current tenant, restore in worker

## Consequences

**Positive:**
- Productive in 1-2 days vs. 1-2 weeks for custom Spatie pipelines
- Saved time goes into the form builder, consultation flow, calendar
- Audit log story is cleaner (per-tenant audit table is straightforward)

**Tradeoffs we accept:**
- Tied to stancl's update cadence and breaking changes (acceptable — the maintainer is responsive)
- If we ever want a fundamentally different tenancy model (e.g. row-level), migration is non-trivial

**Reversibility:**

Migrating from stancl to spatie (or vice versa) later is *possible* but expensive. Estimated: 2-4 weeks of dedicated work, including:
- Replacing middleware
- Replacing tenant lifecycle hooks
- Replacing connection switching
- Re-validating cache, queue, filesystem isolation
- Regression-testing every tenant-aware code path

We accept this as cost of choosing. Concretely, **business logic stays the same** in either package — it's only the bootstrapping that differs. So the cost is bounded.

We don't expect to ever migrate. stancl works. We focus on the medical product.
