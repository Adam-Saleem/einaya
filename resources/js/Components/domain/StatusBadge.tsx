import type { ReactNode } from 'react';

import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

const variantClasses: Record<StatusVariant, string> = {
    success: 'border-transparent bg-success/15 text-success-foreground/90 dark:bg-success/25',
    warning: 'border-transparent bg-warning/20 text-warning-foreground dark:bg-warning/25',
    info: 'border-transparent bg-info/15 text-info dark:bg-info/25 dark:text-info-foreground',
    danger: 'border-transparent bg-destructive/15 text-destructive dark:bg-destructive/30 dark:text-destructive-foreground',
    neutral: 'border-transparent bg-muted text-muted-foreground',
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
