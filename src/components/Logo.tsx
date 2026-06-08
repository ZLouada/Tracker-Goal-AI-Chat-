interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { glyph: "w-7 h-7", text: "text-lg" },
  md: { glyph: "w-9 h-9", text: "text-[22px]" },
  lg: { glyph: "w-12 h-12", text: "text-2xl" },
};

export function Logo({ size = "md", className = "" }: LogoProps) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`${s.glyph} rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-sm relative overflow-hidden`}
      >
        <svg viewBox="0 0 32 32" className="w-3/5 h-3/5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          {/* outer ring */}
          <circle cx="16" cy="16" r="10" />
          {/* inner ring */}
          <circle cx="16" cy="16" r="6" />
          {/* crosshair lines */}
          <line x1="16" y1="2" x2="16" y2="8" />
          <line x1="16" y1="24" x2="16" y2="30" />
          <line x1="2" y1="16" x2="8" y2="16" />
          <line x1="24" y1="16" x2="30" y2="16" />
          {/* center dot */}
          <circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className={`font-display font-bold text-foreground tracking-tight ${s.text}`}>
        Tracker<span className="text-primary">Goal</span>
      </span>
    </span>
  );
}
