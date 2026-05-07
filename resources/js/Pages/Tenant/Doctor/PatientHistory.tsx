import { Link } from '@inertiajs/react';
import { ChevronLeft, FileText, Pill, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormRenderer } from '@/Components/domain/forms/FormRenderer';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate } from '@/lib/dates';
import type { FormSnapshot } from '@/types/tenant';

type Submission = {
    id: number;
    form_snapshot: FormSnapshot;
    answers: Record<string, unknown> | null;
    submitted_at: string | null;
};

type Diagnosis = {
    id: number;
    description: string;
    code: string | null;
};

type PrescriptionItem = {
    medication_name: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
};

type Prescription = {
    id: number;
    items: PrescriptionItem[];
};

type Consultation = {
    id: number;
    started_at: string | null;
    ended_at: string | null;
    chief_complaint: string | null;
    notes: string | null;
    diagnoses: Diagnosis[];
    prescriptions: Prescription[];
    form_submissions: Submission[];
    doctor: { id: number; name: string | null } | null;
};

type Props = {
    patient: {
        id: number;
        name: string;
        patient_code: string;
        age: number | null;
        gender_label: string | null;
    };
    consultations: Consultation[];
};

export default function PatientHistory({ patient, consultations }: Props) {
    const { t } = useTranslation('tenant');
    const [submissionPreview, setSubmissionPreview] = useState<Submission | null>(null);

    return (
        <AppLayout
            title={`${patient.name} — history`}
            pageTitle={t('doctorPanel.history.title')}
            description={`${patient.name} · ${patient.patient_code}`}
            breadcrumbs={[
                { label: 'Patients', href: '/patients' },
                { label: patient.name, href: `/patients/${patient.id}` },
                { label: 'History' },
            ]}
            actions={
                <Button asChild variant="ghost">
                    <Link href={`/patients/${patient.id}`}>
                        <ChevronLeft className="me-2 h-4 w-4" />
                        Back
                    </Link>
                </Button>
            }
        >
            {consultations.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    {t('doctorPanel.history.noVisits')}
                </p>
            )}

            <div className="space-y-4">
                {consultations.map((c) => (
                    <Card key={c.id}>
                        <CardContent className="p-6">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <div>
                                    <h3 className="text-h3">{formatDate(c.ended_at ?? c.started_at)}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {c.doctor?.name ? `Dr. ${c.doctor.name}` : '—'}
                                        {c.chief_complaint && ` · ${c.chief_complaint}`}
                                    </p>
                                </div>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href={`/consultations/${c.id}`}>Open</Link>
                                </Button>
                            </div>

                            {c.diagnoses.length > 0 && (
                                <div className="mt-4">
                                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                                        <Stethoscope className="h-3.5 w-3.5" />
                                        Diagnoses
                                    </p>
                                    <ul className="text-sm">
                                        {c.diagnoses.map((d) => (
                                            <li key={d.id}>
                                                {d.description}
                                                {d.code && (
                                                    <span className="ms-2 font-mono text-xs text-muted-foreground">
                                                        {d.code}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {c.prescriptions.some((p) => p.items.length > 0) && (
                                <div className="mt-4">
                                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                                        <Pill className="h-3.5 w-3.5" />
                                        Medications
                                    </p>
                                    <ul className="text-sm">
                                        {c.prescriptions.flatMap((p) =>
                                            p.items.map((item, idx) => (
                                                <li key={`${p.id}-${idx}`}>
                                                    <span className="font-medium">
                                                        {item.medication_name}
                                                    </span>
                                                    {[item.dosage, item.frequency, item.duration]
                                                        .filter(Boolean)
                                                        .join(' · ') &&
                                                        ` — ${[item.dosage, item.frequency, item.duration]
                                                            .filter(Boolean)
                                                            .join(' · ')}`}
                                                </li>
                                            )),
                                        )}
                                    </ul>
                                </div>
                            )}

                            {c.form_submissions.length > 0 && (
                                <div className="mt-4">
                                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                                        <FileText className="h-3.5 w-3.5" />
                                        Forms
                                    </p>
                                    <ul className="space-y-1 text-sm">
                                        {c.form_submissions.map((sub) => (
                                            <li
                                                key={sub.id}
                                                className="flex items-center justify-between"
                                            >
                                                <span>{sub.form_snapshot.title}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSubmissionPreview(sub)}
                                                >
                                                    View snapshot
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog
                open={submissionPreview !== null}
                onOpenChange={(open) => !open && setSubmissionPreview(null)}
            >
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{submissionPreview?.form_snapshot.title}</DialogTitle>
                    </DialogHeader>
                    {submissionPreview && (
                        <FormRenderer
                            snapshot={submissionPreview.form_snapshot}
                            answers={submissionPreview.answers ?? {}}
                            readOnly
                        />
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
