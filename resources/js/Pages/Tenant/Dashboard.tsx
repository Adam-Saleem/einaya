import { usePage } from '@inertiajs/react';
import { Calendar, CreditCard, Stethoscope, UsersRound } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import type { PageProps } from '@/types';

type Stat = {
    labelKey: string;
    value: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const stats: Stat[] = [
    { labelKey: 'stats.patients', value: '128', icon: UsersRound },
    { labelKey: 'stats.appointmentsToday', value: '12', icon: Calendar },
    { labelKey: 'stats.consultationsThisWeek', value: '34', icon: Stethoscope },
    { labelKey: 'stats.pendingPayments', value: '6', icon: CreditCard },
];

export default function Dashboard() {
    const { t } = useTranslation('dashboard');
    const { props } = usePage<PageProps>();
    useFlashToasts();

    const userName = props.auth.user?.name ?? '';

    return (
        <AppLayout
            title={t('welcome', { name: userName })}
            pageTitle={t('welcome', { name: userName })}
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.labelKey}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {t(stat.labelKey)}
                                </CardTitle>
                                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                                    <Icon className="h-4 w-4" />
                                </span>
                            </CardHeader>
                            <CardContent>
                                <p className="text-h2">{stat.value}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </AppLayout>
    );
}
