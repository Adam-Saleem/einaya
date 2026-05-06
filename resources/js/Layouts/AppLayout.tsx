import { Head } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';

import { AppBreadcrumb, type Crumb } from '@/Components/domain/AppBreadcrumb';
import { PageHeader } from '@/Components/domain/PageHeader';
import { PatientSearch } from '@/Components/domain/PatientSearch';
import { PatientRegistrationForm } from '@/Components/domain/PatientRegistrationForm';
import { AppSidebar } from '@/Components/domain/layout/AppSidebar';
import { AppTopbar } from '@/Components/domain/layout/AppTopbar';
import { SidebarInset, SidebarProvider } from '@/Components/ui/sidebar';

type Props = {
    title?: string;
    pageTitle?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    breadcrumbs?: Crumb[];
    children: ReactNode;
};

export default function AppLayout({
    title,
    pageTitle,
    description,
    actions,
    breadcrumbs,
    children,
}: Props) {
    // Cmd+K patient search lives at the layout level so it's reachable
    // from any tenant page. The "register new" path opens the registration
    // dialog with the search query pre-filled.
    const [registerOpen, setRegisterOpen] = useState(false);
    const [registerQuery, setRegisterQuery] = useState('');

    return (
        <SidebarProvider>
            {title && <Head title={title} />}
            <AppSidebar />
            <SidebarInset>
                <AppTopbar />
                <main className="flex flex-col gap-6 p-6 md:p-8">
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <AppBreadcrumb items={breadcrumbs} />
                    )}
                    {pageTitle && (
                        <PageHeader
                            title={pageTitle}
                            description={description}
                            actions={actions}
                        />
                    )}
                    <div className="flex flex-col gap-6">{children}</div>
                </main>
            </SidebarInset>

            <PatientSearch
                onCreateNew={(query) => {
                    setRegisterQuery(query);
                    setRegisterOpen(true);
                }}
            />
            <PatientRegistrationForm
                open={registerOpen}
                onOpenChange={setRegisterOpen}
                initialQuery={registerQuery}
                insuranceProviders={[]}
            />
        </SidebarProvider>
    );
}
