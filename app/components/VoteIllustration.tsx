export default function VoteIllustration() {
    // Pure inline SVG (no external image) — “students voting” vibe
    return (
        <svg viewBox="0 0 600 400" className="w-full h-auto" role="img" aria-label="Students voting illustration">
            <defs>
                <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0%" stopOpacity="0.08" />
                    <stop offset="100%" stopOpacity="0.14" />
                </linearGradient>
            </defs>

            {/* background */}
            <rect x="0" y="0" width="600" height="400" fill="url(#g1)" />

            {/* ballot box */}
            <rect x="330" y="190" rx="8" width="150" height="110" fill="#2563eb" />
            <rect x="340" y="180" rx="4" width="130" height="18" fill="#1e40af" />
            <rect x="385" y="150" rx="3" width="40" height="35" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
            <line x1="405" x2="405" y1="150" y2="160" stroke="#0f172a" strokeWidth="2" />
            <line x1="405" x2="405" y1="165" y2="180" stroke="#0f172a" strokeWidth="2" />
            <line x1="398" x2="412" y1="165" y2="165" stroke="#0f172a" strokeWidth="2" />

            {/* student 1 */}
            <circle cx="120" cy="150" r="26" fill="#fde68a" stroke="#0f172a" />
            <rect x="92" y="180" rx="10" width="56" height="80" fill="#0ea5e9" />
            <rect x="112" y="205" rx="4" width="16" height="12" fill="#f8fafc" />
            <line x1="120" y1="217" x2="120" y2="260" stroke="#0f172a" strokeWidth="3" />
            <line x1="92" y1="260" x2="148" y2="260" stroke="#0f172a" strokeWidth="3" />

            {/* student 2 */}
            <circle cx="230" cy="140" r="24" fill="#fca5a5" stroke="#0f172a" />
            <rect x="204" y="170" rx="10" width="52" height="85" fill="#22c55e" />
            <rect x="222" y="196" rx="3" width="16" height="10" fill="#f8fafc" />
            <line x1="230" y1="206" x2="230" y2="255" stroke="#0f172a" strokeWidth="3" />
            <line x1="204" y1="255" x2="256" y2="255" stroke="#0f172a" strokeWidth="3" />

            {/* subtle checkmarks */}
            <path d="M360 230 l10 10 l18 -22" fill="none" stroke="#f8fafc" strokeWidth="5" strokeLinecap="round" />
            <path d="M360 260 l10 10 l18 -22" fill="none" stroke="#bfdbfe" strokeWidth="5" strokeLinecap="round" />
        </svg>
    );
}
