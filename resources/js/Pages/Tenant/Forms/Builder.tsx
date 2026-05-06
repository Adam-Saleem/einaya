import {
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link, router, useForm } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Copy,
    Eye,
    GripVertical,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/Components/domain/ConfirmDialog';
import { FormRenderer } from '@/Components/domain/forms/FormRenderer';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
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
import { Textarea } from '@/Components/ui/textarea';
import { useDirection } from '@/Hooks/useDirection';
import { useFlashToasts } from '@/Hooks/useFlashToasts';
import { usePending } from '@/Hooks/usePending';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import type {
    FormQuestion,
    FormQuestionType,
    FormSection,
    FormSnapshot,
    MedicalForm,
} from '@/types/tenant';

type Props = { form: MedicalForm };

const QUESTION_TYPES: FormQuestionType[] = [
    'text',
    'textarea',
    'number',
    'radio',
    'checkbox',
    'select',
    'date',
    'file',
    'signature',
];

function generateKey(label: string): string {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 64) || 'question';
}

export default function Builder({ form: initialForm }: Props) {
    const { t } = useTranslation('tenant');
    const direction = useDirection();
    useFlashToasts();

    const [formData, setFormData] = useState<MedicalForm>(initialForm);
    const [activeSectionId, setActiveSectionId] = useState<number | null>(
        initialForm.sections?.[0]?.id ?? null,
    );
    const [autosaveLabel, setAutosaveLabel] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [deletingSection, setDeletingSection] = useState<FormSection | null>(null);
    const [deletingQuestion, setDeletingQuestion] = useState<FormQuestion | null>(null);
    const [sectionDeleteBusy, runSectionDelete] = usePending();
    const [questionDeleteBusy, runQuestionDelete] = usePending();
    const [questionDialog, setQuestionDialog] = useState<
        | { mode: 'create'; sectionId: number }
        | { mode: 'edit'; sectionId: number; question: FormQuestion }
        | null
    >(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const sections = formData.sections ?? [];
    const activeSection = sections.find((s) => s.id === activeSectionId) ?? null;

    const reload = () => {
        router.reload({
            only: ['form'],
            onSuccess: ({ props }) => {
                const next = (props as unknown as Props).form;
                setFormData(next);
                if (activeSectionId === null && next.sections?.[0]) {
                    setActiveSectionId(next.sections[0].id);
                }
            },
        });
    };

    // Autosave for form metadata (title, description, type, is_active).
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const persistMetadata = (next: Partial<MedicalForm>) => {
        const merged = { ...formData, ...next };
        setFormData(merged);
        setAutosaveLabel('saving');
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            router.patch(
                `/forms/${formData.id}`,
                {
                    title: merged.title,
                    description: merged.description ?? '',
                    type: merged.type,
                    is_active: merged.is_active,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setAutosaveLabel('saved');
                        setTimeout(() => setAutosaveLabel('idle'), 1500);
                    },
                    onError: () => setAutosaveLabel('idle'),
                    only: [],
                },
            );
        }, 1000);
    };

    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }, []);

    const handleSectionDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = sections.findIndex((s) => s.id === active.id);
        const newIndex = sections.findIndex((s) => s.id === over.id);
        const reordered = arrayMove(sections, oldIndex, newIndex);
        setFormData({ ...formData, sections: reordered });

        router.post(
            `/forms/${formData.id}/sections/reorder`,
            { ids: reordered.map((s) => s.id) },
            { preserveScroll: true, only: [] },
        );
    };

    const handleQuestionDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !activeSection) return;

        const questions = activeSection.questions ?? [];
        const oldIndex = questions.findIndex((q) => q.id === active.id);
        const newIndex = questions.findIndex((q) => q.id === over.id);
        const reordered = arrayMove(questions, oldIndex, newIndex);

        setFormData({
            ...formData,
            sections: sections.map((s) =>
                s.id === activeSection.id ? { ...s, questions: reordered } : s,
            ),
        });

        router.post(
            `/sections/${activeSection.id}/questions/reorder`,
            { ids: reordered.map((q) => q.id) },
            { preserveScroll: true, only: [] },
        );
    };

    const previewSnapshot: FormSnapshot = useMemo(
        () => ({
            form_id: formData.id,
            title: formData.title,
            description: formData.description,
            type: formData.type,
            version_at: new Date().toISOString(),
            sections: sections.map((section, idx) => ({
                id: section.id,
                title: section.title,
                description: section.description,
                order: section.order ?? idx + 1,
                questions: (section.questions ?? []).map((q) => ({
                    id: q.id,
                    key: q.key,
                    label: q.label,
                    help_text: q.help_text,
                    type: q.type,
                    required: q.is_required,
                    order: q.order,
                    validation_rules: q.validation_rules,
                    options: (q.options ?? []).map((o) => ({
                        value: o.value,
                        label: o.label,
                    })),
                })),
            })),
        }),
        [formData, sections],
    );

    return (
        <AppLayout
            title={formData.title}
            breadcrumbs={[
                { label: t('forms.title'), href: '/forms' },
                { label: formData.title },
            ]}
        >
            <Card>
                <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] items-start">
                    <div className="space-y-3">
                        <Input
                            value={formData.title}
                            onChange={(e) => persistMetadata({ title: e.target.value })}
                            className="text-h2 h-auto border-0 px-0 shadow-none focus-visible:ring-0"
                        />
                        <Textarea
                            value={formData.description ?? ''}
                            onChange={(e) => persistMetadata({ description: e.target.value })}
                            placeholder="Add a description for this form (optional)"
                            rows={2}
                            className="border-0 px-0 shadow-none focus-visible:ring-0"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-self-end">
                        <span className="text-xs text-muted-foreground">
                            {autosaveLabel === 'saving' && t('builder.saving')}
                            {autosaveLabel === 'saved' && t('builder.saved')}
                        </span>
                        <div className="flex items-center gap-2 rounded-md border bg-card p-2">
                            <Switch
                                id="publish"
                                checked={formData.is_active}
                                onCheckedChange={(v) => persistMetadata({ is_active: v })}
                            />
                            <Label htmlFor="publish" className="text-sm">
                                {formData.is_active ? t('builder.publish') : t('builder.publish')}
                            </Label>
                        </div>
                        <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                            <Eye className="me-2 h-4 w-4" />
                            {t('builder.preview')}
                        </Button>
                        <Button asChild variant="ghost">
                            <Link href="/forms">
                                {direction === 'rtl' ? (
                                    <ChevronRight className="me-2 h-4 w-4" />
                                ) : (
                                    <ChevronLeft className="me-2 h-4 w-4" />
                                )}
                                {t('builder.back')}
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
                {formData.is_active ? t('builder.publishedHint') : t('builder.draftHint')}
            </p>

            <div className="grid gap-4 md:grid-cols-[320px_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4">{t('builder.sectionsTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleSectionDragEnd}
                        >
                            <SortableContext
                                items={sections.map((s) => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {sections.map((section) => (
                                    <SectionItem
                                        key={section.id}
                                        section={section}
                                        active={section.id === activeSectionId}
                                        onSelect={() => setActiveSectionId(section.id)}
                                        onDelete={() => setDeletingSection(section)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {sections.length === 0 && (
                            <p className="text-sm text-muted-foreground">{t('builder.noSections')}</p>
                        )}

                        <AddSectionInline formId={formData.id} onSaved={reload} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4">{t('builder.questionsTitle')}</CardTitle>
                        {!activeSection && (
                            <p className="text-sm text-muted-foreground">
                                {t('builder.selectSection')}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {activeSection && (
                            <SectionEditor
                                section={activeSection}
                                formId={formData.id}
                                onSaved={reload}
                            />
                        )}

                        {activeSection && (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleQuestionDragEnd}
                            >
                                <SortableContext
                                    items={(activeSection.questions ?? []).map((q) => q.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {(activeSection.questions ?? []).map((question) => (
                                        <QuestionItem
                                            key={question.id}
                                            question={question}
                                            onEdit={() =>
                                                setQuestionDialog({
                                                    mode: 'edit',
                                                    sectionId: activeSection.id,
                                                    question,
                                                })
                                            }
                                            onDelete={() => setDeletingQuestion(question)}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        )}

                        {activeSection && (activeSection.questions ?? []).length === 0 && (
                            <p className="text-sm text-muted-foreground">{t('builder.noQuestions')}</p>
                        )}

                        {activeSection && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setQuestionDialog({
                                        mode: 'create',
                                        sectionId: activeSection.id,
                                    })
                                }
                            >
                                <Plus className="me-2 h-4 w-4" />
                                {t('builder.addQuestion')}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('builder.previewTitle')}</DialogTitle>
                    </DialogHeader>
                    <FormRenderer snapshot={previewSnapshot} readOnly />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deletingSection !== null}
                onOpenChange={(open) => !open && !sectionDeleteBusy && setDeletingSection(null)}
                title={t('builder.confirmDeleteSection')}
                description={t('builder.confirmDeleteSectionBody')}
                busy={sectionDeleteBusy}
                onConfirm={() => {
                    if (!deletingSection) return;
                    runSectionDelete(
                        (opts) =>
                            router.delete(
                                `/forms/${formData.id}/sections/${deletingSection.id}`,
                                opts,
                            ),
                        {
                            preserveScroll: true,
                            onFinish: () => {
                                setDeletingSection(null);
                                reload();
                            },
                        },
                    );
                }}
            />

            <ConfirmDialog
                open={deletingQuestion !== null}
                onOpenChange={(open) => !open && !questionDeleteBusy && setDeletingQuestion(null)}
                title={t('builder.confirmDeleteQuestion')}
                description={t('builder.confirmDeleteQuestionBody')}
                busy={questionDeleteBusy}
                onConfirm={() => {
                    if (!deletingQuestion) return;
                    runQuestionDelete(
                        (opts) =>
                            router.delete(
                                `/sections/${deletingQuestion.form_section_id}/questions/${deletingQuestion.id}`,
                                opts,
                            ),
                        {
                            preserveScroll: true,
                            onFinish: () => {
                                setDeletingQuestion(null);
                                reload();
                            },
                        },
                    );
                }}
            />

            {questionDialog && (
                <QuestionDialog
                    state={questionDialog}
                    onClose={() => setQuestionDialog(null)}
                    onSaved={() => {
                        setQuestionDialog(null);
                        reload();
                    }}
                />
            )}
        </AppLayout>
    );
}

function SectionItem({
    section,
    active,
    onSelect,
    onDelete,
}: {
    section: FormSection;
    active: boolean;
    onSelect: () => void;
    onDelete: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: section.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center gap-2 rounded-md border bg-card p-2',
                active ? 'border-primary ring-1 ring-primary' : 'border-border',
            )}
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab text-muted-foreground"
                type="button"
                aria-label="Drag"
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={onSelect}
                className="flex-1 truncate text-start text-sm font-medium"
            >
                {section.title || '(untitled)'}
            </button>
            <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    );
}

function AddSectionInline({ formId, onSaved }: { formId: number; onSaved: () => void }) {
    const { t } = useTranslation('tenant');
    const [open, setOpen] = useState(false);
    const form = useForm({ title: '', description: '' });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(`/forms/${formId}/sections`, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
                onSaved();
            },
        });
    };

    if (!open) {
        return (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <Plus className="me-2 h-4 w-4" />
                {t('builder.addSection')}
            </Button>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-2 rounded-md border bg-muted/30 p-3">
            <Input
                placeholder={t('builder.sectionTitle')}
                value={form.data.title}
                onChange={(e) => form.setData('title', e.target.value)}
            />
            <Textarea
                placeholder={t('builder.sectionDescription')}
                rows={2}
                value={form.data.description}
                onChange={(e) => form.setData('description', e.target.value)}
            />
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                </Button>
                <Button type="submit" size="sm" disabled={form.processing}>
                    Add
                </Button>
            </div>
        </form>
    );
}

function SectionEditor({
    section,
    formId,
    onSaved,
}: {
    section: FormSection;
    formId: number;
    onSaved: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const form = useForm({
        title: section.title,
        description: section.description ?? '',
    });

    useEffect(() => {
        const next = { title: section.title, description: section.description ?? '' };
        form.setDefaults(next);
        form.setData(next);
        setEditing(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [section.id]);

    if (!editing) {
        return (
            <div className="flex items-baseline justify-between gap-2 border-b pb-3">
                <div>
                    <p className="text-h4 text-foreground">{section.title}</p>
                    {section.description && (
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                    )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
                    <Pencil className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch(`/forms/${formId}/sections/${section.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditing(false);
                onSaved();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-2 border-b pb-3">
            <Input
                value={form.data.title}
                onChange={(e) => form.setData('title', e.target.value)}
            />
            <Textarea
                value={form.data.description}
                onChange={(e) => form.setData('description', e.target.value)}
                rows={2}
            />
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    Cancel
                </Button>
                <Button type="submit" size="sm" disabled={form.processing}>
                    Save
                </Button>
            </div>
        </form>
    );
}

function QuestionItem({
    question,
    onEdit,
    onDelete,
}: {
    question: FormQuestion;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: question.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-start gap-2 rounded-md border bg-card p-3"
        >
            <button
                {...attributes}
                {...listeners}
                type="button"
                className="cursor-grab text-muted-foreground"
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-medium">{question.label}</p>
                    {question.is_required && (
                        <Badge variant="outline" className="text-xs">
                            required
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{question.key}</span> · {question.type_label}
                    {question.has_options && ` · ${question.options.length} options`}
                </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    );
}

type QuestionDialogState =
    | { mode: 'create'; sectionId: number }
    | { mode: 'edit'; sectionId: number; question: FormQuestion };

function QuestionDialog({
    state,
    onClose,
    onSaved,
}: {
    state: QuestionDialogState;
    onClose: () => void;
    onSaved: () => void;
}) {
    const { t } = useTranslation('tenant');
    const isEdit = state.mode === 'edit';

    type QuestionFormData = {
        label: string;
        key: string;
        help_text: string;
        type: FormQuestionType;
        is_required: boolean;
        validation_rules: Record<string, string>;
        options: { value: string; label: string }[];
    };

    const initial = useMemo<QuestionFormData>(() => {
        if (state.mode === 'edit') {
            const q = state.question;
            const rawRules = (q.validation_rules ?? {}) as Record<string, unknown>;
            const rules: Record<string, string> = {};
            for (const [k, v] of Object.entries(rawRules)) {
                if (v !== null && v !== undefined) rules[k] = String(v);
            }
            return {
                label: q.label,
                key: q.key,
                help_text: q.help_text ?? '',
                type: q.type,
                is_required: q.is_required,
                validation_rules: rules,
                options: q.options.map((o) => ({ value: o.value, label: o.label })),
            };
        }
        return {
            label: '',
            key: '',
            help_text: '',
            type: 'text' as FormQuestionType,
            is_required: false,
            validation_rules: {},
            options: [],
        };
    }, [state]);

    const [keyEdited, setKeyEdited] = useState(isEdit);
    const form = useForm<QuestionFormData>(initial);

    useEffect(() => {
        form.setDefaults(initial);
        form.setData(initial);
        setKeyEdited(isEdit);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    const onLabelChange = (label: string) => {
        const patch: Partial<typeof form.data> = { label };
        if (!keyEdited) patch.key = generateKey(label);
        form.setData((d) => ({ ...d, ...patch }));
    };

    const setRule = (key: string, value: string) => {
        const next = { ...(form.data.validation_rules ?? {}) };
        if (value === '' || value === undefined) {
            delete next[key];
        } else {
            next[key] = value;
        }
        form.setData('validation_rules', next);
    };

    const setOption = (idx: number, patch: { value?: string; label?: string }) => {
        const next = [...form.data.options];
        next[idx] = { ...next[idx], ...patch };
        form.setData('options', next);
    };

    const addOption = () => {
        const next = [...form.data.options, { value: '', label: '' }];
        form.setData('options', next);
    };

    const removeOption = (idx: number) => {
        form.setData(
            'options',
            form.data.options.filter((_, i) => i !== idx),
        );
    };

    const hasOptions = ['radio', 'checkbox', 'select'].includes(form.data.type);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const url = isEdit
            ? `/sections/${state.sectionId}/questions/${state.question.id}`
            : `/sections/${state.sectionId}/questions`;
        const method = isEdit ? form.patch : form.post;
        method.bind(form)(url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Question saved');
                onSaved();
            },
        });
    };

    const rules = (form.data.validation_rules ?? {}) as Record<string, string>;

    // Edit/create has lots of fields — backdrop / Esc must not silently
    // discard a half-finished question.
    const isDirty = useMemo(() => {
        return JSON.stringify(form.data) !== JSON.stringify(initial);
    }, [form.data, initial]);

    const requestClose = () => {
        if (isDirty) {
            const ok = window.confirm(
                t('common:actions.discardChanges', { defaultValue: 'Discard unsaved changes?' }),
            );
            if (!ok) return;
        }
        onClose();
    };

    return (
        <Dialog open onOpenChange={(open) => !open && requestClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>
                            {isEdit
                                ? t('builder.questionDialog.editTitle')
                                : t('builder.questionDialog.createTitle')}
                        </DialogTitle>
                        <DialogDescription>{t('builder.questionDialog.keyHint')}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="q-label">{t('builder.questionDialog.label')}</Label>
                        <Input
                            id="q-label"
                            value={form.data.label}
                            onChange={(e) => onLabelChange(e.target.value)}
                        />
                        {form.errors.label && (
                            <p className="text-xs text-destructive">{form.errors.label}</p>
                        )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="q-key">{t('builder.questionDialog.key')}</Label>
                            <Input
                                id="q-key"
                                value={form.data.key}
                                onChange={(e) => {
                                    setKeyEdited(true);
                                    form.setData('key', generateKey(e.target.value));
                                }}
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('builder.questionDialog.type')}</Label>
                            <Select
                                value={form.data.type}
                                onValueChange={(v) => form.setData('type', v as FormQuestionType)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {QUESTION_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {t(`builder.questionTypes.${type}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="q-help">{t('builder.questionDialog.helpText')}</Label>
                        <Input
                            id="q-help"
                            value={form.data.help_text}
                            onChange={(e) => form.setData('help_text', e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch
                            id="q-required"
                            checked={form.data.is_required}
                            onCheckedChange={(v) => form.setData('is_required', v)}
                        />
                        <Label htmlFor="q-required">{t('builder.questionDialog.required')}</Label>
                    </div>

                    {hasOptions && (
                        <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                            <Label className="text-sm">{t('builder.questionDialog.options')}</Label>
                            <div className="space-y-2">
                                {form.data.options.map((opt, idx) => (
                                    <div key={idx} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
                                        <Input
                                            placeholder={t('builder.questionDialog.optionValue')}
                                            value={opt.value}
                                            onChange={(e) => setOption(idx, { value: e.target.value })}
                                            className="font-mono"
                                        />
                                        <Input
                                            placeholder={t('builder.questionDialog.optionLabel')}
                                            value={opt.label}
                                            onChange={(e) => setOption(idx, { label: e.target.value })}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeOption(idx)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addOption}>
                                <Plus className="me-2 h-4 w-4" />
                                {t('builder.questionDialog.addOption')}
                            </Button>
                        </div>
                    )}

                    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                        <Label className="text-sm">{t('builder.questionDialog.validation')}</Label>
                        <ValidationFields type={form.data.type} rules={rules} setRule={setRule} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ValidationFields({
    type,
    rules,
    setRule,
}: {
    type: FormQuestionType;
    rules: Record<string, string>;
    setRule: (key: string, value: string) => void;
}) {
    const { t } = useTranslation('tenant');

    if (type === 'text' || type === 'textarea') {
        return (
            <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                    <Label className="text-xs">{t('builder.questionDialog.minLength')}</Label>
                    <Input
                        type="number"
                        value={rules.min_length ?? ''}
                        onChange={(e) => setRule('min_length', e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">{t('builder.questionDialog.maxLength')}</Label>
                    <Input
                        type="number"
                        value={rules.max_length ?? ''}
                        onChange={(e) => setRule('max_length', e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">{t('builder.questionDialog.regex')}</Label>
                    <Input
                        value={rules.regex ?? ''}
                        onChange={(e) => setRule('regex', e.target.value)}
                        className="font-mono"
                    />
                </div>
            </div>
        );
    }

    if (type === 'number') {
        return (
            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                    <Label className="text-xs">{t('builder.questionDialog.min')}</Label>
                    <Input
                        type="number"
                        value={rules.min ?? ''}
                        onChange={(e) => setRule('min', e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">{t('builder.questionDialog.max')}</Label>
                    <Input
                        type="number"
                        value={rules.max ?? ''}
                        onChange={(e) => setRule('max', e.target.value)}
                    />
                </div>
            </div>
        );
    }

    if (type === 'date') {
        return (
            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                    <Label className="text-xs">{t('builder.questionDialog.minDate')}</Label>
                    <Input
                        type="date"
                        value={rules.min_date ?? ''}
                        onChange={(e) => setRule('min_date', e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">{t('builder.questionDialog.maxDate')}</Label>
                    <Input
                        type="date"
                        value={rules.max_date ?? ''}
                        onChange={(e) => setRule('max_date', e.target.value)}
                    />
                </div>
            </div>
        );
    }

    if (type === 'file') {
        return (
            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                    <Label className="text-xs">{t('builder.questionDialog.maxFileSize')}</Label>
                    <Input
                        type="number"
                        value={rules.max_size_mb ?? ''}
                        onChange={(e) => setRule('max_size_mb', e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">{t('builder.questionDialog.allowedTypes')}</Label>
                    <Input
                        value={rules.allowed_types ?? ''}
                        onChange={(e) => setRule('allowed_types', e.target.value)}
                        placeholder="pdf,jpg,png"
                    />
                </div>
            </div>
        );
    }

    return <p className="text-xs text-muted-foreground">No validation rules for this type.</p>;
}
