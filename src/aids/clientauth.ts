import { Context } from "hono";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { TOAuthClient } from "../types/oauth";
import { JwtHelper } from "./jwt";
import TokenStore from "./tokenstore";

export const authClients: TOAuthClient[] = [
    { id: "ec684b8c687f479fadea3cb2ad83f5c6", secret: "e1f31c211f28413186262d37a13fc84d", scopes: [] },
    { id: "e0aca23dfb7348d6bad648bbe175a6e6", secret: "ec684b8c687f479fadea3cb2ad83f5c6", scopes: ["SERVER"] }
]

export namespace OAuthUtility {
    export const getClient = (clientId: string, clientSecret?: string): TOAuthClient | undefined =>
        authClients.find(client => client.id === clientId && (!clientSecret || client.secret === clientSecret));

    export const isValidClient = (clientId: string, clientSecret: string): boolean =>
        getClient(clientId, clientSecret) !== undefined;

    export const clientHasScope = (clientId: string, scope: string): boolean => {
        const client = getClient(clientId);
        return client !== undefined && client.scopes.includes(scope);
    }

    export const validateClientAndScope = (clientId: string, clientSecret: string, scope: string): boolean => {
        const client = getClient(clientId, clientSecret);
        return client !== undefined && client.scopes.includes(scope);
    }

    export const getClientFromContext = (c: Context): TOAuthClient | undefined => {
        const auth = c.req.header("Authorization");
        if (!auth) return undefined;

        const bearerTokenPattern = /^Bearer\s+(.+)/i;
        const match = auth.match(bearerTokenPattern);
        if (!match) return undefined;

        const token = match[1];
        const decodedClient = JwtHelper.isJwtPayload(jwt.decode(token) as JwtPayload);
        if (!decodedClient) return undefined;

        const client = getClient(decodedClient.clientId);
        if (!client || !TokenStore.activeClientTokens.find(clientToken => clientToken.token === token)) return undefined;

        return client;
    }

    export const validateClient = (c: Context): boolean =>
        getClientFromContext(c) !== undefined;
}