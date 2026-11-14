type Cell = string | number | boolean | null | undefined;

function cell(value: Cell) {
    if (value === null || value === undefined) return '';
    let text = String(value);
    // Stop spreadsheet apps from treating text as a formula (CSV injection),
    // but leave plain numbers like "-1500.00" alone.
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text) && !/^[-+]?\d+(\.\d+)?$/.test(text)) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** RFC 4180 CSV with a header row and a BOM so Excel reads UTF-8 correctly. */
export function toCsv(header: string[], rows: Cell[][]) {
    return '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}
