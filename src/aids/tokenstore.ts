import type { TAccessToken, TClientToken, TExchangeCode, TRefreshToken } from "../types/tokens";

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

export default TokenStore;