export default function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    return (
        <div
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 overflow-hidden rounded-full bg-grey-200 dark:bg-dark-dark"
        >
            <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}
