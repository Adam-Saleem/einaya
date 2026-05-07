import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Database,
    KeyRound,
    ScrollText,
    ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
    ConsultationsIllustration,
    RecordsIllustration,
    SchedulingIllustration,
} from '@/Components/marketing/FeatureIllustrations';
import { HeroDashboard } from '@/Components/marketing/HeroDashboard';
import { SecurityDiagram } from '@/Components/marketing/SecurityDiagram';
import { Button } from '@/Components/ui/button';
import MarketingLayout, { useDemoDialog } from '@/Layouts/MarketingLayout';

const FEATURES = [
    { illustration: SchedulingIllustration, key: 'scheduling' as const },
    { illustration: RecordsIllustration, key: 'records' as const },
    { illustration: ConsultationsIllustration, key: 'consultations' as const },
];

const SECURITY_PILLARS = [
    { icon: Database, key: 'isolation' as const },
    { icon: KeyRound, key: 'auth' as const },
    { icon: ScrollText, key: 'audit' as const },
    { icon: ShieldCheck, key: 'redaction' as const },
];

export default function Welcome() {
    const { t } = useTranslation('common');
    const { open } = useDemoDialog();

    return (
        <>
            <Head title="Einaya — clinic management" />

            <MarketingLayout active="home">
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

                    <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:px-10 lg:pb-32 lg:pt-20">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="space-y-6"
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
                                <Button size="lg" onClick={() => open('demo')}>
                                    {t('landing.ctaPrimary')}
                                    <ArrowRight className="ms-2 h-4 w-4 rtl:scale-x-[-1]" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="ghost"
                                    onClick={() => open('register')}
                                >
                                    {t('landing.ctaSecondary')}
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-tr from-primary/15 to-success/10 blur-2xl" />
                            <HeroDashboard className="w-full drop-shadow-xl" />
                        </motion.div>
                    </div>
                </section>

                <section className="border-t bg-muted/40">
                    <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3 lg:px-10">
                        {FEATURES.map(({ illustration: Illustration, key }, index) => (
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
                                className="overflow-hidden rounded-2xl border bg-card shadow-sm"
                            >
                                <Illustration />
                                <div className="space-y-2 p-6">
                                    <h3 className="text-h4 text-foreground">
                                        {t(`landing.features.${key}.title`)}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {t(`landing.features.${key}.body`)}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-6 py-20 lg:px-10">
                    <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="space-y-5"
                        >
                            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {t('landing.security.eyebrow')}
                            </span>
                            <h2 className="text-h2 leading-tight text-foreground">
                                {t('landing.security.title')}
                            </h2>
                            <p className="max-w-xl text-base text-muted-foreground">
                                {t('landing.security.body')}
                            </p>
                            <ul className="grid gap-3 pt-2 sm:grid-cols-2">
                                {SECURITY_PILLARS.map(({ icon: Icon, key }) => (
                                    <li
                                        key={key}
                                        className="flex items-start gap-3 rounded-xl border bg-card p-3"
                                    >
                                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {t(`landing.security.pillars.${key}.title`)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t(`landing.security.pillars.${key}.body`)}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                        >
                            <SecurityDiagram className="w-full" />
                        </motion.div>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-6 pb-20 lg:px-10">
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
                            <Button
                                size="lg"
                                variant="secondary"
                                className="w-fit"
                                onClick={() => open('register')}
                            >
                                {t('landing.cta.button')}
                                <ArrowRight className="ms-2 h-4 w-4 rtl:scale-x-[-1]" />
                            </Button>
                        </div>
                    </div>
                </section>
            </MarketingLayout>
        </>
    );
}
