import { Link, router, useForm } from '@inertiajs/react';
import { ExternalLink, Eye, MoreHorizontal, Pause, Play, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/Components/domain/ConfirmDialog';
import { FormModal } from '@/Components/domain/FormModal';
import { StatusBadge, type StatusVariant } from '@/Components/domain/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
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
import CentralLayout from '@/Layouts/CentralLayout';
import type {
    ClinicStatus,
    ClinicSummary,
    Paginated,
    Plan,
    ResourceCollection,
} from '@/types/central';

type Props = {
    clinics: Paginated<ClinicSummary>;
    plans: ResourceCollection<Plan>;
    statuses: { value: ClinicStatus; label: string }[];
    filters: { status: string; plan: string; search: string };
};

const STATUS_VARIANT: Record<ClinicStatus, StatusVariant> = {
    pending: 'warning',
    active: 'success',
    suspended: 'danger',
    cancelled: 'neutral',
};

export default function ClinicsIndex({ clinics, plans, statuses, filters }: Props) {
    const { t } = useTranslation('central');
    const { t: tc } = useTranslation('common');
    useFlashToasts();

    const [createOpen, setCreateOpen] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState<
        { kind: 'suspend' | 'activate' | 'delete'; clinic: ClinicSummary } | null
    >(null);

    const form = useForm({
        name: '',
        slug: '',
        owner_name: '',
        owner_email: '',
        owner_phone: '',
        plan_id: plans.data[0]?.id.toString() ?? '',
        trial_days: '14',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/clinics', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                form.reset();
            },
        });
    };

    const applyFilters = (next: Partial<typeof filters>) => {
        router.get(
            '/clinics',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const handleConfirm = () => {
        if (!confirmTarget) return;
        const { kind, clinic } = confirmTarget;
        const opts = { preserveScroll: true, onFinish: () => setConfirmTarget(null) };

        if (kind === 'suspend') router.post(`/clinics/${clinic.id}/suspend`, {}, opts);
        if (kind === 'activate') router.post(`/clinics/${clinic.id}/activate`, {}, opts);
        if (kind === 'delete') router.delete(`/clinics/${clinic.id}`, opts);
    };

    return (
        <CentralLayout
            title={t('clinics.title')}
            pageTitle={t('clinics.title')}
            description={t('clinics.subtitle')}
            actions={
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('clinics.create')}
                </Button>
            }
        >
            <Card>
                <CardContent className="p-4">
                    <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
                        <Input
                            placeholder={t('clinics.search')}
                            defaultValue={filters.search}
                            onBlur={(event) => applyFilters({ search: event.target.value })}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    applyFilters({ search: event.currentTarget.value });
                                }
                            }}
                        />
                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value) =>
                                applyFilters({ status: value === 'all' ? '' : value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('clinics.filters.allStatuses')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('clinics.filters.allStatuses')}</SelectItem>
                                {statuses.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.plan || 'all'}
                            onValueChange={(value) =>
                                applyFilters({ plan: value === 'all' ? '' : value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('clinics.filters.allPlans')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('clinics.filters.allPlans')}</SelectItem>
                                {plans.data.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.slug}>
                                        {plan.name}
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
                                <TableHead>{t('clinics.columns.clinic')}</TableHead>
                                <TableHead>{t('clinics.columns.owner')}</TableHead>
                                <TableHead>{t('clinics.columns.plan')}</TableHead>
                                <TableHead>{t('clinics.columns.status')}</TableHead>
                                <TableHead>{t('clinics.columns.createdAt')}</TableHead>
                                <TableHead className="text-end">
                                    {t('clinics.columns.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clinics.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        {t('common.noResults')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clinics.data.map((clinic) => (
                                    <TableRow key={clinic.id}>
                                        <TableCell>
                                            <Link
                                                href={`/clinics/${clinic.id}`}
                                                className="block"
                                            >
                                                <span className="font-semibold text-foreground hover:text-primary">
                                                    {clinic.name}
                                                </span>
                                                <span className="block text-xs text-muted-foreground">
                                                    {clinic.slug}
                                                </span>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {clinic.owner_email}
                                        </TableCell>
                                        <TableCell>
                                            {clinic.plan?.name ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge variant={STATUS_VARIANT[clinic.status]}>
                                                {clinic.status_label}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {clinic.created_at
                                                ? new Date(clinic.created_at).toLocaleDateString()
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" aria-label={t('clinics.columns.actions')}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onSelect={() => router.visit(`/clinics/${clinic.id}`)}
                                                    >
                                                        <Eye className="me-2 h-4 w-4" />
                                                        {t('clinics.actions.view')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <a
                                                            href={clinic.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <ExternalLink className="me-2 h-4 w-4" />
                                                            {t('clinics.actions.openSubdomain')}
                                                        </a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {clinic.status === 'active' ? (
                                                        <DropdownMenuItem
                                                            onSelect={() =>
                                                                setConfirmTarget({ kind: 'suspend', clinic })
                                                            }
                                                        >
                                                            <Pause className="me-2 h-4 w-4" />
                                                            {t('clinics.actions.suspend')}
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onSelect={() =>
                                                                setConfirmTarget({ kind: 'activate', clinic })
                                                            }
                                                        >
                                                            <Play className="me-2 h-4 w-4" />
                                                            {t('clinics.actions.activate')}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onSelect={() =>
                                                            setConfirmTarget({ kind: 'delete', clinic })
                                                        }
                                                    >
                                                        <Trash2 className="me-2 h-4 w-4" />
                                                        {t('clinics.actions.delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {clinics.meta.last_page > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {tc('table.showing', {
                            from: clinics.meta.from ?? 0,
                            to: clinics.meta.to ?? 0,
                            count: clinics.meta.total,
                        })}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!clinics.links.prev}
                            onClick={() => clinics.links.prev && router.visit(clinics.links.prev)}
                        >
                            {tc('actions.previous')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!clinics.links.next}
                            onClick={() => clinics.links.next && router.visit(clinics.links.next)}
                        >
                            {tc('actions.next')}
                        </Button>
                    </div>
                </div>
            )}

            <FormModal
                open={createOpen}
                onOpenChange={(open) => {
                    setCreateOpen(open);
                    if (!open) form.reset();
                }}
                title={t('clinics.form.createTitle')}
                onSubmit={submit}
                submitting={form.processing}
                submitLabel={t('clinics.form.submit')}
            >
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="clinic-name">{t('clinics.form.name')}</Label>
                        <Input
                            id="clinic-name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                        />
                        {form.errors.name && (
                            <p className="text-xs text-destructive">{form.errors.name}</p>
                        )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="clinic-slug">{t('clinics.form.slug')}</Label>
                        <Input
                            id="clinic-slug"
                            value={form.data.slug}
                            onChange={(event) =>
                                form.setData(
                                    'slug',
                                    event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                                )
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            {t('clinics.form.slugHint', { slug: form.data.slug || 'name' })}
                        </p>
                        {form.errors.slug && (
                            <p className="text-xs text-destructive">{form.errors.slug}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clinic-owner-name">{t('clinics.form.ownerName')}</Label>
                        <Input
                            id="clinic-owner-name"
                            value={form.data.owner_name}
                            onChange={(event) => form.setData('owner_name', event.target.value)}
                        />
                        {form.errors.owner_name && (
                            <p className="text-xs text-destructive">{form.errors.owner_name}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clinic-owner-email">{t('clinics.form.ownerEmail')}</Label>
                        <Input
                            id="clinic-owner-email"
                            type="email"
                            value={form.data.owner_email}
                            onChange={(event) => form.setData('owner_email', event.target.value)}
                        />
                        {form.errors.owner_email && (
                            <p className="text-xs text-destructive">{form.errors.owner_email}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clinic-owner-phone">{t('clinics.form.ownerPhone')}</Label>
                        <Input
                            id="clinic-owner-phone"
                            value={form.data.owner_phone}
                            onChange={(event) => form.setData('owner_phone', event.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('clinics.form.plan')}</Label>
                        <Select
                            value={form.data.plan_id}
                            onValueChange={(value) => form.setData('plan_id', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.data.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id.toString()}>
                                        {plan.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.errors.plan_id && (
                            <p className="text-xs text-destructive">{form.errors.plan_id}</p>
                        )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="clinic-trial">{t('clinics.form.trialDays')}</Label>
                        <Input
                            id="clinic-trial"
                            type="number"
                            min={0}
                            max={90}
                            value={form.data.trial_days}
                            onChange={(event) => form.setData('trial_days', event.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            {t('clinics.form.trialDaysHint')}
                        </p>
                    </div>
                </div>
            </FormModal>

            <ConfirmDialog
                open={confirmTarget?.kind === 'suspend'}
                onOpenChange={(open) => !open && setConfirmTarget(null)}
                title={t('common.confirmSuspend')}
                description={t('common.confirmSuspendBody')}
                confirmLabel={t('clinics.actions.suspend')}
                onConfirm={handleConfirm}
            />
            <ConfirmDialog
                open={confirmTarget?.kind === 'activate'}
                onOpenChange={(open) => !open && setConfirmTarget(null)}
                title={t('common.confirmActivate')}
                description={t('common.confirmActivateBody')}
                confirmLabel={t('clinics.actions.activate')}
                destructive={false}
                onConfirm={handleConfirm}
            />
            <ConfirmDialog
                open={confirmTarget?.kind === 'delete'}
                onOpenChange={(open) => !open && setConfirmTarget(null)}
                title={t('common.confirmDelete')}
                description={t('common.confirmDeleteBody')}
                confirmLabel={t('clinics.actions.delete')}
                onConfirm={handleConfirm}
            />
        </CentralLayout>
    );
}
