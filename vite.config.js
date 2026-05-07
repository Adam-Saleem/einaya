import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return undefined;
                    if (id.includes('recharts') || id.includes('d3-')) return 'vendor-recharts';
                    if (id.includes('@fullcalendar')) return 'vendor-fullcalendar';
                    if (id.includes('@dnd-kit')) return 'vendor-dndkit';
                    if (id.includes('react-colorful')) return 'vendor-colorful';
                    if (
                        id.includes('i18next') ||
                        id.includes('react-i18next') ||
                        id.includes('i18next-browser-languagedetector')
                    )
                        return 'vendor-i18n';
                    if (id.includes('@radix-ui')) return 'vendor-radix';
                    if (id.includes('@tanstack')) return 'vendor-tanstack';
                    if (id.includes('lucide-react')) return 'vendor-lucide';
                    return undefined;
                },
            },
        },
    },
});
