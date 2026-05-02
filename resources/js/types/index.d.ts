import type { Permission, Role } from './auth';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
}

export type FlashBag = {
    success?: string;
    error?: string;
    warning?: string;
    status?: string;
};

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
        permissions: Permission[];
        roles: Role[];
    };
    flash?: FlashBag;
};
