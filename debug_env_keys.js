
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, 'backend', '.env');
console.log('Reading:', envPath);

try {
    const buf = fs.readFileSync(envPath);
    const config = dotenv.parse(buf);
    console.log('Keys found:', Object.keys(config));
} catch (e) {
    console.error('Error reading .env:', e.message);
}
