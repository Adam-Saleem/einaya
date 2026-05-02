import { Head } from '@inertiajs/react';

interface Props {
    tenantId: string;
}

export default function TenantWelcome({ tenantId }: Props) {
    return (
        <>
            <Head title="Clinic" />
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-900">
                <div className="text-center">
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                        Tenant: {tenantId}
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        This is a clinic subdomain. Tenancy is initialized.
                    </p>
                </div>
            </div>
        </>
    );
}
