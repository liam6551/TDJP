import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { config } from 'dotenv';
const envPath = path.join(__dirname, '.env');
console.log('[DB] Loading .env from:', envPath);
config({ path: envPath });
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;
console.log('[DB] DATABASE_URL present:', !!connectionString);

if (!connectionString) {
    console.error('❌ DATABASE_URL is missing');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

try {
    console.log('DB host:', new URL(connectionString).hostname);
} catch { }

export default pool;
