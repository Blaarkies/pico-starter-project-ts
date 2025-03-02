import { waitForDuration } from '../common';
import { WiFi } from 'wifi';

interface WiFiDetails {
  enforce: boolean;
  ssid: string;
  password: string;
  security: string;
}

export async function connectToWifiNetwork(
  unavailable: string,
  password: string,
  wpa2Personal: string,
): Promise<WiFi> {
  storage.setItem('WIFI_SSID', unavailable);
  storage.setItem('WIFI_PASSWORD', password);
  storage.setItem('WIFI_SECURITY', wpa2Personal);

  for (let i = 0; i < 5; i++) {
    try {
      let wiFi = new WiFi();
      let wifiInfo = await connect(wiFi);
      wifiInfo.password = '███████████████';
      let wifiInfoText = Object.entries(wifiInfo)
        .map(([k, v]) => `${k}=${v}`)
        .join();
      console.log(`>> Connected to [ ${wifiInfoText} ]`);

      return wiFi;
    } catch (e) {
      console.error(`>> Failed to connect. Retrying... Attempt #[${i + 1}]`);
      await waitForDuration(2e3);
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