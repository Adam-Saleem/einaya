# Frontend Conventions

## TypeScript

Strict mode. No `any`. No implicit any. All public APIs typed.

```json
// tsconfig.json (relevant flags)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictNullChecks": true
  }
}
```

## File Structure

```
resources/js/
├── app.tsx                       # Inertia bootstrap
├── i18n.ts                       # i18n setup
├── lib/
│   ├── utils.ts                  # cn(), formatters
│   ├── axios.ts                  # configured axios for non-Inertia calls
│   └── dayjs.ts                  # configured dayjs
├── types/
│   ├── index.ts                  # PageProps generic
│   ├── auth.ts                   # User, Permission, Role types
│   ├── patient.ts
│   ├── appointment.ts
│   └── ...
├── Pages/
│   ├── Auth/
│   ├── Central/
│   ├── Tenant/
│   │   ├── Patients/
│   │   │   ├── Index.tsx
│   │   │   └── Show.tsx
│   │   ├── Appointments/
│   │   └── ...
├── Layouts/
│   ├── AppLayout.tsx
│   └── CentralLayout.tsx
├── Components/
│   ├── ui/                       # shadcn (managed by CLI)
│   └── domain/
│       ├── layout/
│       │   ├── AppSidebar.tsx
│       │   ├── AppTopbar.tsx
│       │   └── PageHeader.tsx
│       ├── DataTable.tsx
│       ├── FormModal.tsx
│       ├── EmptyState.tsx
│       ├── StatusBadge.tsx
│       ├── Can.tsx
│       └── ...
├── Hooks/
│   ├── useCan.ts
│   ├── useDirection.ts
│   ├── useTheme.ts
│   └── ...
└── locales/
    ├── en/
    │   ├── common.json
    │   ├── patients.json
    │   └── ...
    └── ar/
```

## Pages

```typescript
// resources/js/Pages/Tenant/Patients/Index.tsx
import { useTranslation } from 'react-i18next';
import AppLayout from '@/Layouts/AppLayout';
import { DataTable } from '@/Components/domain/DataTable';
import { PageHeader } from '@/Components/domain/PageHeader';
import type { PageProps } from '@/types';
import type { PatientResource } from '@/types/patient';

type Props = PageProps<{
  patients: PatientResource[];
  filters: {
    search?: string;
    gender?: 'male' | 'female' | 'other';
  };
}>;

export default function PatientsIndex({ patients, filters }: Props) {
  const { t } = useTranslation('patients');

  return (
    <>
      <PageHeader
        title={t('index.title')}
        description={t('index.description')}
      />
      <DataTable data={patients} columns={columns} />
    </>
  );
}

PatientsIndex.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
```

Rules:
- Default export is the page component
- Layout via `Component.layout = ...` pattern (Inertia convention)
- Props always typed with `PageProps<T>`
- All strings via `t()`

## Components

```typescript
// resources/js/Components/domain/PatientHeader.tsx
import type { PatientResource } from '@/types/patient';

type Props = {
  patient: PatientResource;
  showActions?: boolean;
};

export function PatientHeader({ patient, showActions = false }: Props) {
  // ...
}
```

Rules:
- Named exports for components, not default (except pages)
- Props type defined inline above component
- Optional props default in destructuring
- One component per file (small helpers in same file OK)

## Forms

```typescript
import { useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const { data, setData, post, processing, errors, reset } = useForm({
  first_name: '',
  last_name: '',
  phone: '',
});

const submit = (e: React.FormEvent) => {
  e.preventDefault();
  post('/patients', {
    onSuccess: () => {
      toast.success(t('patients.created'));
      reset();
    },
  });
};
```

For complex forms, use `react-hook-form` + `zod`:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  first_name: z.string().min(1).max(120),
  last_name: z.string().min(1).max(120),
  phone: z.string().min(7).max(30),
});

type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

Inertia's server-returned errors should auto-merge into form state via the shadcn Form component pattern.

## Hooks

```typescript
// resources/js/Hooks/useCan.ts
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import type { Permission } from '@/types/auth';

export function useCan() {
  const { auth } = usePage<PageProps>().props;
  return (permission: Permission): boolean => {
    return auth.permissions.includes(permission);
  };
}
```

## Tailwind Classes

### Logical properties always

```tsx
// ✓ correct
<div className="ms-4 me-2 ps-3 pe-3">

// ✗ wrong (breaks RTL)
<div className="ml-4 mr-2 pl-3 pr-3">
```

### Semantic colors always

```tsx
// ✓ correct
<div className="bg-background text-foreground border-border">

// ✗ wrong (breaks dark mode)
<div className="bg-white text-black border-gray-200">
```

### Class composition

Use `cn()` from `@/lib/utils`:

```tsx
import { cn } from '@/lib/utils';

<button className={cn(
  'rounded-md px-4 py-2',
  variant === 'primary' && 'bg-primary text-primary-foreground',
  disabled && 'opacity-50 cursor-not-allowed',
)} />
```

## Imports

Order:
1. React / Inertia / npm packages
2. Local components / hooks / lib
3. Types
4. Style imports (rare)

```typescript
import { useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import AppLayout from '@/Layouts/AppLayout';
import { DataTable } from '@/Components/domain/DataTable';
import { useCan } from '@/Hooks/useCan';

import type { PageProps } from '@/types';
import type { PatientResource } from '@/types/patient';
```

Use `@/` path alias for `resources/js/`.

## Translation Keys

Namespace by feature:

```json
// locales/en/patients.json
{
  "index": {
    "title": "Patients",
    "description": "Manage patient records"
  },
  "form": {
    "first_name": "First name",
    "last_name": "Last name"
  },
  "actions": {
    "register": "Register patient",
    "edit": "Edit",
    "delete": "Delete"
  },
  "messages": {
    "created": "Patient registered successfully",
    "updated": "Patient updated"
  }
}
```

Usage:
```tsx
const { t } = useTranslation('patients');
t('index.title');
t('actions.register');
```

## Date Formatting

Always use `dayjs` with locale:

```typescript
import dayjs from '@/lib/dayjs'; // configured with EN+AR locales

dayjs(patient.created_at).format('DD MMM YYYY');
dayjs(appointment.scheduled_for).fromNow();
```

Never use `Date` directly.

## What we don't do

- No `any` (use `unknown` if needed)
- No inline styles (`style={{...}}`) unless dynamic and unavoidable
- No `dangerouslySetInnerHTML` unless content is sanitized server-side
- No raw `fetch` — use Inertia for navigation, configured `axios` for ad-hoc API
- No localStorage/sessionStorage in artifacts (per Anthropic env rules); for production app, OK but rarely needed since Inertia syncs state
- No prop drilling more than 2 levels — extract context or compose
- No effect-heavy components — favor derived state and event handlers
