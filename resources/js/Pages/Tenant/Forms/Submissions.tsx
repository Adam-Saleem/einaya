import { Link, router } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import AppLayout from '@/Layouts/AppLayout';
import type { FormSubmission, Paginated } from '@/types/tenant';

type Props = {
    form: { id: number; title: string };
    submissions: Paginated<FormSubmission>;
};

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
}

export default function FormSubmissions({ form, submissions }: Props) {
    const { t } = useTranslation('tenant');
    const { t: tc } = useTranslation('common');

    return (
        <AppLayout
            title={t('builder.submissions.title', { form: form.title })}
            pageTitle={t('builder.submissions.title', { form: form.title })}
            breadcrumbs={[
                { label: t('forms.title'), href: '/forms' },
                { label: form.title, href: `/forms/${form.id}/edit` },
                { label: t('forms.actions.viewSubmissions') },
            ]}
            actions={
                <Button asChild variant="ghost">
                    <Link href={`/forms/${form.id}/edit`}>
                        <ChevronLeft className="me-2 h-4 w-4" />
                        {t('builder.submissions.back')}
                    </Link>
                </Button>
            }
        >
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('builder.submissions.columns.patient')}</TableHead>
                                <TableHead>{t('builder.submissions.columns.doctor')}</TableHead>
                                <TableHead>{t('builder.submissions.columns.submittedAt')}</TableHead>
                                <TableHead className="text-end">
                                    {t('builder.submissions.columns.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        {t('builder.submissions.noSubmissions')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                submissions.data.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell>
                                            <Link
                                                href={`/submissions/${s.id}`}
                                                className="font-medium hover:text-primary"
                                            >
                                                {s.patient?.name ?? '—'}
                                            </Link>
                                            <span className="ms-2 text-xs text-muted-foreground">
                                                {s.patient?.patient_code}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {s.doctor?.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatDate(s.submitted_at)}
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/submissions/${s.id}`}>
                                                    {t('builder.submissions.view')}
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
