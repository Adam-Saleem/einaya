import { router } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { type FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { PatientCombobox } from '@/Components/domain/PatientCombobox';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Textarea } from '@/Components/ui/textarea';
import { useDirection } from '@/Hooks/useDirection';
import { useLocale } from '@/Hooks/useLocale';
import { CITIES, findCity } from '@/data/locations';

type Doctor = {
    id: number;
    name: string | null;
    consultation_duration_minutes?: number;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    doctors: Doctor[];
    /**
     * When set, the dialog opens directly on step 2 with this patient
     * pre-locked — used by the Patient profile's "Book appointment"
     * action where the patient is already chosen.
     */
    lockedPatient?: { id: number; name: string; phone: string | null } | null;
};

type Step = 1 | 2;
type Mode = 'existing' | 'new';

type ExistingPatientSnapshot = {
    id: number;
    name: string;
    phone: string | null;
};

type PatientForm = {
    full_name: string;
    national_id: string;
    phone: string;
    gender: '' | 'male' | 'female';
    marital_status: '' | 'single' | 'married' | 'divorced' | 'widowed';
    city: string;
    village: string;
    date_of_birth: string;
};

type AppointmentForm = {
    doctor_id: string;
    scheduled_for: string;
    duration_minutes: string;
    reason: string;
    notes: string;
    force: boolean;
};

const EMPTY_PATIENT: PatientForm = {
    full_name: '',
    national_id: '',
    phone: '',
    gender: '',
    marital_status: '',
    city: '',
    village: '',
    date_of_birth: '',
};

function defaultDateTime() {
    const d = new Date();
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours(),
    )}:${pad(d.getMinutes())}`;
}

export function NewAppointmentDialog({ open, onOpenChange, doctors, lockedPatient }: Props) {
    const { t } = useTranslation('tenant');
    const { t: tc } = useTranslation('common');
    const direction = useDirection();
    const { locale } = useLocale();
    const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

    const defaultDoctor = doctors[0];

    const [step, setStep] = useState<Step>(1);
    const [mode, setMode] = useState<Mode>('existing');
    const [existingPatient, setExistingPatient] = useState<ExistingPatientSnapshot | null>(null);
    const [patient, setPatient] = useState<PatientForm>(EMPTY_PATIENT);
    const [appointment, setAppointment] = useState<AppointmentForm>({
        doctor_id: defaultDoctor ? String(defaultDoctor.id) : '',
        scheduled_for: defaultDateTime(),
        duration_minutes: String(defaultDoctor?.consultation_duration_minutes ?? 30),
        reason: '',
        notes: '',
        force: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);

    // Only reset on the closed→open transition. `defaultDoctor` is the
    // first item of a prop array — its reference changes on every parent
    // render, so listing it as a dep would wipe the form whenever any
    // sibling state updates (including selecting a patient).
    const wasOpen = useRef(false);
    useEffect(() => {
        if (open && !wasOpen.current) {
            // If a patient is pre-locked (e.g. opened from Patients/Show),
            // skip step 1 entirely and seed the existing-patient slot.
            if (lockedPatient) {
                setStep(2);
                setMode('existing');
                setExistingPatient(lockedPatient);
            } else {
                setStep(1);
                setMode('existing');
                setExistingPatient(null);
            }
            setPatient(EMPTY_PATIENT);
            setAppointment({
                doctor_id: defaultDoctor ? String(defaultDoctor.id) : '',
                scheduled_for: defaultDateTime(),
                duration_minutes: String(defaultDoctor?.consultation_duration_minutes ?? 30),
                reason: '',
                notes: '',
                force: false,
            });
            setErrors({});
            setWarning(null);
            setSubmitting(false);
        }
        wasOpen.current = open;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const selectedCity = useMemo(() => findCity(patient.city), [patient.city]);
    const villages = selectedCity?.villages ?? [];

    const canAdvance =
        mode === 'existing' ? existingPatient !== null : patient.full_name.trim().length > 0;

    const handleNext = () => {
        if (!canAdvance) return;
        setErrors({});
        setStep(2);
    };

    const submit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        setErrors({});
        setWarning(null);

        try {
            let patientId: number | null = existingPatient?.id ?? null;

            if (mode === 'new') {
                const create = await axios.post('/patients', {
                    full_name: patient.full_name,
                    national_id: patient.national_id || null,
                    phone: patient.phone || null,
                    gender: patient.gender || null,
                    marital_status: patient.marital_status || null,
                    city: patient.city || null,
                    village: patient.village || null,
                    date_of_birth: patient.date_of_birth || null,
                    force_duplicate_phone: true,
                });
                patientId = create.data?.patient?.id ?? null;
            }

            if (!patientId) {
                throw new Error('No patient id resolved.');
            }

            await new Promise<void>((resolve, reject) => {
                router.post(
                    '/appointments',
                    {
                        patient_id: patientId,
                        doctor_id: Number(appointment.doctor_id),
                        scheduled_for: appointment.scheduled_for,
                        duration_minutes: Number(appointment.duration_minutes),
                        reason: appointment.reason || null,
                        notes: appointment.notes || null,
                        force: appointment.force,
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast.success(t('reception.newAppointment.success'));
                            onOpenChange(false);
                            resolve();
                        },
                        onError: (errs) => {
                            const flat: Record<string, string> = {};
                            for (const [k, v] of Object.entries(errs)) {
                                flat[k] = Array.isArray(v) ? v[0] : (v as string);
                            }
                            if (flat.scheduled_for?.startsWith('warnings:')) {
                                setWarning(flat.scheduled_for.replace('warnings:', ''));
                                delete flat.scheduled_for;
                            }
                            setErrors(flat);
                            reject(new Error('appointment-failed'));
                        },
                        onFinish: () => setSubmitting(false),
                    },
                );
            });
        } catch (err: unknown) {
            // axios validation errors from POST /patients
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ax = err as any;
            if (ax?.response?.status === 422 && ax.response.data?.errors) {
                const flat: Record<string, string> = {};
                for (const [k, v] of Object.entries(
                    ax.response.data.errors as Record<string, string[]>,
                )) {
                    flat[k] = v[0];
                }
                setErrors(flat);
                setStep(1);
            }
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {t('reception.newAppointment.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? t('reception.newAppointment.step1Subtitle')
                            : t('reception.newAppointment.step2Subtitle')}
                    </DialogDescription>
                </DialogHeader>

                {!lockedPatient && <Stepper step={step} t={t} />}

                <form onSubmit={submit} className="space-y-5">
                    {step === 1 ? (
                        <>
                            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="existing">
                                        {t('reception.newAppointment.modeExisting')}
                                    </TabsTrigger>
                                    <TabsTrigger value="new">
                                        {t('reception.newAppointment.modeNew')}
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {mode === 'existing' ? (
                                <div className="space-y-2">
                                    <Label>{t('reception.newAppointment.choosePatient')}</Label>
                                    <PatientCombobox
                                        value={existingPatient?.id ?? null}
                                        onChange={(id, p) =>
                                            setExistingPatient(
                                                id !== null && p
                                                    ? { id, name: p.name, phone: p.phone }
                                                    : null,
                                            )
                                        }
                                    />
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2 space-y-2">
                                        <Label htmlFor="full_name">
                                            {t('patients.simple.fullName')}
                                            <span className="ms-1 text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="full_name"
                                            value={patient.full_name}
                                            onChange={(e) =>
                                                setPatient({ ...patient, full_name: e.target.value })
                                            }
                                            autoFocus
                                            required
                                            aria-required="true"
                                        />
                                        {errors.full_name && (
                                            <p className="text-sm text-destructive">{errors.full_name}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="national_id">
                                            {t('patients.simple.nationalId')}
                                        </Label>
                                        <Input
                                            id="national_id"
                                            value={patient.national_id}
                                            onChange={(e) =>
                                                setPatient({ ...patient, national_id: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">
                                            {t('patients.simple.phone')}
                                        </Label>
                                        <Input
                                            id="phone"
                                            value={patient.phone}
                                            onChange={(e) =>
                                                setPatient({ ...patient, phone: e.target.value })
                                            }
                                        />
                                        {errors.phone && (
                                            <p className="text-sm text-destructive">{errors.phone}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('patients.simple.gender')}</Label>
                                        <Select
                                            value={patient.gender || undefined}
                                            onValueChange={(v) =>
                                                setPatient({
                                                    ...patient,
                                                    gender: v as PatientForm['gender'],
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">
                                                    {t('patients.filters.male')}
                                                </SelectItem>
                                                <SelectItem value="female">
                                                    {t('patients.filters.female')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('patients.simple.maritalStatus')}</Label>
                                        <Select
                                            value={patient.marital_status || undefined}
                                            onValueChange={(v) =>
                                                setPatient({
                                                    ...patient,
                                                    marital_status: v as PatientForm['marital_status'],
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="single">
                                                    {t('patients.simple.maritalOptions.single')}
                                                </SelectItem>
                                                <SelectItem value="married">
                                                    {t('patients.simple.maritalOptions.married')}
                                                </SelectItem>
                                                <SelectItem value="divorced">
                                                    {t('patients.simple.maritalOptions.divorced')}
                                                </SelectItem>
                                                <SelectItem value="widowed">
                                                    {t('patients.simple.maritalOptions.widowed')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('patients.simple.city')}</Label>
                                        <Select
                                            value={patient.city || undefined}
                                            onValueChange={(v) =>
                                                setPatient({ ...patient, city: v, village: '' })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={t('patients.simple.cityPlaceholder')}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CITIES.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.name[locale]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('patients.simple.village')}</Label>
                                        <Select
                                            value={patient.village || undefined}
                                            onValueChange={(v) =>
                                                setPatient({ ...patient, village: v })
                                            }
                                            disabled={!selectedCity || villages.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={
                                                        selectedCity
                                                            ? t('patients.simple.villagePlaceholder')
                                                            : t('patients.simple.villageDisabled')
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {villages.map((v) => (
                                                    <SelectItem key={v.id} value={v.id}>
                                                        {v.name[locale]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dob">
                                            {t('patients.simple.dateOfBirth')}
                                        </Label>
                                        <Input
                                            id="dob"
                                            type="date"
                                            value={patient.date_of_birth}
                                            onChange={(e) =>
                                                setPatient({
                                                    ...patient,
                                                    date_of_birth: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                    {t('reception.newAppointment.patient')}
                                </p>
                                <p className="font-medium">
                                    {mode === 'existing'
                                        ? existingPatient?.name
                                        : patient.full_name}
                                </p>
                                {mode === 'existing' && existingPatient?.phone && (
                                    <p className="text-xs text-muted-foreground" dir="ltr">
                                        {existingPatient.phone}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{t('appointments.form.doctor')}</Label>
                                    <Select
                                        value={appointment.doctor_id}
                                        onValueChange={(v) =>
                                            setAppointment({ ...appointment, doctor_id: v })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctors.map((d) => (
                                                <SelectItem key={d.id} value={String(d.id)}>
                                                    {d.name ?? `Doctor #${d.id}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration">
                                        {t('appointments.form.duration')}
                                    </Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        min={5}
                                        max={240}
                                        value={appointment.duration_minutes}
                                        onChange={(e) =>
                                            setAppointment({
                                                ...appointment,
                                                duration_minutes: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <Label htmlFor="scheduled_for">
                                        {t('appointments.form.scheduledFor')}
                                    </Label>
                                    <Input
                                        id="scheduled_for"
                                        type="datetime-local"
                                        value={appointment.scheduled_for}
                                        onChange={(e) =>
                                            setAppointment({
                                                ...appointment,
                                                scheduled_for: e.target.value,
                                            })
                                        }
                                    />
                                    {errors.scheduled_for && (
                                        <p className="text-sm text-destructive">
                                            {errors.scheduled_for}
                                        </p>
                                    )}
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <Label htmlFor="reason">
                                        {t('appointments.form.reason')}
                                    </Label>
                                    <Textarea
                                        id="reason"
                                        rows={2}
                                        value={appointment.reason}
                                        onChange={(e) =>
                                            setAppointment({ ...appointment, reason: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            {warning && (
                                <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
                                    <p className="font-medium">
                                        {t('reception.newAppointment.warningHeading')}
                                    </p>
                                    <ul className="mt-1 list-disc ps-5 text-xs text-muted-foreground">
                                        {warning.split('|').map((w) => (
                                            <li key={w}>
                                                {t(`appointments.warnings.${w}`, { defaultValue: w })}
                                            </li>
                                        ))}
                                    </ul>
                                    <label className="mt-2 inline-flex items-center gap-2 text-xs">
                                        <input
                                            type="checkbox"
                                            checked={appointment.force}
                                            onChange={(e) =>
                                                setAppointment({
                                                    ...appointment,
                                                    force: e.target.checked,
                                                })
                                            }
                                        />
                                        {t('reception.newAppointment.forceConfirm')}
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                        {step === 2 && !lockedPatient ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep(1)}
                                disabled={submitting}
                            >
                                {tc('actions.previous')}
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={submitting}
                            >
                                {tc('actions.cancel')}
                            </Button>
                        )}

                        {step === 1 ? (
                            <Button
                                type="button"
                                disabled={!canAdvance}
                                onClick={handleNext}
                            >
                                {tc('actions.next')}
                                <Arrow className="ms-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                                {t('reception.newAppointment.reserve')}
                            </Button>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Stepper({ step, t }: { step: Step; t: (k: string) => string }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <Pill active={step >= 1} label={t('reception.newAppointment.stepPatient')} index={1} />
            <span className="h-px flex-1 bg-border" />
            <Pill active={step >= 2} label={t('reception.newAppointment.stepAppointment')} index={2} />
        </div>
    );
}

function Pill({ active, label, index }: { active: boolean; label: string; index: number }) {
    return (
        <span className="flex items-center gap-2">
            <span
                className={
                    active
                        ? 'flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold'
                        : 'flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold'
                }
            >
                {index}
            </span>
            <span className={active ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                {label}
            </span>
        </span>
    );
}
