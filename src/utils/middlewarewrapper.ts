import type { Context, Handler, Next } from 'hono';

type Middleware = (c: Context, next: Next) => Promise<Response | void> | void;

function withMiddleware(middlewares: Middleware[], handler: Handler): Handler {
    return async (c: Context, next: Next) => {
        try {
            for (const middleware of middlewares) {
                console.log(`Running middleware ${middleware.name}`);
                await middleware(c, next);
            }
            return handler(c, next);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(`Error in middleware: ${error.message}`);
                c.status(500);
                return c.json({ message: 'Internal server error', errorCause: error.message });
            } else {
                console.error(`Error in middleware: ${error}`);
                c.status(500);
                return c.json({ message: 'Internal server error', errorCause: error });
            }
        }
    };
}

export default withMiddleware;
