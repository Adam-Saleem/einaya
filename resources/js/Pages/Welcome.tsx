import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function Welcome() {
    const { t } = useTranslation('common');

    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen items-center justify-center bg-background p-6">
                <div className="text-center">
                    <h1 className="text-display text-foreground">{t('app.name')}</h1>
                    <p className="mt-3 text-base text-muted-foreground">
                        {t('app.tagline')}
                    </p>
                </div>
            </div>
        </>
    );
}
