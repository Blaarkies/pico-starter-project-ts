import { waitForDuration } from 'common/time';
import { setupLightsWithBooster } from './custom/lights-with-booster';

async function startServer() {
    console.log('wait');
    await waitForDuration(2e3);
    console.log('start');
    await setupLightsWithBooster();
}

startServer();

