import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { StatusBadge, type StatusVariant } from '@/Components/domain/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
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
import { useDebouncedFilter } from '@/Hooks/useDebouncedFilter';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import CentralLayout from '@/Layouts/CentralLayout';
import type { Paginated, Ticket, TicketStatus } from '@/types/central';

type Props = {
    tickets: Paginated<Ticket>;
    filters: { status: string; search: string };
    statuses: { value: TicketStatus; label: string }[];
};

const STATUS_VARIANT: Record<TicketStatus, StatusVariant> = {
    open: 'warning',
    pending: 'info',
    closed: 'success',
};

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
}

export default function TicketsIndex({ tickets, filters, statuses }: Props) {
    const { t } = useTranslation('central');
    const { t: tc } = useTranslation('common');
    useFlashToasts();

    const applyFilters = (next: Partial<typeof filters>) => {
        router.get(
            '/tickets',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const [search, setSearch] = useDebouncedFilter(filters.search, (v) =>
        applyFilters({ search: v }),
    );

    return (
        <CentralLayout
            title={t('tickets.title')}
            pageTitle={t('tickets.title')}
            description={t('tickets.subtitle')}
        >
            <Card>
                <CardContent className="p-4">
                    <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
                        <Input
                            placeholder={tc('actions.search')}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value) =>
                                applyFilters({ status: value === 'all' ? '' : value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    {t('clinics.filters.allStatuses')}
                                </SelectItem>
                                {statuses.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('tickets.columns.subject')}</TableHead>
                                <TableHead>{t('tickets.columns.clinic')}</TableHead>
                                <TableHead>{t('tickets.columns.openedBy')}</TableHead>
                                <TableHead>{t('tickets.columns.status')}</TableHead>
                                <TableHead>{t('tickets.columns.openedAt')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {t('common.noResults')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tickets.data.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell>
                                            <Link
                                                href={`/tickets/${ticket.id}`}
                                                className="font-medium hover:text-primary"
                                            >
                                                {ticket.subject}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {ticket.clinic?.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {ticket.opened_by_email}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={STATUS_VARIANT[ticket.status]}>
                                                {ticket.status_label}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(ticket.created_at)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {tickets.meta.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {tc('table.showing', {
                            from: tickets.meta.from ?? 0,
                            to: tickets.meta.to ?? 0,
                            count: tickets.meta.total,
                        })}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!tickets.links.prev}
                            onClick={() => tickets.links.prev && router.visit(tickets.links.prev)}
                        >
                            {tc('actions.previous')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!tickets.links.next}
                            onClick={() => tickets.links.next && router.visit(tickets.links.next)}
                        >
                            {tc('actions.next')}
                        </Button>
                    </div>
                </div>
            )}
        </CentralLayout>
    );
}
