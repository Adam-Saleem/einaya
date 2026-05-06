import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { StatusBadge, type StatusVariant } from '@/Components/domain/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import CentralLayout from '@/Layouts/CentralLayout';
import type { Ticket, TicketStatus } from '@/types/central';

type Props = {
    ticket: Ticket;
};

const STATUS_VARIANT: Record<TicketStatus, StatusVariant> = {
    open: 'warning',
    pending: 'info',
    closed: 'success',
};

const STATUSES: TicketStatus[] = ['open', 'pending', 'closed'];

export default function TicketShow({ ticket }: Props) {
    const { t } = useTranslation('central');
    useFlashToasts();

    const form = useForm({
        status: ticket.status,
        response: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch(`/tickets/${ticket.id}`, {
            preserveScroll: true,
            onSuccess: () => form.reset('response'),
        });
    };

    return (
        <CentralLayout
            title={ticket.subject}
            pageTitle={ticket.subject}
            description={
                <span className="flex items-center gap-2">
                    <StatusBadge variant={STATUS_VARIANT[ticket.status]}>
                        {ticket.status_label}
                    </StatusBadge>
                    <span className="text-muted-foreground">
                        {t('tickets.show.openedFrom', {
                            clinic: ticket.clinic?.name ?? ticket.opened_by_email,
                        })}
                    </span>
                </span>
            }
            breadcrumbs={[
                { label: t('tickets.title'), href: '/tickets' },
                { label: ticket.subject },
            ]}
        >
            <Card>
                <CardHeader>
                    <CardTitle>{t('tickets.show.history')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                        {ticket.body}
                    </pre>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
                            <div className="space-y-2">
                                <Label>{t('tickets.show.statusLabel')}</Label>
                                <Select
                                    value={form.data.status}
                                    onValueChange={(value) =>
                                        form.setData('status', value as TicketStatus)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUSES.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ticket-response">
                                {t('tickets.show.responseLabel')}
                            </Label>
                            <Textarea
                                id="ticket-response"
                                rows={5}
                                value={form.data.response}
                                onChange={(event) => form.setData('response', event.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('tickets.show.responseHint')}
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.processing}>
                                {t('tickets.show.submit')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </CentralLayout>
    );
}
