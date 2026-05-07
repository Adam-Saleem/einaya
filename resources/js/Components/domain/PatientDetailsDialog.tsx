import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { useLocale } from '@/Hooks/useLocale';
import { CITIES, findCity } from '@/data/locations';
import { formatDateTime } from '@/lib/dates';

type Profile = {
    patient: {
        id: number;
        full_name: string;
        first_name: string;
        last_name: string;
        national_id: string | null;
        phone: string | null;
        gender: 'male' | 'female' | 'other' | null;
        marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null;
        city: string | null;
        village: string | null;
        date_of_birth: string | null;
        allergies_summary: string | null;
        chronic_summary: string | null;
        age: number | null;
    };
    history: {
        id: number;
        started_at: string | null;
        ended_at: string | null;
        visit_type: 'first' | 'review' | null;
        chief_complaint: string | null;
        notes: string | null;
        follow_up_in_days: number | null;
        doctor: string | null;
        services: { name: string; price: number; quantity: number }[];
    }[];
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: number | null;
};

export function PatientDetailsDialog({ open, onOpenChange, patientId }: Props) {
    const { t } = useTranslation('tenant');
    const { t: tc } = useTranslation('common');
    const { locale } = useLocale();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!open || !patientId) {
            setProfile(null);
            setErrors({});
            return;
        }
        let cancelled = false;
        setLoading(true);
        axios
            .get<Profile>(`/patients/${patientId}/profile`)
            .then(({ data }) => {
                if (!cancelled) setProfile(data);
            })
            .catch(() => {
                if (!cancelled) toast.error(t('patientDetails.loadError'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [open, patientId, t]);

    const setField = <K extends keyof Profile['patient']>(key: K, value: Profile['patient'][K]) => {
        setProfile((p) => (p ? { ...p, patient: { ...p.patient, [key]: value } } : p));
    };

    const selectedCity = useMemo(
        () => findCity(profile?.patient.city ?? null),
        [profile?.patient.city],
    );
    const villages = selectedCity?.villages ?? [];

    const submitInfo = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!profile) return;
        setSaving(true);
        setErrors({});
        const p = profile.patient;
        axios
            .patch(`/patients/${p.id}`, {
                full_name: p.full_name,
                national_id: p.national_id || null,
                phone: p.phone || null,
                gender: p.gender || null,
                marital_status: p.marital_status || null,
                city: p.city || null,
                village: p.village || null,
                date_of_birth: p.date_of_birth || null,
            })
            .then(() => {
                toast.success(t('patientDetails.savedToast'));
                onOpenChange(false);
            })
            .catch((err) => {
                if (err?.response?.status === 422) {
                    const flat: Record<string, string> = {};
                    for (const [k, v] of Object.entries(
                        (err.response.data?.errors ?? {}) as Record<string, string[]>,
                    )) {
                        flat[k] = v[0];
                    }
                    setErrors(flat);
                } else {
                    toast.error(t('patientDetails.saveError'));
                }
            })
            .finally(() => setSaving(false));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {profile?.patient.full_name ?? t('patientDetails.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('patientDetails.subtitle')}
                    </DialogDescription>
                </DialogHeader>

                {loading || !profile ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Tabs defaultValue="history">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="history">
                                {t('patientDetails.tabs.history')}
                            </TabsTrigger>
                            <TabsTrigger value="info">
                                {t('patientDetails.tabs.info')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="history" className="mt-4 space-y-4">
                            <FlagsHeader
                                allergies={profile.patient.allergies_summary}
                                chronic={profile.patient.chronic_summary}
                                t={t}
                            />

                            {profile.history.length === 0 ? (
                                <p className="rounded-md border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                                    {t('patientDetails.noHistory')}
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {profile.history.map((h) => (
                                        <li
                                            key={h.id}
                                            className="rounded-lg border bg-card p-4 shadow-sm"
                                        >
                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                <p className="text-sm font-semibold">
                                                    {formatDateTime(h.started_at)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {h.doctor ?? '—'}
                                                    {h.visit_type &&
                                                        ` · ${
                                                            h.visit_type === 'first'
                                                                ? t('doctorPanel.complete.firstVisit')
                                                                : t('doctorPanel.complete.reviewVisit')
                                                        }`}
                                                </p>
                                            </div>
                                            {h.chief_complaint && (
                                                <p className="mt-2 text-sm">
                                                    <span className="text-muted-foreground">
                                                        {t('doctorPanel.consultation.chiefComplaint')}:
                                                    </span>{' '}
                                                    {h.chief_complaint}
                                                </p>
                                            )}
                                            {h.notes && (
                                                <p className="mt-1 text-sm">
                                                    <span className="text-muted-foreground">
                                                        {t('doctorPanel.consultation.notes')}:
                                                    </span>{' '}
                                                    {h.notes}
                                                </p>
                                            )}
                                            {h.services.length > 0 && (
                                                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                                                    {h.services.map((s, i) => (
                                                        <li key={i} className="flex justify-between">
                                                            <span>{s.name}</span>
                                                            <span className="font-mono">
                                                                {s.price * s.quantity}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </TabsContent>

                        <TabsContent value="info" className="mt-4">
                            <form onSubmit={submitInfo} className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="sm:col-span-2 space-y-2">
                                        <Label htmlFor="full_name">
                                            {t('patients.simple.fullName')}
                                        </Label>
                                        <Input
                                            id="full_name"
                                            value={profile.patient.full_name}
                                            onChange={(e) => setField('full_name', e.target.value)}
                                            required
                                        />
                                        {errors.full_name && (
                                            <p className="text-sm text-destructive">
                                                {errors.full_name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="national_id">
                                            {t('patients.simple.nationalId')}
                                        </Label>
                                        <Input
                                            id="national_id"
                                            value={profile.patient.national_id ?? ''}
                                            onChange={(e) => setField('national_id', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">{t('patients.simple.phone')}</Label>
                                        <Input
                                            id="phone"
                                            value={profile.patient.phone ?? ''}
                                            onChange={(e) => setField('phone', e.target.value)}
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('patients.simple.gender')}</Label>
                                        <Select
                                            value={profile.patient.gender ?? undefined}
                                            onValueChange={(v) =>
                                                setField('gender', v as 'male' | 'female')
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
                                            value={profile.patient.marital_status ?? undefined}
                                            onValueChange={(v) =>
                                                setField(
                                                    'marital_status',
                                                    v as Profile['patient']['marital_status'],
                                                )
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
                                            value={profile.patient.city ?? undefined}
                                            onValueChange={(v) => {
                                                setField('city', v);
                                                setField('village', '');
                                            }}
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
                                            value={profile.patient.village ?? undefined}
                                            onValueChange={(v) => setField('village', v)}
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
                                            value={profile.patient.date_of_birth ?? ''}
                                            onChange={(e) =>
                                                setField('date_of_birth', e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 border-t pt-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => onOpenChange(false)}
                                        disabled={saving}
                                    >
                                        {tc('actions.cancel')}
                                    </Button>
                                    <Button type="submit" disabled={saving}>
                                        {saving && (
                                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                        )}
                                        {tc('actions.save')}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}

function FlagsHeader({
    allergies,
    chronic,
    t,
}: {
    allergies: string | null;
    chronic: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any;
}) {
    if (!allergies && !chronic) return null;
    return (
        <div className="grid gap-2 sm:grid-cols-2">
            {allergies && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <p className="text-xs font-semibold uppercase tracking-wide">
                        {t('visit.flags.allergies')}
                    </p>
                    <p className="mt-1 leading-snug text-foreground">{allergies}</p>
                </div>
            )}
            {chronic && (
                <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                    <p className="text-xs font-semibold uppercase tracking-wide">
                        {t('visit.flags.chronic')}
                    </p>
                    <p className="mt-1 leading-snug text-foreground">{chronic}</p>
                </div>
            )}
        </div>
    );
}
