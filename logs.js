
import timestamp from 'time-stamp';

export function INFO(msg) {
    console.log(timestamp.utc('YYYY/MM/DD-HH:mm:ss:ms'), '\x1b[32m', '[ INFO ] ', '\x1b[0m', msg);
}

export function ERROR(msg) {
    console.log(timestamp.utc('YYYY/MM/DD-HH:mm:ss:ms'), '\x1b[31m', '[ ERROR ] ', '\x1b[0m', msg);
}

export function WARNING(msg) {
    console.log(timestamp.utc('YYYY/MM/DD-HH:mm:ss:ms'), '\x1b[33m', '[ WARNING ] ', '\x1b[0m', msg);
}
