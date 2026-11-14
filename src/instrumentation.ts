/**
 * Runs once when the server starts. Node-only work lives in a separate module
 * so it is never bundled for the Edge runtime.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./instrumentation-node');
    }
}
