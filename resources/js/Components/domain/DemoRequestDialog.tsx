import { useForm } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { type FormEventHandler, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
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
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Textarea } from '@/Components/ui/textarea';

type Intent = 'demo' | 'register';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialIntent?: Intent;
};

type FormShape = {
    clinic_name: string;
    contact_name: string;
    email: string;
    phone: string;
    country: string;
    intent: Intent;
    message: string;
    /** Honeypot — bots fill it, server 422s. */
    website: string;
};

const EMPTY: FormShape = {
    clinic_name: '',
    contact_name: '',
    email: '',
    phone: '',
    country: '',
    intent: 'demo',
    message: '',
    website: '',
};

export function DemoRequestDialog({ open, onOpenChange, initialIntent = 'demo' }: Props) {
    const { t } = useTranslation('common');
    const [submitted, setSubmitted] = useState(false);
    const form = useForm<FormShape>({ ...EMPTY, intent: initialIntent });

    useEffect(() => {
        if (open) {
            setSubmitted(false);
            form.setData('intent', initialIntent);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialIntent]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post('/demo-request', {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitted(true);
                form.reset();
                toast.success(t('demoRequest.toastSuccess'));
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                {submitted ? (
                    <div className="space-y-4 py-2 text-center">
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                            <CheckCircle2 className="h-6 w-6" />
                        </span>
                        <div className="space-y-1">
                            <DialogTitle>{t('demoRequest.success.title')}</DialogTitle>
                            <DialogDescription>
                                {t('demoRequest.success.body')}
                            </DialogDescription>
                        </div>
                        <Button onClick={() => onOpenChange(false)} className="mt-2">
                            {t('demoRequest.success.close')}
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={submit}>
                        <DialogHeader className="space-y-2">
                            <DialogTitle>{t('demoRequest.title')}</DialogTitle>
                            <DialogDescription>
                                {t('demoRequest.subtitle')}
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs
                            value={form.data.intent}
                            onValueChange={(v) => form.setData('intent', v as Intent)}
                            className="mt-4"
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="demo">
                                    {t('demoRequest.intents.demo')}
                                </TabsTrigger>
                                <TabsTrigger value="register">
                                    {t('demoRequest.intents.register')}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="mt-5 space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="clinic_name">
                                        {t('demoRequest.fields.clinicName')}
                                    </Label>
                                    <Input
                                        id="clinic_name"
                                        autoFocus
                                        value={form.data.clinic_name}
                                        onChange={(e) => form.setData('clinic_name', e.target.value)}
                                        aria-invalid={!!form.errors.clinic_name || undefined}
                                        aria-required="true"
                                    />
                                    {form.errors.clinic_name && (
                                        <p className="text-sm text-destructive">
                                            {form.errors.clinic_name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact_name">
                                        {t('demoRequest.fields.contactName')}
                                    </Label>
                                    <Input
                                        id="contact_name"
                                        value={form.data.contact_name}
                                        onChange={(e) =>
                                            form.setData('contact_name', e.target.value)
                                        }
                                        aria-invalid={!!form.errors.contact_name || undefined}
                                        aria-required="true"
                                    />
                                    {form.errors.contact_name && (
                                        <p className="text-sm text-destructive">
                                            {form.errors.contact_name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">{t('demoRequest.fields.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    aria-invalid={!!form.errors.email || undefined}
                                    aria-required="true"
                                />
                                {form.errors.email && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>{t('demoRequest.fields.phone')}</Label>
                                <PhoneInput
                                    international
                                    defaultCountry="PS"
                                    value={form.data.phone || undefined}
                                    onChange={(v) => form.setData('phone', v ?? '')}
                                    onCountryChange={(c) => c && form.setData('country', c)}
                                    className="phone-input flex h-11 items-center gap-2 rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                                />
                                {form.errors.phone && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.phone}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">
                                    {t('demoRequest.fields.message')}
                                </Label>
                                <Textarea
                                    id="message"
                                    rows={3}
                                    value={form.data.message}
                                    onChange={(e) => form.setData('message', e.target.value)}
                                    placeholder={t('demoRequest.fields.messagePlaceholder')}
                                />
                            </div>

                            {/* Honeypot — visually hidden but reachable to dumb bots. */}
                            <input
                                type="text"
                                name="website"
                                tabIndex={-1}
                                autoComplete="off"
                                value={form.data.website}
                                onChange={(e) => form.setData('website', e.target.value)}
                                aria-hidden="true"
                                className="absolute left-[-9999px] h-0 w-0 opacity-0"
                            />
                        </div>

                        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={form.processing}
                            >
                                {t('demoRequest.cancel')}
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing
                                    ? t('demoRequest.submitting')
                                    : form.data.intent === 'register'
                                      ? t('demoRequest.submitRegister')
                                      : t('demoRequest.submitDemo')}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
