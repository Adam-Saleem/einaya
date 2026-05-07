/**
 * Stylised mockup of the Einaya tenant dashboard. Pure SVG so it adapts to
 * the active token palette via `currentColor` and the few `rgb(var(--…))`
 * fills below. The mockup shows the sidebar, three stat cards, a "today's
 * queue" table, and a small chart strip — the four surfaces a clinic owner
 * would notice in the first 5 seconds of demoing the product.
 */
export function HeroDashboard({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 540 360"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Einaya dashboard preview"
            role="img"
        >
            <defs>
                <linearGradient id="hero-glow" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="rgb(var(--success))" stopOpacity="0.10" />
                </linearGradient>
                <linearGradient id="hero-spark" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0" />
                    <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity="0.4" />
                </linearGradient>
            </defs>

            {/* Outer browser-style window. */}
            <rect
                x="6"
                y="6"
                width="528"
                height="348"
                rx="16"
                fill="rgb(var(--card))"
                stroke="rgb(var(--border))"
            />
            <rect x="6" y="6" width="528" height="36" rx="16" fill="rgb(var(--muted))" />
            <circle cx="22" cy="24" r="4" fill="#F87171" />
            <circle cx="36" cy="24" r="4" fill="#FBBF24" />
            <circle cx="50" cy="24" r="4" fill="#34D399" />
            <rect
                x="120"
                y="14"
                width="300"
                height="20"
                rx="6"
                fill="rgb(var(--background))"
                stroke="rgb(var(--border))"
            />
            <text
                x="270"
                y="29"
                textAnchor="middle"
                fill="rgb(var(--muted-foreground))"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
            >
                demo.einaya.test
            </text>

            {/* Sidebar (cyan-900). */}
            <rect x="6" y="42" width="120" height="312" fill="rgb(var(--sidebar))" />
            <rect x="22" y="62" width="36" height="6" rx="3" fill="rgb(var(--sidebar-foreground))" opacity="0.85" />
            <rect x="22" y="74" width="48" height="4" rx="2" fill="rgb(var(--sidebar-foreground))" opacity="0.45" />

            {/* Sidebar items. */}
            {[100, 124, 148, 172, 196, 220].map((y, i) => (
                <g key={y}>
                    <rect
                        x="14"
                        y={y - 8}
                        width="104"
                        height="22"
                        rx="6"
                        fill={i === 0 ? 'rgb(var(--sidebar-accent))' : 'transparent'}
                    />
                    <rect
                        x="22"
                        y={y - 2}
                        width="14"
                        height="10"
                        rx="2"
                        fill="rgb(var(--sidebar-foreground))"
                        opacity={i === 0 ? 1 : 0.6}
                    />
                    <rect
                        x="42"
                        y={y - 1}
                        width="64"
                        height="8"
                        rx="2"
                        fill="rgb(var(--sidebar-foreground))"
                        opacity={i === 0 ? 1 : 0.6}
                    />
                </g>
            ))}

            {/* Page header. */}
            <rect x="146" y="58" width="160" height="14" rx="3" fill="rgb(var(--foreground))" opacity="0.9" />
            <rect x="146" y="78" width="220" height="8" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.6" />

            {/* Three stat cards. */}
            {[0, 1, 2].map((i) => (
                <g key={i} transform={`translate(${146 + i * 130}, 100)`}>
                    <rect
                        width="120"
                        height="68"
                        rx="10"
                        fill="rgb(var(--card))"
                        stroke="rgb(var(--border))"
                    />
                    <rect x="12" y="14" width="64" height="6" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.6" />
                    <text
                        x="12"
                        y="44"
                        fill="rgb(var(--foreground))"
                        fontFamily="Manrope, sans-serif"
                        fontWeight="700"
                        fontSize="20"
                    >
                        {['18', '6', '₪3,420'][i]}
                    </text>
                    <rect
                        x="12"
                        y="52"
                        width="40"
                        height="4"
                        rx="2"
                        fill={
                            i === 1
                                ? 'rgb(var(--warning))'
                                : 'rgb(var(--success))'
                        }
                        opacity="0.85"
                    />
                </g>
            ))}

            {/* Sparkline chart card (right of stats, second row). */}
            <g transform="translate(146, 184)">
                <rect width="250" height="158" rx="12" fill="rgb(var(--card))" stroke="rgb(var(--border))" />
                <rect x="14" y="14" width="120" height="10" rx="2" fill="rgb(var(--foreground))" opacity="0.85" />
                <rect x="14" y="30" width="80" height="6" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.6" />

                {/* Filled spark. */}
                <path
                    d="M 14 130 Q 50 100, 70 110 T 130 92 T 190 70 T 234 60 L 234 142 L 14 142 Z"
                    fill="url(#hero-spark)"
                />
                <path
                    d="M 14 130 Q 50 100, 70 110 T 130 92 T 190 70 T 234 60"
                    fill="none"
                    stroke="rgb(var(--primary))"
                    strokeWidth="2"
                />
                {/* Dots. */}
                {[
                    [14, 130],
                    [70, 110],
                    [130, 92],
                    [190, 70],
                    [234, 60],
                ].map(([cx, cy]) => (
                    <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill="rgb(var(--primary))" />
                ))}
            </g>

            {/* Queue card. */}
            <g transform="translate(404, 184)">
                <rect
                    width="124"
                    height="158"
                    rx="12"
                    fill="url(#hero-glow)"
                    stroke="rgb(var(--border))"
                />
                <rect x="12" y="14" width="64" height="10" rx="2" fill="rgb(var(--foreground))" opacity="0.85" />
                {[40, 64, 88, 112, 136].map((y, i) => (
                    <g key={y}>
                        <circle
                            cx="22"
                            cy={y}
                            r="8"
                            fill={i === 0 ? 'rgb(var(--success))' : 'rgb(var(--secondary))'}
                            opacity={i === 0 ? 1 : 0.7}
                        />
                        <text
                            x="22"
                            y={y + 3}
                            textAnchor="middle"
                            fill={i === 0 ? 'rgb(var(--success-foreground))' : 'rgb(var(--secondary-foreground))'}
                            fontFamily="JetBrains Mono, monospace"
                            fontSize="9"
                            fontWeight="600"
                        >
                            {i + 1}
                        </text>
                        <rect
                            x="36"
                            y={y - 5}
                            width="60"
                            height="4"
                            rx="2"
                            fill="rgb(var(--foreground))"
                            opacity="0.75"
                        />
                        <rect
                            x="36"
                            y={y + 3}
                            width="36"
                            height="3"
                            rx="2"
                            fill="rgb(var(--muted-foreground))"
                            opacity="0.6"
                        />
                    </g>
                ))}
            </g>
        </svg>
    );
}
