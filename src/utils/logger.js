/**
 * Premium Logger for BananaClicker
 * Bananaaa
 */

const IS_DEV = import.meta.env ? import.meta.env.DEV : true;

const COLORS = {
    info: "#3b82f6",
    success: "#10b981",
    warn: "#f59e0b",
    error: "#ef4444",
    debug: "#8b5cf6",
    banana: "#fbbf24"
};

const ICONS = {
    info: "ℹ️",
    success: "✅",
    warn: "⚠️",
    error: "❌",
    debug: "🔍",
    banana: "🍌"
};

class Logger {
    constructor(prefix = "BananaClicker") {
        this.prefix = prefix;
    }

    _format(level, message) {
        const color = COLORS[level] || COLORS.info;
        const icon = ICONS[level] || ICONS.info;
        return [
            `%c${icon} [${this.prefix}] %c${message}`,
            `color: ${color}; font-weight: bold;`,
            "color: inherit; font-weight: normal;"
        ];
    }

    info(message, ...args) {
        if (!IS_DEV) return;
        const [fmt, ...styles] = this._format("info", message);
        console.log(fmt, ...styles, ...args);
    }

    success(message, ...args) {
        if (!IS_DEV) return;
        const [fmt, ...styles] = this._format("success", message);
        console.log(fmt, ...styles, ...args);
    }

    warn(message, ...args) {
        const [fmt, ...styles] = this._format("warn", message);
        console.warn(fmt, ...styles, ...args);
    }

    error(message, ...args) {
        const [fmt, ...styles] = this._format("error", message);
        console.error(fmt, ...styles, ...args);
    }

    debug(message, ...args) {
        if (!IS_DEV) return;
        const [fmt, ...styles] = this._format("debug", message);
        console.debug(fmt, ...styles, ...args);
    }

    banana(message, ...args) {
        if (!IS_DEV) return;
        const [fmt, ...styles] = this._format("banana", message);
        console.log(fmt, ...styles, ...args);
    }

    /**
     * Raw log with custom styling
     */
    custom(message, style, ...args) {
        if (!IS_DEV) return;
        console.log(`%c[${this.prefix}] ${message}`, style, ...args);
    }
}

export const logger = new Logger();
export default logger;
