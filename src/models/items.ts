import { pgTable, varchar, integer, uniqueIndex, boolean, } from "drizzle-orm/pg-core";

export const Items = pgTable('Items', {
    id: varchar('id', { length: 256 }).primaryKey(),
    profileId: varchar('profile_id', { length: 256 }).notNull(),
    templateId: varchar('template_id', { length: 256 }).notNull(),
    quantity: integer('quantity').notNull(),
    favorite: boolean('favorite').notNull().default(false),
    seen: boolean('has_seen').notNull().default(false),
}, (users) => {
    return {
        idIndex: uniqueIndex('id_idx').on(users.id),
    }
});