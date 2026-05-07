import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { StatusBadge } from '@/Components/domain/StatusBadge';
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

type ConsultationRow = {
    id: number;
    started_at: string | null;
    ended_at: string | null;
    is_completed: boolean;
    chief_complaint: string | null;
    patient: { id: number; patient_code: string; name: string; phone: string } | null;
    doctor: { id: number; name: string | null } | null;
};

type Props = {
    consultations: Paginated<ConsultationRow>;
    filters: { status: string; from: string; to: string; search: string };
};

export default function ConsultationsIndex({ consultations, filters }: Props) {
    const { t } = useTranslation('tenant');
    const { t: tc } = useTranslation('common');
    useFlashToasts();

    const apply = (next: Partial<typeof filters>) => {
        router.get(
            '/consultations',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <AppLayout
            title="Consultations"
            pageTitle="Consultations"
            description="All recorded consultations"
        >
            <Card>
                <CardContent className="grid gap-3 p-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
                    <div className="space-y-1">
                        <Label>{tc('actions.search')}</Label>
                        <Input
                            placeholder="Patient name, code, phone…"
                            defaultValue={filters.search}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') apply({ search: e.currentTarget.value });
                            }}
                            onBlur={(e) => apply({ search: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Status</Label>
                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(v) => apply({ status: v === 'all' ? '' : v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label>From</Label>
                        <Input
                            type="date"
                            defaultValue={filters.from}
                            onBlur={(e) => apply({ from: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>To</Label>
                        <Input
                            type="date"
                            defaultValue={filters.to}
                            onBlur={(e) => apply({ to: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Started</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Chief complaint</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {consultations.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {tc('table.noResults')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                consultations.data.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="text-sm">
                                            {formatDateTime(c.started_at)}
                                        </TableCell>
                                        <TableCell>
                                            {c.patient ? (
                                                <Link
                                                    href={`/patients/${c.patient.id}`}
                                                    className="font-medium hover:text-primary"
                                                >
                                                    {c.patient.name}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                {c.patient?.patient_code}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {c.doctor?.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {c.chief_complaint ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={c.is_completed ? 'success' : 'warning'}>
                                                {c.is_completed ? 'Completed' : 'Open'}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/consultations/${c.id}`}>Open</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {consultations.meta.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {tc('table.showing', {
                            from: consultations.meta.from ?? 0,
                            to: consultations.meta.to ?? 0,
                            count: consultations.meta.total,
                        })}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!consultations.links.prev}
                            onClick={() =>
                                consultations.links.prev && router.visit(consultations.links.prev)
                            }
                        >
                            {tc('actions.previous')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!consultations.links.next}
                            onClick={() =>
                                consultations.links.next && router.visit(consultations.links.next)
                            }
                        >
                            {tc('actions.next')}
                        </Button>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
