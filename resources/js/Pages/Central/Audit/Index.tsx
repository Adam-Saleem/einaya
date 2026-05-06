import { router } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import CentralLayout from '@/Layouts/CentralLayout';
import type { AuditLog, Paginated } from '@/types/central';

type Props = {
    logs: Paginated<AuditLog>;
    filters: {
        from: string;
        to: string;
        user_id: number | null;
        action: string;
        type: string;
    };
    users: { id: number; name: string; email: string }[];
    actions: string[];
};

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
}

export default function AuditIndex({ logs, filters, users, actions }: Props) {
    const { t } = useTranslation('central');
    const { t: tc } = useTranslation('common');
    const [selected, setSelected] = useState<AuditLog | null>(null);

    const applyFilters = (next: Partial<typeof filters>) => {
        const merged = { ...filters, ...next };
        router.get('/audit', merged, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const types = Array.from(
        new Set(logs.data.map((l) => l.auditable_type).filter(Boolean) as string[]),
    );

    return (
        <CentralLayout
            title={t('audit.title')}
            pageTitle={t('audit.title')}
            description={t('audit.subtitle')}
        >
            <Card>
                <CardContent className="p-4">
                    <div className="grid gap-3 md:grid-cols-5">
                        <div className="space-y-1">
                            <Label htmlFor="audit-from">{t('audit.filters.from')}</Label>
                            <Input
                                id="audit-from"
                                type="date"
                                defaultValue={filters.from}
                                onBlur={(event) => applyFilters({ from: event.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="audit-to">{t('audit.filters.to')}</Label>
                            <Input
                                id="audit-to"
                                type="date"
                                defaultValue={filters.to}
                                onBlur={(event) => applyFilters({ to: event.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t('audit.filters.user')}</Label>
                            <Select
                                value={filters.user_id ? filters.user_id.toString() : 'all'}
                                onValueChange={(value) =>
                                    applyFilters({
                                        user_id: value === 'all' ? null : Number(value),
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('audit.filters.anyUser')}</SelectItem>
                                    {users.map((u) => (
                                        <SelectItem key={u.id} value={u.id.toString()}>
                                            {u.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>{t('audit.filters.action')}</Label>
                            <Select
                                value={filters.action || 'all'}
                                onValueChange={(value) =>
                                    applyFilters({ action: value === 'all' ? '' : value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('audit.filters.anyAction')}</SelectItem>
                                    {actions.map((a) => (
                                        <SelectItem key={a} value={a}>
                                            {a}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>{t('audit.filters.type')}</Label>
                            <Select
                                value={filters.type || 'all'}
                                onValueChange={(value) =>
                                    applyFilters({ type: value === 'all' ? '' : value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('audit.filters.anyType')}</SelectItem>
                                    {types.map((typ) => (
                                        <SelectItem key={typ} value={typ}>
                                            {typ.split('\\').pop()}
                                        </SelectItem>
                                    ))}
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
                                <TableHead>{t('audit.columns.when')}</TableHead>
                                <TableHead>{t('audit.columns.user')}</TableHead>
                                <TableHead>{t('audit.columns.action')}</TableHead>
                                <TableHead>{t('audit.columns.target')}</TableHead>
                                <TableHead>{t('audit.columns.ip')}</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {t('common.noResults')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.data.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm">
                                            {formatDate(log.created_at)}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {log.user?.email ?? 'system'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {log.action}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {log.auditable_type
                                                ? `${log.auditable_type.split('\\').pop()} #${log.auditable_id}`
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {log.ip_address ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setSelected(log)}
                                                aria-label={t('common.viewLog')}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {logs.meta.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {tc('table.showing', {
                            from: logs.meta.from ?? 0,
                            to: logs.meta.to ?? 0,
                            count: logs.meta.total,
                        })}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!logs.links.prev}
                            onClick={() => logs.links.prev && router.visit(logs.links.prev)}
                        >
                            {tc('actions.previous')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!logs.links.next}
                            onClick={() => logs.links.next && router.visit(logs.links.next)}
                        >
                            {tc('actions.next')}
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('audit.diff.title')}</DialogTitle>
                        <DialogDescription>
                            {selected?.action} · {formatDate(selected?.created_at ?? null)}
                        </DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {t('audit.diff.old')}
                                </p>
                                <pre className="whitespace-pre-wrap rounded-md border bg-muted/50 p-3 font-mono text-xs">
                                    {selected.old_values
                                        ? JSON.stringify(selected.old_values, null, 2)
                                        : t('audit.diff.noDiff')}
                                </pre>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {t('audit.diff.new')}
                                </p>
                                <pre className="whitespace-pre-wrap rounded-md border bg-muted/50 p-3 font-mono text-xs">
                                    {selected.new_values
                                        ? JSON.stringify(selected.new_values, null, 2)
                                        : t('audit.diff.noDiff')}
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </CentralLayout>
    );
}
