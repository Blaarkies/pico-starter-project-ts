import { lastItem } from 'common/enumerate';
import {
    AsyncCallbackWithRequest,
    Redirector,
    RouteResult,
} from 'network/http-server/types';
import { exists } from 'fs';
import { IncomingMessage } from 'http';

export class BasicRedirector implements Redirector {

    constructor(private routes: Record<string,
        AsyncCallbackWithRequest<RouteResult>>) {
    }


    handleRequest(request: IncomingMessage): string | undefined {
        let url = request.url;

        let hasValidRoute = this.routes[url];
        if (hasValidRoute) {
            return;
        }

        let redirects: Record<string, string> = {
            '/': '/index.html',
        };

        let assignedRedirect = redirects[url];
        if (assignedRedirect) {
            request.url = assignedRedirect;
            return request.url;
        }

        let isAssetRoute = lastItem(url.split('.')).length < url.length;
        let filename = lastItem(url.split('/'));
        if (isAssetRoute && exists(filename)) {
            return;
        }

        return request.url = '/not-found';
    }

}