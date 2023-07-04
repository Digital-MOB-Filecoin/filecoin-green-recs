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
        this.pool = new Pool(Database);
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

    async save_renewable_energy(data) {
        let id = data.allocation_cid;
        let miner = data.minerID; // ?????
        let totalEnergy = data.allocation_volume_MWh * 1000; //MWh

        let start = data.reportingStart;
        let date1 = new Date(data.reportingStart);
        let date2 = new Date('2020-08-25');

        if (date1 < date2) {
            start = '2020-08-25';
        }

        let query = await this.Query(`SELECT t.date::text FROM generate_series(timestamp '${data.reportingStart}', timestamp '${data.reportingEnd}', interval  '1 day') AS t(date);`);
        let data_points = query?.rows;
        let country = FormatNull(data.country);

        if (data_points && data_points?.length) {
            for (let i = 0; i < data_points.length; i++) {
                let processed_date = data_points[i].date?.split(' ')[0];
                let data = {
                    miner: miner,
                    allocation_cid: id,
                    energyWh: totalEnergy / data_points.length,
                    date: processed_date,
                    country: country,
                };

                try {
                    let values = `'${data.miner}', \
                    '${data.allocation_cid}', \
                    '${data.date}',\
                    '${data.energyWh}',\
                     ${data.country}`;

                    await this.Query(`
            UPDATE fil_renewable_energy SET 
                            energyWh='${data.energyWh}'\
                WHERE miner='${data.miner}' AND allocation_cid='${data.allocation_cid}' AND date='${data.date}' AND country=${data.country}; \
            INSERT INTO fil_renewable_energy ( \
                miner, \
                allocation_cid, \
                date, \
                energyWh, \
                country \
                ) \
                SELECT ${values} WHERE NOT EXISTS (SELECT 1 FROM fil_renewable_energy WHERE miner='${data.miner}' AND allocation_cid='${data.allocation_cid}' AND date='${data.date}'  AND country=${data.country});`,
                        'SaveRenewableEnergy');

                } catch (err) {
                    WARNING(`[SaveRenewableEnergy] -> ${err}`)
                }

            }
        }
    }

    async refresh_renewable_energy_view() {
        try {
            await this.Query("REFRESH MATERIALIZED VIEW CONCURRENTLY fil_renewable_energy_view_v5 WITH DATA;");
        } catch (err) {
            WARNING(`[RefreshRenewableEnergyMatViews] ${err}`)
        }
    }

}

