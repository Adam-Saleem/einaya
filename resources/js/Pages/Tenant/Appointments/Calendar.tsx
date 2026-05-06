import dayGridPlugin from '@fullcalendar/daygrid';
import type { EventDropArg } from '@fullcalendar/core';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
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
import { Switch } from '@/Components/ui/switch';
import { Textarea } from '@/Components/ui/textarea';
import { useDirection } from '@/Hooks/useDirection';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import AppLayout from '@/Layouts/AppLayout';

type Doctor = { id: number; name: string | null; consultation_duration_minutes: number };
type Props = { doctors: Doctor[] };

const STATUS_COLORS: Record<string, string> = {
    pending: 'rgb(148, 163, 184)',
    confirmed: 'rgb(0, 102, 255)',
    arrived: 'rgb(245, 158, 11)',
    in_progress: 'rgb(139, 92, 246)',
    completed: 'rgb(34, 197, 94)',
    cancelled: 'rgb(239, 68, 68)',
    no_show: 'rgb(127, 29, 29)',
};

export default function CalendarPage({ doctors }: Props) {
    const { t } = useTranslation('tenant');
    const direction = useDirection();
    useFlashToasts();

    const calendarRef = useRef<FullCalendar | null>(null);
    const [bookOpen, setBookOpen] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);

    const form = useForm({
        patient_id: '',
        doctor_id: doctors[0]?.id ? String(doctors[0].id) : '',
        scheduled_for: '',
        duration_minutes: String(doctors[0]?.consultation_duration_minutes ?? 30),
        reason: '',
        notes: '',
        force: false,
    });

    const fetchEvents = async (info: { startStr: string; endStr: string }) => {
        const { data } = await axios.get('/appointments/data', {
            params: { start: info.startStr, end: info.endStr },
        });
        return data.events.map((event: { id: number; title: string; start: string; end: string; status: string }) => ({
            ...event,
            backgroundColor: STATUS_COLORS[event.status] ?? STATUS_COLORS.pending,
            borderColor: STATUS_COLORS[event.status] ?? STATUS_COLORS.pending,
        }));
    };

    const onDateClick = (arg: DateClickArg) => {
        form.setData('scheduled_for', arg.dateStr.slice(0, 16));
        setBookOpen(true);
    };

    const onEventDrop = (arg: EventDropArg) => {
        const newStart = arg.event.start;
        if (!newStart) return;
        router.patch(
            `/appointments/${arg.event.id}`,
            {
                scheduled_for: newStart.toISOString(),
                force: true,
            },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Rescheduled'),
                onError: () => {
                    arg.revert();
                    toast.error('Could not reschedule');
                },
            },
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setWarning(null);
        form.transform((data) => ({
            ...data,
            patient_id: data.patient_id === '' ? null : Number(data.patient_id),
            doctor_id: Number(data.doctor_id),
            duration_minutes: Number(data.duration_minutes),
        }));
        form.post('/appointments', {
            preserveScroll: true,
            onSuccess: () => {
                setBookOpen(false);
                form.reset('patient_id', 'reason', 'notes', 'force');
                calendarRef.current?.getApi().refetchEvents();
            },
            onError: (errors) => {
                if (errors.scheduled_for?.startsWith('warnings:')) {
                    setWarning(errors.scheduled_for.replace('warnings:', ''));
                }
            },
        });
    };

    return (
        <AppLayout
            title={t('appointments.title')}
            pageTitle={t('appointments.title')}
            description={t('appointments.subtitle')}
            actions={
                <Button onClick={() => setBookOpen(true)}>
                    <Plus className="me-2 h-4 w-4" />
                    {t('appointments.book')}
                </Button>
            }
        >
            <Card>
                <CardContent className="p-4">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        direction={direction === 'rtl' ? 'rtl' : 'ltr'}
                        headerToolbar={{
                            start: 'prev,next today',
                            center: 'title',
                            end: 'dayGridMonth,timeGridWeek,timeGridDay',
                        }}
                        height="auto"
                        slotMinTime="08:00"
                        slotMaxTime="20:00"
                        nowIndicator
                        editable
                        eventStartEditable
                        eventDurationEditable={false}
                        events={fetchEvents}
                        dateClick={onDateClick}
                        eventDrop={onEventDrop}
                    />
                </CardContent>
            </Card>

            <Dialog open={bookOpen} onOpenChange={setBookOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('appointments.book')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-3">
                        <div className="space-y-2">
                            <Label>{t('appointments.form.patient')}</Label>
                            <PatientCombobox
                                value={form.data.patient_id ? Number(form.data.patient_id) : null}
                                onChange={(id) => form.setData('patient_id', id ? String(id) : '')}
                            />
                            {form.errors.patient_id && (
                                <p className="text-xs text-destructive">{form.errors.patient_id}</p>
                            )}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>{t('appointments.form.doctor')}</Label>
                                <Select
                                    value={form.data.doctor_id}
                                    onValueChange={(v) => form.setData('doctor_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctors.map((d) => (
                                            <SelectItem key={d.id} value={String(d.id)}>
                                                {d.name ?? `Doctor #${d.id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">{t('appointments.form.duration')}</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={form.data.duration_minutes}
                                    onChange={(e) =>
                                        form.setData('duration_minutes', e.target.value)
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="scheduled_for">{t('appointments.form.scheduledFor')}</Label>
                            <Input
                                id="scheduled_for"
                                type="datetime-local"
                                value={form.data.scheduled_for}
                                onChange={(e) => form.setData('scheduled_for', e.target.value)}
                            />
                            {form.errors.scheduled_for && (
                                <p className="text-xs text-destructive">{form.errors.scheduled_for}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">{t('appointments.form.reason')}</Label>
                            <Input
                                id="reason"
                                value={form.data.reason}
                                onChange={(e) => form.setData('reason', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">{t('appointments.form.notes')}</Label>
                            <Textarea
                                id="notes"
                                rows={2}
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                            />
                        </div>

                        {warning && (
                            <div className="space-y-2 rounded-md border border-warning/40 bg-warning/10 p-3">
                                <p className="text-sm">
                                    {warning.split('|').map((w) => (
                                        <span key={w} className="block">
                                            ⚠ {t(`appointments.warnings.${w.split(':')[0]}` as never, { defaultValue: w })}
                                        </span>
                                    ))}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="force"
                                        checked={form.data.force}
                                        onCheckedChange={(v) => form.setData('force', v)}
                                    />
                                    <Label htmlFor="force" className="text-sm">
                                        {t('appointments.form.force')}
                                    </Label>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setBookOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {t('appointments.book')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
