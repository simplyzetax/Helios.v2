import { pgTable, varchar, integer, uniqueIndex, } from "drizzle-orm/pg-core";

export const Profiles = pgTable('Profiles', {
    id: varchar('id', { length: 256 }).primaryKey(),
    accountId: varchar('account_id', { length: 256 }).notNull(),
    type: varchar('type', { length: 256 }).notNull(),
    revision: integer('revision').notNull(),
}, (profiles) => {
    return {
        accountIdIndex: uniqueIndex('accountId_idx').on(profiles.accountId),
        idIndex: uniqueIndex('id_idx').on(profiles.id),
    }
});

export type Profile = typeof Profiles.$inferSelect;
export type NewProfile = typeof Profiles.$inferInsert;
