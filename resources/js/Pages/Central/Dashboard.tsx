import { Building2, CreditCard, LifeBuoy, Wallet } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import CentralLayout from '@/Layouts/CentralLayout';
import { useFlashToasts } from '@/Hooks/useFlashToasts';

type Stat = {
    labelKey: string;
    value: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const stats: Stat[] = [
    { labelKey: 'central.stats.clinics', value: '12', icon: Building2 },
    { labelKey: 'central.stats.subscriptions', value: '11', icon: CreditCard },
    { labelKey: 'central.stats.supportTickets', value: '3', icon: LifeBuoy },
    { labelKey: 'central.stats.revenue', value: '$24,800', icon: Wallet },
];

export default function CentralDashboard() {
    const { t } = useTranslation('dashboard');
    useFlashToasts();

    return (
        <CentralLayout title={t('central.title')} pageTitle={t('central.title')}>
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
        </CentralLayout>
    );
}
