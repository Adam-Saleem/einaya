import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/Components/ui/accordion';
import { Button } from '@/Components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import MarketingLayout, { useDemoDialog } from '@/Layouts/MarketingLayout';

type Plan = {
    id: number;
    slug: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
    max_patients: number | null;
    max_staff: number | null;
    features: string[];
};

type Props = { plans: Plan[] };

const FAQ_KEYS = ['changePlan', 'discount', 'data', 'support'] as const;

export default function Pricing({ plans }: Props) {
    const { t } = useTranslation('common');
    const { open } = useDemoDialog();
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

    const ordered = [...plans].sort((a, b) => a.price_monthly - b.price_monthly);
    const featuredSlug = ordered[Math.floor(ordered.length / 2)]?.slug;

    const formatPrice = (n: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(n);

    return (
        <>
            <Head title={t('pricing.metaTitle')} />

            <MarketingLayout active="pricing">
                <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10 lg:py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className="mx-auto max-w-3xl space-y-5 text-center"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                            {t('pricing.eyebrow')}
                        </span>
                        <h1 className="text-h1 leading-tight tracking-tight text-foreground lg:text-display">
                            {t('pricing.headline')}
                        </h1>
                        <p className="text-base text-muted-foreground lg:text-lg">
                            {t('pricing.subhead')}
                        </p>
                    </motion.div>

                    <div className="mt-10 flex justify-center">
                        <Tabs
                            value={billing}
                            onValueChange={(v) => setBilling(v as 'monthly' | 'yearly')}
                        >
                            <TabsList>
                                <TabsTrigger value="monthly">
                                    {t('pricing.billing.monthly')}
                                </TabsTrigger>
                                <TabsTrigger value="yearly">
                                    {t('pricing.billing.yearly')} ·{' '}
                                    <span className="ms-1 text-xs text-success">
                                        {t('pricing.billing.yearlyHint')}
                                    </span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="mt-10 grid gap-6 lg:grid-cols-3">
                        {ordered.map((plan, index) => {
                            const featured = plan.slug === featuredSlug;
                            const price =
                                billing === 'monthly' ? plan.price_monthly : plan.price_yearly / 12;
                            return (
                                <motion.article
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-50px' }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.06,
                                        ease: 'easeOut',
                                    }}
                                    className={
                                        featured
                                            ? 'relative rounded-2xl border-2 border-primary bg-card p-8 shadow-lg'
                                            : 'rounded-2xl border bg-card p-8 shadow-sm'
                                    }
                                >
                                    {featured && (
                                        <span className="absolute -top-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                                            {t('pricing.popular')}
                                        </span>
                                    )}
                                    <h3 className="text-h3 text-foreground">{plan.name}</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {t(`pricing.descriptions.${plan.slug}`, {
                                            defaultValue: '',
                                        })}
                                    </p>
                                    <div className="mt-6 flex items-baseline gap-1">
                                        <span className="text-display text-foreground">
                                            {formatPrice(price)}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            /{t('pricing.month')}
                                        </span>
                                    </div>
                                    {billing === 'yearly' && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {t('pricing.billedYearly', {
                                                amount: formatPrice(plan.price_yearly),
                                            })}
                                        </p>
                                    )}

                                    <ul className="mt-6 space-y-2.5 border-t pt-6 text-sm">
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                            <span>
                                                {plan.max_patients === null
                                                    ? t('pricing.unlimitedPatients')
                                                    : t('pricing.maxPatients', {
                                                          count: plan.max_patients,
                                                      })}
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                            <span>
                                                {plan.max_staff === null
                                                    ? t('pricing.unlimitedStaff')
                                                    : t('pricing.maxStaff', {
                                                          count: plan.max_staff,
                                                      })}
                                            </span>
                                        </li>
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                                <span>
                                                    {t(`pricing.features.${feature}`, {
                                                        defaultValue: feature.replace(/_/g, ' '),
                                                    })}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        className="mt-8 w-full"
                                        variant={featured ? 'default' : 'outline'}
                                        size="lg"
                                        onClick={() => open('register')}
                                    >
                                        {t('pricing.choosePlan', { plan: plan.name })}
                                        <ArrowRight className="ms-2 h-4 w-4 rtl:scale-x-[-1]" />
                                    </Button>
                                </motion.article>
                            );
                        })}
                    </div>
                </section>

                <section className="border-t bg-muted/40">
                    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
                        <h2 className="text-h2 text-foreground">{t('pricing.faq.title')}</h2>
                        <p className="mt-2 text-muted-foreground">{t('pricing.faq.body')}</p>
                        <Accordion type="single" collapsible className="mt-6">
                            {FAQ_KEYS.map((k) => (
                                <AccordionItem key={k} value={k}>
                                    <AccordionTrigger className="text-start">
                                        {t(`pricing.faq.${k}.q`)}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-base text-muted-foreground">
                                        {t(`pricing.faq.${k}.a`)}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
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
                                    {t('pricing.cta.title')}
                                </h2>
                                <p className="text-base text-cyan-100/90">
                                    {t('pricing.cta.body')}
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
