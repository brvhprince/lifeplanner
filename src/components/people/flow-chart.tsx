'use client';

import { useState } from 'react';
import type { ChartMonth } from '@/server/finance/people';

const SERIES = [
    { key: 'given', text: 'givenText', label: 'Given', color: 'var(--viz-series-1)' },
    { key: 'received', text: 'receivedText', label: 'Received', color: 'var(--viz-series-2)' },
] as const;

/**
 * Given vs received per month: grouped columns with a hover/focus tooltip and
 * a table view. All labels arrive pre-formatted from the server.
 */
export default function FlowChart({
    months,
    currency,
    max,
    ticks,
}: {
    months: ChartMonth[];
    currency: string;
    max: number;
    ticks: { value: number; label: string }[];
}) {
    const [active, setActive] = useState<number | null>(null);

    return (
        <figure className="viz">
            <figcaption className="mb-3 flex flex-wrap items-center gap-4 text-caption text-body-muted">
                <span>Last 12 months · {currency}</span>
                {SERIES.map((s) => (
                    <span key={s.key} className="inline-flex items-center gap-1.5 text-body-light dark:text-body-dark">
                        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                        {s.label}
                    </span>
                ))}
            </figcaption>

            <div className="relative flex h-44 gap-0 pl-14" onMouseLeave={() => setActive(null)}>
                {/* Gridlines and tick labels */}
                {ticks.map((tick) => (
                    <div key={tick.value} className="pointer-events-none absolute inset-x-0" style={{ bottom: `${(tick.value / max) * 100}%` }}>
                        <div className="ml-14 border-t" style={{ borderColor: tick.value === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)' }} />
                        <span className="absolute -top-2 left-0 w-12 text-right text-[10px] tabular-nums text-body-muted">{tick.label}</span>
                    </div>
                ))}

                {months.map((m, i) => (
                    <button
                        key={m.month}
                        type="button"
                        className="relative flex h-full flex-1 items-end justify-center gap-[2px] outline-none focus-visible:bg-grey-200/60 dark:focus-visible:bg-dark-light/20"
                        aria-label={`${m.long}: given ${m.givenText}, received ${m.receivedText}`}
                        onMouseEnter={() => setActive(i)}
                        onFocus={() => setActive(i)}
                        onBlur={() => setActive(null)}
                        onClick={() => setActive(active === i ? null : i)}
                    >
                        {SERIES.map((s) => (
                            <span
                                key={s.key}
                                aria-hidden="true"
                                className="w-[38%] max-w-[14px] rounded-t transition-opacity"
                                style={{
                                    height: `${(m[s.key] / max) * 100}%`,
                                    minHeight: m[s.key] > 0 ? 2 : 0,
                                    background: s.color,
                                    opacity: active === null || active === i ? 1 : 0.45,
                                }}
                            />
                        ))}
                        {active === i && (
                            <span
                                role="tooltip"
                                className="pointer-events-none absolute bottom-full z-10 mb-1 w-max rounded-md border border-light-300 bg-white px-3 py-2 text-left text-caption shadow-medium dark:border-dark-light/30 dark:bg-dark"
                                style={{ left: i > months.length / 2 ? 'auto' : 0, right: i > months.length / 2 ? 0 : 'auto' }}
                            >
                                <span className="mb-1 block font-semibold text-heading-dark dark:text-heading-light">{m.long}</span>
                                {SERIES.map((s) => (
                                    <span key={s.key} className="flex items-center gap-1.5 text-body-light dark:text-body-dark">
                                        <span aria-hidden="true" className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                                        {s.label}: <span className="font-semibold tabular-nums">{m[s.text]}</span>
                                    </span>
                                ))}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-1 flex pl-14 text-[10px] text-body-muted">
                {months.map((m, i) => (
                    <span key={m.month} className="flex-1 text-center">
                        {/* Every other label on small screens to avoid collisions */}
                        <span className={i % 2 ? 'hidden sm:inline' : undefined}>{m.short}</span>
                    </span>
                ))}
            </div>

            <details className="mt-3 text-caption">
                <summary className="cursor-pointer font-semibold text-brand">Show as table</summary>
                <table className="mt-2 w-full text-left tabular-nums">
                    <thead className="text-body-muted">
                        <tr>
                            <th className="py-1 font-medium">Month</th>
                            <th className="py-1 text-right font-medium">Given</th>
                            <th className="py-1 text-right font-medium">Received</th>
                        </tr>
                    </thead>
                    <tbody>
                        {months.map((m) => (
                            <tr key={m.month} className="border-t border-light-300 dark:border-dark-light/20">
                                <td className="py-1">{m.long}</td>
                                <td className="py-1 text-right">{m.givenText}</td>
                                <td className="py-1 text-right">{m.receivedText}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </figure>
    );
}
