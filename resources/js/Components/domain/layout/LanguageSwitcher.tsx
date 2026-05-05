import { Languages } from 'lucide-react';
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
import { useLocale } from '@/Hooks/useLocale';
import type { Locale } from '@/i18n';

export function LanguageSwitcher() {
    const { t } = useTranslation('common');
    const { locale, setLocale } = useLocale();

    const options: { value: Locale; label: string }[] = [
        { value: 'en', label: t('language.en') },
        { value: 'ar', label: t('language.ar') },
    ];

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={t('topbar.language')}>
                            <Languages className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>{t('topbar.language')}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('topbar.language')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {options.map((opt) => (
                    <DropdownMenuItem
                        key={opt.value}
                        onSelect={() => setLocale(opt.value)}
                        className={locale === opt.value ? 'bg-accent text-accent-foreground' : ''}
                    >
                        {opt.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
