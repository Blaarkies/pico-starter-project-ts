import {
    IncomingMessage,
    ServerResponse,
} from 'http';

export const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'ico': 'image/x-icon',
    'webp': 'image/webp',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'csv': 'text/csv',
    'xml': 'application/xml',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
    'mp3': 'audio/mpeg',
};

export interface ServerConfig {
    port?: number;
    assetsPath?: string;
    logger?: Logger;
    concurrency?: number;
}

export type LoggerSeverity = 'info' | 'warn' | 'error';

export interface Logger {
    log(message: string, severity?: LoggerSeverity): void;
}

export type HttpMethod = 'GET' | 'POST';
type RouteFn = (req: IncomingMessage, res: ServerResponse) => void;
type RouteFnAsync
    = (req: IncomingMessage, res: ServerResponse) => Promise<void>;
export type RouteHandler = RouteFn | RouteFnAsync;