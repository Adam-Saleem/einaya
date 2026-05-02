import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Props = {
    enabled: boolean;
    pendingConfirmation: boolean;
};

type FlashTwoFactor = {
    qr_svg: string;
    secret: string;
    otpauth_url: string;
};

export default function TwoFactorSetup({
    enabled,
    pendingConfirmation,
}: Props) {
    const page = usePage<{
        flash?: {
            two_factor?: FlashTwoFactor;
            recovery_codes?: string[];
            status?: string;
        };
    }>();
    const flash = page.props.flash ?? {};

    const confirm = useForm({ code: '' });

    const startEnable = () => {
        router.post('/two-factor', {}, { preserveScroll: true });
    };

    const submitConfirm: FormEventHandler = (e) => {
        e.preventDefault();
        confirm.post('/two-factor/confirm', {
            preserveScroll: true,
            onSuccess: () => confirm.reset('code'),
        });
    };

    const regenerateCodes = () => {
        router.post('/two-factor/recovery-codes', {}, { preserveScroll: true });
    };

    const disable = () => {
        if (!confirm) return;
        router.delete('/two-factor', { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Two-Factor Authentication
                </h2>
            }
        >
            <Head title="Two-Factor Authentication" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow sm:rounded-lg dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Status:{' '}
                            <span
                                className={
                                    enabled
                                        ? 'text-green-600'
                                        : 'text-yellow-600'
                                }
                            >
                                {enabled
                                    ? 'Enabled'
                                    : pendingConfirmation
                                      ? 'Pending Confirmation'
                                      : 'Disabled'}
                            </span>
                        </h3>

                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Two-factor authentication adds a second step to
                            sign-in using an authenticator app such as Google
                            Authenticator, Authy, or 1Password.
                        </p>

                        {!enabled && !pendingConfirmation && (
                            <div className="mt-4">
                                <PrimaryButton onClick={startEnable}>
                                    Enable Two-Factor
                                </PrimaryButton>
                            </div>
                        )}
                    </div>

                    {flash.two_factor && (
                        <div className="bg-white p-6 shadow sm:rounded-lg dark:bg-gray-800">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Scan the QR code
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Scan with your authenticator app, or enter the
                                secret manually:
                            </p>

                            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                                <img
                                    src={flash.two_factor.qr_svg}
                                    alt="2FA QR code"
                                    className="h-60 w-60 rounded bg-white p-2"
                                />
                                <div>
                                    <p className="font-mono text-sm text-gray-700 dark:text-gray-200">
                                        {flash.two_factor.secret}
                                    </p>
                                </div>
                            </div>

                            <form
                                onSubmit={submitConfirm}
                                className="mt-6 max-w-sm space-y-3"
                            >
                                <InputLabel htmlFor="code" value="Enter the 6-digit code" />
                                <TextInput
                                    id="code"
                                    inputMode="numeric"
                                    value={confirm.data.code}
                                    onChange={(e) =>
                                        confirm.setData('code', e.target.value)
                                    }
                                    className="block w-full"
                                    autoComplete="one-time-code"
                                />
                                <InputError
                                    message={confirm.errors.code}
                                    className="mt-2"
                                />
                                <PrimaryButton disabled={confirm.processing}>
                                    Confirm
                                </PrimaryButton>
                            </form>
                        </div>
                    )}

                    {Array.isArray(flash.recovery_codes) &&
                        flash.recovery_codes.length > 0 && (
                            <div className="bg-yellow-50 p-6 shadow sm:rounded-lg dark:bg-yellow-900/30">
                                <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-200">
                                    Save your recovery codes
                                </h3>
                                <p className="mt-2 text-sm text-yellow-800 dark:text-yellow-200">
                                    These codes are shown only once. Each code
                                    can be used a single time if you lose access
                                    to your authenticator.
                                </p>
                                <pre className="mt-4 rounded bg-yellow-100 p-4 font-mono text-sm dark:bg-yellow-900/50">
                                    {flash.recovery_codes.join('\n')}
                                </pre>
                            </div>
                        )}

                    {(enabled || pendingConfirmation) && (
                        <div className="bg-white p-6 shadow sm:rounded-lg dark:bg-gray-800">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Manage
                            </h3>
                            <div className="mt-4 flex flex-wrap gap-3">
                                {enabled && (
                                    <SecondaryButton onClick={regenerateCodes}>
                                        Regenerate Recovery Codes
                                    </SecondaryButton>
                                )}
                                <DangerButton onClick={disable}>
                                    Disable Two-Factor
                                </DangerButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
