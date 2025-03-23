import { setupLightsWithBooster } from './custom/lights-with-booster';

async function startServer() {
    await setupLightsWithBooster();
}

startServer();
