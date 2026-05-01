# Database Conventions

## Table Naming

- snake_case
- Plural (`patients`, `appointments`, `medical_forms`)
- Pivot tables alphabetical (`patient_tag` not `tag_patient`)
- Tenant-only tables go in `database/migrations/tenant/`
- Central tables go in `database/migrations/`

## Column Naming

- snake_case
- Singular (one column = one value): `first_name`, `is_active`
- Boolean: prefix with `is_`, `has_`, `can_`: `is_active`, `has_insurance`
- Timestamps: `created_at`, `updated_at`, `deleted_at`, `started_at`, `ended_at`, `paid_at`
- Foreign keys: `{singular}_id`: `patient_id`, `doctor_id`
- Polymorphic: `{thing}_type`, `{thing}_id`: `auditable_type`, `auditable_id`

## Types

| Use | Type |
|---|---|
| Auto-incrementing ID | `id()` (BigInt) |
| Foreign key | `foreignId('patient_id')->constrained()` |
| Tenant ID (stancl) | `string('id')->primary()` (UUID) |
| Short string | `string('column', 60)` |
| Email | `string('email', 191)` (MySQL utf8mb4 max for indexes) |
| Long text | `text` |
| Very long text | `longText` (rare) |
| JSON | `json` (always cast to `array` on model) |
| Boolean | `boolean` |
| Money | `decimal('amount', 10, 2)` (NEVER float for money) |
| Date | `date` |
| Time | `time` |
| Datetime | `dateTime` or `timestamp` |
| Enum (status) | `string('status', 30)` + cast to PHP enum (do NOT use `->enum()` migration helper — locks future changes) |

## Indexes

**Every foreign key has an index.** `foreignId()->constrained()` adds the FK constraint but you may need to add the index explicitly for composite cases.

**Add indexes for every WHERE-clause column.**

```php
Schema::create('appointments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
    $table->foreignId('doctor_id')->constrained()->restrictOnDelete();
    $table->dateTime('scheduled_for');
    $table->string('status', 30);
    // ...

    // Composite index for the most common query
    $table->index(['doctor_id', 'scheduled_for']);
    $table->index(['patient_id', 'scheduled_for']);
    $table->index('status');
});
```

## Foreign Keys

Choose carefully:

- **`cascadeOnDelete()`** — child cannot exist without parent
  - `prescription_items` on `prescription`
  - `form_question_options` on `form_question`
- **`restrictOnDelete()`** — explicit handling required (default safer choice)
  - `patient_id` on `appointments`
  - Forces the application to soft-delete patients, not hard delete
- **`nullOnDelete()`** — child can exist without parent, set null
  - `registered_by` (user) on `patients` — if user deleted, keep patient

**Default to `restrictOnDelete()`** unless you have a specific reason. It's the safest in medical contexts.

## Soft Deletes

Use on:
- All medical / patient data (patients, consultations, prescriptions, diagnoses, form_submissions)
- Most transactional tables (appointments, payments)
- Configuration that has historical references (forms, sections, questions)

Don't use on:
- Pure logs (audit_logs)
- Pivot tables (without their own meaningful data)
- Settings tables (just use updates)

## Migrations

```php
<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_code', 20)->unique();
            $table->string('first_name', 120);
            $table->string('last_name', 120);
            // ...
            $table->timestamps();
            $table->softDeletes();

            $table->index('phone');
            $table->index(['first_name', 'last_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
```

Rules:
- Strict types
- Anonymous class (Laravel 8+ convention)
- Always `down()` (even if just dropping the table)
- Add indexes inside the create block when possible

## Modifying Existing Tables

Always create a new migration; never edit a previously-deployed migration.

```php
public function up(): void
{
    Schema::table('patients', function (Blueprint $table) {
        $table->string('insurance_policy_number', 60)->nullable()->after('insurance_provider_id');
    });
}

public function down(): void
{
    Schema::table('patients', function (Blueprint $table) {
        $table->dropColumn('insurance_policy_number');
    });
}
```

## Tenant vs Central

Tenant migrations:
- Located in `database/migrations/tenant/`
- Run on tenant DB via `php artisan tenants:migrate`
- Should NOT reference central tables (those don't exist in tenant DB)

Central migrations:
- Located in `database/migrations/`
- Run via `php artisan migrate`
- Should NOT reference tenant tables

## Stancl Tenant Model Specifics

The `Clinic` model (which IS the tenant) requires:
- `id` as `string` (UUID), not auto-increment integer
- A `data` json column (stancl convention for arbitrary tenant data)

```php
Schema::create('clinics', function (Blueprint $table) {
    $table->string('id')->primary();
    $table->string('name', 200);
    $table->string('slug', 60)->unique();
    // ... other columns
    $table->json('data')->nullable(); // stancl convention
    $table->timestamps();
    $table->softDeletes();
});
```

## Audit Tables

Have only `created_at`, no `updated_at` (logs are immutable):

```php
Schema::create('tenant_audit_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->string('action', 100);
    $table->string('auditable_type', 100)->nullable();
    $table->unsignedBigInteger('auditable_id')->nullable();
    $table->json('old_values')->nullable();
    $table->json('new_values')->nullable();
    $table->string('ip_address', 45)->nullable();
    $table->string('user_agent', 500)->nullable();
    $table->timestamp('created_at')->useCurrent();

    $table->index(['auditable_type', 'auditable_id']);
    $table->index('user_id');
    $table->index('created_at');
});
```

## Seeders

Idempotent if possible (re-runnable):

```php
public function run(): void
{
    SubscriptionPlan::updateOrCreate(
        ['slug' => 'starter'],
        [
            'name' => 'Starter',
            'price_monthly' => 19,
            // ...
        ],
    );
}
```

Use `firstOrCreate` / `updateOrCreate` for known data; `factory()->count(N)` for demo data.

## Anti-Patterns

- ❌ `$guarded = []` on models
- ❌ Floating-point types for money (`float`, `double`)
- ❌ `enum` migration column type (locks future changes)
- ❌ Missing index on a foreign key
- ❌ String column with no length limit (`string('description')` without max)
- ❌ Storing JSON without `array` cast
- ❌ Hard-deleting medical data
- ❌ Modifying a deployed migration
- ❌ Cross-DB foreign keys (tenant→central or central→tenant — physically impossible in multi-database mode)
