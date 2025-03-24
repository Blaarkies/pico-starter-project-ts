import { promiseWithResolvers } from 'common/async';
import { lastItem } from 'common/enumerate';
import { overrideDefaults } from 'common/function';
import { stat } from 'fs';
import {
    createServer,
    IncomingMessage,
    Server,
    ServerResponse,
} from 'http';
import { FileReadStream } from 'network/http-server/file-read-stream';
import { TaskRegulator } from 'network/http-server/task-regulator';
import {
    HttpMethod,
    Logger,
    mimeTypes,
    RouteHandler,
    ServerConfig,
} from 'network/http-server/types';
import {
    join,
    normalize,
    resolve,
} from 'path';

/**
 * A micro web server<br/>
 * Creates a simple http server to act as a website host and API. Supports
 * redirects, GET, POST, concurrency, and serves website files when no route
 * was matched.
 *
 * @example
 * new MuWebServer({assetsPath: 'assets'})
 *     .redirect('/', '/index.html')
 *     .get('/logs.txt', (req, res) => {
 *         // code to read and serve the file
 *         res.end();
 *     })
 *     .get('/api/data', (req, res) => {
 *         res.end('Any data requested');
 *     })
 *     .post('/api/submit', (req, res) => {
 *         const body = (req as any).body;
 *         // code to use the supplied data
 *         res.end(JSON.stringify({ status: 'success' }));
 *     })
 *     .start();
 *
 * @faq
 * - Connect to Wi-Fi before starting server
 * - Use `npm run deploy-assets` to copy web server asset files onto the Pico.
 * The assets directory must match `assetsPath`
 * - Query parameters on endpoints are not yet supported, the url matching may
 * fail
 * - POST requests do not support octet-stream data. It will attempt to decode
 * the data stream into utf8 text
 */
export class MuWebServer {

    private routes: Map<string, Map<HttpMethod, RouteHandler>> = new Map();
    private port: number;
    private assetsDir: string;
    private logger: Logger;
    private queue: TaskRegulator;
    private redirectsMap = new Map<string, string>();

    constructor(argsConfig?: ServerConfig) {
        let config = overrideDefaults<ServerConfig>({
            port: 80,
            assetsPath: '',
            logger: <Logger>{
                log: (message, severity) => console.log(
                    `[${(severity ?? 'info').padEnd(5)}] ${message}`),
            },
            concurrency: 1,
            // requestTimeLimit: 5e3,
        }, argsConfig);

        this.port = config.port;
        this.assetsDir = resolve(config.assetsPath);
        this.logger = config.logger;

        this.queue = new TaskRegulator(config.concurrency);
        this.queue.on('error', (e: Error) =>
            this.logger.log(`Request failed: ${e?.message}`, 'error'));
        this.queue.on('processed', () =>
            this.logger.log(`Processed request`, 'info'));
    }

    /** Add a redirect entry to transfer request to a new url */
    redirect(path: string, redirected: string): this {
        this.redirectsMap.set(path, redirected);
        return this;
    }

    /** Add multiple redirect entries
     * @see redirect */
    redirects(pairs: [string, string]): this {
        pairs.forEach(([path, redirected]) =>
            this.redirectsMap.set(path, redirected));
        return this;
    }

    /** Add a GET method endpoint matching the request url to `path` */
    get(path: string, handler: RouteHandler): this {
        this.addRoute('GET', path, handler);
        return this;
    }

    /** Add a POST method endpoint matching the request url to `path` */
    post(path: string, handler: RouteHandler): this {
        this.addRoute('POST', path, handler);
        return this;
    }

    /** Creates the HTTP server with the current configuration */
    start(callback?: (error?: Error) => void): this {
        try {
            let server = createServer((req, res) =>
                this.queue.add(() => this.handleRequest(req, res)));

            server.listen(this.port, () => {
                let message = `Server running on http://`
                    + `${this.getServerIp(server)}:${this.port}`;
                this.logger.log(message, 'info');
                callback?.();
            }).on('error', (e) => {
                this.logger.log(`Server failed to start: ${e?.message}`, 'error');
                callback?.(e);
            });
        } catch (e) {
            console.error(e, e?.message, e.stack);
        }

        return this;
    }

    /** Attempts to find the server's IP address. Fallback to 127.0.0.1 */
    private getServerIp(server: Server): string {
        let ip = (server as any)._dev?.ip;

        if (!ip) {
            this.logger.log(`IP address not available`);
            // throw new Error('IP address not available');
        }

        return ip || '127.0.0.1';
    }

    /** Add an endpoint's callback to the routes map */
    private addRoute(method: HttpMethod, path: string, handler: RouteHandler) {
        let normalizedPath = path.endsWith('/')
                             ? path.slice(0, -1)
                             : path;
        if (!this.routes.has(normalizedPath)) {
            this.routes.set(normalizedPath, new Map());
        }
        this.routes.get(normalizedPath)?.set(method, handler);
    }

    /** Recursively resolves redirect entries and returns the final path.
     * Stops when `depth` recursions has been made */
    private getRedirectedPath(path: string, depth = 10): string {
        if (!depth) {
            this.logger.log(
                `Max redirect depth exceeded for path ${path}`,
                'error');
            return path;
        }

        let redirect = this.redirectsMap.get(path);
        if (redirect) {
            return this.getRedirectedPath(redirect, --depth);
        }

        return path;
    }

    /** Primary server request entry point. Determines how and where to send
     * each request */
    private async handleRequest(req: IncomingMessage, res: ServerResponse) {
        // TODO: check for 'pathname' and ignore query string
        let pathname = req.url?.replace(/\/$/, '') || '/';
        pathname = this.getRedirectedPath(pathname);

        let method = req.method as HttpMethod;

        try {
            let routeHandler = this.routes.get(pathname)?.get(method);
            this.logger.log(`${method} ${pathname}`, 'info');
            if (routeHandler) {
                if (method === 'POST') {
                    await this.parseBody(req, res);
                }
                await routeHandler(req, res);
                return;
            }

            await this.serveStatic(req, res, pathname);
        } catch (e) {
            this.handleError(res, 500, 'Internal server error');
            this.logger.log(`Could not process request: ${e}`, 'error');
        }
    }

    /** Reads the data chunks from POST requests and writes it as a utf8 string
     * or JS object */
    private async parseBody(req: IncomingMessage, res: ServerResponse) {
        let {promise, resolve, reject} = promiseWithResolvers();

        let body = [];
        req.on('data', chunk => body.push(...chunk))
            .on('end', () => {
                let isJson = req.headers['content-type']
                    ?.includes('application/json');

                let bodyString = body
                    .map(n => String.fromCharCode(n))
                    .join('');

                try {
                    (req as any).body = isJson
                                        ? JSON.parse(bodyString)
                                        : bodyString;
                    resolve();
                } catch (e) {
                    this.handleError(res, 400, isJson
                                               ? 'Invalid JSON'
                                               : 'Invalid data format');
                }
            })
            .on('error', reject);
        return promise;
    }

    /** Verifies that a file path is valid */
    private getSafePath(requestedPath: string): string {
        let normalized = normalize(join(this.assetsDir, requestedPath));
        if (!normalized.startsWith(this.assetsDir)) {
            return join(this.assetsDir, '404.html');
        }
        return normalized;
    }

    /** Returns the mime type given a file name with extension */
    private getMimeType(filePath: string): string {
        let extension = lastItem(filePath.split('.')).toLowerCase();
        return mimeTypes[extension] || 'application/octet-stream';
    }

    /** Reads a file from the local file system and sends it back as response */
    private async serveStatic(
        req: IncomingMessage,
        res: ServerResponse,
        pathname: string,
    ) {
        let mainPromise = promiseWithResolvers();
        let filePath = this.getSafePath(pathname);

        let stats = stat(filePath);
        if (!stats.isFile()) {
            this.logger.log(`404 Not Found: ${pathname}`, 'warn');
            this.handleError(res, 404, 'Not found');
            mainPromise.resolve();
            return mainPromise.promise;
        }

        try {
            let contentType = this.getMimeType(filePath);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', stats.size);

            let streamPromise = promiseWithResolvers();

            let onErrorFileRead = (e: Error) => {
                this.logger.log(`File stream error: ${e?.message}`,
                    'error');
                this.handleError(res, 500, 'Internal server error');
                streamPromise.resolve();
            };

            new FileReadStream(filePath)
                .on('error', e => onErrorFileRead(e))
                .on('close', () => {
                    this.logger.log(`200 ${pathname}`);
                    streamPromise.resolve();
                })
                .pipe(res)
                .on('error', e => onErrorFileRead(e));

            await streamPromise.promise;
        } finally {
            mainPromise.resolve();
        }

        return mainPromise.promise;
    }

    /** Sets error code, status, and ends the response */
    private handleError(res: ServerResponse, status: number, message: string) {
        res.statusCode = status;
        res.end(JSON.stringify({error: message}));
        this.logger.log(`${res.statusCode} ${message}`);
    }
}
