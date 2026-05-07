<?php

declare(strict_types=1);

namespace App\Http\Resources\Central;

use App\Models\Central\DemoRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DemoRequest */
class DemoRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $digits = $this->whatsappDigits();

        return [
            'id' => $this->id,
            'clinic_name' => $this->clinic_name,
            'contact_name' => $this->contact_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'country' => $this->country,
            'intent' => $this->intent,
            'message' => $this->message,
            'is_handled' => $this->is_handled,
            'handled_at' => $this->handled_at?->toIso8601String(),
            'notes' => $this->notes,
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Pre-built deep links so the FE doesn't have to assemble them
            // (and so we can iterate the greeting copy server-side).
            'whatsapp_url' => $digits !== ''
                ? 'https://wa.me/'.$digits
                : null,
            'mailto_url' => 'mailto:'.$this->email
                .'?subject='.rawurlencode('Re: your Einaya '.$this->intent.' request'),

            'handler' => $this->whenLoaded('handler', fn () => $this->handler ? [
                'id' => $this->handler->id,
                'name' => $this->handler->name,
                'email' => $this->handler->email,
            ] : null),
        ];
    }
}
