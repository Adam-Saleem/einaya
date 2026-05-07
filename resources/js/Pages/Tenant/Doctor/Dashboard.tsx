import { Link, router } from '@inertiajs/react';
import { CheckCircle2, Inbox, Play, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/Components/domain/EmptyState';
import { PatientDetailsDialog } from '@/Components/domain/PatientDetailsDialog';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import { usePending } from '@/Hooks/usePending';
import AppLayout from '@/Layouts/AppLayout';
import { formatTime } from '@/lib/dates';

type Window = '8h' | '24h' | '3d';

type Appointment = {
    id: number;
    scheduled_for: string | null;
    arrived_at?: string | null;
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
};

type Props = {
    window: Window;
    waiting: Appointment[];
    inProgress: Appointment[];
    checkout: Appointment[];
};

const WINDOWS: Window[] = ['8h', '24h', '3d'];

export default function DoctorDashboard({
    window,
    waiting,
    inProgress,
    checkout,
}: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    const [startingId, setStartingId] = useState<number | null>(null);
    const [, runStart] = usePending();
    const [detailsId, setDetailsId] = useState<number | null>(null);

    const startConsultation = (patientId: number, appointmentId: number) => {
        if (startingId !== null) return;
        setStartingId(appointmentId);
        runStart(
            (opts) =>
                router.post(
                    '/consultations',
                    { patient_id: patientId, appointment_id: appointmentId },
                    opts,
                ),
            { onFinish: () => setStartingId(null) },
        );
    };

    const setWindow = (w: Window) =>
        router.get('/doctor', { window: w }, { preserveState: true, preserveScroll: true });

    return (
        <AppLayout
            title={t('doctorPanel.dashboard.title')}
            pageTitle={t('doctorPanel.dashboard.title')}
            description={t('doctorPanel.dashboard.subtitle')}
            actions={
                <div className="inline-flex rounded-md border bg-background p-1">
                    {WINDOWS.map((w) => (
                        <button
                            key={w}
                            type="button"
                            onClick={() => setWindow(w)}
                            className={
                                window === w
                                    ? 'rounded-sm bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground'
                                    : 'rounded-sm px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground'
                            }
                        >
                            {t(`doctorPanel.dashboard.window.${w}`)}
                        </button>
                    ))}
                </div>
            }
        >
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Waiting */}
                <BucketCard
                    tone="warning"
                    title={t('doctorPanel.dashboard.waiting')}
                    icon={Inbox}
                    count={waiting.length}
                >
                    {waiting.length === 0 ? (
                        <EmptyState
                            icon={Inbox}
                            title={t('doctorPanel.dashboard.empty.waiting')}
                        />
                    ) : (
                        <ul className="space-y-2">
                            {waiting.map((row) => (
                                <li
                                    key={row.id}
                                    className="rounded-md border border-warning/30 bg-warning/10 p-3"
                                >
                                    <PatientLine row={row} t={t} onDetails={() => row.patient && setDetailsId(row.patient.id)} />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {formatTime(row.scheduled_for)}
                                        {row.arrived_at && (
                                            <>
                                                {' · '}
                                                {t('doctorPanel.dashboard.arrived')}{' '}
                                                {formatTime(row.arrived_at)}
                                            </>
                                        )}
                                    </p>
                                    <Button
                                        size="sm"
                                        className="mt-2 w-full"
                                        disabled={startingId !== null}
                                        onClick={() =>
                                            row.patient &&
                                            startConsultation(row.patient.id, row.id)
                                        }
                                    >
                                        <Play className="me-1.5 h-3.5 w-3.5" />
                                        {t('doctorPanel.dashboard.startConsultation')}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </BucketCard>

                {/* In progress */}
                <BucketCard
                    tone="success"
                    title={t('doctorPanel.dashboard.inProgress')}
                    icon={Stethoscope}
                    count={inProgress.length}
                >
                    {inProgress.length === 0 ? (
                        <EmptyState
                            icon={Stethoscope}
                            title={t('doctorPanel.dashboard.empty.inProgress')}
                        />
                    ) : (
                        <ul className="space-y-2">
                            {inProgress.map((row) => (
                                <li
                                    key={row.id}
                                    className="rounded-md border border-success/30 bg-success/10 p-3"
                                >
                                    <PatientLine row={row} t={t} onDetails={() => row.patient && setDetailsId(row.patient.id)} />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {formatTime(row.scheduled_for)}
                                    </p>
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="mt-2 w-full"
                                    >
                                        <Link href={`/consultations/${row.id}`}>
                                            {t('doctorPanel.dashboard.openVisit')}
                                        </Link>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </BucketCard>

                {/* Checkout */}
                <BucketCard
                    tone="secondary"
                    title={t('doctorPanel.dashboard.checkout')}
                    icon={CheckCircle2}
                    count={checkout.length}
                >
                    {checkout.length === 0 ? (
                        <EmptyState
                            icon={CheckCircle2}
                            title={t('doctorPanel.dashboard.empty.checkout')}
                        />
                    ) : (
                        <ul className="space-y-2">
                            {checkout.map((row) => (
                                <li
                                    key={row.id}
                                    className="rounded-md border bg-secondary/30 p-3"
                                >
                                    <PatientLine row={row} t={t} onDetails={() => row.patient && setDetailsId(row.patient.id)} />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {formatTime(row.scheduled_for)}
                                    </p>
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="ghost"
                                        className="mt-2 w-full"
                                    >
                                        <Link href={`/consultations/${row.id}`}>
                                            {t('doctorPanel.dashboard.review')}
                                        </Link>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </BucketCard>
            </div>

            <PatientDetailsDialog
                open={detailsId !== null}
                onOpenChange={(o) => !o && setDetailsId(null)}
                patientId={detailsId}
            />
        </AppLayout>
    );
}

function BucketCard({
    tone,
    title,
    icon: Icon,
    count,
    children,
}: {
    tone: 'warning' | 'success' | 'secondary';
    title: string;
    icon: typeof Inbox;
    count: number;
    children: React.ReactNode;
}) {
    const headerTone = {
        warning: 'border-warning/30 bg-warning/15 text-warning',
        success: 'border-success/30 bg-success/15 text-success',
        secondary: 'border-secondary bg-secondary text-secondary-foreground',
    }[tone];

    return (
        <Card className="overflow-hidden">
            <CardHeader className={`flex flex-row items-center justify-between gap-2 border-b ${headerTone}`}>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                    <Icon className="h-4 w-4" />
                    {title}
                </CardTitle>
                <span className="rounded-full bg-background/40 px-2 text-sm font-bold">
                    {count}
                </span>
            </CardHeader>
            <CardContent className="max-h-[480px] overflow-y-auto p-3">
                {children}
            </CardContent>
        </Card>
    );
}

function PatientLine({
    row,
    t,
    onDetails,
}: {
    row: Appointment;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any;
    onDetails: () => void;
}) {
    return (
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
                        #{row.queue_number ?? '?'}
                    </span>
                    <span className="truncate">{row.patient?.name ?? '—'}</span>
                    {row.patient?.has_allergies && (
                        <span
                            className="inline-block h-2 w-2 shrink-0 rounded-full bg-destructive"
                            title={t('visit.flags.allergies')}
                        />
                    )}
                    {row.patient?.has_chronic && (
                        <span
                            className="inline-block h-2 w-2 shrink-0 rounded-full bg-warning"
                            title={t('visit.flags.chronic')}
                        />
                    )}
                </p>
                {row.patient?.phone && (
                    <p className="text-xs text-muted-foreground" dir="ltr">
                        {row.patient.phone}
                    </p>
                )}
            </div>
            <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={t('patientDetails.title')}
                className="h-7 w-7"
                onClick={onDetails}
            >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </Button>
        </div>
    );
}
