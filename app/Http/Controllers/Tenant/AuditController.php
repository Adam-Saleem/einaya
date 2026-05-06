<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\AuditLogResource;
use App\Models\Tenant\TenantAuditLog;
use App\Models\Tenant\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        if ($user === null || ! $user->can('audit.view')) {
            throw new AuthorizationException();
        }

        $query = TenantAuditLog::query()->with('user');

        if ($from = $request->date('from')) {
            $query->where('created_at', '>=', $from);
        }
        if ($to = $request->date('to')) {
            $query->where('created_at', '<=', $to);
        }
        if ($userId = $request->integer('user_id')) {
            $query->where('user_id', $userId);
        }
        if ($action = $request->string('action')->toString()) {
            $query->where('action', 'like', $action.'%');
        }

        $logs = $query->latest('created_at')->paginate(30)->withQueryString();

        return Inertia::render('Tenant/Audit/Index', [
            'logs' => AuditLogResource::collection($logs),
            'filters' => [
                'from' => $request->string('from')->toString(),
                'to' => $request->string('to')->toString(),
                'user_id' => $request->integer('user_id') ?: null,
                'action' => $request->string('action')->toString(),
            ],
            'users' => User::query()
                ->whereIn('id', TenantAuditLog::distinct()->pluck('user_id')->filter())
                ->get(['id', 'name', 'email']),
            'actions' => TenantAuditLog::query()
                ->select('action')
                ->distinct()
                ->orderBy('action')
                ->pluck('action'),
        ]);
    }
}
