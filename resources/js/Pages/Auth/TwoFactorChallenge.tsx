import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function TwoFactorChallenge() {
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
        <GuestLayout>
            <Head title="Two-Factor Challenge" />

            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {useRecovery
                    ? 'Enter one of your recovery codes to continue.'
                    : 'Enter the 6-digit code from your authenticator app.'}
            </div>

            <form onSubmit={submit}>
                {!useRecovery && (
                    <div>
                        <InputLabel htmlFor="code" value="Authentication code" />
                        <TextInput
                            id="code"
                            name="code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={data.code}
                            isFocused
                            className="mt-1 block w-full tracking-widest"
                            onChange={(e) => setData('code', e.target.value)}
                        />
                        <InputError message={errors.code} className="mt-2" />
                    </div>
                )}

                {useRecovery && (
                    <div>
                        <InputLabel
                            htmlFor="recovery_code"
                            value="Recovery code"
                        />
                        <TextInput
                            id="recovery_code"
                            name="recovery_code"
                            value={data.recovery_code}
                            isFocused
                            className="mt-1 block w-full"
                            onChange={(e) =>
                                setData('recovery_code', e.target.value)
                            }
                        />
                        <InputError
                            message={errors.recovery_code}
                            className="mt-2"
                        />
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                    <button
                        type="button"
                        className="text-sm text-gray-600 underline hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        onClick={() => {
                            setUseRecovery((v) => !v);
                            reset('code', 'recovery_code');
                        }}
                    >
                        {useRecovery
                            ? 'Use authenticator code'
                            : 'Use recovery code'}
                    </button>

                    <PrimaryButton disabled={processing}>Verify</PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
