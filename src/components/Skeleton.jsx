/**
 * Skeleton / shimmer placeholders for screens while data loads.
 *
 * The .shimmer CSS is defined in index.css and was unused until now — these
 * components wire it up so screens show a plausible loading shape rather than
 * flashing "No loads today" / zero counters before the first DB read resolves.
 */

/** Single shimmer line */
export function SkeletonLine({ className = '' }) {
    return <div className={`shimmer rounded h-4 ${className}`} />;
}

/** Skeleton card matching the ios-card style */
export function SkeletonCard({ lines = 2, className = '' }) {
    return (
        <div className={`ios-card p-4 ${className}`}>
            <SkeletonLine className="w-2/5 mb-3" />
            {Array.from({ length: lines }).map((_, i) => (
                <SkeletonLine
                    key={i}
                    className={`mb-2 ${i === lines - 1 ? 'w-1/3' : i % 2 === 0 ? 'w-3/4' : 'w-1/2'}`}
                />
            ))}
        </div>
    );
}

/** Skeleton list row matching ios-row */
export function SkeletonRow() {
    return (
        <div className="ios-row">
            <div className="shimmer ios-row-icon rounded-ios" />
            <div className="flex-1 space-y-2">
                <SkeletonLine className="w-2/5" />
                <SkeletonLine className="w-1/3 h-3" />
            </div>
        </div>
    );
}

/** Full card with multiple shimmer rows, separated by ios-separators */
export function SkeletonList({ rows = 3, className = '' }) {
    return (
        <div className={`ios-card ${className}`}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i}>
                    {i > 0 && <div className="ios-separator" />}
                    <SkeletonRow />
                </div>
            ))}
        </div>
    );
}

/** Pull-to-refresh spinner */
export function RefreshSpinner() {
    return (
        <div className="flex justify-center py-3">
            <div className="w-5 h-5 border-2 border-text-tertiary border-t-accent-blue rounded-full animate-spin" />
        </div>
    );
}
