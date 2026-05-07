import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    CalendarClock,
    ClipboardList,
    ShieldCheck,
    Stethoscope,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import ApplicationLogo from '@/Components/ApplicationLogo';
import { LanguageSwitcher } from '@/Components/domain/layout/LanguageSwitcher';
import { ThemeToggle } from '@/Components/domain/layout/ThemeToggle';
import { Button } from '@/Components/ui/button';

const FEATURES = [
    { icon: CalendarClock, key: 'features.scheduling' },
    { icon: ClipboardList, key: 'features.records' },
    { icon: Stethoscope, key: 'features.consultations' },
] as const;

export default function Welcome() {
    const { t } = useTranslation('common');

    return (
        <>
            <Head title="Einaya — clinic management" />

            <div className="min-h-screen bg-background">
                <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-10">
                    <Link href="/" className="flex items-center">
                        <ApplicationLogo className="h-9 w-auto text-foreground" />
                    </Link>
                    <div className="flex items-center gap-1">
                        <LanguageSwitcher />
                        <ThemeToggle />
                        <Button asChild variant="outline" size="sm" className="ms-2">
                            <Link href="/login">{t('actions.signIn')}</Link>
                        </Button>
                    </div>
                </header>

                <section className="relative isolate overflow-hidden">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu blur-3xl sm:-top-80"
                    >
                        <div
                            className="relative left-1/2 aspect-[1155/678] w-[36rem] -translate-x-1/2 rotate-[20deg] bg-gradient-to-tr from-primary to-success opacity-20 sm:w-[72rem]"
                            style={{
                                clipPath:
                                    'polygon(74% 44%, 100% 61%, 97% 26%, 85% 0, 80% 2%, 72% 32%, 60% 62%, 52% 68%, 47% 58%, 45% 34%, 27% 76%, 0 64%, 17% 100%, 27% 76%, 76% 97%, 74% 44%)',
                            }}
                        />
                    </div>

                    <div className="mx-auto max-w-6xl px-6 pb-20 pt-12 lg:px-10 lg:pb-32 lg:pt-20">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="max-w-3xl space-y-6"
                        >
                            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {t('landing.eyebrow')}
                            </span>
                            <h1 className="text-h1 leading-tight tracking-tight text-foreground lg:text-display">
                                {t('landing.headline')}
                            </h1>
                            <p className="max-w-2xl text-base text-muted-foreground lg:text-lg">
                                {t('landing.subhead')}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <Button asChild size="lg">
                                    <Link href="/login">
                                        {t('landing.ctaPrimary')}
                                        <ArrowRight className="ms-2 h-4 w-4 rtl:scale-x-[-1]" />
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="ghost">
                                    <a href="mailto:hello@einaya.io">
                                        {t('landing.ctaSecondary')}
                                    </a>
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section className="border-t bg-muted/40">
                    <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3 lg:px-10">
                        {FEATURES.map(({ icon: Icon, key }, index) => (
                            <motion.div
                                key={key}
                                initial={{ opacity: 0, y: 8 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{
                                    duration: 0.35,
                                    delay: index * 0.08,
                                    ease: 'easeOut',
                                }}
                                className="rounded-2xl border bg-card p-6 shadow-sm"
                            >
                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <h3 className="mt-5 text-h4 text-foreground">
                                    {t(`landing.${key}.title`)}
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {t(`landing.${key}.body`)}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-6 py-20 lg:px-10">
                    <div
                        className="overflow-hidden rounded-3xl px-8 py-12 text-white sm:px-12 lg:py-16"
                        style={{
                            background:
                                'linear-gradient(135deg, rgb(var(--sidebar)) 0%, rgb(var(--accent-foreground)) 100%)',
                        }}
                    >
                        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                            <div className="space-y-3">
                                <h2 className="text-h2 leading-tight">
                                    {t('landing.cta.title')}
                                </h2>
                                <p className="text-base text-cyan-100/90">
                                    {t('landing.cta.body')}
                                </p>
                            </div>
                            <Button asChild size="lg" variant="secondary" className="w-fit">
                                <Link href="/login">
                                    {t('landing.cta.button')}
                                    <ArrowRight className="ms-2 h-4 w-4 rtl:scale-x-[-1]" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                <footer className="border-t">
                    <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center lg:px-10">
                        <div className="flex items-center gap-3">
                            <ApplicationLogo
                                showWordmark={false}
                                className="h-7 w-7"
                            />
                            <span>
                                © {new Date().getFullYear()} Einaya · {t('landing.footer.tagline')}
                            </span>
                        </div>
                        <Link href="/login" className="hover:text-primary">
                            {t('actions.signIn')}
                        </Link>
                    </div>
                </footer>
            </div>
        </>
    );
}
