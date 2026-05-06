import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import { SidebarTrigger } from '@/Components/ui/sidebar';

import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

export function AppTopbar() {
    const { t } = useTranslation('common');

    const openPatientSearch = () => {
        // PatientSearch (mounted at AppLayout level) listens for this
        // custom event. cmd/ctrl+K does the same.
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('einaya:open-patient-search'));
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-header items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger className="md:hidden" />

            <div className="flex flex-1 items-center">
                <Button
                    variant="outline"
                    className="h-9 w-full max-w-md justify-start gap-2 text-muted-foreground"
                    aria-label={t('topbar.openSearch')}
                    onClick={openPatientSearch}
                >
                    <Search className="h-4 w-4" />
                    <span className="text-sm">{t('topbar.search')}</span>
                    <kbd className="ms-auto hidden rounded border bg-muted px-1.5 py-0.5 text-xs font-medium md:inline">
                        ⌘K
                    </kbd>
                </Button>
            </div>

            <div className="flex items-center gap-1">
                {/* Notifications dropdown intentionally hidden until v2 — see ENHANCEMENTS 11.9 */}
                <LanguageSwitcher />
                <ThemeToggle />
                <UserMenu />
            </div>
        </header>
    );
}
