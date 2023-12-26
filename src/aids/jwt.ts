import jwt, { type JwtPayload } from 'jsonwebtoken';
import { and, eq } from 'drizzle-orm';

import TokenStore from './tokenstore';
import { config, db } from '..';
import Encoding from './encoding';
import type { User } from '../models/user';
import { tokens, type NewToken } from '../models/token';
import DateUtil from './date';
import UUID from './uuid';

export namespace JwtHelper {
    /**
     *
     * @param payload The payload to create the token with
     * @param hoursToExpire The amount of hours the token should be valid for
     * @returns The created token
     */
    function createToken(payload: any, hoursToExpire: number) {
        return jwt.sign(payload, config.JWT_SECRET, { expiresIn: `${hoursToExpire}h` });
    }

    /**
     *
     * @param clientId The client ID of the client that is requesting the token
     * @param grantType The grant type of the request
     * @param ipAddress The IP address of the client that is requesting the token
     * @param hoursToExpire The amount of hours the token should be valid for
     * @returns A promise that resolves to the client token
     */
    export async function createClientToken(clientId: string, grantType: string, ipAddress: string, hoursToExpire: number) {
        const payload = {
            payloadId: Encoding.encodeBase64(UUID.g()),
            clientService: 'fortnite',
            tokenType: 's',
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

    /**
     *
     * @param user The user to create the access token for
     * @param clientId The client ID of the client that is requesting the token
     * @param grantType The grant type of the request
     * @param deviceId The device ID of the device that is requesting the token
     * @param hoursToExpire The amount of hours the token should be valid for
     * @returns A promise that resolves to the access token
     */
    export async function createAccessToken(user: User, clientId: string, grantType: string, deviceId: string, hoursToExpire: number) {
        const payload = {
            app: 'fortnite',
            subject: user.accountId,
            deviceId,
            multiFactorAuth: false,
            clientId,
            displayName: user.username,
            authMethod: grantType,
            payloadId: Encoding.encodeBase64(UUID.g()),
            internalAccountId: user.accountId,
            securityLevel: 1,
            clientService: 'fortnite',
            tokenType: 's',
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
            type: 'access'
        };

        await db
            .delete(tokens)
            .where(and(eq(tokens.accountId, user.accountId), eq(tokens.type, 'access')))
            .execute();
        await db.insert(tokens).values(newToken).execute();

        return accessToken;
    }

    /**
     *
     * @param user The user to create the refresh token for
     * @param clientId The client ID of the client that is requesting the token
     * @param grantType The grant type of the request
     * @param deviceId The device ID of the device that is requesting the token
     * @param hoursToExpire The amount of hours the token should be valid for
     * @returns
     */
    export async function createRefreshToken(user: User, clientId: string, grantType: string, deviceId: string, hoursToExpire: number) {
        const payload = {
            subject: user.accountId,
            deviceId,
            tokenType: 'r',
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
            type: 'refresh'
        };

        await db
            .delete(tokens)
            .where(and(eq(tokens.accountId, user.accountId), eq(tokens.type, 'refresh')))
            .execute();
        await db.insert(tokens).values(newToken);

        return refreshToken;
    }

    /**
     *
     * @param token The token to check
     * @returns The payload of the token if it is valid
     */
    export function getValidJwtPayload(token: string | JwtPayload | null): JwtPayload | undefined {
        if (typeof token !== 'object' || !token) return undefined;
        console.log(token);
        if (typeof token.creationDate !== 'string' || typeof token.hoursExpire !== 'number') {
            throw new Error('Invalid JwtPayload');
        }
        return token;
    }

    /**
     *
     * @param token The token to check
     * @returns Whether or not the token is expired
     */
    export function isTokenExpired(token: string): boolean {
        const decoded = jwt.decode(token);
        if (!decoded) return false;

        if (Object.prototype.hasOwnProperty.call(decoded, 'refresh_token')) return false;

        const decodedToken = JwtHelper.getValidJwtPayload(decoded);
        if (!decodedToken) return false;
        return DateUtil.dateAddTime(new Date(decodedToken.creationDate), decodedToken.hoursExpire) < new Date();
    }
}
