import fs from 'node:fs/promises';
import path from 'node:path';
import Logger from './logger';

let count = 0;

/**
 * Dynamically loads all routes from a directory
 * @param dir The directory to load the routes from
 * @returns {Promise<void>}
 */
export async function loadRoutes(dir: string): Promise<void> {
    const entries = await fs.readdir(path.join(import.meta.dir, dir), { withFileTypes: true });

    for (const entry of entries) {
        count++;
        const res = path.resolve('./src/routes/', entry.name);
        if (entry.isDirectory()) {
            await loadRoutes(res);
        } else {
            import(res);
        }
    }
    Logger.startup(`Loaded ${count} route${count === 1 ? '' : 's'}`);
}
