import { router, useForm } from '@inertiajs/react';
import { Upload } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/Components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Switch } from '@/Components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Textarea } from '@/Components/ui/textarea';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import { usePending } from '@/Hooks/usePending';
import AppLayout from '@/Layouts/AppLayout';
import type { ClinicSettings } from '@/types/tenant';

type Props = { settings: ClinicSettings };

export default function SettingsPage({ settings }: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    const form = useForm({
        general: {
            name: settings.general?.name ?? '',
            address: settings.general?.address ?? '',
            phone: settings.general?.phone ?? '',
            email: settings.general?.email ?? '',
        },
        branding: {
            primary_color: settings.branding?.primary_color ?? '#0066FF',
            logo_url: settings.branding?.logo_url ?? '',
        },
        localization: {
            default_language: settings.localization?.default_language ?? 'ar',
        },
        receipt: {
            header: settings.receipt?.header ?? '',
            footer: settings.receipt?.footer ?? '',
            show_logo: Boolean(settings.receipt?.show_logo ?? true),
        },
        notifications: {
            appointment_reminders: Boolean(
                settings.notifications?.appointment_reminders ?? false,
            ),
        },
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch('/settings', { preserveScroll: true });
    };

    const set = (
        section: 'general' | 'branding' | 'localization' | 'receipt' | 'notifications',
        key: string,
        value: unknown,
    ) =>
        form.setData((data) => ({
            ...data,
            [section]: { ...data[section], [key]: value },
        }));

    const [logoBusy, runLogoUpload] = usePending();
    const onLogoUpload = (file: File) => {
        const data = new FormData();
        data.append('logo', file);
        runLogoUpload(
            (opts) => router.post('/settings/branding/logo', data, opts),
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout
            title={t('settings.title')}
            pageTitle={t('settings.title')}
            description={t('settings.subtitle')}
        >
            <form onSubmit={submit}>
                <Tabs defaultValue="general">
                    <TabsList>
                        <TabsTrigger value="general">{t('settings.tabs.general')}</TabsTrigger>
                        <TabsTrigger value="branding">{t('settings.tabs.branding')}</TabsTrigger>
                        <TabsTrigger value="localization">
                            {t('settings.tabs.localization')}
                        </TabsTrigger>
                        <TabsTrigger value="receipt">{t('settings.tabs.receipt')}</TabsTrigger>
                        <TabsTrigger value="notifications">
                            {t('settings.tabs.notifications')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-4">
                        <Card>
                            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t('settings.general.name')}</Label>
                                    <Input
                                        id="name"
                                        value={form.data.general.name}
                                        onChange={(e) => set('general', 'name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">{t('settings.general.phone')}</Label>
                                    <Input
                                        id="phone"
                                        value={form.data.general.phone}
                                        onChange={(e) => set('general', 'phone', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('settings.general.email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={form.data.general.email}
                                        onChange={(e) => set('general', 'email', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">{t('settings.general.address')}</Label>
                                    <Textarea
                                        id="address"
                                        rows={2}
                                        value={form.data.general.address}
                                        onChange={(e) => set('general', 'address', e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="branding" className="mt-4">
                        <Card>
                            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{t('settings.branding.logo')}</Label>
                                    <div className="flex items-center gap-3">
                                        {form.data.branding.logo_url && (
                                            <img
                                                src={form.data.branding.logo_url}
                                                alt="logo"
                                                className="h-12 w-12 rounded-md border bg-muted object-contain"
                                            />
                                        )}
                                        <label
                                            className={
                                                logoBusy
                                                    ? 'pointer-events-none inline-flex opacity-60'
                                                    : 'inline-flex'
                                            }
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                disabled={logoBusy}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) onLogoUpload(file);
                                                }}
                                            />
                                            <span className="inline-flex items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
                                                <Upload className="me-2 h-4 w-4" />
                                                {t('settings.branding.uploadLogo')}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('settings.branding.primaryColor')}</Label>
                                    <div className="flex items-center gap-3">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="h-10 w-10 rounded-md border"
                                                    style={{
                                                        background: form.data.branding.primary_color,
                                                    }}
                                                />
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-3">
                                                <HexColorPicker
                                                    color={form.data.branding.primary_color}
                                                    onChange={(c) =>
                                                        set('branding', 'primary_color', c)
                                                    }
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Input
                                            value={form.data.branding.primary_color}
                                            onChange={(e) =>
                                                set('branding', 'primary_color', e.target.value)
                                            }
                                            className="w-32 font-mono"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t('settings.branding.primaryColorHint')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="localization" className="mt-4">
                        <Card>
                            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{t('settings.localization.defaultLanguage')}</Label>
                                    <Select
                                        value={form.data.localization.default_language}
                                        onValueChange={(v) =>
                                            set('localization', 'default_language', v)
                                        }
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
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="receipt" className="mt-4">
                        <Card>
                            <CardContent className="grid gap-4 p-6">
                                <div className="space-y-2">
                                    <Label htmlFor="receipt-header">{t('settings.receipt.header')}</Label>
                                    <Textarea
                                        id="receipt-header"
                                        rows={2}
                                        value={form.data.receipt.header}
                                        onChange={(e) => set('receipt', 'header', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="receipt-footer">{t('settings.receipt.footer')}</Label>
                                    <Textarea
                                        id="receipt-footer"
                                        rows={2}
                                        value={form.data.receipt.footer}
                                        onChange={(e) => set('receipt', 'footer', e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="receipt-logo"
                                        checked={form.data.receipt.show_logo}
                                        onCheckedChange={(v) => set('receipt', 'show_logo', v)}
                                    />
                                    <Label htmlFor="receipt-logo">{t('settings.receipt.showLogo')}</Label>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications" className="mt-4">
                        <Card>
                            <CardContent className="grid gap-4 p-6">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="reminders"
                                        checked={form.data.notifications.appointment_reminders}
                                        onCheckedChange={(v) =>
                                            set('notifications', 'appointment_reminders', v)
                                        }
                                    />
                                    <Label htmlFor="reminders">
                                        {t('settings.notifications.appointmentReminders')}
                                    </Label>
                                </div>
                                <Alert>
                                    <AlertDescription>
                                        Email/SMS delivery is stubbed in v1.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        {t('settings.save')}
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}
