import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-900">
                <div className="text-center">
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                        Welcome to Einaya
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Multi-tenant SaaS for medical clinics.
                    </p>
                </div>
            </div>
        </>
    );
}
