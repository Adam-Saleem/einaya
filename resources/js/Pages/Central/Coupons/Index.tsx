import { router, useForm } from '@inertiajs/react';
import {
    Copy,
    MoreHorizontal,
    Pencil,
    Plus,
    Power,
    Trash2,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
import { Switch } from '@/Components/ui/switch';
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
import type { CouponRow, CouponStatus, Paginated } from '@/types/central';

type PlanOption = { id: number; name: string; slug: string };

type Filters = { search: string; status: string; plan_id: number | null };

type Props = {
    coupons: Paginated<CouponRow>;
    plans: PlanOption[];
    filters: Filters;
};

const STATUS_VARIANT: Record<CouponStatus, StatusVariant> = {
    active: 'success',
    expired: 'neutral',
    exhausted: 'neutral',
    disabled: 'warning',
};

const randomCode = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 8; i++) {
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
};

type FormShape = {
    code: string;
    plan_id: string;
    duration_days: number;
    max_uses: number;
    expires_at: string;
    description: string;
    is_active: boolean;
};

const EMPTY_FORM: FormShape = {
    code: '',
    plan_id: '',
    duration_days: 30,
    max_uses: 1,
    expires_at: '',
    description: '',
    is_active: true,
};

export default function CouponsIndex({ coupons, plans, filters }: Props) {
    const { t } = useTranslation('central');
    const { t: tc } = useTranslation('common');
    useFlashToasts();

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<CouponRow | null>(null);
    const [deleting, setDeleting] = useState<CouponRow | null>(null);

    const apply = (next: Partial<Filters>) => {
        router.get(
            '/coupons',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const [search, setSearch] = useDebouncedFilter(filters.search, (v) =>
        apply({ search: v }),
    );

    const create = useForm<FormShape>({ ...EMPTY_FORM });
    const edit = useForm<FormShape>({ ...EMPTY_FORM });

    const submitCreate = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        create.post('/coupons', {
            preserveScroll: true,
            onSuccess: () => {
                create.reset();
                setCreateOpen(false);
            },
        });
    };

    const openEdit = (row: CouponRow) => {
        edit.setData({
            code: row.code,
            plan_id: row.plan?.id?.toString() ?? '',
            duration_days: row.duration_days,
            max_uses: row.max_uses,
            expires_at: row.expires_at ? row.expires_at.slice(0, 10) : '',
            description: row.description ?? '',
            is_active: row.is_active,
        });
        edit.clearErrors();
        setEditing(row);
    };

    const submitEdit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editing) return;
        edit.patch(`/coupons/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    };

    const toggleActive = (row: CouponRow) => {
        router.patch(
            `/coupons/${row.id}`,
            { is_active: !row.is_active },
            { preserveScroll: true, preserveState: true },
        );
    };

    const copyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            toast.success(t('coupons.toast.copied'));
        } catch {
            toast.error(t('coupons.toast.copyFailed'));
        }
    };

    return (
        <CentralLayout
            title={t('coupons.title')}
            pageTitle={t('coupons.title')}
            description={t('coupons.subtitle')}
            actions={
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('coupons.actions.create')}
                </Button>
            }
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
                                placeholder={t('coupons.filters.searchPlaceholder')}
                            />
                        </div>
                        <div className="w-44 space-y-1">
                            <Label>{t('coupons.filters.status')}</Label>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(v) => apply({ status: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {t('coupons.filters.all')}
                                    </SelectItem>
                                    <SelectItem value="active">
                                        {t('coupons.status.active')}
                                    </SelectItem>
                                    <SelectItem value="expired">
                                        {t('coupons.status.expired')}
                                    </SelectItem>
                                    <SelectItem value="exhausted">
                                        {t('coupons.status.exhausted')}
                                    </SelectItem>
                                    <SelectItem value="disabled">
                                        {t('coupons.status.disabled')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-44 space-y-1">
                            <Label>{t('coupons.filters.plan')}</Label>
                            <Select
                                value={filters.plan_id?.toString() ?? 'all'}
                                onValueChange={(v) =>
                                    apply({ plan_id: v === 'all' ? null : Number(v) })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {t('coupons.filters.allPlans')}
                                    </SelectItem>
                                    {plans.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.name}
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
                                <TableHead>{t('coupons.columns.code')}</TableHead>
                                <TableHead>{t('coupons.columns.plan')}</TableHead>
                                <TableHead>{t('coupons.columns.duration')}</TableHead>
                                <TableHead>{t('coupons.columns.uses')}</TableHead>
                                <TableHead>{t('coupons.columns.expiresAt')}</TableHead>
                                <TableHead>{t('coupons.columns.status')}</TableHead>
                                <TableHead className="text-end">
                                    {t('coupons.columns.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coupons.data.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        <button
                                            type="button"
                                            onClick={() => copyCode(row.code)}
                                            className="font-mono text-sm font-semibold hover:text-primary"
                                            title={t('coupons.actions.copy')}
                                        >
                                            {row.code}
                                        </button>
                                        {row.description && (
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {row.description}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell>{row.plan?.name ?? '—'}</TableCell>
                                    <TableCell>
                                        {t('coupons.daysCount', { count: row.duration_days })}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {row.used_count} / {row.max_uses}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {row.expires_at
                                            ? formatDateTime(row.expires_at)
                                            : t('coupons.never')}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge variant={STATUS_VARIANT[row.status]}>
                                            {t(`coupons.status.${row.status}`)}
                                        </StatusBadge>
                                    </TableCell>
                                    <TableCell className="text-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={t('coupons.columns.actions')}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => copyCode(row.code)}>
                                                    <Copy className="me-2 h-4 w-4" />
                                                    {t('coupons.actions.copy')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => openEdit(row)}>
                                                    <Pencil className="me-2 h-4 w-4" />
                                                    {t('coupons.actions.edit')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => toggleActive(row)}>
                                                    <Power className="me-2 h-4 w-4" />
                                                    {row.is_active
                                                        ? t('coupons.actions.disable')
                                                        : t('coupons.actions.enable')}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onSelect={() => setDeleting(row)}
                                                >
                                                    <Trash2 className="me-2 h-4 w-4" />
                                                    {t('coupons.actions.delete')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {coupons.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {t('coupons.empty')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <FormModal
                open={createOpen}
                onOpenChange={(o) => {
                    setCreateOpen(o);
                    if (!o) create.reset();
                }}
                title={t('coupons.form.createTitle')}
                onSubmit={submitCreate}
                submitting={create.processing}
                submitLabel={t('coupons.actions.create')}
            >
                <CouponFields form={create} plans={plans} t={t} />
            </FormModal>

            <FormModal
                open={editing !== null}
                onOpenChange={(o) => !o && setEditing(null)}
                title={t('coupons.form.editTitle')}
                onSubmit={submitEdit}
                submitting={edit.processing}
            >
                <CouponFields form={edit} plans={plans} t={t} editingCode />
            </FormModal>

            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(o) => !o && setDeleting(null)}
                title={t('coupons.confirmDelete.title')}
                description={
                    deleting && deleting.used_count > 0
                        ? t('coupons.confirmDelete.usedBody', { count: deleting.used_count })
                        : t('coupons.confirmDelete.body')
                }
                onConfirm={() => {
                    if (!deleting) return;
                    router.delete(`/coupons/${deleting.id}`, {
                        preserveScroll: true,
                        onFinish: () => setDeleting(null),
                    });
                }}
            />
        </CentralLayout>
    );
}

type FieldsProps = {
    form: ReturnType<typeof useForm<FormShape>>;
    plans: PlanOption[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any;
    editingCode?: boolean;
};

function CouponFields({ form, plans, t, editingCode = false }: FieldsProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="code">{t('coupons.form.code')}</Label>
                <div className="flex gap-2">
                    <Input
                        id="code"
                        value={form.data.code}
                        onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                        className="font-mono uppercase"
                        readOnly={editingCode}
                    />
                    {!editingCode && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => form.setData('code', randomCode())}
                        >
                            {t('coupons.form.generate')}
                        </Button>
                    )}
                </div>
                {form.errors.code && (
                    <p className="text-sm text-destructive">{form.errors.code}</p>
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>{t('coupons.form.plan')}</Label>
                    <Select
                        value={form.data.plan_id}
                        onValueChange={(v) => form.setData('plan_id', v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t('coupons.form.choosePlan')} />
                        </SelectTrigger>
                        <SelectContent>
                            {plans.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {form.errors.plan_id && (
                        <p className="text-sm text-destructive">{form.errors.plan_id}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="duration_days">{t('coupons.form.durationDays')}</Label>
                    <Input
                        id="duration_days"
                        type="number"
                        min={1}
                        value={form.data.duration_days}
                        onChange={(e) =>
                            form.setData('duration_days', Number(e.target.value))
                        }
                    />
                    {form.errors.duration_days && (
                        <p className="text-sm text-destructive">{form.errors.duration_days}</p>
                    )}
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="max_uses">{t('coupons.form.maxUses')}</Label>
                    <Input
                        id="max_uses"
                        type="number"
                        min={1}
                        value={form.data.max_uses}
                        onChange={(e) => form.setData('max_uses', Number(e.target.value))}
                    />
                    {form.errors.max_uses && (
                        <p className="text-sm text-destructive">{form.errors.max_uses}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="expires_at">{t('coupons.form.expiresAt')}</Label>
                    <Input
                        id="expires_at"
                        type="date"
                        value={form.data.expires_at}
                        onChange={(e) => form.setData('expires_at', e.target.value)}
                    />
                    {form.errors.expires_at && (
                        <p className="text-sm text-destructive">{form.errors.expires_at}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">{t('coupons.form.description')}</Label>
                <Textarea
                    id="description"
                    rows={2}
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                />
            </div>

            <label className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                    <p className="text-sm font-medium">{t('coupons.form.isActive')}</p>
                    <p className="text-xs text-muted-foreground">
                        {t('coupons.form.isActiveHint')}
                    </p>
                </div>
                <Switch
                    checked={form.data.is_active}
                    onCheckedChange={(v) => form.setData('is_active', Boolean(v))}
                />
            </label>
        </div>
    );
}
