import { Head, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import CentralLayout from '@/Layouts/CentralLayout';
import type { PageProps } from '@/types';

import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    mustVerifyEmail,
    status,
    twoFactorEnabled,
}: PageProps<{
    mustVerifyEmail: boolean;
    status?: string;
    twoFactorEnabled: boolean;
}>) {
    const { t } = useTranslation('auth');
    const { props } = usePage<PageProps>();
    const Layout = props.auth.isSuperAdmin ? CentralLayout : AppLayout;

    return (
        <Layout
            title={t('profile.title')}
            pageTitle={t('profile.title')}
            description={t('profile.subtitle')}
        >
            <Head title={t('profile.title')} />

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('profile.info.title')}</CardTitle>
                        <CardDescription>{t('profile.info.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('profile.twoFactor.title')}</CardTitle>
                        <CardDescription>{t('profile.twoFactor.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm">
                            <span className="text-muted-foreground">Status: </span>
                            <span
                                className={
                                    twoFactorEnabled
                                        ? 'font-medium text-success'
                                        : 'font-medium text-warning'
                                }
                            >
                                {twoFactorEnabled
                                    ? t('profile.twoFactor.enabled')
                                    : t('profile.twoFactor.disabled')}
                            </span>
                        </p>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/two-factor">
                                {twoFactorEnabled
                                    ? t('profile.twoFactor.manage')
                                    : t('profile.twoFactor.setup')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>{t('profile.password.title')}</CardTitle>
                        <CardDescription>{t('profile.password.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UpdatePasswordForm />
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
