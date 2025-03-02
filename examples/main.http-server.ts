import { PicoCYW43 } from 'pico_cyw43';
import { connectToWifiNetwork } from '../src/communication/wifi';
import {
  makeHttpServer,
} from '../src/communication/http-server/server';
import { contentTypes } from '../src/communication/http-server/types';
import { makeHtmlDocument } from '../src/communication/http-server/boilerplate';
import { readRequestBody } from '../src/communication/http-server/process';

let picoCyw43 = new PicoCYW43();

let setLed = (isOn: boolean) => {
  console.log('LED Status: ', isOn ? 'ON' : 'OFF');
  picoCyw43.putGpio(0, isOn);
};

let ledIsOn = false;

// Wrap this logic in `async` to easily use the JS async syntax
async function containAsyncCode() {
  setLed(ledIsOn);

  /**
   * Create a file called "local-secret.json" in the root directory (next to
   * package.json). This secrets file should contain any keys, password, etc.
   * that you wish to keep secret. The build process will automatically
   * replace these placeholders with the secrets.
   */
  let wifi = connectToWifiNetwork(
    '<<SECRET_WIFI_SSID>>',
    '<<SECRET_WIFI_PASSWORD>>',
    '<<SECRET_WIFI_SECURITY>>',
  );

  makeHttpServer({
    onStartupFn: (baseUrl: string) => {
      console.log(`>> Custom server is up!`);
    },

    // Base url route, typically the frontend/website of this server
    routes: {
      '/': async request => {

        // HTML containing Javascript logic that runs in the client browser.
        // In this server file, it is simply text
        let message = makeHtmlDocument({
          title: 'Pico Controller',
          body: // language=html
`
<div>Pico Controller</div>
<div id="led" class="led"></div>
<button id="toggle">LED Toggle</button>
`,
          style: // language=css
`
body {
  display: grid;
  gap: 10px;
  justify-items: center;
  width: max-content;
  padding: 10px;
}

.led {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 4px solid darkslategray;
  background: gray;

  &.on {
    background: lime;
  }
}
`,
          script: // language=JavaScript
`
let ledElement = document.getElementById('led');
let toggleElement = document.getElementById('toggle');

let latestState = ${ledIsOn};
updateState(latestState);

toggleElement.addEventListener('click', async () => {
  let response = await fetch('api/set-state', {
    method: 'POST',
    body: JSON.stringify({state: !latestState}),
    headers: {'content-type': '${contentTypes.json}'},
  });
  let apiResponse = await response.json();
  console.log('API responded: ', apiResponse);

  updateState(apiResponse);
});

function updateState(newState) {
  latestState = newState;
  if (newState) {
    ledElement.classList.add('on');
  } else {
    ledElement.classList.remove('on');
  }
}
`,
        });

        return {
          message,
          contentType: contentTypes.html,
        };
      },

      '/api/set-state': async request => {
        let newValue;

        try {
          let body: any = await readRequestBody(request);
          newValue = body.state;
        } catch (e) {
          return {status: 400, message: 'Bad input format'};
        }

        if (typeof newValue !== 'boolean') {
          return {
            message: JSON.stringify({error: 'Invalid value'}),
            status: 400,
          };
        }

        ledIsOn = newValue;
        setLed(ledIsOn);

        return {message: JSON.stringify(newValue)};
      },
    },

  });

}

try {
  containAsyncCode();
} catch (e) {
  console.log('\n---------\nFatal Error: \n', e);
}
