import path from 'node:path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './server/db';
import { generateNotifications } from './server/notifications';

// Apply pending migrations so a fresh install or an upgrade needs no manual step.
migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });

// Check for due items every minute. One process serves the whole app, so an
// in-process timer is enough; guard against double registration in dev.
const globalForJobs = globalThis as unknown as { lifeplannerJobs?: NodeJS.Timeout };
if (!globalForJobs.lifeplannerJobs) {
    const run = () => {
        try {
            generateNotifications();
        } catch (error) {
            console.error('[lifeplanner] notification check failed', error);
        }
    };
    run();
    globalForJobs.lifeplannerJobs = setInterval(run, 60_000);
    globalForJobs.lifeplannerJobs.unref();
}
