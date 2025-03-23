import { waitForDuration } from 'common/time';
import { setupLightsWithBooster } from './custom/lights-with-booster';

async function startServer() {
    console.log('waiting');
    await waitForDuration(5e3);
    console.log('aaand GO!');

    try {
        await setupLightsWithBooster();
    } catch (error) {
        console.error('Error in main program\n',
            error,
            error.message,
            error.stack,
        );
    }
}

startServer();
