import { router, usePage } from '@inertiajs/react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import type { PageProps } from '@/types';

function initialsFor(name: string): string {
    return name
        .split(/\s+/)
        .map((part) => part.charAt(0))
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function UserMenu() {
    const { t } = useTranslation('common');
    const { props } = usePage<PageProps>();
    const user = props.auth.user;

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-11 px-2 gap-2" aria-label={t('topbar.user')}>
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                            {initialsFor(user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block text-sm font-medium max-w-[140px] truncate">
                        {user.name}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.visit('/profile')}>
                    <UserIcon className="me-2 h-4 w-4" />
                    {t('topbar.profile')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.post('/logout')}>
                    <LogOut className="me-2 h-4 w-4" />
                    {t('topbar.logout')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
