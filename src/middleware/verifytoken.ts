import jwt, { type JwtPayload } from "jsonwebtoken";
import TokenStore from "../aids/tokenstore";
import DateUtil from "../aids/date";
import UserWrapper from "../database/wrappers/user";
import { nexus } from "../aids/error";
import { createMiddleware } from "hono/factory";

export const verifyToken = createMiddleware(async (c, next) => {

    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
        console.error("No authorization header");
        c.nexusError = nexus.authentication.invalidHeader;
        return;
    }

    const token = authHeader.replace("bearer eg1~", "");
    const decodedToken = jwt.decode(token) as JwtPayload;

    if (!decodedToken || !decodedToken.subject || !isTokenActive(token)) {
        console.error("Token is not active");
        c.nexusError = nexus.authentication.invalidToken;
        return;
    }

    if (isTokenExpired(decodedToken)) {
        console.error("Expired token");
        c.nexusError = nexus.authentication.invalidToken;
        return;
    }

    const user = await UserWrapper.findUserById(decodedToken.subject);
    if (!user) {
        console.error("User not found");
        c.nexusError = nexus.authentication.invalidToken;
        return;
    }

    c.user = user;

    await next();
});

function isTokenActive(token: string): boolean {
    return !!TokenStore.activeAccessTokens.find((i) => i.token === `eg1~${token}`);
}

function isTokenExpired(decodedToken: any): boolean {
    const expiryDate = DateUtil.dateAddTime(new Date(decodedToken.creation_date), decodedToken.hours_expire).getTime();
    return expiryDate <= new Date().getTime();
}