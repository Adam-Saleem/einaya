import { Head, Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { t } = useTranslation('auth');
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <GuestLayout
            title={t('forgotPassword.title')}
            subtitle={t('forgotPassword.subtitle')}
        >
            <Head title={t('forgotPassword.title')} />

            {status && (
                <Alert>
                    <AlertDescription>{status}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">{t('login.email')}</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoFocus
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    {t('forgotPassword.submit')}
                </Button>

                <p className="text-center">
                    <Link
                        href="/login"
                        className="text-xs text-primary hover:underline"
                    >
                        {t('forgotPassword.back')}
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
