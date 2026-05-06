import { Link } from '@inertiajs/react';
import {
    Calendar,
    ClipboardList,
    CreditCard,
    FileBadge,
    LayoutDashboard,
    PieChart,
    Settings,
    Stethoscope,
    Users,
    UsersRound,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/Components/ui/sidebar';
import { useCan } from '@/Hooks/useCan';
import { useDirection } from '@/Hooks/useDirection';
import type { Permission } from '@/types/auth';

import { SidebarBrand } from './SidebarBrand';

type NavItem = {
    href: string;
    labelKey: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    permission?: Permission;
};

type NavSection = {
    labelKey: string;
    items: NavItem[];
};

const sections: NavSection[] = [
    {
        labelKey: 'nav.main',
        items: [
            { href: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
            {
                href: '/reception',
                labelKey: 'nav.reception',
                icon: Users,
                permission: 'appointments.view',
            },
            {
                href: '/patients',
                labelKey: 'nav.patients',
                icon: UsersRound,
                permission: 'patients.view',
            },
            {
                href: '/appointments',
                labelKey: 'nav.appointments',
                icon: Calendar,
                permission: 'appointments.view',
            },
        ],
    },
    {
        labelKey: 'nav.medical',
        items: [
            {
                href: '/doctor',
                labelKey: 'nav.doctor',
                icon: Stethoscope,
                permission: 'consultations.create',
            },
            {
                href: '/doctor/queue',
                labelKey: 'nav.queue',
                icon: Stethoscope,
                permission: 'consultations.create',
            },
            {
                href: '/consultations',
                labelKey: 'nav.consultations',
                icon: Stethoscope,
                permission: 'consultations.view',
            },
            {
                href: '/forms',
                labelKey: 'nav.forms',
                icon: ClipboardList,
                permission: 'forms.view',
            },
        ],
    },
    {
        labelKey: 'nav.billing',
        items: [
            {
                href: '/payments',
                labelKey: 'nav.payments',
                icon: CreditCard,
                permission: 'payments.view',
            },
            {
                href: '/reports',
                labelKey: 'nav.reports',
                icon: PieChart,
                permission: 'reports.view',
            },
        ],
    },
    {
        labelKey: 'nav.admin',
        items: [
            {
                href: '/staff',
                labelKey: 'nav.staff',
                icon: Users,
                permission: 'staff.view',
            },
            {
                href: '/settings',
                labelKey: 'nav.settings',
                icon: Settings,
                permission: 'clinic.view_settings',
            },
        ],
    },
];

export function AppSidebar() {
    const { t } = useTranslation('common');
    const can = useCan();
    const direction = useDirection();
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

    return (
        <Sidebar side={direction === 'rtl' ? 'right' : 'left'} collapsible="icon">
            <SidebarBrand href="/" />
            <SidebarContent>
                {sections.map((section) => {
                    const visible = section.items.filter(
                        (item) => !item.permission || can(item.permission),
                    );
                    if (visible.length === 0) return null;

                    return (
                        <SidebarGroup key={section.labelKey}>
                            <SidebarGroupLabel>{t(section.labelKey)}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {visible.map((item) => {
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
                    );
                })}
            </SidebarContent>
            <SidebarFooter>
                <FileBadge className="hidden" />
            </SidebarFooter>
        </Sidebar>
    );
}
