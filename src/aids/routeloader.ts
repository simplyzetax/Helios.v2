import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Dynamically loads all routes from a directory
 * @param dir The directory to load the routes from
 * @returns {Promise<void>}
 */
export async function loadRoutes(dir: string): Promise<void> {
    const entries = await fs.readdir(path.join(import.meta.dir, dir), { withFileTypes: true });

    for (const entry of entries) {
        const res = path.resolve("./src/routes/", entry.name);
        if (entry.isDirectory()) {
            await loadRoutes(res);
        } else {
            import(res);
        }
    }
}