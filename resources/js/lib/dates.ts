import i18n from '@/i18n';

/**
 * Locale-aware date/time formatting. The locale is read from i18next's
 * current language (which Inertia syncs from `preferences.locale`), so the
 * same ISO timestamp renders identically across the app — no more "this
 * cell uses British format, that cell uses American" drift between
 * components.
 *
 * Print pages (Receipt, PrescriptionPrint) opt out and pass an explicit
 * locale because they target the patient's preferred language, not the
 * user's session.
 */

const DASH = '—';

function localeFor(): string {
    const lng = i18n.language ?? 'en';
    return lng.startsWith('ar') ? 'ar' : 'en';
}

export function formatDate(iso: string | null | undefined, locale?: string): string {
    if (!iso) return DASH;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return DASH;
    return d.toLocaleDateString(locale ?? localeFor(), {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    });
}

export function formatTime(iso: string | null | undefined, locale?: string): string {
    if (!iso) return DASH;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return DASH;
    return d.toLocaleTimeString(locale ?? localeFor(), {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDateTime(
    iso: string | null | undefined,
    locale?: string,
): string {
    if (!iso) return DASH;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return DASH;
    return d.toLocaleString(locale ?? localeFor(), {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}
