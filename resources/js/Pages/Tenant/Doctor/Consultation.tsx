import { Link, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    Calendar,
    CheckCircle2,
    ClipboardList,
    FileText,
    History,
    Pill,
    Plus,
    Printer,
    Stethoscope,
    Trash2,
} from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/Components/domain/ConfirmDialog';
import { FormRenderer } from '@/Components/domain/forms/FormRenderer';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Textarea } from '@/Components/ui/textarea';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import { usePending } from '@/Hooks/usePending';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatDateTime } from '@/lib/dates';
import type { FormSnapshot } from '@/types/tenant';

type Diagnosis = {
    id: number;
    description: string;
    code: string | null;
    notes: string | null;
};

type PrescriptionItem = {
    id: number;
    medication_name: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
    order: number;
};

type Prescription = {
    id: number;
    is_locked: boolean;
    items: PrescriptionItem[];
};

type FormSubmission = {
    id: number;
    medical_form_id: number | null;
    submitted_at: string | null;
    form_snapshot: FormSnapshot;
    answers: Record<string, unknown> | null;
};

type Consultation = {
    id: number;
    is_completed: boolean;
    chief_complaint: string | null;
    notes: string | null;
    follow_up_in_days: number | null;
    started_at: string | null;
    ended_at: string | null;
    patient: {
        id: number;
        patient_code: string;
        name: string;
        first_name: string;
        last_name: string;
        age: number | null;
        gender_label: string | null;
        phone: string;
        blood_type: string | null;
        allergies_summary: string | null;
        chronic_summary: string | null;
        medications_summary: string | null;
        has_insurance: boolean;
        profile_photo_url: string | null;
        preferred_language: string;
    };
    doctor: { id: number; name: string | null; specialty: string };
    diagnoses: Diagnosis[];
    prescriptions: Prescription[];
    form_submissions: FormSubmission[];
};

type HistoryEntry = {
    id: number;
    started_at: string | null;
    ended_at: string | null;
    chief_complaint: string | null;
    diagnoses_count: number;
    submissions_count: number;
};

type ServiceOption = { id: number; name: string; price: number };
type PricingOption = { first_visit_price: number; review_visit_price: number };

type Props = {
    consultation: Consultation;
    history: HistoryEntry[];
    forms: { id: number; title: string; type: string }[];
    services: ServiceOption[];
    pricing: PricingOption;
};

export default function ConsultationPage({
    consultation,
    history,
    forms,
    services,
    pricing,
}: Props) {
    const { t } = useTranslation('tenant');
    const { t: tc } = useTranslation('common');
    useFlashToasts();

    const [overviewState, setOverviewState] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [chiefComplaint, setChiefComplaint] = useState(consultation.chief_complaint ?? '');
    const [notes, setNotes] = useState(consultation.notes ?? '');
    const [followUp, setFollowUp] = useState(
        consultation.follow_up_in_days !== null ? String(consultation.follow_up_in_days) : '',
    );
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [completeOpen, setCompleteOpen] = useState(false);
    const [completeBusy, runComplete] = usePending();
    const [visitType, setVisitType] = useState<'first' | 'review'>('first');
    const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set());

    const visitBasePrice =
        visitType === 'first' ? pricing.first_visit_price : pricing.review_visit_price;
    const servicesTotal = services
        .filter((s) => selectedServices.has(s.id))
        .reduce((sum, s) => sum + s.price, 0);
    const completeTotal = visitBasePrice + servicesTotal;
    const formatPrice = (n: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 2,
        }).format(n);
    const toggleService = (id: number) =>
        setSelectedServices((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    const [submitFormBusy, runSubmitForm] = usePending();
    const [removingDiagnosis, setRemovingDiagnosis] = useState<Set<number>>(new Set());
    const [removingItem, setRemovingItem] = useState<Set<number>>(new Set());

    // Selected form for the Medical Form tab
    const [selectedFormId, setSelectedFormId] = useState<string>(forms[0]?.id ? String(forms[0].id) : '');
    const [formAnswers, setFormAnswers] = useState<Record<string, unknown>>({});
    const [formSnapshot, setFormSnapshot] = useState<FormSnapshot | null>(null);

    // Diagnosis form state
    const diagForm = useForm({
        description: '',
        code: '',
        notes: '',
    });

    // Prescription item form state
    const itemForm = useForm({
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
    });

    const ensurePrescription = (): Promise<number> => {
        const existing = consultation.prescriptions[0];
        if (existing) return Promise.resolve(existing.id);
        return new Promise((resolve) => {
            router.post(
                `/consultations/${consultation.id}/prescription`,
                {},
                {
                    preserveScroll: true,
                    onFinish: () => {
                        router.reload({
                            only: ['consultation'],
                            onSuccess: () => resolve(0),
                        });
                    },
                },
            );
        });
    };

    const persistOverview = (patch: Partial<{ chief_complaint: string; notes: string; follow_up_in_days: number | null }>) => {
        setOverviewState('saving');
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => {
            router.patch(
                `/consultations/${consultation.id}`,
                {
                    chief_complaint: chiefComplaint,
                    notes,
                    follow_up_in_days: followUp === '' ? null : Number(followUp),
                    ...patch,
                },
                {
                    preserveScroll: true,
                    only: [],
                    onSuccess: () => {
                        setOverviewState('saved');
                        setTimeout(() => setOverviewState('idle'), 1500);
                    },
                    onError: () => setOverviewState('idle'),
                },
            );
        }, 5_000);
    };

    useEffect(() => {
        return () => {
            if (debounce.current) clearTimeout(debounce.current);
        };
    }, []);

    const loadFormSnapshot = async (formId: string) => {
        if (!formId) return;
        // GET /forms/:id/snapshot returns the canonical FormSnapshot JSON
        // shape produced by FormSnapshotService — same shape used at
        // submission time + on the historical replay. Single source of
        // truth for the FormRenderer.
        try {
            const { data } = await axios.get<FormSnapshot>(`/forms/${formId}/snapshot`);
            setFormSnapshot(data);
            setFormAnswers({});
        } catch {
            toast.error('Could not load form');
        }
    };

    const submitForm = () => {
        if (!selectedFormId) return;
        runSubmitForm(
            (opts) =>
                router.post(
                    `/consultations/${consultation.id}/submissions`,
                    {
                        medical_form_id: Number(selectedFormId),
                        answers: formAnswers as never,
                    },
                    opts,
                ),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Form submitted');
                    setFormAnswers({});
                    setFormSnapshot(null);
                },
            },
        );
    };

    const submitDiagnosis = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        diagForm.post(`/consultations/${consultation.id}/diagnoses`, {
            preserveScroll: true,
            onSuccess: () => diagForm.reset(),
        });
    };

    const removeDiagnosis = (id: number) => {
        if (removingDiagnosis.has(id)) return;
        setRemovingDiagnosis((s) => new Set(s).add(id));
        router.delete(`/diagnoses/${id}`, {
            preserveScroll: true,
            onFinish: () =>
                setRemovingDiagnosis((s) => {
                    const next = new Set(s);
                    next.delete(id);
                    return next;
                }),
        });
    };

    const submitItem = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const prescription = consultation.prescriptions[0];
        if (!prescription) {
            // Create then retry. Simpler: reload to get a prescription created.
            ensurePrescription();
            return;
        }
        itemForm.post(`/prescriptions/${prescription.id}/items`, {
            preserveScroll: true,
            onSuccess: () => itemForm.reset(),
        });
    };

    const removeItem = (prescriptionId: number, itemId: number) => {
        if (removingItem.has(itemId)) return;
        setRemovingItem((s) => new Set(s).add(itemId));
        router.delete(`/prescriptions/${prescriptionId}/items/${itemId}`, {
            preserveScroll: true,
            onFinish: () =>
                setRemovingItem((s) => {
                    const next = new Set(s);
                    next.delete(itemId);
                    return next;
                }),
        });
    };

    const initials = consultation.patient.name
        .split(/\s+/)
        .map((p) => p.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const prescription = consultation.prescriptions[0];

    return (
        <AppLayout
            title={consultation.patient.name}
            breadcrumbs={[
                { label: 'Consultations', href: '/consultations' },
                { label: consultation.patient.name },
            ]}
            actions={
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/patients/${consultation.patient.id}/history`}>
                            <History className="me-2 h-4 w-4" />
                            History
                        </Link>
                    </Button>
                    {!consultation.is_completed && (
                        <Button onClick={() => setCompleteOpen(true)}>
                            <CheckCircle2 className="me-2 h-4 w-4" />
                            {t('doctorPanel.consultation.complete')}
                        </Button>
                    )}
                </div>
            }
        >
            {/* Patient header */}
            <Card>
                <CardContent className="flex flex-wrap items-center gap-4 p-6">
                    <Avatar className="h-16 w-16">
                        {consultation.patient.profile_photo_url && (
                            <AvatarImage
                                src={consultation.patient.profile_photo_url}
                                alt={consultation.patient.name}
                            />
                        )}
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h2 className="text-h2">{consultation.patient.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {consultation.patient.phone && (
                                <span dir="ltr">{consultation.patient.phone}</span>
                            )}
                            {consultation.patient.age !== null && ` · ${consultation.patient.age}y`}
                            {consultation.patient.gender_label && ` · ${consultation.patient.gender_label}`}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {consultation.patient.allergies_summary && (
                                <Badge variant="destructive" className="text-xs">
                                    Allergies: {consultation.patient.allergies_summary.slice(0, 30)}
                                </Badge>
                            )}
                            {consultation.patient.chronic_summary && (
                                <Badge
                                    variant="outline"
                                    className="border-warning/40 bg-warning/10 text-xs"
                                >
                                    Chronic: {consultation.patient.chronic_summary.slice(0, 30)}
                                </Badge>
                            )}
                            {consultation.patient.blood_type && (
                                <Badge variant="outline">{consultation.patient.blood_type}</Badge>
                            )}
                            {consultation.patient.has_insurance && (
                                <Badge variant="secondary">Insurance</Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                {/* History panel */}
                <Card>
                    <CardContent className="p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
                            <History className="h-4 w-4" />
                            {t('doctorPanel.consultation.history')}
                        </h3>
                        {history.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t('doctorPanel.consultation.noHistory')}
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {history.map((h) => (
                                    <li key={h.id}>
                                        <Link
                                            href={`/consultations/${h.id}`}
                                            className="block rounded-md border p-2 hover:bg-accent"
                                        >
                                            <p className="text-sm font-medium">{formatDate(h.ended_at ?? h.started_at)}</p>
                                            {h.chief_complaint && (
                                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                    {h.chief_complaint}
                                                </p>
                                            )}
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {h.diagnoses_count} dx · {h.submissions_count} forms
                                            </p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Center tabs */}
                <Card>
                    <CardContent className="p-4">
                        <Tabs defaultValue="overview">
                            <TabsList>
                                <TabsTrigger value="overview">
                                    <ClipboardList className="me-2 h-4 w-4" />
                                    {t('doctorPanel.consultation.tabs.overview')}
                                </TabsTrigger>
                                <TabsTrigger value="form">
                                    <FileText className="me-2 h-4 w-4" />
                                    {t('doctorPanel.consultation.tabs.form')}
                                </TabsTrigger>
                                <TabsTrigger value="diagnoses">
                                    <Stethoscope className="me-2 h-4 w-4" />
                                    {t('doctorPanel.consultation.tabs.diagnoses')}
                                </TabsTrigger>
                                <TabsTrigger value="prescription">
                                    <Pill className="me-2 h-4 w-4" />
                                    {t('doctorPanel.consultation.tabs.prescription')}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="chief">{t('doctorPanel.consultation.chiefComplaint')}</Label>
                                        <span className="text-xs text-muted-foreground">
                                            {overviewState === 'saving' &&
                                                t('doctorPanel.consultation.savingState.saving')}
                                            {overviewState === 'saved' &&
                                                t('doctorPanel.consultation.savingState.saved')}
                                        </span>
                                    </div>
                                    <Textarea
                                        id="chief"
                                        rows={2}
                                        value={chiefComplaint}
                                        disabled={consultation.is_completed}
                                        onChange={(e) => {
                                            setChiefComplaint(e.target.value);
                                            persistOverview({ chief_complaint: e.target.value });
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">
                                        {t('doctorPanel.consultation.notes')}
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        rows={6}
                                        value={notes}
                                        disabled={consultation.is_completed}
                                        onChange={(e) => {
                                            setNotes(e.target.value);
                                            persistOverview({ notes: e.target.value });
                                        }}
                                    />
                                </div>
                                <div className="space-y-2 max-w-xs">
                                    <Label htmlFor="follow_up">
                                        {t('doctorPanel.consultation.followUpDays')}
                                    </Label>
                                    <Input
                                        id="follow_up"
                                        type="number"
                                        min={0}
                                        max={365}
                                        value={followUp}
                                        disabled={consultation.is_completed}
                                        onChange={(e) => {
                                            setFollowUp(e.target.value);
                                            persistOverview({
                                                follow_up_in_days: e.target.value === '' ? null : Number(e.target.value),
                                            });
                                        }}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="form" className="mt-4 space-y-4">
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="space-y-2 min-w-[240px]">
                                        <Label>{t('doctorPanel.consultation.selectForm')}</Label>
                                        <Select
                                            value={selectedFormId}
                                            onValueChange={(v) => {
                                                setSelectedFormId(v);
                                                void loadFormSnapshot(v);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {forms.map((f) => (
                                                    <SelectItem key={f.id} value={String(f.id)}>
                                                        {f.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => loadFormSnapshot(selectedFormId)}
                                    >
                                        Load
                                    </Button>
                                    {formSnapshot && (
                                        <Button onClick={submitForm} disabled={submitFormBusy}>
                                            {t('doctorPanel.consultation.submitForm')}
                                        </Button>
                                    )}
                                </div>

                                {formSnapshot && (
                                    <FormRenderer
                                        snapshot={formSnapshot}
                                        answers={formAnswers}
                                        readOnly={false}
                                        onChange={(key, value) =>
                                            setFormAnswers((prev) => ({ ...prev, [key]: value }))
                                        }
                                    />
                                )}

                                {consultation.form_submissions.length > 0 && (
                                    <div>
                                        <h4 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
                                            Submitted in this consultation
                                        </h4>
                                        <ul className="space-y-2">
                                            {consultation.form_submissions.map((sub) => (
                                                <li
                                                    key={sub.id}
                                                    className="flex items-center justify-between rounded-md border p-3"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {sub.form_snapshot.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDateTime(sub.submitted_at)}
                                                        </p>
                                                    </div>
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link href={`/submissions/${sub.id}`}>View</Link>
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="diagnoses" className="mt-4 space-y-4">
                                <form onSubmit={submitDiagnosis} className="grid gap-3 md:grid-cols-[2fr_1fr_auto] rounded-md border bg-muted/30 p-3">
                                    <div className="space-y-1">
                                        <Label>{t('doctorPanel.consultation.diagnosisDescription')}</Label>
                                        <Input
                                            value={diagForm.data.description}
                                            onChange={(e) =>
                                                diagForm.setData('description', e.target.value)
                                            }
                                            placeholder="e.g. Acute pharyngitis"
                                        />
                                        {diagForm.errors.description && (
                                            <p className="text-xs text-destructive">
                                                {diagForm.errors.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label>{t('doctorPanel.consultation.diagnosisCode')}</Label>
                                        <Input
                                            value={diagForm.data.code}
                                            onChange={(e) =>
                                                diagForm.setData('code', e.target.value)
                                            }
                                            placeholder="J02.9"
                                            className="font-mono"
                                        />
                                    </div>
                                    <div className="self-end">
                                        <Button type="submit" disabled={diagForm.processing}>
                                            <Plus className="me-2 h-4 w-4" />
                                            {t('doctorPanel.consultation.addDiagnosis')}
                                        </Button>
                                    </div>
                                </form>

                                {consultation.diagnoses.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">—</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {consultation.diagnoses.map((d) => (
                                            <li
                                                key={d.id}
                                                className="flex items-center justify-between rounded-md border p-3"
                                            >
                                                <div>
                                                    <p className="font-medium">{d.description}</p>
                                                    {d.code && (
                                                        <p className="text-xs font-mono text-muted-foreground">
                                                            {d.code}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={t('actions.delete', { defaultValue: 'Delete' })}
                                                    disabled={removingDiagnosis.has(d.id)}
                                                    onClick={() => removeDiagnosis(d.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </TabsContent>

                            <TabsContent value="prescription" className="mt-4 space-y-4">
                                {!prescription && (
                                    <Button onClick={() => ensurePrescription()}>
                                        <Plus className="me-2 h-4 w-4" />
                                        Start prescription
                                    </Button>
                                )}

                                {prescription && (
                                    <>
                                        {prescription.is_locked && (
                                            <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
                                                {t('doctorPanel.consultation.prescriptionLocked')}
                                            </p>
                                        )}
                                        {!prescription.is_locked && (
                                            <form
                                                onSubmit={submitItem}
                                                className="grid gap-3 md:grid-cols-2 rounded-md border bg-muted/30 p-3"
                                            >
                                                <div className="space-y-1 md:col-span-2">
                                                    <Label>{t('doctorPanel.consultation.medication')}</Label>
                                                    <Input
                                                        value={itemForm.data.medication_name}
                                                        onChange={(e) =>
                                                            itemForm.setData(
                                                                'medication_name',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>{t('doctorPanel.consultation.dosage')}</Label>
                                                    <Input
                                                        value={itemForm.data.dosage}
                                                        onChange={(e) =>
                                                            itemForm.setData('dosage', e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>{t('doctorPanel.consultation.frequency')}</Label>
                                                    <Input
                                                        value={itemForm.data.frequency}
                                                        onChange={(e) =>
                                                            itemForm.setData('frequency', e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>{t('doctorPanel.consultation.duration')}</Label>
                                                    <Input
                                                        value={itemForm.data.duration}
                                                        onChange={(e) =>
                                                            itemForm.setData('duration', e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-1 md:col-span-2">
                                                    <Label>{t('doctorPanel.consultation.instructions')}</Label>
                                                    <Textarea
                                                        rows={2}
                                                        value={itemForm.data.instructions}
                                                        onChange={(e) =>
                                                            itemForm.setData('instructions', e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div className="md:col-span-2 flex justify-end">
                                                    <Button type="submit" disabled={itemForm.processing}>
                                                        <Plus className="me-2 h-4 w-4" />
                                                        {t('doctorPanel.consultation.addMedication')}
                                                    </Button>
                                                </div>
                                            </form>
                                        )}

                                        <ul className="space-y-2">
                                            {prescription.items.map((item) => (
                                                <li
                                                    key={item.id}
                                                    className="flex items-start justify-between rounded-md border p-3"
                                                >
                                                    <div>
                                                        <p className="font-medium">
                                                            {item.medication_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {[item.dosage, item.frequency, item.duration]
                                                                .filter(Boolean)
                                                                .join(' · ')}
                                                        </p>
                                                        {item.instructions && (
                                                            <p className="mt-1 text-xs">
                                                                {item.instructions}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {!prescription.is_locked && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={t('actions.delete', { defaultValue: 'Delete' })}
                                                            disabled={removingItem.has(item.id)}
                                                            onClick={() =>
                                                                removeItem(prescription.id, item.id)
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>

                                        {prescription.items.length > 0 && (
                                            <Button asChild variant="outline">
                                                <a
                                                    href={`/prescriptions/${prescription.id}/print`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <Printer className="me-2 h-4 w-4" />
                                                    {t('doctorPanel.consultation.printPrescription')}
                                                </a>
                                            </Button>
                                        )}
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={completeOpen}
                onOpenChange={(open) => !completeBusy && setCompleteOpen(open)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {t('doctorPanel.consultation.confirmComplete')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('doctorPanel.consultation.confirmCompleteBody')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('doctorPanel.complete.visitType')}</Label>
                            <RadioGroup
                                value={visitType}
                                onValueChange={(v) => setVisitType(v as 'first' | 'review')}
                                className="grid grid-cols-2 gap-3"
                            >
                                <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                    <RadioGroupItem value="first" id="visit-first" />
                                    <span className="flex-1">
                                        <span className="block text-sm font-medium">
                                            {t('doctorPanel.complete.firstVisit')}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {formatPrice(pricing.first_visit_price)}
                                        </span>
                                    </span>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                    <RadioGroupItem value="review" id="visit-review" />
                                    <span className="flex-1">
                                        <span className="block text-sm font-medium">
                                            {t('doctorPanel.complete.reviewVisit')}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {formatPrice(pricing.review_visit_price)}
                                        </span>
                                    </span>
                                </label>
                            </RadioGroup>
                        </div>

                        {services.length > 0 && (
                            <div className="space-y-2">
                                <Label>{t('doctorPanel.complete.services')}</Label>
                                <div className="space-y-1.5 rounded-md border p-2">
                                    {services.map((s) => (
                                        <label
                                            key={s.id}
                                            className="flex cursor-pointer items-center justify-between gap-3 rounded-md p-2 hover:bg-accent"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={selectedServices.has(s.id)}
                                                    onCheckedChange={() => toggleService(s.id)}
                                                />
                                                <span className="text-sm font-medium">{s.name}</span>
                                            </span>
                                            <span className="text-sm font-mono text-muted-foreground">
                                                {formatPrice(s.price)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="rounded-md border bg-muted/40 p-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {t('doctorPanel.complete.total')}
                                </span>
                                <span className="font-mono text-h4 font-semibold">
                                    {formatPrice(completeTotal)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setCompleteOpen(false)}
                            disabled={completeBusy}
                        >
                            {tc('actions.cancel')}
                        </Button>
                        <Button
                            type="button"
                            disabled={completeBusy}
                            onClick={() =>
                                runComplete((opts) =>
                                    router.post(
                                        `/consultations/${consultation.id}/complete`,
                                        {
                                            visit_type: visitType,
                                            service_ids: Array.from(selectedServices),
                                        },
                                        opts,
                                    ),
                                )
                            }
                        >
                            {t('doctorPanel.consultation.complete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
