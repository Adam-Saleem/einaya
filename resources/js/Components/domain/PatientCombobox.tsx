import axios from 'axios';
import { Check, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/Components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';

type SearchResult = {
    id: number;
    patient_code: string;
    name: string;
    phone: string;
    age: number | null;
    gender: string | null;
};

type Props = {
    value: number | null;
    onChange: (id: number | null, patient: SearchResult | null) => void;
    placeholder?: string;
    className?: string;
};

/**
 * Patient picker that hits /patients/search with a 250ms debounce. Used
 * by PaymentForm + Calendar booking dialog. The selected patient's
 * lightweight snapshot is exposed via the second argument of onChange so
 * the caller can show name/code without an extra fetch.
 */
export function PatientCombobox({ value, onChange, placeholder, className }: Props) {
    const { t } = useTranslation('tenant');
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selected, setSelected] = useState<SearchResult | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        }, 250);
    }, [query]);

    // Hydrate the visible label when the parent provides a `value` but no
    // selected snapshot (e.g. patient pre-selected from URL).
    useEffect(() => {
        if (value && !selected) {
            void (async () => {
                try {
                    const { data } = await axios.get('/patients/search', {
                        params: { q: '' },
                    });
                    const match = (data.results ?? []).find(
                        (r: SearchResult) => r.id === value,
                    );
                    if (match) setSelected(match);
                } catch {
                    // ignore — the picker will just show the ID
                }
            })();
        }
        if (!value && selected) setSelected(null);
    }, [value, selected]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('w-full justify-between font-normal h-11', className)}
                >
                    {selected ? (
                        <span className="flex items-center gap-2">
                            <span className="font-medium">{selected.name}</span>
                            {selected.phone && (
                                <span className="text-xs text-muted-foreground" dir="ltr">
                                    {selected.phone}
                                </span>
                            )}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">
                            <Search className="me-2 inline h-4 w-4" />
                            {placeholder ?? t('patients.search')}
                        </span>
                    )}
                    {selected && (
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label="Clear"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelected(null);
                                onChange(null, null);
                            }}
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        value={query}
                        onValueChange={setQuery}
                        placeholder={t('patients.search')}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {query.trim().length < 2
                                ? 'type at least 2 characters…'
                                : 'No patient found'}
                        </CommandEmpty>
                        <CommandGroup>
                            {results.map((r) => (
                                <CommandItem
                                    key={r.id}
                                    value={`${r.name} ${r.phone} ${r.patient_code}`}
                                    onSelect={() => {
                                        setSelected(r);
                                        onChange(r.id, r);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'me-2 h-4 w-4',
                                            value === r.id ? 'opacity-100' : 'opacity-0',
                                        )}
                                    />
                                    <span className="font-medium">{r.name}</span>
                                    <span className="ms-2 text-xs text-muted-foreground">
                                        {r.phone}
                                        {r.age !== null && ` · ${r.age}y`}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
