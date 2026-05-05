import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

import type { Locale } from '@/i18n';
import type { PageProps } from '@/types';

export function useLocale() {
    const { props } = usePage<PageProps>();
    const { i18n } = useTranslation();

    const locale = (props.preferences?.locale ?? 'en') as Locale;

    const setLocale = useCallback(
        (next: Locale) => {
            if (next === locale) return;
            void i18n.changeLanguage(next);
            try {
                localStorage.setItem('einaya-locale', next);
            } catch {
                // ignore storage failures (private mode, etc.)
            }
            router.post(
                '/api/preferences/language',
                { language: next },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        // Direction + font swap require a fresh document.
                        window.location.reload();
                    },
                },
            );
        },
        [locale, i18n],
    );

    return { locale, setLocale };
}
