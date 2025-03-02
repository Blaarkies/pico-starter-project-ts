import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { contentTypes, HttpServerConfig } from './types';
import { overrideDefaults } from '../../common/function';

function getServerIp(server: Server): string {
  let ip = (server as any)._dev?.ip;

  if (!ip) {
    console.error('IP address not available');
    // throw new Error('IP address not available');
  }

  return ip || '127.0.0.1';
}

export function makeHttpServer(argsConfig?: Partial<HttpServerConfig>) {
  let {port, onStartupFn, routes} = overrideDefaults<HttpServerConfig>({
    port: 80,
    onStartupFn: () => {},
    routes: {},
  }, argsConfig);

  let server = createServer(async (req, res) => {
    try {
      await processRequest(req, res, routes);
    } catch (error) {
      let status = 500;
      let message = 'Internal server error';
      console.error(`>> Internal server error ` +
        `HTTP${status} [${req.url}] [${message.length} bytes]\n`);

      endResponse(res, status, contentTypes.plain, message);
    }
  });

  server.listen(port, () => {
    let baseUrl = `http://${getServerIp(server)}:${port}`;
    console.log(`>> Server running at ${baseUrl}\n`,
      `    or locally at http://127.0.0.1:${port}`);

    onStartupFn(baseUrl);
  });
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
  res.end(message);
}

async function processRequest(
  req: IncomingMessage,
  res: ServerResponse,
  routes: HttpServerConfig['routes'],
) {
  let now = new Date().toISOString();
  console.log(`>> [${now}] Received request  [${req.url}]`);

  let matchingRouteFn = validateRequest(req, res, routes);
  if (!matchingRouteFn) {
    return;
  }

  let routeResult = await matchingRouteFn(req);

  let status = routeResult.status ?? 200;
  let contentType = routeResult.contentType ?? contentTypes.plain;
  let message = routeResult.message ?? '';

  endResponse(res, status, contentType, message);
  console.log(`>> Completed request HTTP${
    status} [${req.url}] [${message.length} bytes]\n`);
}

function validateRequest(
  req: IncomingMessage,
  res: ServerResponse,
  routes: HttpServerConfig['routes'],
) {
  let matchingRouteFn = routes[req.url];

  if (matchingRouteFn) {
    return matchingRouteFn;
  }

  if (req.url === '/favicon.ico') {
    endResponse(res, 204, contentTypes.plain, '');
    return;
  }

  let status = 404;
  let message = 'Not found';
  endResponse(res, status, contentTypes.plain, message);

  console.log(`>> Rejected request  HTTP${
    status} [${req.url}] [${message.length} bytes]\n`);

  return;

}

