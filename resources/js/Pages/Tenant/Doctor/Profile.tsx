import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import AppLayout from '@/Layouts/AppLayout';
import type { DoctorProfile } from '@/types/tenant';

type Props = {
    doctor: DoctorProfile | null;
};

export default function DoctorProfilePage({ doctor }: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    const form = useForm({
        name: doctor?.user?.name ?? '',
        phone: doctor?.user?.phone ?? '',
        avatar: null as File | null,
        specialty: doctor?.specialty ?? '',
        license_number: doctor?.license_number ?? '',
        bio_en: doctor?.bio_en ?? '',
        bio_ar: doctor?.bio_ar ?? '',
        consultation_duration_minutes: String(
            doctor?.consultation_duration_minutes ?? 30,
        ),
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/doctor/profile', {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    if (!doctor) {
        return (
            <AppLayout title={t('doctor.profile.title')} pageTitle={t('doctor.profile.title')}>
                <Card>
                    <CardContent className="p-6 text-sm text-muted-foreground">
                        No doctor profile is attached to this user account.
                    </CardContent>
                </Card>
            </AppLayout>
        );
    }

    const initials = (doctor.user?.name ?? '?')
        .split(/\s+/)
        .map((p) => p.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <AppLayout
            title={t('doctor.profile.title')}
            pageTitle={t('doctor.profile.title')}
            description={t('doctor.profile.subtitle')}
        >
            <Card>
                <CardHeader>
                    <CardTitle>{t('doctor.profile.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="grid gap-6 md:grid-cols-[auto_1fr]">
                        <div className="flex flex-col items-center gap-3">
                            <Avatar className="h-24 w-24">
                                {doctor.user?.avatar_url ? (
                                    <AvatarImage src={doctor.user.avatar_url} alt={doctor.user.name} />
                                ) : null}
                                <AvatarFallback className="bg-primary text-primary-foreground text-h3">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <Label htmlFor="avatar" className="text-sm">
                                {t('doctor.profile.avatar')}
                            </Label>
                            <Input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    form.setData('avatar', e.target.files?.[0] ?? null)
                                }
                            />
                            {form.errors.avatar && (
                                <p className="text-xs text-destructive">{form.errors.avatar}</p>
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">{t('doctor.profile.name')}</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                />
                                {form.errors.name && (
                                    <p className="text-xs text-destructive">{form.errors.name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">{t('doctor.profile.phone')}</Label>
                                <Input
                                    id="phone"
                                    value={form.data.phone}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="specialty">{t('doctor.profile.specialty')}</Label>
                                <Input
                                    id="specialty"
                                    value={form.data.specialty}
                                    onChange={(e) => form.setData('specialty', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="license">{t('doctor.profile.license')}</Label>
                                <Input
                                    id="license"
                                    value={form.data.license_number}
                                    onChange={(e) =>
                                        form.setData('license_number', e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">
                                    {t('doctor.profile.consultationDuration')}
                                </Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min={5}
                                    max={240}
                                    value={form.data.consultation_duration_minutes}
                                    onChange={(e) =>
                                        form.setData(
                                            'consultation_duration_minutes',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="bio_en">{t('doctor.profile.bioEn')}</Label>
                                <Textarea
                                    id="bio_en"
                                    rows={3}
                                    value={form.data.bio_en}
                                    onChange={(e) => form.setData('bio_en', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="bio_ar">{t('doctor.profile.bioAr')}</Label>
                                <Textarea
                                    id="bio_ar"
                                    rows={3}
                                    dir="rtl"
                                    value={form.data.bio_ar}
                                    onChange={(e) => form.setData('bio_ar', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <Button type="submit" disabled={form.processing}>
                                    {t('settings.save')}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
