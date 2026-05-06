import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Printer } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/Components/ui/button';

type Props = {
    prescription: {
        id: number;
        notes: string | null;
        printed_at: string | null;
        items: {
            medication_name: string;
            dosage: string | null;
            frequency: string | null;
            duration: string | null;
            instructions: string | null;
        }[];
    };
    consultation: {
        id: number;
        diagnoses?: { description: string; code: string | null }[];
    };
    patient: {
        name: string;
        patient_code: string;
        age: number | null;
        gender_label: string | null;
        preferred_language: string;
    } | null;
    doctor: {
        name: string | null;
        specialty: string;
        license_number: string | null;
    };
    clinic: {
        general?: { name?: string; address?: string; phone?: string };
        branding?: { logo_url?: string };
        receipt?: { show_logo?: boolean };
    };
};

const STRINGS = {
    en: {
        title: 'Prescription',
        date: 'Date',
        patient: 'Patient',
        diagnoses: 'Diagnoses',
        medications: 'Medications',
        signature: 'Doctor signature',
        license: 'License',
        print: 'Print',
        back: 'Back',
        none: '—',
    },
    ar: {
        title: 'وصفة طبية',
        date: 'التاريخ',
        patient: 'المريض',
        diagnoses: 'التشخيصات',
        medications: 'الأدوية',
        signature: 'توقيع الطبيب',
        license: 'الترخيص',
        print: 'طباعة',
        back: 'رجوع',
        none: '—',
    },
} as const;

export default function PrescriptionPrint({
    prescription,
    consultation,
    patient,
    doctor,
    clinic,
}: Props) {
    const lang = (patient?.preferred_language ?? 'ar') as 'en' | 'ar';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const s = STRINGS[lang];

    useEffect(() => {
        const prev = document.documentElement.dir;
        document.documentElement.dir = dir;
        return () => {
            document.documentElement.dir = prev;
        };
    }, [dir]);

    return (
        <>
            <Head title={`${s.title} #${prescription.id}`} />
            <style>{`
                @media print {
                    body { background: white !important; }
                    .no-print { display: none !important; }
                    .rx-page { box-shadow: none !important; border: none !important; }
                }
            `}</style>

            <div className="bg-muted min-h-screen p-6 print:bg-white">
                <div className="no-print mx-auto mb-4 flex max-w-2xl items-center justify-between">
                    <Button asChild variant="ghost">
                        <Link href={`/consultations/${consultation.id}`}>
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
                    className="rx-page mx-auto max-w-2xl rounded-md border bg-card p-8 shadow-sm"
                    dir={dir}
                >
                    <header className="flex items-start gap-3 border-b pb-4">
                        {clinic.branding?.logo_url && (
                            <img
                                src={clinic.branding.logo_url}
                                alt="logo"
                                className="h-14 w-14 rounded-md object-contain"
                            />
                        )}
                        <div className="flex-1">
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
                        <div className="text-end">
                            <h2 className="text-h3">{s.title}</h2>
                            <p className="text-sm text-muted-foreground">
                                #{prescription.id} · {prescription.printed_at ? new Date(prescription.printed_at).toLocaleString() : new Date().toLocaleString()}
                            </p>
                        </div>
                    </header>

                    <section className="my-6 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-xs uppercase text-muted-foreground">{s.patient}</p>
                            <p className="font-medium">{patient?.name ?? s.none}</p>
                            <p className="text-xs text-muted-foreground">
                                {patient?.patient_code}
                                {patient?.age !== null && ` · ${patient?.age}y`}
                                {patient?.gender_label && ` · ${patient.gender_label}`}
                            </p>
                        </div>
                        <div className="text-end">
                            <p className="text-xs uppercase text-muted-foreground">Doctor</p>
                            <p className="font-medium">Dr. {doctor.name ?? s.none}</p>
                            <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                            {doctor.license_number && (
                                <p className="text-xs text-muted-foreground">
                                    {s.license}: {doctor.license_number}
                                </p>
                            )}
                        </div>
                    </section>

                    {(consultation.diagnoses?.length ?? 0) > 0 && (
                        <section className="border-t pt-4">
                            <p className="mb-2 text-xs uppercase text-muted-foreground">
                                {s.diagnoses}
                            </p>
                            <ul className="ms-5 list-disc text-sm">
                                {consultation.diagnoses!.map((d, i) => (
                                    <li key={i}>
                                        {d.description}
                                        {d.code && (
                                            <span className="ms-2 font-mono text-xs text-muted-foreground">
                                                ({d.code})
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="border-t pt-4">
                        <p className="mb-3 text-xs uppercase text-muted-foreground">
                            {s.medications}
                        </p>
                        <table className="w-full text-sm">
                            <tbody>
                                {prescription.items.map((item, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        <td className="py-2 align-top">
                                            <p className="font-medium">{item.medication_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {[item.dosage, item.frequency, item.duration]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </p>
                                            {item.instructions && (
                                                <p className="mt-1 text-xs">{item.instructions}</p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="mt-12 flex items-end justify-between">
                        <div className="w-1/2">
                            <p className="border-t pt-2 text-xs text-muted-foreground">
                                {s.signature}
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
