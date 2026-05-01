# i18n & RTL Conventions

Einaya supports English and Arabic with full RTL (right-to-left) layout. These conventions keep both languages working without surprises.

## Languages

- **`en`** — English (LTR)
- **`ar`** — Arabic (RTL)

Default per user (stored on `users.preferred_language`).
Default per patient for printouts (stored on `patients.preferred_language`).

## Direction Switching

When user selects Arabic:
1. Backend updates `users.preferred_language = 'ar'`
2. Frontend reloads page (required because `dir` attribute on `<html>` must change)
3. `<html dir="rtl" lang="ar">`
4. Body uses `font-arabic` instead of `font-sans`

When user selects English:
1. Backend updates `users.preferred_language = 'en'`
2. Frontend reloads page
3. `<html dir="ltr" lang="en">`
4. Body uses `font-sans`

## Tailwind Logical Properties

**Always use logical properties.** Never use directional ones.

| ❌ Wrong | ✅ Right |
|---|---|
| `ml-4` | `ms-4` (margin-start) |
| `mr-4` | `me-4` (margin-end) |
| `pl-3` | `ps-3` (padding-start) |
| `pr-3` | `pe-3` (padding-end) |
| `left-0` | `start-0` |
| `right-0` | `end-0` |
| `border-l` | `border-s` |
| `border-r` | `border-e` |
| `rounded-l-md` | `rounded-s-md` |
| `rounded-r-md` | `rounded-e-md` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |

In RTL mode, "start" = right, "end" = left. Tailwind handles the swap automatically when `<html dir="rtl">`.

The `tailwindcss-rtl` plugin is enabled in v1 to provide the logical utilities (Tailwind 3 has them built-in for some, plugin for the rest).

## Direction-Aware Icons

Some icons are direction-aware (back arrow, forward arrow, chevrons). Lucide React doesn't auto-flip; do it yourself:

```tsx
import { useDirection } from '@/Hooks/useDirection';
import { ChevronRight } from 'lucide-react';

function ForwardIcon() {
  const dir = useDirection();
  return <ChevronRight className={dir === 'rtl' ? 'rotate-180' : ''} />;
}
```

Or use a wrapper component:

```tsx
// Components/domain/DirectionalChevron.tsx
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useDirection } from '@/Hooks/useDirection';

export function ChevronForward(props) {
  return useDirection() === 'rtl' ? <ChevronLeft {...props} /> : <ChevronRight {...props} />;
}
export function ChevronBack(props) {
  return useDirection() === 'rtl' ? <ChevronRight {...props} /> : <ChevronLeft {...props} />;
}
```

## Translation Keys

Namespace per feature:
```
locales/
├── en/
│   ├── common.json          # buttons, statuses, generic strings
│   ├── auth.json            # login, register, 2FA
│   ├── patients.json
│   ├── appointments.json
│   ├── consultations.json
│   ├── forms.json
│   ├── payments.json
│   ├── staff.json
│   └── settings.json
└── ar/
    ├── common.json
    └── ...
```

Key style: `dot.case` with logical hierarchy:

```json
{
  "index": {
    "title": "Patients",
    "empty": "No patients yet"
  },
  "form": {
    "first_name": "First name",
    "last_name": "Last name",
    "phone": "Phone"
  },
  "actions": {
    "create": "Register patient",
    "edit": "Edit",
    "delete": "Delete"
  },
  "messages": {
    "created": "Patient registered",
    "updated": "Patient updated",
    "deleted": "Patient removed"
  },
  "errors": {
    "duplicate_phone": "{{count}} patients already use this phone"
  }
}
```

Usage:

```tsx
const { t } = useTranslation('patients');
t('index.title');                          // "Patients"
t('messages.created');                     // "Patient registered"
t('errors.duplicate_phone', { count: 3 }); // "3 patients already use this phone"
```

## Pluralization

Arabic has 6 plural forms (zero, one, two, few, many, other). i18next handles this:

```json
// en
{
  "patient_count_one": "{{count}} patient",
  "patient_count_other": "{{count}} patients"
}

// ar — supports more forms when needed
{
  "patient_count_zero": "لا يوجد مرضى",
  "patient_count_one": "مريض واحد",
  "patient_count_two": "مريضان",
  "patient_count_few": "{{count}} مرضى",
  "patient_count_many": "{{count}} مريضًا",
  "patient_count_other": "{{count}} مريض"
}
```

```tsx
t('patient_count', { count: 5 });
```

## Numbers

**Keep Western digits (0-9), do NOT switch to Eastern Arabic numerals (٠-٩).**

Reason: medical context. Mixing digit systems creates risk in dosages, vitals, dates. A "10mg" must always be "10mg" regardless of UI language.

```tsx
// ✓ correct
<span>{patient.age} years</span>  // shows "45 years" or "45 سنة"

// ✗ wrong
<span>{toArabicDigits(patient.age)} years</span>
```

If a user explicitly requests Eastern digits in a future v2, make it a per-user opt-in setting.

## Dates

Use `dayjs` with locale:

```typescript
// resources/js/lib/dayjs.ts
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/ar';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export default dayjs;
```

Set locale based on user preference:

```typescript
// in app.tsx or i18n setup
import dayjs from '@/lib/dayjs';
dayjs.locale(userLanguage);
```

Format calls:

```tsx
dayjs(patient.date_of_birth).format('LL');  // "August 15, 1985" / "15 أغسطس 1985"
dayjs(appointment.scheduled_for).fromNow(); // "in 2 hours" / "خلال ساعتين"
```

## Time Zones

- Database stores everything in UTC
- Display in clinic's timezone (default `Asia/Hebron`)
- Set `dayjs` timezone or use Laravel's `setTimezone()` in resources

## Currency

USD (`$`) and ILS (`₪`) are the common currencies in this market. v1 uses USD. Display:

```tsx
new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'USD',
}).format(payment.amount);
```

## Right-to-Left Specific Quirks

### Inputs (text direction)
Auto-detected by browser based on content. Don't force `dir` on inputs unless specifically needed.

```tsx
<Input placeholder={t('phone')} />  // browser handles direction per character
```

### Numbers in Arabic context
A number like "555-1234" should appear LTR even in RTL context. Use Unicode bidi marks if needed:

```tsx
<span dir="ltr">{patient.phone}</span>
```

Or wrap in a `<bdi>` element.

### FullCalendar
FullCalendar has built-in RTL support. Pass `direction="rtl"` when locale is `ar`:

```tsx
<FullCalendar
  direction={i18n.language === 'ar' ? 'rtl' : 'ltr'}
  locale={i18n.language === 'ar' ? arLocale : enLocale}
  // ...
/>
```

### Print views (receipts, prescriptions)
Direction matches **patient's** preferred_language, not the user's:

```tsx
<div dir={patient.preferred_language === 'ar' ? 'rtl' : 'ltr'}>
  {/* receipt content */}
</div>
```

## Testing RTL

Always test:
1. Switch to Arabic and verify the page mirrors
2. Sidebar appears on the right
3. Navigation chevrons point the right way
4. Form labels align correctly
5. Buttons aren't cropped at edges
6. Tables maintain readable column order
7. No horizontal scroll appears

The `/design-system` page (Phase 6) is the QA checkpoint for all components in both LTR and RTL.

## Anti-Patterns

- ❌ Hardcoded English (or Arabic) strings in JSX
- ❌ `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-` Tailwind classes
- ❌ Direction-naive icons (back arrows that don't flip)
- ❌ Switching to Eastern Arabic digits in medical contexts
- ❌ Forcing RTL via CSS `transform` (breaks accessibility)
- ❌ `text-align: left` / `right` (use `text-start` / `text-end`)
- ❌ Translation strings concatenated from parts (build full sentences in keys)
