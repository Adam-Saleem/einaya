import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import type { PageProps } from '@/types';

export function useFlashToasts(): void {
    const { props } = usePage<PageProps>();
    const lastSeen = useRef<string | null>(null);

    useEffect(() => {
        const flash = props.flash;
        if (!flash) return;

        const fingerprint = JSON.stringify(flash);
        if (fingerprint === lastSeen.current) return;
        lastSeen.current = fingerprint;

        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
        if (flash.warning) toast.warning(flash.warning);
        if (flash.status) toast.info(flash.status);
    }, [props.flash]);
}
