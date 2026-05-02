import { useCan } from '@/Hooks/useCan';
import type { Permission } from '@/types/auth';
import { ReactNode } from 'react';

type Props = {
    permission: Permission | Permission[];
    /** When true, ALL permissions must match. Default: any. */
    all?: boolean;
    fallback?: ReactNode;
    children: ReactNode;
};

/**
 * Declarative permission gate.
 *
 *   <Can permission="patients.delete">
 *     <DeleteButton />
 *   </Can>
 *
 * Pure UX helper — it does not enforce anything server-side.
 */
export function Can({ permission, all = false, fallback = null, children }: Props) {
    const can = useCan();

    const list = Array.isArray(permission) ? permission : [permission];
    const allowed = all ? list.every(can) : list.some(can);

    return <>{allowed ? children : fallback}</>;
}
