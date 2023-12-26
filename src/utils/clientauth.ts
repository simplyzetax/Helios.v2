import { Context } from 'hono';
import jwt from 'jsonwebtoken';
import type { TOAuthClient } from '../types/oauth';
import TokenStore from './tokenstore';
import Logger from './logger';
import { JwtHelper } from './jwt';

export const authClients: TOAuthClient[] = [
    { id: 'ec684b8c687f479fadea3cb2ad83f5c6', secret: 'e1f31c211f28413186262d37a13fc84d', scopes: [] },
    { id: 'e0aca23dfb7348d6bad648bbe175a6e6', secret: 'ec684b8c687f479fadea3cb2ad83f5c6', scopes: ['SERVER'] }
];

export const getClient = (clientId: string, clientSecret?: string): TOAuthClient | undefined => authClients.find((client) => client.id === clientId && (!clientSecret || client.secret === clientSecret));

export const isValidClient = (clientId: string, clientSecret: string): boolean => getClient(clientId, clientSecret) !== undefined;

export const validateClientAndScope = (clientId: string, scope: string, clientSecret?: string): boolean => {
    const client = getClient(clientId, clientSecret);
    return client !== undefined && client.scopes.includes(scope);
};

export const getClientFromContext = (c: Context): TOAuthClient | undefined => {
    try {
        const auth = c.req.header('Authorization');
        if (!auth) {
            Logger.debug('No Authorization header found');
            return undefined;
        }

        const bearerTokenPattern = /^Bearer\s+(.+)/i;
        const match = auth.match(bearerTokenPattern);
        if (!match) {
            Logger.debug('Authorization header does not match Bearer token pattern');
            return undefined;
        }

        Logger.debug('Client auth token matches pattern');

        const token = match[1];
        const decodedClient = JwtHelper.getValidJwtPayload(jwt.decode(token));
        if (!decodedClient) {
            Logger.debug('Client auth token is invalid. Could not decode');
            return undefined;
        }
        Logger.debug('Client auth token is valid');

        const client = getClient(decodedClient.clientId);
        if (!client) {
            Logger.debug('No client found with decoded client ID');
            return undefined;
        }
        const clientTokenExists = !!TokenStore.activeClientTokens.find((clientToken) => clientToken.token === token);
        if (!clientTokenExists) {
            Logger.debug('No active client token found');
            return undefined;
        }

        Logger.debug('Client and active client token found');
        return client;
    } catch (error) {
        Logger.error('Error getting client from context:', error);
        return undefined;
    }
};

export const validateClient = (c: Context): boolean => getClientFromContext(c) !== undefined;
