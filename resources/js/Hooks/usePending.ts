import { useCallback, useState } from 'react';

/**
 * Single-flight guard for `router.post / patch / delete` calls. Wraps the
 * mutation so the triggering button can disable itself while in flight, and
 * a second click while busy is a no-op (prevents the double-arrive /
 * double-start-consultation races we saw in the Phase 11 audit).
 *
 *   const [busy, run] = usePending();
 *   <Button disabled={busy} onClick={() => run((opts) => router.post(url, {}, opts))}>
 *
 * The callback receives the Inertia options object pre-populated with an
 * `onFinish` that flips `busy` back off — your call may merge in additional
 * options (preserveScroll, onSuccess, ...) and they'll be honored.
 */
type InertiaOptions = {
    onFinish?: () => void;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
    preserveScroll?: boolean;
    preserveState?: boolean;
};

export function usePending(): [
    boolean,
    (action: (opts: InertiaOptions) => void, extra?: InertiaOptions) => void,
] {
    const [busy, setBusy] = useState(false);

    const run = useCallback(
        (action: (opts: InertiaOptions) => void, extra: InertiaOptions = {}) => {
            if (busy) return;
            setBusy(true);
            const userFinish = extra.onFinish;
            action({
                ...extra,
                onFinish: () => {
                    setBusy(false);
                    userFinish?.();
                },
            });
        },
        [busy],
    );

    return [busy, run];
}
