import {
    IncomingMessage,
    ServerResponse,
} from 'http';

export let contentTypes = {
    html: 'text/html; charset=utf-8',
    plain: 'text/plain; charset=utf-8',
    json: 'text/json; charset=utf-8',
    javascript: 'text/javascript; charset=utf-8',
    css: 'text/css; charset=utf-8',
};

type ContentType = typeof contentTypes[keyof typeof contentTypes];

export interface RouteResult {
    status?: number;
    message?: string;
    contentType?: ContentType;
}

export type AsyncCallbackWithRequest<T> =
    (request: InstanceType<typeof IncomingMessage>) => Promise<T>;

export interface Redirector {
    handleRequest(request: IncomingMessage): string | undefined;
}

export type LoggingSeverity = 'info' | 'error';

export interface Logger {
    logsFilename: string;
    write: (message: string, severity?: LoggingSeverity) => void;
}

export interface HttpServerConfig {
    port?: number;
    onStartupFn?: (baseUrl: string) => void;
    routes?: Record<string, AsyncCallbackWithRequest<RouteResult>>;
    redirector?: Redirector;
    mode?: 'concurrent' | 'queue-fifo';
    requestTimeLimit?: number;
    logger?: Logger;
}

export interface NewMessage {
    request: IncomingMessage;
    response: ServerResponse;
}
