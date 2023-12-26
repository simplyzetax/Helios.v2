import jwt, { type JwtPayload } from "jsonwebtoken";
import { createMiddleware } from "hono/factory";
import type { Context } from "hono";

import UserWrapper from "../database/wrappers/user";
import TokenStore from "../aids/tokenstore";
import type { User } from "../models/user";
import { nexus } from "../aids/error";
import DateUtil from "../aids/date";

const extractTokenFromHeader = (header: string | undefined): string | undefined => {
    return header?.replace("bearer eg1~", "");
};

const isTokenActive = (token: string): boolean => {
    return !!TokenStore.activeAccessTokens.find((i) => i.token === `eg1~${token}`);
};

const isTokenExpired = (decodedToken: any): boolean => {
    const expiryDate = DateUtil.dateAddTime(new Date(decodedToken.creation_date), decodedToken.hours_expire).getTime();
    return expiryDate <= new Date().getTime();
};

const getUserFromToken = async (token: string): Promise<User | undefined> => {
    const decodedToken = jwt.decode(token) as JwtPayload;
    if (!decodedToken || !decodedToken.subject || !isTokenActive(token)) {
        return undefined;
    }

    if (isTokenExpired(decodedToken)) {
        return undefined;
    }

    let user = await UserWrapper.findUserById(decodedToken.subject);
    return user;
};

export const verifyToken = createMiddleware(async (c, next) => {
    const token = extractTokenFromHeader(c.req.header('Authorization'));
    if (!token) {
        console.error("No authorization header");
        c.nexusError = nexus.authentication.invalidHeader;
        return;
    }

    const user = await getUserFromToken(token);
    if (!user) {
        console.error("User not found");
        c.nexusError = nexus.authentication.invalidToken;
        return;
    }

    c.user = user;
    await next();
});

export const getAuthUser = async (c: Context): Promise<User | undefined> => {
    const token = extractTokenFromHeader(c.req.header('Authorization'));
    if (!token) {
        return undefined;
    }

    return getUserFromToken(token);
};