import axios from 'axios';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { countries_csv } from './config.js';
import { INFO, ERROR, WARNING } from './logs.js';

function toArray(inputString) {
    if (inputString?.length > 0) {
        return inputString.slice(1, -1)
            .split(', ') 
            .map(item => item.trim());
    }

    return undefined;
}

export async function fetchCountriesData() {
    let result = [];
    try {
        const response = await axios.get(countries_csv);
        const data = response.data;
        const countries = await parse(data);

        for (const country of countries) {
            if (country[1] != 'US' && country[1] != 'ID' && Array.isArray(toArray(country[2]))) {
                for (const exception of toArray(country[2])) {
                    result.push({
                        country: country[1],
                        exception: exception,
                    });
                }
            }
        }
    } catch (error) {
        ERROR(`Error fetching or parsing CSV file: ${error.message}`);
    }

    return result;
};
