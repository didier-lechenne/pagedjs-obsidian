import { LogEntry, LogLevelType } from '../types/interfaces';

export class Logger {
    private static instance: Logger;
    private logHistory: LogEntry[] = [];
    private maxHistorySize = 100;
    
    private constructor() {}
    
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    
    private log(level: LogLevelType, message: string, category?: string): void {
        const entry: LogEntry = {
            level,
            message,
            timestamp: Date.now(),
            category
        };
        
        this.logHistory.push(entry);
        
        // Limiter l'historique
        if (this.logHistory.length > this.maxHistorySize) {
            this.logHistory.shift();
        }
        
        // Affichage console avec emoji et couleur
        const emoji = this.getEmoji(level, category);
        const formattedMessage = `${emoji} [${category?.toUpperCase() || level.toUpperCase()}] ${message}`;
        
        switch (level) {
            case 'debug':
                console.debug(formattedMessage);
                break;
            case 'info':
                console.log(formattedMessage);
                break;
            case 'warn':
                console.warn(formattedMessage);
                break;
            case 'error':
                console.error(formattedMessage);
                break;
        }
    }
    
    private getEmoji(level: LogLevelType, category?: string): string {
        if (category) {
            const categoryEmojis: { [key: string]: string } = {
                'server': '🚀',
                'reload': '🔄',
                'status': '📡',
                'file': '📁',
                'request': '🌐',
                'error': '❌',
                'template': '🎨'
            };
            return categoryEmojis[category.toLowerCase()] || '📝';
        }
        
        const levelEmojis: { [key: string]: string } = {
            'debug': '🔍',
            'info': 'ℹ️',
            'warn': '⚠️',
            'error': '❌'
        };
        
        return levelEmojis[level] || '📝';
    }
    
    public debug(message: string, category?: string): void {
        this.log('debug', message, category);
    }
    
    public info(message: string, category?: string): void {
        this.log('info', message, category);
    }
    
    public warn(message: string, category?: string): void {
        this.log('warn', message, category);
    }
    
    public error(message: string, category?: string): void {
        this.log('error', message, category);
    }
    
    public getHistory(): LogEntry[] {
        return [...this.logHistory];
    }
    
    public clearHistory(): void {
        this.logHistory = [];
    }
}