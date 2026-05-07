import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Printer } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/Components/ui/button';
import i18n from '@/i18n';

type Props = {
    payment: {
        id: number;
        receipt_number: string;
        amount: number;
        cash_amount: number;
        card_amount: number;
        insurance_amount: number;
        method: string;
        method_label: string;
        paid_at: string | null;
        notes: string | null;
    };
    clinic: {
        general?: { name?: string; address?: string; phone?: string; email?: string };
        branding?: { logo_url?: string };
        receipt?: { header?: string; footer?: string; show_logo?: boolean };
    };
    patient: {
        id: number;
        name: string;
        patient_code: string;
        phone: string;
        preferred_language: string;
    } | null;
};

/**
 * Print uses the patient's preferred language: it's the document the patient
 * walks out with. Looked-up via `i18n.t(..., { lng })` so the rest of the
 * app stays in the user's session locale while only this page renders in
 * the patient's tongue. Sets html[lang] + dir so the body font rule in
 * app.css swaps Manrope ⇄ IBM Plex Sans Arabic.
 */
export default function Receipt({ payment, clinic, patient }: Props) {
    const lang = (patient?.preferred_language === 'ar' ? 'ar' : 'en') as 'en' | 'ar';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const t = (key: string) =>
        i18n.t(key, { lng: lang, ns: 'tenant', defaultValue: key }) as string;

    useEffect(() => {
        const prevDir = document.documentElement.dir;
        const prevLang = document.documentElement.lang;
        document.documentElement.dir = dir;
        document.documentElement.lang = lang;
        return () => {
            document.documentElement.dir = prevDir;
            document.documentElement.lang = prevLang;
        };
    }, [dir, lang]);

    const fmtCurrency = (n: number) =>
        n.toLocaleString(lang === 'ar' ? 'ar' : 'en', {
            style: 'currency',
            currency: 'USD',
        });
    const fmtDate = (iso: string | null) =>
        iso ? new Date(iso).toLocaleString(lang === 'ar' ? 'ar' : 'en') : '—';

    return (
        <>
            <Head title={`${t('payments.receipt.title')} ${payment.receipt_number}`} />
            <style>{`
                @media print {
                    body { background: white !important; }
                    .no-print { display: none !important; }
                    .receipt-page { box-shadow: none !important; border: none !important; }
                }
            `}</style>

            <div className="bg-muted min-h-screen p-6 print:bg-white">
                <div className="no-print mx-auto mb-4 flex max-w-2xl items-center justify-between">
                    <Button asChild variant="ghost">
                        <Link href="/payments">
                            <ChevronLeft className="me-2 h-4 w-4" />
                            {t('payments.receipt.back')}
                        </Link>
                    </Button>
                    <Button onClick={() => window.print()}>
                        <Printer className="me-2 h-4 w-4" />
                        {t('payments.receipt.print')}
                    </Button>
                </div>

                <div
                    className="receipt-page mx-auto max-w-2xl rounded-md border bg-card p-8 shadow-sm"
                    dir={dir}
                    lang={lang}
                >
                    <header className="flex items-center gap-3 border-b pb-4">
                        {clinic.receipt?.show_logo !== false && clinic.branding?.logo_url && (
                            <img
                                src={clinic.branding.logo_url}
                                alt="logo"
                                className="h-14 w-14 rounded-md object-contain"
                            />
                        )}
                        <div>
                            <h1 className="text-h2">{clinic.general?.name ?? 'Clinic'}</h1>
                            {clinic.general?.address && (
                                <p className="text-sm text-muted-foreground">
                                    {clinic.general.address}
                                </p>
                            )}
                            {clinic.general?.phone && (
                                <p className="text-sm text-muted-foreground">
                                    {clinic.general.phone}
                                </p>
                            )}
                        </div>
                    </header>

                    {clinic.receipt?.header && (
                        <p className="mt-3 text-sm text-muted-foreground">
                            {clinic.receipt.header}
                        </p>
                    )}

                    <section className="my-6 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-xs uppercase text-muted-foreground">
                                {t('payments.receipt.receiptNumber')}
                            </p>
                            <p className="font-mono font-semibold">{payment.receipt_number}</p>
                        </div>
                        <div className="text-end">
                            <p className="text-xs uppercase text-muted-foreground">
                                {t('payments.receipt.date')}
                            </p>
                            <p>{fmtDate(payment.paid_at)}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs uppercase text-muted-foreground">
                                {t('payments.receipt.patient')}
                            </p>
                            <p className="font-medium">{patient?.name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">
                                {patient?.phone}
                            </p>
                        </div>
                    </section>

                    <section className="border-t border-b py-4">
                        <table className="w-full">
                            <tbody>
                                {payment.cash_amount > 0 && (
                                    <tr>
                                        <td className="py-1 text-sm">
                                            {t('payments.receipt.cash')}
                                        </td>
                                        <td className="py-1 text-end font-mono">
                                            {fmtCurrency(payment.cash_amount)}
                                        </td>
                                    </tr>
                                )}
                                {payment.card_amount > 0 && (
                                    <tr>
                                        <td className="py-1 text-sm">
                                            {t('payments.receipt.card')}
                                        </td>
                                        <td className="py-1 text-end font-mono">
                                            {fmtCurrency(payment.card_amount)}
                                        </td>
                                    </tr>
                                )}
                                {payment.insurance_amount > 0 && (
                                    <tr>
                                        <td className="py-1 text-sm">
                                            {t('payments.receipt.insurance')}
                                        </td>
                                        <td className="py-1 text-end font-mono">
                                            {fmtCurrency(payment.insurance_amount)}
                                        </td>
                                    </tr>
                                )}
                                <tr className="border-t font-semibold">
                                    <td className="py-2">{t('payments.receipt.total')}</td>
                                    <td className="py-2 text-end font-mono text-h3">
                                        {fmtCurrency(payment.amount)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {clinic.receipt?.footer && (
                        <p className="mt-4 text-center text-sm text-muted-foreground">
                            {clinic.receipt.footer}
                        </p>
                    )}

                    <p className="mt-2 text-center text-xs text-muted-foreground">
                        {t('payments.receipt.thankYou')}
                    </p>
                </div>
            </div>
        </>
    );
}
