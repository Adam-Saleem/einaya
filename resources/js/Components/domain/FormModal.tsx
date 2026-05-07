import type { FormEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import { LoadingSpinner } from './LoadingSpinner';

type Props = {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    submitLabel?: ReactNode;
    cancelLabel?: ReactNode;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    submitting?: boolean;
    children: ReactNode;
};

export function FormModal({
    open,
    onOpenChange,
    trigger,
    title,
    description,
    submitLabel,
    cancelLabel,
    onSubmit,
    submitting = false,
    children,
}: Props) {
    const { t } = useTranslation('common');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col">
                <form onSubmit={onSubmit} className="flex flex-col gap-6 overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>
                    <div className="flex flex-col gap-4 overflow-y-auto pr-1">{children}</div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange?.(false)}
                            disabled={submitting}
                        >
                            {cancelLabel ?? t('actions.cancel')}
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <LoadingSpinner size="sm" className="me-2" />}
                            {submitLabel ?? t('actions.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
