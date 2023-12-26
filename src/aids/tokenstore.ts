import { db } from "..";
import { tokens } from "../models/token";
import type { TAccessToken, TClientToken, TExchangeCode, TRefreshToken } from "../types/tokens";
import Logger from "./logger";

/**
 * TokenStore
 * Stores all active tokens and exchange codes
 */
class TokenStore {

    public static activeAccessTokens: TAccessToken[] = [];
    public static activeRefreshTokens: TRefreshToken[] = [];
    public static activeClientTokens: TClientToken[] = [];

    public static exchangeCodes: TExchangeCode[] = [];

    /**
     * Clears all tokens and exchange codes and resets the store
     */
    public static clear() {
        TokenStore.activeAccessTokens = [];
        TokenStore.activeRefreshTokens = [];
        TokenStore.activeClientTokens = [];
        TokenStore.exchangeCodes = [];
    }
}

const fetchedTokens = await db.select().from(tokens);
Logger.startup("Fetched tokens from database 🐢");
for (const token of fetchedTokens) {
	if (token.type === "access") {
		TokenStore.activeAccessTokens.push({
			accountId: token.accountId!,
			token: `${token.token}`,
		});
	} else if (token.type === "refresh") {
		TokenStore.activeRefreshTokens.push({
			accountId: token.accountId!,
			token: `${token.token}`,
		});
	}
}

export default TokenStore;