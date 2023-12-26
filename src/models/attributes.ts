import { index, jsonb, pgTable, varchar, } from "drizzle-orm/pg-core";


export const Attributes = pgTable('Attributes', {
    profileId: varchar('profile_id', { length: 256 }).notNull(),
    key: varchar('key', { length: 256 }).notNull(),
    valueJSON: jsonb('value_json').notNull(),
    type: varchar('type', { length: 256 }).notNull(),
}, (Exchanges) => {
    return {
        idIndex: index('id_idx').on(Exchanges.profileId),
    }
});

export type Attribute = typeof Attributes.$inferSelect;
export type NewAttribute = typeof Attributes.$inferInsert;