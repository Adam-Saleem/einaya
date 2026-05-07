import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ShieldCheck, Stethoscope, Users } from 'lucide-react';
import { type PropsWithChildren, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import ApplicationLogo from '@/Components/ApplicationLogo';
import { LanguageSwitcher } from '@/Components/domain/layout/LanguageSwitcher';
import { ThemeToggle } from '@/Components/domain/layout/ThemeToggle';
import { useDirection } from '@/Hooks/useDirection';

type Props = {
    title?: ReactNode;
    subtitle?: ReactNode;
    /** Optional caption shown above the title. */
    eyebrow?: ReactNode;
};

const HIGHLIGHTS = [
    { icon: Stethoscope, key: 'guest.highlights.clinical' },
    { icon: Users, key: 'guest.highlights.patients' },
    { icon: ShieldCheck, key: 'guest.highlights.privacy' },
];

export default function GuestLayout({
    children,
    title,
    subtitle,
    eyebrow,
}: PropsWithChildren<Props>) {
    const { t } = useTranslation('auth');
    const direction = useDirection();

    return (
        <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            {/*
             * Brand panel — only visible at lg+. Cyan-700 → cyan-900 gradient,
             * highlights of the platform, and a subtle dot grid backdrop.
             */}
            <aside
                className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"
                style={{
                    background:
                        direction === 'rtl'
                            ? 'linear-gradient(225deg, rgb(var(--sidebar)) 0%, rgb(var(--accent-foreground)) 100%)'
                            : 'linear-gradient(135deg, rgb(var(--sidebar)) 0%, rgb(var(--accent-foreground)) 100%)',
                }}
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                    }}
                />
                <Link href="/" className="relative inline-flex w-fit">
                    <ApplicationLogo className="h-9 w-auto text-white" />
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="relative space-y-8"
                >
                    <div className="space-y-3">
                        <p className="text-sm font-medium uppercase tracking-wider text-cyan-200">
                            {t('guest.eyebrow')}
                        </p>
                        <h2 className="text-h2 leading-tight text-white">
                            {t('guest.title')}
                        </h2>
                        <p className="max-w-md text-base text-cyan-100/90">
                            {t('guest.body')}
                        </p>
                    </div>

                    <ul className="space-y-3">
                        {HIGHLIGHTS.map(({ icon: Icon, key }) => (
                            <li key={key} className="flex items-start gap-3">
                                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-cyan-100 ring-1 ring-white/15">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <span className="pt-1.5 text-sm text-cyan-50/90">
                                    {t(key)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                <p className="relative text-xs text-cyan-200/70">
                    {t('guest.footer', { year: new Date().getFullYear() })}
                </p>
            </aside>

            {/* Form panel */}
            <main className="relative flex flex-col">
                <header className="flex items-center justify-between gap-2 px-6 pt-6 lg:px-12">
                    <Link href="/" className="lg:hidden">
                        <ApplicationLogo className="h-8 w-auto text-foreground" />
                    </Link>
                    <span className="hidden lg:inline-block" />
                    <div className="flex items-center gap-1">
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </header>

                <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-12">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="w-full max-w-md"
                    >
                        {(eyebrow || title || subtitle) && (
                            <header className="mb-8 space-y-2">
                                {eyebrow && (
                                    <p className="text-xs font-medium uppercase tracking-wider text-primary">
                                        {eyebrow}
                                    </p>
                                )}
                                {title && (
                                    <h1 className="text-h2 text-foreground">{title}</h1>
                                )}
                                {subtitle && (
                                    <p className="text-base text-muted-foreground">
                                        {subtitle}
                                    </p>
                                )}
                            </header>
                        )}
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
