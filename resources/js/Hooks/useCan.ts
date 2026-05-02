import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import type { Permission, Role } from '@/types/auth';

/**
 * Returns a `(permission) => boolean` checker bound to the currently
 * authenticated user's permissions (shared via Inertia in
 * HandleInertiaRequests::share).
 *
 * Usage:
 *   const can = useCan();
 *   if (can('patients.delete')) { ... }
 *
 * Backend remains the source of truth — this is for UX (hiding buttons,
 * disabling menu items). Every controller endpoint must still authorize
 * server-side.
 */
export function useCan(): (permission: Permission) => boolean {
    const { auth } = usePage<PageProps>().props;
    const granted = new Set<string>(auth?.permissions ?? []);

    return (permission: Permission) => granted.has(permission);
}

export function useHasRole(): (role: Role) => boolean {
    const { auth } = usePage<PageProps>().props;
    const roles = new Set<string>(auth?.roles ?? []);

    return (role: Role) => roles.has(role);
}
