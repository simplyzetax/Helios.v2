import jwt, { type JwtPayload } from 'jsonwebtoken';
import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';

import UserWrapper from '../database/wrappers/user';
import TokenStore from '../utils/tokenstore';
import type { User } from '../models/user';
import { ApiError, nexus } from '../utils/error';
import DateUtil from '../utils/date';
import { HTTPException } from 'hono/http-exception';

const extractTokenFromHeader = (header: string | undefined): string | undefined => {
    return header?.replace('bearer eg1~', '');
};

const isTokenActive = (token: string): boolean => {
    return !!TokenStore.activeAccessTokens.some((i) => i.token === `eg1~${token}`);
};

const isTokenExpired = (decodedToken: JwtPayload): boolean => {
    const expiryDate = DateUtil.dateAddTime(new Date(decodedToken.creation_date), decodedToken.hours_expire).getTime();
    return expiryDate <= Date.now();
};

const getUserFromToken = async (token: string): Promise<User | undefined> => {
    const decodedToken = jwt.decode(token) as JwtPayload;
    if (!decodedToken || !decodedToken.subject || !isTokenActive(token)) {
        return undefined;
    }

    if (isTokenExpired(decodedToken)) {
        return undefined;
    }

    const user = await UserWrapper.findUserById(decodedToken.subject);
    return user;
};

function nexusErrorToResponse(NexusError: ApiError) {
    const errorResponse = new Response('Unauthorized', {
        status: NexusError.statusCode,
        statusText: JSON.stringify(NexusError.response),
    });
    return errorResponse;
}

/**
 * Middleware function to verify the token in the authorization header.
 * If the token is valid, sets the user in the context and calls the next middleware.
 * If the token is invalid or missing, sets the appropriate error in the context.
 * @param c The context object containing the request and response.
 * @param next The next middleware function to be called.
 */
export const verifyTokenWithUser = createMiddleware(async (c) => {
    const token = extractTokenFromHeader(c.req.header('Authorization'));
    if (!token) {
        throw new HTTPException(401, { res: nexusErrorToResponse(nexus.authentication.invalidHeader) });
    }
    console.log('Token extracted from header:', token);

    const user = await getUserFromToken(token);
    if (!user) {
        console.log('No user found for token');
        //decode token and check if token type is client credential
        const decodedToken = jwt.decode(token) as JwtPayload;
        console.log('Decoded token:', decodedToken);
        if (decodedToken.authMethod === 'client_credentials') {
            console.log('Token is for client credentials');
            throw new HTTPException(401, { res: nexusErrorToResponse(nexus.authentication.usedClientToken) });
        }
        console.log('User not found');
        throw new HTTPException(401, { res: nexusErrorToResponse(nexus.authentication.invalidToken) });
    }

    console.log('User found:', user);
    c.user = user;
});

export const verifyToken = createMiddleware(async (c) => {
    await Bun.sleep(1);
    const token = extractTokenFromHeader(c.req.header('Authorization'));
    if (!token) {
        throw new HTTPException(401, { res: nexusErrorToResponse(nexus.authentication.invalidHeader) });
    }
    if(!isTokenActive(token)){
        throw new HTTPException(401, { res: nexusErrorToResponse(nexus.authentication.invalidToken) });
    }
});

export const getAuthUser = async (c: Context): Promise<User | undefined> => {
    const token = extractTokenFromHeader(c.req.header('Authorization'));
    if (!token) {
        return undefined;
    }

    return await getUserFromToken(token);
};
