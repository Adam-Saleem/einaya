import type { ReactNode } from 'react';

type Props = {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: Props) {
    return (
        <div className="flex flex-col gap-3 border-b pb-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
                <h1 className="text-h1 text-foreground">{title}</h1>
                {description && (
                    <p className="text-base text-muted-foreground">{description}</p>
                )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}
