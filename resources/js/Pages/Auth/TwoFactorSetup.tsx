import { Head, router, useForm, usePage } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AppLayout from '@/Layouts/AppLayout';
import CentralLayout from '@/Layouts/CentralLayout';
import type { PageProps } from '@/types';

type Props = PageProps<{
    enabled: boolean;
    pendingConfirmation: boolean;
}>;

type FlashTwoFactor = {
    qr_svg: string;
    secret: string;
    otpauth_url: string;
};

export default function TwoFactorSetup({ enabled, pendingConfirmation }: Props) {
    const { t } = useTranslation('auth');
    const page = usePage<
        PageProps<{
            flash?: {
                two_factor?: FlashTwoFactor;
                recovery_codes?: string[];
                status?: string;
            };
        }>
    >();
    const flash = page.props.flash ?? {};
    const Layout = page.props.auth.isSuperAdmin ? CentralLayout : AppLayout;

    const confirm = useForm({ code: '' });

    const startEnable = () =>
        router.post('/two-factor', {}, { preserveScroll: true });

    const submitConfirm: FormEventHandler = (e) => {
        e.preventDefault();
        confirm.post('/two-factor/confirm', {
            preserveScroll: true,
            onSuccess: () => confirm.reset('code'),
        });
    };

    const regenerateCodes = () =>
        router.post('/two-factor/recovery-codes', {}, { preserveScroll: true });

    const disable = () => router.delete('/two-factor', { preserveScroll: true });

    const statusLabel = enabled
        ? t('twoFactorSetup.statusEnabled')
        : pendingConfirmation
            ? t('twoFactorSetup.statusPending')
            : t('twoFactorSetup.statusDisabled');

    return (
        <Layout
            title={t('twoFactorSetup.title')}
            pageTitle={t('twoFactorSetup.title')}
            description={t('twoFactorSetup.subtitle')}
        >
            <Head title={t('twoFactorSetup.title')} />

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-h4">
                            <span className="text-muted-foreground">
                                {t('twoFactorSetup.status')}:
                            </span>
                            <span
                                className={
                                    enabled
                                        ? 'text-success'
                                        : pendingConfirmation
                                            ? 'text-warning'
                                            : 'text-muted-foreground'
                                }
                            >
                                {statusLabel}
                            </span>
                        </CardTitle>
                        <CardDescription>{t('twoFactorSetup.subtitle')}</CardDescription>
                    </CardHeader>
                    {!enabled && !pendingConfirmation && (
                        <CardContent>
                            <Button onClick={startEnable}>
                                {t('twoFactorSetup.enable')}
                            </Button>
                        </CardContent>
                    )}
                </Card>

                {flash.two_factor && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('twoFactorSetup.qrTitle')}</CardTitle>
                            <CardDescription>
                                {t('twoFactorSetup.qrSubtitle')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-start gap-4 sm:flex-row">
                                <img
                                    src={flash.two_factor.qr_svg}
                                    alt="2FA QR code"
                                    className="h-56 w-56 rounded-md border bg-white p-2"
                                />
                                <div className="space-y-1">
                                    <p className="text-xs uppercase text-muted-foreground">
                                        Secret
                                    </p>
                                    <code className="block rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                                        {flash.two_factor.secret}
                                    </code>
                                </div>
                            </div>

                            <form
                                onSubmit={submitConfirm}
                                className="max-w-sm space-y-3"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="code">
                                        {t('twoFactorSetup.codeLabel')}
                                    </Label>
                                    <Input
                                        id="code"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        value={confirm.data.code}
                                        onChange={(e) =>
                                            confirm.setData('code', e.target.value)
                                        }
                                        className="text-center font-mono text-lg tracking-widest"
                                    />
                                    {confirm.errors.code && (
                                        <p className="text-sm text-destructive">
                                            {confirm.errors.code}
                                        </p>
                                    )}
                                </div>
                                <Button type="submit" disabled={confirm.processing}>
                                    {t('twoFactorSetup.confirm')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {Array.isArray(flash.recovery_codes) &&
                    flash.recovery_codes.length > 0 && (
                        <Alert>
                            <AlertTitle>
                                {t('twoFactorSetup.recoveryTitle')}
                            </AlertTitle>
                            <AlertDescription className="space-y-3">
                                <p>{t('twoFactorSetup.recoverySubtitle')}</p>
                                <pre className="rounded-md border bg-muted p-3 font-mono text-sm">
                                    {flash.recovery_codes.join('\n')}
                                </pre>
                            </AlertDescription>
                        </Alert>
                    )}

                {(enabled || pendingConfirmation) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('twoFactorSetup.manage')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                {enabled && (
                                    <Button variant="outline" onClick={regenerateCodes}>
                                        {t('twoFactorSetup.regenerate')}
                                    </Button>
                                )}
                                <Button variant="destructive" onClick={disable}>
                                    {t('twoFactorSetup.disable')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </Layout>
    );
}
