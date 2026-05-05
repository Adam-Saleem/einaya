import '../css/app.css';
import './bootstrap';
import './i18n';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

import { Toaster } from '@/Components/ui/sonner';
import { TooltipProvider } from '@/Components/ui/tooltip';

const appName = import.meta.env.VITE_APP_NAME || 'Einaya';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <TooltipProvider delayDuration={150}>
                <App {...props} />
                <Toaster richColors closeButton position="top-right" />
            </TooltipProvider>,
        );
    },
    progress: {
        color: 'rgb(0 102 255)',
    },
});
