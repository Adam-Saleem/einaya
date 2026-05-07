export type ClinicStatus = 'pending' | 'active' | 'suspended' | 'cancelled';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled';

export type TicketStatus = 'open' | 'pending' | 'closed';

export type ClinicSummary = {
    id: string;
    name: string;
    slug: string;
    owner_name: string;
    owner_email: string;
    owner_phone: string | null;
    status: ClinicStatus;
    status_label: string;
    domain: string;
    url: string;
    trial_ends_at: string | null;
    created_at: string | null;
    plan: { id: number; slug: string; name: string } | null;
    subscription: {
        id: number;
        status: SubscriptionStatus;
        starts_at: string | null;
        ends_at: string | null;
        trial_ends_at: string | null;
    } | null;
    branding: Record<string, unknown> | null;
};

export type Plan = {
    id: number;
    name: string;
    slug: string;
    price_monthly: number;
    price_yearly: number;
    max_patients: number;
    max_staff: number;
    features: string[];
    is_active: boolean;
    order: number;
    subscription_count?: number;
    created_at: string | null;
};

export type SubscriptionRow = {
    id: number;
    clinic: { id: string; name: string; slug: string } | null;
    plan: { id: number; name: string; slug: string } | null;
    status: SubscriptionStatus;
    status_label: string;
    starts_at: string | null;
    ends_at: string | null;
    trial_ends_at: string | null;
};

export type Ticket = {
    id: number;
    subject: string;
    body: string;
    status: TicketStatus;
    status_label: string;
    opened_by_email: string;
    created_at: string | null;
    updated_at: string | null;
    clinic: { id: string; name: string; slug: string } | null;
};

export type AuditLog = {
    id: number;
    action: string;
    auditable_type: string | null;
    auditable_id: number | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string | null;
    user: { id: number; name: string; email: string } | null;
};

export type Paginated<T> = {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
};

export type ResourceCollection<T> = { data: T[] };

export type PlatformStats = {
    total_clinics: number;
    active_clinics: number;
    active_subscriptions: number;
    open_tickets: number;
    total_patients: number | null;
    total_staff: number | null;
    generated_at: string | null;
};

export type CouponStatus = 'active' | 'expired' | 'exhausted' | 'disabled';

export type CouponRow = {
    id: number;
    code: string;
    duration_days: number;
    expires_at: string | null;
    max_uses: number;
    used_count: number;
    remaining_uses: number;
    description: string | null;
    is_active: boolean;
    is_expired: boolean;
    is_exhausted: boolean;
    status: CouponStatus;
    created_at: string | null;
    plan: { id: number; name: string; slug: string } | null;
    creator: { id: number; name: string; email: string } | null;
};

export type DemoRequestRow = {
    id: number;
    clinic_name: string;
    contact_name: string;
    email: string;
    phone: string;
    country: string | null;
    intent: 'demo' | 'register';
    message: string | null;
    is_handled: boolean;
    handled_at: string | null;
    notes: string | null;
    ip_address: string | null;
    created_at: string | null;
    updated_at: string | null;
    whatsapp_url: string | null;
    mailto_url: string;
    handler: { id: number; name: string; email: string } | null;
};
