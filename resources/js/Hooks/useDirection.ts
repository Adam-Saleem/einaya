import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

export type Direction = 'ltr' | 'rtl';

export function useDirection(): Direction {
    const { props } = usePage<PageProps>();
    return props.preferences?.direction ?? 'ltr';
}
