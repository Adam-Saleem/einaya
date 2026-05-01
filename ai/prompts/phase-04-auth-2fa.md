# Phase 4 — Authentication, 2FA & Multi-Context Login

> **Prerequisite:** Paste `00-master-spec.md` above this prompt. Phases 1-3 must be complete.

## Goal

Adapt Laravel Breeze for the multi-context (central + tenant) architecture, add manual 2FA via `pragmarx/google2fa-laravel`, and ensure each context's users authenticate against the correct database.

## Requirements

### 1. Two Auth Contexts

- **Central context** (`app.einaya.ps`): super admins log in here against `central.users` table
- **Tenant context** (`{clinic}.einaya.ps`): clinic users log in here against the tenant DB's `users` table

Both contexts use the same Inertia `Login.tsx` page — context detected from the URL/middleware, not from the page.

Auth guards in `config/auth.php`:
- `web` guard for tenant users (default)
- `web_central` guard for super admins (uses central User model)

The login controller picks the correct guard based on the current request's context.

### 2. Manual 2FA via pragmarx/google2fa-laravel

- Install: `composer require pragmarx/google2fa-laravel`
- Required for super admins (cannot disable)
- Optional for clinic users (can be enabled in profile, recommended for doctors)

**Setup flow:**
1. User visits `/profile/two-factor`
2. Server generates secret + QR code
3. User scans with Google Authenticator / Authy / similar
4. User enters 6-digit code to confirm
5. Server generates 8 recovery codes, displays once
6. Recovery codes stored hashed (`Hash::make()`)
7. User confirms they saved codes → `two_factor_confirmed_at` set

**Login flow:**
1. User submits email + password
2. If credentials valid AND user has `two_factor_confirmed_at`:
   - Store user ID in session (`auth.two_factor.user_id`)
   - Redirect to `/two-factor-challenge`
   - User enters 6-digit code OR a recovery code
   - Recovery codes are one-time-use (delete after use)
3. If valid → fully logged in, redirect to dashboard

### 3. User Model Adjustments

**Central User model** (`app/Models/Central/User.php`):
- Always requires 2FA (cannot be null after first setup)
- After Phase 5: scope/trait for super admin role

**Tenant User model** (`app/Models/Tenant/User.php`):
- 2FA optional
- After Phase 5: HasRoles trait from Spatie

Both models use the trait `app/Traits/HasTwoFactorAuth.php`:
- `enableTwoFactor()` — generates secret, returns QR code data URL
- `confirmTwoFactor(string $code): bool` — verifies and confirms
- `disableTwoFactor()` — clears secret and codes
- `verifyCode(string $code): bool`
- `useRecoveryCode(string $code): bool`
- `regenerateRecoveryCodes(): array`

### 4. Login Throttling

5 attempts per minute per IP+email combination using Laravel's built-in `RateLimiter`.

After 5 failed attempts: temporary lockout, message: "Too many attempts. Try again in X seconds."

### 5. Password Requirements

Minimum:
- 10 characters
- Mixed case
- Number
- Symbol

Use Laravel's `Password` rule with `min(10)->mixedCase()->numbers()->symbols()`.

For password reset/setup, return clear validation messages to Inertia.

### 6. Inertia React Pages

In `resources/js/Pages/Auth/`:

- `Login.tsx` — works for both contexts
  - Email + password
  - "Remember me" checkbox
  - Forgot password link
- `TwoFactorChallenge.tsx`
  - 6-digit code input (auto-focused, auto-submits on 6 chars)
  - "Use recovery code instead" toggle
  - 8-char recovery code input
- `TwoFactorSetup.tsx`
  - Display QR code
  - Manual entry code (text below QR)
  - 6-digit confirmation input
- `RecoveryCodes.tsx`
  - Display 8 codes
  - "Download as TXT" button
  - "Copy to clipboard" button
  - "I've saved my codes" confirmation button (sets `two_factor_confirmed_at`)
- `ForgotPassword.tsx`
- `ResetPassword.tsx`
- `VerifyEmail.tsx`
- `ConfirmPassword.tsx` (for sensitive actions)

In `resources/js/Pages/Profile/`:
- `Edit.tsx` — main profile page with sections:
  - Update profile info (name, email, phone, language)
  - Update password
  - Two-factor authentication (enable/disable, regenerate codes)
  - Delete account (super admin only — clinic users cannot delete themselves)

### 7. Routes

In `routes/auth.php` (shared):
- Login, logout, password reset routes
- 2FA routes

In `routes/central.php`:
- `app.einaya.ps` login form posts to `/login` with central guard
- After login → super admin dashboard

In `routes/tenant.php`:
- `{clinic}.einaya.ps` login form posts to `/login` with web guard
- After login → clinic dashboard (role-based redirect, set up properly in Phase 5)

### 8. Middleware

- `EnsureCentralContext` — blocks central routes from being accessed via tenant subdomain
- `EnsureTenantContext` — already provided by stancl
- `RequireTwoFactor` — for routes that require 2FA confirmation (sensitive actions)

### 9. Logout

- POST to `/logout`
- Invalidate session, regenerate token
- Redirect to login of current context

### 10. Session Configuration

In `config/session.php`:
- Driver: `database` (so sessions survive server restarts and are tenant-aware via stancl bootstrapper)
- Domain: `null` (each subdomain has its own session — DO NOT share across subdomains for security)
- Secure cookies in production

## Deliverables

### Backend
- `app/Http/Controllers/Auth/` — adapted Breeze controllers (Login, Logout, Register, Password reset, Email verification, 2FA setup, 2FA challenge)
- `app/Http/Middleware/EnsureCentralContext.php`
- `app/Http/Middleware/RequireTwoFactor.php`
- `app/Traits/HasTwoFactorAuth.php`
- `app/Services/TwoFactorService.php` — encapsulates QR generation, code verification, recovery codes
- `app/Http/Requests/Auth/LoginRequest.php`
- `app/Http/Requests/Auth/TwoFactorChallengeRequest.php`
- Configured `config/auth.php` with two guards
- Migration: `users` and `tenant.users` already have `two_factor_*` columns from Phases 2-3 ✓

### Frontend
- All Inertia pages listed in section 6
- Reusable `<TwoFactorInput />` component (6-digit auto-advancing input)
- Form validation hooks using server-returned errors
- Sonner toast for success/error feedback

### Tests
In `tests/Feature/Auth/`:
- `CentralLoginTest.php` — super admin can log in at `app.einaya.test`
- `TenantLoginTest.php` — clinic user can log in at `{clinic}.einaya.test`
- `WrongContextTest.php` — super admin login fails at tenant subdomain (and vice versa)
- `TwoFactorSetupTest.php`
- `TwoFactorChallengeTest.php` — code + recovery code flows
- `LoginThrottlingTest.php` — locks out after 5 attempts
- `PasswordRequirementsTest.php` — weak passwords rejected

## Constraints

- Do **not** allow self-registration in v1 (no public signup form on tenant subdomains). Clinics are created by super admin or via signup on `einaya.ps` root (not in this phase). Tenant users are created by the clinic admin.
- The `Register.tsx` page from Breeze should be removed or hidden in tenant context.
- On `app.einaya.ps`, registration is also disabled — super admins are seeded only.
- Sessions must NOT be shared across subdomains. Each clinic has isolated sessions.

## Definition of Done

- [ ] Super admin logs in at `app.einaya.test` with seeded credentials
- [ ] Clinic admin logs in at `demo.einaya.test`
- [ ] Logging in at the wrong subdomain fails clearly
- [ ] 2FA setup flow works end-to-end (QR code generates, code accepted, recovery codes shown)
- [ ] 2FA challenge works on subsequent login
- [ ] Recovery codes work and are one-time-use
- [ ] Throttling blocks 6th attempt within 1 minute
- [ ] Weak passwords rejected with clear errors
- [ ] All auth tests pass
- [ ] No console errors in browser
- [ ] Sessions isolated per subdomain (verified manually: log in to clinic A, visit clinic B subdomain, must re-login)

## Notes for Future Phases

- Phase 5 adds Spatie permissions and role assignment for tenant users
- Phase 6 reskins these auth pages using shadcn + design tokens
- Phase 7+ build the actual dashboards users see after login
