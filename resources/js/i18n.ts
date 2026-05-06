import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enCentral from './locales/en/central.json';
import enTenant from './locales/en/tenant.json';
import arCommon from './locales/ar/common.json';
import arAuth from './locales/ar/auth.json';
import arDashboard from './locales/ar/dashboard.json';
import arCentral from './locales/ar/central.json';
import arTenant from './locales/ar/tenant.json';

export const supportedLocales = ['en', 'ar'] as const;
export type Locale = (typeof supportedLocales)[number];

const resources = {
    en: { common: enCommon, auth: enAuth, dashboard: enDashboard, central: enCentral, tenant: enTenant },
    ar: { common: arCommon, auth: arAuth, dashboard: arDashboard, central: arCentral, tenant: arTenant },
};

const initialLocale =
    (typeof document !== 'undefined' &&
        (document.documentElement.getAttribute('lang') as Locale | null)) ||
    'en';

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        lng: initialLocale,
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: ['common', 'auth', 'dashboard', 'central', 'tenant'],
        interpolation: { escapeValue: false },
        detection: {
            order: ['htmlTag', 'localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'einaya-locale',
        },
        returnNull: false,
    });

export default i18n;
