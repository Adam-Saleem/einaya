import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

type Props = {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
};

const sizes: Record<NonNullable<Props['size']>, string> = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
};

export function LoadingSpinner({ className, size = 'md' }: Props) {
    return (
        <Loader2
            className={cn('animate-spin text-muted-foreground', sizes[size], className)}
            aria-hidden="true"
        />
    );
}
