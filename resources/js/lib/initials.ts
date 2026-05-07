const ARABIC_RANGE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

export function initialsFor(name: string | null | undefined): string {
    if (!name) return '';
    return name
        .trim()
        .split(/\s+/)
        .map((part) => part.charAt(0))
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function isArabicText(text: string): boolean {
    return ARABIC_RANGE.test(text);
}
