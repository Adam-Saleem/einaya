import { File, PenLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import type { FormSnapshot } from '@/types/tenant';

type Props = {
    snapshot: FormSnapshot;
    answers?: Record<string, unknown>;
    readOnly?: boolean;
    onChange?: (key: string, value: unknown) => void;
};

/**
 * Renders a frozen form snapshot. Shared by:
 *   - the form-builder preview dialog (no answers, all fields disabled),
 *   - the submission detail view (answers filled in, all fields disabled),
 *   - the consultation flow (Phase 10 — pass `onChange` and `readOnly={false}`
 *     to collect answers as the doctor types).
 *
 * Snapshot shape is the canonical one `FormSnapshotService::snapshot()`
 * produces server-side.
 */
export function FormRenderer({ snapshot, answers = {}, readOnly = true, onChange }: Props) {
    const { t } = useTranslation('common');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-h2">{snapshot.title}</h2>
                {snapshot.description && (
                    <p className="text-base text-muted-foreground">{snapshot.description}</p>
                )}
            </div>

            {snapshot.sections.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('empty.title')}</p>
            )}

            {snapshot.sections.map((section) => (
                <Card key={section.id}>
                    <CardHeader>
                        <CardTitle className="text-h3">{section.title}</CardTitle>
                        {section.description && (
                            <p className="text-sm text-muted-foreground">
                                {section.description}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {section.questions.map((question) => (
                            <FieldFor
                                key={question.id}
                                question={question}
                                value={answers[question.key]}
                                readOnly={readOnly}
                                onChange={onChange}
                            />
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

type FieldProps = {
    question: FormSnapshot['sections'][number]['questions'][number];
    value: unknown;
    readOnly: boolean;
    onChange?: (key: string, value: unknown) => void;
};

function FieldFor({ question, value, readOnly, onChange }: FieldProps) {
    const id = `q-${question.id}`;
    const set = (v: unknown) => onChange?.(question.key, v);
    const labelEl = (
        <Label htmlFor={id}>
            {question.label}
            {question.required && <span className="text-destructive ms-1">*</span>}
        </Label>
    );
    const help = question.help_text && (
        <p className="text-xs text-muted-foreground">{question.help_text}</p>
    );

    switch (question.type) {
        case 'text':
            return (
                <div className="space-y-1.5">
                    {labelEl}
                    <Input
                        id={id}
                        value={(value as string) ?? ''}
                        onChange={(e) => set(e.target.value)}
                        disabled={readOnly}
                    />
                    {help}
                </div>
            );
        case 'textarea':
            return (
                <div className="space-y-1.5">
                    {labelEl}
                    <Textarea
                        id={id}
                        rows={4}
                        value={(value as string) ?? ''}
                        onChange={(e) => set(e.target.value)}
                        disabled={readOnly}
                    />
                    {help}
                </div>
            );
        case 'number':
            return (
                <div className="space-y-1.5">
                    {labelEl}
                    <Input
                        id={id}
                        type="number"
                        value={value !== undefined && value !== null ? String(value) : ''}
                        onChange={(e) => set(e.target.value === '' ? null : Number(e.target.value))}
                        disabled={readOnly}
                    />
                    {help}
                </div>
            );
        case 'date':
            return (
                <div className="space-y-1.5">
                    {labelEl}
                    <Input
                        id={id}
                        type="date"
                        value={(value as string) ?? ''}
                        onChange={(e) => set(e.target.value)}
                        disabled={readOnly}
                    />
                    {help}
                </div>
            );
        case 'radio':
            return (
                <div className="space-y-1.5">
                    {labelEl}
                    <RadioGroup
                        value={(value as string) ?? ''}
                        onValueChange={(v) => set(v)}
                        disabled={readOnly}
                        className="flex flex-col gap-2"
                    >
                        {question.options.map((opt) => (
                            <div key={opt.value} className="flex items-center gap-2">
                                <RadioGroupItem value={opt.value} id={`${id}-${opt.value}`} />
                                <Label htmlFor={`${id}-${opt.value}`} className="font-normal">
                                    {opt.label}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                    {help}
                </div>
            );
        case 'checkbox': {
            const arr = Array.isArray(value) ? (value as string[]) : [];
            return (
                <div className="space-y-1.5">
                    {labelEl}
                    <div className="flex flex-col gap-2">
                        {question.options.map((opt) => (
                            <div key={opt.value} className="flex items-center gap-2">
                                <Checkbox
                                    id={`${id}-${opt.value}`}
                                    checked={arr.includes(opt.value)}
                                    disabled={readOnly}
                                    onCheckedChange={(checked) => {
                                        const next = checked
                                            ? [...arr, opt.value]
                                            : arr.filter((v) => v !== opt.value);
                                        set(next);
                                    }}
                                />
                                <Label htmlFor={`${id}-${opt.value}`} className="font-normal">
                                    {opt.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                    {help}
                </div>
            );
        }
        case 'select':
            return (
                <div className="space-y-1.5">
                    {labelEl}
                    <Select
                        value={(value as string) ?? ''}
                        onValueChange={(v) => set(v)}
                        disabled={readOnly}
                    >
                        <SelectTrigger id={id}>
                            <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                            {question.options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {help}
                </div>
            );
        case 'file':
            return (
                <div className="space-y-1.5">
                    {labelEl}
                    <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                        <File className="h-4 w-4" />
                        {value ? (
                            <span className="font-mono text-xs">{String(value)}</span>
                        ) : (
                            <span>—</span>
                        )}
                    </div>
                    {help}
                </div>
            );
        case 'signature':
            return (
                <div className="space-y-1.5">
                    {labelEl}
                    <div className="flex h-24 items-center justify-center rounded-md border border-dashed bg-muted/40 text-xs text-muted-foreground">
                        <PenLine className="me-2 h-4 w-4" />
                        Signature pad — v2
                    </div>
                    {help}
                </div>
            );
    }
}
