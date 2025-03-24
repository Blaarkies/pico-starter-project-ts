import { lastItem } from 'common/enumerate';
import { overrideDefaults } from 'common/function';
import { FileLogger } from 'network/http-server/file-logger';
import { BasicRedirector } from 'network/http-server/redirector';
import {
    close,
    open,
    read,
    readFile,
} from 'fs';
import {
    createServer,
    IncomingMessage,
    Server,
    ServerResponse,
} from 'http';
import { Observable } from 'rxjs/internal/Observable';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError } from 'rxjs/internal/operators/catchError';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { map } from 'rxjs/internal/operators/map';
import { mergeMap } from 'rxjs/internal/operators/mergeMap';
import { Subject } from 'rxjs/internal/Subject';
import {
    AsyncCallbackWithRequest,
    contentTypes,
    HttpServerConfig,
    Logger,
    NewMessage,
    RouteResult,
} from './types';

export function makeHttpServer(argsConfig?: Partial<HttpServerConfig>) {
    let config = overrideDefaults<HttpServerConfig>({
        port: 80,
        routes: {},
        redirector: new BasicRedirector(argsConfig.routes ?? {}),
        mode: 'queue-fifo',
        requestTimeLimit: 5e3,
        logger: new FileLogger(),
    }, argsConfig);
    let logger = config.logger;

    let incomingMessage$ = new Subject<NewMessage>();
    let server = createServer((request, response) =>
        incomingMessage$.next({request, response}));

    let processingStream$ = getConcurrencyModeStream(
        config, incomingMessage$, logger);

    processingStream$.pipe(
        catchError(({request, response, error}, caught) => {
            let status = 500;
            let message = 'Internal server error';
            logger.write(`${message} HTTP${status} [${request.url}] [${
                    message.length} bytes]`,
                'error');
            logger.write(error.message + '\n', 'error');
            endResponse(response, status, contentTypes.plain, message);

            return caught;
        }),
    ).subscribe();

    server.listen(config.port, () => {
        let baseUrl = `http://${getServerIp(server)}:${config.port}`;
        logger.write(`Server running at ${baseUrl}\n`);

        config.onStartupFn?.(baseUrl);
    });

}

function getServerIp(server: Server): string {
    let ip = (server as any)._dev?.ip;

    if (!ip) {
        console.error(`>> [${now()}] IP address not available`);
        // throw new Error('IP address not available');
    }

    return ip || '127.0.0.1';
}

function now(): string {
    return new Date().toISOString();
}

function getConcurrencyModeStream(
    config: HttpServerConfig,
    incomingMessage$: Subject<NewMessage>,
    logger: Logger,
): Observable<NewMessage> {
    const handleMessage = ({request, response}): Observable<NewMessage> => {
        let p = processRequest(request, response, config, logger)
            .then(() => ({request, response}))
            .catch(error => {
                throw {error, request, response};
            });
        return fromPromise(p);
    };

    let time = Date.now;

    let timeoutFilteredStream$ = incomingMessage$.pipe(
        map(message => ({message, timestamp: time()})),
    );

    switch (config.mode) {
        case 'concurrent':
            return incomingMessage$.pipe(mergeMap(handleMessage));
        case 'queue-fifo':
            return timeoutFilteredStream$.pipe(
                concatMap((packed) => {
                    if (packed.timestamp < (time() - config.requestTimeLimit)) {
                        return throwError(() => ({
                            ...packed.message,
                            error: new Error('Timeout'),
                        }));
                    }
                    return handleMessage(packed.message);
                }));
        default:
            throw new Error(`Unknown concurrency mode [${config.mode}]`);
    }
}

function endResponse(
    res: ServerResponse,
    status?: number,
    contentType?: string,
    message?: string,
) {
    res.writeHead(status, {
        'Content-Type': contentType,
        'Content-Length': message.length,
        'Date': new Date().toUTCString(),
    });

    if (message) {
        res.write(message);
    }

    res.end();
}

async function processRequest(
    request: IncomingMessage,
    response: ServerResponse,
    config: HttpServerConfig,
    logger: Logger,
) {
    logger.write(`Received request [${request.url}]`);
    let redirect = config.redirector.handleRequest(request);
    if (redirect) {
        logger.write(`Redirected to [${redirect}]`);
    }

    let matchingRouteFn = validateRequest(request, response, config.routes, logger);
    if (!matchingRouteFn) {
        return;
    }

    let routeResult = await matchingRouteFn(request);

    let status = routeResult.status ?? 200;
    let contentType = routeResult.contentType ?? contentTypes.plain;
    let message = routeResult.message ?? '';

    endResponse(response, status, contentType, message);
    logger.write(`Completed request HTTP${status} [${request.url}] [${
        message.length} bytes]\n`);
}

function validateRequest(
    req: IncomingMessage,
    res: ServerResponse,
    routes: HttpServerConfig['routes'],
    logger: Logger,
): AsyncCallbackWithRequest<RouteResult> {
    let url = req.url;
    let matchingRouteFn = routes[url];
    if (matchingRouteFn) {
        return matchingRouteFn;
    }

    if (lastItem(url.split('.')).length < url.length) {
        logger.write(`Reading asset file [${url}]`);

        let filename = lastItem(url.split('/'));

        // Read and transmit file in small chunks to use less memory
        let fileDescriptor = open(filename, 'r');
        let chunkSize = 64;
        let buffer = new Uint8Array(chunkSize);
        let offset = 0;
        let done = false;
        while (!done) {
            let bytesRead = read(fileDescriptor,
                buffer, 0, chunkSize, offset);
            res.write(buffer.slice(0, bytesRead));

            offset += bytesRead;
            done = bytesRead < chunkSize;
        }
        let fileSize = offset;

        close(fileDescriptor);

        const ext = lastItem(filename.toLowerCase().split('.'));
        const mimeTypes = {
            '.html': 'application/html',
            '.css': 'application/css',
            '.js': 'application/javascript',
            '.ico': 'image/x-icon',
            '.txt': 'application/plain',
        };
        let status = 200;
        res.writeHead(status, {
            'Content-Type': mimeTypes[ext],
            'Content-Length': fileSize,
            'Date': new Date().toUTCString(),
        });

        res.end();

        return;
    }

    if (url === '/not-found') {
        let status = 404;
        let message = 'Not found';
        endResponse(res, status, contentTypes.plain, message);

        logger.write(`Rejected request HTTP${status} [${url}] [${
            message.length} bytes]\n`);
        return;
    }

    throw new Error(`Unknown route ${url}`);
}

