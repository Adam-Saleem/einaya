import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FormRenderer } from '@/Components/domain/forms/FormRenderer';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { formatDateTime } from '@/lib/dates';
import type { FormSubmission } from '@/types/tenant';

type Props = { submission: FormSubmission };

export default function SubmissionShow({ submission }: Props) {
    const { t } = useTranslation('tenant');

    return (
        <AppLayout
            title={`Submission #${submission.id}`}
            pageTitle={`${submission.patient?.name ?? '—'}`}
            breadcrumbs={[
                { label: t('forms.title'), href: '/forms' },
                {
                    label: submission.form_snapshot.title,
                    href: submission.medical_form_id
                        ? `/forms/${submission.medical_form_id}/submissions`
                        : undefined,
                },
                { label: submission.patient?.name ?? '—' },
            ]}
            actions={
                <Button asChild variant="ghost">
                    <Link
                        href={
                            submission.medical_form_id
                                ? `/forms/${submission.medical_form_id}/submissions`
                                : '/forms'
                        }
                    >
                        <ChevronLeft className="me-2 h-4 w-4" />
                        {t('builder.submissions.back')}
                    </Link>
                </Button>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle className="text-h4 text-muted-foreground">
                        Submitted {formatDateTime(submission.submitted_at)}
                        {' · '}
                        {submission.doctor?.name && `Dr. ${submission.doctor.name}`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <FormRenderer
                        snapshot={submission.form_snapshot}
                        answers={submission.answers ?? {}}
                        readOnly
                    />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
