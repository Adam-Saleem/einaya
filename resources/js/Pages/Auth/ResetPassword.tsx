import { Head, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { t } = useTranslation('auth');
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout title={t('resetPassword.title')}>
            <Head title={t('resetPassword.title')} />

            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email">{t('resetPassword.email')}</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">{t('resetPassword.password')}</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoFocus
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">
                        {t('resetPassword.confirm')}
                    </Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                    />
                    {errors.password_confirmation && (
                        <p className="text-sm text-destructive">
                            {errors.password_confirmation}
                        </p>
                    )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={processing}>
                    {t('resetPassword.submit')}
                </Button>
            </form>
        </GuestLayout>
    );
}
