import { Link, router } from '@inertiajs/react';
import { CalendarOff, CheckCircle2, Plus, Stethoscope } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/Components/domain/ConfirmDialog';
import { EmptyState } from '@/Components/domain/EmptyState';
import { NewAppointmentDialog } from '@/Components/domain/NewAppointmentDialog';
import { PaymentForm } from '@/Components/domain/PaymentForm';
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

type CompletedRow = {
    id: number;
    patient: { id: number; name: string; phone: string | null } | null;
    doctor: string | null;
    scheduled_for: string | null;
    consultation_id: number | null;
    visit_type: 'first' | 'review' | null;
    is_paid: boolean;
    billing: {
        visit_type: string | null;
        base_price: number;
        services: { id: number; name: string; price: number; quantity: number; line_total: number }[];
        services_total: number;
        total: number;
    } | null;
};

type Doctor = {
    id: number;
    name: string | null;
    consultation_duration_minutes: number;
};

type Props = {
    summary: {
        scheduled: number;
        in_progress: number;
        pending_payment: number;
        total: number;
    };
    scheduled: QueueRow[];
    inProgress: QueueRow[];
    completed: CompletedRow[];
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

const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(n);

export default function ReceptionDashboard({
    summary,
    scheduled,
    inProgress,
    completed,
    doctors,
}: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    const [newApptOpen, setNewApptOpen] = useState(false);
    const [confirm, setConfirm] = useState<
        { kind: 'cancel' | 'no_show'; appointment: QueueRow } | null
    >(null);
    const [paymentTarget, setPaymentTarget] = useState<CompletedRow | null>(null);

    const performConfirm = () => {
        if (!confirm) return;
        const url =
            confirm.kind === 'cancel'
                ? `/appointments/${confirm.appointment.id}/cancel`
                : `/appointments/${confirm.appointment.id}/no-show`;
        router.post(url, {}, { preserveScroll: true });
        setConfirm(null);
    };

    const paymentPrefill = useMemo(() => {
        if (!paymentTarget?.billing) return undefined;
        const breakdown: { label: string; value: number }[] = [];
        if (paymentTarget.billing.base_price > 0) {
            breakdown.push({
                label: t(
                    paymentTarget.visit_type === 'first'
                        ? 'reception.sections.payment.firstVisit'
                        : 'reception.sections.payment.reviewVisit',
                ),
                value: paymentTarget.billing.base_price,
            });
        }
        for (const s of paymentTarget.billing.services) {
            breakdown.push({ label: s.name, value: s.line_total });
        }
        return { amount: paymentTarget.billing.total, breakdown };
    }, [paymentTarget, t]);

    return (
        <AppLayout
            title={t('reception.title')}
            pageTitle={t('reception.title')}
            description={t('reception.summary3', summary)}
            actions={
                <Button size="lg" onClick={() => setNewApptOpen(true)}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('reception.actions.newAppointment')}
                </Button>
            }
        >
            {/* Section 1 — Scheduled & waiting */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-h4">
                        <span>{t('reception.sections.scheduled.title')}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            ({summary.scheduled})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className={scheduled.length === 0 ? 'p-6 pt-0' : 'p-0'}>
                    {scheduled.length === 0 ? (
                        <EmptyState
                            icon={CalendarOff}
                            title={t('reception.sections.scheduled.empty')}
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
                                {scheduled.map((row) => (
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
                                            <p className="text-xs text-muted-foreground" dir="ltr">
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

            {/* Section 2 — In consultation */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-h4">
                        <span>{t('reception.sections.inProgress.title')}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            ({summary.in_progress})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className={inProgress.length === 0 ? 'p-6 pt-0' : 'p-0'}>
                    {inProgress.length === 0 ? (
                        <EmptyState
                            icon={Stethoscope}
                            title={t('reception.sections.inProgress.empty')}
                        />
                    ) : (
                        <ul className="divide-y">
                            {inProgress.map((row) => (
                                <li
                                    key={row.id}
                                    className="flex items-center justify-between p-4"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {row.patient?.name ?? '—'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {row.doctor?.name ?? '—'} ·{' '}
                                            {t('reception.sections.inProgress.startedAt')}{' '}
                                            {formatTime(row.scheduled_for)}
                                        </p>
                                    </div>
                                    <StatusBadge variant="info">
                                        {row.status_label}
                                    </StatusBadge>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {/* Section 3 — Pending payment */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-h4">
                        <span>{t('reception.sections.pendingPayment.title')}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            ({summary.pending_payment})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className={completed.length === 0 ? 'p-6 pt-0' : 'p-0'}>
                    {completed.length === 0 ? (
                        <EmptyState
                            icon={CheckCircle2}
                            title={t('reception.sections.pendingPayment.empty')}
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('appointments.queue.columns.patient')}</TableHead>
                                    <TableHead>
                                        {t('reception.sections.payment.visitType')}
                                    </TableHead>
                                    <TableHead className="text-end">
                                        {t('reception.sections.payment.total')}
                                    </TableHead>
                                    <TableHead>{t('appointments.queue.columns.status')}</TableHead>
                                    <TableHead className="text-end">
                                        {t('appointments.queue.columns.actions')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {completed.map((row) => (
                                    <TableRow key={row.id}>
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
                                                {row.doctor ?? ''}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {row.visit_type
                                                ? t(
                                                      `reception.sections.payment.${row.visit_type === 'first' ? 'firstVisit' : 'reviewVisit'}`,
                                                  )
                                                : '—'}
                                            {row.billing &&
                                                row.billing.services.length > 0 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        +{row.billing.services.length}{' '}
                                                        {t('reception.sections.payment.services')}
                                                    </p>
                                                )}
                                        </TableCell>
                                        <TableCell className="text-end font-mono text-sm">
                                            {row.billing
                                                ? formatPrice(row.billing.total)
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                variant={row.is_paid ? 'success' : 'warning'}
                                            >
                                                {row.is_paid
                                                    ? t('reception.sections.payment.paid')
                                                    : t('reception.sections.payment.pending')}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            {!row.is_paid && row.patient && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => setPaymentTarget(row)}
                                                >
                                                    {t('reception.sections.payment.record')}
                                                </Button>
                                            )}
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

            {paymentTarget && paymentTarget.patient && (
                <PaymentForm
                    open={paymentTarget !== null}
                    onOpenChange={(o) => !o && setPaymentTarget(null)}
                    patientId={paymentTarget.patient.id}
                    appointmentId={paymentTarget.id}
                    prefill={paymentPrefill}
                />
            )}
        </AppLayout>
    );
}
