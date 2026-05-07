import { router, useForm } from '@inertiajs/react';
import { AlertTriangle, HeartPulse, Pencil, Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';

type Props = {
    patientId: number;
    allergies: string | null;
    chronic: string | null;
    /** Whether the active user can edit (clinic_admin / doctor with patients.update). */
    canEdit?: boolean;
    /** Compact variant used inside the visit-page header. */
    compact?: boolean;
};

/**
 * Two stacked alert banners — Allergies (red) and Chronic conditions
 * (amber) — pinned wherever a patient appears and the doctor needs to
 * see them at a glance. Pencil → small dialog with a textarea → PATCH
 * /patients/{id}/medical-flags. Empty state shows a + button so the
 * banner doubles as the create surface.
 */
export function MedicalFlagsBanner({ patientId, allergies, chronic, canEdit = true, compact = false }: Props) {
    const { t } = useTranslation('tenant');
    const [editing, setEditing] = useState<'allergies' | 'chronic' | null>(null);

    const layoutClass = compact
        ? 'grid gap-2 sm:grid-cols-2'
        : 'grid gap-3 sm:grid-cols-2';

    return (
        <div className={layoutClass}>
            <FlagCard
                tone="danger"
                icon={AlertTriangle}
                title={t('visit.flags.allergies')}
                value={allergies}
                emptyLabel={t('visit.flags.addAllergies')}
                editLabel={t('visit.flags.editAllergies')}
                canEdit={canEdit}
                compact={compact}
                onEdit={() => setEditing('allergies')}
            />
            <FlagCard
                tone="warning"
                icon={HeartPulse}
                title={t('visit.flags.chronic')}
                value={chronic}
                emptyLabel={t('visit.flags.addChronic')}
                editLabel={t('visit.flags.editChronic')}
                canEdit={canEdit}
                compact={compact}
                onEdit={() => setEditing('chronic')}
            />

            {editing && (
                <EditDialog
                    field={editing}
                    patientId={patientId}
                    initial={editing === 'allergies' ? allergies : chronic}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}

type Tone = 'danger' | 'warning';

function FlagCard({
    tone,
    icon: Icon,
    title,
    value,
    emptyLabel,
    editLabel,
    canEdit,
    compact,
    onEdit,
}: {
    tone: Tone;
    icon: typeof AlertTriangle;
    title: string;
    value: string | null;
    emptyLabel: string;
    editLabel: string;
    canEdit: boolean;
    compact: boolean;
    onEdit: () => void;
}) {
    const colors =
        tone === 'danger'
            ? 'border-destructive/30 bg-destructive/5 text-destructive'
            : 'border-warning/30 bg-warning/10 text-warning';

    const padding = compact ? 'p-3' : 'p-4';
    const titleSize = compact ? 'text-xs' : 'text-sm';
    const bodySize = compact ? 'text-sm' : 'text-base';

    return (
        <div className={`rounded-lg border ${colors} ${padding}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className={`${titleSize} font-semibold uppercase tracking-wide`}>
                            {title}
                        </p>
                        {value ? (
                            <p className={`mt-1 ${bodySize} leading-snug text-foreground`}>
                                {value}
                            </p>
                        ) : (
                            <p className={`mt-1 ${bodySize} italic text-muted-foreground`}>
                                {emptyLabel}
                            </p>
                        )}
                    </div>
                </div>
                {canEdit && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={onEdit}
                        aria-label={editLabel}
                    >
                        {value ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" />}
                    </Button>
                )}
            </div>
        </div>
    );
}

function EditDialog({
    field,
    patientId,
    initial,
    onClose,
}: {
    field: 'allergies' | 'chronic';
    patientId: number;
    initial: string | null;
    onClose: () => void;
}) {
    const { t } = useTranslation('tenant');
    const { t: tc } = useTranslation('common');
    const [busy, setBusy] = useState(false);
    const form = useForm({
        allergies_summary: field === 'allergies' ? (initial ?? '') : undefined,
        chronic_summary: field === 'chronic' ? (initial ?? '') : undefined,
    });

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setBusy(true);
        const payload =
            field === 'allergies'
                ? { allergies_summary: form.data.allergies_summary || null }
                : { chronic_summary: form.data.chronic_summary || null };
        router.patch(`/patients/${patientId}/medical-flags`, payload, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
            onSuccess: () => onClose(),
        });
    };

    return (
        <Dialog open onOpenChange={(open) => !busy && !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>
                            {field === 'allergies'
                                ? t('visit.flags.editAllergies')
                                : t('visit.flags.editChronic')}
                        </DialogTitle>
                        <DialogDescription>
                            {field === 'allergies'
                                ? t('visit.flags.allergiesHint')
                                : t('visit.flags.chronicHint')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="my-4 space-y-2">
                        <Label htmlFor="value">
                            {field === 'allergies'
                                ? t('visit.flags.allergies')
                                : t('visit.flags.chronic')}
                        </Label>
                        <Textarea
                            id="value"
                            rows={5}
                            value={
                                field === 'allergies'
                                    ? (form.data.allergies_summary ?? '')
                                    : (form.data.chronic_summary ?? '')
                            }
                            onChange={(e) =>
                                form.setData(
                                    field === 'allergies' ? 'allergies_summary' : 'chronic_summary',
                                    e.target.value,
                                )
                            }
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
                            {tc('actions.cancel')}
                        </Button>
                        <Button type="submit" disabled={busy}>
                            {tc('actions.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
