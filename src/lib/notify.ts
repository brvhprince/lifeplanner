/** Which notification (if any) an upcoming item should produce right now. */
export function notificationKind(
    item: { date: string; time?: string; detail: string },
    now: { date: string; time: string }
): 'due' | 'ahead' | null {
    if (item.date <= now.date) {
        // Timed reminders fire at their time; everything else from the start of the day.
        if (item.date === now.date && item.time && item.time !== '00:00' && item.time > now.time) return null;
        return 'due';
    }
    // Heads-up for what's coming; reminders already have their own time.
    return item.detail === 'Reminder' ? null : 'ahead';
}
