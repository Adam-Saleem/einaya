import { Head, Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { t } = useTranslation('auth');
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout title={t('login.title')} subtitle={t('login.subtitle')}>
            <Head title={t('login.title')} />

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
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t('login.password')}</Label>
                        {canResetPassword && (
                            <Link
                                href="/forgot-password"
                                className="text-xs text-primary hover:underline"
                            >
                                {t('login.forgot')}
                            </Link>
                        )}
                    </div>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && (
                        <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                </div>

                <label className="flex items-center gap-2">
                    <Checkbox
                        checked={data.remember}
                        onCheckedChange={(v) => setData('remember', v === true)}
                    />
                    <span className="text-sm text-muted-foreground">
                        {t('login.remember')}
                    </span>
                </label>

                <Button type="submit" className="w-full" disabled={processing}>
                    {t('login.submit')}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                    {t('login.noAccount')}
                </p>
            </form>
        </GuestLayout>
    );
}
