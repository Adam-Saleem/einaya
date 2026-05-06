import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';

export default function UpdatePasswordForm({ className = '' }: { className?: string }) {
    const { t } = useTranslation('auth');
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();
        put('/password', {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <form onSubmit={updatePassword} className={`space-y-4 ${className}`}>
            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="current_password">{t('profile.password.current')}</Label>
                    <Input
                        id="current_password"
                        ref={currentPasswordInput}
                        type="password"
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        autoComplete="current-password"
                    />
                    {errors.current_password && (
                        <p className="text-xs text-destructive">{errors.current_password}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">{t('profile.password.new')}</Label>
                    <Input
                        id="password"
                        ref={passwordInput}
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                    />
                    {errors.password && (
                        <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">
                        {t('profile.password.confirm')}
                    </Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                    />
                    {errors.password_confirmation && (
                        <p className="text-xs text-destructive">
                            {errors.password_confirmation}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={processing}>
                    {t('profile.password.save')}
                </Button>
                {recentlySuccessful && (
                    <p className="text-sm text-muted-foreground">
                        {t('profile.info.saved')}
                    </p>
                )}
            </div>
        </form>
    );
}
