export interface IAthenaItemAttributes {
    locker_slots_data?: {
        slots: {
            [key: string]: {
                items: string[];
                activeVariants: Array<{ variants: unknown[] } | null>;
            };
        };
    };
    use_count?: number;
    banner_icon_template?: string;
    locker_name?: string;
    banner_color_template?: string;
    item_seen?: boolean;
    favorite?: boolean;
    level?: number;
    max_level_bonus?: number;
    rnd_sel_cnt?: number;
    variants?: unknown[];
    xp?: number;
}

export interface IAthenaItem {
    [key: string]: {
        templateId: string;
        attributes: IAthenaItemAttributes;
        quantity: number;
    };
}

export interface IAthenaStatsAttributes {
    season_match_boost: number;
    loadouts: string[];
    rested_xp_overflow: number;
    mfa_reward_claimed: boolean;
    quest_manager: object;
    book_level: number;
    season_num: number;
    season_update: number;
    book_xp: number;
    permissions: object[];
    book_purchased: boolean;
    lifetime_wins: number;
    party_assist_quest: string;
    purchased_battle_pass_tier_offers: object[];
    rested_xp_exchange: number;
    level: number;
    xp_overflow: number;
    rested_xp: number;
    rested_xp_mult: number;
    accountLevel: number;
    competitive_identity: object;
    inventory_limit_bonus: number;
    last_applied_loadout: string;
    daily_rewards: object;
    xp: number;
    season_friend_match_boost: number;
    active_loadout_index: number;
    favorite_musicpack: string;
    favorite_glider: string;
    favorite_pickaxe: string;
    favorite_skydivecontrail: string;
    favorite_backpack: string;
    favorite_dance: string[];
    favorite_itemwraps: string[];
    favorite_character: string;
    favorite_loadingscreen: string;
}

export interface IAthenaProfile {
    created: string;
    updated: string;
    rvn: number;
    wipeNumber: number;
    accountId: string;
    profileId: string;
    version: string;
    items: IAthenaItem;
    stats: {
        attributes: IAthenaStatsAttributes;
    };
    commandRevision: number;
}