import { router, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
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
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import type { DoctorBreakRow, DoctorTimeOffRow, WorkingHourRow } from '@/types/tenant';

type Props = {
    hours: WorkingHourRow[];
    breaks: DoctorBreakRow[];
    timeOff: DoctorTimeOffRow[];
};

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export default function WorkingHoursPage({ hours, breaks, timeOff }: Props) {
    const { t } = useTranslation('tenant');
    useFlashToasts();

    const hoursForm = useForm({ hours });
    const breakForm = useForm({
        day_of_week: '0',
        start_time: '13:00',
        end_time: '14:00',
        label: '',
    });
    const timeOffForm = useForm({
        starts_at: '',
        ends_at: '',
        reason: '',
    });

    const submitHours = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        hoursForm.post('/doctor/hours', { preserveScroll: true });
    };

    const submitBreak = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        breakForm.transform((data) => ({ ...data, day_of_week: Number(data.day_of_week) }));
        breakForm.post('/doctor/breaks', {
            preserveScroll: true,
            onSuccess: () => breakForm.reset('label'),
        });
    };

    const submitTimeOff = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        timeOffForm.post('/doctor/time-off', {
            preserveScroll: true,
            onSuccess: () => timeOffForm.reset(),
        });
    };

    const updateHour = (day: number, patch: Partial<WorkingHourRow>) => {
        hoursForm.setData(
            'hours',
            hoursForm.data.hours.map((h) => (h.day_of_week === day ? { ...h, ...patch } : h)),
        );
    };

    return (
        <AppLayout
            title={t('doctor.hours.title')}
            pageTitle={t('doctor.hours.title')}
            description={t('doctor.hours.subtitle')}
        >
            <WeekVisualization
                hours={hoursForm.data.hours}
                breaks={breaks}
                dayLabel={(d) => t(`doctor.days.${d}`)}
            />

            <Card>
                <CardHeader>
                    <CardTitle>{t('doctor.hours.weekly')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submitHours} className="space-y-3">
                        {DAYS.map((day) => {
                            const row = hoursForm.data.hours.find((h) => h.day_of_week === day);
                            if (!row) return null;
                            return (
                                <div
                                    key={day}
                                    className="grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_auto_auto]"
                                >
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            id={`day-${day}`}
                                            checked={row.is_active}
                                            onCheckedChange={(v) => updateHour(day, { is_active: v })}
                                        />
                                        <Label htmlFor={`day-${day}`} className="font-medium">
                                            {t(`doctor.days.${day}`)}
                                        </Label>
                                    </div>
                                    <Input
                                        type="time"
                                        className="w-32"
                                        value={row.start_time ?? ''}
                                        disabled={!row.is_active}
                                        onChange={(e) =>
                                            updateHour(day, {
                                                start_time: e.target.value || null,
                                            })
                                        }
                                    />
                                    <span className="text-muted-foreground text-sm">→</span>
                                    <Input
                                        type="time"
                                        className="w-32"
                                        value={row.end_time ?? ''}
                                        disabled={!row.is_active}
                                        onChange={(e) =>
                                            updateHour(day, { end_time: e.target.value || null })
                                        }
                                    />
                                </div>
                            );
                        })}
                        <div className="flex justify-end pt-3">
                            <Button type="submit" disabled={hoursForm.processing}>
                                {t('doctor.hours.save')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('doctor.hours.breaks')}</CardTitle>
                    <p className="text-sm text-muted-foreground">{t('doctor.hours.breaksHint')}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={submitBreak} className="grid gap-3 md:grid-cols-[1fr_auto_auto_2fr_auto]">
                        <Select
                            value={breakForm.data.day_of_week}
                            onValueChange={(v) => breakForm.setData('day_of_week', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DAYS.map((d) => (
                                    <SelectItem key={d} value={String(d)}>
                                        {t(`doctor.days.${d}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="time"
                            value={breakForm.data.start_time}
                            onChange={(e) => breakForm.setData('start_time', e.target.value)}
                            className="w-32"
                        />
                        <Input
                            type="time"
                            value={breakForm.data.end_time}
                            onChange={(e) => breakForm.setData('end_time', e.target.value)}
                            className="w-32"
                        />
                        <Input
                            placeholder={t('doctor.hours.breakLabel')}
                            value={breakForm.data.label}
                            onChange={(e) => breakForm.setData('label', e.target.value)}
                        />
                        <Button type="submit" disabled={breakForm.processing}>
                            <Plus className="me-2 h-4 w-4" />
                            {t('doctor.hours.addBreak')}
                        </Button>
                    </form>

                    <ul className="divide-y">
                        {breaks.map((b) => (
                            <li key={b.id} className="flex items-center justify-between py-2">
                                <div>
                                    <span className="font-medium">{t(`doctor.days.${b.day_of_week}`)}</span>
                                    <span className="ms-3 font-mono text-sm text-muted-foreground">
                                        {b.start_time}–{b.end_time}
                                    </span>
                                    {b.label && (
                                        <span className="ms-3 text-sm text-muted-foreground">
                                            {b.label}
                                        </span>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        router.delete(`/doctor/breaks/${b.id}`, {
                                            preserveScroll: true,
                                        })
                                    }
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </li>
                        ))}
                        {breaks.length === 0 && (
                            <li className="py-3 text-sm text-muted-foreground">—</li>
                        )}
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('doctor.hours.timeOff')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={submitTimeOff} className="grid gap-3 md:grid-cols-[auto_auto_1fr_auto]">
                        <Input
                            type="datetime-local"
                            value={timeOffForm.data.starts_at}
                            onChange={(e) => timeOffForm.setData('starts_at', e.target.value)}
                        />
                        <Input
                            type="datetime-local"
                            value={timeOffForm.data.ends_at}
                            onChange={(e) => timeOffForm.setData('ends_at', e.target.value)}
                        />
                        <Input
                            placeholder={t('doctor.hours.reason')}
                            value={timeOffForm.data.reason}
                            onChange={(e) => timeOffForm.setData('reason', e.target.value)}
                        />
                        <Button type="submit" disabled={timeOffForm.processing}>
                            <Plus className="me-2 h-4 w-4" />
                            {t('doctor.hours.addTimeOff')}
                        </Button>
                    </form>

                    <ul className="divide-y">
                        {timeOff.map((t) => (
                            <li key={t.id} className="flex items-center justify-between py-2">
                                <div>
                                    <span className="font-mono text-sm">
                                        {t.starts_at?.slice(0, 16).replace('T', ' ')} →{' '}
                                        {t.ends_at?.slice(0, 16).replace('T', ' ')}
                                    </span>
                                    {t.reason && (
                                        <span className="ms-3 text-sm text-muted-foreground">
                                            {t.reason}
                                        </span>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        router.delete(`/doctor/time-off/${t.id}`, {
                                            preserveScroll: true,
                                        })
                                    }
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </li>
                        ))}
                        {timeOff.length === 0 && (
                            <li className="py-3 text-sm text-muted-foreground">
                                {t('doctor.hours.noTimeOff')}
                            </li>
                        )}
                    </ul>
                </CardContent>
            </Card>
        </AppLayout>
    );
}

/**
 * Read-only mini week-grid: rows = days, columns = hours from 06:00 to
 * 22:00 in 30-min steps. Working hours render as a primary-colored band,
 * breaks as a muted overlay. Time-off is conveyed in the textual list
 * below — too sparse for the calendar grid to add value here.
 */
function WeekVisualization({
    hours,
    breaks,
    dayLabel,
}: {
    hours: WorkingHourRow[];
    breaks: DoctorBreakRow[];
    dayLabel: (d: number) => string;
}) {
    const HOUR_START = 6;
    const HOUR_END = 22;
    const STEPS = (HOUR_END - HOUR_START) * 2; // 30-min slots

    const toMinutes = (hhmm: string | null) => {
        if (!hhmm) return null;
        const [h, m] = hhmm.split(':').map(Number);
        return h * 60 + m;
    };

    const cellPercent = (mins: number) => {
        const offset = mins - HOUR_START * 60;
        return (offset / ((HOUR_END - HOUR_START) * 60)) * 100;
    };

    return (
        <div className="rounded-lg border bg-card p-4">
            <div className="grid grid-cols-[120px_1fr] items-center text-xs text-muted-foreground">
                <div></div>
                <div className="grid grid-flow-col auto-cols-fr">
                    {Array.from({ length: HOUR_END - HOUR_START + 1 }).map((_, i) => (
                        <div key={i} className="text-center">
                            {(HOUR_START + i).toString().padStart(2, '0')}
                        </div>
                    ))}
                </div>
            </div>

            {hours.map((row) => {
                const start = toMinutes(row.start_time);
                const end = toMinutes(row.end_time);
                const dayBreaks = breaks.filter((b) => b.day_of_week === row.day_of_week);

                return (
                    <div
                        key={row.day_of_week}
                        className="grid grid-cols-[120px_1fr] items-center border-t py-1"
                    >
                        <div className="text-sm font-medium">{dayLabel(row.day_of_week)}</div>
                        <div className="relative h-6 rounded-md bg-muted/30">
                            {row.is_active && start !== null && end !== null && (
                                <div
                                    className="absolute inset-y-0 rounded-sm bg-primary/70"
                                    style={{
                                        insetInlineStart: `${cellPercent(start)}%`,
                                        width: `${cellPercent(end) - cellPercent(start)}%`,
                                    }}
                                    title={`${row.start_time}–${row.end_time}`}
                                />
                            )}
                            {dayBreaks.map((b, idx) => {
                                const bStart = toMinutes(b.start_time);
                                const bEnd = toMinutes(b.end_time);
                                if (bStart === null || bEnd === null) return null;
                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            'absolute inset-y-0 rounded-sm bg-warning/40 border border-warning/60',
                                        )}
                                        style={{
                                            insetInlineStart: `${cellPercent(bStart)}%`,
                                            width: `${cellPercent(bEnd) - cellPercent(bStart)}%`,
                                        }}
                                        title={`${b.label ?? 'Break'}: ${b.start_time}–${b.end_time}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

