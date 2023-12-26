import { Context } from "hono";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { TOAuthClient } from "../types/oauth";
import { JwtHelper } from "./jwt";
import TokenStore from "./tokenstore";
import { nexus } from "./error";
import Logger from "./logger";

export const authClients: TOAuthClient[] = [
    { id: "ec684b8c687f479fadea3cb2ad83f5c6", secret: "e1f31c211f28413186262d37a13fc84d", scopes: [] },
    { id: "e0aca23dfb7348d6bad648bbe175a6e6", secret: "ec684b8c687f479fadea3cb2ad83f5c6", scopes: ["SERVER"] }
]

export namespace OAuthUtility {

    /**
     * 
     * @param clientId The client ID to get the client from
     * @param clientSecret The client secret to get the client from (optional)
     * @returns The client that was found or undefined if no client was found
     */
    export const getClient = (clientId: string, clientSecret?: string): TOAuthClient | undefined =>
        authClients.find(client => client.id === clientId && (!clientSecret || client.secret === clientSecret));

        /**
         * 
         * @param clientId The client ID to validate
         * @param clientSecret The client secret to validate
         * @returns Whether the client is valid
         */
    export const isValidClient = (clientId: string, clientSecret: string): boolean =>
        getClient(clientId, clientSecret) !== undefined;

    /**
     * 
     * @param clientId The client ID to validate
     * @param scope The scope to validate
     * @param clientSecret The client secret to validate (optional)
     * @returns Whether the client and scope are valid
     */
    export const validateClientAndScope = (clientId: string, scope: string, clientSecret?: string): boolean => {
        const client = getClient(clientId, clientSecret);
        return client !== undefined && client.scopes.includes(scope);
    }

    /**
     * 
     * @param c The request context to get the client from
     * @returns The client that was found or undefined if no client was found
     */
    export const getClientFromContext = (c: Context): TOAuthClient | undefined => {
        try {
            const auth = c.req.header("Authorization");
            if (!auth) {
                Logger.debug("No Authorization header found");
                return undefined;
            }
    
            const bearerTokenPattern = /^Bearer\s+(.+)/i;
            const match = auth.match(bearerTokenPattern);
            if (!match) {
                Logger.debug("Authorization header does not match Bearer token pattern");
                return undefined;
            }

            Logger.debug("Client auth token matches pattern");
    
            const token = match[1];
            const decodedClient = JwtHelper.getValidJwtPayload(jwt.decode(token));
            if (!decodedClient) {
                Logger.debug("Client auth token is invalid. Could not decode");
                return undefined;
            }
            Logger.debug("Client auth token is valid");
    
            const client = getClient(decodedClient.clientId);
            if (!client) {
                Logger.debug("No client found with decoded client ID");
                return undefined;
            }
            const clientTokenExists = !!TokenStore.activeClientTokens.find(clientToken => clientToken.token === token);
            if (!clientTokenExists) {
                Logger.debug("No active client token found");
                return undefined;
            }
    
            Logger.debug("Client and active client token found");
            return client;
        } catch (error) {
            Logger.error("Error getting client from context:", error);
            return undefined;
        }
    }

    export const validateClient = (c: Context): boolean =>
        getClientFromContext(c) !== undefined;
}