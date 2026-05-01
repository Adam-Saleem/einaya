# Troubleshooting

Common problems and their fixes during Einaya development.

## Tenancy

### "Tenant database wasn't created when I made a clinic"

Check, in order:
1. Is the queue worker running? `php artisan queue:work` or check Supervisor
2. `failed_jobs` table — anything there?
3. `TenancyServiceProvider::events()` — is `TenantCreated => CreateDatabase` in the pipeline?
4. Database user has `CREATE DATABASE` privilege?

Quick diagnostic:
```bash
php artisan queue:listen --once  # process the job synchronously, see errors
```

### "I created the tenant but migrations didn't run"

The pipeline should be: `CreateDatabase → MigrateDatabase` (and optionally `SeedDatabase` in non-production).

Verify in `TenancyServiceProvider`:
```php
Events\TenantCreated::class => [
    JobPipeline::make([
        Jobs\CreateDatabase::class,
        Jobs\MigrateDatabase::class,
        Jobs\SeedDatabase::class, // env-gated
    ])->send(fn (Events\TenantCreated $event) => $event->tenant)->toListener(),
],
```

Run manually:
```bash
php artisan tenants:migrate --tenants={tenant_uuid}
```

### "Code on a tenant subdomain reads from the central database"

Most likely:
- Route is in `routes/web.php` instead of `routes/tenant.php`
- Route group missing `InitializeTenancyByDomain` middleware
- Manually skipping middleware (e.g. for testing) and forgetting to re-enable

Verify in tinker:
```php
tenancy()->initialized;  // should be true inside tenant routes
tenant('id');            // should match the subdomain's clinic
```

### "Cache or queue jobs leak between tenants"

Verify bootstrappers in `config/tenancy.php`:
```php
'bootstrappers' => [
    Stancl\Tenancy\Bootstrappers\DatabaseTenancyBootstrapper::class,
    Stancl\Tenancy\Bootstrappers\CacheTenancyBootstrapper::class,
    Stancl\Tenancy\Bootstrappers\FilesystemTenancyBootstrapper::class,
    Stancl\Tenancy\Bootstrappers\QueueTenancyBootstrapper::class,
],
```

All four must be present.

## Migrations

### "Migration runs but the column isn't there"

If you edited a previously-deployed migration: the migration won't re-run because Laravel records it as completed. Always create a new migration to modify schema.

```bash
php artisan make:migration add_xxx_to_yyy_table
```

### "Tenant migrations not picked up"

Migrations in `database/migrations/tenant/` only run via `php artisan tenants:migrate`, not the regular `php artisan migrate`. Verify the path config in `config/tenancy.php`:
```php
'migration_parameters' => [
    '--path' => [database_path('migrations/tenant')],
    '--realpath' => true,
],
```

## Permissions / Authorization

### "User has the role but is_denied access"

```bash
php artisan permission:cache-reset
```

Spatie caches permissions. After seeding new permissions, clear the cache.

### "Policy returns true but request is still 403"

- Is `authorize()` actually being called in the controller?
- Is the policy registered in `AuthServiceProvider::$policies`?
- Run policy directly in tinker:
  ```php
  $user->can('patients.update', $patient);
  ```

### "useCan() returns false but I'm an admin"

The Inertia middleware shares permissions to the frontend. Check:
- Is the user logged in?
- Is the middleware registered in `HandleInertiaRequests`?
- After role changes, page must reload (permissions are baked into props at request time)

## Forms / Snapshots

### "Old form submission shows the new structure"

You're rendering from live `form_questions` instead of `form_snapshot`. **Stop doing that.** See ADR-002.

The fix: in `FormSubmissionResource`, return `form_snapshot` from the JSON column. Frontend's `<FormRenderer />` reads from the snapshot, not from a live query.

### "Snapshot is missing options for radio/select questions"

`FormSnapshotService::snapshot()` must include options inside each question. Check the service includes:
```php
'options' => $question->options->map(fn($o) => [
    'value' => $o->value,
    'label' => $o->label,
])->toArray(),
```

### "Stable key collision when duplicating a question"

Pass existing keys to `generateKey()`:
```php
$existingKeys = $section->questions->pluck('key')->toArray();
$newKey = generateKey($label, $existingKeys);
```

## RTL / i18n

### "RTL layout has the sidebar on the wrong side"

Check `<html dir="rtl">` is set. Inspect element. If not:
- Verify the locale switch reloads the page (full reload required)
- Check `app.tsx` sets `document.documentElement.dir`

### "RTL has weird gaps or overlapping content"

You're using `ml-`/`mr-`/`pl-`/`pr-` instead of `ms-`/`me-`/`ps-`/`pe-`. Find and replace in the offending file.

### "Translation key shows as raw text"

Three causes:
1. Wrong namespace (`useTranslation('patients')` but key is in `common.json`)
2. Key doesn't exist in the JSON file
3. Translation file not loaded (check `i18n.ts` namespaces array)

### "Numbers showing in Eastern Arabic digits unexpectedly"

We don't want this for medical context. Find the auto-conversion (likely a wrong `Intl.NumberFormat` locale) and force `en` for numbers:
```typescript
new Intl.NumberFormat('en', {...}).format(value)
```

## Dark Mode

### "Element invisible in dark mode"

Hardcoded color. Find `bg-white`, `text-black`, `border-gray-XXX` and replace with semantic tokens (`bg-background`, `text-foreground`, `border-border`).

### "Dark mode toggle doesn't persist"

Check the backend endpoint exists (`POST /api/preferences/theme`) and the user record's `theme_preference` is updated.

## Auth / 2FA

### "2FA QR code generation fails"

Ensure `google2fa-laravel` is installed and configured:
```bash
composer require pragmarx/google2fa-laravel
php artisan vendor:publish --provider="PragmaRX\Google2FALaravel\ServiceProvider"
```

The user model needs the `HasTwoFactorAuth` trait and `two_factor_secret` column.

### "Recovery code accepted twice"

Recovery codes must be one-time-use. After matching, delete that code from the user's recovery codes:
```php
$codes = $user->recoveryCodes;
unset($codes[$matchIndex]);
$user->update(['two_factor_recovery_codes' => encrypt(json_encode(array_values($codes)))]);
```

### "Login at wrong subdomain succeeds"

Each context (central vs tenant) has its own guard. Login controller must:
- On `app.einaya.test` (central): authenticate against `web_central` guard
- On `{clinic}.einaya.test` (tenant): authenticate against `web` guard

If a super admin logs in at a tenant subdomain, the tenant guard should reject (no such user in tenant DB). Add a test for this.

## Frontend

### "Inertia validation errors not showing"

- Server returns errors via `Validator` (form request) — Inertia auto-shares them
- Frontend reads `errors` object from `usePage().props` or `useForm()` returns
- Check the field name matches between server-side rules and frontend form key

### "TypeScript errors after adding a column to a model"

Update the corresponding Resource class on the backend AND the TypeScript type in `resources/js/types/`.

### "shadcn component looks unstyled"

- Component installed via CLI? Check `Components/ui/`
- Tailwind config `content` array includes `Components/ui/**/*`
- `app.css` imports the shadcn variables

## Performance

### "Page loads slowly in development"

- Vite running? `pnpm dev`
- N+1 query? Enable Laravel Debugbar or Telescope locally

### "Tenant migrations slow when seeding 20+ tenants"

This is expected. Consider:
- Run migrations in parallel: `php artisan tenants:migrate --tenants={a,b,c} --queue`
- For dev seeding, do it once on a known clinic, not all 20

## Tests

### "Tests pass locally but fail in CI"

- Database state pollution? Each test should use `RefreshDatabase`
- Tenant context not cleaned up between tests? Add `tenancy()->end()` in `afterEach`
- Hardcoded paths or URLs? Use `route()` and config values

### "Tenancy isolation test sometimes fails"

Race condition. Each test creating a tenant should use a unique slug. Use `Str::uuid()` or `fake()->unique()->slug()`.

## When all else fails

1. Read the actual error message. Twice.
2. Check `storage/logs/laravel.log`
3. Browser DevTools → Console + Network
4. Open the Debug Agent (`ai/agents/debug-agent.md`) in a fresh Claude conversation
5. Describe: what you did, what you expected, what happened, what you tried
6. Paste relevant log excerpts and code

For tenancy bugs specifically: also paste `agents/tenancy-agent.md` for focused help.
