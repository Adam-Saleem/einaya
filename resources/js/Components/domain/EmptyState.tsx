import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Inbox } from 'lucide-react';

type Props = {
    icon?: ComponentType<SVGProps<SVGSVGElement>>;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
};

export function EmptyState({ icon: Icon = Inbox, title, description, action }: Props) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="h-6 w-6" />
            </span>
            <div className="space-y-1">
                <p className="text-h4 text-foreground">{title}</p>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
