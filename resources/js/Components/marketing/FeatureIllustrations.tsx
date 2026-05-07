/**
 * Three small SVG vignettes used by the landing feature grid. They share
 * the cyan + emerald palette via CSS variables so they recolor with the
 * active theme. Roughly 320×140 viewport — sized to drop into a card
 * without scaling.
 */

type Props = { className?: string };

const containerClass = 'h-32 w-full';

function Frame({ children, ...props }: { children: React.ReactNode } & Props) {
    return (
        <svg
            viewBox="0 0 320 140"
            className={[containerClass, props.className].filter(Boolean).join(' ')}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

export function SchedulingIllustration(props: Props) {
    return (
        <Frame {...props}>
            <defs>
                <linearGradient id="sched-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="320" height="140" rx="12" fill="url(#sched-bg)" />
            {/* Mini calendar. */}
            <rect x="20" y="22" width="140" height="96" rx="10" fill="rgb(var(--card))" stroke="rgb(var(--border))" />
            <rect x="32" y="34" width="44" height="6" rx="2" fill="rgb(var(--foreground))" opacity="0.85" />
            <rect x="32" y="46" width="76" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.6" />
            {[0, 1, 2, 3].map((row) =>
                [0, 1, 2, 3, 4].map((col) => {
                    const x = 32 + col * 22;
                    const y = 60 + row * 14;
                    const active = row === 1 && col === 2;
                    const muted = row === 2 && col === 4;
                    return (
                        <rect
                            key={`${row}-${col}`}
                            x={x}
                            y={y}
                            width="16"
                            height="10"
                            rx="2"
                            fill={
                                active
                                    ? 'rgb(var(--primary))'
                                    : muted
                                      ? 'rgb(var(--muted))'
                                      : 'rgb(var(--secondary))'
                            }
                            opacity={muted ? 0.6 : 1}
                        />
                    );
                }),
            )}
            {/* Appointment chips on right. */}
            {[0, 1, 2].map((i) => (
                <g key={i} transform={`translate(180, ${22 + i * 36})`}>
                    <rect
                        width="120"
                        height="28"
                        rx="8"
                        fill="rgb(var(--card))"
                        stroke="rgb(var(--border))"
                    />
                    <circle
                        cx="14"
                        cy="14"
                        r="6"
                        fill={['rgb(var(--success))', 'rgb(var(--warning))', 'rgb(var(--info))'][i]}
                    />
                    <rect x="28" y="9" width="60" height="5" rx="2" fill="rgb(var(--foreground))" opacity="0.85" />
                    <rect x="28" y="18" width="40" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.6" />
                </g>
            ))}
        </Frame>
    );
}

export function RecordsIllustration(props: Props) {
    return (
        <Frame {...props}>
            <defs>
                <linearGradient id="rec-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--success))" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="rgb(var(--success))" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="320" height="140" rx="12" fill="url(#rec-bg)" />
            {/* Stack of file cards. */}
            {[0, 1, 2].map((i) => (
                <g
                    key={i}
                    transform={`translate(${50 + i * 16}, ${24 + i * 8})`}
                >
                    <rect
                        width="180"
                        height="84"
                        rx="10"
                        fill="rgb(var(--card))"
                        stroke="rgb(var(--border))"
                    />
                    {i === 2 && (
                        <>
                            <rect x="14" y="14" width="80" height="6" rx="2" fill="rgb(var(--foreground))" opacity="0.85" />
                            <rect x="14" y="26" width="120" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.55" />
                            <rect x="14" y="36" width="100" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.55" />
                            <rect x="14" y="46" width="60" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.55" />
                            <rect
                                x="14"
                                y="60"
                                width="40"
                                height="14"
                                rx="4"
                                fill="rgb(var(--secondary))"
                            />
                            <rect
                                x="60"
                                y="60"
                                width="40"
                                height="14"
                                rx="4"
                                fill="rgb(var(--success))"
                                opacity="0.8"
                            />
                        </>
                    )}
                </g>
            ))}
            {/* Snapshot tag. */}
            <g transform="translate(228, 30)">
                <rect width="74" height="80" rx="10" fill="rgb(var(--success))" opacity="0.9" />
                <text
                    x="37"
                    y="32"
                    textAnchor="middle"
                    fill="rgb(var(--success-foreground))"
                    fontFamily="Manrope, sans-serif"
                    fontWeight="700"
                    fontSize="11"
                >
                    v3
                </text>
                <text
                    x="37"
                    y="50"
                    textAnchor="middle"
                    fill="rgb(var(--success-foreground))"
                    fontFamily="Manrope, sans-serif"
                    fontSize="8"
                >
                    snapshot
                </text>
                <text
                    x="37"
                    y="64"
                    textAnchor="middle"
                    fill="rgb(var(--success-foreground))"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="8"
                    opacity="0.85"
                >
                    2026-05
                </text>
            </g>
        </Frame>
    );
}

export function ConsultationsIllustration(props: Props) {
    return (
        <Frame {...props}>
            <defs>
                <linearGradient id="cons-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--accent-foreground))" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="rgb(var(--accent-foreground))" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="320" height="140" rx="12" fill="url(#cons-bg)" />
            {/* Patient header. */}
            <g transform="translate(20, 20)">
                <rect
                    width="280"
                    height="36"
                    rx="10"
                    fill="rgb(var(--card))"
                    stroke="rgb(var(--border))"
                />
                <circle cx="22" cy="18" r="10" fill="rgb(var(--primary))" />
                <text
                    x="22"
                    y="22"
                    textAnchor="middle"
                    fill="rgb(var(--primary-foreground))"
                    fontFamily="Manrope, sans-serif"
                    fontWeight="700"
                    fontSize="10"
                >
                    LH
                </text>
                <rect x="42" y="11" width="80" height="6" rx="2" fill="rgb(var(--foreground))" opacity="0.85" />
                <rect x="42" y="21" width="56" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.6" />
                <rect x="232" y="12" width="36" height="14" rx="4" fill="rgb(var(--success))" />
            </g>
            {/* Two work-surface columns. */}
            <g transform="translate(20, 64)">
                <rect width="172" height="60" rx="10" fill="rgb(var(--card))" stroke="rgb(var(--border))" />
                <rect x="14" y="12" width="96" height="6" rx="2" fill="rgb(var(--foreground))" opacity="0.85" />
                <rect x="14" y="24" width="140" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.55" />
                <rect x="14" y="32" width="120" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.55" />
                <rect x="14" y="40" width="80" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.55" />
            </g>
            <g transform="translate(204, 64)">
                <rect width="96" height="60" rx="10" fill="rgb(var(--secondary))" />
                <rect x="14" y="12" width="48" height="6" rx="2" fill="rgb(var(--secondary-foreground))" />
                <rect x="14" y="22" width="68" height="4" rx="2" fill="rgb(var(--secondary-foreground))" opacity="0.65" />
                <rect x="14" y="30" width="68" height="4" rx="2" fill="rgb(var(--secondary-foreground))" opacity="0.65" />
                <rect x="14" y="40" width="36" height="14" rx="4" fill="rgb(var(--primary))" />
            </g>
        </Frame>
    );
}
