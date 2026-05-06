import { router } from '@inertiajs/react';
import {
    Activity,
    Building2,
    CreditCard,
    LifeBuoy,
    RefreshCcw,
    UsersRound,
} from 'lucide-react';
import {
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';

import { LoadingSpinner } from '@/Components/domain/LoadingSpinner';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import CentralLayout from '@/Layouts/CentralLayout';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import type { AuditLog, PlatformStats, ResourceCollection } from '@/types/central';
import { useState } from 'react';

type Props = {
    stats: PlatformStats;
    clinicsByMonth: { month: string; label: string; count: number }[];
    planDistribution: { name: string; value: number }[];
    recentActivity: ResourceCollection<AuditLog>;
};

const PIE_COLORS = [
    'rgb(0, 102, 255)',
    'rgb(74, 222, 128)',
    'rgb(245, 158, 11)',
    'rgb(139, 92, 246)',
    'rgb(148, 163, 184)',
];

function formatTimeAgo(iso: string | null): string {
    if (!iso) return '—';
    const date = new Date(iso);
    const diff = Date.now() - date.getTime();
    const mins = Math.round(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    return `${days}d ago`;
}

export default function CentralDashboard({
    stats,
    clinicsByMonth,
    planDistribution,
    recentActivity,
}: Props) {
    const { t } = useTranslation('central');
    const [refreshing, setRefreshing] = useState(false);
    useFlashToasts();

    const refresh = () => {
        setRefreshing(true);
        router.post(
            '/api/aggregate-stats',
            {},
            {
                preserveScroll: true,
                onFinish: () => setRefreshing(false),
            },
        );
    };

    const cards = [
        {
            label: t('dashboard.stats.totalClinics'),
            value: stats.total_clinics,
            sublabel: `${stats.active_clinics} active`,
            icon: Building2,
        },
        {
            label: t('dashboard.stats.activeSubscriptions'),
            value: stats.active_subscriptions,
            icon: CreditCard,
        },
        {
            label: t('dashboard.stats.totalPatients'),
            value: stats.total_patients ?? '—',
            sublabel: stats.generated_at
                ? t('dashboard.lastRefreshed', { when: formatTimeAgo(stats.generated_at) })
                : t('dashboard.neverRefreshed'),
            icon: UsersRound,
        },
        {
            label: t('dashboard.stats.openTickets'),
            value: stats.open_tickets,
            icon: LifeBuoy,
        },
    ];

    return (
        <CentralLayout
            title={t('dashboard.title')}
            pageTitle={t('dashboard.title')}
            description={t('dashboard.subtitle')}
            actions={
                <Button onClick={refresh} disabled={refreshing} variant="outline">
                    {refreshing ? (
                        <LoadingSpinner size="sm" className="me-2" />
                    ) : (
                        <RefreshCcw className="me-2 h-4 w-4" />
                    )}
                    {t('dashboard.refresh')}
                </Button>
            }
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
                                {card.sublabel && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {card.sublabel}
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
                        <CardTitle>{t('dashboard.charts.newClinics')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={clinicsByMonth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                                <XAxis
                                    dataKey="label"
                                    stroke="rgb(var(--muted-foreground))"
                                    fontSize={12}
                                />
                                <YAxis
                                    stroke="rgb(var(--muted-foreground))"
                                    fontSize={12}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgb(var(--popover))',
                                        border: '1px solid rgb(var(--border))',
                                        borderRadius: '8px',
                                        color: 'rgb(var(--popover-foreground))',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="rgb(var(--primary))"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.charts.planDistribution')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        {planDistribution.length === 0 ? (
                            <p className="text-sm text-muted-foreground">—</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={planDistribution}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        label
                                    >
                                        {planDistribution.map((_, idx) => (
                                            <Cell
                                                key={idx}
                                                fill={PIE_COLORS[idx % PIE_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgb(var(--popover))',
                                            border: '1px solid rgb(var(--border))',
                                            borderRadius: '8px',
                                            color: 'rgb(var(--popover-foreground))',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {recentActivity.data.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {t('dashboard.noActivity')}
                        </p>
                    ) : (
                        <ul className="divide-y">
                            {recentActivity.data.map((log) => (
                                <li key={log.id} className="flex items-baseline justify-between gap-3 py-2">
                                    <div className="min-w-0">
                                        <p className="truncate font-mono text-xs text-foreground">
                                            {log.action}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {log.user?.email ?? 'system'}
                                            {log.auditable_type
                                                ? ` · ${log.auditable_type.split('\\').pop()} #${log.auditable_id}`
                                                : ''}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {formatTimeAgo(log.created_at)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </CentralLayout>
    );
}
