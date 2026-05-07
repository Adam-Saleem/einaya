import { Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PatientRegistrationForm } from '@/Components/domain/PatientRegistrationForm';
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
import AppLayout from '@/Layouts/AppLayout';
import { formatDate } from '@/lib/dates';
import type { Paginated } from '@/types/central';

type PatientRow = {
    id: number;
    patient_code: string;
    name: string;
    phone: string;
    age: number | null;
    gender_label: string | null;
    has_insurance: boolean;
    created_at: string | null;
};

type Props = {
    patients: Paginated<PatientRow>;
    filters: { search: string; gender: string; has_insurance: string };
    insuranceProviders: { id: number; name: string }[];
};

export default function PatientsIndex({ patients, filters, insuranceProviders }: Props) {
    const { t } = useTranslation('tenant');
    const { t: tc } = useTranslation('common');
    useFlashToasts();

    const [createOpen, setCreateOpen] = useState(false);

    const apply = (next: Partial<typeof filters>) => {
        router.get(
            '/patients',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const [search, setSearch] = useDebouncedFilter(filters.search, (v) =>
        apply({ search: v }),
    );

    return (
        <AppLayout
            title={t('patients.title')}
            pageTitle={t('patients.title')}
            description={t('patients.subtitle')}
            actions={
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('patients.create')}
                </Button>
            }
        >
            <Card>
                <CardContent className="p-4">
                    <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
                        <Input
                            placeholder={t('patients.search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Select
                            value={filters.gender || 'all'}
                            onValueChange={(v) => apply({ gender: v === 'all' ? '' : v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('patients.filters.allGenders')}</SelectItem>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.has_insurance || 'any'}
                            onValueChange={(v) => apply({ has_insurance: v === 'any' ? '' : v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">{t('patients.filters.anyInsurance')}</SelectItem>
                                <SelectItem value="1">Has insurance</SelectItem>
                                <SelectItem value="0">No insurance</SelectItem>
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
                                <TableHead>{t('patients.columns.code')}</TableHead>
                                <TableHead>{t('patients.columns.name')}</TableHead>
                                <TableHead>{t('patients.columns.phone')}</TableHead>
                                <TableHead>{t('patients.columns.age')}</TableHead>
                                <TableHead>{t('patients.columns.gender')}</TableHead>
                                <TableHead>{t('patients.columns.registeredAt')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {patients.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        {t('patients.noResults')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                patients.data.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-mono text-xs">
                                            <Link
                                                href={`/patients/${p.id}`}
                                                className="hover:text-primary"
                                            >
                                                {p.patient_code}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/patients/${p.id}`}
                                                className="font-medium hover:text-primary"
                                            >
                                                {p.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {p.phone}
                                        </TableCell>
                                        <TableCell>{p.age ?? '—'}</TableCell>
                                        <TableCell>{p.gender_label ?? '—'}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(p.created_at)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {patients.meta.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {tc('table.showing', {
                            from: patients.meta.from ?? 0,
                            to: patients.meta.to ?? 0,
                            count: patients.meta.total,
                        })}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!patients.links.prev}
                            onClick={() => patients.links.prev && router.visit(patients.links.prev)}
                        >
                            {tc('actions.previous')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!patients.links.next}
                            onClick={() => patients.links.next && router.visit(patients.links.next)}
                        >
                            {tc('actions.next')}
                        </Button>
                    </div>
                </div>
            )}

            <PatientRegistrationForm
                open={createOpen}
                onOpenChange={setCreateOpen}
                insuranceProviders={insuranceProviders}
            />
        </AppLayout>
    );
}
