import { Link, router } from '@inertiajs/react';
import { Calendar, CreditCard, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/Components/domain/ConfirmDialog';
import { PatientRegistrationForm } from '@/Components/domain/PatientRegistrationForm';
import { StatusBadge } from '@/Components/domain/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
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

type QueueRow = {
    id: number;
    scheduled_for: string | null;
    status: string;
    status_label: string;
    queue_number: number | null;
    patient: { id: number; patient_code: string; name: string; phone: string } | null;
    doctor: { id: number; name: string | null } | null;
};

type Props = {
    stats: {
        today_total: number;
        by_status: Record<string, number>;
        walk_ins_today: number;
        pending_payments: number;
    };
    queue: QueueRow[];
};

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

export default function ReceptionDashboard({ stats, queue }: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    const [walkInOpen, setWalkInOpen] = useState(false);
    const [confirm, setConfirm] = useState<
        { kind: 'cancel' | 'no_show'; appointment: QueueRow } | null
    >(null);

    const stat = (label: string, value: number | string, sub?: string, Icon = Calendar) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                </CardTitle>
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <Icon className="h-4 w-4" />
                </span>
            </CardHeader>
            <CardContent>
                <p className="text-h2">{value}</p>
                {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
            </CardContent>
        </Card>
    );

    const markArrived = (id: number) => {
        router.post(`/appointments/${id}/arrive`, {}, { preserveScroll: true });
    };

    const performConfirm = () => {
        if (!confirm) return;
        if (confirm.kind === 'cancel') {
            router.post(
                `/appointments/${confirm.appointment.id}/cancel`,
                {},
                { preserveScroll: true, onFinish: () => setConfirm(null) },
            );
        }
        if (confirm.kind === 'no_show') {
            router.post(
                `/appointments/${confirm.appointment.id}/no-show`,
                {},
                { preserveScroll: true, onFinish: () => setConfirm(null) },
            );
        }
    };

    return (
        <AppLayout
            title={t('reception.title')}
            pageTitle={t('reception.title')}
            description={t('reception.subtitle')}
            actions={
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setWalkInOpen(true)}>
                        <UserPlus className="me-2 h-4 w-4" />
                        {t('reception.actions.addWalkIn')}
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/appointments">
                            <Calendar className="me-2 h-4 w-4" />
                            {t('reception.actions.bookAppointment')}
                        </Link>
                    </Button>
                </div>
            }
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stat(
                    t('reception.stats.todayTotal'),
                    stats.today_total,
                    `${stats.by_status.arrived ?? 0} arrived · ${stats.by_status.completed ?? 0} done`,
                )}
                {stat(t('reception.stats.walkIns'), stats.walk_ins_today, undefined, Users)}
                {stat(
                    t('reception.stats.pendingPayments'),
                    stats.pending_payments,
                    undefined,
                    CreditCard,
                )}
                {stat('Total today', stats.today_total)}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('reception.queue')}</CardTitle>
                </CardHeader>
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
                            {queue.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        {t('reception.noAppointments')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                queue.map((row) => (
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
                                                {row.patient?.patient_code} · {row.patient?.phone}
                                            </p>
                                        </TableCell>
                                        <TableCell>{formatTime(row.scheduled_for)}</TableCell>
                                        <TableCell>
                                            <StatusBadge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>
                                                {row.status_label}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <div className="flex flex-wrap justify-end gap-1">
                                                {row.status !== 'arrived' &&
                                                    row.status !== 'completed' &&
                                                    row.status !== 'cancelled' &&
                                                    row.status !== 'no_show' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => markArrived(row.id)}
                                                        >
                                                            {t('reception.actions.markArrived')}
                                                        </Button>
                                                    )}
                                                {row.status !== 'cancelled' &&
                                                    row.status !== 'completed' && (
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
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <PatientRegistrationForm
                open={walkInOpen}
                onOpenChange={setWalkInOpen}
                insuranceProviders={[]}
            />

            <ConfirmDialog
                open={confirm !== null}
                onOpenChange={(open) => !open && setConfirm(null)}
                title="Cancel this appointment?"
                description="The patient won't be marked arrived. You can re-book later."
                onConfirm={performConfirm}
            />
        </AppLayout>
    );
}
