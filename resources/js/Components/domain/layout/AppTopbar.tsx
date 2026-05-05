import { Bell, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { SidebarTrigger } from '@/Components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/Components/ui/tooltip';

import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

export function AppTopbar() {
    const { t } = useTranslation('common');

    return (
        <header className="sticky top-0 z-30 flex h-header items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger className="md:hidden" />

            <div className="flex flex-1 items-center">
                <Button
                    variant="outline"
                    className="h-9 w-full max-w-md justify-start gap-2 text-muted-foreground"
                    aria-label={t('topbar.openSearch')}
                >
                    <Search className="h-4 w-4" />
                    <span className="text-sm">{t('topbar.search')}</span>
                    <kbd className="ms-auto hidden rounded border bg-muted px-1.5 py-0.5 text-xs font-medium md:inline">
                        ⌘K
                    </kbd>
                </Button>
            </div>

            <div className="flex items-center gap-1">
                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t('topbar.notifications')}
                                >
                                    <Bell className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t('topbar.notifications')}</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-72">
                        <DropdownMenuLabel>{t('topbar.notifications')}</DropdownMenuLabel>
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            {t('topbar.noNotifications')}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <LanguageSwitcher />
                <ThemeToggle />
                <UserMenu />
            </div>
        </header>
    );
}
