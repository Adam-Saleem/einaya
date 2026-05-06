import type { ReactNode } from 'react';

import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

const variantClasses: Record<StatusVariant, string> = {
    success: 'border-transparent bg-badge-success-bg text-badge-success-fg',
    warning: 'border-transparent bg-badge-warning-bg text-badge-warning-fg',
    info: 'border-transparent bg-badge-info-bg text-badge-info-fg',
    danger: 'border-transparent bg-badge-danger-bg text-badge-danger-fg',
    neutral: 'border-transparent bg-badge-neutral-bg text-badge-neutral-fg',
};

type Props = {
    variant: StatusVariant;
    children: ReactNode;
    className?: string;
};

export function StatusBadge({ variant, children, className }: Props) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                variantClasses[variant],
                className,
            )}
        >
            {children}
        </Badge>
    );
}
