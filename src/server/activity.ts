import 'server-only';
import { db, schema } from '@/server/db';

/** Records a security-relevant event. Never pass secrets in `metadata`. */
export function logActivity(userId: string, action: string, description?: string, metadata?: Record<string, unknown>) {
    db.insert(schema.activities).values({ userId, action, description, metadata }).run();
}
