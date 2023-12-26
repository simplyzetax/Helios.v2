import { type MiddlewareHandler } from "hono";
import type { ApiError } from "../aids/error";
import { createMiddleware } from "hono/factory";

const ResponseEnhancementsMiddleware = () => createMiddleware(async (c, next) => {

    if (c.enhanced) {
        console.log(`Enhancement middleware already applied to ${c.req.url}`);
        return await next();
    }

    c.sendError = (error: ApiError) => {
        c.status(error.statusCode);
        return c.json(error);
    };

    c.sendIni = (ini: string) => {
        c.res.headers.set("Content-Type", "text/plain");
        return c.body(ini);
    };

    c.sendStatus = (statusCode: number) => {
        c.status(statusCode);
        return c.body(null);
    };

    console.log(`Enhancement middleware applied to ${c.req.url}`);
    
    c.enhanced = true;

    await next();
});

export default ResponseEnhancementsMiddleware;