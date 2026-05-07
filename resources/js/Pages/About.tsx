import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, HeartHandshake, Microscope, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import MarketingLayout, { useDemoDialog } from '@/Layouts/MarketingLayout';

const VALUES = [
    { icon: HeartHandshake, key: 'patientFirst' },
    { icon: ShieldCheck, key: 'privacy' },
    { icon: Microscope, key: 'clinical' },
    { icon: Globe, key: 'bilingual' },
] as const;

const PHOTOS = [
    {
        src: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
        alt: 'Clinic reception desk with calm, organized layout',
        wide: true,
    },
    {
        src: 'https://images.unsplash.com/photo-1631815587646-b85a1bb027e1?auto=format&fit=crop&w=600&q=80',
        alt: 'Doctor reviewing notes with a patient',
    },
    {
        src: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
        alt: 'Stethoscope and laptop on a wooden desk',
    },
    {
        src: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=900&q=80',
        alt: 'Calendar and tablet showing scheduled appointments',
        wide: true,
    },
];

export default function About() {
    const { t } = useTranslation('common');
    const { open } = useDemoDialog();

    return (
        <>
            <Head title={t('about.metaTitle')} />

            <MarketingLayout active="about">
                <section className="mx-auto max-w-6xl px-6 pb-12 pt-12 lg:px-10 lg:pt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className="max-w-3xl space-y-5"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                            {t('about.eyebrow')}
                        </span>
                        <h1 className="text-h1 leading-tight tracking-tight text-foreground lg:text-display">
                            {t('about.headline')}
                        </h1>
                        <p className="max-w-2xl text-base text-muted-foreground lg:text-lg">
                            {t('about.subhead')}
                        </p>
                    </motion.div>
                </section>

                <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-10">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {PHOTOS.map((photo) => (
                            <motion.figure
                                key={photo.src}
                                initial={{ opacity: 0, y: 8 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className={
                                    photo.wide
                                        ? 'col-span-2 aspect-[4/3] overflow-hidden rounded-2xl bg-muted'
                                        : 'col-span-1 aspect-square overflow-hidden rounded-2xl bg-muted'
                                }
                            >
                                <img
                                    src={photo.src}
                                    alt={photo.alt}
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                />
                            </motion.figure>
                        ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                        {t('about.photoCredit')}
                    </p>
                </section>

                <section className="border-y bg-muted/40">
                    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:px-10">
                        <div className="space-y-3">
                            <p className="text-xs font-medium uppercase tracking-wider text-primary">
                                {t('about.story.eyebrow')}
                            </p>
                            <h2 className="text-h2 text-foreground">
                                {t('about.story.title')}
                            </h2>
                        </div>
                        <div className="space-y-4 text-base text-muted-foreground">
                            <p>{t('about.story.p1')}</p>
                            <p>{t('about.story.p2')}</p>
                            <p>{t('about.story.p3')}</p>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
                    <h2 className="text-h2 text-foreground">{t('about.values.title')}</h2>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        {t('about.values.body')}
                    </p>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {VALUES.map(({ icon: Icon, key }) => (
                            <div
                                key={key}
                                className="rounded-2xl border bg-card p-6 shadow-sm"
                            >
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <h3 className="mt-4 text-h4 text-foreground">
                                    {t(`about.values.${key}.title`)}
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {t(`about.values.${key}.body`)}
                                </p>
                            </div>
                        ))}
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
                                    {t('about.cta.title')}
                                </h2>
                                <p className="text-base text-cyan-100/90">
                                    {t('about.cta.body')}
                                </p>
                            </div>
                            <Button
                                size="lg"
                                variant="secondary"
                                className="w-fit"
                                onClick={() => open('demo')}
                            >
                                {t('demoRequest.title')}
                                <ArrowRight className="ms-2 h-4 w-4 rtl:scale-x-[-1]" />
                            </Button>
                        </div>
                    </div>
                </section>
            </MarketingLayout>
        </>
    );
}
