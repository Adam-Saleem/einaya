import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { StatusBadge } from '@/Components/domain/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import AppLayout from '@/Layouts/AppLayout';

type Appointment = {
    id: number;
    scheduled_for: string | null;
    status: string;
    status_label: string;
    queue_number: number | null;
    patient: { id: number; patient_code: string; name: string; phone: string } | null;
};

type Props = { appointments: Appointment[] };

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'neutral'> = {
    pending: 'neutral',
    confirmed: 'info',
    arrived: 'warning',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'danger',
    no_show: 'danger',
};

function formatTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TodayPage({ appointments }: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    const markArrived = (id: number) =>
        router.post(`/appointments/${id}/arrive`, {}, { preserveScroll: true });
    const cancel = (id: number) =>
        router.post(`/appointments/${id}/cancel`, {}, { preserveScroll: true });

    return (
        <AppLayout
            title={t('appointments.today')}
            pageTitle={t('appointments.today')}
            breadcrumbs={[
                { label: t('appointments.title'), href: '/appointments' },
                { label: t('appointments.today') },
            ]}
        >
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('appointments.queue.columns.queue')}</TableHead>
                                <TableHead>{t('appointments.queue.columns.patient')}</TableHead>
                                <TableHead>{t('appointments.queue.columns.scheduled')}</TableHead>
                                <TableHead>{t('appointments.queue.columns.status')}</TableHead>
                                <TableHead className="text-end">
                                    {t('appointments.queue.columns.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appointments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        —
                                    </TableCell>
                                </TableRow>
                            ) : (
                                appointments.map((a) => (
                                    <TableRow key={a.id}>
                                        <TableCell className="font-mono">
                                            {a.queue_number ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {a.patient ? (
                                                <Link
                                                    href={`/patients/${a.patient.id}`}
                                                    className="font-medium hover:text-primary"
                                                >
                                                    {a.patient.name}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                        </TableCell>
                                        <TableCell>{formatTime(a.scheduled_for)}</TableCell>
                                        <TableCell>
                                            <StatusBadge variant={STATUS_VARIANT[a.status] ?? 'neutral'}>
                                                {a.status_label}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => markArrived(a.id)}
                                                className="me-2"
                                            >
                                                Arrive
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => cancel(a.id)}
                                            >
                                                Cancel
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
