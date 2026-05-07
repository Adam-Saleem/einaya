<?php

declare(strict_types=1);

namespace App\Http\Resources\Central;

use App\Models\Central\Coupon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Coupon */
class CouponResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'duration_days' => $this->duration_days,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'max_uses' => $this->max_uses,
            'used_count' => $this->used_count,
            'remaining_uses' => max(0, $this->max_uses - $this->used_count),
            'description' => $this->description,
            'is_active' => $this->is_active,
            'is_expired' => $this->isExpired(),
            'is_exhausted' => $this->isExhausted(),
            'status' => $this->status(),
            'created_at' => $this->created_at?->toIso8601String(),
            'plan' => $this->whenLoaded('plan', fn () => $this->plan ? [
                'id' => $this->plan->id,
                'name' => $this->plan->name,
                'slug' => $this->plan->slug,
            ] : null),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
                'email' => $this->creator->email,
            ] : null),
        ];
    }
}
