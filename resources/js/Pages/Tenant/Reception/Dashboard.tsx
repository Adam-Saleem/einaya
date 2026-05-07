import { Link, router } from '@inertiajs/react';
import { CalendarOff, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/Components/domain/ConfirmDialog';
import { EmptyState } from '@/Components/domain/EmptyState';
import { NewAppointmentDialog } from '@/Components/domain/NewAppointmentDialog';
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
import { formatTime } from '@/lib/dates';

type QueueRow = {
    id: number;
    scheduled_for: string | null;
    status: string;
    status_label: string;
    queue_number: number | null;
    patient: { id: number; patient_code: string; name: string; phone: string } | null;
    doctor: { id: number; name: string | null } | null;
};

type Doctor = {
    id: number;
    name: string | null;
    consultation_duration_minutes: number;
};

type Props = {
    summary: { total: number; done: number; pending: number };
    queue: QueueRow[];
    doctors: Doctor[];
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'neutral'> = {
    pending: 'warning',
    confirmed: 'info',
    arrived: 'info',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'danger',
    no_show: 'danger',
};

export default function ReceptionDashboard({ summary, queue, doctors }: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    const [newApptOpen, setNewApptOpen] = useState(false);
    const [confirm, setConfirm] = useState<
        { kind: 'cancel' | 'no_show'; appointment: QueueRow } | null
    >(null);

    const performConfirm = () => {
        if (!confirm) return;
        const url =
            confirm.kind === 'cancel'
                ? `/appointments/${confirm.appointment.id}/cancel`
                : `/appointments/${confirm.appointment.id}/no-show`;
        router.post(url, {}, { preserveScroll: true });
        setConfirm(null);
    };

    return (
        <AppLayout
            title={t('reception.title')}
            pageTitle={t('reception.title')}
            description={t('reception.summary', {
                done: summary.done,
                total: summary.total,
            })}
            actions={
                <Button size="lg" onClick={() => setNewApptOpen(true)}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('reception.actions.newAppointment')}
                </Button>
            }
        >
            <Card>
                <CardContent className={queue.length === 0 ? 'p-6' : 'p-0'}>
                    {queue.length === 0 ? (
                        <EmptyState
                            icon={CalendarOff}
                            title={t('reception.noAppointments')}
                            action={
                                <Button onClick={() => setNewApptOpen(true)}>
                                    <Plus className="me-2 h-4 w-4" />
                                    {t('reception.actions.newAppointment')}
                                </Button>
                            }
                        />
                    ) : (
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
                                {queue.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-mono text-sm">
                                            {row.queue_number ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {row.patient ? (
                                                <Link
                                                    href={`/patients/${row.patient.id}`}
                                                    className="font-medium hover:text-primary"
                                                >
                                                    {row.patient.name}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                {row.patient?.phone ?? '—'}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatTime(row.scheduled_for)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>
                                                {row.status_label}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <div className="flex items-center justify-end gap-1">
                                                {row.status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            router.post(
                                                                `/appointments/${row.id}/arrive`,
                                                                {},
                                                                { preserveScroll: true },
                                                            )
                                                        }
                                                    >
                                                        {t('reception.actions.markArrived')}
                                                    </Button>
                                                )}
                                                {(row.status === 'pending' ||
                                                    row.status === 'arrived') && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            setConfirm({
                                                                kind: 'cancel',
                                                                appointment: row,
                                                            })
                                                        }
                                                    >
                                                        {t('reception.actions.cancel')}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <NewAppointmentDialog
                open={newApptOpen}
                onOpenChange={setNewApptOpen}
                doctors={doctors}
            />

            <ConfirmDialog
                open={confirm !== null}
                onOpenChange={(open) => !open && setConfirm(null)}
                title={t('reception.confirmCancel.title')}
                description={t('reception.confirmCancel.body')}
                onConfirm={performConfirm}
            />
        </AppLayout>
    );
}
