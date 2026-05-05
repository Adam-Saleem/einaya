import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { AppBreadcrumb, type Crumb } from '@/Components/domain/AppBreadcrumb';
import { PageHeader } from '@/Components/domain/PageHeader';
import { AppTopbar } from '@/Components/domain/layout/AppTopbar';
import { CentralSidebar } from '@/Components/domain/layout/CentralSidebar';
import { SidebarInset, SidebarProvider } from '@/Components/ui/sidebar';

type Props = {
    title?: string;
    pageTitle?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    breadcrumbs?: Crumb[];
    children: ReactNode;
};

export default function CentralLayout({
    title,
    pageTitle,
    description,
    actions,
    breadcrumbs,
    children,
}: Props) {
    return (
        <SidebarProvider>
            {title && <Head title={title} />}
            <CentralSidebar />
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
        </SidebarProvider>
    );
}
