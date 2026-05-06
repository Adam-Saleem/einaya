import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';
import rtl from 'tailwindcss-rtl';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '1rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            colors: {
                background: 'rgb(var(--background) / <alpha-value>)',
                foreground: 'rgb(var(--foreground) / <alpha-value>)',
                card: {
                    DEFAULT: 'rgb(var(--card) / <alpha-value>)',
                    foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
                },
                popover: {
                    DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
                    foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
                },
                primary: {
                    DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
                    foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
                },
                secondary: {
                    DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
                    foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
                },
                muted: {
                    DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
                    foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
                },
                accent: {
                    DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
                    foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
                },
                destructive: {
                    DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
                    foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
                },
                success: {
                    DEFAULT: 'rgb(var(--success) / <alpha-value>)',
                    foreground: 'rgb(var(--success-foreground) / <alpha-value>)',
                },
                warning: {
                    DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
                    foreground: 'rgb(var(--warning-foreground) / <alpha-value>)',
                },
                info: {
                    DEFAULT: 'rgb(var(--info) / <alpha-value>)',
                    foreground: 'rgb(var(--info-foreground) / <alpha-value>)',
                },
                border: 'rgb(var(--border) / <alpha-value>)',
                input: 'rgb(var(--input) / <alpha-value>)',
                ring: 'rgb(var(--ring) / <alpha-value>)',
                sidebar: {
                    DEFAULT: 'rgb(var(--sidebar) / <alpha-value>)',
                    foreground: 'rgb(var(--sidebar-foreground) / <alpha-value>)',
                    border: 'rgb(var(--sidebar-border) / <alpha-value>)',
                    accent: 'rgb(var(--sidebar-accent) / <alpha-value>)',
                    'accent-foreground': 'rgb(var(--sidebar-accent-foreground) / <alpha-value>)',
                    ring: 'rgb(var(--sidebar-ring) / <alpha-value>)',
                    primary: 'rgb(var(--sidebar-primary) / <alpha-value>)',
                    'primary-foreground': 'rgb(var(--sidebar-primary-foreground) / <alpha-value>)',
                },
                status: {
                    pending: 'rgb(var(--status-pending) / <alpha-value>)',
                    confirmed: 'rgb(var(--status-confirmed) / <alpha-value>)',
                    arrived: 'rgb(var(--status-arrived) / <alpha-value>)',
                    'in-progress': 'rgb(var(--status-in-progress) / <alpha-value>)',
                    completed: 'rgb(var(--status-completed) / <alpha-value>)',
                    cancelled: 'rgb(var(--status-cancelled) / <alpha-value>)',
                    'no-show': 'rgb(var(--status-no-show) / <alpha-value>)',
                },
                badge: {
                    'success-bg': 'rgb(var(--badge-success-bg) / <alpha-value>)',
                    'success-fg': 'rgb(var(--badge-success-fg) / <alpha-value>)',
                    'warning-bg': 'rgb(var(--badge-warning-bg) / <alpha-value>)',
                    'warning-fg': 'rgb(var(--badge-warning-fg) / <alpha-value>)',
                    'info-bg': 'rgb(var(--badge-info-bg) / <alpha-value>)',
                    'info-fg': 'rgb(var(--badge-info-fg) / <alpha-value>)',
                    'danger-bg': 'rgb(var(--badge-danger-bg) / <alpha-value>)',
                    'danger-fg': 'rgb(var(--badge-danger-fg) / <alpha-value>)',
                    'neutral-bg': 'rgb(var(--badge-neutral-bg) / <alpha-value>)',
                    'neutral-fg': 'rgb(var(--badge-neutral-fg) / <alpha-value>)',
                },
            },
            fontFamily: {
                sans: ['Manrope', 'system-ui', 'sans-serif'],
                arabic: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
            },
            fontSize: {
                xs: ['0.75rem', { lineHeight: '1rem' }],
                sm: ['0.8125rem', { lineHeight: '1.25rem' }],
                base: ['0.875rem', { lineHeight: '1.5' }],
                md: ['1rem', { lineHeight: '1.5rem' }],
                h4: ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],
                h3: ['1.125rem', { lineHeight: '1.625rem', fontWeight: '600' }],
                h2: ['1.5rem', { lineHeight: '2rem', fontWeight: '600', letterSpacing: '-0.02em' }],
                h1: ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700', letterSpacing: '-0.02em' }],
                display: ['3rem', { lineHeight: '3.25rem', fontWeight: '700', letterSpacing: '-0.02em' }],
            },
            borderRadius: {
                sm: 'calc(var(--radius) - 4px)',
                DEFAULT: 'var(--radius)',
                md: 'var(--radius)',
                lg: 'calc(var(--radius) + 2px)',
                xl: 'calc(var(--radius) + 4px)',
            },
            boxShadow: {
                sm: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
                DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
                md: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
                lg: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
                focus: '0 0 0 3px rgb(53 99 201 / 0.30)',
            },
            spacing: {
                sidebar: '260px',
                'sidebar-collapsed': '80px',
                header: '64px',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
        },
    },
    plugins: [animate, rtl, forms, typography],
} satisfies Config;
