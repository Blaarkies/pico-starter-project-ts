import { overrideDefaults } from 'common/function';
import {
    createServer,
    IncomingMessage,
    Server,
    ServerResponse,
} from 'http';
import {
    AsyncCallbackWithRequest,
    contentTypes,
    HttpServerConfig,
    RouteResult,
} from './types';

function getServerIp(server: Server): string {
    let ip = (server as any)._dev?.ip;

    if (!ip) {
        console.error(`>> [${now()}}] IP address not available`);
        // throw new Error('IP address not available');
    }

    return ip || '127.0.0.1';
}

function now(): string {
    return new Date().toISOString();
}

export function makeHttpServer(argsConfig?: Partial<HttpServerConfig>) {
    let {port, onStartupFn, routes} = overrideDefaults<HttpServerConfig>({
        port: 80,
        routes: {},
    }, argsConfig);

    let server = createServer(async (req, res) => {
        try {
            await processRequest(req, res, routes);
        } catch (error) {
            let status = 500;
            let message = 'Internal server error';
            console.error(`>> [${now()}] Internal server error ` +
                `HTTP${status} [${req.url}] [${message.length} bytes]\n`);

            endResponse(res, status, contentTypes.plain, message);
        }
    });

    server.listen(port, () => {
        let baseUrl = `http://${getServerIp(server)}:${port}`;
        console.log(`>> [${now()}] Server running at ${baseUrl}\n`);

        onStartupFn?.(baseUrl);
    });
}

function endResponse(
    res: ServerResponse,
    status?: number,
    contentType?: string,
    message?: string,
) {
    // console.log('endResponse with',JSON.stringify(
    //     {status, message, contentType,}, null, 2));

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
    req: IncomingMessage,
    res: ServerResponse,
    routes: HttpServerConfig['routes'],
) {
    console.log(`>> [${now()}] Received request  [${req.url}]`);

    let matchingRouteFn = validateRequest(req, res, routes);
    if (!matchingRouteFn) {
        return;
    }

    let routeResult = await matchingRouteFn(req);

    let status = routeResult.status ?? 200;
    let contentType = routeResult.contentType ?? contentTypes.plain;
    let message = routeResult.message ?? '';

    endResponse(res, status, contentType, message);
    console.log(`>> [${now()}] Completed request `
        + `HTTP${status} [${req.url}] [${message.length} bytes]\n`);
}

function validateRequest(
    req: IncomingMessage,
    res: ServerResponse,
    routes: HttpServerConfig['routes'],
): AsyncCallbackWithRequest<RouteResult> {
    let matchingRouteFn = routes[req.url];
    if (matchingRouteFn) {
        return matchingRouteFn;
    }

    if (req.url === '/favicon.ico') {
        return async () => ({status: 204});
    }

    let status = 404;
    let message = 'Not found';
    endResponse(res, status, contentTypes.plain, message);

    console.log(`>> [${now()}] Rejected request `
        + `HTTP${status} [${req.url}] [${message.length} bytes]\n`);
}

