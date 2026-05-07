import { Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PaymentForm } from '@/Components/domain/PaymentForm';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
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
import { formatDateTime } from '@/lib/dates';
import type { Paginated } from '@/types/central';

type PaymentRow = {
    id: number;
    receipt_number: string;
    amount: number;
    method: string;
    method_label: string;
    status: string;
    paid_at: string | null;
    patient: { id: number; name: string; patient_code: string } | null;
    collector: { id: number; name: string } | null;
};

type Props = {
    payments: Paginated<PaymentRow>;
    totals: { amount: number; count: number };
    filters: { from: string; to: string; method: string };
};


export default function PaymentsIndex({ payments, totals, filters }: Props) {
    const { t } = useTranslation('tenant');
    const { t: tc } = useTranslation('common');
    useFlashToasts();

    const [createOpen, setCreateOpen] = useState(false);

    const apply = (next: Partial<typeof filters>) => {
        router.get(
            '/payments',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <AppLayout
            title={t('payments.title')}
            pageTitle={t('payments.title')}
            description={t('payments.subtitle')}
            actions={
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('payments.create')}
                </Button>
            }
        >
            <Card>
                <CardContent className="grid gap-3 p-4 md:grid-cols-[auto_auto_1fr]">
                    <div className="space-y-1">
                        <Label>{tc('actions.filter')}</Label>
                        <Input
                            type="date"
                            value={filters.from}
                            onChange={(e) => apply({ from: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>&nbsp;</Label>
                        <Input
                            type="date"
                            value={filters.to}
                            onChange={(e) => apply({ to: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>{t('payments.columns.method')}</Label>
                        <Select
                            value={filters.method || 'all'}
                            onValueChange={(v) => apply({ method: v === 'all' ? '' : v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('payments.filters.allMethods')}</SelectItem>
                                <SelectItem value="cash">{t('payments.method.cash')}</SelectItem>
                                <SelectItem value="card">{t('payments.method.card')}</SelectItem>
                                <SelectItem value="insurance">{t('payments.method.insurance')}</SelectItem>
                                <SelectItem value="mixed">{t('payments.method.mixed')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
                {t('payments.totals.amount', {
                    amount: totals.amount.toLocaleString(undefined, {
                        style: 'currency',
                        currency: 'USD', maximumFractionDigits: 0,
                    }),
                })}{' '}
                · {t('payments.totals.count', { count: totals.count })}
            </p>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('payments.columns.receipt')}</TableHead>
                                <TableHead>{t('payments.columns.patient')}</TableHead>
                                <TableHead>{t('payments.columns.amount')}</TableHead>
                                <TableHead>{t('payments.columns.method')}</TableHead>
                                <TableHead>{t('payments.columns.paidAt')}</TableHead>
                                <TableHead>{t('payments.columns.collectedBy')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.data.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-mono text-xs">
                                        <Link
                                            href={`/payments/${p.id}/receipt`}
                                            className="hover:text-primary"
                                        >
                                            {p.receipt_number}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {p.patient ? (
                                            <Link
                                                href={`/patients/${p.patient.id}`}
                                                className="font-medium hover:text-primary"
                                            >
                                                {p.patient.name}
                                            </Link>
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {p.amount.toLocaleString(undefined, {
                                            style: 'currency',
                                            currency: 'USD', maximumFractionDigits: 0,
                                        })}
                                    </TableCell>
                                    <TableCell>{p.method_label}</TableCell>
                                    <TableCell className="text-sm">
                                        {formatDateTime(p.paid_at)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {p.collector?.name ?? '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <PaymentForm open={createOpen} onOpenChange={setCreateOpen} />
        </AppLayout>
    );
}
