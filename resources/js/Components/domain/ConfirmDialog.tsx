import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/Components/ui/alert-dialog';
import { buttonVariants } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
    trigger?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    confirmLabel?: ReactNode;
    cancelLabel?: ReactNode;
    onConfirm: () => void;
    destructive?: boolean;
};

export function ConfirmDialog({
    trigger,
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel,
    onConfirm,
    destructive = true,
}: Props) {
    const { t } = useTranslation('common');

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelLabel ?? t('actions.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        className={cn(
                            destructive &&
                                buttonVariants({ variant: 'destructive' }),
                        )}
                        onClick={onConfirm}
                    >
                        {confirmLabel ?? t('actions.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
