import { Link } from '@inertiajs/react';
import {
    createContext,
    type PropsWithChildren,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import ApplicationLogo from '@/Components/ApplicationLogo';
import { DemoRequestDialog } from '@/Components/domain/DemoRequestDialog';
import { LanguageSwitcher } from '@/Components/domain/layout/LanguageSwitcher';
import { ThemeToggle } from '@/Components/domain/layout/ThemeToggle';
import { Button } from '@/Components/ui/button';

type Intent = 'demo' | 'register';

type DemoCtx = { open: (intent: Intent) => void };
const DemoContext = createContext<DemoCtx | null>(null);

/**
 * Pages render `<DemoCta intent="demo">…</DemoCta>` to fire the layout-owned
 * dialog without lifting state. Falls back to a no-op outside MarketingLayout
 * (e.g. story-book contexts) so it never crashes the tree.
 */
export function useDemoDialog(): DemoCtx {
    return useContext(DemoContext) ?? { open: () => {} };
}

type Props = {
    /** Highlights the active nav link in the topbar. */
    active?: 'home' | 'about' | 'pricing';
};

export default function MarketingLayout({
    children,
    active,
}: PropsWithChildren<Props>) {
    const { t } = useTranslation('common');
    const [dialog, setDialog] = useState<{ open: boolean; intent: Intent }>({
        open: false,
        intent: 'demo',
    });

    const openDialog = useCallback(
        (intent: Intent) => setDialog({ open: true, intent }),
        [],
    );

    const ctx = useMemo<DemoCtx>(() => ({ open: openDialog }), [openDialog]);

    const navItems: { href: string; key: 'home' | 'about' | 'pricing'; label: string }[] = [
        { href: '/', key: 'home', label: t('nav.marketing.home') },
        { href: '/about', key: 'about', label: t('nav.marketing.about') },
        { href: '/pricing', key: 'pricing', label: t('nav.marketing.pricing') },
    ];

    return (
        <DemoContext.Provider value={ctx}>
            <div className="min-h-screen bg-background">
                <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4 lg:px-10">
                        <Link href="/" className="flex items-center" aria-label="Einaya">
                            <ApplicationLogo className="h-9 w-auto text-foreground" />
                        </Link>

                        <nav className="hidden items-center gap-6 md:flex" aria-label="Marketing">
                            {navItems.map((item) => (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={
                                        active === item.key
                                            ? 'text-sm font-semibold text-foreground'
                                            : 'text-sm font-medium text-muted-foreground hover:text-foreground'
                                    }
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="flex items-center gap-1">
                            <LanguageSwitcher />
                            <ThemeToggle />
                            <Button
                                size="sm"
                                className="ms-2"
                                onClick={() => openDialog('demo')}
                            >
                                {t('demoRequest.title')}
                            </Button>
                        </div>
                    </div>

                    <nav
                        className="border-t bg-background/95 px-6 py-2 md:hidden"
                        aria-label="Marketing mobile"
                    >
                        <div className="mx-auto flex max-w-6xl items-center gap-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={
                                        active === item.key
                                            ? 'text-sm font-semibold text-foreground'
                                            : 'text-sm font-medium text-muted-foreground hover:text-foreground'
                                    }
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                </header>

                <main>{children}</main>

                <footer className="border-t">
                    <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center lg:px-10">
                        <div className="flex items-center gap-3">
                            <ApplicationLogo showWordmark={false} className="h-7 w-7" />
                            <span>
                                © {new Date().getFullYear()} Einaya · {t('landing.footer.tagline')}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/about" className="hover:text-primary">
                                {t('nav.marketing.about')}
                            </Link>
                            <Link href="/pricing" className="hover:text-primary">
                                {t('nav.marketing.pricing')}
                            </Link>
                            <button
                                type="button"
                                onClick={() => openDialog('demo')}
                                className="hover:text-primary"
                            >
                                {t('demoRequest.title')}
                            </button>
                        </div>
                    </div>
                </footer>
            </div>

            <DemoRequestDialog
                open={dialog.open}
                onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
                initialIntent={dialog.intent}
            />
        </DemoContext.Provider>
    );
}
