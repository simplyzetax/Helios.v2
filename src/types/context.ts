import type { ApiError } from "../aids/error";
import type { User } from "../models/user";

declare module "hono" {
    interface Context {
        sendStatus: (status: number) => Response;
        sendError: (error: ApiError) => Response;
        sendIni: (ini: string) => Response;
        user?: User;
        enhanced: boolean;
        nexusError?: ApiError;
    }
}