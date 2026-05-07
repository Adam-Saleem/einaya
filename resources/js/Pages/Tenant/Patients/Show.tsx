import { router, useForm } from '@inertiajs/react';
import { Calendar, CreditCard, FileText, Phone, Upload } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { StatusBadge } from '@/Components/domain/StatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import AppLayout from '@/Layouts/AppLayout';
import { formatDateTime } from '@/lib/dates';
import { initialsFor, isArabicText } from '@/lib/initials';

type Patient = {
    id: number;
    patient_code: string;
    name: string;
    age: number | null;
    gender_label: string | null;
    phone: string;
    phone_alt: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    blood_type: string | null;
    allergies_summary: string | null;
    chronic_summary: string | null;
    medications_summary: string | null;
    has_insurance: boolean;
    insurance_policy_number: string | null;
    profile_photo_url: string | null;
    notes: string | null;
    emergency_name: string | null;
    emergency_phone: string | null;
    emergency_relation: string | null;
};

type Appointment = {
    id: number;
    scheduled_for: string | null;
    status: string;
    status_label: string;
    reason: string | null;
};

type Payment = {
    id: number;
    receipt_number: string;
    amount: number;
    method: string;
    paid_at: string | null;
};

type PatientFile = {
    id: number;
    category: string;
    file_url: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    notes: string | null;
    created_at: string | null;
};

type Props = {
    patient: Patient;
    appointments: Appointment[];
    payments: Payment[];
    files: PatientFile[];
    insuranceProviders: { id: number; name: string }[];
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'neutral'> = {
    pending: 'warning',
    confirmed: 'info',
    arrived: 'info',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'danger',
    no_show: 'danger',
};

export default function PatientShow({ patient, appointments, payments, files }: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    const initials = initialsFor(patient.name);
    const initialsArabic = isArabicText(initials);

    const fileForm = useForm({
        file: null as File | null,
        category: 'id_scan',
        notes: '',
    });

    const submitFile = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        fileForm.post(`/patients/${patient.id}/files`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => fileForm.reset(),
        });
    };

    return (
        <AppLayout
            title={patient.name}
            breadcrumbs={[
                { label: t('patients.title'), href: '/patients' },
                { label: patient.name },
            ]}
            actions={
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <a href={`tel:${patient.phone}`}>
                            <Phone className="me-2 h-4 w-4" />
                            {patient.phone}
                        </a>
                    </Button>
                    <Button onClick={() => router.visit(`/appointments?patient=${patient.id}`)}>
                        <Calendar className="me-2 h-4 w-4" />
                        {t('patients.bookAppointment')}
                    </Button>
                </div>
            }
        >
            <Card>
                <CardContent className="flex flex-wrap items-center gap-4 p-6">
                    <Avatar className="h-20 w-20">
                        {patient.profile_photo_url && (
                            <AvatarImage src={patient.profile_photo_url} alt={patient.name} />
                        )}
                        <AvatarFallback
                            className="bg-primary text-primary-foreground text-h3"
                            dir={initialsArabic ? 'rtl' : undefined}
                            style={initialsArabic ? { fontFamily: 'var(--font-arabic)' } : undefined}
                        >
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h2 className="text-h2">{patient.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {patient.phone && <span dir="ltr">{patient.phone}</span>}
                            {patient.age !== null && ` · ${patient.age}y`}
                            {patient.gender_label && ` · ${patient.gender_label}`}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {patient.blood_type && (
                                <Badge variant="outline">{patient.blood_type}</Badge>
                            )}
                            {patient.has_insurance && (
                                <Badge variant="secondary">Insurance</Badge>
                            )}
                            {patient.allergies_summary && (
                                <Badge variant="destructive">Allergies</Badge>
                            )}
                            {patient.chronic_summary && (
                                <Badge variant="outline">Chronic</Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">{t('patients.tabs.overview')}</TabsTrigger>
                    <TabsTrigger value="visits">{t('patients.tabs.visits')}</TabsTrigger>
                    <TabsTrigger value="files">{t('patients.tabs.files')}</TabsTrigger>
                    <TabsTrigger value="payments">{t('patients.tabs.payments')}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-h4">Contact</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p>
                                    <span className="text-muted-foreground">Phone: </span>
                                    {patient.phone}
                                </p>
                                {patient.phone_alt && (
                                    <p>
                                        <span className="text-muted-foreground">Alt phone: </span>
                                        {patient.phone_alt}
                                    </p>
                                )}
                                {patient.email && (
                                    <p>
                                        <span className="text-muted-foreground">Email: </span>
                                        {patient.email}
                                    </p>
                                )}
                                {patient.address && (
                                    <p>
                                        <span className="text-muted-foreground">Address: </span>
                                        {patient.address}
                                        {patient.city && `, ${patient.city}`}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-h4">Emergency contact</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {patient.emergency_name ? (
                                    <>
                                        <p>{patient.emergency_name}</p>
                                        <p className="text-muted-foreground">
                                            {patient.emergency_phone} · {patient.emergency_relation}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground">—</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-h4">Medical flags</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {patient.allergies_summary && (
                                    <p>
                                        <span className="font-medium">Allergies: </span>
                                        {patient.allergies_summary}
                                    </p>
                                )}
                                {patient.chronic_summary && (
                                    <p>
                                        <span className="font-medium">Chronic: </span>
                                        {patient.chronic_summary}
                                    </p>
                                )}
                                {patient.medications_summary && (
                                    <p>
                                        <span className="font-medium">Medications: </span>
                                        {patient.medications_summary}
                                    </p>
                                )}
                                {!patient.allergies_summary &&
                                    !patient.chronic_summary &&
                                    !patient.medications_summary && (
                                        <p className="text-muted-foreground">No flags recorded.</p>
                                    )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="visits" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            {appointments.length === 0 ? (
                                <p className="p-6 text-sm text-muted-foreground">
                                    {t('patients.noVisits')}
                                </p>
                            ) : (
                                <ul className="divide-y">
                                    {appointments.map((a) => (
                                        <li key={a.id} className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {formatDateTime(a.scheduled_for)}
                                                </p>
                                                {a.reason && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {a.reason}
                                                    </p>
                                                )}
                                            </div>
                                            <StatusBadge variant={STATUS_VARIANT[a.status] ?? 'neutral'}>
                                                {a.status_label}
                                            </StatusBadge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="files" className="mt-4">
                    <Card>
                        <CardContent className="space-y-4 p-6">
                            <form onSubmit={submitFile} className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">
                                <Input
                                    type="file"
                                    onChange={(e) =>
                                        fileForm.setData('file', e.target.files?.[0] ?? null)
                                    }
                                />
                                <select
                                    className="h-11 rounded-md border bg-background px-3 text-sm"
                                    value={fileForm.data.category}
                                    onChange={(e) => fileForm.setData('category', e.target.value)}
                                >
                                    <option value="id_scan">{t('patients.fileCategory.id_scan')}</option>
                                    <option value="insurance_card">{t('patients.fileCategory.insurance_card')}</option>
                                    <option value="report">{t('patients.fileCategory.report')}</option>
                                    <option value="prescription">{t('patients.fileCategory.prescription')}</option>
                                    <option value="other">{t('patients.fileCategory.other')}</option>
                                </select>
                                <Input
                                    placeholder={t('patients.notesOptional')}
                                    value={fileForm.data.notes}
                                    onChange={(e) => fileForm.setData('notes', e.target.value)}
                                />
                                <Button type="submit" disabled={fileForm.processing}>
                                    <Upload className="me-2 h-4 w-4" />
                                    {t('patients.uploadFile')}
                                </Button>
                            </form>

                            {files.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t('patients.noFiles')}
                                </p>
                            ) : (
                                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                    {files.map((f) => (
                                        <a
                                            key={f.id}
                                            href={f.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 rounded-md border bg-card p-3 hover:bg-accent"
                                        >
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {f.original_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t(`patients.fileCategory.${f.category}`, { defaultValue: f.category })} · {(f.size_bytes / 1024).toFixed(0)} KB
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            {payments.length === 0 ? (
                                <p className="p-6 text-sm text-muted-foreground">
                                    {t('patients.noPayments')}
                                </p>
                            ) : (
                                <ul className="divide-y">
                                    {payments.map((p) => (
                                        <li key={p.id} className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-mono text-xs">{p.receipt_number}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDateTime(p.paid_at)} · {p.method}
                                                </p>
                                            </div>
                                            <span className="font-semibold">
                                                {p.amount.toLocaleString(undefined, {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                })}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}
