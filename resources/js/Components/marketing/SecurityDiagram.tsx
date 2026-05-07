/**
 * Visualises the per-clinic data isolation model. Three clinic surfaces on
 * top, three padlocked databases on the bottom, each connected by its own
 * coloured channel — and a red blocked path showing that no clinic can
 * reach another's database. Pure SVG + token colours.
 */
export function SecurityDiagram({ className }: { className?: string }) {
    const channels = [
        { x: 80, color: 'rgb(var(--primary))', label: 'A' },
        { x: 220, color: 'rgb(var(--success))', label: 'B' },
        { x: 360, color: 'rgb(var(--warning))', label: 'C' },
    ];

    return (
        <svg
            viewBox="0 0 440 320"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="img"
        >
            <defs>
                <linearGradient id="sec-bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="440" height="320" rx="20" fill="url(#sec-bg)" />

            {/* Clinic windows on top. */}
            {channels.map((c) => (
                <g key={`clinic-${c.label}`} transform={`translate(${c.x - 36}, 30)`}>
                    <rect
                        width="72"
                        height="64"
                        rx="10"
                        fill="rgb(var(--card))"
                        stroke="rgb(var(--border))"
                    />
                    <rect x="10" y="10" width="52" height="6" rx="2" fill={c.color} opacity="0.85" />
                    <rect x="10" y="22" width="40" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.55" />
                    <rect x="10" y="32" width="46" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.55" />
                    <rect x="10" y="42" width="32" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.55" />
                    <text
                        x="36"
                        y="58"
                        textAnchor="middle"
                        fill="rgb(var(--muted-foreground))"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="9"
                    >
                        clinic-{c.label.toLowerCase()}
                    </text>
                </g>
            ))}

            {/* Channels (vertical lines clinic → DB). */}
            {channels.map((c) => (
                <line
                    key={`line-${c.label}`}
                    x1={c.x}
                    y1={94}
                    x2={c.x}
                    y2={210}
                    stroke={c.color}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.6"
                />
            ))}

            {/* Blocked cross-tenant path. */}
            <g>
                <path
                    d="M 80 150 C 130 150, 190 200, 220 200"
                    stroke="rgb(var(--destructive))"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    fill="none"
                    opacity="0.55"
                />
                <g transform="translate(150, 168)">
                    <circle r="11" fill="rgb(var(--destructive))" />
                    <path
                        d="M -4 -4 L 4 4 M -4 4 L 4 -4"
                        stroke="rgb(var(--destructive-foreground))"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </g>
            </g>

            {/* Database canisters (bottom). */}
            {channels.map((c) => (
                <g key={`db-${c.label}`} transform={`translate(${c.x - 40}, 210)`}>
                    {/* DB body. */}
                    <rect
                        width="80"
                        height="78"
                        rx="14"
                        fill="rgb(var(--card))"
                        stroke="rgb(var(--border))"
                    />
                    <ellipse cx="40" cy="20" rx="32" ry="8" fill={c.color} opacity="0.18" />
                    <ellipse cx="40" cy="20" rx="32" ry="8" fill="none" stroke={c.color} opacity="0.85" />
                    <path
                        d="M 8 20 L 8 56"
                        stroke={c.color}
                        opacity="0.85"
                        fill="none"
                    />
                    <path
                        d="M 72 20 L 72 56"
                        stroke={c.color}
                        opacity="0.85"
                        fill="none"
                    />
                    <ellipse cx="40" cy="56" rx="32" ry="8" fill="none" stroke={c.color} opacity="0.85" />
                    {/* Padlock. */}
                    <g transform="translate(28, 32)">
                        <rect width="24" height="20" rx="4" fill={c.color} />
                        <path
                            d="M 6 -2 v -4 a 6 6 0 0 1 12 0 v 4"
                            stroke={c.color}
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                        />
                        <circle cx="12" cy="10" r="2" fill="rgb(var(--card))" />
                    </g>
                    <text
                        x="40"
                        y="72"
                        textAnchor="middle"
                        fill="rgb(var(--muted-foreground))"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="8"
                    >
                        einaya_tenant_{c.label.toLowerCase()}
                    </text>
                </g>
            ))}
        </svg>
    );
}
