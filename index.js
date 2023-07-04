import { RenewableEnergyPurchases } from '@filecoin-renewable-energy-purchases/js-api';
import { INFO, ERROR, WARNING } from './logs.js';
import { DB } from './db.js';

let db = new DB();
let stop = false;

async function run() {
    const renewableEnergyPurchases = new RenewableEnergyPurchases();

    const allAllocations = await renewableEnergyPurchases.getAllAllocationsFromGithub();
    const allCertificateAllocation = await renewableEnergyPurchases.getAllCertificateAllocationsFromGithub();

    let count = 0;
    for (const data of allAllocations) {
        count++;
        INFO(`Update RenewableEnergyPurchases [${count}/${allAllocations.length}]`);
        await db.save_renewable_energy(data);
    }

    await db.refresh_renewable_energy_view();
};

const pause = (timeout) => new Promise(res => setTimeout(res, timeout * 1000));

const mainLoop = async _ => {
    try {
        while (!stop) {
            await run();

            INFO(`Pause for 24 hours`);
            await pause(24 * 3600);
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