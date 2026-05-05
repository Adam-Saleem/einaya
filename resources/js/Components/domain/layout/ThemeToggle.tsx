import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/Components/ui/tooltip';
import { useTheme, type Theme } from '@/Hooks/useTheme';

export function ThemeToggle() {
    const { t } = useTranslation('common');
    const { theme, setTheme } = useTheme();

    const options: { value: Theme; label: string; icon: typeof Sun }[] = [
        { value: 'light', label: t('topbar.themeLight'), icon: Sun },
        { value: 'dark', label: t('topbar.themeDark'), icon: Moon },
        { value: 'system', label: t('topbar.themeSystem'), icon: Monitor },
    ];

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={t('topbar.theme')}>
                            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>{t('topbar.theme')}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('topbar.theme')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {options.map(({ value, label, icon: Icon }) => (
                    <DropdownMenuItem
                        key={value}
                        onSelect={() => setTheme(value)}
                        className={theme === value ? 'bg-accent text-accent-foreground' : ''}
                    >
                        <Icon className="me-2 h-4 w-4" />
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
