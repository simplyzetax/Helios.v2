import { z } from "zod";
import ini from 'ini';
import path from "path";
import Logger from "./logger";

export const configSchema = z.object({
    JWT_SECRET: z.string(),
    matchmakerUrl: z.string(),
    databaseUrl: z.string(),
    logging: z.object({
        logLevel: z.string(),
        writeToFile: z.boolean(),
    }),
    dates: z.object({
        seasonStart: z.string(),
        seasonEnd: z.string(),
        seasonDisplayedEnd: z.string(),
        weeklyStoreEnd: z.string(),
        stwEventStoreEnd: z.string(),
        BRWeeklyStoreEnd: z.string(),
        BRDailyStoreEnd: z.string(),
        currentTime: z.string(),
    }),
});

const timeUntilSundayinMS = (date: Date) => {
    const day = date.getDay();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();

    return (7 - day) * 86400000 - hours * 3600000 - minutes * 60000 - seconds * 1000 - milliseconds;
}

const magicKeywords: { [key: string]: string } = {
    NOW: new Date().toISOString(),
    NOW_PLUS_24: new Date(new Date().getTime() + 86400000).toISOString(),
    NOW_PLUS_48: new Date(new Date().getTime() + 172800000).toISOString(),
    END_OF_WEEK: new Date(new Date().getTime() + timeUntilSundayinMS(new Date())).toISOString(),
}

export class Config {

    private static validatedConfig: z.infer<typeof configSchema>;
    public static config: z.infer<typeof configSchema>;

    /**
     * Validates the config file
     * @returns {Promise<z.infer<typeof configSchema>>}
     */
    public static async validate(): Promise<z.infer<typeof configSchema>> {

        const configFile = ini.parse(await Bun.file(path.join(import.meta.dir, "../../config.ini")).text());
    
        // Flatten the config object
        const flattenedConfig: any = {
            ...configFile.JWT,
            ...configFile.matchmaker,
            ...configFile.database,
            logging: configFile.logging,
            dates: configFile.dates
        };
    
        const parsedConfig: z.infer<typeof configSchema> = configSchema.parse(flattenedConfig);

        for (const [key, value] of Object.entries(parsedConfig)) {
            if (key === 'dates' && typeof value === 'object') {
                for (const [dateKey, dateValue] of Object.entries(value)) {
                    if (typeof dateValue === 'string' && magicKeywords[dateValue]) {
                        parsedConfig.dates[dateKey as keyof z.infer<typeof configSchema>['dates']] = magicKeywords[dateValue];
                    }
                }
            } else if (key !== 'logging' && typeof value === 'string' && magicKeywords[value]) {
                parsedConfig[key as keyof Omit<z.infer<typeof configSchema>, 'dates' | 'logging'>] = magicKeywords[value];
            }
        }

        this.validatedConfig = parsedConfig;

        return parsedConfig;
    }

    /**
     * Registers the config file and returns it
     * @returns {z.infer<typeof configSchema>}
     */
    public static register(): z.infer<typeof configSchema> {
        Logger.startup("Config registered 👌");
        this.config = this.validatedConfig;
        return this.config;
    }

    public static configLoaded(): Promise<void> {
        return new Promise((resolve) => {
            const intervalId = setInterval(() => {
                if (this.config) {
                    clearInterval(intervalId);
                    resolve();
                }
            }, 100);
        });
    }

}