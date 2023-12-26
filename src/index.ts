import { type Context, Hono, type Next } from "hono";

import { loadRoutes } from "./aids/routeloader";
import { Config } from "./aids/config";
import DB from "./database/client";
import ResponseEnhancementsMiddleware from "./middleware/extensions";
import UserAgentMiddleware from "./middleware/useragent";

export const app = new Hono();

app.use('*', ResponseEnhancementsMiddleware());
app.use('*', UserAgentMiddleware());

await Config.validate()
export const config = Config.register();

export const dbInstance = new DB();
await dbInstance.connect();
export const db = dbInstance.client;

await loadRoutes("../../src/routes/");

app.use('*', async (c: Context, next: Next) => {
    await next();
    console.log(c.nexusError ? "Nexus middleware error" : "No nexus middleware error")
});

console.log("Helios started on port 3000 🚀");

export default app;