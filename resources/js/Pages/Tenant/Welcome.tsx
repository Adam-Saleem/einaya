import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';

interface Props {
    tenantId: string;
}

export default function TenantWelcome({ tenantId }: Props) {
    const { t } = useTranslation('common');

    return (
        <>
            <Head title="Clinic" />
            <div className="flex min-h-screen items-center justify-center bg-background p-6">
                <div className="space-y-4 text-center">
                    <h1 className="text-h1 text-foreground">{t('app.name')}</h1>
                    <p className="text-base text-muted-foreground">{tenantId}</p>
                    <Button asChild>
                        <Link href="/login">{t('actions.open')}</Link>
                    </Button>
                </div>
            </div>
        </>
    );
}
