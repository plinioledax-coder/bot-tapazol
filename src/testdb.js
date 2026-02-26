require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

console.log('⏳ Testando conexão direta com o Supabase...');

pool.query('SELECT NOW()')
    .then(res => {
        console.log('✅ Banco conectado perfeitamente!', res.rows[0]);
        console.log('Se isso apareceu, o problema é na biblioteca do WhatsApp.');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ O erro REAL do banco é:', err);
        process.exit(1);
    });