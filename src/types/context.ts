import type { ApiError } from '../utils/error';
import type { User } from '../models/user';
import type { IVersion } from './version';

declare module 'hono' {
    interface Context {
        sendStatus: (status: number) => Response;
        sendError: (error: ApiError) => Response;
        sendIni: (ini: string) => Response;
        user?: User;
        enhanced: boolean;
        nexusError?: ApiError;
        memory: IVersion;
    }
}
