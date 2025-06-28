// Types et interfaces pour le plugin pagedjs-server

export interface ServerConfig {
    port: number;
    publicPath: string;
    autoStart: boolean;
    watchExtensions: string[];
}

export interface ServerStatus {
    isRunning: boolean;
    port: number;
    lastModified: number;
    uptime: number;
}

// Types pour les logs
export type LogLevelType = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    level: LogLevelType;
    message: string;
    timestamp: number;
    category?: string;
}

export interface FileChangeEvent {
    filePath: string;
    fileName: string;
    extension: string;
    changeType: 'modify' | 'create' | 'delete';
    timestamp: number;
}

export interface HttpRequestContext {
    pathname: string;
    query: { [key: string]: string };
    method: string;
    headers: { [key: string]: string };
}

export interface HttpResponse {
    statusCode: number;
    headers: { [key: string]: string };
    body: string | Buffer;
}

export interface MimeTypeMap {
    [extension: string]: string;
}

export interface ReloadClient {
    id: string;
    lastCheck: number;
    userAgent?: string;
}