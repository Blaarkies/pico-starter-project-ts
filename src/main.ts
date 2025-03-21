import { setupLightsWithBooster } from './custom/lights-with-booster';

async function startServer() {
    try {
        await setupLightsWithBooster();
    } catch (error) {
        console.error('Error in main program\n',
            error,
            error.stack,
        );
    }
}

startServer();
