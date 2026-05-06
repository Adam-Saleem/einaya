<?php

declare(strict_types=1);

namespace App\Http\Resources\Central;

use App\Models\Central\Clinic;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Clinic */
class ClinicResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $rootDomain = config('app.env') === 'production' ? 'einaya.ps' : 'einaya.test';
        $domain = $this->domains->first()?->domain ?? $this->slug.'.'.$rootDomain;
        $subscription = $this->relationLoaded('subscription')
            ? $this->subscription
            : $this->activeSubscription();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'owner_name' => $this->owner_name,
            'owner_email' => $this->owner_email,
            'owner_phone' => $this->owner_phone,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'domain' => $domain,
            'url' => 'https://'.$domain,
            'trial_ends_at' => optional($this->trial_ends_at)->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'plan' => $subscription?->plan ? [
                'id' => $subscription->plan->id,
                'slug' => $subscription->plan->slug,
                'name' => $subscription->plan->name,
            ] : null,
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status->value,
                'starts_at' => optional($subscription->starts_at)->toIso8601String(),
                'ends_at' => optional($subscription->ends_at)->toIso8601String(),
                'trial_ends_at' => optional($subscription->trial_ends_at)->toIso8601String(),
            ] : null,
            'branding' => $this->branding,
        ];
    }
}
