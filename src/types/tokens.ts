export type TAccessToken = {
    accountId: string;
    token: string;
}

export type TRefreshToken = {
    accountId: string;
    token: string;
}

export type TClientToken = {
    ip: string;
    token: string;
}

export type TExchangeCode = {
    exchangeCode: string;
    accountId: string;
}