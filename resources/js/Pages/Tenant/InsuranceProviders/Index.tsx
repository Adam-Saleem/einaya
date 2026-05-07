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
import type { InsuranceProviderRow, ResourceCollection } from '@/types/tenant';

type Props = { providers: ResourceCollection<InsuranceProviderRow> };

export default function InsuranceProvidersIndex({ providers }: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<InsuranceProviderRow | null>(null);
    const [deleting, setDeleting] = useState<InsuranceProviderRow | null>(null);

    const form = useForm({ name: '', is_active: true });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (editing) {
            form.patch(`/insurance-providers/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setEditing(null);
                    form.reset();
                },
            });
        } else {
            form.post('/insurance-providers', {
                preserveScroll: true,
                onSuccess: () => {
                    setCreateOpen(false);
                    form.reset();
                },
            });
        }
    };

    const openCreate = () => {
        form.setDefaults({ name: '', is_active: true });
        form.reset();
        setCreateOpen(true);
    };

    const openEdit = (row: InsuranceProviderRow) => {
        const next = { name: row.name, is_active: row.is_active };
        form.setDefaults(next);
        form.setData(next);
        setEditing(row);
    };

    return (
        <AppLayout
            title={t('insurance.title')}
            pageTitle={t('insurance.title')}
            description={t('insurance.subtitle')}
            actions={
                <Button onClick={openCreate}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('insurance.create')}
                </Button>
            }
        >
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('insurance.columns.name')}</TableHead>
                                <TableHead>{t('insurance.columns.active')}</TableHead>
                                <TableHead>{t('insurance.columns.patients')}</TableHead>
                                <TableHead className="text-end">
                                    {t('insurance.columns.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {providers.data.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">{row.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={row.is_active ? 'default' : 'secondary'}>
                                            {row.is_active ? '✓' : '—'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{row.patient_count ?? 0}</TableCell>
                                    <TableCell className="text-end">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={t('actions.edit', { defaultValue: 'Edit' })}
                                            onClick={() => openEdit(row)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={t('actions.delete', { defaultValue: 'Delete' })}
                                            onClick={() => setDeleting(row)}
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
                open={createOpen || editing !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setCreateOpen(false);
                        setEditing(null);
                        form.clearErrors();
                    }
                }}
                title={editing ? t('insurance.form.editTitle') : t('insurance.form.createTitle')}
                onSubmit={submit}
                submitting={form.processing}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="provider-name">{t('insurance.form.name')}</Label>
                        <Input
                            id="provider-name"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                        />
                        {form.errors.name && (
                            <p className="text-xs text-destructive">{form.errors.name}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="provider-active"
                            checked={form.data.is_active}
                            onCheckedChange={(v) => form.setData('is_active', v)}
                        />
                        <Label htmlFor="provider-active">{t('insurance.form.active')}</Label>
                    </div>
                </div>
            </FormModal>

            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title={t('insurance.confirmDelete')}
                description={t('insurance.confirmDeleteBody')}
                onConfirm={() => {
                    if (!deleting) return;
                    router.delete(`/insurance-providers/${deleting.id}`, {
                        preserveScroll: true,
                        onFinish: () => setDeleting(null),
                    });
                }}
            />
        </AppLayout>
    );
}
