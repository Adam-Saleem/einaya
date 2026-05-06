<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Enums\Central\TicketStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\UpdateTicketRequest;
use App\Http\Resources\Central\TicketResource;
use App\Models\Central\SupportTicket;
use App\Services\Central\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function index(Request $request): Response
    {
        $query = SupportTicket::query()->with('clinic');

        if ($status = $request->string('status')->toString()) {
            if (TicketStatus::tryFrom($status) !== null) {
                $query->where('status', $status);
            }
        }

        if ($search = $request->string('search')->toString()) {
            $like = '%'.$search.'%';
            $query->where(function ($q) use ($like) {
                $q->where('subject', 'like', $like)
                    ->orWhere('opened_by_email', 'like', $like);
            });
        }

        $tickets = $query->latest('created_at')->paginate(20)->withQueryString();

        return Inertia::render('Central/Tickets/Index', [
            'tickets' => TicketResource::collection($tickets),
            'filters' => [
                'status' => $request->string('status')->toString(),
                'search' => $request->string('search')->toString(),
            ],
            'statuses' => collect(TicketStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
        ]);
    }

    public function show(SupportTicket $ticket): Response
    {
        $ticket->load('clinic');

        return Inertia::render('Central/Tickets/Show', [
            'ticket' => (new TicketResource($ticket))->toArray(request()),
        ]);
    }

    public function update(UpdateTicketRequest $request, SupportTicket $ticket): RedirectResponse
    {
        $original = ['status' => $ticket->status->value];

        if ($request->filled('status')) {
            $ticket->status = TicketStatus::from($request->string('status')->toString());
        }

        // Responses are appended to the body until v2 introduces a
        // ticket_messages table. Keeps history intact for super-admin review.
        if ($response = $request->string('response')->toString()) {
            $stamp = now()->toDateTimeString();
            $ticket->body .= "\n\n--- {$stamp} (admin) ---\n".$response;
        }

        $ticket->save();

        $this->audit->log(
            $request->user(),
            'ticket.updated',
            $ticket,
            $original,
            ['status' => $ticket->status->value],
        );

        return back()->with('success', 'Ticket updated.');
    }
}
