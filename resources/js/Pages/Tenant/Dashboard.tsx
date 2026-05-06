import { Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    ClipboardPlus,
    CreditCard,
    UserPlus,
    UsersRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';
import type { DashboardProps } from '@/types/tenant';

function formatTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString();
}

export default function Dashboard(props: DashboardProps) {
    const { t } = useTranslation('tenant');
    const { props: page } = usePage<PageProps>();
    useFlashToasts();

    const userName = page.auth.user?.name ?? '';
    const { stats, upcomingToday, recentPatients } = props;

    const cards = [
        {
            label: t('dashboard.todayAppointments'),
            value: stats.today_appointments.total,
            sub: t('dashboard.todayBreakdown', {
                completed: stats.today_appointments.by_status.completed ?? 0,
                arrived: stats.today_appointments.by_status.arrived ?? 0,
                pending: stats.today_appointments.by_status.pending ?? 0,
            }),
            icon: Calendar,
        },
        {
            label: t('dashboard.patientsThisMonth'),
            value: stats.patients_this_month.total,
            sub: t('dashboard.newReturning', {
                new: stats.patients_this_month.new,
                returning: stats.patients_this_month.returning,
            }),
            icon: UsersRound,
        },
        {
            label: t('dashboard.revenueThisMonth'),
            value: stats.revenue_this_month.toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }),
            sub: null,
            icon: CreditCard,
        },
        {
            label: t('dashboard.pendingFollowups'),
            value: stats.pending_followups,
            sub: null,
            icon: ClipboardPlus,
        },
    ];

    return (
        <AppLayout
            title={t('dashboard.title', { name: userName })}
            pageTitle={t('dashboard.title', { name: userName })}
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.label}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {card.label}
                                </CardTitle>
                                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                                    <Icon className="h-4 w-4" />
                                </span>
                            </CardHeader>
                            <CardContent>
                                <p className="text-h2">{card.value}</p>
                                {card.sub && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {card.sub}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('dashboard.todaySchedule')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingToday.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.noAppointmentsToday')}
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {upcomingToday.map((appt) => (
                                    <li
                                        key={appt.id}
                                        className="flex items-center justify-between py-3"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold">
                                                {appt.patient?.name ?? '—'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {appt.patient?.patient_code} ·{' '}
                                                {appt.doctor ?? '—'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                {appt.status}
                                            </span>
                                            <span className="font-mono text-sm font-medium">
                                                {formatTime(appt.starts_at)}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.recentPatients')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentPatients.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.noRecentPatients')}
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {recentPatients.map((p) => (
                                    <li
                                        key={p.id}
                                        className="flex items-center justify-between py-3"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold">{p.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {p.patient_code}
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(p.created_at)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('dashboard.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    <Button asChild variant="outline">
                        <Link href="/patients">
                            <UserPlus className="me-2 h-4 w-4" />
                            {t('dashboard.addPatient')}
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/appointments">
                            <Calendar className="me-2 h-4 w-4" />
                            {t('dashboard.bookAppointment')}
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/consultations">
                            <ClipboardPlus className="me-2 h-4 w-4" />
                            {t('dashboard.startConsultation')}
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
