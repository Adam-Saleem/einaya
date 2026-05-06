import { Link, useForm, usePage } from '@inertiajs/react';
import { type FormEventHandler } from 'react';

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
    const user = usePage<PageProps>().props.auth.user!;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch('/profile');
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-h4 text-foreground">Profile Information</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            Your email address is unverified.{' '}
                            <Link
                                href="/email/verification-notification"
                                method="post"
                                as="button"
                                className="text-primary underline hover:no-underline"
                            >
                                Click here to re-send.
                            </Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <p className="text-sm font-medium text-success">
                                A new verification link has been sent to your email address.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={processing}>
                        Save
                    </Button>
                    {recentlySuccessful && (
                        <p className="text-sm text-muted-foreground">Saved.</p>
                    )}
                </div>
            </form>
        </section>
    );
}
