import { Link } from '@inertiajs/react';
import {
    Building2,
    CreditCard,
    LayoutDashboard,
    LifeBuoy,
    Package,
    ScrollText,
    Settings,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/Components/ui/sidebar';
import { useDirection } from '@/Hooks/useDirection';

import { SidebarBrand } from './SidebarBrand';

type NavItem = {
    href: string;
    labelKey: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
};

type NavSection = {
    labelKey: string;
    items: NavItem[];
};

const sections: NavSection[] = [
    {
        labelKey: 'nav.platform',
        items: [
            { href: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
            { href: '/clinics', labelKey: 'nav.clinics', icon: Building2 },
            { href: '/subscriptions', labelKey: 'nav.subscriptions', icon: CreditCard },
        ],
    },
    {
        labelKey: 'nav.operations',
        items: [
            { href: '/support-tickets', labelKey: 'nav.supportTickets', icon: LifeBuoy },
            { href: '/audit-logs', labelKey: 'nav.auditLogs', icon: ScrollText },
        ],
    },
    {
        labelKey: 'nav.settings',
        items: [
            { href: '/plans', labelKey: 'nav.plans', icon: Package },
            { href: '/global-settings', labelKey: 'nav.globalSettings', icon: Settings },
        ],
    },
];

export function CentralSidebar() {
    const { t } = useTranslation('common');
    const direction = useDirection();
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

    return (
        <Sidebar side={direction === 'rtl' ? 'right' : 'left'} collapsible="icon">
            <SidebarBrand href="/" />
            <SidebarContent>
                {sections.map((section) => (
                    <SidebarGroup key={section.labelKey}>
                        <SidebarGroupLabel>{t(section.labelKey)}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {section.items.map((item) => {
                                    const active =
                                        item.href === '/'
                                            ? currentPath === '/'
                                            : currentPath.startsWith(item.href);
                                    const Icon = item.icon;

                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={active}
                                                tooltip={t(item.labelKey)}
                                            >
                                                <Link href={item.href}>
                                                    <Icon />
                                                    <span>{t(item.labelKey)}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
        </Sidebar>
    );
}
