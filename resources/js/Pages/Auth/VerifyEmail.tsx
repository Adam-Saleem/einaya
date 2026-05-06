import { Head, Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';

export default function VerifyEmail({ status }: { status?: string }) {
    const { t } = useTranslation('auth');
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/email/verification-notification');
    };

    return (
        <GuestLayout title={t('verifyEmail.title')} subtitle={t('verifyEmail.body')}>
            <Head title={t('verifyEmail.title')} />

            {status === 'verification-link-sent' && (
                <Alert>
                    <AlertDescription>{t('verifyEmail.sent')}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Button type="submit" className="w-full" disabled={processing}>
                    {t('verifyEmail.resend')}
                </Button>

                <p className="text-center">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                        {t('logout')}
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
