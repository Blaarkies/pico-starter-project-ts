import { WiFi } from 'wifi';
import { waitForDuration } from 'common/time';

interface WiFiDetails {
    enforce: boolean;
    ssid: string;
    password: string;
    security: string;
}

export async function connectToWifiNetwork(
    ssid: string,
    password: string,
    security: string,
): Promise<WiFi> {
    storage.setItem('WIFI_SSID', ssid);
    storage.setItem('WIFI_PASSWORD', password);
    storage.setItem('WIFI_SECURITY', security);

    let retryLimit = 5;
    for (let i = 1; i < retryLimit + 1; i++) {
        let wiFi = new WiFi();
        let isConnected = await connect(wiFi)
            .then(wifiInfo => {
                wifiInfo.password = '███████████████';
                let wifiInfoText = Object.entries(wifiInfo)
                    .map(([k, v]) => `${k}=${v}`)
                    .join('\n\t');
                console.log(`>> Connected to WiFi network\n\t${wifiInfoText}\n`);

                return waitForDuration(1e3).then(() => true);
            })
            .catch(async (err) => {
                console.error(`>> Failed to connect. Retrying...\n`
                    + `\tAttempt #[${i}] of ${retryLimit}`, err);
                await waitForDuration(2e3);
                return false;
            });

        if (isConnected) {
            return wiFi;
        }
    }
}

async function connect(wifi): Promise<WiFiDetails> {
    return new Promise((resolve, reject) => {
        try {
            wifi.connect((err, connectInfo) =>
                err
                ? reject(err)
                : resolve(connectInfo));
        } catch (e) {
            reject(e);
        }
    });
}

async function networkInfo(wifi) {
    return new Promise((resolve, reject) =>
        // {"ssid":string,"bssid":string}
        wifi.getConnection((error, connectionInfo) =>
            error
            ? reject(error)
            : resolve(connectionInfo)),
    );
}