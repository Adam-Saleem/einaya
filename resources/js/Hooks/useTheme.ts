import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import type { PageProps } from '@/types';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'einaya-theme';

function applyTheme(theme: Theme): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = theme === 'dark' || (theme === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', dark);
}

export function useTheme() {
    const { props } = usePage<PageProps>();
    const initial = (() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
        } catch {
            // ignore
        }
        return (props.preferences?.theme ?? 'system') as Theme;
    })();

    const [theme, setThemeState] = useState<Theme>(initial);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        if (theme !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => applyTheme('system');
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [theme]);

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // ignore
        }
        router.post(
            '/api/preferences/theme',
            { theme: next },
            { preserveScroll: true, preserveState: true, only: [] },
        );
    }, []);

    return { theme, setTheme };
}
