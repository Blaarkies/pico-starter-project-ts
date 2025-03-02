import { IncomingMessage } from 'http';

export let contentTypes = {
  html: 'text/html; charset=utf-8',
  plain: 'text/plain; charset=utf-8',
  json: 'text/json; charset=utf-8',
};

type ContentType = keyof typeof contentTypes;

interface RouteResult {
  status?: number;
  message?: string;
  contentType?: ContentType;
}

type AsyncCallbackWithRequest<T> =
  (request: InstanceType<typeof IncomingMessage>) => Promise<T>;

export interface HttpServerConfig {
  port?: number;
  onStartupFn?: (baseUrl: string) => void;
  routes?: Record<string, AsyncCallbackWithRequest<RouteResult>>;
}