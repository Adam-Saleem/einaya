<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Doctor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Doctor */
class DoctorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'specialty' => $this->specialty,
            'license_number' => $this->license_number,
            'bio_en' => $this->bio_en,
            'bio_ar' => $this->bio_ar,
            'consultation_duration_minutes' => $this->consultation_duration_minutes,
            'is_active' => (bool) $this->is_active,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
                'avatar_path' => $this->user->avatar_path,
                'avatar_url' => $this->user->avatar_path ? '/storage/'.$this->user->avatar_path : null,
            ]),
        ];
    }
}
