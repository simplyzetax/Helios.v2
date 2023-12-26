import jwt, { type JwtPayload } from "jsonwebtoken";
import { and, eq } from "drizzle-orm";

import TokenStore from "./tokenstore";
import { config, db } from "..";
import Encoding from "./encoding";
import type { User } from "../models/user";
import { tokens, type NewToken } from "../models/token";
import DateUtil from "./date";
import UUID from "./uuid";

export namespace JwtHelper {
    function createToken(payload: any, hoursToExpire: number) {
        return jwt.sign(payload, config.JWT_SECRET, { expiresIn: `${hoursToExpire}h` });
    }

    export async function createClientToken(clientId: string, grantType: string, ipAddress: string, hoursToExpire: number) {
        const payload = {
            payloadId: Encoding.encodeBase64(UUID.g()),
            clientService: "fortnite",
            tokenType: "s",
            multiFactorAuth: false,
            clientId,
            internalClient: true,
            authMethod: grantType,
            jwtId: UUID.g(),
            creationDate: new Date(),
            hoursExpire: hoursToExpire
        };

        const clientToken = createToken(payload, hoursToExpire);

        TokenStore.activeClientTokens.push({ ip: ipAddress, token: `eg1~${clientToken}` });
        return clientToken;
    }

    export async function createAccessToken(user: User, clientId: string, grantType: string, deviceId: string, hoursToExpire: number) {
        const payload = {
            app: "fortnite",
            subject: user.accountId,
            deviceId,
            multiFactorAuth: false,
            clientId,
            displayName: user.username,
            authMethod: grantType,
            payloadId: Encoding.encodeBase64(UUID.g()),
            internalAccountId: user.accountId,
            securityLevel: 1,
            clientService: "fortnite",
            tokenType: "s",
            internalClient: true,
            jwtId: UUID.g(),
            creationDate: new Date(),
            hoursExpire: hoursToExpire
        };

        const accessToken = createToken(payload, hoursToExpire);
        TokenStore.activeAccessTokens.push({ accountId: user.accountId, token: `eg1~${accessToken}` });

        const newToken: NewToken = {
            accountId: user.accountId,
            token: `eg1~${accessToken}`,
            type: "access",
            ip: null
        };

        await db.delete(tokens).where(and(eq(tokens.accountId, user.accountId), eq(tokens.type, "access"))).execute();
        await db.insert(tokens).values(newToken).execute();

        return accessToken;
    }

    export async function createRefreshToken(user: User, clientId: string, grantType: string, deviceId: string, hoursToExpire: number) {
        const payload = {
            subject: user.accountId,
            deviceId,
            tokenType: "r",
            clientId,
            authMethod: grantType,
            jwtId: UUID.g(),
            creationDate: new Date(),
            hoursExpire: hoursToExpire
        };

        const refreshToken = createToken(payload, hoursToExpire);
        TokenStore.activeRefreshTokens.push({ accountId: user.accountId, token: `eg1~${refreshToken}` });

        const newToken: NewToken = {
            accountId: user.accountId,
            token: `eg1~${refreshToken}`,
            type: "refresh",
            ip: undefined
        }

        await db.delete(tokens).where(and(eq(tokens.accountId, user.accountId), eq(tokens.type, "refresh"))).execute();
        await db.insert(tokens).values(newToken)

        return refreshToken;
    }

    export function isJwtPayload(token: JwtPayload): JwtPayload {
        if (typeof token.creationDate !== 'string' || typeof token.hoursExpire !== 'number') {
            throw new Error('Invalid JwtPayload');
        }
        return token;
    }

    export function isTokenExpired(token: string) {
        const decoded = jwt.decode(token);
        if (!decoded) return false;

        if (Object.prototype.hasOwnProperty.call(decoded, "refresh_token")) return false;

        const decodedToken = JwtHelper.isJwtPayload(decoded as JwtPayload);
        return DateUtil.dateAddTime(new Date(decodedToken.creationDate), decodedToken.hoursExpire) < new Date();
    }
}