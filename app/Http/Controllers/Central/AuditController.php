<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Resources\Central\AuditLogResource;
use App\Models\Central\CentralAuditLog;
use App\Models\Central\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function index(Request $request): Response
    {
        $query = CentralAuditLog::query()->with('user');

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
        if ($type = $request->string('type')->toString()) {
            $query->where('auditable_type', $type);
        }

        $logs = $query->latest('created_at')->paginate(30)->withQueryString();

        return Inertia::render('Central/Audit/Index', [
            'logs' => AuditLogResource::collection($logs),
            'filters' => [
                'from' => $request->string('from')->toString(),
                'to' => $request->string('to')->toString(),
                'user_id' => $request->integer('user_id') ?: null,
                'action' => $request->string('action')->toString(),
                'type' => $request->string('type')->toString(),
            ],
            'users' => User::query()
                ->whereIn('id', CentralAuditLog::distinct()->pluck('user_id')->filter())
                ->get(['id', 'name', 'email']),
            'actions' => CentralAuditLog::query()
                ->select('action')
                ->distinct()
                ->orderBy('action')
                ->pluck('action'),
        ]);
    }
}
