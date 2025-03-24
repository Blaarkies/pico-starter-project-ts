import {
    promiseWithResolvers,
    Promisified,
    promisify,
} from 'common/async';
import { waitForDuration } from 'common/time';
import { WiFi } from 'wifi';

interface WiFiDetails {
    enforce: boolean;
    ssid: string;
    password: string;
    security: string;
}

function saveDetails(ssid?: string, password?: string, security?: string) {
    if (ssid) {
        storage.setItem('WIFI_SSID', ssid);
    }
    if (password) {
        storage.setItem('WIFI_PASSWORD', password);
    }
    if (security) {
        storage.setItem('WIFI_SECURITY', security);
    }
}

async function requestConnection(wiFi: WiFi): Promise<WiFiDetails | null> {
    let onceFn = promisify(
        wiFi.once.bind(wiFi)) as Promisified<typeof wiFi.once>;
    let listenPromise = onceFn('connected');
    let connectFn = promisify<WiFiDetails>(wiFi.connect.bind(wiFi));
    let details = connectFn();

    let timout = promiseWithResolvers();
    let timeoutId = setInterval(
        () => timout.reject('Timed out waiting for connection'),
        5e3); // wifi connect is a slow synchronous fn
    let stopTimeout = () => clearTimeout(timeoutId);

    return Promise.race([
        listenPromise,
        timout.promise,
    ])
        .then(() => {
            stopTimeout();
            return details;
        });
}

async function requestDisconnect(wiFi: WiFi) {
    let disconnectFn = promisify(wiFi.disconnect.bind(wiFi));
    return await disconnectFn().catch(err => undefined);
}

/**
 * Attempts to connect to the local WiFi connection with the provided
 * credentials, which are saved into JS local storage. If no credentials were
 * provided, it will still attempt to use the credentials from local storage.
 * When a connection attempt fails, it will retry to connect up to 3 times<br/>
 * @faq
 * - A successful connection is not always guaranteed. An HTTP server may be
 * able to start, but then silently fail to pickup incoming requests.
 * Cause unknown.
 */
export async function connectToWifiNetwork(
    ssid?: string,
    password?: string,
    security?: string,
): Promise<WiFiDetails> {
    console.log('>> Connecting to WiFi');

    saveDetails(ssid, password, security);

    let wiFi = new WiFi();

    let retryLimit = 3;
    for (let i = 1; i < retryLimit + 1; i++) {
        let error = '';
        let wiFiDetails = await requestConnection(wiFi)
            .catch(err => error = err);

        if (wiFiDetails && !error) {
            let safeWifiInfo = Object.assign({}, wiFiDetails,
                {password: '█'.repeat(8)});
            let wifiInfoText = Object.entries(safeWifiInfo)
                .map(([k, v]) => `${k}=${v}`)
                .join('\n\t');
            console.log(`>> Connected to WiFi network\n\t${wifiInfoText}\n`);

            return wiFiDetails;
        } else {
            console.log(
                `█> Failed to connect to WiFi` +
                `\n   -Reason: ${error}` +
                `\n   --Retrying, this is attempt #${i + 1}`);

            await requestDisconnect(wiFi);

            await waitForDuration(1e3);
        }
    }

    throw new Error(
        `█> Could not connect to WiFi after ${retryLimit} attempts`);
}
