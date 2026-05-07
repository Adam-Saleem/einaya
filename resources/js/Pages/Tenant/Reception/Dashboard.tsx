import { Link, router } from '@inertiajs/react';
import { CalendarOff, CreditCard, Plus, RotateCcw, UserPen } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/Components/domain/ConfirmDialog';
import { EmptyState } from '@/Components/domain/EmptyState';
import { NewAppointmentDialog } from '@/Components/domain/NewAppointmentDialog';
import { PatientDetailsDialog } from '@/Components/domain/PatientDetailsDialog';
import { PaymentForm } from '@/Components/domain/PaymentForm';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
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

type Bucket = 'scheduled' | 'waiting' | 'engaged' | 'checkout' | 'cancelled';
type Filter = Bucket | 'all';

type Appointment = {
    id: number;
    scheduled_for: string | null;
    status: string;
    status_label: string;
    queue_number: number | null;
    patient: {
        id: number;
        patient_code: string;
        name: string;
        phone: string;
        has_allergies?: boolean;
        has_chronic?: boolean;
    } | null;
    doctor: { id: number; name: string | null } | null;
};

type BillingSummary = {
    visit_type: 'first' | 'review' | null;
    base_price: number;
    services: { id: number; name: string; price: number; quantity: number; line_total: number }[];
    services_total: number;
    total: number;
    is_paid: boolean;
    consultation_id: number | null;
};

type Doctor = {
    id: number;
    name: string | null;
    consultation_duration_minutes: number;
};

type Props = {
    date: string;
    counts: Record<Bucket, number>;
    appointments: Appointment[];
    billingByAppointmentId: Record<number, BillingSummary>;
    doctors: Doctor[];
};

const BUCKETS: { id: Bucket; tone: string; rowTone: string }[] = [
    {
        id: 'scheduled',
        tone: 'border-muted-foreground/20 bg-muted text-muted-foreground',
        rowTone: 'bg-background',
    },
    {
        id: 'waiting',
        tone: 'border-warning/40 bg-warning/15 text-warning',
        rowTone: 'bg-warning/10 hover:bg-warning/15',
    },
    {
        id: 'engaged',
        tone: 'border-success/40 bg-success/15 text-success',
        rowTone: 'bg-success/10 hover:bg-success/15',
    },
    {
        id: 'checkout',
        tone: 'border-secondary bg-secondary text-secondary-foreground',
        rowTone: 'bg-secondary/40 hover:bg-secondary/50',
    },
    {
        id: 'cancelled',
        tone: 'border-destructive/30 bg-destructive/10 text-destructive',
        rowTone: 'bg-destructive/5 hover:bg-destructive/10',
    },
];

function bucketOf(status: string): Bucket {
    if (status === 'pending' || status === 'confirmed') return 'scheduled';
    if (status === 'arrived') return 'waiting';
    if (status === 'in_progress') return 'engaged';
    if (status === 'completed') return 'checkout';
    return 'cancelled';
}

const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(n);

export default function ReceptionDashboard({
    date,
    counts,
    appointments,
    billingByAppointmentId,
    doctors,
}: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    const [filter, setFilter] = useState<Filter>('all');
    const [newApptOpen, setNewApptOpen] = useState(false);
    const [confirm, setConfirm] = useState<
        { kind: 'cancel' | 'no_show'; appointment: Appointment } | null
    >(null);
    const [paymentTarget, setPaymentTarget] = useState<Appointment | null>(null);
    const [detailsId, setDetailsId] = useState<number | null>(null);

    const visible = useMemo(() => {
        if (filter === 'all') return appointments;
        return appointments.filter((a) => bucketOf(a.status) === filter);
    }, [appointments, filter]);

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
        if (!paymentTarget) return undefined;
        const billing = billingByAppointmentId[paymentTarget.id];
        if (!billing) return undefined;
        const breakdown: { label: string; value: number }[] = [];
        if (billing.base_price > 0) {
            breakdown.push({
                label:
                    billing.visit_type === 'first'
                        ? t('reception.sections.payment.firstVisit')
                        : t('reception.sections.payment.reviewVisit'),
                value: billing.base_price,
            });
        }
        for (const s of billing.services) {
            breakdown.push({ label: s.name, value: s.line_total });
        }
        return { amount: billing.total, breakdown };
    }, [paymentTarget, billingByAppointmentId, t]);

    return (
        <AppLayout
            title={t('reception.title')}
            pageTitle={t('reception.title')}
            description={t('reception.summaryAll', { count: appointments.length })}
            actions={
                <Button size="lg" onClick={() => setNewApptOpen(true)}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('reception.actions.newAppointment')}
                </Button>
            }
        >
            <Card>
                <CardContent className="flex flex-wrap items-end gap-3 p-4">
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            {t('reception.dateLabel')}
                        </p>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) =>
                                router.get(
                                    '/reception',
                                    { date: e.target.value },
                                    { preserveState: true, preserveScroll: true, replace: true },
                                )
                            }
                            className="w-44"
                        />
                    </div>
                    <div className="ms-auto flex flex-wrap gap-2">
                        {BUCKETS.map((b) => {
                            const active = filter === b.id;
                            return (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => setFilter(active ? 'all' : b.id)}
                                    className={`flex flex-col items-center rounded-lg border px-4 py-2 transition ${b.tone} ${
                                        active
                                            ? 'ring-2 ring-foreground/40 ring-offset-2 ring-offset-background'
                                            : 'opacity-90 hover:opacity-100'
                                    }`}
                                >
                                    <span className="text-xs font-semibold uppercase tracking-wide">
                                        {t(`reception.filters.${b.id}`)}
                                    </span>
                                    <span className="text-h3 font-bold leading-none">
                                        {counts[b.id]}
                                    </span>
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className={`flex flex-col items-center rounded-lg border border-success/40 bg-success/10 px-4 py-2 text-success transition ${
                                filter === 'all'
                                    ? 'ring-2 ring-foreground/40 ring-offset-2 ring-offset-background'
                                    : 'opacity-90 hover:opacity-100'
                            }`}
                        >
                            <span className="text-xs font-semibold uppercase tracking-wide">
                                {t('reception.filters.reset')}
                            </span>
                            <span className="flex items-center gap-1 text-sm font-bold">
                                <RotateCcw className="h-3.5 w-3.5" />
                                {t('reception.filters.viewAll')}
                            </span>
                        </button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className={visible.length === 0 ? 'p-6' : 'p-0'}>
                    {visible.length === 0 ? (
                        <EmptyState
                            icon={CalendarOff}
                            title={t('reception.emptyForDate')}
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
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>{t('appointments.queue.columns.patient')}</TableHead>
                                    <TableHead>{t('appointments.queue.columns.scheduled')}</TableHead>
                                    <TableHead>{t('appointments.queue.columns.status')}</TableHead>
                                    <TableHead className="text-end">
                                        {t('reception.column.action')}
                                    </TableHead>
                                    <TableHead className="text-end">
                                        {t('appointments.queue.columns.actions')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visible.map((row) => {
                                    const bucket = bucketOf(row.status);
                                    const tone = BUCKETS.find((b) => b.id === bucket)?.rowTone ?? '';
                                    const billing = billingByAppointmentId[row.id];
                                    return (
                                        <TableRow key={row.id} className={tone}>
                                            <TableCell className="font-mono text-sm">
                                                {row.queue_number ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <p className="flex items-center gap-2 font-medium">
                                                    {row.patient ? (
                                                        <Link
                                                            href={`/patients/${row.patient.id}`}
                                                            className="hover:text-primary"
                                                        >
                                                            {row.patient.name}
                                                        </Link>
                                                    ) : (
                                                        '—'
                                                    )}
                                                    {row.patient?.has_allergies && (
                                                        <span
                                                            className="inline-block h-2 w-2 rounded-full bg-destructive"
                                                            title={t('visit.flags.allergies')}
                                                        />
                                                    )}
                                                    {row.patient?.has_chronic && (
                                                        <span
                                                            className="inline-block h-2 w-2 rounded-full bg-warning"
                                                            title={t('visit.flags.chronic')}
                                                        />
                                                    )}
                                                </p>
                                                <p
                                                    className="text-xs text-muted-foreground"
                                                    dir="ltr"
                                                >
                                                    {row.patient?.phone ?? '—'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatTime(row.scheduled_for)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-semibold uppercase tracking-wide">
                                                    {row.status_label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-end">
                                                <RowAction
                                                    row={row}
                                                    billing={billing}
                                                    onMarkArrived={() =>
                                                        router.post(
                                                            `/appointments/${row.id}/arrive`,
                                                            {},
                                                            { preserveScroll: true },
                                                        )
                                                    }
                                                    onCancel={() =>
                                                        setConfirm({
                                                            kind: 'cancel',
                                                            appointment: row,
                                                        })
                                                    }
                                                    onRecordPayment={() => setPaymentTarget(row)}
                                                    t={t}
                                                />
                                            </TableCell>
                                            <TableCell className="text-end">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={t('patientDetails.title')}
                                                    onClick={() =>
                                                        row.patient && setDetailsId(row.patient.id)
                                                    }
                                                    disabled={!row.patient}
                                                >
                                                    <UserPen className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
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

            {paymentTarget?.patient && (
                <PaymentForm
                    open={paymentTarget !== null}
                    onOpenChange={(o) => !o && setPaymentTarget(null)}
                    patientId={paymentTarget.patient.id}
                    appointmentId={paymentTarget.id}
                    prefill={paymentPrefill}
                />
            )}

            <PatientDetailsDialog
                open={detailsId !== null}
                onOpenChange={(o) => !o && setDetailsId(null)}
                patientId={detailsId}
            />
        </AppLayout>
    );
}

function RowAction({
    row,
    billing,
    onMarkArrived,
    onCancel,
    onRecordPayment,
    t,
}: {
    row: Appointment;
    billing: BillingSummary | undefined;
    onMarkArrived: () => void;
    onCancel: () => void;
    onRecordPayment: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any;
}) {
    if (row.status === 'pending' || row.status === 'confirmed') {
        return (
            <div className="flex justify-end gap-1">
                <Button size="sm" onClick={onMarkArrived}>
                    {t('reception.actions.markArrived')}
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancel}>
                    {t('reception.actions.cancel')}
                </Button>
            </div>
        );
    }
    if (row.status === 'arrived') {
        return (
            <span className="text-xs text-muted-foreground">
                {t('reception.actions.waitingForDoctor')}
            </span>
        );
    }
    if (row.status === 'in_progress') {
        return <span className="text-xs text-muted-foreground">—</span>;
    }
    if (row.status === 'completed') {
        if (!billing) return <span className="text-xs text-muted-foreground">—</span>;
        if (billing.is_paid) {
            return (
                <Button size="sm" variant="outline" asChild>
                    <Link href={`/payments?appointment=${row.id}`}>
                        {t('reception.actions.receipt')}
                    </Link>
                </Button>
            );
        }
        return (
            <Button size="sm" onClick={onRecordPayment}>
                <CreditCard className="me-1.5 h-3.5 w-3.5" />
                {formatPrice(billing.total)}
            </Button>
        );
    }
    return <span className="text-xs text-muted-foreground">—</span>;
}
