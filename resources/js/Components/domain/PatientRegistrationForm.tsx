import { useForm } from '@inertiajs/react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/Components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
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
import { Switch } from '@/Components/ui/switch';
import { Textarea } from '@/Components/ui/textarea';

type InsuranceProvider = { id: number; name: string };

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialQuery?: string;
    insuranceProviders: InsuranceProvider[];
    onCreated?: (id: number) => void;
};

type Duplicate = {
    id: number;
    patient_code: string;
    first_name: string;
    last_name: string;
    phone: string;
    date_of_birth: string | null;
};

export function PatientRegistrationForm({
    open,
    onOpenChange,
    initialQuery = '',
    insuranceProviders,
    onCreated,
}: Props) {
    const { t } = useTranslation('tenant');

    const initial = useMemo(() => {
        // If the search query looks like digits, prefill phone; otherwise
        // use it as the first name (best guess).
        const digits = initialQuery.replace(/\D+/g, '');
        const looksLikePhone = digits.length >= 6 && digits.length === initialQuery.replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '').length;
        return {
            first_name: looksLikePhone ? '' : initialQuery,
            last_name: '',
            phone: looksLikePhone ? initialQuery : '',
            phone_alt: '',
            date_of_birth: '',
            gender: '',
            national_id: '',
            email: '',
            marital_status: '',
            occupation: '',
            preferred_language: 'ar',
            address: '',
            city: '',
            referred_by: '',
            emergency_name: '',
            emergency_phone: '',
            emergency_relation: '',
            blood_type: '',
            allergies_summary: '',
            chronic_summary: '',
            medications_summary: '',
            has_insurance: false,
            insurance_provider_id: '',
            insurance_provider_new: '',
            insurance_policy_number: '',
            notes: '',
            force_duplicate_phone: false,
        };
    }, [initialQuery]);

    const form = useForm(initial);
    const [duplicates, setDuplicates] = useState<Duplicate[]>([]);

    useEffect(() => {
        if (open) {
            form.setDefaults(initial);
            form.setData(initial);
            setDuplicates([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialQuery]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/patients', {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            },
            onError: (errors) => {
                if ((errors as Record<string, string>).phone === 'phone_duplicate') {
                    // Server stashed matches in flash bag.
                    const flash = (window as unknown as { __flash?: { duplicate_phone_matches?: Duplicate[] } }).__flash;
                    if (flash?.duplicate_phone_matches) {
                        setDuplicates(flash.duplicate_phone_matches);
                    }
                }
            },
        });
    };

    const proceedAnyway = () => {
        form.setData('force_duplicate_phone', true);
        form.post('/patients', {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
                setDuplicates([]);
            },
        });
    };

    const age = form.data.date_of_birth
        ? Math.max(
              0,
              Math.floor(
                  (Date.now() - new Date(form.data.date_of_birth).getTime()) /
                      (365.25 * 24 * 3600 * 1000),
              ),
          )
        : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('patients.form.createTitle')}</DialogTitle>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    {duplicates.length > 0 && (
                        <Alert variant="destructive">
                            <AlertTitle>
                                {t('patients.duplicatePhone.title', { count: duplicates.length })}
                            </AlertTitle>
                            <AlertDescription className="space-y-2">
                                <p>{t('patients.duplicatePhone.body')}</p>
                                <ul className="space-y-1">
                                    {duplicates.map((d) => (
                                        <li key={d.id} className="flex items-center justify-between">
                                            <span className="text-sm">
                                                {d.first_name} {d.last_name} · {d.patient_code} ·{' '}
                                                {d.phone}
                                            </span>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    onOpenChange(false);
                                                    onCreated?.(d.id);
                                                }}
                                            >
                                                {t('patients.duplicatePhone.useExisting')}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={proceedAnyway}
                                >
                                    {t('patients.duplicatePhone.createAnyway')}
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Step 1 — always visible */}
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">{t('patients.form.firstName')} *</Label>
                            <Input
                                id="first_name"
                                value={form.data.first_name}
                                onChange={(e) => form.setData('first_name', e.target.value)}
                            />
                            {form.errors.first_name && (
                                <p className="text-xs text-destructive">{form.errors.first_name}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">{t('patients.form.lastName')} *</Label>
                            <Input
                                id="last_name"
                                value={form.data.last_name}
                                onChange={(e) => form.setData('last_name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">{t('patients.form.phone')} *</Label>
                            <Input
                                id="phone"
                                value={form.data.phone}
                                onChange={(e) => form.setData('phone', e.target.value)}
                            />
                            {form.errors.phone && form.errors.phone !== 'phone_duplicate' && (
                                <p className="text-xs text-destructive">{form.errors.phone}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dob">{t('patients.form.dob')}</Label>
                            <Input
                                id="dob"
                                type="date"
                                value={form.data.date_of_birth}
                                onChange={(e) => form.setData('date_of_birth', e.target.value)}
                            />
                            {age !== null && (
                                <p className="text-xs text-muted-foreground">
                                    {t('patients.form.ageHint', { age })}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>{t('patients.form.gender')} *</Label>
                            <Select
                                value={form.data.gender}
                                onValueChange={(v) => form.setData('gender', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Accordion type="multiple" className="space-y-2">
                        <AccordionItem value="more">
                            <AccordionTrigger>{t('patients.form.section2')}</AccordionTrigger>
                            <AccordionContent className="grid gap-3 md:grid-cols-2 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="national_id">{t('patients.form.nationalId')}</Label>
                                    <Input
                                        id="national_id"
                                        value={form.data.national_id}
                                        onChange={(e) => form.setData('national_id', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('patients.form.email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={form.data.email}
                                        onChange={(e) => form.setData('email', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone_alt">{t('patients.form.phoneAlt')}</Label>
                                    <Input
                                        id="phone_alt"
                                        value={form.data.phone_alt}
                                        onChange={(e) => form.setData('phone_alt', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('patients.form.maritalStatus')}</Label>
                                    <Select
                                        value={form.data.marital_status}
                                        onValueChange={(v) => form.setData('marital_status', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single</SelectItem>
                                            <SelectItem value="married">Married</SelectItem>
                                            <SelectItem value="divorced">Divorced</SelectItem>
                                            <SelectItem value="widowed">Widowed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="occupation">{t('patients.form.occupation')}</Label>
                                    <Input
                                        id="occupation"
                                        value={form.data.occupation}
                                        onChange={(e) => form.setData('occupation', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('patients.form.preferredLanguage')}</Label>
                                    <Select
                                        value={form.data.preferred_language}
                                        onValueChange={(v) => form.setData('preferred_language', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ar">العربية</SelectItem>
                                            <SelectItem value="en">English</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">{t('patients.form.address')}</Label>
                                    <Input
                                        id="address"
                                        value={form.data.address}
                                        onChange={(e) => form.setData('address', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">{t('patients.form.city')}</Label>
                                    <Input
                                        id="city"
                                        value={form.data.city}
                                        onChange={(e) => form.setData('city', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="referred_by">{t('patients.form.referredBy')}</Label>
                                    <Input
                                        id="referred_by"
                                        value={form.data.referred_by}
                                        onChange={(e) => form.setData('referred_by', e.target.value)}
                                    />
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="emergency">
                            <AccordionTrigger>{t('patients.form.section3')}</AccordionTrigger>
                            <AccordionContent className="grid gap-3 md:grid-cols-3 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="em_name">{t('patients.form.emergencyName')}</Label>
                                    <Input
                                        id="em_name"
                                        value={form.data.emergency_name}
                                        onChange={(e) => form.setData('emergency_name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="em_phone">{t('patients.form.emergencyPhone')}</Label>
                                    <Input
                                        id="em_phone"
                                        value={form.data.emergency_phone}
                                        onChange={(e) => form.setData('emergency_phone', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="em_rel">{t('patients.form.emergencyRelation')}</Label>
                                    <Input
                                        id="em_rel"
                                        value={form.data.emergency_relation}
                                        onChange={(e) => form.setData('emergency_relation', e.target.value)}
                                    />
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="medical">
                            <AccordionTrigger>{t('patients.form.section4')}</AccordionTrigger>
                            <AccordionContent className="grid gap-3 pt-2">
                                <div className="space-y-2">
                                    <Label>{t('patients.form.bloodType')}</Label>
                                    <Select
                                        value={form.data.blood_type}
                                        onValueChange={(v) => form.setData('blood_type', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="—" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                                                <SelectItem key={bt} value={bt}>
                                                    {bt}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('patients.form.allergies')}</Label>
                                    <Textarea
                                        rows={2}
                                        value={form.data.allergies_summary}
                                        onChange={(e) => form.setData('allergies_summary', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('patients.form.chronic')}</Label>
                                    <Textarea
                                        rows={2}
                                        value={form.data.chronic_summary}
                                        onChange={(e) => form.setData('chronic_summary', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('patients.form.medications')}</Label>
                                    <Textarea
                                        rows={2}
                                        value={form.data.medications_summary}
                                        onChange={(e) => form.setData('medications_summary', e.target.value)}
                                    />
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="insurance">
                            <AccordionTrigger>{t('patients.form.section5')}</AccordionTrigger>
                            <AccordionContent className="grid gap-3 pt-2">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="has_insurance"
                                        checked={form.data.has_insurance}
                                        onCheckedChange={(v) => form.setData('has_insurance', v)}
                                    />
                                    <Label htmlFor="has_insurance">
                                        {t('patients.form.hasInsurance')}
                                    </Label>
                                </div>
                                {form.data.has_insurance && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>{t('patients.form.provider')}</Label>
                                            <Select
                                                value={form.data.insurance_provider_id || ''}
                                                onValueChange={(v) =>
                                                    form.setData('insurance_provider_id', v)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="—" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {insuranceProviders.map((p) => (
                                                        <SelectItem
                                                            key={p.id}
                                                            value={String(p.id)}
                                                        >
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ins_new">Or add new provider</Label>
                                            <Input
                                                id="ins_new"
                                                placeholder="Provider name"
                                                value={form.data.insurance_provider_new}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'insurance_provider_new',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="policy">
                                                {t('patients.form.policyNumber')}
                                            </Label>
                                            <Input
                                                id="policy"
                                                value={form.data.insurance_policy_number}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'insurance_policy_number',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="notes">
                            <AccordionTrigger>{t('patients.form.section7')}</AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <Textarea
                                    rows={3}
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    placeholder={t('patients.form.notesHint')}
                                />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {t('patients.create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
