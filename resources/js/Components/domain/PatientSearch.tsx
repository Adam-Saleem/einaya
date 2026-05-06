import { router } from '@inertiajs/react';
import axios from 'axios';
import { Search, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/Components/ui/command';

type SearchResult = {
    id: number;
    patient_code: string;
    name: string;
    phone: string;
    age: number | null;
    gender: string | null;
};

type Props = {
    onCreateNew?: (query: string) => void;
};

/**
 * Global cmd+k patient search palette. Mounts once at the layout level —
 * any page can open it via the keyboard shortcut. Hits the JSON
 * /patients/search endpoint with a 300ms debounce.
 */
export function PatientSearch({ onCreateNew }: Props) {
    const { t } = useTranslation('tenant');
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Two ways to open: cmd/ctrl+K, or a global custom event dispatched
        // by AppTopbar's search button.
        const onKey = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setOpen((o) => !o);
            }
        };
        const onOpen = () => setOpen(true);
        window.addEventListener('keydown', onKey);
        window.addEventListener('einaya:open-patient-search', onOpen);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('einaya:open-patient-search', onOpen);
        };
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResults([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            try {
                const { data } = await axios.get('/patients/search', {
                    params: { q: trimmed },
                });
                setResults(data.results ?? []);
            } catch {
                setResults([]);
            }
        }, 300);
    }, [query]);

    const goToPatient = (id: number) => {
        setOpen(false);
        router.visit(`/patients/${id}`);
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder={t('patients.search')}
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                <CommandEmpty>
                    {query.trim().length < 2 ? (
                        <span className="text-sm text-muted-foreground">
                            <Search className="me-2 inline h-4 w-4" />
                            type at least 2 characters…
                        </span>
                    ) : (
                        <button
                            type="button"
                            className="flex w-full items-center justify-center gap-2 px-2 py-3 text-sm text-primary hover:underline"
                            onClick={() => {
                                setOpen(false);
                                onCreateNew?.(query);
                            }}
                        >
                            <UserPlus className="h-4 w-4" />
                            Register new patient ("{query}")
                        </button>
                    )}
                </CommandEmpty>
                {results.length > 0 && (
                    <>
                        <CommandGroup heading={t('patients.title')}>
                            {results.map((r) => (
                                <CommandItem
                                    key={r.id}
                                    value={`${r.name} ${r.phone} ${r.patient_code}`}
                                    onSelect={() => goToPatient(r.id)}
                                >
                                    <span className="font-medium">{r.name}</span>
                                    <span className="ms-2 text-xs text-muted-foreground">
                                        {r.patient_code} · {r.phone}
                                        {r.age !== null && ` · ${r.age}y`}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem
                                onSelect={() => {
                                    setOpen(false);
                                    onCreateNew?.(query);
                                }}
                            >
                                <UserPlus className="me-2 h-4 w-4" />
                                Register new patient
                            </CommandItem>
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}
