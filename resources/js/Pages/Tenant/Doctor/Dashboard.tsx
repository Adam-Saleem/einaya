import { Link, router } from '@inertiajs/react';
import { Calendar, ClipboardCheck, Inbox, Stethoscope, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/Components/domain/EmptyState';
import { StatusBadge } from '@/Components/domain/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import AppLayout from '@/Layouts/AppLayout';
import { formatTime } from '@/lib/dates';

type QueueRow = {
    id: number;
    queue_number: number | null;
    scheduled_for: string | null;
    status: string;
    status_label: string;
    patient: { id: number; patient_code: string; name: string; phone: string } | null;
};

type Props = {
    stats: {
        today_total: number;
        arrived: number;
        completed: number;
        patients_seen_today: number;
        pending_followups: number;
        month_consultations: number;
    };
    inProgress: {
        id: number;
        patient_name: string;
        patient_code: string;
        started_at: string | null;
    } | null;
    queue: QueueRow[];
    todaySchedule: QueueRow[];
    recentPatients: {
        consultation_id: number;
        patient_id: number;
        patient_name: string;
        patient_code: string;
        ended_at: string | null;
    }[];
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

export default function DoctorDashboard({ stats, inProgress, queue, todaySchedule, recentPatients }: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    const [startingId, setStartingId] = useState<number | null>(null);
    const startConsultation = (patientId: number, appointmentId: number) => {
        if (startingId !== null) return;
        setStartingId(appointmentId);
        router.post(
            '/consultations',
            {
                patient_id: patientId,
                appointment_id: appointmentId,
            },
            { onFinish: () => setStartingId(null) },
        );
    };

    const stat = (label: string, value: number, Icon = Calendar, sub?: string) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
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

    return (
        <AppLayout
            title={t('doctorPanel.dashboard.title')}
            pageTitle={t('doctorPanel.dashboard.title')}
            description={t('doctorPanel.dashboard.subtitle')}
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stat(
                    t('doctorPanel.dashboard.stats.todayTotal'),
                    stats.today_total,
                    Calendar,
                    `${stats.arrived} arrived · ${stats.completed} completed`,
                )}
                {stat(t('doctorPanel.dashboard.stats.patientsSeenToday'), stats.patients_seen_today, Users)}
                {stat(t('doctorPanel.dashboard.stats.pendingFollowups'), stats.pending_followups, ClipboardCheck)}
                {stat(t('doctorPanel.dashboard.stats.monthConsultations'), stats.month_consultations, Stethoscope)}
            </div>

            {inProgress && (
                <Card className="border-primary/40">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{t('doctorPanel.dashboard.nowServing')}</CardTitle>
                        <Button asChild>
                            <Link href={`/consultations/${inProgress.id}`}>
                                {t('doctorPanel.dashboard.resume')}
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <p className="text-h3">{inProgress.patient_name}</p>
                        <p className="text-sm text-muted-foreground">
                            started {formatTime(inProgress.started_at)}
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('doctorPanel.dashboard.queue')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {queue.length === 0 ? (
                            <EmptyState
                                icon={Inbox}
                                title={t('doctorPanel.dashboard.noQueue')}
                            />
                        ) : (
                            <ul className="divide-y">
                                {queue.map((row) => (
                                    <li key={row.id} className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-mono text-accent-foreground">
                                                {row.queue_number ?? '?'}
                                            </span>
                                            <div>
                                                <p className="font-medium">{row.patient?.name ?? '—'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatTime(row.scheduled_for)}
                                                    {row.patient?.phone && ` · ${row.patient.phone}`}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={startingId !== null}
                                            onClick={() =>
                                                row.patient &&
                                                startConsultation(row.patient.id, row.id)
                                            }
                                        >
                                            {t('doctorPanel.dashboard.startConsultation')}
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('doctorPanel.dashboard.recentPatients')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentPatients.length === 0 ? (
                            <p className="text-sm text-muted-foreground">—</p>
                        ) : (
                            <ul className="divide-y">
                                {recentPatients.map((p) => (
                                    <li
                                        key={p.consultation_id}
                                        className="flex items-center justify-between py-2"
                                    >
                                        <Link
                                            href={`/patients/${p.patient_id}`}
                                            className="font-medium hover:text-primary"
                                        >
                                            {p.patient_name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('doctorPanel.dashboard.todaySchedule')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {todaySchedule.length === 0 ? (
                        <p className="text-sm text-muted-foreground">—</p>
                    ) : (
                        <ul className="divide-y">
                            {todaySchedule.map((row) => (
                                <li key={row.id} className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-sm">
                                            {formatTime(row.scheduled_for)}
                                        </span>
                                        <span className="font-medium">
                                            {row.patient?.name ?? '—'}
                                        </span>
                                    </div>
                                    <StatusBadge variant={STATUS_VARIANT[row.status] ?? 'neutral'}>
                                        {row.status_label}
                                    </StatusBadge>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
