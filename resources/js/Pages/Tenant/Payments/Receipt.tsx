import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Printer } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/Components/ui/button';

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

const STRINGS = {
    en: {
        title: 'Receipt',
        receiptNumber: 'Receipt #',
        date: 'Date',
        patient: 'Patient',
        method: 'Method',
        amount: 'Amount',
        cash: 'Cash',
        card: 'Card',
        insurance: 'Insurance',
        total: 'Total',
        thankYou: 'Thank you for visiting.',
        print: 'Print',
        back: 'Back',
    },
    ar: {
        title: 'إيصال',
        receiptNumber: 'رقم الإيصال',
        date: 'التاريخ',
        patient: 'المريض',
        method: 'طريقة الدفع',
        amount: 'المبلغ',
        cash: 'نقدًا',
        card: 'بطاقة',
        insurance: 'تأمين',
        total: 'الإجمالي',
        thankYou: 'شكرًا لزيارتكم.',
        print: 'طباعة',
        back: 'رجوع',
    },
} as const;

export default function Receipt({ payment, clinic, patient }: Props) {
    const lang = (patient?.preferred_language ?? 'ar') as 'en' | 'ar';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const s = STRINGS[lang];

    useEffect(() => {
        // Force document direction for the receipt itself even when the
        // logged-in user is in the other language.
        const prev = document.documentElement.dir;
        document.documentElement.dir = dir;
        return () => {
            document.documentElement.dir = prev;
        };
    }, [dir]);

    const fmt = (n: number) =>
        n.toLocaleString(lang === 'ar' ? 'ar' : 'en', {
            style: 'currency',
            currency: 'USD',
        });

    return (
        <>
            <Head title={`${s.title} ${payment.receipt_number}`} />
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
                            {s.back}
                        </Link>
                    </Button>
                    <Button onClick={() => window.print()}>
                        <Printer className="me-2 h-4 w-4" />
                        {s.print}
                    </Button>
                </div>

                <div
                    className="receipt-page mx-auto max-w-2xl rounded-md border bg-card p-8 shadow-sm"
                    dir={dir}
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
                                {s.receiptNumber}
                            </p>
                            <p className="font-mono font-semibold">{payment.receipt_number}</p>
                        </div>
                        <div className="text-end">
                            <p className="text-xs uppercase text-muted-foreground">{s.date}</p>
                            <p>{payment.paid_at ? new Date(payment.paid_at).toLocaleString() : '—'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs uppercase text-muted-foreground">{s.patient}</p>
                            <p className="font-medium">{patient?.name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">
                                {patient?.patient_code} · {patient?.phone}
                            </p>
                        </div>
                    </section>

                    <section className="border-t border-b py-4">
                        <table className="w-full">
                            <tbody>
                                {payment.cash_amount > 0 && (
                                    <tr>
                                        <td className="py-1 text-sm">{s.cash}</td>
                                        <td className="py-1 text-end font-mono">
                                            {fmt(payment.cash_amount)}
                                        </td>
                                    </tr>
                                )}
                                {payment.card_amount > 0 && (
                                    <tr>
                                        <td className="py-1 text-sm">{s.card}</td>
                                        <td className="py-1 text-end font-mono">
                                            {fmt(payment.card_amount)}
                                        </td>
                                    </tr>
                                )}
                                {payment.insurance_amount > 0 && (
                                    <tr>
                                        <td className="py-1 text-sm">{s.insurance}</td>
                                        <td className="py-1 text-end font-mono">
                                            {fmt(payment.insurance_amount)}
                                        </td>
                                    </tr>
                                )}
                                <tr className="border-t font-semibold">
                                    <td className="py-2">{s.total}</td>
                                    <td className="py-2 text-end font-mono text-h3">
                                        {fmt(payment.amount)}
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

                    <p className="mt-2 text-center text-xs text-muted-foreground">{s.thankYou}</p>
                </div>
            </div>
        </>
    );
}
