import { type Context, Hono, type Next } from 'hono';

import { loadRoutes } from './utils/routeloader';
import { Config } from './utils/config';
import DB from './database/client';
import ResponseEnhancementsMiddleware from './middleware/enhancement';
import UserAgentParsingMiddleware from './middleware/useragent';
import Logger from './utils/logger';
import { nexus } from './utils/error';

export const app = new Hono();

app.use('*', ResponseEnhancementsMiddleware());
app.use('*', UserAgentParsingMiddleware());
app.use('*', Logger.logRequest());

await Config.validate();
export const config = Config.register();

export const dbInstance = new DB();
await dbInstance.connect();
export const db = dbInstance.client;

await loadRoutes('../../src/routes/');

app.use('*', async (c: Context, next: Next) => {
    await next();
    if (c.nexusError) {
        Logger.error(c.nexusError.shortenedError(), c.nexusError.statusCode);
    }
});

Logger.startup('Helios started on port 3000 🚀');

app.notFound((c) => c.sendError(nexus.basic.notFound));

export default app;
