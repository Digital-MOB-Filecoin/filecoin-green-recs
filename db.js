import { Database } from './config.js';
import { INFO, ERROR, WARNING } from './logs.js';
import pkg from 'pg';

const { Pool, types } = pkg;

// Type parser to use for timestamp without time zone
// This will keep node-pg from parsing the value into a Date object and give you the raw timestamp string instead.
types.setTypeParser(1114, function (stringValue) {
    return stringValue;
})

function FormatNull(t) {
    if (JSON.stringify(t) == 'null') {
        return t;
    } else {
        return '\'' + t + '\'';
    }
}

function FormatText(t) {
    if (!t) {
        return;
    }

    return t.replace(/'/g, "''");
}

export class DB {

    constructor() {
        this.pool = new Pool(config.database);
    }

    async Query(query, log) {
        let result = undefined;
        try {
            result = await this.pool.query(query);
        } catch (err) {
            WARNING(`[${log}] ${query} -> ${err}`)
        }

        return result;
    }

    async save_renewable_energy_from_contracts(contract) {
        let id = contract.id;
        let miner = contract.miner_id;
        let totalEnergy = contract.openVolume;

        let start = contract.reportingStart;
        let date1 = new Date(contract.reportingStart);
        let date2 = new Date('2020-08-25');

        if (date1 < date2) {
            console.log('save_renewable_energy_from_contracts reportingStart', contract.reportingStart);
            start = '2020-08-25';
        }

        let query = await this.Query(`SELECT t.date::text FROM generate_series(timestamp '${contract.reportingStart}', timestamp '${contract.reportingEnd}', interval  '1 day') AS t(date);`);
        let data_points = query?.rows;
        let country = FormatNull(contract.countryRegionMap[0]?.country);

        //INFO(`[SaveRenewableEnergyFromContracts] for ${miner} contract.id: ${id} , openVolume: ${totalEnergy}`);

        if (data_points && data_points?.length) {
            for (let i = 0; i < data_points.length; i++) {
                let processed_date = data_points[i].date?.split(' ')[0];
                let data = {
                    miner: miner,
                    contract_id: id,
                    energyWh: totalEnergy / data_points.length,
                    date: processed_date,
                    country: country,
                };

                try {
                    let values = `'${data.miner}', \
                    '${data.contract_id}', \
                    '${data.date}',\
                    '${data.energyWh}',\
                     ${data.country}`;

                    await this.Query(`
            UPDATE fil_renewable_energy_from_contracts SET 
                            energyWh='${data.energyWh}'\
                WHERE miner='${data.miner}' AND contract_id='${data.contract_id}' AND date='${data.date}' AND country=${data.country}; \
            INSERT INTO fil_renewable_energy_from_contracts ( \
                miner, \
                contract_id, \
                date, \
                energyWh, \
                country \
                ) \
                SELECT ${values} WHERE NOT EXISTS (SELECT 1 FROM fil_renewable_energy_from_contracts WHERE miner='${data.miner}' AND contract_id='${data.contract_id}' AND date='${data.date}'  AND country=${data.country});`,
                        'SaveRenewableEnergyFromContracts');

                } catch (err) {
                    WARNING(`[SaveRenewableEnergyFromContracts] -> ${err}`)
                }

            }
        }
    }

    async save_renewable_energy_from_transactions(transaction) {
        let id = transaction.id;
        let miner = transaction.miner_id;
        let totalEnergy = transaction.recsSoldWh;

        let start = transaction.generation.generationStart;
        let date1 = new Date(transaction.generation.generationStart);
        let date2 = new Date('2020-08-25');

        if (date1 < date2) {
            console.log('save_renewable_energy_from_transactions generationStart', transaction.generation.generationStart);
            start = '2020-08-25';
        }

        let query = await this.Query(`SELECT t.date::text FROM generate_series(timestamp '${start}', timestamp '${transaction.generation.generationEnd}', interval  '1 day') AS t(date);`);
        let data_points = query?.rows;
        let country = FormatNull(transaction.generation.country);

        if (data_points && data_points?.length) {

            for (let i = 0; i < data_points.length; i++) {
                let processed_date = data_points[i].date?.split(' ')[0];
                let data = {
                    miner: miner,
                    transaction_id: id,
                    energyWh: totalEnergy / data_points.length,
                    date: processed_date,
                    country: country,
                };

                try {
                    let values = `'${data.miner}', \
                    '${data.transaction_id}', \
                    '${data.date}',\
                    '${data.energyWh}',\
                     ${data.country}`;

                    await this.Query(`
            UPDATE fil_renewable_energy_from_transactions SET 
                            energyWh='${data.energyWh}'\
                WHERE miner='${data.miner}' AND transaction_id='${data.transaction_id}' AND date='${data.date}' AND country=${data.country}; \
            INSERT INTO fil_renewable_energy_from_transactions ( \
                miner, \
                transaction_id, \
                date, \
                energyWh, \
                country \
                ) \
                SELECT ${values} WHERE NOT EXISTS (SELECT 1 FROM fil_renewable_energy_from_transactions WHERE miner='${data.miner}' AND transaction_id='${data.transaction_id}' AND date='${data.date}' AND country=${data.country});`,
                        'SaveRenewableEnergyFromTransactions');

                } catch (err) {
                    WARNING(`[SaveRenewableEnergyFromTransactions] -> ${err}`)
                }

            }
        }
    }

    async refresh_renewable_energy_views() {
        try {
            await this.Query("REFRESH MATERIALIZED VIEW CONCURRENTLY fil_renewable_energy_from_transactions_view_v4 WITH DATA;");
            await this.Query("REFRESH MATERIALIZED VIEW CONCURRENTLY fil_renewable_energy_from_contracts_view_v4 WITH DATA;");
            await this.Query("REFRESH MATERIALIZED VIEW CONCURRENTLY fil_renewable_energy_view_v4 WITH DATA;");
        } catch (err) {
            WARNING(`[RefreshRenewableEnergyMatViews] ${err}`)
        }
    }

}

