import { SVGAttributes } from 'react';

/**
 * Einaya wordmark + dot mark. The dot uses --primary (cyan-600) and the
 * wordmark uses currentColor so it inherits the surrounding text color.
 * Pass a className that controls width — height auto-fits.
 */
export default function ApplicationLogo({
    showWordmark = true,
    ...props
}: SVGAttributes<SVGElement> & { showWordmark?: boolean }) {
    if (!showWordmark) {
        return (
            <svg
                {...props}
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect width="40" height="40" rx="10" fill="rgb(var(--primary))" />
                <path
                    d="M11 13h13v3H14.5v4H22v3h-7.5v4H24v3H11V13Z"
                    fill="rgb(var(--primary-foreground))"
                />
                <circle cx="29" cy="13" r="3" fill="rgb(var(--success))" />
            </svg>
        );
    }

    return (
        <svg
            {...props}
            viewBox="0 0 160 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect width="40" height="40" rx="10" fill="rgb(var(--primary))" />
            <path
                d="M11 13h13v3H14.5v4H22v3h-7.5v4H24v3H11V13Z"
                fill="rgb(var(--primary-foreground))"
            />
            <circle cx="29" cy="13" r="3" fill="rgb(var(--success))" />
            <text
                x="52"
                y="27"
                fill="currentColor"
                fontFamily="Manrope, system-ui, sans-serif"
                fontSize="20"
                fontWeight="700"
                letterSpacing="-0.5"
            >
                Einaya
            </text>
        </svg>
    );
}
