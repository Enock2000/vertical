interface LogoProps {
    companyName?: string | null;
}

export default function Logo({ companyName }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
       <div className="flex items-center justify-center size-8">
            <svg
                width="32"
                height="32"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="size-full"
            >
                <g transform="translate(0, 5)">
                    <path d="M50 0 L100 50 L75 50 L75 100 L25 100 L25 50 L0 50 Z" fill="hsl(var(--foreground))" />
                    <circle cx="75" cy="20" r="15" fill="hsl(var(--primary))" />
                    <text
                        x="50"
                        y="50"
                        transform="rotate(90, 50, 50)"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="hsl(var(--background))"
                        fontSize="14"
                        fontWeight="bold"
                    >
                        <tspan x="50" dy="-1.5em">VERTICAL</tspan>
                        <tspan x="50" dy="1.2em">SYNC</tspan>
                        <tspan fontSize="8" dx="0.5em" dy="-0.2em">360°</tspan>
                    </text>
                </g>
            </svg>
       </div>
       <span className="text-xl font-bold text-foreground">{companyName || 'VerticalSync'}</span>
    </div>
  );
}
