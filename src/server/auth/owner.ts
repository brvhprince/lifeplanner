import 'server-only';
import { count } from 'drizzle-orm';
import { db, schema } from '@/server/db';

/** True once the owner account has been created during first-run setup. */
export function hasOwner() {
    const [{ total }] = db.select({ total: count() }).from(schema.users).all();
    return total > 0;
}
