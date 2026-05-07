import { router, useForm } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/Components/domain/ConfirmDialog';
import { FormModal } from '@/Components/domain/FormModal';
import { StatusBadge } from '@/Components/domain/StatusBadge';
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
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import AppLayout from '@/Layouts/AppLayout';

type Service = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    price: number;
    is_active: boolean;
    display_order: number;
    created_at: string | null;
    updated_at: string | null;
};

type Paginated<T> = { data: T[] };

type Props = {
    services: Paginated<Service>;
};

type FormShape = {
    name: string;
    code: string;
    description: string;
    price: number;
    is_active: boolean;
    display_order: number;
};

const EMPTY: FormShape = {
    name: '',
    code: '',
    description: '',
    price: 0,
    is_active: true,
    display_order: 0,
};

const formatPrice = (n: number) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(n);

export default function ServicesIndex({ services }: Props) {
    const { t } = useTranslation('tenant');
    const { t: tc } = useTranslation('common');
    useFlashToasts();

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<Service | null>(null);
    const [deleting, setDeleting] = useState<Service | null>(null);

    const create = useForm<FormShape>({ ...EMPTY });
    const edit = useForm<FormShape>({ ...EMPTY });

    const submitCreate = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        create.post('/services', {
            preserveScroll: true,
            onSuccess: () => {
                create.reset();
                setCreateOpen(false);
            },
        });
    };

    const openEdit = (row: Service) => {
        edit.setData({
            name: row.name,
            code: row.code,
            description: row.description ?? '',
            price: row.price,
            is_active: row.is_active,
            display_order: row.display_order,
        });
        edit.clearErrors();
        setEditing(row);
    };

    const submitEdit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editing) return;
        edit.patch(`/services/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    };

    const toggleActive = (row: Service) => {
        router.patch(
            `/services/${row.id}`,
            { is_active: !row.is_active },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <AppLayout
            title={t('services.title')}
            pageTitle={t('services.title')}
            description={t('services.subtitle')}
            actions={
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('services.actions.create')}
                </Button>
            }
        >
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('services.columns.name')}</TableHead>
                                <TableHead>{t('services.columns.code')}</TableHead>
                                <TableHead className="text-end">
                                    {t('services.columns.price')}
                                </TableHead>
                                <TableHead>{t('services.columns.status')}</TableHead>
                                <TableHead className="text-end">
                                    {t('services.columns.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {t('services.empty')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                services.data.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>
                                            <p className="font-medium">{row.name}</p>
                                            {row.description && (
                                                <p className="text-xs text-muted-foreground">
                                                    {row.description}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {row.code}
                                        </TableCell>
                                        <TableCell className="text-end font-mono text-sm">
                                            {formatPrice(row.price)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                variant={row.is_active ? 'success' : 'neutral'}
                                            >
                                                {row.is_active
                                                    ? t('services.status.active')
                                                    : t('services.status.disabled')}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={t('services.columns.actions')}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => openEdit(row)}>
                                                        <Pencil className="me-2 h-4 w-4" />
                                                        {t('services.actions.edit')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onSelect={() => toggleActive(row)}
                                                    >
                                                        <Power className="me-2 h-4 w-4" />
                                                        {row.is_active
                                                            ? t('services.actions.disable')
                                                            : t('services.actions.enable')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onSelect={() => setDeleting(row)}
                                                    >
                                                        <Trash2 className="me-2 h-4 w-4" />
                                                        {t('services.actions.delete')}
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

            <FormModal
                open={createOpen}
                onOpenChange={(o) => {
                    setCreateOpen(o);
                    if (!o) create.reset();
                }}
                title={t('services.form.createTitle')}
                onSubmit={submitCreate}
                submitting={create.processing}
                submitLabel={t('services.actions.create')}
            >
                <Fields form={create} t={t} />
            </FormModal>

            <FormModal
                open={editing !== null}
                onOpenChange={(o) => !o && setEditing(null)}
                title={t('services.form.editTitle')}
                onSubmit={submitEdit}
                submitting={edit.processing}
                submitLabel={tc('actions.save')}
            >
                <Fields form={edit} t={t} />
            </FormModal>

            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(o) => !o && setDeleting(null)}
                title={t('services.confirmDelete.title')}
                description={t('services.confirmDelete.body')}
                onConfirm={() => {
                    if (!deleting) return;
                    router.delete(`/services/${deleting.id}`, {
                        preserveScroll: true,
                        onFinish: () => setDeleting(null),
                    });
                }}
            />
        </AppLayout>
    );
}

type FieldsProps = {
    form: ReturnType<typeof useForm<FormShape>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any;
};

function Fields({ form, t }: FieldsProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">{t('services.form.name')}</Label>
                <Input
                    id="name"
                    autoFocus
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                />
                {form.errors.name && (
                    <p className="text-sm text-destructive">{form.errors.name}</p>
                )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="code">{t('services.form.code')}</Label>
                    <Input
                        id="code"
                        value={form.data.code}
                        onChange={(e) => form.setData('code', e.target.value.toLowerCase())}
                        className="font-mono"
                        placeholder="auto-generated"
                    />
                    {form.errors.code && (
                        <p className="text-sm text-destructive">{form.errors.code}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price">{t('services.form.price')}</Label>
                    <Input
                        id="price"
                        type="number"
                        step="1"
                        min={0}
                        value={form.data.price}
                        onChange={(e) => form.setData('price', Number(e.target.value))}
                    />
                    {form.errors.price && (
                        <p className="text-sm text-destructive">{form.errors.price}</p>
                    )}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">{t('services.form.description')}</Label>
                <Textarea
                    id="description"
                    rows={2}
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                />
            </div>
            <label className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                    <p className="text-sm font-medium">{t('services.form.isActive')}</p>
                    <p className="text-xs text-muted-foreground">
                        {t('services.form.isActiveHint')}
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
