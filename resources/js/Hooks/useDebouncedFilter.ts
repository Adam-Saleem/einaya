import { useEffect, useRef, useState } from 'react';

/**
 * Debounced text filter for list-page search inputs. Pair with an Inertia
 * `router.get(..., { preserveState: true, replace: true })` callback so the
 * URL is updated as the user types without a full page rerender.
 *
 *   const [search, setSearch] = useDebouncedFilter(
 *       filters.search,
 *       (v) => apply({ search: v }),
 *   );
 *
 * The callback only fires when the debounced value actually differs from
 * the prop-provided initial — no spurious request on mount, and changes
 * pushed from the server (filter reset) don't bounce back.
 */
export function useDebouncedFilter(
    initial: string,
    onApply: (value: string) => void,
    delay = 300,
): [string, (value: string) => void] {
    const [value, setValue] = useState(initial);
    const lastApplied = useRef(initial);

    useEffect(() => {
        // Server pushed a new initial (filter cleared, navigation, etc.) —
        // sync local state without firing onApply.
        setValue(initial);
        lastApplied.current = initial;
    }, [initial]);

    useEffect(() => {
        if (value === lastApplied.current) return;
        const handle = setTimeout(() => {
            lastApplied.current = value;
            onApply(value);
        }, delay);
        return () => clearTimeout(handle);
        // onApply is intentionally omitted — callers commonly pass an inline
        // arrow that would otherwise retrigger every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, delay]);

    return [value, setValue];
}
