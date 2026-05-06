import { router, useForm } from '@inertiajs/react';
import { ExternalLink, Pause, Play, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/Components/domain/ConfirmDialog';
import { StatusBadge, type StatusVariant } from '@/Components/domain/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import CentralLayout from '@/Layouts/CentralLayout';
import type {
    AuditLog,
    ClinicStatus,
    ClinicSummary,
    Plan,
    ResourceCollection,
} from '@/types/central';

type Props = {
    clinic: ClinicSummary;
    plans: ResourceCollection<Plan>;
    usage: { patients: number; staff: number; skipped: boolean } | null;
    auditLogs: ResourceCollection<AuditLog>;
};

const STATUS_VARIANT: Record<ClinicStatus, StatusVariant> = {
    pending: 'warning',
    active: 'success',
    suspended: 'danger',
    cancelled: 'neutral',
};

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
}

export default function ClinicShow({ clinic, plans, usage, auditLogs }: Props) {
    const { t } = useTranslation('central');
    useFlashToasts();

    const [confirm, setConfirm] = useState<'suspend' | 'activate' | 'delete' | null>(null);

    const editForm = useForm({
        name: clinic.name,
        owner_name: clinic.owner_name,
        owner_email: clinic.owner_email,
        owner_phone: clinic.owner_phone ?? '',
        trial_ends_at: clinic.trial_ends_at?.slice(0, 10) ?? '',
    });

    const planForm = useForm({
        plan_id: clinic.plan?.id.toString() ?? plans.data[0]?.id.toString() ?? '',
    });

    const submitEdit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        editForm.patch(`/clinics/${clinic.id}`, { preserveScroll: true });
    };

    const submitPlan = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        planForm.post(`/clinics/${clinic.id}/plan`, { preserveScroll: true });
    };

    const performConfirm = () => {
        if (confirm === 'suspend') {
            router.post(`/clinics/${clinic.id}/suspend`, {}, { preserveScroll: true });
        }
        if (confirm === 'activate') {
            router.post(`/clinics/${clinic.id}/activate`, {}, { preserveScroll: true });
        }
        if (confirm === 'delete') {
            router.delete(`/clinics/${clinic.id}`);
        }
        setConfirm(null);
    };

    return (
        <CentralLayout
            title={clinic.name}
            pageTitle={clinic.name}
            description={
                <span className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{clinic.slug}</span>
                    <StatusBadge variant={STATUS_VARIANT[clinic.status]}>
                        {clinic.status_label}
                    </StatusBadge>
                </span>
            }
            breadcrumbs={[
                { label: t('clinics.title'), href: '/clinics' },
                { label: clinic.name },
            ]}
            actions={
                <Button asChild variant="outline">
                    <a href={clinic.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="me-2 h-4 w-4" />
                        {t('clinics.actions.openSubdomain')}
                    </a>
                </Button>
            }
        >
            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">{t('clinics.show.tabs.overview')}</TabsTrigger>
                    <TabsTrigger value="subscription">
                        {t('clinics.show.tabs.subscription')}
                    </TabsTrigger>
                    <TabsTrigger value="usage">{t('clinics.show.tabs.usage')}</TabsTrigger>
                    <TabsTrigger value="audit">{t('clinics.show.tabs.audit')}</TabsTrigger>
                    <TabsTrigger value="danger">{t('clinics.show.tabs.danger')}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                    <form onSubmit={submitEdit} className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="edit-name">{t('clinics.form.name')}</Label>
                            <Input
                                id="edit-name"
                                value={editForm.data.name}
                                onChange={(event) => editForm.setData('name', event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-owner-name">{t('clinics.form.ownerName')}</Label>
                            <Input
                                id="edit-owner-name"
                                value={editForm.data.owner_name}
                                onChange={(event) =>
                                    editForm.setData('owner_name', event.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-owner-email">{t('clinics.form.ownerEmail')}</Label>
                            <Input
                                id="edit-owner-email"
                                type="email"
                                value={editForm.data.owner_email}
                                onChange={(event) =>
                                    editForm.setData('owner_email', event.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-owner-phone">{t('clinics.form.ownerPhone')}</Label>
                            <Input
                                id="edit-owner-phone"
                                value={editForm.data.owner_phone}
                                onChange={(event) =>
                                    editForm.setData('owner_phone', event.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-trial">
                                {t('clinics.show.overview.trialEndsAt')}
                            </Label>
                            <Input
                                id="edit-trial"
                                type="date"
                                value={editForm.data.trial_ends_at}
                                onChange={(event) =>
                                    editForm.setData('trial_ends_at', event.target.value)
                                }
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <Button type="submit" disabled={editForm.processing}>
                                {t('clinics.form.saveChanges')}
                            </Button>
                        </div>
                    </form>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>{t('clinics.show.overview.subdomain')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <a
                                href={clinic.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-primary hover:underline"
                            >
                                {clinic.url}
                            </a>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subscription" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('clinics.show.subscription.plan')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <dl className="grid gap-2 md:grid-cols-2 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('clinics.show.subscription.plan')}
                                    </dt>
                                    <dd className="font-medium">{clinic.plan?.name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('clinics.show.subscription.status')}
                                    </dt>
                                    <dd className="font-medium">
                                        {clinic.subscription?.status ?? '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('clinics.show.subscription.starts')}
                                    </dt>
                                    <dd>{formatDate(clinic.subscription?.starts_at ?? null)}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('clinics.show.subscription.ends')}
                                    </dt>
                                    <dd>{formatDate(clinic.subscription?.ends_at ?? null)}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">
                                        {t('clinics.show.subscription.trialEnds')}
                                    </dt>
                                    <dd>
                                        {formatDate(clinic.subscription?.trial_ends_at ?? null)}
                                    </dd>
                                </div>
                            </dl>

                            <form onSubmit={submitPlan} className="flex flex-wrap items-end gap-3">
                                <div className="space-y-2 min-w-[240px]">
                                    <Label>{t('clinics.show.subscription.changePlan')}</Label>
                                    <Select
                                        value={planForm.data.plan_id}
                                        onValueChange={(value) =>
                                            planForm.setData('plan_id', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={t(
                                                    'clinics.show.subscription.selectPlan',
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans.data.map((plan) => (
                                                <SelectItem
                                                    key={plan.id}
                                                    value={plan.id.toString()}
                                                >
                                                    {plan.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" disabled={planForm.processing}>
                                    {t('clinics.show.subscription.changePlan')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="usage" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('clinics.show.tabs.usage')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!usage ? (
                                <p className="text-sm text-muted-foreground">
                                    {t('clinics.show.usage.neverComputed')}
                                </p>
                            ) : (
                                <dl className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <dt className="text-muted-foreground text-sm">
                                            {t('clinics.show.usage.patients')}
                                        </dt>
                                        <dd className="text-h2">{usage.patients}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-sm">
                                            {t('clinics.show.usage.staff')}
                                        </dt>
                                        <dd className="text-h2">{usage.staff}</dd>
                                    </div>
                                </dl>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="audit" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            {auditLogs.data.length === 0 ? (
                                <p className="p-6 text-sm text-muted-foreground">
                                    {t('common.noResults')}
                                </p>
                            ) : (
                                <ul className="divide-y">
                                    {auditLogs.data.map((log) => (
                                        <li
                                            key={log.id}
                                            className="flex items-baseline justify-between gap-3 p-4"
                                        >
                                            <div>
                                                <p className="font-mono text-xs">{log.action}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {log.user?.email ?? 'system'}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {formatDate(log.created_at)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="danger" className="mt-4">
                    <Card className="border-destructive/40">
                        <CardHeader>
                            <CardTitle className="text-destructive">
                                {t('clinics.show.tabs.danger')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {clinic.status === 'active' ? (
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium">
                                            {t('clinics.show.danger.suspendTitle')}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {t('clinics.show.danger.suspendDescription')}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => setConfirm('suspend')}
                                    >
                                        <Pause className="me-2 h-4 w-4" />
                                        {t('clinics.actions.suspend')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium">
                                            {t('clinics.show.danger.activateTitle')}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {t('clinics.show.danger.activateDescription')}
                                        </p>
                                    </div>
                                    <Button onClick={() => setConfirm('activate')}>
                                        <Play className="me-2 h-4 w-4" />
                                        {t('clinics.actions.activate')}
                                    </Button>
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-4 border-t pt-4">
                                <div>
                                    <p className="font-medium">
                                        {t('clinics.show.danger.deleteTitle')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('clinics.show.danger.deleteDescription')}
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={() => setConfirm('delete')}
                                >
                                    <Trash2 className="me-2 h-4 w-4" />
                                    {t('clinics.actions.delete')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ConfirmDialog
                open={confirm === 'suspend'}
                onOpenChange={(open) => !open && setConfirm(null)}
                title={t('common.confirmSuspend')}
                description={t('common.confirmSuspendBody')}
                confirmLabel={t('clinics.actions.suspend')}
                onConfirm={performConfirm}
            />
            <ConfirmDialog
                open={confirm === 'activate'}
                onOpenChange={(open) => !open && setConfirm(null)}
                title={t('common.confirmActivate')}
                description={t('common.confirmActivateBody')}
                confirmLabel={t('clinics.actions.activate')}
                destructive={false}
                onConfirm={performConfirm}
            />
            <ConfirmDialog
                open={confirm === 'delete'}
                onOpenChange={(open) => !open && setConfirm(null)}
                title={t('common.confirmDelete')}
                description={t('common.confirmDeleteBody')}
                confirmLabel={t('clinics.actions.delete')}
                onConfirm={performConfirm}
            />
        </CentralLayout>
    );
}
