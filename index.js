import { RenewableEnergyPurchases } from '@filecoin-renewable-energy-purchases/js-api';
import { INFO, ERROR, WARNING } from './logs.js';
import { DB } from './db.js';

let stop = false;

async function run() {
    const renewableEnergyPurchases = new RenewableEnergyPurchases();

    const allAllocations = await renewableEnergyPurchases.getAllAllocationsFromGithub();
    const allCertificateAllocation = await renewableEnergyPurchases.getAllCertificateAllocationsFromGithub();

    console.log(allCertificateAllocation);
};

const pause = (timeout) => new Promise(res => setTimeout(res, timeout * 1000));

const mainLoop = async _ => {
    try {
        while (!stop) {
            await run();

            INFO(`Pause for 60 seconds`);
            await pause(60);
        }

    } catch (error) {
        ERROR(`[MainLoop] error :`);
        console.error(error);
        ERROR(`Shutting down`);
        process.exit(1);
    }

}

mainLoop();

function shutdown(exitCode = 0) {
    stop = true;
    setTimeout(() => {
        INFO(`Shutdown`);
        process.exit(exitCode);
    }, 3000);
}
//listen for TERM signal .e.g. kill
process.on('SIGTERM', shutdown);
// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', shutdown);