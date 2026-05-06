import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren, type ReactNode } from 'react';

import { Card, CardContent } from '@/Components/ui/card';

type Props = {
    title?: ReactNode;
    subtitle?: ReactNode;
};

export default function Guest({ children, title, subtitle }: PropsWithChildren<Props>) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
            <Link href="/" className="mb-6">
                <ApplicationLogo className="h-12 w-auto fill-current text-primary" />
            </Link>

            <Card className="w-full max-w-md shadow-lg">
                <CardContent className="space-y-6 p-8">
                    {(title || subtitle) && (
                        <header className="space-y-1.5 text-center">
                            {title && <h1 className="text-h3 text-foreground">{title}</h1>}
                            {subtitle && (
                                <p className="text-sm text-muted-foreground">{subtitle}</p>
                            )}
                        </header>
                    )}
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}
