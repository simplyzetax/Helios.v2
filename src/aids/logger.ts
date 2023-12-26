import chalk from 'chalk';
import { createMiddleware } from 'hono/factory';
import { config } from '..';
import Timing from './timing'

// Log levels enum
enum LogLevels {
    DEBUG = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3,
    CRITICAL = 4,
}

// Log levels map
const LogLevelsMap = {
    DEBUG: { name: "DEBUG", level: LogLevels.DEBUG },
    INFO: { name: "INFO", level: LogLevels.INFO },
    WARNING: { name: "WARNING", level: LogLevels.WARNING },
    ERROR: { name: "ERROR", level: LogLevels.ERROR },
    CRITICAL: { name: "CRITICAL", level: LogLevels.CRITICAL },
};

// Logger class
class Logger {
    // Middleware to log requests
    private static defaultLogLevel = LogLevels.INFO;

    // Get current log level
    private static getLogLevel() {
        return config && config.logging && config.logging.logLevel
            ? LogLevelsMap[config.logging.logLevel as keyof typeof LogLevelsMap].level
            : this.defaultLogLevel;
    }

    // Middleware to log requests
    public static logRequest = () => createMiddleware(async (c, next) => {
        if (this.getLogLevel() !== LogLevels.DEBUG) {
            return await next();
        }

        const timing = new Timing("logRequest");
        await next();

        let statusColor;
        if (c.res.status >= 500) statusColor = chalk.bgRed(` ${c.res.status} `);
        else if (c.res.status >= 400) statusColor = chalk.bgYellow(` ${c.res.status} `);
        else if (c.res.status >= 300) statusColor = chalk.bgCyan(` ${c.res.status} `);
        else statusColor = chalk.bgGreen(` ${c.res.status} `);

        console.log(chalk.gray(`${timing.startDateIso}`), chalk.bgBlue(` ${c.req.method} `), chalk.gray(`${c.req.url}`), statusColor, chalk.gray(`${timing.duration}ms`));
    });

    // Log methods
    public static debug = (...args: any[]) => {
        if(this.getLogLevel() > LogLevelsMap.DEBUG.level) return;
        console.log(chalk.bgBlue(` DEBUG `), ...args.map(arg => chalk.gray(`${arg}`)));
    }

    public static error = (...args: any[]) => {
        if(this.getLogLevel() > LogLevelsMap.ERROR.level) return;
        console.log(chalk.bgRed(` ERROR `), ...args.map(arg => chalk.gray(`${arg}`)));
    }

    public static warn = (...args: any[]) => {
        if(this.getLogLevel() > LogLevelsMap.WARNING.level) return;
        console.log(chalk.bgYellow(` WARN `), ...args.map(arg => chalk.gray(`${arg}`)));
    }

    public static info = (...args: any[]) => {
        if(this.getLogLevel() > LogLevelsMap.INFO.level) return;
        console.log(chalk.bgCyan(` INFO `), ...args.map(arg => chalk.gray(`${arg}`)));
    }

    public static startup = (...args: any[]) => {
        console.log( ...args.map(arg => chalk.gray(`${arg}`)));
    }
}

// Export Logger class
export default Logger;