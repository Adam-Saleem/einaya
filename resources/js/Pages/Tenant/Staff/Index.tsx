import { router, useForm } from '@inertiajs/react';
import { KeyRound, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/Components/ui/tooltip';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import AppLayout from '@/Layouts/AppLayout';
import { formatDateTime } from '@/lib/dates';
import type { Paginated, StaffRow } from '@/types/tenant';

type Props = {
    staff: Paginated<StaffRow>;
};

type CreateForm = {
    name: string;
    email: string;
    phone: string;
    role: 'secretary';
    is_active: boolean;
};

type EditForm = Pick<StaffRow, 'name' | 'email' | 'phone' | 'is_active'>;

export default function StaffIndex({ staff }: Props) {
    const { t } = useTranslation('tenant');
    const { t: tc } = useTranslation('common');
    useFlashToasts();

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<StaffRow | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<
        { kind: 'delete' | 'reset'; row: StaffRow } | null
    >(null);

    const createForm = useForm<CreateForm>({
        name: '',
        email: '',
        phone: '',
        role: 'secretary',
        is_active: true,
    });

    const editForm = useForm<EditForm>({
        name: '',
        email: '',
        phone: '',
        is_active: true,
    });

    const submitCreate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createForm.post('/staff', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const submitEdit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editing) return;
        editForm.patch(`/staff/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    };

    const openEdit = (row: StaffRow) => {
        const next: EditForm = {
            name: row.name,
            email: row.email,
            phone: row.phone ?? '',
            is_active: row.is_active,
        };
        editForm.setDefaults(next);
        editForm.setData(next);
        setEditing(row);
    };

    const performConfirm = () => {
        if (!confirmTarget) return;
        const opts = { preserveScroll: true, onFinish: () => setConfirmTarget(null) };
        if (confirmTarget.kind === 'delete') {
            router.delete(`/staff/${confirmTarget.row.id}`, opts);
        }
        if (confirmTarget.kind === 'reset') {
            router.post(`/staff/${confirmTarget.row.id}/reset-password`, {}, opts);
        }
    };

    return (
        <AppLayout
            title={t('staff.title')}
            pageTitle={t('staff.title')}
            description={t('staff.subtitle')}
            actions={
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('staff.create')}
                </Button>
            }
        >
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('staff.columns.name')}</TableHead>
                                <TableHead>{t('staff.columns.email')}</TableHead>
                                <TableHead>{t('staff.columns.role')}</TableHead>
                                <TableHead>{t('staff.columns.lastLogin')}</TableHead>
                                <TableHead>{t('staff.columns.status')}</TableHead>
                                <TableHead className="text-end">
                                    {t('staff.columns.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.data.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">{row.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {row.email}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {row.roles?.join(', ') ?? '—'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDateTime(row.last_login_at)}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge variant={row.is_active ? 'success' : 'neutral'}>
                                            {row.is_active ? t('staff.active') : t('staff.inactive')}
                                        </StatusBadge>
                                    </TableCell>
                                    <TableCell className="text-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => openEdit(row)}>
                                                    <Pencil className="me-2 h-4 w-4" />
                                                    {t('staff.actions.edit')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onSelect={() =>
                                                        setConfirmTarget({ kind: 'reset', row })
                                                    }
                                                >
                                                    <KeyRound className="me-2 h-4 w-4" />
                                                    {t('staff.actions.resetPassword')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onSelect={() =>
                                                        setConfirmTarget({ kind: 'delete', row })
                                                    }
                                                >
                                                    <Trash2 className="me-2 h-4 w-4" />
                                                    {t('staff.actions.delete')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {staff.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        {tc('table.noResults')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <FormModal
                open={createOpen}
                onOpenChange={(open) => {
                    setCreateOpen(open);
                    if (!open) createForm.reset();
                }}
                title={t('staff.form.createTitle')}
                onSubmit={submitCreate}
                submitting={createForm.processing}
            >
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="staff-name">{t('staff.form.name')}</Label>
                        <Input
                            id="staff-name"
                            value={createForm.data.name}
                            onChange={(e) => createForm.setData('name', e.target.value)}
                        />
                        {createForm.errors.name && (
                            <p className="text-xs text-destructive">{createForm.errors.name}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="staff-email">{t('staff.form.email')}</Label>
                        <Input
                            id="staff-email"
                            type="email"
                            value={createForm.data.email}
                            onChange={(e) => createForm.setData('email', e.target.value)}
                        />
                        {createForm.errors.email && (
                            <p className="text-xs text-destructive">{createForm.errors.email}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="staff-phone">{t('staff.form.phone')}</Label>
                        <Input
                            id="staff-phone"
                            value={createForm.data.phone}
                            onChange={(e) => createForm.setData('phone', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>{t('staff.form.role')}</Label>
                        <Select
                            value={createForm.data.role}
                            onValueChange={(v) => createForm.setData('role', v as 'secretary')}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="secretary">Secretary</SelectItem>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span>
                                            <SelectItem value="doctor" disabled>
                                                Doctor (soon)
                                            </SelectItem>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {t('staff.form.doctorRoleDisabled')}
                                    </TooltipContent>
                                </Tooltip>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                        <Switch
                            id="staff-active"
                            checked={createForm.data.is_active}
                            onCheckedChange={(v) => createForm.setData('is_active', v)}
                        />
                        <Label htmlFor="staff-active">{t('staff.form.active')}</Label>
                    </div>
                </div>
            </FormModal>

            <FormModal
                open={editing !== null}
                onOpenChange={(open) => !open && setEditing(null)}
                title={t('staff.form.editTitle')}
                onSubmit={submitEdit}
                submitting={editForm.processing}
            >
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="edit-staff-name">{t('staff.form.name')}</Label>
                        <Input
                            id="edit-staff-name"
                            value={editForm.data.name}
                            onChange={(e) => editForm.setData('name', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-staff-email">{t('staff.form.email')}</Label>
                        <Input
                            id="edit-staff-email"
                            type="email"
                            value={editForm.data.email}
                            onChange={(e) => editForm.setData('email', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-staff-phone">{t('staff.form.phone')}</Label>
                        <Input
                            id="edit-staff-phone"
                            value={editForm.data.phone ?? ''}
                            onChange={(e) => editForm.setData('phone', e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                        <Switch
                            id="edit-staff-active"
                            checked={editForm.data.is_active}
                            onCheckedChange={(v) => editForm.setData('is_active', v)}
                        />
                        <Label htmlFor="edit-staff-active">{t('staff.form.active')}</Label>
                    </div>
                </div>
            </FormModal>

            <ConfirmDialog
                open={confirmTarget?.kind === 'delete'}
                onOpenChange={(open) => !open && setConfirmTarget(null)}
                title={t('staff.confirmDelete')}
                description={t('staff.confirmDeleteBody')}
                confirmLabel={t('staff.actions.delete')}
                onConfirm={performConfirm}
            />
            <ConfirmDialog
                open={confirmTarget?.kind === 'reset'}
                onOpenChange={(open) => !open && setConfirmTarget(null)}
                title={t('staff.confirmReset')}
                description={t('staff.confirmResetBody')}
                confirmLabel={t('staff.actions.resetPassword')}
                destructive={false}
                onConfirm={performConfirm}
            />
        </AppLayout>
    );
}
