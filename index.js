import { RenewableEnergyPurchases } from '@filecoin-renewable-energy-purchases/js-api';

(async () => {
    const renewableEnergyPurchases = new RenewableEnergyPurchases();

    const allAllocations = await renewableEnergyPurchases.getAllAllocationsFromGithub();
    const allCertificateAllocation = await renewableEnergyPurchases.getAllCertificateAllocationsFromGithub();

    console.log(allCertificateAllocation);

})();
