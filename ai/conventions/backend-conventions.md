# Backend Conventions

## File Headers

Every PHP file starts with:
```php
<?php

declare(strict_types=1);

namespace App\Whatever;
```

No exceptions. `declare(strict_types=1);` is non-negotiable.

## Models

```php
<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\Tenant\PatientGender;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'patient_code',
        'first_name',
        'last_name',
        // ...
    ];

    protected $casts = [
        'gender' => PatientGender::class,
        'has_insurance' => 'boolean',
        'date_of_birth' => 'date',
    ];

    // Relationships
    public function insuranceProvider(): BelongsTo
    {
        return $this->belongsTo(InsuranceProvider::class);
    }

    // NO business logic in models. Push to services.
}
```

Rules:
- Always `$fillable`, never `$guarded = []`
- Cast every json/enum/decimal/date column
- Type hints on every method
- Business logic lives in services or actions, not models
- Scopes acceptable for query reuse

## Controllers

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Actions\Tenant\RegisterPatientAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StorePatientRequest;
use App\Http\Resources\Tenant\PatientResource;
use App\Models\Tenant\Patient;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Patient::class);

        $patients = Patient::query()
            ->latest()
            ->paginate(25);

        return Inertia::render('Tenant/Patients/Index', [
            'patients' => PatientResource::collection($patients),
        ]);
    }

    public function store(
        StorePatientRequest $request,
        RegisterPatientAction $action,
    ) {
        $this->authorize('create', Patient::class);

        $patient = $action->execute($request->validated(), $request->user());

        return redirect()
            ->route('patients.show', $patient)
            ->with('success', 'Patient registered.');
    }
}
```

Rules:
- Authorize at the top of every method
- Validation in Form Requests, never inline
- Orchestration in Actions, not controllers
- Return Inertia responses or redirects
- Resource collections to shape data, not raw `->toArray()`

## Form Requests

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policy handles authz
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:30'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            // ...
        ];
    }
}
```

## Actions

For multi-step orchestrated operations.

```php
<?php

declare(strict_types=1);

namespace App\Actions\Tenant;

use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use App\Services\Tenant\AuditLogService;
use App\Services\Tenant\PatientCodeGenerator;
use Illuminate\Support\Facades\DB;

readonly class RegisterPatientAction
{
    public function __construct(
        private PatientCodeGenerator $codeGenerator,
        private AuditLogService $audit,
    ) {}

    public function execute(array $data, User $user): Patient
    {
        return DB::transaction(function () use ($data, $user) {
            $data['patient_code'] = $this->codeGenerator->next();
            $data['registered_by'] = $user->id;

            $patient = Patient::create($data);

            $this->audit->log($user, 'patient.created', $patient, [], $patient->toArray());

            return $patient;
        });
    }
}
```

Rules:
- Single public method `execute()` (or `__invoke()`)
- `readonly` class with constructor DI
- Wrap in `DB::transaction()` for multi-write operations
- Always audit-log if sensitive

## Services

For reusable logic that's not orchestration:
- Generators (codes, receipt numbers)
- Search services
- Aggregation services
- Snapshot generation

```php
<?php

declare(strict_types=1);

namespace App\Services\Tenant;

class PatientCodeGenerator
{
    public function next(): string
    {
        $last = Patient::withTrashed()->max('id') ?? 0;
        return sprintf('P-%05d', $last + 1);
    }
}
```

## Policies

```php
<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Models\Tenant\Patient;
use App\Models\Tenant\User;

class PatientPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('patients.view');
    }

    public function view(User $user, Patient $patient): bool
    {
        return $user->can('patients.view');
    }

    public function update(User $user, Patient $patient): bool
    {
        return $user->can('patients.update');
    }

    // ...
}
```

Rules:
- One policy per model
- Methods match Laravel conventions (`viewAny`, `view`, `create`, `update`, `delete`)
- Each method delegates to permission check
- Register in `AuthServiceProvider`

## Enums

```php
<?php

declare(strict_types=1);

namespace App\Enums\Tenant;

enum AppointmentStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Arrived = 'arrived';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case NoShow = 'no_show';

    public function label(): string
    {
        return match($this) {
            self::Pending => 'Pending',
            self::Confirmed => 'Confirmed',
            // ...
        };
    }
}
```

Rules:
- String-backed (never int)
- One file per enum
- Helper methods (label, color, etc.) live on the enum

## Naming

- **Class:** PascalCase (`PatientController`)
- **Method:** camelCase (`registerPatient`)
- **Property:** camelCase (`firstName`)
- **DB column:** snake_case (`first_name`)
- **Route:** kebab-case (`/patient-files`)
- **Route name:** dot.case (`patients.show`)
- **Config key:** snake_case
- **Translation key:** dot.case (`patients.create.success`)

## Tests

See `agents/testing-pest-agent.md`.

## Imports

- Group imports: namespace package (Illuminate, Laravel, packages) first, then app imports
- One class per `use` statement
- Sort alphabetically within group

## What we don't do

- No facades inside services or actions (use DI). Facades OK in controllers if simple.
- No raw SQL strings unless absolutely required (and then explained in a comment)
- No `$_GET` / `$_POST` — always through Request
- No `dd()` / `var_dump()` in committed code
- No `try { } catch (\Exception $e) {}` that silently swallows errors
- No `env()` outside `config/*.php` — use `config()` everywhere else
