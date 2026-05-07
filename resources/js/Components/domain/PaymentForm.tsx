import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { PatientCombobox } from '@/Components/domain/PatientCombobox';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';

type Prefill = {
    amount?: number;
    breakdown?: { label: string; value: number }[];
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId?: number;
    appointmentId?: number;
    prefill?: Prefill;
};

type Method = 'cash' | 'card' | 'insurance' | 'mixed';

export function PaymentForm({
    open,
    onOpenChange,
    patientId,
    appointmentId,
    prefill,
}: Props) {
    const { t } = useTranslation('tenant');
    const form = useForm({
        patient_id: patientId ? String(patientId) : '',
        appointment_id: appointmentId ? String(appointmentId) : '',
        amount: prefill?.amount ? String(prefill.amount) : '',
        method: 'cash' as Method,
        cash_amount: '',
        card_amount: '',
        insurance_amount: '',
        notes: '',
    });

    const sum =
        Number(form.data.cash_amount || 0) +
        Number(form.data.card_amount || 0) +
        Number(form.data.insurance_amount || 0);
    const total = Number(form.data.amount || 0);
    const sumMismatch = form.data.method === 'mixed' && Math.abs(sum - total) > 0.005 && total > 0;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            patient_id: Number(data.patient_id),
            appointment_id: data.appointment_id === '' ? null : Number(data.appointment_id),
            amount: Number(data.amount),
            cash_amount: data.cash_amount === '' ? 0 : Number(data.cash_amount),
            card_amount: data.card_amount === '' ? 0 : Number(data.card_amount),
            insurance_amount: data.insurance_amount === '' ? 0 : Number(data.insurance_amount),
        }));
        form.post('/payments', {
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('payments.form.createTitle')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-3">
                    {!patientId && (
                        <div className="space-y-2">
                            <Label>{t('payments.form.patient')}</Label>
                            <PatientCombobox
                                value={form.data.patient_id ? Number(form.data.patient_id) : null}
                                onChange={(id) => form.setData('patient_id', id ? String(id) : '')}
                            />
                            {form.errors.patient_id && (
                                <p className="text-xs text-destructive">{form.errors.patient_id}</p>
                            )}
                        </div>
                    )}
                    {prefill?.breakdown && prefill.breakdown.length > 0 && (
                        <div className="rounded-md border bg-muted/40 p-3 text-sm">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                {t('payments.form.breakdown')}
                            </p>
                            <ul className="mt-1 space-y-0.5 text-xs">
                                {prefill.breakdown.map((row) => (
                                    <li key={row.label} className="flex justify-between">
                                        <span>{row.label}</span>
                                        <span className="font-mono">{row.value.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="amount">{t('payments.form.amount')}</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={form.data.amount}
                                onChange={(e) => form.setData('amount', e.target.value)}
                            />
                            {form.errors.amount && (
                                <p className="text-xs text-destructive">{form.errors.amount}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>{t('payments.form.method')}</Label>
                            <Select
                                value={form.data.method}
                                onValueChange={(v) => form.setData('method', v as Method)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">{t('payments.form.cash')}</SelectItem>
                                    <SelectItem value="card">{t('payments.form.card')}</SelectItem>
                                    <SelectItem value="insurance">{t('payments.form.insurance')}</SelectItem>
                                    <SelectItem value="mixed">{t('payments.form.mixed')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {form.data.method === 'mixed' && (
                        <div className="grid gap-3 md:grid-cols-3 rounded-md border bg-muted/30 p-3">
                            <div className="space-y-2">
                                <Label>{t('payments.form.cashAmount')}</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={form.data.cash_amount}
                                    onChange={(e) => form.setData('cash_amount', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('payments.form.cardAmount')}</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={form.data.card_amount}
                                    onChange={(e) => form.setData('card_amount', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('payments.form.insuranceAmount')}</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={form.data.insurance_amount}
                                    onChange={(e) =>
                                        form.setData('insurance_amount', e.target.value)
                                    }
                                />
                            </div>
                            <p
                                className={
                                    'md:col-span-3 text-sm font-medium ' +
                                    (sumMismatch
                                        ? 'text-destructive'
                                        : total > 0
                                            ? 'text-success'
                                            : 'text-muted-foreground')
                                }
                            >
                                {t('payments.form.mixedSumRunning', {
                                    sum: sum.toFixed(2),
                                    total: total.toFixed(2),
                                })}
                            </p>
                            {sumMismatch && (
                                <Alert variant="destructive" className="md:col-span-3">
                                    <AlertDescription>
                                        {t('payments.form.mixedSumWarning')}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="notes">{t('payments.form.notes')}</Label>
                        <Textarea
                            id="notes"
                            rows={2}
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing || sumMismatch}>
                            {t('payments.form.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
