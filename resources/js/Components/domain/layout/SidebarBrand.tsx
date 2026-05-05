import { Link } from '@inertiajs/react';
import { Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SidebarHeader } from '@/Components/ui/sidebar';

type Props = {
    href: string;
};

export function SidebarBrand({ href }: Props) {
    const { t } = useTranslation('common');

    return (
        <SidebarHeader className="border-b">
            <Link
                href={href}
                className="flex items-center gap-2 px-2 py-2 text-sidebar-foreground"
            >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Stethoscope className="h-5 w-5" />
                </span>
                <span className="flex flex-col">
                    <span className="text-base font-bold leading-none">{t('app.name')}</span>
                    <span className="text-xs text-muted-foreground">{t('app.tagline')}</span>
                </span>
            </Link>
        </SidebarHeader>
    );
}
