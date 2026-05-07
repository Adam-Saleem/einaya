import { useEffect, useState } from 'react';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Reads the theme from the DOM (set by the pre-paint script in app.blade.php
// + by the in-app useTheme hook). The Toaster mounts at the app root, OUTSIDE
// the Inertia <App> tree, so it cannot use usePage() — that's why we don't
// reuse the @/Hooks/useTheme hook here.
function useDomDirection(): 'ltr' | 'rtl' {
    const [dir, setDir] = useState<'ltr' | 'rtl'>(() =>
        typeof document === 'undefined'
            ? 'ltr'
            : (document.documentElement.getAttribute('dir') as 'ltr' | 'rtl') ?? 'ltr',
    );

    useEffect(() => {
        if (typeof MutationObserver === 'undefined') return;
        const observer = new MutationObserver(() => {
            const next = (document.documentElement.getAttribute('dir') as 'ltr' | 'rtl') ?? 'ltr';
            setDir(next);
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['dir'],
        });
        return () => observer.disconnect();
    }, []);

    return dir;
}

function useDomTheme(): 'light' | 'dark' {
    const [dark, setDark] = useState(() =>
        typeof document === 'undefined'
            ? false
            : document.documentElement.classList.contains('dark'),
    );

    useEffect(() => {
        if (typeof MutationObserver === 'undefined') return;
        const observer = new MutationObserver(() => {
            setDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
        return () => observer.disconnect();
    }, []);

    return dark ? 'dark' : 'light';
}

const Toaster = ({ ...props }: ToasterProps) => {
    const theme = useDomTheme();
    const dir = useDomDirection();
    const position: ToasterProps['position'] = dir === 'rtl' ? 'top-left' : 'top-right';

    return (
        <Sonner
            theme={theme}
            dir={dir}
            position={position}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
                    description: 'group-[.toast]:text-muted-foreground',
                    actionButton:
                        'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                    cancelButton:
                        'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
