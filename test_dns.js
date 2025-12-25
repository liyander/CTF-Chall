const dns = require('dns');
const util = require('util');
const dnsLookup = util.promisify(dns.lookup);

async function test() {
    try {
        const result = await dnsLookup('google.com');
        console.log('Type:', typeof result);
        console.log('Result:', result);
        if (typeof result === 'string') {
            console.log('It returns a string (address only).');
        } else {
            console.log('It returns an object.');
        }
    } catch (e) {
        console.error(e);
    }
}

test();
