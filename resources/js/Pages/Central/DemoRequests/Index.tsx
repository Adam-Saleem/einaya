import { router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    Eye,
    Mail,
    MessageCircle,
    RotateCcw,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { StatusBadge } from '@/Components/domain/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
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
import { Textarea } from '@/Components/ui/textarea';
import { useDebouncedFilter } from '@/Hooks/useDebouncedFilter';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import CentralLayout from '@/Layouts/CentralLayout';
import { formatDateTime } from '@/lib/dates';
import type { DemoRequestRow, Paginated } from '@/types/central';

type Filters = {
    search: string;
    intent: string;
    country: string;
    handled: string;
};

type Props = {
    requests: Paginated<DemoRequestRow>;
    filters: Filters;
    unhandledCount: number;
};

export default function DemoRequestsIndex({ requests, filters, unhandledCount }: Props) {
    const { t } = useTranslation('central');
    const { t: tc } = useTranslation('common');
    useFlashToasts();

    const [selected, setSelected] = useState<DemoRequestRow | null>(null);

    const apply = (next: Partial<Filters>) => {
        router.get(
            '/demo-requests',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const [search, setSearch] = useDebouncedFilter(filters.search, (v) =>
        apply({ search: v }),
    );

    const toggleHandled = (row: DemoRequestRow) => {
        router.patch(
            `/demo-requests/${row.id}`,
            { is_handled: !row.is_handled },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <CentralLayout
            title={t('demoRequests.title')}
            pageTitle={t('demoRequests.title')}
            description={t('demoRequests.subtitle', { count: unhandledCount })}
        >
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[220px] flex-1 space-y-1">
                            <Label htmlFor="search">{tc('actions.search')}</Label>
                            <Input
                                id="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('demoRequests.filters.searchPlaceholder')}
                            />
                        </div>
                        <div className="w-44 space-y-1">
                            <Label>{t('demoRequests.filters.handled')}</Label>
                            <Select
                                value={filters.handled || 'unhandled'}
                                onValueChange={(v) => apply({ handled: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unhandled">
                                        {t('demoRequests.filters.unhandled')}
                                    </SelectItem>
                                    <SelectItem value="handled">
                                        {t('demoRequests.filters.handledOnly')}
                                    </SelectItem>
                                    <SelectItem value="all">
                                        {t('demoRequests.filters.all')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-44 space-y-1">
                            <Label>{t('demoRequests.filters.intent')}</Label>
                            <Select
                                value={filters.intent || 'all'}
                                onValueChange={(v) => apply({ intent: v === 'all' ? '' : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {t('demoRequests.filters.allIntents')}
                                    </SelectItem>
                                    <SelectItem value="demo">
                                        {t('demoRequests.intents.demo')}
                                    </SelectItem>
                                    <SelectItem value="register">
                                        {t('demoRequests.intents.register')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('demoRequests.columns.clinic')}</TableHead>
                                <TableHead>{t('demoRequests.columns.contact')}</TableHead>
                                <TableHead>{t('demoRequests.columns.intent')}</TableHead>
                                <TableHead>{t('demoRequests.columns.received')}</TableHead>
                                <TableHead>{t('demoRequests.columns.status')}</TableHead>
                                <TableHead className="text-end">
                                    {t('demoRequests.columns.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.data.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        <p className="font-medium">{row.clinic_name}</p>
                                        {row.country && (
                                            <p className="text-xs text-muted-foreground">
                                                {row.country}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm">{row.contact_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            <a
                                                href={row.mailto_url}
                                                className="hover:text-primary"
                                            >
                                                {row.email}
                                            </a>
                                        </p>
                                        <p className="text-xs text-muted-foreground" dir="ltr">
                                            {row.phone}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            variant={row.intent === 'register' ? 'success' : 'info'}
                                        >
                                            {t(`demoRequests.intents.${row.intent}`)}
                                        </StatusBadge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDateTime(row.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge variant={row.is_handled ? 'neutral' : 'warning'}>
                                            {row.is_handled
                                                ? t('demoRequests.status.handled')
                                                : t('demoRequests.status.pending')}
                                        </StatusBadge>
                                    </TableCell>
                                    <TableCell className="text-end">
                                        <div className="flex items-center justify-end gap-1">
                                            {row.whatsapp_url && (
                                                <Button
                                                    asChild
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={t('demoRequests.actions.whatsapp')}
                                                >
                                                    <a
                                                        href={row.whatsapp_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <MessageCircle className="h-4 w-4 text-success" />
                                                    </a>
                                                </Button>
                                            )}
                                            <Button
                                                asChild
                                                size="icon"
                                                variant="ghost"
                                                aria-label={t('demoRequests.actions.email')}
                                            >
                                                <a href={row.mailto_url}>
                                                    <Mail className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label={
                                                    row.is_handled
                                                        ? t('demoRequests.actions.reopen')
                                                        : t('demoRequests.actions.markHandled')
                                                }
                                                onClick={() => toggleHandled(row)}
                                            >
                                                {row.is_handled ? (
                                                    <RotateCcw className="h-4 w-4" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                                )}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label={t('demoRequests.actions.view')}
                                                onClick={() => setSelected(row)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {requests.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {t('demoRequests.empty')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <DetailsDialog
                row={selected}
                onOpenChange={(open) => !open && setSelected(null)}
            />
        </CentralLayout>
    );
}

function DetailsDialog({
    row,
    onOpenChange,
}: {
    row: DemoRequestRow | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useTranslation('central');
    const { t: tc } = useTranslation('common');
    const noteForm = useForm({ notes: row?.notes ?? '' });

    const submitNotes = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!row) return;
        noteForm.patch(`/demo-requests/${row.id}`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={row !== null} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                {row && (
                    <>
                        <DialogHeader>
                            <DialogTitle>{row.clinic_name}</DialogTitle>
                            <DialogDescription>
                                {t(`demoRequests.intents.${row.intent}`)} ·{' '}
                                {row.created_at && formatDateTime(row.created_at)}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                <div>
                                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                                        {t('demoRequests.detail.contact')}
                                    </dt>
                                    <dd className="font-medium">{row.contact_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                                        {t('demoRequests.detail.country')}
                                    </dt>
                                    <dd>{row.country ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                                        {t('demoRequests.detail.email')}
                                    </dt>
                                    <dd>
                                        <a href={row.mailto_url} className="hover:text-primary">
                                            {row.email}
                                        </a>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                                        {t('demoRequests.detail.phone')}
                                    </dt>
                                    <dd dir="ltr">{row.phone}</dd>
                                </div>
                            </dl>

                            {row.message && (
                                <div className="space-y-1.5">
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                        {t('demoRequests.detail.message')}
                                    </p>
                                    <p className="rounded-md border bg-muted/40 p-3 text-sm">
                                        {row.message}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {row.whatsapp_url && (
                                    <Button asChild variant="outline" size="sm">
                                        <a
                                            href={row.whatsapp_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <MessageCircle className="me-2 h-4 w-4" />
                                            {t('demoRequests.actions.whatsapp')}
                                        </a>
                                    </Button>
                                )}
                                <Button asChild variant="outline" size="sm">
                                    <a href={row.mailto_url}>
                                        <Mail className="me-2 h-4 w-4" />
                                        {t('demoRequests.actions.email')}
                                    </a>
                                </Button>
                            </div>

                            <form onSubmit={submitNotes} className="space-y-2">
                                <Label htmlFor="notes">{t('demoRequests.detail.notes')}</Label>
                                <Textarea
                                    id="notes"
                                    rows={4}
                                    value={noteForm.data.notes}
                                    onChange={(e) => noteForm.setData('notes', e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={noteForm.processing}>
                                        {tc('actions.save')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
