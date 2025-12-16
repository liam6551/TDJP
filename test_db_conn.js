
const { Pool } = require('pg');

const candidates = [
    'postgres://postgres:postgres@localhost:5432/tdjp',
    'postgres://postgres:admin@localhost:5432/tdjp',
    'postgres://postgres:123456@localhost:5432/tdjp',
    'postgres://postgres:password@localhost:5432/tdjp',
    'postgres://postgres@localhost:5432/tdjp'
];

(async () => {
    for (const url of candidates) {
        console.log('Trying:', url);
        const pool = new Pool({ connectionString: url });
        try {
            await pool.query('SELECT 1');
            console.log('SUCCESS:', url);
            process.exit(0);
        } catch (e) {
            console.log('Failed:', e.message);
        }
        await pool.end();
    }
    console.log('All failed');
})();
