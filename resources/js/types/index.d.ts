import type { Permission, Role } from './auth';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    preferred_language?: 'en' | 'ar';
    theme_preference?: 'light' | 'dark' | 'system';
}

export type DuplicatePhoneMatch = {
    id: number;
    patient_code: string;
    first_name: string;
    last_name: string;
    phone: string;
    date_of_birth: string | null;
};

export type FlashBag = {
    success?: string;
    error?: string;
    warning?: string;
    status?: string;
    duplicate_phone_matches?: DuplicatePhoneMatch[];
};

export type Preferences = {
    locale: 'en' | 'ar';
    direction: 'ltr' | 'rtl';
    theme: 'light' | 'dark' | 'system';
};

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
        permissions: Permission[];
        roles: Role[];
        isSuperAdmin: boolean;
    };
    preferences: Preferences;
    flash?: FlashBag;
};
