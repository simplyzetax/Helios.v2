import { eq, sql } from "drizzle-orm";
import { users, type User } from "../../models/user";
import { db } from "../..";

const preparedQueries = {
    findUserById: db.select().from(users).where(eq(users.accountId, sql.placeholder('accountId'))).prepare("findUserById"),
    findUserByEmail: db.select().from(users).where(eq(users.email, sql.placeholder('email'))).prepare("findUserByEmail"),
    findUserByDiscordId: db.select().from(users).where(eq(users.discordId, sql.placeholder('discordId'))).prepare("findUserByDiscordId"),
    findUserByUsername: db.select().from(users).where(eq(users.username, sql.placeholder('username'))).prepare("findUserByUsername"),
    findUserByUsernameLower: db.select().from(users).where(eq(users.usernameLower, sql.placeholder('usernameLower'))).prepare("findUserByUsernameLower"),
};

class UserWrapper {
    static async findUserById(accountId: string): Promise<User | undefined> {
        const [user] = await preparedQueries.findUserById.execute({ accountId });
        return user;
    }

    static async findUserByEmail(email: string): Promise<User | undefined> {
        const [user] = await preparedQueries.findUserByEmail.execute({ email });
        return user;
    }

    static async findUserByDiscordId(discordId: string): Promise<User | undefined> {
        const [user] = await preparedQueries.findUserByDiscordId.execute({ discordId });
        return user;
    }

    static async findUserByUsername(username: string): Promise<User | undefined> {
        const [user] = await preparedQueries.findUserByUsername.execute({ username });
        return user;
    }

    static async findUserByUsernameLower(usernameLower: string): Promise<User | undefined> {
        const [user] = await preparedQueries.findUserByUsernameLower.execute({ usernameLower });
        return user;
    }

    static async createUser(accountId: string, username: string, usernameLower: string, discordId: string, email: string, password: string): Promise<void> {
        await db.insert(users).values({
            accountId,
            username,
            usernameLower,
            discordId,
            email,
            password,
            reports: 0,
            banned: false,
        });
    }
}

export default UserWrapper;