<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateDoctorProfileRequest;
use App\Http\Resources\Tenant\DoctorResource;
use App\Models\Tenant\Doctor;
use App\Services\Tenant\AuditLogService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorProfileController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function show(Request $request): Response
    {
        if (! $request->user()?->can('doctor.view_profile')) {
            abort(403);
        }

        $doctor = $this->resolveDoctor($request);
        $doctor?->loadMissing('user');

        return Inertia::render('Tenant/Doctor/Profile', [
            'doctor' => $doctor ? (new DoctorResource($doctor))->toArray($request) : null,
        ]);
    }

    public function update(UpdateDoctorProfileRequest $request): RedirectResponse
    {
        $doctor = $this->resolveDoctor($request);

        if ($doctor === null) {
            throw new AuthorizationException('No doctor profile attached to this user.');
        }

        $user = $doctor->user;
        $original = [
            'name' => $user?->name,
            'phone' => $user?->phone,
            'specialty' => $doctor->specialty,
            'license_number' => $doctor->license_number,
            'bio_en' => $doctor->bio_en,
            'bio_ar' => $doctor->bio_ar,
            'consultation_duration_minutes' => $doctor->consultation_duration_minutes,
        ];

        if ($user) {
            $user->fill($request->only(['name', 'phone']))->save();
            if ($request->hasFile('avatar')) {
                $path = $request->file('avatar')->store('avatars', 'public');
                $user->avatar_path = $path;
                $user->save();
            }
        }

        $doctor->fill($request->only([
            'specialty',
            'license_number',
            'bio_en',
            'bio_ar',
            'consultation_duration_minutes',
        ]))->save();

        $this->audit->log(
            $request->user(),
            'doctor.profile_updated',
            $doctor,
            $original,
            [
                'name' => $user?->name,
                'phone' => $user?->phone,
                'specialty' => $doctor->specialty,
                'license_number' => $doctor->license_number,
                'bio_en' => $doctor->bio_en,
                'bio_ar' => $doctor->bio_ar,
                'consultation_duration_minutes' => $doctor->consultation_duration_minutes,
            ],
        );

        return back()->with('success', 'Profile updated.');
    }

    private function resolveDoctor(Request $request): ?Doctor
    {
        $user = $request->user();
        return $user?->doctor;
    }
}
