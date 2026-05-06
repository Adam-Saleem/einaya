import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/Components/domain/ConfirmDialog';
import { FormModal } from '@/Components/domain/FormModal';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Textarea } from '@/Components/ui/textarea';
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
import type { Plan, ResourceCollection } from '@/types/central';

type Props = {
    plans: ResourceCollection<Plan>;
};

type PlanFormData = {
    name: string;
    slug: string;
    price_monthly: string;
    price_yearly: string;
    max_patients: string;
    max_staff: string;
    features: string;
    is_active: boolean;
    order: string;
};

const emptyForm: PlanFormData = {
    name: '',
    slug: '',
    price_monthly: '',
    price_yearly: '',
    max_patients: '',
    max_staff: '',
    features: '',
    is_active: true,
    order: '0',
};

function planToFormData(plan: Plan): PlanFormData {
    return {
        name: plan.name,
        slug: plan.slug,
        price_monthly: plan.price_monthly.toString(),
        price_yearly: plan.price_yearly.toString(),
        max_patients: plan.max_patients.toString(),
        max_staff: plan.max_staff.toString(),
        features: (plan.features ?? []).join('\n'),
        is_active: plan.is_active,
        order: plan.order.toString(),
    };
}

export default function PlansIndex({ plans }: Props) {
    const { t } = useTranslation('central');
    useFlashToasts();

    const [editing, setEditing] = useState<Plan | null>(null);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<Plan | null>(null);

    const form = useForm<PlanFormData>(emptyForm);

    const openCreate = () => {
        form.setDefaults(emptyForm);
        form.reset();
        setCreating(true);
    };

    const openEdit = (plan: Plan) => {
        const data = planToFormData(plan);
        form.setDefaults(data);
        form.setData(data);
        setEditing(plan);
    };

    const close = () => {
        setCreating(false);
        setEditing(null);
        form.clearErrors();
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.transform((data: PlanFormData) => ({
            ...data,
            price_monthly: Number(data.price_monthly),
            price_yearly: Number(data.price_yearly),
            max_patients: Number(data.max_patients),
            max_staff: Number(data.max_staff),
            order: Number(data.order),
            features: data.features
                .split(/\n+/)
                .map((line) => line.trim())
                .filter(Boolean),
        }));

        if (editing) {
            form.patch(`/plans/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => close(),
            });
        } else {
            form.post('/plans', {
                preserveScroll: true,
                onSuccess: () => close(),
            });
        }
    };

    const performDelete = () => {
        if (!deleting) return;
        router.delete(`/plans/${deleting.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    return (
        <CentralLayout
            title={t('plans.title')}
            pageTitle={t('plans.title')}
            description={t('plans.subtitle')}
            actions={
                <Button onClick={openCreate}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('plans.create')}
                </Button>
            }
        >
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('plans.columns.name')}</TableHead>
                                <TableHead>{t('plans.columns.slug')}</TableHead>
                                <TableHead>{t('plans.columns.monthly')}</TableHead>
                                <TableHead>{t('plans.columns.yearly')}</TableHead>
                                <TableHead>{t('plans.columns.patients')}</TableHead>
                                <TableHead>{t('plans.columns.staff')}</TableHead>
                                <TableHead>{t('plans.columns.subscribers')}</TableHead>
                                <TableHead>{t('plans.columns.active')}</TableHead>
                                <TableHead className="text-end">
                                    {t('plans.columns.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.data.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {plan.slug}
                                    </TableCell>
                                    <TableCell>${plan.price_monthly.toFixed(2)}</TableCell>
                                    <TableCell>${plan.price_yearly.toFixed(2)}</TableCell>
                                    <TableCell>{plan.max_patients}</TableCell>
                                    <TableCell>{plan.max_staff}</TableCell>
                                    <TableCell>{plan.subscription_count ?? 0}</TableCell>
                                    <TableCell>
                                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                                            {plan.is_active ? '✓' : '—'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-end">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => openEdit(plan)}
                                            aria-label={t('plans.form.editTitle')}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setDeleting(plan)}
                                            aria-label="Delete"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <FormModal
                open={creating || editing !== null}
                onOpenChange={(open) => !open && close()}
                title={
                    editing ? t('plans.form.editTitle') : t('plans.form.createTitle')
                }
                onSubmit={submit}
                submitting={form.processing}
            >
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="plan-name">{t('plans.form.name')}</Label>
                        <Input
                            id="plan-name"
                            value={form.data.name}
                            onChange={(event) => form.setData('name', event.target.value)}
                        />
                        {form.errors.name && (
                            <p className="text-xs text-destructive">{form.errors.name}</p>
                        )}
                    </div>
                    {!editing && (
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="plan-slug">{t('plans.form.slug')}</Label>
                            <Input
                                id="plan-slug"
                                value={form.data.slug}
                                onChange={(event) =>
                                    form.setData(
                                        'slug',
                                        event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                                    )
                                }
                            />
                            {form.errors.slug && (
                                <p className="text-xs text-destructive">{form.errors.slug}</p>
                            )}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="plan-monthly">{t('plans.form.monthly')}</Label>
                        <Input
                            id="plan-monthly"
                            type="number"
                            step="0.01"
                            value={form.data.price_monthly}
                            onChange={(event) =>
                                form.setData('price_monthly', event.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="plan-yearly">{t('plans.form.yearly')}</Label>
                        <Input
                            id="plan-yearly"
                            type="number"
                            step="0.01"
                            value={form.data.price_yearly}
                            onChange={(event) =>
                                form.setData('price_yearly', event.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="plan-patients">{t('plans.form.maxPatients')}</Label>
                        <Input
                            id="plan-patients"
                            type="number"
                            value={form.data.max_patients}
                            onChange={(event) =>
                                form.setData('max_patients', event.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="plan-staff">{t('plans.form.maxStaff')}</Label>
                        <Input
                            id="plan-staff"
                            type="number"
                            value={form.data.max_staff}
                            onChange={(event) =>
                                form.setData('max_staff', event.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="plan-features">{t('plans.form.features')}</Label>
                        <Textarea
                            id="plan-features"
                            rows={4}
                            value={form.data.features}
                            onChange={(event) => form.setData('features', event.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="plan-order">{t('plans.form.order')}</Label>
                        <Input
                            id="plan-order"
                            type="number"
                            value={form.data.order}
                            onChange={(event) => form.setData('order', event.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 self-end">
                        <Switch
                            id="plan-active"
                            checked={form.data.is_active}
                            onCheckedChange={(checked) => form.setData('is_active', checked)}
                        />
                        <Label htmlFor="plan-active">{t('plans.form.isActive')}</Label>
                    </div>
                </div>
            </FormModal>

            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={t('common.confirmPlanDelete')}
                description={t('common.confirmPlanDeleteBody')}
                onConfirm={performDelete}
            />
        </CentralLayout>
    );
}
