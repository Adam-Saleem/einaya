import { Link, useForm, usePage } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import type { PageProps } from '@/types';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const { t } = useTranslation('auth');
    const user = usePage<PageProps>().props.auth.user!;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch('/profile', { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className={`space-y-4 ${className}`}>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">{t('profile.info.name')}</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        autoComplete="name"
                    />
                    {errors.name && (
                        <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">{t('profile.info.email')}</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="username"
                    />
                    {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                </div>
            </div>

            {mustVerifyEmail && user.email_verified_at === null && (
                <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
                    <p className="text-foreground">
                        {t('profile.info.unverified')}{' '}
                        <Link
                            href="/email/verification-notification"
                            method="post"
                            as="button"
                            className="text-primary underline hover:no-underline"
                        >
                            {t('profile.info.resend')}
                        </Link>
                    </p>
                    {status === 'verification-link-sent' && (
                        <p className="mt-1 font-medium text-success">
                            {t('profile.info.verificationSent')}
                        </p>
                    )}
                </div>
            )}

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={processing}>
                    {t('profile.info.save')}
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
