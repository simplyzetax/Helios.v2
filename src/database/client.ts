import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from '../models/user';
import { config } from "..";

class DB {

    private static instanceCount = 0;

    public connection: Client;
    public client: NodePgDatabase<typeof schema>;
    private connectionUID: string;
    id: number;

    /**
     * Creates a new database instance
     */
    constructor() {
        this.connection = new Client({
            connectionString: config.databaseUrl,
        });

        this.client = drizzle(this.connection, { schema });

        const hasher = new Bun.SHA256();
        hasher.update(config.databaseUrl);
        this.connectionUID = hasher.digest('hex');

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
            console.log(`Database connection with id ${this.id} established 🙌`);
        } else {
            console.error(`Database connection test for id ${this.id} failed 😢`);
            return;
        }
    }
    
    /**
     * Disconnects from the database
     * @returns {Promise<void>}
     */
    async disconnect() {
        await this.connection.end();
    }

    /**
     * Runs migrations
     * @returns {Promise<void>}
     */
    async migrate() {
        //await migrate(this.client, { migrationsFolder: path.join(import.meta.dir, '../../drizzle/migrations/') });
    }

}

export default DB;