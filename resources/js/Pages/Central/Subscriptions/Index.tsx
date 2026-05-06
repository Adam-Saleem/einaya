import { router, useForm } from '@inertiajs/react';
import { CalendarPlus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormModal } from '@/Components/domain/FormModal';
import { StatusBadge, type StatusVariant } from '@/Components/domain/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
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
import { Textarea } from '@/Components/ui/textarea';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import CentralLayout from '@/Layouts/CentralLayout';
import type { Paginated, SubscriptionRow, SubscriptionStatus } from '@/types/central';

type Props = {
    subscriptions: Paginated<SubscriptionRow>;
};

const STATUS_VARIANT: Record<SubscriptionStatus, StatusVariant> = {
    trial: 'warning',
    active: 'success',
    past_due: 'danger',
    cancelled: 'neutral',
};

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString();
}

export default function SubscriptionsIndex({ subscriptions }: Props) {
    const { t } = useTranslation('central');
    const { t: tc } = useTranslation('common');
    useFlashToasts();

    const [target, setTarget] = useState<SubscriptionRow | null>(null);
    const form = useForm({ ends_at: '', note: '' });

    const open = (row: SubscriptionRow) => {
        const endsAt = row.ends_at?.slice(0, 10) ?? '';
        form.setDefaults({ ends_at: endsAt, note: '' });
        form.setData({ ends_at: endsAt, note: '' });
        setTarget(row);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!target) return;
        form.patch(`/subscriptions/${target.id}`, {
            preserveScroll: true,
            onSuccess: () => setTarget(null),
        });
    };

    return (
        <CentralLayout
            title={t('subscriptions.title')}
            pageTitle={t('subscriptions.title')}
            description={t('subscriptions.subtitle')}
        >
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('subscriptions.columns.clinic')}</TableHead>
                                <TableHead>{t('subscriptions.columns.plan')}</TableHead>
                                <TableHead>{t('subscriptions.columns.status')}</TableHead>
                                <TableHead>{t('subscriptions.columns.starts')}</TableHead>
                                <TableHead>{t('subscriptions.columns.ends')}</TableHead>
                                <TableHead>{t('subscriptions.columns.trialEnds')}</TableHead>
                                <TableHead className="text-end">
                                    {t('subscriptions.columns.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subscriptions.data.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        {row.clinic?.name ?? '—'}
                                    </TableCell>
                                    <TableCell>{row.plan?.name ?? '—'}</TableCell>
                                    <TableCell>
                                        <StatusBadge variant={STATUS_VARIANT[row.status]}>
                                            {row.status_label}
                                        </StatusBadge>
                                    </TableCell>
                                    <TableCell>{formatDate(row.starts_at)}</TableCell>
                                    <TableCell>{formatDate(row.ends_at)}</TableCell>
                                    <TableCell>{formatDate(row.trial_ends_at)}</TableCell>
                                    <TableCell className="text-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => open(row)}
                                        >
                                            <CalendarPlus className="me-2 h-4 w-4" />
                                            {t('subscriptions.extend')}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {subscriptions.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {t('common.noResults')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {subscriptions.meta.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {tc('table.showing', {
                            from: subscriptions.meta.from ?? 0,
                            to: subscriptions.meta.to ?? 0,
                            count: subscriptions.meta.total,
                        })}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!subscriptions.links.prev}
                            onClick={() =>
                                subscriptions.links.prev && router.visit(subscriptions.links.prev)
                            }
                        >
                            {tc('actions.previous')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!subscriptions.links.next}
                            onClick={() =>
                                subscriptions.links.next && router.visit(subscriptions.links.next)
                            }
                        >
                            {tc('actions.next')}
                        </Button>
                    </div>
                </div>
            )}

            <FormModal
                open={target !== null}
                onOpenChange={(open) => !open && setTarget(null)}
                title={t('subscriptions.extendDialog.title')}
                description={t('subscriptions.extendDialog.description')}
                onSubmit={submit}
                submitting={form.processing}
            >
                <div className="space-y-2">
                    <Label htmlFor="ends-at">{t('subscriptions.extendDialog.endsAt')}</Label>
                    <Input
                        id="ends-at"
                        type="date"
                        value={form.data.ends_at}
                        onChange={(event) => form.setData('ends_at', event.target.value)}
                    />
                    {form.errors.ends_at && (
                        <p className="text-xs text-destructive">{form.errors.ends_at}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="note">{t('subscriptions.extendDialog.note')}</Label>
                    <Textarea
                        id="note"
                        rows={3}
                        value={form.data.note}
                        onChange={(event) => form.setData('note', event.target.value)}
                    />
                </div>
            </FormModal>
        </CentralLayout>
    );
}
