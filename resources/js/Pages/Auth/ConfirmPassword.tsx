import { Head, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ConfirmPassword() {
    const { t } = useTranslation('auth');
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/confirm-password', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            title={t('confirmPassword.title')}
            subtitle={t('confirmPassword.subtitle')}
        >
            <Head title={t('confirmPassword.title')} />

            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="password">{t('confirmPassword.password')}</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        autoFocus
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={processing}>
                    {t('confirmPassword.submit')}
                </Button>
            </form>
        </GuestLayout>
    );
}
