<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Enums\Tenant\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreStaffRequest;
use App\Http\Requests\Tenant\UpdateStaffRequest;
use App\Http\Resources\Tenant\StaffResource;
use App\Models\Tenant\User;
use App\Services\Tenant\AuditLogService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function index(Request $request): Response
    {
        $this->ensureCan($request->user(), 'staff.view');

        $users = User::query()
            ->with('roles')
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('Tenant/Staff/Index', [
            'staff' => StaffResource::collection($users),
        ]);
    }

    public function store(StoreStaffRequest $request): RedirectResponse
    {
        $tempPassword = Str::password(14, symbols: true);

        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'phone' => $request->validated('phone'),
            'password' => Hash::make($tempPassword),
            'is_active' => $request->boolean('is_active', true),
            'preferred_language' => 'ar',
        ]);

        $user->assignRole($request->validated('role'));

        $this->audit->log($request->user(), 'staff.created', $user, [], [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $request->validated('role'),
        ]);

        return back()->with('success', sprintf(
            'Staff created. Temporary password for %s: %s',
            $user->email,
            $tempPassword,
        ));
    }

    public function update(UpdateStaffRequest $request, User $staff): RedirectResponse
    {
        $original = $staff->only(['name', 'email', 'phone', 'is_active']);
        $staff->fill($request->validated())->save();

        $this->audit->log(
            $request->user(),
            'staff.updated',
            $staff,
            $original,
            $staff->only(['name', 'email', 'phone', 'is_active']),
        );

        return back()->with('success', 'Staff updated.');
    }

    public function resetPassword(Request $request, User $staff): RedirectResponse
    {
        $this->ensureCan($request->user(), 'staff.update');

        $tempPassword = Str::password(14, symbols: true);
        $staff->password = Hash::make($tempPassword);
        $staff->save();

        $this->audit->log($request->user(), 'staff.password_reset', $staff);

        return back()->with('success', sprintf(
            'New temporary password for %s: %s',
            $staff->email,
            $tempPassword,
        ));
    }

    public function destroy(Request $request, User $staff): RedirectResponse
    {
        $this->ensureCan($request->user(), 'staff.delete');

        if ($staff->id === $request->user()?->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $staff->delete();
        $this->audit->log($request->user(), 'staff.deleted', $staff);

        return back()->with('success', 'Staff member archived.');
    }

    private function ensureCan(?User $user, string $permission): void
    {
        if ($user === null || ! $user->can($permission)) {
            throw new AuthorizationException();
        }
    }
}
