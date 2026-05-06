import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
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
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import CentralLayout from '@/Layouts/CentralLayout';

type Settings = {
    general: { platform_name?: string; support_email?: string; default_language?: string };
    legal: { terms_url?: string; privacy_url?: string };
    branding: { logo_url?: string };
};

type Props = {
    settings: Settings;
};

export default function SettingsIndex({ settings }: Props) {
    const { t } = useTranslation('central');
    useFlashToasts();

    const form = useForm({
        general: {
            platform_name: settings.general?.platform_name ?? '',
            support_email: settings.general?.support_email ?? '',
            default_language: settings.general?.default_language ?? 'en',
        },
        legal: {
            terms_url: settings.legal?.terms_url ?? '',
            privacy_url: settings.legal?.privacy_url ?? '',
        },
        branding: {
            logo_url: settings.branding?.logo_url ?? '',
        },
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch('/settings', { preserveScroll: true });
    };

    type Section = 'general' | 'legal' | 'branding';

    const setSection = (section: Section, key: string, value: string) => {
        form.setData((data) => ({
            ...data,
            [section]: {
                ...data[section],
                [key]: value,
            },
        }));
    };

    return (
        <CentralLayout
            title={t('settings.title')}
            pageTitle={t('settings.title')}
            description={t('settings.subtitle')}
        >
            <form onSubmit={submit}>
                <Tabs defaultValue="general">
                    <TabsList>
                        <TabsTrigger value="general">{t('settings.tabs.general')}</TabsTrigger>
                        <TabsTrigger value="legal">{t('settings.tabs.legal')}</TabsTrigger>
                        <TabsTrigger value="branding">{t('settings.tabs.branding')}</TabsTrigger>
                        <TabsTrigger value="email">{t('settings.tabs.email')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-4">
                        <Card>
                            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="platform_name">
                                        {t('settings.general.platformName')}
                                    </Label>
                                    <Input
                                        id="platform_name"
                                        value={form.data.general.platform_name}
                                        onChange={(event) =>
                                            setSection('general', 'platform_name', event.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="support_email">
                                        {t('settings.general.supportEmail')}
                                    </Label>
                                    <Input
                                        id="support_email"
                                        type="email"
                                        value={form.data.general.support_email}
                                        onChange={(event) =>
                                            setSection('general', 'support_email', event.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('settings.general.defaultLanguage')}</Label>
                                    <Select
                                        value={form.data.general.default_language}
                                        onValueChange={(value) =>
                                            setSection('general', 'default_language', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="ar">العربية</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="legal" className="mt-4">
                        <Card>
                            <CardContent className="grid gap-4 p-6">
                                <div className="space-y-2">
                                    <Label htmlFor="terms_url">{t('settings.legal.termsUrl')}</Label>
                                    <Input
                                        id="terms_url"
                                        type="url"
                                        value={form.data.legal.terms_url}
                                        onChange={(event) =>
                                            setSection('legal', 'terms_url', event.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="privacy_url">
                                        {t('settings.legal.privacyUrl')}
                                    </Label>
                                    <Input
                                        id="privacy_url"
                                        type="url"
                                        value={form.data.legal.privacy_url}
                                        onChange={(event) =>
                                            setSection('legal', 'privacy_url', event.target.value)
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="branding" className="mt-4">
                        <Card>
                            <CardContent className="grid gap-4 p-6">
                                <div className="space-y-2">
                                    <Label htmlFor="logo_url">{t('settings.branding.logoUrl')}</Label>
                                    <Input
                                        id="logo_url"
                                        type="url"
                                        value={form.data.branding.logo_url}
                                        onChange={(event) =>
                                            setSection('branding', 'logo_url', event.target.value)
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="email" className="mt-4">
                        <Alert>
                            <AlertTitle>{t('settings.tabs.email')}</AlertTitle>
                            <AlertDescription>{t('settings.email.stub')}</AlertDescription>
                        </Alert>
                    </TabsContent>
                </Tabs>

                <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        {t('settings.save')}
                    </Button>
                </div>
            </form>
        </CentralLayout>
    );
}
