import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from '../models/user';
import { config } from "..";
import Logger from "../aids/logger";

class DB {

    private static instanceCount = 0;

    /**
     * The database connection
     */
    public connection: Client;

    /**
     * The database client to run queries with
     */
    public client: NodePgDatabase<typeof schema>;

    /**
     * The connection UID. Used for logging purposes
     */
    id: number;

    /**
     * Creates a new database instance
     */
    constructor() {
        this.connection = new Client({
            connectionString: config.databaseUrl,
        });

        this.client = drizzle(this.connection, { schema });
        this.id = DB.instanceCount++;

    }

    /**
     * Connects to the database and validates the connection
     * @returns {Promise<void>}
     */
    async connect(): Promise<void> {
        await this.connection.connect();

        const validate = (await this.connection.query("SELECT 1"));
        if (JSON.stringify(validate).includes('1')) {
            Logger.startup(`Database connection with id ${this.id} established 🙌`);
        } else {
            Logger.error(`Database connection test for id ${this.id} failed 😢`);
            return;
        }
    }
    
    /**
     * Disconnects from the database
     * @returns {Promise<void>}
     */
    async disconnect(): Promise<void> {
        await this.connection.end();
    }

    /**
     * Runs migrations
     * @returns {Promise<void>}
     */
    async migrate(): Promise<void> {
        //await migrate(this.client, { migrationsFolder: path.join(import.meta.dir, '../../drizzle/migrations/') });
    }

}

export default DB;