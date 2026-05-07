<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ClientErrorController extends Controller
{
    /**
     * Receives unhandled React errors caught by `<ErrorBoundary />`. We
     * intentionally avoid throwing — it's a best-effort reporter, and the
     * client has already shown the user a fallback panel.
     */
    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'message' => 'nullable|string|max:1000',
            'stack' => 'nullable|string|max:8000',
            'component_stack' => 'nullable|string|max:8000',
            'url' => 'nullable|string|max:2000',
            'user_agent' => 'nullable|string|max:500',
        ]);

        Log::warning('client.error', [
            'user_id' => $request->user()?->id,
            'tenant' => tenant() ? (string) tenant()->getKey() : null,
            'message' => Str::limit((string) ($payload['message'] ?? ''), 500, ''),
            'url' => $payload['url'] ?? null,
            'user_agent' => $payload['user_agent'] ?? null,
            'stack' => $payload['stack'] ?? null,
            'component_stack' => $payload['component_stack'] ?? null,
        ]);

        return response()->json(['ok' => true]);
    }
}
