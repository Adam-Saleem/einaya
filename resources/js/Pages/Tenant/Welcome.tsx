import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import ApplicationLogo from '@/Components/ApplicationLogo';
import { LanguageSwitcher } from '@/Components/domain/layout/LanguageSwitcher';
import { ThemeToggle } from '@/Components/domain/layout/ThemeToggle';
import { Button } from '@/Components/ui/button';

interface Props {
    tenantId: string;
}

export default function TenantWelcome({ tenantId }: Props) {
    const { t } = useTranslation('common');

    return (
        <>
            <Head title="Einaya — clinic" />
            <div className="min-h-screen bg-background">
                <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 lg:px-10">
                    <Link href="/" className="flex items-center">
                        <ApplicationLogo className="h-9 w-auto text-foreground" />
                    </Link>
                    <div className="flex items-center gap-1">
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </header>

                <main className="mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-20 text-center lg:px-10 lg:py-28">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="space-y-6"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {t('tenantWelcome.badge')}
                        </span>
                        <h1 className="text-h1 leading-tight tracking-tight text-foreground">
                            {t('tenantWelcome.title')}
                        </h1>
                        <p className="text-base text-muted-foreground">
                            {tenantId}
                        </p>
                        <div className="pt-2">
                            <Button asChild size="lg">
                                <Link href="/login">
                                    {t('actions.open')}
                                    <ArrowRight className="ms-2 h-4 w-4 rtl:scale-x-[-1]" />
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                </main>
            </div>
        </>
    );
}
