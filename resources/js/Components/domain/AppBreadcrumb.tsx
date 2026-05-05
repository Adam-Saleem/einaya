import { Link } from '@inertiajs/react';
import { Fragment } from 'react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/Components/ui/breadcrumb';

export type Crumb = {
    label: string;
    href?: string;
};

type Props = {
    items: Crumb[];
};

export function AppBreadcrumb({ items }: Props) {
    if (items.length === 0) return null;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {items.map((crumb, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <Fragment key={`${crumb.label}-${index}`}>
                            <BreadcrumbItem>
                                {isLast || !crumb.href ? (
                                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={crumb.href}>{crumb.label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
