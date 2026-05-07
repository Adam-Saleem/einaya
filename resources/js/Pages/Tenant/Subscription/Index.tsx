import { useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CalendarClock, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { StatusBadge, type StatusVariant } from '@/Components/domain/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatDateTime } from '@/lib/dates';

type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled';

type Subscription = {
    id: number;
    status: SubscriptionStatus;
    status_label: string;
    starts_at: string | null;
    ends_at: string | null;
    days_remaining: number | null;
    is_expiring_soon: boolean;
    plan: { id: number; slug: string; name: string; price_monthly: number } | null;
};

type Plan = {
    id: number;
    slug: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
    features: string[];
    is_current: boolean;
};

type HistoryRow = {
    id: number;
    code: string | null;
    applied_days: number;
    prior_plan: string | null;
    new_plan: string | null;
    prior_ends_at: string | null;
    new_ends_at: string | null;
    redeemed_at: string | null;
};

type Props = {
    subscription: Subscription | null;
    plans: Plan[];
    history: HistoryRow[];
};

const STATUS_VARIANT: Record<SubscriptionStatus, StatusVariant> = {
    trial: 'warning',
    active: 'success',
    past_due: 'danger',
    cancelled: 'neutral',
};

export default function SubscriptionIndex({ subscription, plans, history }: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    const form = useForm({ code: '' });

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.post('/subscription/redeem', {
            preserveScroll: true,
            onSuccess: () => form.reset('code'),
        });
    };

    const daysRemaining = subscription?.days_remaining;
    const remainingTone =
        daysRemaining === null || daysRemaining === undefined
            ? 'neutral'
            : daysRemaining <= 3
              ? 'danger'
              : daysRemaining <= 14
                ? 'warning'
                : 'success';

    const formatPrice = (n: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(n);

    return (
        <AppLayout
            title={t('subscription.title')}
            pageTitle={t('subscription.title')}
            description={t('subscription.subtitle')}
        >
            {/* Current plan card */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                            <CardTitle className="text-h3">
                                {subscription?.plan?.name ?? t('subscription.noPlan')}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {subscription?.plan
                                    ? t('subscription.planPrice', {
                                          amount: formatPrice(subscription.plan.price_monthly),
                                      })
                                    : t('subscription.noPlanBody')}
                            </p>
                        </div>
                        {subscription && (
                            <StatusBadge variant={STATUS_VARIANT[subscription.status]}>
                                {subscription.status_label}
                            </StatusBadge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        <Stat
                            icon={CalendarClock}
                            label={t('subscription.endsAt')}
                            value={
                                subscription?.ends_at
                                    ? formatDate(subscription.ends_at)
                                    : t('subscription.noEnd')
                            }
                        />
                        <Stat
                            icon={Sparkles}
                            label={t('subscription.daysRemaining')}
                            value={
                                daysRemaining !== null && daysRemaining !== undefined
                                    ? t('subscription.daysCount', { count: daysRemaining })
                                    : '—'
                            }
                            tone={remainingTone}
                        />
                        <Stat
                            icon={ShieldCheck}
                            label={t('subscription.startedAt')}
                            value={
                                subscription?.starts_at
                                    ? formatDate(subscription.starts_at)
                                    : '—'
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Coupon form + plan catalogue side by side */}
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('subscription.coupon.title')}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {t('subscription.coupon.body')}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">{t('subscription.coupon.code')}</Label>
                                <Input
                                    id="code"
                                    value={form.data.code}
                                    onChange={(e) =>
                                        form.setData('code', e.target.value.toUpperCase())
                                    }
                                    placeholder="ABCD-1234"
                                    className="font-mono uppercase"
                                    autoFocus
                                />
                                {form.errors.code && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.code}
                                    </p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full"
                                disabled={form.processing || form.data.code.trim() === ''}
                            >
                                {form.processing
                                    ? t('subscription.coupon.applying')
                                    : t('subscription.coupon.apply')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('subscription.catalogue.title')}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {t('subscription.catalogue.body')}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {plans.map((plan) => (
                                <motion.li
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className={
                                        plan.is_current
                                            ? 'rounded-lg border-2 border-primary bg-primary/5 p-4'
                                            : 'rounded-lg border bg-card p-4'
                                    }
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold">{plan.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatPrice(plan.price_monthly)} / {t('subscription.month')}
                                            </p>
                                        </div>
                                        {plan.is_current && (
                                            <StatusBadge variant="info">
                                                {t('subscription.catalogue.current')}
                                            </StatusBadge>
                                        )}
                                    </div>
                                    {plan.features.length > 0 && (
                                        <ul className="mt-3 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                                            {plan.features.slice(0, 6).map((f) => (
                                                <li key={f} className="flex items-center gap-1">
                                                    <Check className="h-3 w-3 text-success" />
                                                    {f.replace(/_/g, ' ')}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </motion.li>
                            ))}
                        </ul>
                        <p className="mt-4 text-xs text-muted-foreground">
                            {t('subscription.catalogue.contact')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Redemption history */}
            {history.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('subscription.history.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('subscription.history.code')}</TableHead>
                                    <TableHead>{t('subscription.history.transition')}</TableHead>
                                    <TableHead>{t('subscription.history.appliedDays')}</TableHead>
                                    <TableHead>{t('subscription.history.newEndsAt')}</TableHead>
                                    <TableHead>{t('subscription.history.redeemedAt')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-mono text-sm">
                                            {row.code ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {row.prior_plan && row.prior_plan !== row.new_plan
                                                ? `${row.prior_plan} → ${row.new_plan}`
                                                : row.new_plan ?? '—'}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            +{row.applied_days}d
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {row.new_ends_at ? formatDate(row.new_ends_at) : '—'}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {row.redeemed_at ? formatDateTime(row.redeemed_at) : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

        </AppLayout>
    );
}

type Tone = 'neutral' | 'success' | 'warning' | 'danger';

function Stat({
    icon: Icon,
    label,
    value,
    tone = 'neutral',
}: {
    icon: typeof CalendarClock;
    label: string;
    value: string;
    tone?: Tone;
}) {
    const toneClass = {
        neutral: 'text-foreground',
        success: 'text-success',
        warning: 'text-warning',
        danger: 'text-destructive',
    }[tone];

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </div>
            <p className={`text-h4 font-semibold ${toneClass}`}>{value}</p>
        </div>
    );
}
