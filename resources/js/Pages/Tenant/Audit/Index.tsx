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
import AppLayout from '@/Layouts/AppLayout';
import type { AuditLog, Paginated } from '@/types/central';

type Props = {
    logs: Paginated<AuditLog>;
    filters: { from: string; to: string; user_id: number | null; action: string };
    users: { id: number; name: string; email: string }[];
    actions: string[];
};

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
}

export default function TenantAuditIndex({ logs, filters, users, actions }: Props) {
    const { t } = useTranslation('tenant');
    const { t: tc } = useTranslation('common');
    const [selected, setSelected] = useState<AuditLog | null>(null);

    const apply = (next: Partial<typeof filters>) => {
        router.get('/audit', { ...filters, ...next }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AppLayout
            title={t('audit.title')}
            pageTitle={t('audit.title')}
            description={t('audit.subtitle')}
        >
            <Card>
                <CardContent className="p-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="space-y-1">
                            <Label htmlFor="audit-from">{t('audit.filters.from')}</Label>
                            <Input
                                id="audit-from"
                                type="date"
                                value={filters.from}
                                onChange={(e) => apply({ from: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="audit-to">{t('audit.filters.to')}</Label>
                            <Input
                                id="audit-to"
                                type="date"
                                value={filters.to}
                                onChange={(e) => apply({ to: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t('audit.filters.user')}</Label>
                            <Select
                                value={filters.user_id ? String(filters.user_id) : 'all'}
                                onValueChange={(v) =>
                                    apply({ user_id: v === 'all' ? null : Number(v) })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('audit.filters.anyUser')}</SelectItem>
                                    {users.map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)}>
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
                                onValueChange={(v) => apply({ action: v === 'all' ? '' : v })}
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
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        {tc('table.noResults')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.data.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm">{formatDate(log.created_at)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {log.user?.email ?? 'system'}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{log.action}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {log.auditable_type
                                                ? `${log.auditable_type.split('\\').pop()} #${log.auditable_id}`
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setSelected(log)}
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

            <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('audit.diffTitle')}</DialogTitle>
                        <DialogDescription>
                            {selected?.action} · {formatDate(selected?.created_at ?? null)}
                        </DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {t('audit.previous')}
                                </p>
                                <pre className="whitespace-pre-wrap rounded-md border bg-muted/50 p-3 font-mono text-xs">
                                    {selected.old_values
                                        ? JSON.stringify(selected.old_values, null, 2)
                                        : '—'}
                                </pre>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {t('audit.next')}
                                </p>
                                <pre className="whitespace-pre-wrap rounded-md border bg-muted/50 p-3 font-mono text-xs">
                                    {selected.new_values
                                        ? JSON.stringify(selected.new_values, null, 2)
                                        : '—'}
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
