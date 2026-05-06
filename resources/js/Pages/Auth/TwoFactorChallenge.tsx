import { Head, useForm } from '@inertiajs/react';
import { type FormEventHandler, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';

export default function TwoFactorChallenge() {
    const { t } = useTranslation('auth');
    const [useRecovery, setUseRecovery] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        recovery_code: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/two-factor/challenge', {
            onFinish: () => reset('code', 'recovery_code'),
        });
    };

    return (
        <GuestLayout
            title={t('twoFactor.title')}
            subtitle={
                useRecovery
                    ? t('twoFactor.recoveryDescription')
                    : t('twoFactor.description')
            }
        >
            <Head title={t('twoFactor.title')} />

            <form onSubmit={submit} className="space-y-4">
                {!useRecovery ? (
                    <div className="space-y-2">
                        <Label htmlFor="code">{t('twoFactor.code')}</Label>
                        <Input
                            id="code"
                            name="code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={data.code}
                            autoFocus
                            className="text-center font-mono text-lg tracking-widest"
                            onChange={(e) => setData('code', e.target.value)}
                        />
                        {errors.code && (
                            <p className="text-xs text-destructive">{errors.code}</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label htmlFor="recovery_code">
                            {t('twoFactor.recoveryCode')}
                        </Label>
                        <Input
                            id="recovery_code"
                            name="recovery_code"
                            value={data.recovery_code}
                            autoFocus
                            className="font-mono"
                            onChange={(e) =>
                                setData('recovery_code', e.target.value)
                            }
                        />
                        {errors.recovery_code && (
                            <p className="text-xs text-destructive">
                                {errors.recovery_code}
                            </p>
                        )}
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={processing}>
                    {t('twoFactor.submit')}
                </Button>

                <p className="text-center">
                    <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => {
                            setUseRecovery((v) => !v);
                            reset('code', 'recovery_code');
                        }}
                    >
                        {useRecovery
                            ? t('twoFactor.useAuthenticator')
                            : t('twoFactor.useRecovery')}
                    </button>
                </p>
            </form>
        </GuestLayout>
    );
}
