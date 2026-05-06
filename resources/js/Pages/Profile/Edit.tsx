import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import CentralLayout from '@/Layouts/CentralLayout';
import { Button } from '@/Components/ui/button';
import { useDirection } from '@/Hooks/useDirection';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

import DeleteUserForm from './Partials/DeleteUserForm';
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
    const { t } = useTranslation('common');
    const { props } = usePage<PageProps>();
    // Central super admins use CentralLayout, tenant users AppLayout.
    const Layout = props.auth.isSuperAdmin ? CentralLayout : AppLayout;

    return (
        <Layout title={t('topbar.profile')} pageTitle={t('topbar.profile')}>
            <Head title={t('topbar.profile')} />

            <div className="space-y-6">
                <Card>
                    <CardContent className="p-6">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <UpdatePasswordForm className="max-w-xl" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4">Two-factor authentication</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-6 pt-0">
                        <p className="text-sm text-muted-foreground">
                            Status:{' '}
                            <span className={twoFactorEnabled ? 'font-medium text-success' : 'font-medium text-warning'}>
                                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </p>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/two-factor">
                                {twoFactorEnabled ? 'Manage' : 'Set up'}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-destructive/40">
                    <CardContent className="p-6">
                        <DeleteUserForm className="max-w-xl" />
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
