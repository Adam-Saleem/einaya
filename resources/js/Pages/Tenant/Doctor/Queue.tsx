import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import { cn } from '@/lib/utils';

type QueueRow = {
    id: number;
    queue_number: number | null;
    scheduled_for: string | null;
    arrived_at: string | null;
    status: string;
    patient: {
        id: number;
        patient_code: string;
        name: string;
        phone: string;
    } | null;
};

type Props = { queue: QueueRow[] };

function fmtTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function waitMinutes(arrivedIso: string | null): number | null {
    if (!arrivedIso) return null;
    return Math.max(0, Math.floor((Date.now() - new Date(arrivedIso).getTime()) / 60000));
}

function waitColor(minutes: number | null): string {
    if (minutes === null) return 'text-muted-foreground';
    if (minutes < 15) return 'text-success';
    if (minutes < 30) return 'text-warning';
    return 'text-destructive';
}

export default function Queue({ queue }: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    // Auto-refresh every 30s — secretaries mark patients arrived in
    // parallel, so the doctor's view goes stale fast.
    useEffect(() => {
        const id = setInterval(() => {
            router.reload({ only: ['queue'] });
        }, 30_000);
        return () => clearInterval(id);
    }, []);

    const [startingId, setStartingId] = useState<number | null>(null);
    const start = (patientId: number, appointmentId: number) => {
        if (startingId !== null) return;
        setStartingId(appointmentId);
        router.post(
            '/consultations',
            { patient_id: patientId, appointment_id: appointmentId },
            { onFinish: () => setStartingId(null) },
        );
    };

    return (
        <AppLayout
            title={t('doctorPanel.queue.title')}
            pageTitle={t('doctorPanel.queue.title')}
            description={t('doctorPanel.queue.subtitle')}
        >
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('doctorPanel.queue.queue')}</TableHead>
                                <TableHead>{t('doctorPanel.queue.patient')}</TableHead>
                                <TableHead>{t('doctorPanel.queue.scheduled')}</TableHead>
                                <TableHead>{t('doctorPanel.queue.arrived')}</TableHead>
                                <TableHead>{t('doctorPanel.queue.waited')}</TableHead>
                                <TableHead className="text-end">
                                    {t('doctorPanel.queue.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {queue.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        —
                                    </TableCell>
                                </TableRow>
                            ) : (
                                queue.map((row) => {
                                    const wait = waitMinutes(row.arrived_at);
                                    return (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-mono text-h3">
                                                {row.queue_number ?? '?'}
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium">{row.patient?.name ?? '—'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {row.patient?.patient_code} · {row.patient?.phone}
                                                </p>
                                            </TableCell>
                                            <TableCell>{fmtTime(row.scheduled_for)}</TableCell>
                                            <TableCell>{fmtTime(row.arrived_at)}</TableCell>
                                            <TableCell className={cn('font-mono', waitColor(wait))}>
                                                {wait !== null ? `${wait}m` : '—'}
                                            </TableCell>
                                            <TableCell className="text-end">
                                                {row.status === 'in_progress' ? (
                                                    <Button asChild variant="outline" size="sm">
                                                        <a href={`/consultations/${row.id}`}>Resume</a>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        disabled={startingId !== null}
                                                        onClick={() =>
                                                            row.patient &&
                                                            start(row.patient.id, row.id)
                                                        }
                                                    >
                                                        {t('doctorPanel.dashboard.startConsultation')}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
