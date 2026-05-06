import { Link, router, useForm } from '@inertiajs/react';
import { Copy, ExternalLink, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { usePending } from '@/Hooks/usePending';
import AppLayout from '@/Layouts/AppLayout';
import type { MedicalForm, Paginated } from '@/types/tenant';

type Props = { forms: Paginated<MedicalForm> };

export default function FormsIndex({ forms }: Props) {
    const { t } = useTranslation('tenant');
    const { t: tc } = useTranslation('common');
    useFlashToasts();

    const [createOpen, setCreateOpen] = useState(false);
    const [deleting, setDeleting] = useState<MedicalForm | null>(null);
    const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
    const [deleteBusy, runDelete] = usePending();

    const form = useForm({
        title: '',
        description: '',
        type: 'intake' as 'intake' | 'follow_up' | 'custom',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/forms', { preserveScroll: true });
    };

    const formatDate = (iso: string | null): string => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString();
    };

    return (
        <AppLayout
            title={t('forms.title')}
            pageTitle={t('forms.title')}
            description={t('forms.subtitle')}
            actions={
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('forms.create')}
                </Button>
            }
        >
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('forms.columns.title')}</TableHead>
                                <TableHead>{t('forms.columns.type')}</TableHead>
                                <TableHead>{t('forms.columns.sections')}</TableHead>
                                <TableHead>{t('forms.columns.questions')}</TableHead>
                                <TableHead>{t('forms.columns.submissions')}</TableHead>
                                <TableHead>{t('forms.columns.status')}</TableHead>
                                <TableHead>{t('forms.columns.createdAt')}</TableHead>
                                <TableHead className="text-end">
                                    {t('forms.columns.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {forms.data.map((row) => {
                                const questionsCount = row.sections?.reduce(
                                    (sum, s) => sum + (s.questions?.length ?? 0),
                                    0,
                                );
                                return (
                                    <TableRow key={row.id}>
                                        <TableCell>
                                            <Link
                                                href={`/forms/${row.id}/edit`}
                                                className="font-medium hover:text-primary"
                                            >
                                                {row.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {row.type_label}
                                        </TableCell>
                                        <TableCell>{row.sections_count ?? 0}</TableCell>
                                        <TableCell>{questionsCount ?? '—'}</TableCell>
                                        <TableCell>{row.submissions_count ?? 0}</TableCell>
                                        <TableCell>
                                            <StatusBadge variant={row.is_active ? 'success' : 'neutral'}>
                                                {row.is_active ? t('forms.active') : t('forms.inactive')}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(row.created_at)}
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/forms/${row.id}/edit`}>
                                                            <Pencil className="me-2 h-4 w-4" />
                                                            {t('forms.actions.edit')}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/forms/${row.id}/submissions`}>
                                                            <ExternalLink className="me-2 h-4 w-4" />
                                                            {t('forms.actions.viewSubmissions')}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        disabled={duplicatingId === row.id}
                                                        onSelect={() => {
                                                            if (duplicatingId !== null) return;
                                                            setDuplicatingId(row.id);
                                                            router.post(
                                                                `/forms/${row.id}/duplicate`,
                                                                {},
                                                                {
                                                                    onFinish: () =>
                                                                        setDuplicatingId(null),
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        <Copy className="me-2 h-4 w-4" />
                                                        {t('forms.actions.duplicate')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onSelect={() => setDeleting(row)}
                                                    >
                                                        <Trash2 className="me-2 h-4 w-4" />
                                                        {t('forms.actions.delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {forms.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
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
                    if (!open) form.reset();
                }}
                title={t('forms.form.createTitle')}
                onSubmit={submit}
                submitting={form.processing}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="form-title">{t('forms.form.title')}</Label>
                        <Input
                            id="form-title"
                            value={form.data.title}
                            onChange={(e) => form.setData('title', e.target.value)}
                        />
                        {form.errors.title && (
                            <p className="text-xs text-destructive">{form.errors.title}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="form-description">{t('forms.form.description')}</Label>
                        <Textarea
                            id="form-description"
                            rows={2}
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t('forms.form.type')}</Label>
                        <Select
                            value={form.data.type}
                            onValueChange={(v) => form.setData('type', v as 'intake' | 'follow_up' | 'custom')}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="intake">Intake</SelectItem>
                                <SelectItem value="follow_up">Follow-up</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </FormModal>

            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && !deleteBusy && setDeleting(null)}
                title={t('forms.confirmDelete')}
                description={t('forms.confirmDeleteBody')}
                busy={deleteBusy}
                onConfirm={() => {
                    if (!deleting) return;
                    runDelete(
                        (opts) => router.delete(`/forms/${deleting.id}`, opts),
                        { preserveScroll: true, onFinish: () => setDeleting(null) },
                    );
                }}
            />
        </AppLayout>
    );
}
