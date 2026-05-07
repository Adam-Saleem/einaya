/**
 * Single SVG illustration used on the About page in place of stock photos.
 * Token-driven so it follows the active theme. Composition: a stylised
 * clinic floor — reception desk on the left, three patient cards
 * floating on the right, a soft pulse line crossing both.
 */
export function AboutScene({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 720 320"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="img"
        >
            <defs>
                <linearGradient id="about-bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="rgb(var(--success))" stopOpacity="0.06" />
                </linearGradient>
                <linearGradient id="about-pulse" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0" />
                    <stop offset="50%" stopColor="rgb(var(--primary))" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="rgb(var(--success))" stopOpacity="0" />
                </linearGradient>
            </defs>

            <rect width="720" height="320" rx="20" fill="url(#about-bg)" />

            {/* Soft dot grid backdrop. */}
            <g fill="rgb(var(--primary))" opacity="0.08">
                {Array.from({ length: 12 }).flatMap((_, row) =>
                    Array.from({ length: 24 }).map((_, col) => (
                        <circle
                            key={`${row}-${col}`}
                            cx={20 + col * 30}
                            cy={20 + row * 26}
                            r="1.5"
                        />
                    )),
                )}
            </g>

            {/* Reception desk panel (left). */}
            <g transform="translate(48, 70)">
                <rect width="240" height="180" rx="16" fill="rgb(var(--card))" stroke="rgb(var(--border))" />
                {/* Window strip. */}
                <rect x="20" y="20" width="200" height="46" rx="10" fill="rgb(var(--secondary))" />
                <circle cx="44" cy="43" r="8" fill="rgb(var(--primary))" />
                <rect x="60" y="36" width="120" height="6" rx="2" fill="rgb(var(--secondary-foreground))" opacity="0.85" />
                <rect x="60" y="48" width="80" height="4" rx="2" fill="rgb(var(--secondary-foreground))" opacity="0.55" />

                {/* Desk illustration. */}
                <rect x="20" y="84" width="200" height="60" rx="10" fill="rgb(var(--muted))" />
                <rect x="36" y="100" width="80" height="6" rx="2" fill="rgb(var(--foreground))" opacity="0.7" />
                <rect x="36" y="114" width="120" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.6" />
                <rect x="36" y="124" width="100" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.6" />

                {/* Stamp. */}
                <rect x="170" y="100" width="40" height="32" rx="6" fill="rgb(var(--success))" />
                <rect x="178" y="112" width="24" height="3" rx="1" fill="rgb(var(--success-foreground))" />
                <rect x="178" y="120" width="14" height="3" rx="1" fill="rgb(var(--success-foreground))" opacity="0.7" />

                {/* Tab. */}
                <rect x="20" y="156" width="200" height="14" rx="6" fill="rgb(var(--accent))" />
            </g>

            {/* Floating patient cards (right). */}
            {[
                { y: 32, name: 'L', accent: 'rgb(var(--primary))' },
                { y: 110, name: 'A', accent: 'rgb(var(--success))' },
                { y: 188, name: 'M', accent: 'rgb(var(--warning))' },
            ].map((card, i) => (
                <g key={i} transform={`translate(${336 + (i % 2 === 0 ? 0 : 30)}, ${card.y})`}>
                    <rect
                        width="320"
                        height="68"
                        rx="14"
                        fill="rgb(var(--card))"
                        stroke="rgb(var(--border))"
                    />
                    <circle cx="34" cy="34" r="14" fill={card.accent} opacity="0.18" />
                    <text
                        x="34"
                        y="39"
                        textAnchor="middle"
                        fill={card.accent}
                        fontFamily="Manrope, sans-serif"
                        fontWeight="700"
                        fontSize="14"
                    >
                        {card.name}
                    </text>
                    <rect x="58" y="22" width="120" height="6" rx="2" fill="rgb(var(--foreground))" opacity="0.85" />
                    <rect x="58" y="34" width="80" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.65" />
                    <rect x="58" y="44" width="160" height="4" rx="2" fill="rgb(var(--muted-foreground))" opacity="0.55" />

                    <rect x="240" y="24" width="60" height="20" rx="6" fill="rgb(var(--secondary))" />
                    <rect x="252" y="32" width="36" height="4" rx="2" fill="rgb(var(--secondary-foreground))" />
                </g>
            ))}

            {/* Pulse line crossing both columns. */}
            <path
                d="M 24 280 L 200 280 L 220 250 L 240 310 L 260 280 L 320 280 L 340 248 L 360 308 L 380 280 L 696 280"
                fill="none"
                stroke="url(#about-pulse)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
